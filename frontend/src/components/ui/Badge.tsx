import React from 'react';

export default function Badge({ children, color = 'cyan' }: { children: React.ReactNode; color?: 'cyan' | 'green' | 'slate' }) {
  const cls =
    color === 'green'
      ? 'bg-brick3-green/20 text-brick3-green border-brick3-green/40'
      : color === 'slate'
      ? 'bg-brick3-slate text-brick3-silver border-brick3-silver/20'
      : 'bg-brick3-cyan/15 text-brick3-cyan border-brick3-cyan/40';

  return <span className={`text-xs px-2 py-1 rounded border ${cls}`}>{children}</span>;
}
