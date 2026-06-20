import React from 'react';
import Button from '../ui/Button';

export default function CanvasToolbar({ onFit }: { onFit: () => void }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-brick3-cyan/15 bg-brick3-void/60">
      <p className="text-xs text-brick3-silver/70 uppercase tracking-wide">Intent → Compiler → Graph → Simulation → Solver → Settlement</p>
      <Button variant="secondary" onClick={onFit}>Fit View</Button>
    </div>
  );
}
