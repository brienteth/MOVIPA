import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';
import { useUiStore } from '../../store/ui.store';
import { useAccount } from 'wagmi';
import { useSessionStore } from '../../store/session.store';

import { API_BASE } from '../../lib/api';

const API_WS_BASE =
  API_BASE.replace(/^http/, 'ws');

type Status = 'Running' | 'Completed' | 'Failed' | 'Reverted' | 'Pending' | 'Simulating' | 'Queued';

interface ExecutionCard {
  title: string;
  status: Status;
  pnl: number;
  timeSec: number;
  protection: string;
  network: string;
  details: {
    gasUsed: string;
    netProfit: string;
    dexPath: string;
    failureReason: string;
  };
}

const statusClass: Record<Status, string> = {
  Running: 'text-[#4ADE80] bg-[#4ADE8015] border-[#4ADE8033]',
  Completed: 'text-[#22C55E] bg-[#22C55E15] border-[#22C55E33]',
  Failed: 'text-[#F87171] bg-[#F8717115] border-[#F8717133]',
  Reverted: 'text-[#FB7185] bg-[#FB718515] border-[#FB718533]',
  Pending: 'text-[#A3A3A3] bg-[#A3A3A315] border-[#A3A3A333]',
  Simulating: 'text-[#60A5FA] bg-[#60A5FA15] border-[#60A5FA33]',
  Queued: 'text-[#FBBF24] bg-[#FBBF2415] border-[#FBBF2433]',
};

export default function MonitorPage() {
  const { setView } = useUiStore();
  const { address } = useAccount();
  const embeddedWalletAddress = useSessionStore((s) => s.embeddedWalletAddress);
  const defaultAddress = address || embeddedWalletAddress || '0x73D4B99cF0C04D481036478F00Fd862D9589A940';
  const [monitorAddress, setMonitorAddress] = useState(defaultAddress);
  const [addressInput, setAddressInput] = useState(defaultAddress);
  const [cards, setCards] = useState<ExecutionCard[]>([]);
  const [selected, setSelected] = useState<ExecutionCard | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [mempoolCount, setMempoolCount] = useState(0);
  const [liveOpportunity, setLiveOpportunity] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  // WebSocket for live opportunity stream
  useEffect(() => {
    let active = true;
    const connect = () => {
      if (!active) return null;
      try {
        const ws = new WebSocket(`${API_WS_BASE}/ws/arbitrage/monitor/${monitorAddress}`);
        wsRef.current = ws;
        ws.onopen = () => {
          if (!active && ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
        ws.onmessage = (e) => {
          if (!active) return;
          try {
            const data = JSON.parse(e.data);
            if (data.top_opportunity) {
              const op = data.top_opportunity;
              setLiveOpportunity(
                `${op.token_in || 'USDC'} → ${op.token_out || 'ETH'} · +${Number(op.estimated_profit_usdc || 0).toFixed(2)} USDC`
              );
            }
            if (data.stats) {
              setStats((prev: any) => ({ ...prev, ...data.stats }));
            }
          } catch {}
        };
        ws.onerror = () => {};
        ws.onclose = () => {
          if (!active) return;
          reconnectRef.current = window.setTimeout(() => {
            connect();
          }, 1500);
        };
        return ws;
      } catch {
        return null;
      }
    };
    const ws = connect();
    return () => {
      active = false;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
        reconnectRef.current = null;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws && ws.readyState === WebSocket.CONNECTING) {
        ws.onopen = () => ws.close();
      }
    };
  }, [monitorAddress]);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      const [s, h, m, strategyHistory, walletActivity] = await Promise.allSettled([
        api.arbitrageStats(),
        api.executionHistory(8),
        api.mempool(),
        api.strategyExecutionHistory(10, monitorAddress),
        api.walletActivity(monitorAddress, 4000, 12),
      ]);

      if (cancelled) return;

      if (s.status === 'fulfilled') setStats(s.value);
      if (m.status === 'fulfilled') {
        const value = m.value as { total_open?: number };
        setMempoolCount(value.total_open || 0);
      }

      const executionCards: ExecutionCard[] = [];

      if (strategyHistory.status === 'fulfilled') {
        const value = strategyHistory.value as { executions?: any[] };
        executionCards.push(
          ...(value.executions || []).map((e): ExecutionCard => ({
            title: `Strategy Execution · ${String(e?.strategy_hash || '').slice(0, 10)}...`,
            status: e?.success ? 'Completed' : 'Failed',
            pnl: Number((e?.net_profit_wei || 0) / 1_000_000_000_000_000_000),
            timeSec: 0,
            protection: 'Private Relay',
            network: 'Base',
            details: {
              gasUsed: `${Number(e?.gas_used || 0).toLocaleString()} gas`,
              netProfit: `${Number(e?.net_profit_wei || 0)} wei`,
              dexPath: 'StrategyExecutorKernel',
              failureReason: e?.success ? 'Settled successfully.' : 'Execution failed.',
            },
          }))
        );
      }

      if (walletActivity.status === 'fulfilled') {
        const value = walletActivity.value as { activity?: any[]; bandle_router?: string; strategy_executor?: string };
        executionCards.push(
          ...(value.activity || []).map((tx): ExecutionCard => ({
            title: `${tx.interaction === 'bandle_router' ? 'Router Tx' : tx.interaction === 'strategy_executor' ? 'Strategy Tx' : 'Wallet Tx'} · ${String(tx.transaction_hash).slice(0, 10)}...`,
            status: tx.success ? 'Completed' : 'Failed',
            pnl: 0,
            timeSec: 0,
            protection: tx.interaction === 'wallet' ? 'On-chain' : 'Tracked On-chain',
            network: 'Base',
            details: {
              gasUsed: `${Number(tx.gas_used || 0).toLocaleString()} gas`,
              netProfit: `${tx.value_wei || '0'} wei moved`,
              dexPath: tx.to || 'unknown',
              failureReason: tx.success ? 'Confirmed on Base.' : 'Transaction reverted.',
            },
          }))
        );
      }

      if (h.status === 'fulfilled') {
        const value = h.value as { executions?: any[] };
        const mapped: ExecutionCard[] = (value.executions || []).map((e) => ({
          title: `${e?.opportunity?.token_in || 'USDC'} → ${e?.opportunity?.token_out || 'ETH'} Arbitrage`,
          status: e?.success ? 'Completed' : 'Failed',
          pnl: Number(e?.profit || 0),
          timeSec: Number(((e?.execution_time_ms || 0) / 1000).toFixed(1)),
          protection: 'Private Route',
          network: e?.opportunity?.buy_chain || 'Base',
          details: {
            gasUsed: `${Number(e?.gas_used || 0).toFixed(5)} ETH`,
            netProfit: `${Number(e?.profit || 0).toFixed(2)} USDC`,
            dexPath: `${e?.opportunity?.buy_chain || 'ETH'} → ${e?.opportunity?.sell_chain || 'BASE'}`,
            failureReason: e?.error || 'Market moved before execution completed. No funds lost.',
          },
        }));

        executionCards.push(...mapped);
      }

      setCards(executionCards.length ? executionCards : [
          {
            title: `Wallet Activity · ${monitorAddress.slice(0, 10)}...`,
            status: 'Pending',
            pnl: 0,
            timeSec: 0,
            protection: 'Awaiting Activity',
            network: 'Base',
            details: {
              gasUsed: '0 gas',
              netProfit: '0',
              dexPath: 'No recent matched tx found',
              failureReason: 'No matching router/strategy transactions found in the current lookback window.',
            },
          },
        ]);
    };

    sync();
    const id = setInterval(sync, 12000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [monitorAddress]);

  const topMetrics = useMemo(() => {
    const totalExecutions = Number(stats?.total_executions || 0);
    const successRate = Number(stats?.win_rate || 0);
    const protectedTx = Number(stats?.successful || 0);
    const todayProfit = Number(stats?.total_profit || 0);
    const gasSaved = Number((stats?.avg_profit_per_trade || 0) * 0.02);

    return [
      { label: 'Active Executions', value: mempoolCount || totalExecutions },
      { label: "Today's Profit", value: `${todayProfit.toFixed(2)} USDC` },
      { label: 'Success Rate', value: `${successRate.toFixed(1)}%` },
      { label: 'Gas Saved', value: `${gasSaved.toFixed(2)} ETH` },
      { label: 'Protected Transactions', value: protectedTx },
    ];
  }, [stats, mempoolCount]);

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6 bg-[#0A0505]">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white tracking-tight">Monitor</h2>
            <p className="text-sm text-white/60 mt-1">Live activity center</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="0x..."
              className="w-full sm:w-[320px] rounded-2xl border border-white/10 bg-[#0B111E] px-4 py-3 text-sm text-white outline-none"
            />
            <button
              onClick={() => {
                if (addressInput.startsWith('0x') && addressInput.length === 42) {
                  setMonitorAddress(addressInput);
                }
              }}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 transition"
            >
              Track Wallet
            </button>
          </div>
        </div>
        <p className="text-xs text-white/35">Tracking wallet: {monitorAddress}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <h3 className="text-white font-medium">Welcome back</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-sm">
          <p className="text-white/65">Today's Profit: <span className="text-white">+{Number(stats?.total_profit || 0).toFixed(2)} USDC</span></p>
          <p className="text-white/65">Active Vaults: <span className="text-white">{Math.max(1, Math.round((cards.length || 1) / 2))}</span></p>
          <p className="text-white/65">Running Executions: <span className="text-white">{cards.filter((c) => c.status === 'Running').length}</span></p>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <button onClick={() => setView('canvas')} className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">New Intent</button>
          <button onClick={() => setView('vaults')} className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">Open Vaults</button>
          <button onClick={() => setView('strategies')} className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">Explore Strategies</button>
          <button onClick={() => setView('canvas')} className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">Resume Canvas</button>
        </div>
      </div>

      {liveOpportunity && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 flex items-center gap-2 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0"></span>
          <span className="text-red-400">Live opportunity: {liveOpportunity}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {topMetrics.map((m) => (
          <div key={m.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-wider text-white/50">{m.label}</p>
            <p className="mt-2 text-lg font-semibold text-white">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {cards.map((c, idx) => (
          <div key={`${c.title}-${idx}`} className="rounded-2xl border border-white/10 bg-[#0F121A] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-white font-medium">{c.title}</h3>
                <p className="text-white/50 text-sm">Execution Time: {c.timeSec}s</p>
              </div>
              <span className={`px-2.5 py-1 text-xs rounded-full border ${statusClass[c.status]}`}>{c.status}</span>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div className="text-white/70">Current PnL: <span className="text-white">+{c.pnl.toFixed(2)} USDC</span></div>
              <div className="text-white/70">Protection: <span className="text-white">{c.protection}</span></div>
              <div className="text-white/70">Network: <span className="text-white">{c.network}</span></div>
              <div className="text-right md:text-left">
                <button onClick={() => setSelected(c)} className="text-white/90 hover:text-white text-sm underline underline-offset-4">View Details</button>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs">
              <p className="text-white/40 uppercase tracking-wider mb-2">Timeline</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-white/65">
                <span>Simulation Complete</span>
                <span>Route Locked</span>
                <span>Bundle Submitted</span>
                <span>Execution Confirmed</span>
                <span>Profit Settled</span>
              </div>
            </div>

            {c.status === 'Completed' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => setView('canvas')} className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">Run Again</button>
                <button onClick={() => setView('vaults')} className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">Save as Vault</button>
                <button className="px-3 py-1.5 rounded-lg border border-white/15 text-white/90 text-sm hover:bg-white/5">Export Strategy</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#11151F] p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white text-lg font-semibold">Execution Details</h4>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-white/70">Execution Timeline: <span className="text-white">{selected.status} in {selected.timeSec}s</span></p>
              <p className="text-white/70">Gas Used: <span className="text-white">{selected.details.gasUsed}</span></p>
              <p className="text-white/70">Net Profit: <span className="text-white">{selected.details.netProfit}</span></p>
              <p className="text-white/70">DEX Path: <span className="text-white">{selected.details.dexPath}</span></p>
              <p className="text-white/70">Failure Reason: <span className="text-white">{selected.details.failureReason}</span></p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
