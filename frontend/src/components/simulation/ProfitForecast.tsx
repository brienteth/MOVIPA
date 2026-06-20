import React from 'react';
import { useSimulationStore } from '../../store/simulation.store';
import { formatUsd } from '../../lib/scoring';

export default function ProfitForecast() {
  const result = useSimulationStore((s) => s.result);
  const gross = result?.expectedProfit ?? 0;
  const net = result?.netProfitUsd ?? gross;

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      <div className="bg-brick3-void rounded p-3 border border-brick3-cyan/20">
        <p className="text-brick3-silver/60 text-xs">Expected Profit</p>
        <p className="text-brick3-cyan font-semibold">{formatUsd(gross)}</p>
      </div>
      <div className="bg-brick3-void rounded p-3 border border-brick3-green/20">
        <p className="text-brick3-silver/60 text-xs">Net Profit</p>
        <p className="text-brick3-green font-semibold">{formatUsd(net)}</p>
      </div>
    </div>
  );
}
