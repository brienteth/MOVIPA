import React from 'react';
import { AppView } from '../../store/ui.store';

const mainItems: Array<{ key: AppView; label: string }> = [
  { key: 'canvas', label: 'Canvas' },
  { key: 'monitor', label: 'Monitor' },
  { key: 'strategies', label: 'Marketplace' },
  { key: 'vaults', label: 'Vaults' },
  { key: 'portfolio', label: 'Portfolio (P&L)' },
];

export default function Sidebar({
  current,
  onChange,
}: {
  current: AppView;
  onChange: (view: AppView) => void;
}) {
  return (
    <nav className="fixed left-0 top-0 h-screen w-[280px] bg-[#0B0D12] border-r border-white/10 flex flex-col py-6 z-50">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
          <img src="/brick3-logo.jpg" alt="BRICK3" className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-[18px] font-semibold tracking-tight text-white leading-none">BRICK3</h1>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 overflow-y-auto px-2">
        {mainItems.map((item) => {
          const isActive = current === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-white text-black'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto px-2 pt-4 border-t border-white/10 flex flex-col gap-1">
        <button
          onClick={() => onChange('docs')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
            current === 'docs' ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Documentation</span>
        </button>
        <button
          onClick={() => onChange('settings')}
          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
            current === 'settings' ? 'bg-white text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Settings</span>
        </button>
      </div>
    </nav>
  );
}
