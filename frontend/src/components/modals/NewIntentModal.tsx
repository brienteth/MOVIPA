import React, { useState } from 'react';
import { API_BASE } from '../../lib/api';

interface SimResult {
  estimated_profit?: number;
  latency?: number;
  confidence?: number;
}

const TEMPLATES = [
  'Flash loan arbitrage',
  'Yield route optimize',
  'Liquidate position',
];

export default function NewIntentModal({ onClose }: { onClose: () => void }) {
  const [intent, setIntent] = useState('');
  const [capital, setCapital] = useState('1000');
  const [risk, setRisk] = useState(50);
  const [simResult, setSimResult] = useState<SimResult>({
    estimated_profit: 42.5,
    latency: 120,
    confidence: 94,
  });
  const [compilerLines, setCompilerLines] = useState<string[]>([
    '> Parsing Intent...',
    '> Detecting protocols: Uniswap V3, Aave V3',
    '> Mapping H3 nodes [0x8f2a...c91]',
  ]);
  const [loading, setLoading] = useState(false);

  const compile = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    setCompilerLines(['> Compiling intent...']);
    try {
      const res = await fetch(`${API_BASE}/api/v2/strategy/compile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, capital: parseFloat(capital), risk_tolerance: risk / 100 }),
      });
      const data = await res.json();
      setCompilerLines([
        '> Intent compiled successfully.',
        `> Strategy: ${data.strategy || 'SWAP_ROUTE'}`,
        `> Nodes: ${data.nodes?.length || 3} H3 nodes mapped.`,
      ]);
      // Simulate
      const simRes = await fetch(`${API_BASE}/api/v2/strategy/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, capital: parseFloat(capital) }),
      });
      const simData = await simRes.json();
      setSimResult({
        estimated_profit: simData.estimated_profit || 42.5,
        latency: simData.latency_ms || 120,
        confidence: simData.confidence ? simData.confidence * 100 : 94,
      });
    } catch {
      setCompilerLines(['> Compilation error. Check backend connection.']);
    } finally {
      setLoading(false);
    }
  };

  const execute = async () => {
    if (!intent.trim()) return;
    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/v2/intents/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, capital: parseFloat(capital), risk_tolerance: risk / 100 }),
      });
      onClose();
    } catch {
      setLoading(false);
    }
  };

  const getRiskLabel = () => {
    if (risk < 33) return 'Low';
    if (risk < 66) return 'Medium';
    return 'High';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-void/85 backdrop-blur-md p-4">
      <div className="w-full max-w-[720px] bg-bg-card border border-outline-variant rounded-xl flex flex-col shadow-2xl relative overflow-hidden max-h-[90vh]">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-40"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/50 flex-shrink-0">
          <h2 className="font-h3 text-h3 text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary-dim" style={{ fontVariationSettings: "'FILL' 1", fontSize: '24px' }}>add_circle</span>
            New Intent
          </h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 p-6 overflow-y-auto">
          {/* Step 1: Intent + Templates */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="font-small text-small text-on-surface-variant mb-2 block">1. Intent Declaration</label>
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                className="w-full h-[120px] bg-surface-container-low border border-outline-variant rounded-lg p-4 font-mono-lg text-mono-lg text-primary-fixed placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-dim transition-colors resize-none"
                placeholder="Describe your execution intent...&#10;&#10;e.g., 'Swap 100 USDC for ETH via minimal slippage route'"
              />
            </div>
            <div className="w-full md:w-[200px] flex flex-col gap-2 pt-6">
              {TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => setIntent(t)}
                  className="text-left px-3 py-2 rounded border border-outline-variant bg-surface text-small font-small text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors truncate"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Compiler */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-small text-small text-on-surface-variant block">2. Intent Compiler</label>
              <button
                onClick={compile}
                disabled={loading || !intent.trim()}
                className="text-xs px-3 py-1 rounded border border-primary-dim text-primary-dim hover:bg-primary-dim/10 transition-colors disabled:opacity-40"
              >
                {loading ? 'Compiling...' : 'Compile'}
              </button>
            </div>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-1.5 font-mono-sm text-mono-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.02)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
              {compilerLines.map((line, i) => (
                <div key={i} className="flex items-center gap-3 text-primary-dim z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-dim"></span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Params + Simulation */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 flex flex-col gap-5">
              <div>
                <label className="font-small text-small text-on-surface-variant mb-2 block">Capital Allocation</label>
                <div className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 flex items-center gap-2 focus-within:border-primary-dim transition-colors">
                  <span className="font-mono-lg text-mono-lg text-on-surface-variant">$</span>
                  <input
                    type="number"
                    value={capital}
                    onChange={(e) => setCapital(e.target.value)}
                    className="bg-transparent text-primary-fixed font-mono-lg text-mono-lg w-full outline-none"
                  />
                  <span className="font-mono-sm text-mono-sm text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded">USDC</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-small text-small text-on-surface-variant">Risk Tolerance</label>
                  <span className={`font-mono-sm text-mono-sm ${risk < 33 ? 'text-success' : risk < 66 ? 'text-warning' : 'text-error'}`}>
                    {getRiskLabel()}
                  </span>
                </div>
                <div className="relative h-2 bg-surface-variant rounded-full mt-2">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-success via-warning to-error rounded-full" style={{ width: `${risk}%` }}></div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={risk}
                    onChange={(e) => setRisk(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <div className="flex justify-between mt-1 font-small text-small text-on-surface-variant/60">
                  <span>Low</span><span>High</span>
                </div>
              </div>
            </div>

            {/* Simulation widget */}
            <div className="flex-1 bg-primary-container/5 border border-primary-container/20 rounded-lg p-4 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-container/5 to-transparent opacity-50 pointer-events-none"></div>
              <div className="flex items-center justify-between z-10 mb-4">
                <span className="font-mono-sm text-mono-sm text-primary flex items-center gap-2 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(195,245,255,0.8)]"></span>
                  0G STREAM ACTIVE
                </span>
                <span className="material-symbols-outlined text-primary/70" style={{ fontSize: '18px' }}>wifi_tethering</span>
              </div>
              <div className="grid grid-cols-2 gap-4 z-10">
                <div className="flex flex-col">
                  <span className="font-small text-small text-on-surface-variant">Est. Profit</span>
                  <span className="font-mono-lg text-mono-lg text-success mt-1">+${simResult.estimated_profit?.toFixed(2)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-small text-small text-on-surface-variant">Latency</span>
                  <span className="font-mono-lg text-mono-lg text-warning mt-1">{simResult.latency}ms</span>
                </div>
                <div className="flex flex-col col-span-2 border-t border-primary/10 pt-3 mt-1">
                  <span className="font-small text-small text-on-surface-variant">Execution Confidence</span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${simResult.confidence}%` }}></div>
                    </div>
                    <span className="font-mono-lg text-mono-lg text-primary">{simResult.confidence?.toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: mini graph + risk lock */}
          <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30">
            <div className="flex items-center justify-center flex-1 py-2">
              <div className="flex items-center gap-0">
                <div className="w-8 h-8 rounded border border-outline text-on-surface-variant flex items-center justify-center bg-surface z-10">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>account_balance_wallet</span>
                </div>
                <div className="w-8 h-[2px] bg-primary/50 relative"></div>
                <div className="w-10 h-10 rounded border border-primary text-primary flex items-center justify-center bg-surface-container shadow-[0_0_15px_rgba(0,229,255,0.15)] z-10">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>hub</span>
                </div>
                <div className="w-8 h-[2px] bg-outline-variant relative"></div>
                <div className="w-8 h-8 rounded border border-outline text-on-surface-variant flex items-center justify-center bg-surface z-10">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>swap_horiz</span>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-error-container/10 border border-error/30 rounded-lg p-3 flex items-start gap-3">
              <span className="material-symbols-outlined text-error mt-0.5" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>warning</span>
              <div className="flex flex-col">
                <span className="font-mono-sm text-mono-sm text-error mb-1">RISK LOCK</span>
                <span className="font-small text-small text-on-surface-variant leading-tight">
                  {getRiskLabel()} risk settings may encounter slippage up to {risk < 33 ? '0.1%' : risk < 66 ? '0.5%' : '1.5%'} on current H3 routes.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-outline-variant/50 bg-bg-card flex-shrink-0">
          <button
            onClick={execute}
            disabled={loading || !intent.trim()}
            className="w-full h-[48px] rounded-xl bg-gradient-to-r from-inverse-primary to-primary-container text-on-primary font-body text-body font-bold tracking-wide flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            EXECUTE INTENT
          </button>
        </div>
      </div>
    </div>
  );
}
