import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();

  const preferredConnector =
    connectors.find((c) => c.ready && /meta|injected|browser/i.test(c.name)) ||
    connectors.find((c) => c.ready) ||
    connectors[0];

  if (!isConnected) {
    return (
      <button
        onClick={() => preferredConnector && connect({ connector: preferredConnector })}
        disabled={!preferredConnector || isLoading}
        className="h-10 px-4 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title={!preferredConnector ? 'No browser wallet found' : preferredConnector.name}
      >
        <span>{isLoading && pendingConnector ? 'Connecting...' : 'Sign In'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => disconnect()}
      className="h-10 px-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-all flex items-center gap-2"
      title="Baglantiyi kes"
    >
      <span className="material-symbols-outlined text-[18px]">wallet</span>
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block"></span>
      <span>{address?.slice(0, 6)}...{address?.slice(-4)}</span>
    </button>
  );
}
