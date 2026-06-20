import { SimulationResult } from './simulation';

export type ExecutionStatus = 'idle' | 'pending' | 'executed' | 'failed';

export interface ExecutionEvent {
  executionId: string;
  intent: string;
  simulation: SimulationResult;
  solver: {
    selected: string;
    latencyMs: number;
    h3Cell: string;
  };
  execution: {
    txHash?: string;
    status: ExecutionStatus;
  };
}
