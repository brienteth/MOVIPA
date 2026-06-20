import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/api';

interface RPCResult {
  name: string;
  avg_ms: number | null;
  min_ms: number | null;
  p50_ms: number | null;
  block_number: number | null;
  status: 'ok' | 'error';
  error?: string;
}

interface BenchmarkData {
  benchmark_time_ms: number;
  timestamp: string;
  brick3_scan_ms: number;
  brick3_opportunities_found: number;
  connected_chains: string[];
  rpc_latency: {
    results: RPCResult[];
    fastest_rpc: RPCResult | null;
    brick3_avg_ms: number | null;
    competitor_avg_ms: number | null;
    brick3_advantage_pct: number | null;
  };
  dex_api_latency: {
    results: Array<{
      name: string;
      description: string;
      avg_ms: number | null;
      min_ms: number | null;
      status_code: number;
      status: string;
    }>;
  };
  opportunity_speed: {
    brick3: {
      scan_interval_ms: number;
      chains_monitored: number;
      estimated_detection_ms: number;
      description: string;
    };
    competitors: Record<string, {
      scan_interval_ms: number;
      chains_monitored: number;
      cross_chain: boolean;
      estimated_detection_ms: number;
      description: string;
    }>;
  };
  summary: {
    findings: string[];
    fastest_overall_rpc: string | null;
    fastest_overall_ms: number | null;
    brick3_unique_advantages: string[];
  };
}

const CHAIN_COLORS: Record<string, string> = {
  ethereum: 'bg-blue-500',
  base:     'bg-blue-400',
  arbitrum: 'bg-orange-500',
  optimism: 'bg-red-500',
  polygon:  'bg-purple-500',
};

function LatencyBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full bg-gray-700 rounded h-2">
      <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Badge({ text, green }: { text: string; green?: boolean }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono ${green ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}`}>
      {text}
    </span>
  );
}

export default function BenchmarkPanel() {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRun, setLastRun] = useState<string | null>(null);

  const runBenchmark = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get<BenchmarkData>(`${API_BASE}/api/v2/benchmark`);
      setData(res.data);
      setLastRun(new Date().toLocaleTimeString());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runBenchmark(); }, []);

  const maxRpcMs = data
    ? Math.max(...data.rpc_latency.results.filter(r => r.avg_ms).map(r => r.avg_ms!), 1)
    : 1;

  const isbrick3 = (name: string) =>
    name.startsWith('Brick3/');

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Competitor Benchmark</h2>
          <p className="text-gray-400 text-sm mt-1">
            Brick3 vs 1inch · Paraswap · 0x · Flashbots · KyberSwap
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && <span className="text-gray-500 text-xs">Last: {lastRun}</span>}
          <button
            onClick={runBenchmark}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium"
          >
            {loading ? '⏳ Benchmarking...' : '🔄 Retest'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300 text-sm">{error}</div>
      )}

      {loading && !data && (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-4">⚡</div>
          <p>Testing all competitors...</p>
          <p className="text-sm mt-1">Measuring RPC latency, DEX API, and opportunity speed</p>
        </div>
      )}

      {data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Brick3 Scan Speed</div>
              <div className="text-2xl font-bold text-green-400">{data.brick3_scan_ms.toFixed(1)} ms</div>
              <div className="text-gray-500 text-xs mt-1">{data.brick3_opportunities_found} opportunities</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Fastest RPC</div>
              <div className="text-2xl font-bold text-blue-400">{data.rpc_latency.fastest_rpc?.avg_ms ?? '–'} ms</div>
              <div className="text-gray-500 text-xs mt-1 truncate">{data.rpc_latency.fastest_rpc?.name}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Connected Chains</div>
              <div className="text-2xl font-bold text-purple-400">{data.connected_chains.length}</div>
              <div className="text-gray-500 text-xs mt-1">{data.connected_chains.join(', ')}</div>
            </div>
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Benchmark Duration</div>
              <div className="text-2xl font-bold text-yellow-400">{(data.benchmark_time_ms / 1000).toFixed(1)} s</div>
              <div className="text-gray-500 text-xs mt-1">all competitors</div>
            </div>
          </div>

          {/* RPC Latency Race */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-semibold mb-4">⚡ RPC Latency Race</h3>
            <div className="space-y-3">
              {data.rpc_latency.results
                .filter(r => r.status === 'ok' && r.avg_ms)
                .sort((a, b) => (a.avg_ms ?? 999) - (b.avg_ms ?? 999))
                .map((rpc, idx) => (
                  <div key={rpc.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-4 text-right">{idx + 1}</span>
                        <span className={`font-medium ${isbrick3(rpc.name) ? 'text-green-400' : 'text-gray-300'}`}>
                          {rpc.name}
                          {isbrick3(rpc.name) && <span className="ml-1 text-xs text-green-600">●</span>}
                        </span>
                        {rpc.block_number && (
                          <Badge text={`blk ${rpc.block_number.toLocaleString()}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="text-gray-500">min {rpc.min_ms}ms</span>
                        <span className={`font-bold ${isbrick3(rpc.name) ? 'text-green-400' : 'text-white'}`}>
                          avg {rpc.avg_ms}ms
                        </span>
                      </div>
                    </div>
                    <LatencyBar
                      value={rpc.avg_ms!}
                      max={maxRpcMs}
                      color={isbrick3(rpc.name) ? 'bg-green-500' : 'bg-blue-600'}
                    />
                  </div>
                ))}
              {data.rpc_latency.results.filter(r => r.status === 'error').map(r => (
                <div key={r.name} className="flex items-center justify-between text-sm text-gray-600">
                  <span>{r.name}</span>
                  <span className="text-red-800 text-xs">timeout</span>
                </div>
              ))}
            </div>
            {data.rpc_latency.brick3_advantage_pct !== null && (
              <div className={`mt-4 p-3 rounded-lg text-sm ${
                data.rpc_latency.brick3_advantage_pct > 0
                  ? 'bg-green-900/30 text-green-300'
                  : 'bg-yellow-900/30 text-yellow-300'
              }`}>
                {data.rpc_latency.brick3_advantage_pct > 0
                  ? `✓ Brick3 is ${data.rpc_latency.brick3_advantage_pct}% faster than competitors`
                  : `⚠ Competitor RPCs are ${Math.abs(data.rpc_latency.brick3_advantage_pct)}% faster — dedicated node recommended`
                }
                {' '}<span className="text-gray-500 text-xs">(Brick3 avg: {data.rpc_latency.brick3_avg_ms}ms · Competitor avg: {data.rpc_latency.competitor_avg_ms}ms)</span>
              </div>
            )}
          </div>

          {/* Opportunity Detection Speed */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-semibold mb-4">🎯 Opportunity Detection Speed Comparison</h3>
            <div className="space-y-3">
              {/* Brick3 */}
              <div className="border border-green-700/50 rounded-lg p-4 bg-green-900/10">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-green-400 font-bold">Brick3</span>
                    <p className="text-gray-400 text-xs mt-1">{data.opportunity_speed.brick3.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold text-lg">{data.opportunity_speed.brick3.estimated_detection_ms}ms</div>
                    <div className="text-gray-500 text-xs">{data.opportunity_speed.brick3.chains_monitored} chains · flash loan</div>
                  </div>
                </div>
                <div className="mt-2">
                  <LatencyBar value={data.opportunity_speed.brick3.scan_interval_ms} max={12000} color="bg-green-500" />
                </div>
              </div>
              {/* Competitors */}
              {Object.entries(data.opportunity_speed.competitors).map(([name, comp]) => (
                <div key={name} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-gray-300 font-medium">{name.replace(/_/g, ' ')}</span>
                      <p className="text-gray-500 text-xs mt-1">{comp.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-400 font-bold text-lg">{comp.estimated_detection_ms.toLocaleString()}ms</div>
                      <div className="text-gray-600 text-xs">
                        {comp.chains_monitored} chains · {comp.cross_chain ? '✓ cross-chain' : '✗ single chain'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <LatencyBar value={comp.scan_interval_ms} max={12000} color="bg-red-800" />
                  </div>
                  <div className="mt-2 text-xs text-yellow-600">
                    {Math.round(comp.estimated_detection_ms / data.opportunity_speed.brick3.estimated_detection_ms)}× slower than Brick3
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DEX API Latency */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-semibold mb-4">🔌 DEX API Response Times</h3>
            <div className="space-y-2">
              {data.dex_api_latency.results
                .filter(r => r.avg_ms)
                .sort((a, b) => (a.avg_ms ?? 999) - (b.avg_ms ?? 999))
                .map(api => (
                  <div key={api.name} className="flex items-center gap-4">
                    <div className="w-28 text-sm font-medium text-gray-300 capitalize">{api.name}</div>
                    <div className="flex-1">
                      <LatencyBar value={api.avg_ms!} max={700} color="bg-blue-600" />
                    </div>
                    <div className="text-xs font-mono text-gray-400 w-20 text-right">
                      {api.avg_ms}ms avg
                    </div>
                    <div className={`text-xs w-16 text-right ${api.status_code === 200 ? 'text-green-500' : 'text-gray-600'}`}>
                      HTTP {api.status_code}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <h3 className="text-lg font-semibold mb-3">📊 Evaluation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Findings</h4>
                <ul className="space-y-2">
                  {data.summary.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-yellow-500 mt-0.5">→</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-gray-400 text-sm mb-2">Brick3 Advantages</h4>
                <ul className="space-y-2">
                  {data.summary.brick3_unique_advantages.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-green-300">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
