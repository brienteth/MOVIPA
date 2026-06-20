import React from 'react';
import { SolverInfo } from '../../types/solver';

export default function SolverCard({ solver }: { solver: SolverInfo }) {
  return (
    <div className="bg-brick3-slate border border-brick3-cyan/15 rounded p-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-semibold text-brick3-silver">{solver.region}</p>
          <p className="text-xs text-brick3-silver/60">{solver.solver_address}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded bg-brick3-cyan/15 text-brick3-cyan">{solver.score}</span>
      </div>
      <div className="mt-2 text-xs text-brick3-silver/75 flex justify-between">
        <span>Latency: {solver.latency_ms}ms</span>
        <span>{solver.tee_attested ? 'TEE' : 'Non-TEE'}</span>
      </div>
    </div>
  );
}
