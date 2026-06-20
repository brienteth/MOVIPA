import React from 'react';
import { useSimulationStore } from '../../store/simulation.store';

export default function RiskMeter() {
  const risk = useSimulationStore((s) => s.result?.risk ?? 0);
  const pct = Math.max(0, Math.min(100, risk * 100));

  return (
    <div>
      <div className="flex justify-between text-xs mb-1 text-brick3-silver/70">
        <span>Risk</span>
        <span>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-brick3-void rounded overflow-hidden">
        <div className="h-full bg-brick3-cyan" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
