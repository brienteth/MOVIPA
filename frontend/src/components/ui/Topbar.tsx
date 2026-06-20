import React, { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import WalletButton from './WalletButton';
import { API_BASE } from '../../lib/api';

export default function Topbar() {
  const { chain } = useNetwork();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        await fetch(`${API_BASE}/api/v2/health`);
        setConnected(true);
      } catch {
        setConnected(false);
      }
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="fixed top-0 right-0 left-[280px] h-[64px] flex items-center justify-between px-6 z-50 bg-[#0B0D12]/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-white tracking-tight">BRICK3</div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${connected ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-white/20 text-white/60 bg-white/5'}`}>
          {connected ? 'Backend Online' : 'Backend Offline'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="h-8 px-3 rounded-full border border-white/15 bg-white/5 text-xs text-white/80 flex items-center">
          {chain?.name || 'Network'}
        </span>
        <WalletButton />
      </div>
    </header>
  );
}
