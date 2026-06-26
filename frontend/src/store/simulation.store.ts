import { create } from 'zustand';
import { SimulationResult } from '../types/simulation';

interface SimulationState {
  result: SimulationResult | null;
  streaming: boolean;
  isSimulating: boolean;
  updateResult: (result: SimulationResult) => void;
  setStreaming: (streaming: boolean) => void;
  setIsSimulating: (isSimulating: boolean) => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  result: null,
  streaming: false,
  isSimulating: false,
  updateResult: (result) => set({ result }),
  setStreaming: (streaming) => set({ streaming }),
  setIsSimulating: (isSimulating) => set({ isSimulating }),
}));
