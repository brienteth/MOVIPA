import React, { useMemo, useState } from 'react';
import { api } from '../../lib/api';

const TEMPLATES = [
  {
    title: 'Flash Loan Arbitrage',
    desc: 'Borrow, swap, repay in one atomic transaction using H3 routing.',
    badge: 'h3-cell',
    badgeColor: 'text-h3-cell border-h3-cell/40',
    intent: 'Flash loan $50,000 USDC, arbitrage ETH/USDC spread on Uniswap V3 and Curve, repay in same block',
  },
  {
    title: 'Optimized Bridge & Swap',
    desc: 'Cross-chain bridging with minimal slippage via solver mesh.',
    badge: 'solver-mid',
    badgeColor: 'text-solver-mid border-solver-mid/40',
    intent: 'Bridge 10 ETH from Arbitrum to Base, swap to USDC with max 0.1% slippage via solver mesh',
  },
  {
    title: 'Yield Position Liquidation',
    desc: 'Monitor and liquidate undercollateralized positions.',
    badge: 'warning',
    badgeColor: 'text-warning border-warning/40',
    intent: 'Monitor Aave V3 positions with HF < 1.05, liquidate the most profitable using H3 flash loans',
  },
];

export default function IntentsPage() {
  const [intent, setIntent] = useState('');
  const [capital, setCapital] = useState('1000');
  const [risk, setRisk] = useState(40);
  const [graphState, setGraphState] = useState<'empty' | 'loading' | 'ready'>('empty');
  const [publishStatus, setPublishStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [parsedWorkflow, setParsedWorkflow] = useState<Array<{ action: string; chain?: string }>>([]);
  const [compiledSummary, setCompiledSummary] = useState<{ actionsCount: number; warnings: string[] }>({
    actionsCount: 0,
    warnings: [],
  });
  const [publishSummary, setPublishSummary] = useState<{
    intentId?: string;
    solverId?: string;
    routeKey?: string;
    expectedProfit?: number;
  }>({});

  const riskLevel = useMemo(() => (risk < 33 ? 'low' : risk < 66 ? 'medium' : 'high'), [risk]);

  const buildNodesFromWorkflow = (steps: Array<{ action?: string; chain?: string; protocol?: string; params?: Record<string, unknown> }>) =>
    steps.map((step, idx) => ({
      type: (step.action || 'action').toLowerCase(),
      params: {
        ...(step.params || {}),
        chain: step.chain,
        protocol: step.protocol,
        order: idx,
      },
    }));

  const makeStrategyHash = (raw: string) => {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 40);
    return `strat_${normalized}_${Date.now()}`;
  };

  const generateWorkflow = async () => {
    if (!intent.trim()) return;
    setGraphState('loading');
    setError('');
    try {
      const parsed = await api.parseIntent({
        intent,
        max_usdc: Number(capital) || 1000,
        risk_tolerance: riskLevel,
      });

      const steps = Array.isArray((parsed as { steps?: Array<{ action: string; chain?: string }> }).steps)
        ? ((parsed as { steps: Array<{ action: string; chain?: string }> }).steps)
        : [];
      setParsedWorkflow(steps);

      const nodes = buildNodesFromWorkflow(steps as Array<{ action?: string; chain?: string; protocol?: string; params?: Record<string, unknown> }>);
      const compiled = await api.compileStrategy({
        nodes,
        slippage_bps: 50,
        gas_priority: risk > 66 ? 'high' : risk < 33 ? 'low' : 'standard',
      });

      const warnings = Array.isArray((compiled as { warnings?: Array<{ message?: string }> }).warnings)
        ? ((compiled as { warnings: Array<{ message?: string }> }).warnings.map((w) => w.message || 'Unknown warning'))
        : [];

      setCompiledSummary({
        actionsCount: Array.isArray((compiled as { actions?: unknown[] }).actions)
          ? ((compiled as { actions: unknown[] }).actions.length)
          : nodes.length,
        warnings,
      });
      setGraphState('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Workflow generation failed');
      setGraphState('empty');
    }
  };

  const publish = async () => {
    if (!intent.trim() || graphState !== 'ready') return;
    setPublishStatus('publishing');
    setError('');
    try {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        user: 'demo-user',
        strategy_hash: makeStrategyHash(intent),
        chain: 'base',
        notional_usdc: Number(capital) || 1000,
        min_profit_usdc: Math.max(10, Math.floor((Number(capital) || 1000) * 0.003)),
        max_slippage_bps: risk > 66 ? 120 : risk < 33 ? 30 : 60,
        deadline_ts: now + 900,
        nonce: now,
        intent_stake_score: Number((risk / 100).toFixed(2)),
      };

      const result = await api.publishIntent(payload);
      const typed = result as {
        intent?: { intent_id?: string };
        top_solver?: { solver?: { solver_id?: string } };
        prewarmed_route?: { route_key?: string; expected_profit_usdc?: number };
      };

      setPublishSummary({
        intentId: typed.intent?.intent_id,
        solverId: typed.top_solver?.solver?.solver_id,
        routeKey: typed.prewarmed_route?.route_key,
        expectedProfit: typed.prewarmed_route?.expected_profit_usdc,
      });

      setPublishStatus('published');
      setTimeout(() => setPublishStatus(''), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
      setPublishStatus('error');
      setTimeout(() => setPublishStatus(''), 3000);
    }
  };

  const getRiskLabel = () => risk < 33 ? 'Low' : risk < 66 ? 'Medium' : 'High';
  const getRiskColor = () => risk < 33 ? 'text-success' : risk < 66 ? 'text-warning' : 'text-error';

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Panel: Parameters */}
      <div className="w-[400px] flex-shrink-0 bg-bg-raised border-r border-outline-variant flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="font-h3 text-h3 text-on-surface font-semibold">Intent Parameters</h3>
          <p className="font-small text-small text-on-surface-variant mt-1">Define your execution strategy in natural language</p>
        </div>
        <div className="flex-1 p-5 flex flex-col gap-5">
          <div>
            <label className="font-small text-small text-on-surface-variant block mb-2">Intent Declaration</label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              className="w-full h-[150px] bg-surface-container-low border border-outline-variant rounded-lg p-4 font-mono-sm text-mono-sm text-primary-fixed placeholder-on-surface-variant/50 focus:outline-none focus:border-primary-dim transition-colors resize-none"
              placeholder="Describe your execution intent in natural language..."
            />
          </div>
          <div>
            <label className="font-small text-small text-on-surface-variant block mb-2">Capital Allocation (USDC)</label>
            <div className="bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2.5 flex items-center gap-2 focus-within:border-primary-dim transition-colors">
              <span className="text-on-surface-variant font-mono-lg text-mono-lg">$</span>
              <input
                type="number"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                className="bg-transparent flex-1 text-primary-fixed font-mono-lg text-mono-lg outline-none"
              />
              <span className="font-mono-sm text-mono-sm text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded text-xs">USDC</span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <label className="font-small text-small text-on-surface-variant">Risk Tolerance</label>
              <span className={`font-mono-sm text-mono-sm ${getRiskColor()}`}>{getRiskLabel()} ({risk})</span>
            </div>
            <div className="relative h-2 bg-surface-variant rounded-full">
              <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-success via-warning to-error rounded-full" style={{ width: `${risk}%` }}></div>
              <input type="range" min={0} max={100} value={risk} onChange={(e) => setRisk(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <div className="flex justify-between mt-1 font-small text-small text-on-surface-variant/60">
              <span>Conservative</span><span>Aggressive</span>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-outline-variant space-y-3">
          <button
            onClick={generateWorkflow}
            disabled={!intent.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-inverse-primary to-primary-container text-on-primary font-body text-body font-bold tracking-wide flex items-center justify-center gap-2 shadow-primary-glow hover:brightness-110 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_tree</span>
            GENERATE_WORKFLOW
          </button>
          {graphState === 'ready' && (
            <button
              onClick={publish}
              disabled={publishStatus === 'publishing'}
              className="w-full py-2.5 rounded-xl border border-success text-success hover:bg-success/10 font-body text-body font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>send</span>
              {publishStatus === 'publishing' ? 'Publishing...' : publishStatus === 'published' ? 'Published!' : 'Publish Intent'}
            </button>
          )}

          {error && (
            <div className="rounded-lg px-3 py-2 text-xs font-mono-sm bg-error/10 border border-error/40 text-error break-words">
              {error}
            </div>
          )}

          {graphState === 'ready' && (
            <div className="rounded-lg border border-outline-variant p-3 bg-bg-card/50 space-y-1">
              <p className="font-mono-sm text-[11px] text-on-surface-variant uppercase tracking-wider">Compile Summary</p>
              <p className="font-mono-sm text-mono-sm text-on-surface">Actions: {compiledSummary.actionsCount}</p>
              <p className="font-mono-sm text-mono-sm text-on-surface">Workflow steps: {parsedWorkflow.length}</p>
              {compiledSummary.warnings.length > 0 ? (
                <ul className="list-disc pl-4 text-warning text-xs font-mono-sm">
                  {compiledSummary.warnings.slice(0, 3).map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              ) : (
                <p className="font-mono-sm text-[11px] text-success">No compile warnings</p>
              )}
            </div>
          )}

          {publishSummary.intentId && (
            <div className="rounded-lg border border-success/30 p-3 bg-success/5 space-y-1">
              <p className="font-mono-sm text-[11px] text-success uppercase tracking-wider">Published</p>
              <p className="font-mono-sm text-xs text-on-surface">Intent: {publishSummary.intentId}</p>
              <p className="font-mono-sm text-xs text-on-surface">Solver: {publishSummary.solverId || 'pending'}</p>
              <p className="font-mono-sm text-xs text-on-surface">Route: {publishSummary.routeKey || 'pending'}</p>
              {typeof publishSummary.expectedProfit === 'number' && (
                <p className="font-mono-sm text-xs text-success">Expected Profit: ${publishSummary.expectedProfit.toFixed(2)}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Panel: Templates */}
      <div className="w-[340px] flex-shrink-0 bg-bg-surface border-r border-outline-variant flex flex-col overflow-y-auto">
        <div className="p-5 border-b border-outline-variant">
          <h3 className="font-h3 text-h3 text-on-surface font-semibold">Example Templates</h3>
          <p className="font-small text-small text-on-surface-variant mt-1">Click to use as starting point</p>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => {
                setIntent(t.intent);
                setGraphState('empty');
                setPublishSummary({});
              }}
              className="text-left bg-bg-card border border-outline-variant rounded-xl p-4 hover:border-primary/50 hover:bg-surface-container-low transition-all group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-body text-body text-on-surface font-semibold group-hover:text-primary transition-colors">{t.title}</h4>
                <span className={`font-mono-sm text-[10px] border px-1.5 py-0.5 rounded shrink-0 ${t.badgeColor}`}>{t.badge}</span>
              </div>
              <p className="font-small text-small text-on-surface-variant leading-relaxed">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Graph Preview */}
      <div className="flex-1 bg-bg-void relative overflow-hidden flex flex-col">
        <div className="p-5 border-b border-outline-variant bg-bg-card/50 flex justify-between items-center">
          <h3 className="font-h3 text-h3 text-on-surface font-semibold">Graph Preview</h3>
          <span className={`font-mono-sm text-mono-sm ${graphState === 'ready' ? 'text-success' : 'text-on-surface-variant'}`}>
            {graphState === 'loading' ? 'Compiling...' : graphState === 'ready' ? 'Compiled' : 'Awaiting input'}
          </span>
        </div>
        <div className="flex-1 relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 50%, #0A1220 0%, #05060A 100%)' }}>
          {/* Grid dots */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, #3b494c 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}></div>

          {graphState === 'empty' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 opacity-40">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: '64px' }}>account_tree</span>
              <p className="font-body text-body text-on-surface-variant">Define intent and click Generate Workflow</p>
            </div>
          )}

          {graphState === 'loading' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-mono-sm text-mono-sm text-primary-dim">Compiling intent graph...</p>
            </div>
          )}

          {graphState === 'ready' && (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <line x1="70" y1="100" x2="160" y2="60" stroke="#3b494c" strokeWidth="1.5" strokeDasharray="5 3" />
              <line x1="70" y1="100" x2="160" y2="140" stroke="#3b494c" strokeWidth="1.5" strokeDasharray="5 3" />
              <line x1="160" y1="60" x2="280" y2="100" stroke="#3b494c" strokeWidth="1.5" strokeDasharray="5 3" />
              <line x1="160" y1="140" x2="280" y2="100" stroke="#3b494c" strokeWidth="1.5" strokeDasharray="5 3" />
              {[
                { x: 70, y: 100, label: 'INTENT', color: '#00e5ff' },
                { x: 160, y: 60, label: `${Math.max(1, parsedWorkflow.length)} STEP`, color: '#1EF0A6' },
                { x: 160, y: 140, label: `A${compiledSummary.actionsCount}`, color: '#B56CFF' },
                { x: 280, y: 100, label: 'EXEC', color: '#00e5ff' },
              ].map((n, i) => (
                <g key={i}>
                  <circle cx={n.x} cy={n.y} r="28" fill={n.color} opacity="0.08" />
                  <circle cx={n.x} cy={n.y} r="18" fill="#0F1624" stroke={n.color} strokeWidth="1.5" />
                  <text x={n.x} y={n.y + 4} textAnchor="middle" fill={n.color} fontSize="7" fontFamily="JetBrains Mono, monospace">{n.label}</text>
                </g>
              ))}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
