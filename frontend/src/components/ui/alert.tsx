import React from 'react';

export function Alert({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/15 bg-white/5 p-3 text-white ${className}`}>{children}</div>;
}

export function AlertDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-white/75 ${className}`}>{children}</p>;
}
