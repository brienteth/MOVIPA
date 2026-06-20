import React from 'react';
import Button from '../ui/Button';
import { useIntentStore } from '../../store/intent.store';

export default function IntentInput({ onCompile }: { onCompile: () => void }) {
  const { intent, riskLevel, maxCapital, setIntent, setRisk, setCapital } = useIntentStore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 bg-brick3-slate border border-brick3-cyan/15 rounded-lg p-4">
      <div className="lg:col-span-2">
        <label className="text-xs text-brick3-silver/70">Execution Intent</label>
        <input
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder="Earn arbitrage profit with low risk"
          className="w-full mt-1 bg-brick3-void border border-brick3-cyan/25 rounded px-3 py-2 text-sm text-brick3-silver"
        />
      </div>
      <div>
        <label className="text-xs text-brick3-silver/70">Risk</label>
        <select
          value={riskLevel}
          onChange={(e) => setRisk(e.target.value as any)}
          className="w-full mt-1 bg-brick3-void border border-brick3-cyan/25 rounded px-3 py-2 text-sm text-brick3-silver"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-brick3-silver/70">Max Capital (USDC)</label>
        <div className="flex gap-2 mt-1">
          <input
            type="number"
            value={maxCapital}
            onChange={(e) => setCapital(Number(e.target.value || 0))}
            className="w-full bg-brick3-void border border-brick3-cyan/25 rounded px-3 py-2 text-sm text-brick3-silver"
          />
          <Button onClick={onCompile}>Compile</Button>
        </div>
      </div>
    </div>
  );
}
