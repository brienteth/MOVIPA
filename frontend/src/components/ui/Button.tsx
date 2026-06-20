import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
};

export default function Button({ variant = 'primary', className = '', disabled = false, ...props }: Props) {
  const base = 'px-3 py-2 rounded text-sm transition-colors';
  const style =
    variant === 'primary'
      ? `bg-brick3-cyan text-brick3-void hover:opacity-90 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
      : `bg-brick3-slate text-brick3-silver border border-brick3-cyan/20 hover:bg-brick3-slate/80 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  return <button className={`${base} ${style} ${className}`} disabled={disabled} {...props} />;
}
