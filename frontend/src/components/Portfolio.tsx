"use client";

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { motion, AnimatePresence } from 'framer-motion';
import { BRICK3_CONTRACTS } from '../lib/contracts';

interface TxHistory {
  hash: string;
  timestamp: number;
  status: 'Success' | 'Failed';
  type: string;
}

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const [history, setHistory] = useState<TxHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState("0.00");

  useEffect(() => {
    if (!address || !isConnected) return;
    
    let isMounted = true;
    const fetchPortfolio = async () => {
      setLoading(true);
      try {
        const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
        const bal = await provider.getBalance(address);
        if (isMounted) setBalance(ethers.formatEther(bal));

        // Fetch logs for StrategyRegistry
        const blockNumber = await provider.getBlockNumber();
        let logs: any[] = [];
        try {
          logs = await provider.getLogs({
            fromBlock: blockNumber - 5000,
            toBlock: 'latest',
            address: BRICK3_CONTRACTS.StrategyRegistry,
          });
        } catch (e) {
          console.warn("Failed to get logs with 5000 range, trying 500 range...", e);
          try {
            logs = await provider.getLogs({
              fromBlock: blockNumber - 500,
              toBlock: 'latest',
              address: BRICK3_CONTRACTS.StrategyRegistry,
            });
          } catch (innerErr) {
            console.error("Failed to query logs", innerErr);
          }
        }

        const txs: TxHistory[] = [];
        
        // Go backwards to get the most recent ones first
        for (let i = logs.length - 1; i >= Math.max(0, logs.length - 20); i--) {
          const log = logs[i];
          const tx = await provider.getTransaction(log.transactionHash);
          if (tx && tx.from.toLowerCase() === address.toLowerCase()) {
            const receipt = await provider.getTransactionReceipt(tx.hash);
            const block = await provider.getBlock(log.blockNumber);
            
            // Avoid duplicates
            if (!txs.find(t => t.hash === tx.hash)) {
              txs.push({
                hash: tx.hash,
                timestamp: block?.timestamp ? block.timestamp * 1000 : Date.now(),
                status: receipt?.status === 1 ? 'Success' : 'Failed',
                type: 'Strategy Registered'
              });
            }
          }
        }
        
        if (isMounted) setHistory(txs);
      } catch (err) {
        console.error("Failed to fetch portfolio data", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPortfolio();
    
    return () => { isMounted = false; };
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white p-10">
        <span className="material-symbols-outlined text-6xl text-white/20 mb-4">wallet</span>
        <h2 className="text-xl font-medium text-white/80">Connect Wallet to view Portfolio</h2>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0505] text-white p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-wide">Your Portfolio</h1>
          <p className="text-sm text-white/50">Track your strategy executions, P&L, and asset distribution on Base.</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-[#0F121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">account_balance_wallet</span>
            </div>
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Total Value (Base ETH)</div>
            <div className="text-3xl font-bold">{parseFloat(balance).toFixed(4)} ETH</div>
            <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              Active
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-[#0F121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">analytics</span>
            </div>
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Est. P&L (Monthly)</div>
            <div className="text-3xl font-bold text-green-400">+$0.00</div>
            <div className="text-xs text-white/40 mt-2">Simulated yield based on strategies</div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-[#0F121A] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="material-symbols-outlined text-6xl">bolt</span>
            </div>
            <div className="text-sm text-white/50 uppercase tracking-wider mb-2">Active Strategies</div>
            <div className="text-3xl font-bold">{loading ? "..." : history.filter(h => h.status === 'Success').length}</div>
            <div className="text-xs text-white/40 mt-2">Registered on-chain</div>
          </motion.div>
        </div>

        {/* Transaction History */}
        <div className="bg-[#0F121A] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Executions</h2>
            {loading && (
              <span className="flex items-center gap-2 text-xs text-white/50">
                <span className="w-2 h-2 rounded-full bg-white/50 animate-pulse"></span> Syncing
              </span>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {history.length === 0 && !loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-white/40 text-sm">
                  No strategies executed yet. Head to the Workspace to build your first strategy.
                </motion.div>
              )}
              
              {history.map((tx, idx) => (
                <motion.div 
                  key={tx.hash}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      <span className="material-symbols-outlined text-[20px]">
                        {tx.status === 'Success' ? 'check_circle' : 'error'}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-sm">{tx.type}</div>
                      <div className="text-xs text-white/40 mt-0.5">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`text-xs px-2.5 py-1 rounded-full ${tx.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.status}
                    </div>
                    <a 
                      href={`https://basescan.org/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    </a>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
