import { create } from 'zustand';
import { RiskLevel } from '../types/intent';

interface IntentState {
  intent: string;
  riskLevel: RiskLevel;
  maxCapital: number;
  setIntent: (intent: string) => void;
  setRisk: (risk: RiskLevel) => void;
  setCapital: (cap: number) => void;
}

export const useIntentStore = create<IntentState>((set) => ({
  intent: '',
  riskLevel: 'medium',
  maxCapital: 1000,
  setIntent: (intent) => set({ intent }),
  setRisk: (riskLevel) => set({ riskLevel }),
  setCapital: (maxCapital) => set({ maxCapital }),
}));
