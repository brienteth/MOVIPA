import React, { useEffect, useState } from 'react';
import { useNetwork, useAccount } from 'wagmi';
import { ethers } from 'ethers';
import WalletButton from './WalletButton';
import { API_BASE } from '../../lib/api';
import { getOpacusWalletAddress } from '../../lib/web3';

export default function Topbar() {
  const { chain } = useNetwork();
  const { address } = useAccount();
  const [connected, setConnected] = useState(false);
  const [kernelBalance, setKernelBalance] = useState<string | null>(null);

  const kernelAddress = address ? getOpacusWalletAddress(address) : "0x40021c19a16d2Ca7640D0B93A487023F9f6250B2";
  const usdcAddress = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  const fetchKernelBalance = async () => {
    if (!address) return;
    try {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const abi = ["function balanceOf(address account) external view returns (uint256)"];
      const contract = new ethers.Contract(usdcAddress, abi, provider);
      const bal = await contract.balanceOf(kernelAddress);
      setKernelBalance(ethers.formatUnits(bal, 6));
    } catch (e) {
      console.error(e);
    }
  };

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
    fetchKernelBalance();
    const id = setInterval(check, 15000);
    const balId = setInterval(fetchKernelBalance, 10000);
    return () => {
      clearInterval(id);
      clearInterval(balId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  return (
    <header className="fixed top-0 right-0 left-[280px] h-[64px] flex items-center justify-between px-6 z-50 bg-[#0B0D12]/80 backdrop-blur-md border-b border-white/10">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-white tracking-tight">BRICK3</div>
        <span className={`text-xs px-2.5 py-1 rounded-full border ${connected ? 'border-red-500/30 text-red-400 bg-red-500/10' : 'border-white/20 text-white/60 bg-white/5'}`}>
          {connected ? 'Backend Online' : 'Backend Offline'}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {address && kernelBalance !== null && (
          <span className="h-8 px-3 rounded-full border border-white/10 bg-white/[0.02] text-xs text-white/50 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00D1C7]" />
            Kernel: <span className="font-mono text-white/80 select-all">{kernelAddress.slice(0, 6)}...{kernelAddress.slice(-4)}</span>
            <span className="font-bold text-[#00D1C7] ml-0.5">({parseFloat(kernelBalance).toFixed(3)} USDC)</span>
          </span>
        )}
        <span className="h-8 px-3 rounded-full border border-white/15 bg-white/5 text-xs text-white/80 flex items-center">
          {chain?.name || 'Network'}
        </span>
        <WalletButton />
      </div>
    </header>
  );
}
