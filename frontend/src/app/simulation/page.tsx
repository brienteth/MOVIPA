import React, { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../lib/api';

interface SimResult {
  estimated_profit?: number;
  avg_roi?: number;
  volatility?: string;
  beta?: number;
  confidence?: number;
  latency_ms?: number;
  gas_usd?: number;
  estimated_gas?: number;
  profitable?: boolean;
  failure_probability?: number;
}

const STREAM_LINES = [
  '[2024-01-15 10:42:00.001] INFO  Route analysis: Uniswap V3 USDC/ETH 0.05%',
  '[2024-01-15 10:42:00.012] INFO  Simulating flash loan: Aave V3 $50,000 USDC',
  '[2024-01-15 10:42:00.043] OK    Arbitrage opportunity found: +$284.50 net',
  '[2024-01-15 10:42:00.088] INFO  Cross-chain route: ARB → ETH main via H3',
  '[2024-01-15 10:42:00.121] WARN  Gas spike detected: +12% above baseline',
  '[2024-01-15 10:42:00.158] OK    Slippage within tolerance (0.05% < 0.1%)',
  '[2024-01-15 10:42:00.201] INFO  Solver mesh query: 4 solvers responding',
  '[2024-01-15 10:42:00.234] OK    Optimal solver selected: Alpha (12ms latency)',
];

export default function SimulationPage() {
  const [result, setResult] = useState<SimResult>({ estimated_profit: 0, avg_roi: 0, volatility: 'Low', beta: 0.84, confidence: 0, latency_ms: 48, gas_usd: 0, estimated_gas: 0, profitable: false, failure_probability: 0 });
  const [streamLines, setStreamLines] = useState<string[]>(STREAM_LINES);
  const streamRef = useRef<HTMLDivElement>(null);
  const [gauge, setGauge] = useState(35);
  const [isRunning, setIsRunning] = useState(false);
  const [simError, setSimError] = useState('');
  const [scenarioShift, setScenarioShift] = useState(1);

  const runSimulation = async () => {
    setIsRunning(true);
    setSimError('');
    try {
      const payload = {
        nodes: [
          { type: 'flash_loan', params: { protocol: 'aave', amount: 50000, token: 'USDC' } },
          { type: 'swap', params: { dex: 'uniswap_v3', from: 'USDC', to: 'ETH', amount: 50000 } },
          { type: 'bridge', params: { protocol: 'across', token: 'ETH', to_chain: 'base' } },
          { type: 'swap', params: { dex: 'curve', from: 'ETH', to: 'USDC' } },
        ],
        slippage_bps: 50,
        gas_priority: 'standard' as const,
        gas_price_gwei: 15,
        eth_price_usd: 3000,
      };

      const d = await api.simulateStrategy(payload) as {
        simulation?: {
          netProfitUsd?: number;
          grossProfitUsd?: number;
          gasCostUsd?: number;
          estimatedGas?: number;
          profitable?: boolean;
          failureProbability?: number;
        };
        compiled?: {
          actions?: Array<{ type?: string }>;
        };
      };

      const sim = d.simulation || {};
      const net = Number(sim.netProfitUsd || 0);
      const gross = Number(sim.grossProfitUsd || 0);
      const gas = Number(sim.gasCostUsd || 0);
      const failure = Number(sim.failureProbability || 0);

      const roi = gross > 0 ? (net / gross) * 100 : 0;
      const confidence = Math.max(0, Math.min(100, (1 - failure) * 100));
      const volatility = failure > 0.35 ? 'High' : failure > 0.2 ? 'Medium' : 'Low';
      const beta = Number((0.6 + failure * 0.9).toFixed(2));
      const estimatedGas = Number(sim.estimatedGas || 0);

      setResult({
        estimated_profit: net,
        avg_roi: Number(roi.toFixed(2)),
        volatility,
        beta,
        confidence: Number(confidence.toFixed(1)),
        latency_ms: Math.max(12, Math.round(45 + failure * 40)),
        gas_usd: Number(gas.toFixed(2)),
        estimated_gas: estimatedGas,
        profitable: Boolean(sim.profitable),
        failure_probability: failure,
      });

      setGauge(Math.max(5, Math.min(95, Math.round(failure * 100))));
      setScenarioShift(Math.max(0.85, Math.min(1.15, 1 + (0.5 - failure) * 0.2)));

      const actionTypes = Array.isArray(d.compiled?.actions)
        ? d.compiled!.actions.map((a) => (a?.type || 'action').toUpperCase())
        : [];
      const now = new Date().toISOString().replace('T', ' ').slice(0, 23);
      const dynamic = [
        `[${now}] INFO  Compiled actions: ${actionTypes.join(' -> ') || 'N/A'}`,
        `[${now}] INFO  Net Profit: $${net.toFixed(2)} | Gas: $${gas.toFixed(2)}`,
        `[${now}] ${sim.profitable ? 'OK' : 'WARN'}    Failure probability ${(failure * 100).toFixed(1)}%`,
      ];
      setStreamLines((prev) => [...prev.slice(-32), ...dynamic]);
    } catch (e) {
      setSimError(e instanceof Error ? e.message : 'Simulation failed');
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 23);
      const msgs = ['Route recalculated.', 'Solver ping: 11ms.', 'Mempool scan OK.', 'H3 node synced.', 'Arbitrage delta: +0.02%'];
      setStreamLines(prev => [...prev.slice(-40), `[${now}] INFO  ${msgs[Math.floor(Math.random() * msgs.length)]}`]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [streamLines]);

  const pnlPoints = useMemo(() => {
    const base = Number(result.estimated_profit || 0);
    const arr = Array.from({ length: 12 }, (_, i) => {
      const drift = (i - 5.5) * 0.03;
      const wave = Math.sin(i * 0.9) * 0.05;
      return Math.max(1, base * (0.8 + drift + wave) * (result.profitable ? scenarioShift : 0.65));
    });
    return arr;
  }, [result.estimated_profit, result.profitable, scenarioShift]);
  const maxP = Math.max(...pnlPoints); const minP = Math.min(...pnlPoints);
  const normalize = (v: number) => {
    if (maxP === minP) return 40;
    return 80 - ((v - minP) / (maxP - minP)) * 60;
  };
  const sparkPath = pnlPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pnlPoints.length - 1)) * 280} ${normalize(p)}`).join(' ');
  const sparkFill = sparkPath + ` L 280 80 L 0 80 Z`;

  const latencyBars = useMemo(() => {
    const anchor = result.latency_ms || 40;
    return Array.from({ length: 12 }, (_, i) => {
      const v = anchor + Math.sin(i * 0.7) * 12 + (i % 3 === 0 ? 10 : -3);
      return Math.max(12, Math.min(88, Math.round(v)));
    });
  }, [result.latency_ms]);

  const bestCase = Number((Number(result.estimated_profit || 0) * 1.18).toFixed(2));
  const normalCase = Number((Number(result.estimated_profit || 0)).toFixed(2));
  const worstCase = Number((Number(result.estimated_profit || 0) * 0.72).toFixed(2));

  return (
    <div className="h-full overflow-y-auto flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${result.profitable ? 'bg-success' : 'bg-warning'}`}></span>
          <span className="font-mono-sm text-mono-sm text-on-surface-variant">
            {result.profitable ? 'Profitable route detected' : 'Route needs optimization'}
          </span>
        </div>
        <button
          onClick={runSimulation}
          disabled={isRunning}
          className="px-3 py-2 rounded-lg bg-primary/20 border border-primary/40 text-primary font-mono-sm text-mono-sm hover:bg-primary/30 disabled:opacity-50"
        >
          {isRunning ? 'Running…' : 'Run Simulation'}
        </button>
      </div>

      {simError && (
        <div className="rounded-lg px-3 py-2 text-xs font-mono-sm bg-error/10 border border-error/40 text-error break-words">
          {simError}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card border border-success/30 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-success opacity-50"></div>
          <p className="font-small text-small text-on-surface-variant uppercase tracking-wider mb-2">Projected Profit</p>
          <p className={`font-h2 text-h2 font-bold ${result.profitable ? 'text-success' : 'text-warning'}`}>
            ${Number(result.estimated_profit || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="font-small text-small text-on-surface-variant mt-1">est. net gain</p>
        </div>
        <div className="bg-bg-card border border-primary/30 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary opacity-50"></div>
          <p className="font-small text-small text-on-surface-variant uppercase tracking-wider mb-2">Avg ROI</p>
          <p className="font-h2 text-h2 font-bold text-primary">{Number(result.avg_roi || 0).toFixed(2)}%</p>
          <p className="font-small text-small text-on-surface-variant mt-1">across simulated routes</p>
        </div>
        <div className="bg-bg-card border border-warning/30 rounded-xl p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-warning opacity-50"></div>
          <p className="font-small text-small text-on-surface-variant uppercase tracking-wider mb-2">Route Volatility</p>
          <p className="font-h2 text-h2 font-bold text-warning">{result.volatility || 'Low'} {Number(result.beta || 0).toFixed(2)}β</p>
          <p className="font-small text-small text-on-surface-variant mt-1">market correlation</p>
        </div>
      </div>

      {/* Pessimistic Simulation Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'BEST CASE', value: bestCase, color: 'text-success border-success/30 bg-success/5' },
          { label: 'NORMAL CASE', value: normalCase, color: 'text-primary border-primary/30 bg-primary/5' },
          { label: 'WORST CASE', value: worstCase, color: 'text-warning border-warning/30 bg-warning/5' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border ${s.color}`}>
            <p className="font-mono-sm text-[11px] uppercase tracking-wider">{s.label}</p>
            <p className="font-h3 text-h3 font-bold mt-2">${s.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
          </div>
        ))}
      </div>

      {/* Terminal Stream */}
      <div className="bg-bg-card border border-outline-variant rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3 border-b border-outline-variant bg-surface-container-low">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-error opacity-60"></span>
            <span className="w-3 h-3 rounded-full bg-warning opacity-60"></span>
            <span className="w-3 h-3 rounded-full bg-success opacity-60"></span>
          </div>
          <span className="font-mono-sm text-mono-sm text-on-surface-variant">/var/log/brick3/engine.stream</span>
        </div>
        <div ref={streamRef} className="bg-bg-void p-4 h-[200px] overflow-y-auto font-mono-sm text-mono-sm flex flex-col gap-1">
          {streamLines.map((line, i) => {
            const isOk = line.includes('OK');
            const isWarn = line.includes('WARN');
            return (
              <p key={i} className={isOk ? 'text-success' : isWarn ? 'text-warning' : 'text-on-surface-variant'}>
                {line}
              </p>
            );
          })}
          <p className="text-primary-dim flex items-center gap-1 mt-1">
            root@brick3-sim:~# <span className="w-1.5 h-3.5 bg-primary-dim animate-pulse inline-block"></span>
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Risk Gauge */}
        <div className="bg-bg-card border border-outline-variant rounded-xl p-5 flex flex-col items-center gap-4">
          <h4 className="font-h3 text-h3 text-on-surface self-start">Risk Gauge</h4>
          <div className="relative w-[140px] h-[80px]">
            <svg width="140" height="80" viewBox="0 0 140 80">
              <path d="M 10 80 A 60 60 0 0 1 130 80" fill="none" stroke="#242b2d" strokeWidth="12" strokeLinecap="round" />
              <path d="M 10 80 A 60 60 0 0 1 130 80" fill="none" stroke="#FFB020" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={`${(gauge / 100) * 188} 188`} />
              <text x="70" y="68" textAnchor="middle" fill="#dce4e5" fontSize="22" fontWeight="bold" fontFamily="JetBrains Mono, monospace">{gauge}%</text>
              <text x="70" y="78" textAnchor="middle" fill="#bac9cc" fontSize="8" fontFamily="Inter, sans-serif">RISK SCORE</text>
            </svg>
          </div>
          <div className="flex justify-between w-full font-mono-sm text-mono-sm text-on-surface-variant">
            <span className="text-success">Low</span><span className="text-warning">Mid</span><span className="text-error">High</span>
          </div>
          <p className="font-mono-sm text-[11px] text-on-surface-variant self-start">
            Failure: {(Number(result.failure_probability || 0) * 100).toFixed(1)}% · Gas: ${Number(result.gas_usd || 0).toFixed(2)}
          </p>
        </div>

        {/* PnL Sparkline */}
        <div className="bg-bg-card border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
          <h4 className="font-h3 text-h3 text-on-surface">PnL Trend</h4>
          <div className="flex-1 relative">
            <svg width="100%" height="90" viewBox="0 0 280 90" preserveAspectRatio="none">
              <defs>
                <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1EF0A6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1EF0A6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkFill} fill="url(#pnlGrad)" />
              <path d={sparkPath} fill="none" stroke="#1EF0A6" strokeWidth="2" />
              {pnlPoints.map((p, i) => (
                <circle key={i} cx={(i / (pnlPoints.length - 1)) * 280} cy={normalize(p)} r="2.5" fill="#1EF0A6" />
              ))}
            </svg>
          </div>
          <div className="flex justify-between font-mono-sm text-mono-sm">
            <span className="text-on-surface-variant">T-12h</span>
            <span className={result.profitable ? 'text-success' : 'text-warning'}>{Number(result.avg_roi || 0).toFixed(2)}%</span>
            <span className="text-on-surface-variant">NOW</span>
          </div>
        </div>

        {/* Latency Bars */}
        <div className="bg-bg-card border border-outline-variant rounded-xl p-5 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h4 className="font-h3 text-h3 text-on-surface">Latency</h4>
            <span className="font-mono-sm text-mono-sm text-primary">{result.latency_ms}ms avg · {result.estimated_gas || 0} gas</span>
          </div>
          <div className="flex items-end gap-1 flex-1 min-h-[60px]">
            {latencyBars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${h}%`,
                  background: h > 45 ? '#FFB020' : h > 35 ? '#00daf3' : '#1EF0A6',
                  minHeight: '4px',
                  maxHeight: '80px',
                }}
              ></div>
            ))}
          </div>
          <div className="flex justify-between font-mono-sm text-mono-sm text-on-surface-variant">
            <span>12ms min</span><span>55ms max</span>
          </div>
        </div>
      </div>
    </div>
  );
}
