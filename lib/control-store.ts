import 'server-only';

import { randomUUID } from 'crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type {
  ControlAgent,
  ControlState,
  WorkflowRun,
  WorkflowTemplate,
} from './control-types';

const STATE_PATH = path.join(process.cwd(), 'logs', 'control-state.json');

const DEFAULT_STATE: ControlState = {
  agents: [
    {
      id: 'catalyst',
      name: 'Catalyst',
      role: 'Concept Generation',
      description: 'Creates raw campaign concepts for Instagram Reels.',
      mode: 'active',
      status: 'idle',
    },
    {
      id: 'playwright',
      name: 'Maven',
      role: 'Script Author',
      description: 'Transforms concepts into structured scripts & shot lists.',
      mode: 'active',
      status: 'idle',
    },
    {
      id: 'tags',
      name: 'Echo',
      role: 'Captions & Tags',
      description: 'Optimizes captions, CTAs, and hashtags.',
      mode: 'active',
      status: 'idle',
    },
    {
      id: 'guardian',
      name: 'Guardian',
      role: 'Compliance',
      description: 'Runs final QC + regulatory enforcement.',
      mode: 'active',
      status: 'idle',
    },
  ],
  templates: [
    {
      id: 'ig-reels',
      name: 'Instagram Reels Launch',
      description: 'Full creative pipeline for a Viking Labs Reels drop.',
      steps: [
        { id: 'step-catalyst', label: 'Concept Brief', agentId: 'catalyst', estimateMinutes: 5 },
        { id: 'step-playwright', label: 'Script + Shot List', agentId: 'playwright', estimateMinutes: 12 },
        { id: 'step-tags', label: 'Caption & CTA', agentId: 'tags', estimateMinutes: 4 },
        { id: 'step-guardian', label: 'Compliance Review', agentId: 'guardian', estimateMinutes: 6 },
      ],
    },
    {
      id: 'email-drip',
      name: 'Email Drip Refresh',
      description: 'Rebuilds research email series with compliance checkpoints.',
      steps: [
        { id: 'step-catalyst-email', label: 'Angle Ideation', agentId: 'catalyst', estimateMinutes: 6 },
        { id: 'step-playwright-email', label: 'Copy Drafts', agentId: 'playwright', estimateMinutes: 15 },
        { id: 'step-guardian-email', label: 'Regulatory QC', agentId: 'guardian', estimateMinutes: 8 },
      ],
    },
  ],
  runs: [],
};

async function ensureStateFile(): Promise<void> {
  try {
    await fs.access(STATE_PATH);
  } catch {
    await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
    await fs.writeFile(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
  }
}

export async function readControlState(): Promise<ControlState> {
  await ensureStateFile();
  const raw = await fs.readFile(STATE_PATH, 'utf8');
  try {
    const parsed = JSON.parse(raw) as ControlState;
    return parsed;
  } catch {
    await fs.writeFile(STATE_PATH, JSON.stringify(DEFAULT_STATE, null, 2), 'utf8');
    return DEFAULT_STATE;
  }
}

export async function writeControlState(state: ControlState): Promise<void> {
  await fs.mkdir(path.dirname(STATE_PATH), { recursive: true });
  await fs.writeFile(STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function occupyAgent(state: ControlState, agentId: string, workflowId: string) {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return;
  agent.status = 'busy';
  agent.currentWorkflowId = workflowId;
}

function releaseAgent(state: ControlState, agentId: string) {
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) return;
  agent.status = 'idle';
  agent.currentWorkflowId = undefined;
  agent.lastCompletedAt = new Date().toISOString();
}

function currentAgentId(state: ControlState, run: WorkflowRun): string | undefined {
  const template = state.templates.find((t) => t.id === run.templateId);
  if (!template) return undefined;
  const step = template.steps[run.currentStepIndex];
  return step?.agentId;
}

export async function startWorkflow(templateId: string, label?: string, owner?: string) {
  const state = await readControlState();
  const template = state.templates.find((t) => t.id === templateId);
  if (!template) {
    throw new Error('Template not found');
  }

  const now = new Date().toISOString();
  const run: WorkflowRun = {
    id: randomUUID(),
    templateId,
    label: label || `${template.name} · ${new Date().toLocaleTimeString('en-US')}`,
    owner: owner || 'Alex',
    status: 'running',
    createdAt: now,
    currentStepIndex: 0,
    history: [{ message: 'Workflow created', timestamp: now }],
  };

  state.runs.unshift(run);

  const firstAgent = template.steps[0]?.agentId;
  if (firstAgent) {
    occupyAgent(state, firstAgent, run.id);
  }

  await writeControlState(state);
  return state;
}

export async function advanceWorkflow(runId: string) {
  const state = await readControlState();
  const run = state.runs.find((r) => r.id === runId);
  if (!run) throw new Error('Workflow not found');
  const template = state.templates.find((t) => t.id === run.templateId);
  if (!template) throw new Error('Template missing');

  const currentStep = template.steps[run.currentStepIndex];
  if (currentStep) {
    releaseAgent(state, currentStep.agentId);
  }

  const nextIndex = run.currentStepIndex + 1;
  if (nextIndex >= template.steps.length) {
    run.status = 'completed';
    run.currentStepIndex = template.steps.length - 1;
    run.history.unshift({ message: 'Workflow completed', timestamp: new Date().toISOString() });
  } else {
    run.currentStepIndex = nextIndex;
    run.status = 'running';
    const nextAgent = template.steps[nextIndex];
    if (nextAgent) {
      occupyAgent(state, nextAgent.agentId, run.id);
      run.history.unshift({
        message: `Advanced to ${nextAgent.label}`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  await writeControlState(state);
  return state;
}

export async function pauseAgent(agentId: string) {
  const state = await readControlState();
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) throw new Error('Agent not found');
  agent.mode = 'paused';
  if (agent.currentWorkflowId) {
    const run = state.runs.find((r) => r.id === agent.currentWorkflowId);
    if (run) {
      run.status = 'paused';
      run.history.unshift({ message: `${agent.name} paused`, timestamp: new Date().toISOString() });
    }
  }
  await writeControlState(state);
  return state;
}

export async function resumeAgent(agentId: string) {
  const state = await readControlState();
  const agent = state.agents.find((a) => a.id === agentId);
  if (!agent) throw new Error('Agent not found');
  agent.mode = 'active';
  if (agent.currentWorkflowId) {
    const run = state.runs.find((r) => r.id === agent.currentWorkflowId);
    if (run && run.status === 'paused') {
      run.status = 'running';
      run.history.unshift({
        message: `${agent.name} resumed`,
        timestamp: new Date().toISOString(),
      });
    }
  }
  await writeControlState(state);
  return state;
}

export async function cancelWorkflow(runId: string) {
  const state = await readControlState();
  const index = state.runs.findIndex((r) => r.id === runId);
  if (index === -1) return state;
  const run = state.runs[index];
  const agentId = currentAgentId(state, run);
  if (agentId) {
    releaseAgent(state, agentId);
  }
  state.runs.splice(index, 1);
  await writeControlState(state);
  return state;
}
