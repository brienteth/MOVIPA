import React from 'react';
import { useSolverStore } from '../../store/solver.store';

export default function LatencyChart() {
  const solvers = useSolverStore((s) => s.solvers);
  const top = solvers.slice(0, 4);

  return (
    <div>
      <p className="text-xs text-brick3-silver/70 mb-2">Solver latency (ms)</p>
      <div className="space-y-2">
        {top.length === 0 ? (
          <p className="text-xs text-brick3-silver/50">No solver telemetry yet.</p>
        ) : (
          top.map((s) => (
            <div key={s.solver_id} className="flex items-center gap-2 text-xs">
              <span className="w-24 text-brick3-silver/70 truncate">{s.region}</span>
              <div className="flex-1 h-2 bg-brick3-void rounded overflow-hidden">
                <div className="h-full bg-brick3-cyan" style={{ width: `${Math.min(100, Math.max(4, 100 - s.latency_ms))}%` }} />
              </div>
              <span className="w-10 text-right text-brick3-silver">{s.latency_ms}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
