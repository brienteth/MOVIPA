import React from 'react';

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg border border-white/15 bg-[#10131B] px-3 py-2 text-white ${props.className || ''}`} />;
}
