import { create } from 'zustand';
import { SimulationResult } from '../types/simulation';

interface SimulationState {
  result: SimulationResult | null;
  streaming: boolean;
  updateResult: (result: SimulationResult) => void;
  setStreaming: (streaming: boolean) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  result: null,
  streaming: false,
  updateResult: (result) => set({ result }),
  setStreaming: (streaming) => set({ streaming }),
}));
