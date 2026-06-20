import React from 'react';

type SelectContextState = {
  value?: string;
  onValueChange?: (value: string) => void;
};

const SelectContext = React.createContext<SelectContextState>({});

export function Select({ value, onValueChange, children }: { value?: string; onValueChange?: (value: string) => void; children: React.ReactNode }) {
  return <SelectContext.Provider value={{ value, onValueChange }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`w-full rounded-lg border border-white/15 bg-[#10131B] px-3 py-2 text-white ${className}`}>{children}</div>;
}

export function SelectValue() {
  const { value } = React.useContext(SelectContext);
  return <span className="text-white/90">{value || 'Select option'}</span>;
}

export function SelectContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mt-2 grid gap-2 ${className}`}>{children}</div>;
}

export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const { onValueChange } = React.useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => onValueChange?.(value)}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-white hover:bg-white/10"
    >
      {children}
    </button>
  );
}
