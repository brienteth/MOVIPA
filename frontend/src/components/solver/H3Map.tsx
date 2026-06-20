import React from 'react';
import Panel from '../ui/Panel';

export default function H3Map() {
  return (
    <Panel title="BRICK3 GRID (H3)">
      <div className="h-40 rounded bg-brick3-void border border-brick3-cyan/15 p-3 text-xs text-brick3-silver/70">
        <p>Dynamic routing score combines:</p>
        <ul className="list-disc ml-4 mt-2 space-y-1">
          <li>Ping latency</li>
          <li>Builder inclusion speed</li>
          <li>Relay reliability</li>
          <li>Historical solver PnL</li>
        </ul>
      </div>
    </Panel>
  );
}
