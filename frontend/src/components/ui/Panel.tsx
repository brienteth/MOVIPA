import React from 'react';

export default function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brick3-slate border border-brick3-cyan/15 rounded-lg p-4">
      <h3 className="text-sm uppercase tracking-wide text-brick3-silver/70 mb-3">{title}</h3>
      <div>{children}</div>
    </div>
  );
}
