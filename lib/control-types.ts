export type WorkflowStep = {
  id: string;
  label: string;
  agentId: string;
  estimateMinutes: number;
};

export type WorkflowTemplate = {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
};

export type ControlAgent = {
  id: string;
  name: string;
  role: string;
  description: string;
  mode: 'active' | 'paused';
  status: 'idle' | 'busy';
  currentWorkflowId?: string;
  lastCompletedAt?: string;
};

export type WorkflowRun = {
  id: string;
  templateId: string;
  label: string;
  owner: string;
  status: 'queued' | 'running' | 'paused' | 'completed';
  createdAt: string;
  currentStepIndex: number;
  history: { message: string; timestamp: string }[];
};

export type ControlState = {
  agents: ControlAgent[];
  templates: WorkflowTemplate[];
  runs: WorkflowRun[];
};
