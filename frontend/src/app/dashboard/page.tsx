import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';

interface Intent {
  id: string;
  action?: string;
  amount?: string;
  status?: string;
}

interface ArbitrageStats {
  total_executions?: number;
  successful?: number;
  failed?: number;
  total_profit?: number;
  avg_profit_per_trade?: number;
  win_rate?: number;
}

interface RpcStatus {
  total_connected?: number;
}

interface ExecutionHistoryItem {
  success?: boolean;
  profit?: number;
  transaction_hash?: string;
  opportunity?: {
    token_in?: string;
    token_out?: string;
  };
}

export default function DashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [intents, setIntents] = useState<Intent[]>([]);
  const [stats, setStats] = useState<ArbitrageStats | null>(null);
  const [rpc, setRpc] = useState<RpcStatus | null>(null);
  const [history, setHistory] = useState<ExecutionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string>('');
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const pullDashboardData = async () => {
      try {
        if (!cancelled) setLoading(true);
        const [healthRes, mempoolRes, statsRes, rpcRes, historyRes] = await Promise.allSettled([
          api.health(),
          api.mempool(),
          api.arbitrageStats(),
          api.rpcStatus(),
          api.executionHistory(8),
        ]);

        if (cancelled) return;

        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value);
        }

        if (mempoolRes.status === 'fulfilled') {
          const data = mempoolRes.value as { intents?: Intent[] };
          if (Array.isArray(data?.intents)) {
            setIntents(data.intents);
          }
        }

        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value as ArbitrageStats);
        }

        if (rpcRes.status === 'fulfilled') {
          setRpc(rpcRes.value as RpcStatus);
        }

        if (historyRes.status === 'fulfilled') {
          const data = historyRes.value as { executions?: ExecutionHistoryItem[] };
          if (Array.isArray(data?.executions)) {
            setHistory(data.executions);
          }
        }

        const hadErrors = [healthRes, mempoolRes, statsRes, rpcRes, historyRes].some((r) => r.status === 'rejected');
        setLastError(hadErrors ? 'Some live metrics are degraded.' : '');
      } catch (e) {
        if (!cancelled) {
          setLastError(e instanceof Error ? e.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    pullDashboardData();
    const interval = setInterval(pullDashboardData, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowToast(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const formatHash = (id?: string) => id ? `${id.slice(0, 8)}...${id.slice(-6)}` : '0x—';

  const tve = useMemo(() => {
    const v = stats?.total_profit ?? 0;
    return `$${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }, [stats]);

  const activeIntents = useMemo(() => intents.length, [intents]);

  const solverHealth = useMemo(() => {
    if (typeof stats?.win_rate === 'number') {
      return `${stats.win_rate.toFixed(1)}%`;
    }
    return '—';
  }, [stats]);

  const efficiency = useMemo(() => {
    const connected = rpc?.total_connected ?? 0;
    return connected > 0 ? `${connected} chains` : 'degraded';
  }, [rpc]);

  const metricsData = [
    { label: 'TVE', value: tve, sub: `${stats?.total_executions ?? 0} executions`, icon: 'trending_up', color: 'text-success', border: 'border-success/30' },
    { label: 'Active Intents', value: activeIntents, sub: 'in mempool', icon: 'hub', color: 'text-primary', border: 'border-primary/30' },
    { label: 'Solver Health', value: solverHealth, sub: `${stats?.successful ?? 0} success / ${stats?.failed ?? 0} failed`, icon: 'monitor_heart', color: 'text-secondary-fixed', border: 'border-secondary-fixed/30' },
    { label: 'Network Efficiency', value: efficiency, sub: health?.status || 'status unknown', icon: 'speed', color: 'text-solver-high', border: 'border-solver-high/30' },
  ];

  const topologyNodes = [
    { x: 300, y: 200, label: 'CORE', color: '#00e5ff', r: 22 },
    { x: 180, y: 120, label: 'H3-1', color: '#1EF0A6', r: 14 },
    { x: 420, y: 120, label: 'SOL-A', color: '#B56CFF', r: 14 },
    { x: 150, y: 270, label: 'INT', color: '#00e5ff', r: 12 },
    { x: 450, y: 270, label: 'RPC', color: '#2BD9FF', r: 12 },
    { x: 300, y: 330, label: 'H3-2', color: '#1EF0A6', r: 12 },
    { x: 300, y: 70, label: 'STL', color: '#FFF176', r: 12 },
  ];

  const edges = [[0,1],[0,2],[0,3],[0,4],[0,5],[1,3],[2,4],[0,6]];

  const getStatusColor = (status: string) => {
    if (!status) return 'text-on-surface-variant';
    const s = status.toLowerCase();
    if (s === 'confirmed' || s === 'executed') return 'text-success';
    if (s === 'pending') return 'text-warning';
    return 'text-error';
  };

  const activityRows = history.length > 0
    ? history.map((e) => ({
        hash: formatHash(e.transaction_hash),
        action: e.opportunity?.token_in && e.opportunity?.token_out
          ? `${e.opportunity.token_in}→${e.opportunity.token_out}`
          : 'EXECUTION',
        status: e.success ? 'confirmed' : 'failed',
      }))
    : intents.slice(0, 8).map((i) => ({
        hash: formatHash(i.id),
        action: i.action || 'INTENT',
        status: i.status || 'pending',
      }));

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {(loading || lastError) && (
        <div className={`rounded-lg px-4 py-2 text-sm font-mono-sm border ${lastError ? 'bg-warning/10 border-warning/40 text-warning' : 'bg-primary/10 border-primary/40 text-primary'}`}>
          {lastError || 'Syncing live metrics...'}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metricsData.map((m, i) => (
          <div key={i} className={`bg-bg-card border ${m.border} rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-current opacity-30" style={{ color: m.color.replace('text-', '') }}></div>
            <div className="flex items-center justify-between">
              <span className="font-small text-small text-on-surface-variant uppercase tracking-wider">{m.label}</span>
              <span className={`material-symbols-outlined ${m.color}`} style={{ fontSize: '20px' }}>{m.icon}</span>
            </div>
            <div>
              <div className={`font-h2 text-h2 font-bold ${m.color}`}>{m.value}</div>
              <div className="font-small text-small text-on-surface-variant mt-1">{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Topology Graph */}
        <div className="xl:col-span-2 bg-bg-card border border-outline-variant rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-h3 text-h3 text-on-surface font-semibold">Network Topology</h3>
            <span className="flex items-center gap-2 font-mono-sm text-mono-sm text-success">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>LIVE
            </span>
          </div>
          <div className="bg-bg-surface rounded-lg overflow-hidden" style={{ height: '280px', background: 'radial-gradient(circle at center, #0A1220 0%, #05060A 100%)' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 380" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="300" cy="200" r="80" fill="url(#glow)" />
              {edges.map(([a, b], i) => (
                <line
                  key={i}
                  x1={topologyNodes[a].x} y1={topologyNodes[a].y}
                  x2={topologyNodes[b].x} y2={topologyNodes[b].y}
                  stroke="#3b494c" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"
                />
              ))}
              {topologyNodes.map((node, i) => (
                <g key={i}>
                  <circle cx={node.x} cy={node.y} r={node.r + 6} fill={node.color} opacity="0.08" />
                  <circle cx={node.x} cy={node.y} r={node.r} fill="#0F1624" stroke={node.color} strokeWidth="1.5" />
                  <text x={node.x} y={node.y + 4} textAnchor="middle" fill={node.color} fontSize="9" fontFamily="JetBrains Mono, monospace" fontWeight="500">{node.label}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="xl:col-span-1 bg-bg-card border border-outline-variant rounded-xl p-5 flex flex-col gap-4">
          <h3 className="font-h3 text-h3 text-on-surface font-semibold">Recent Activity</h3>
          <div className="flex flex-col gap-1 overflow-y-auto flex-1">
            {activityRows.map((row, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-surface-container transition-colors gap-3">
                <span className="font-mono-sm text-mono-sm text-on-surface-variant shrink-0">{row.hash}</span>
                <span className="font-mono-sm text-mono-sm text-on-surface bg-surface-container px-2 py-0.5 rounded text-xs">{row.action}</span>
                <span className={`font-mono-sm text-mono-sm shrink-0 ${getStatusColor(row.status)}`}>{row.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-success/10 border border-success/40 rounded-xl px-5 py-3 flex items-center gap-3 shadow-lg">
          <span className="material-symbols-outlined text-success" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>check_circle</span>
          <span className="font-body text-body text-on-surface">Transaction Confirmed</span>
          <button onClick={() => setShowToast(false)} className="text-on-surface-variant hover:text-on-surface ml-2">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
          </button>
        </div>
      )}
    </div>
  );
}
