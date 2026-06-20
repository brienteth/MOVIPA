import React from 'react';
import { useSolverStore } from '../../store/solver.store';
import SolverCard from './SolverCard';

export default function SolverMesh() {
  const solvers = useSolverStore((s) => s.solvers);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {solvers.length === 0 ? (
        <p className="text-sm text-brick3-silver/60">No active solver telemetry yet.</p>
      ) : (
        solvers.map((solver) => <SolverCard key={solver.solver_id} solver={solver} />)
      )}
    </div>
  );
}
