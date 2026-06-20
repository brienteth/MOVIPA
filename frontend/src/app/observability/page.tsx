import React, { useEffect, useState, useCallback } from 'react';
import { API_BASE } from '../../lib/api';

interface HotState {
  backend: string;
  keys: number;
  connected: boolean;
}

interface StreamLayer {
  backend: string;
  topics: Record<string, number>;
  configured_brokers: string;
}

interface PersistenceLayer {
  backend: string;
  postgres_url: string;
  clickhouse_url: string;
  log_dir: string;
}

interface SimulationCache {
  entries: unknown[];
  count: number;
}

interface SolverMemory {
  count: number;
  solvers: Record<string, unknown>;
}

interface TeeStorage {
  mode: string;
  cold_storage: string;
}

interface ChainIndexingLayer {
  stack: string[];
  supported_protocols: string[];
}

interface H3SpatialEngine {
  backend: string;
  resolution_levels: number[];
}

interface DataLayerStatus {
  hot_state: HotState;
  stream_layer: StreamLayer;
  persistence_layer: PersistenceLayer;
  simulation_cache: SimulationCache;
  solver_memory: SolverMemory;
  tee_storage: TeeStorage;
  chain_indexing_layer: ChainIndexingLayer;
  h3_spatial_engine: H3SpatialEngine;
}

interface StatusResponse {
  ok: boolean;
  data_layer: DataLayerStatus;
  timestamp: string;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-[#00FF9A]' : 'bg-[#FF4D6D]'}`}
      style={{ boxShadow: ok ? '0 0 6px #00FF9A88' : '0 0 6px #FF4D6D88' }}
    />
  );
}

function LayerCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0F1624] border border-[#3b494c] rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="material-symbols-outlined text-[#00e5ff]" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
        <span className="font-mono text-xs font-bold text-[#bac9cc] uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Chip({ label, color }: { label: string; color?: string }) {
  const bg = color === 'success' ? 'bg-[#00FF9A22] text-[#00FF9A] border-[#00FF9A44]'
    : color === 'warning' ? 'bg-[#FFB02022] text-[#FFB020] border-[#FFB02044]'
    : color === 'error' ? 'bg-[#FF4D6D22] text-[#FF4D6D] border-[#FF4D6D44]'
    : 'bg-[#00e5ff11] text-[#00e5ff] border-[#00e5ff33]';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono border ${bg}`}>
      {label}
    </span>
  );
}

function KV({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-[#bac9cc] text-xs font-mono shrink-0">{k}</span>
      <span className="text-[#dce4e5] text-xs font-mono text-right break-all">{String(v)}</span>
    </div>
  );
}

export default function ObservabilityPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v2/data-layer/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StatusResponse = await res.json();
      setStatus(data);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      fetchStatus();
      setCountdown(5);
    }, 5000);
    const tick = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 5)), 1000);
    return () => {
      clearInterval(interval);
      clearInterval(tick);
    };
  }, [fetchStatus]);

  const dl = status?.data_layer;

  return (
    <div className="h-full overflow-y-auto px-8 py-6 bg-[#05060A]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-[#dce4e5] tracking-tight">Data Layer Observability</h1>
          <p className="text-xs font-mono text-[#bac9cc] mt-0.5">
            {API_BASE}/api/v2/data-layer/status
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs font-mono text-[#bac9cc]">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <div className="flex items-center gap-2 bg-[#0F1624] border border-[#3b494c] px-3 py-1.5 rounded-lg">
            <span
              className="inline-block w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse"
              style={{ boxShadow: '0 0 6px #00e5ff88' }}
            />
            <span className="text-xs font-mono text-[#00e5ff]">Refresh in {countdown}s</span>
            <button
              onClick={() => { fetchStatus(); setCountdown(5); }}
              className="ml-1 text-[#bac9cc] hover:text-[#00e5ff] transition-colors"
              title="Refresh now"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>refresh</span>
            </button>
          </div>
          {error && <Chip label={`Error: ${error}`} color="error" />}
          {loading && !status && (
            <span className="text-xs font-mono text-[#bac9cc] animate-pulse">Loading…</span>
          )}
        </div>
      </div>

      {!dl ? (
        <div className="flex items-center justify-center h-48 text-[#bac9cc] font-mono text-sm">
          {error ? `Cannot reach backend: ${error}` : 'Connecting to data layer…'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

          {/* HOT STATE */}
          <LayerCard title="Hot State" icon="bolt">
            <div className="flex items-center gap-2">
              <StatusDot ok={dl.hot_state.connected} />
              <span className="text-xs font-mono text-[#dce4e5]">
                {dl.hot_state.connected ? 'Redis Connected' : 'Memory Fallback'}
              </span>
              <Chip label={dl.hot_state.backend} color={dl.hot_state.connected ? 'success' : 'warning'} />
            </div>
            <KV k="Active Keys" v={dl.hot_state.keys} />
          </LayerCard>

          {/* STREAM LAYER */}
          <LayerCard title="Stream Layer" icon="stream">
            <div className="flex items-center gap-2 flex-wrap">
              <Chip label={dl.stream_layer.backend} />
            </div>
            <KV k="Brokers" v={dl.stream_layer.configured_brokers} />
            <div className="mt-1">
              <p className="text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider mb-2">Topics</p>
              <div className="grid grid-cols-2 gap-1">
                {Object.entries(dl.stream_layer.topics ?? {}).map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between bg-[#151D2E] rounded px-2 py-1">
                    <span className="text-[10px] font-mono text-[#bac9cc] truncate">{topic}</span>
                    <span
                      className={`text-[10px] font-mono font-bold ml-1 ${count > 0 ? 'text-[#00FF9A]' : 'text-[#3b494c]'}`}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </LayerCard>

          {/* PERSISTENCE LAYER */}
          <LayerCard title="Persistence" icon="storage">
            <Chip label={dl.persistence_layer.backend} />
            <KV k="Postgres" v={dl.persistence_layer.postgres_url ?? '—'} />
            <KV k="ClickHouse" v={dl.persistence_layer.clickhouse_url ?? '—'} />
            <KV k="Log Dir" v={dl.persistence_layer.log_dir ?? '—'} />
          </LayerCard>

          {/* SIMULATION CACHE */}
          <LayerCard title="Simulation Cache" icon="science">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-black font-mono"
                style={{ color: dl.simulation_cache.count > 0 ? '#00FF9A' : '#3b494c' }}
              >
                {dl.simulation_cache.count}
              </span>
              <span className="text-xs font-mono text-[#bac9cc]">entries cached</span>
            </div>
            {dl.simulation_cache.count === 0 && (
              <p className="text-[11px] font-mono text-[#3b494c]">No simulations cached</p>
            )}
          </LayerCard>

          {/* SOLVER MEMORY */}
          <LayerCard title="Solver Memory" icon="memory">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-black font-mono"
                style={{ color: dl.solver_memory.count > 0 ? '#B56CFF' : '#3b494c' }}
              >
                {dl.solver_memory.count}
              </span>
              <span className="text-xs font-mono text-[#bac9cc]">active solvers</span>
            </div>
            {Object.keys(dl.solver_memory.solvers ?? {}).length > 0 ? (
              <div className="flex flex-col gap-1">
                {Object.entries(dl.solver_memory.solvers).map(([id, info]) => (
                  <div key={id} className="bg-[#151D2E] rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-xs font-mono text-[#B56CFF]">{id}</span>
                    <span className="text-[10px] font-mono text-[#bac9cc] truncate ml-2">
                      {JSON.stringify(info).slice(0, 40)}…
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] font-mono text-[#3b494c]">No solvers registered</p>
            )}
          </LayerCard>

          {/* TEE STORAGE */}
          <LayerCard title="TEE Storage" icon="lock">
            <div className="flex items-center gap-2">
              <StatusDot ok={true} />
              <Chip label={dl.tee_storage.mode} color="success" />
            </div>
            <KV k="Cold Storage" v={dl.tee_storage.cold_storage} />
          </LayerCard>

          {/* CHAIN INDEXING */}
          <LayerCard title="Chain Indexing" icon="link">
            {dl.chain_indexing_layer?.stack?.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {dl.chain_indexing_layer.stack.map((s) => (
                  <Chip key={s} label={s} />
                ))}
              </div>
            ) : (
              <p className="text-[11px] font-mono text-[#3b494c]">No indexers configured</p>
            )}
            {dl.chain_indexing_layer?.supported_protocols?.length > 0 && (
              <>
                <p className="text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider mt-1">Protocols</p>
                <div className="flex flex-wrap gap-1">
                  {dl.chain_indexing_layer.supported_protocols.map((p) => (
                    <Chip key={p} label={p} color="warning" />
                  ))}
                </div>
              </>
            )}
          </LayerCard>

          {/* H3 SPATIAL ENGINE */}
          <LayerCard title="H3 Spatial Engine" icon="hexagon">
            <Chip label={dl.h3_spatial_engine?.backend ?? 'unknown'} />
            {dl.h3_spatial_engine?.resolution_levels?.length > 0 && (
              <>
                <p className="text-[10px] font-mono text-[#bac9cc] uppercase tracking-wider mt-1">Resolution Levels</p>
                <div className="flex flex-wrap gap-1">
                  {dl.h3_spatial_engine.resolution_levels.map((r) => (
                    <span key={r} className="text-[11px] font-mono text-[#1EF0A6] bg-[#1EF0A611] border border-[#1EF0A633] rounded px-1.5 py-0.5">
                      R{r}
                    </span>
                  ))}
                </div>
              </>
            )}
          </LayerCard>

        </div>
      )}

      {/* Timestamp footer */}
      {status?.timestamp && (
        <p className="mt-6 text-center text-[10px] font-mono text-[#3b494c]">
          Last payload: {status.timestamp}
        </p>
      )}
    </div>
  );
}
