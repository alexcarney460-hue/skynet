import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  advanceWorkflow,
  cancelWorkflow,
  pauseAgent,
  readControlState,
  resumeAgent,
  startWorkflow,
} from '@/lib/control-store';

export async function GET() {
  const state = await readControlState();
  return NextResponse.json(state, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body as {
      action: string;
      payload?: Record<string, unknown>;
    };

    let state;

    switch (action) {
      case 'start_workflow': {
        const templateId = String(payload?.templateId ?? 'ig-reels');
        const label = payload?.label ? String(payload.label) : undefined;
        const owner = payload?.owner ? String(payload.owner) : undefined;
        state = await startWorkflow(templateId, label, owner);
        break;
      }
      case 'advance_workflow': {
        const runId = String(payload?.runId ?? '');
        state = await advanceWorkflow(runId);
        break;
      }
      case 'pause_agent': {
        const agentId = String(payload?.agentId ?? '');
        state = await pauseAgent(agentId);
        break;
      }
      case 'resume_agent': {
        const agentId = String(payload?.agentId ?? '');
        state = await resumeAgent(agentId);
        break;
      }
      case 'cancel_workflow': {
        const runId = String(payload?.runId ?? '');
        state = await cancelWorkflow(runId);
        break;
      }
      default:
        return NextResponse.json(
          { error: 'unknown_action', message: `Unsupported action: ${action}` },
          { status: 400 },
        );
    }

    revalidatePath('/');
    return NextResponse.json(state);
  } catch (error) {
    console.error('Control API error', error);
    return NextResponse.json(
      {
        error: 'control_failure',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
