import { create } from 'zustand';
import { SolverInfo } from '../types/solver';

interface SolverState {
  solvers: SolverInfo[];
  selectedSolver: SolverInfo | null;
  setSolvers: (solvers: SolverInfo[]) => void;
  selectSolver: (solver: SolverInfo | null) => void;
}

export const useSolverStore = create<SolverState>((set) => ({
  solvers: [],
  selectedSolver: null,
  setSolvers: (solvers) => set({ solvers }),
  selectSolver: (selectedSolver) => set({ selectedSolver }),
}));
