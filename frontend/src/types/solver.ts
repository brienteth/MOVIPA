export interface SolverInfo {
  solver_id: string;
  solver_address: string;
  region: string;
  latency_ms: number;
  score: number;
  tee_attested: boolean;
  relay: string;
}
