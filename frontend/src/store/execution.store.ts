import { create } from 'zustand';
import { ExecutionGraph } from '../types/graph';

interface ExecutionState {
  graph: ExecutionGraph | null;
  status: 'idle' | 'ready' | 'running' | 'done' | 'error';
  setGraph: (graph: ExecutionGraph | null) => void;
  setStatus: (status: ExecutionState['status']) => void;
}

export const useExecutionStore = create<ExecutionState>((set) => ({
  graph: null,
  status: 'idle',
  setGraph: (graph) => set({ graph }),
  setStatus: (status) => set({ status }),
}));
