import React from 'react';
import { useIntentStore } from '../../store/intent.store';

const examples = [
  'Execute only if profit > 50 USDC and slippage < 0.5%',
  'Cross-chain arbitrage between Base and Arbitrum with low risk',
  'Route intent via TEE-only solver and private relay',
];

export default function IntentExamples() {
  const setIntent = useIntentStore((s) => s.setIntent);
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {examples.map((e) => (
        <button
          key={e}
          onClick={() => setIntent(e)}
          className="text-xs px-2 py-1 rounded bg-brick3-void border border-brick3-cyan/20 text-brick3-silver/80 hover:text-brick3-silver"
        >
          {e}
        </button>
      ))}
    </div>
  );
}
