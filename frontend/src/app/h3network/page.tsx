import React, { useEffect, useState } from 'react';
import { API_BASE } from '../../lib/api';

const H3_NODES = [
  { id: 'US-EAST-1', x: '22%', y: '38%', color: '#1EF0A6', status: 'active', cells: 3421, latency: '12ms' },
  { id: 'EU-CENTRAL', x: '46%', y: '28%', color: '#2BD9FF', status: 'stable', cells: 2891, latency: '8ms' },
  { id: 'AP-SOUTH', x: '72%', y: '55%', color: '#FF4DFF', status: 'degraded', cells: 1204, latency: '54ms' },
];

const CONNECTIONS = [
  { x1: '22%', y1: '38%', x2: '46%', y2: '28%', color: '#1EF0A6' },
  { x1: '46%', y1: '28%', x2: '72%', y2: '55%', color: '#2BD9FF' },
  { x1: '22%', y1: '38%', x2: '72%', y2: '55%', color: '#1EF0A6' },
];

export default function H3NetworkPage() {
  const [quicStatus, setQuicStatus] = useState<any>(null);
  const [showNotif, setShowNotif] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/api/v2/opacus/quic/status`).then(r => r.json()).then(setQuicStatus).catch(() => {});
    const t = setTimeout(() => setShowNotif(false), 5000);
    return () => clearTimeout(t);
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'active') return 'text-success';
    if (status === 'stable') return 'text-primary';
    return 'text-warning';
  };

  return (
    <div className="h-full relative overflow-hidden bg-bg-void">
      {/* Hex grid background */}
      <div className="absolute inset-0 opacity-[0.1]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='69'%3E%3Cpath d='M20 0 L40 11.5 L40 34.5 L20 46 L0 34.5 L0 11.5 Z' fill='none' stroke='%231EF0A6' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundSize: '40px 69px',
      }}></div>

      {/* Radial gradient glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(30,240,166,0.06) 0%, transparent 70%)',
      }}></div>

      {/* Map container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[75%] h-[70%] max-w-[900px]" style={{
          background: 'linear-gradient(135deg, rgba(21,29,46,0.8) 0%, rgba(10,15,26,0.9) 100%)',
          border: '1px solid rgba(30,240,166,0.15)',
          borderRadius: '16px',
          backdropFilter: 'blur(8px)',
        }}>
          {/* Connection SVG */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5, borderRadius: '16px', overflow: 'hidden' }}>
            <defs>
              <filter id="h3Glow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {CONNECTIONS.map((c, i) => (
              <line
                key={i}
                x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                stroke={c.color} strokeWidth="1.5" opacity="0.5"
                strokeDasharray="6 4"
                filter="url(#h3Glow)"
              />
            ))}
            {/* Animated dots on connections */}
            {CONNECTIONS.map((c, i) => (
              <circle key={`dot-${i}`} r="3" fill={c.color} opacity="0.8">
                <animateMotion dur={`${3 + i}s`} repeatCount="indefinite">
                  <mpath xlinkHref={`#path-${i}`} />
                </animateMotion>
              </circle>
            ))}
          </svg>

          {/* H3 Nodes */}
          {H3_NODES.map((node) => (
            <div
              key={node.id}
              className="absolute z-10 flex flex-col items-center gap-2"
              style={{ left: node.x, top: node.y, transform: 'translate(-50%, -50%)' }}
            >
              {/* Outer ring */}
              <div className="relative">
                <div className="absolute -inset-3 rounded-full animate-ping opacity-20" style={{ background: node.color }}></div>
                <div
                  className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: node.color,
                    background: `radial-gradient(circle, ${node.color}20 0%, transparent 70%)`,
                    boxShadow: `0 0 24px ${node.color}50`,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: node.color, fontSize: '22px' }}>hub</span>
                </div>
              </div>
              <div
                className="bg-bg-card rounded-lg px-3 py-2 min-w-[130px] text-center border"
                style={{ borderColor: node.color + '40', boxShadow: `0 4px 16px ${node.color}20` }}
              >
                <p className="font-mono-sm text-mono-sm font-bold" style={{ color: node.color }}>{node.id}</p>
                <p className="font-small text-small text-on-surface-variant">{node.cells.toLocaleString()} cells</p>
                <p className={`font-small text-small ${getStatusColor(node.status)}`}>{node.latency}</p>
              </div>
            </div>
          ))}

          {/* Map label */}
          <div className="absolute bottom-3 left-3 font-mono-sm text-mono-sm text-on-surface-variant/50 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>map</span>
            Global H3 Hexagonal Index Network
          </div>
        </div>
      </div>

      {/* Right Aside Panel */}
      <aside className="absolute top-6 right-6 z-20 w-[280px] flex flex-col gap-4">
        {/* Network Stats */}
        <div className="bg-bg-card/95 border border-outline-variant rounded-xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-h3 text-h3 text-on-surface font-semibold">Network Stats</h4>
            <span className="w-2 h-2 rounded-full bg-h3-cell animate-pulse"></span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-small text-small text-on-surface-variant">Throughput</span>
              <span className="font-mono-sm text-mono-sm text-primary font-bold">
                {quicStatus?.throughput || '842.5'} GB/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-small text-small text-on-surface-variant">Active H3 Cells</span>
              <span className="font-mono-sm text-mono-sm text-h3-cell font-bold">
                {quicStatus?.active_cells || '14,204'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-small text-small text-on-surface-variant">QUIC Connections</span>
              <span className="font-mono-sm text-mono-sm text-on-surface">
                {quicStatus?.connections || '3,891'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-small text-small text-on-surface-variant">Avg Latency</span>
              <span className="font-mono-sm text-mono-sm text-success">
                {quicStatus?.avg_latency || '18'}ms
              </span>
            </div>
          </div>
        </div>

        {/* Geospatial Health */}
        <div className="bg-bg-card/95 border border-outline-variant rounded-xl p-5 backdrop-blur-md">
          <h4 className="font-h3 text-h3 text-on-surface font-semibold mb-4">Geospatial Health</h4>
          <div className="space-y-3">
            {[
              { region: 'NA', label: 'North America', pct: 95, color: 'bg-success', status: '95% success' },
              { region: 'EU', label: 'Europe', pct: 82, color: 'bg-primary', status: '82% stable' },
              { region: 'APAC', label: 'Asia Pacific', pct: 60, color: 'bg-warning', status: '60% degraded' },
            ].map((r) => (
              <div key={r.region}>
                <div className="flex justify-between mb-1">
                  <span className="font-small text-small text-on-surface-variant">{r.label}</span>
                  <span className={`font-mono-sm text-mono-sm ${r.pct >= 90 ? 'text-success' : r.pct >= 75 ? 'text-primary' : 'text-warning'}`}>{r.status}</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${r.color} rounded-full`} style={{ width: `${r.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Bottom-right notification */}
      {showNotif && (
        <div className="absolute bottom-6 right-6 z-30 bg-success/10 border border-success/40 rounded-xl px-4 py-3 flex items-center gap-3 backdrop-blur-sm">
          <span className="material-symbols-outlined text-success" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>check_circle</span>
          <span className="font-body text-body text-on-surface">Routing Optimized</span>
          <button onClick={() => setShowNotif(false)} className="text-on-surface-variant hover:text-on-surface ml-1">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
          </button>
        </div>
      )}
    </div>
  );
}
