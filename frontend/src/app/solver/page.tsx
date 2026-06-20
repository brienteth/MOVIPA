import React from 'react';

const NODES = [
  { id: 'NA-EAST', lat: 72, lon: 28, latency: '12ms', color: '#1EF0A6', status: 'healthy', label: 'h3-cell' },
  { id: 'EU-CENTRAL', lat: 48, lon: 55, latency: '4ms', color: '#B56CFF', status: 'healthy', label: 'solver-high' },
  { id: 'AP-SOUTH', lat: 28, lon: 75, latency: '85ms', color: '#FFB020', status: 'degraded', label: 'warning' },
  { id: 'SA-EAST', lat: 72, lon: 70, latency: '32ms', color: '#00e5ff', status: 'healthy', label: 'primary' },
];

const ROUTES = [
  { x1: 72, y1: 28, x2: 48, y2: 55, color: '#1EF0A6' },
  { x1: 48, y1: 55, x2: 28, y2: 75, color: '#B56CFF' },
  { x1: 72, y1: 28, x2: 72, y2: 70, color: '#00e5ff' },
  { x1: 48, y1: 55, x2: 72, y2: 70, color: '#B56CFF' },
];

export default function SolverPage() {
  return (
    <div className="h-full relative overflow-hidden">
      {/* Mesh canvas background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 40%, #0A1525 0%, #05060A 70%)' }}>
        {/* Hex pattern overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='69'%3E%3Cpath d='M20 0 L40 11.5 L40 34.5 L20 46 L0 34.5 L0 11.5 Z' fill='none' stroke='%232BD9FF' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '40px 69px',
        }}></div>
      </div>

      {/* Abstract continents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[400px] h-[180px] rounded-[60%_40%_50%_60%/50%_60%_40%_50%]" style={{ top: '15%', left: '10%', background: 'rgba(30,240,166,0.04)', filter: 'blur(40px)' }}></div>
        <div className="absolute w-[320px] h-[200px] rounded-[50%_60%_40%_50%/60%_50%_60%_40%]" style={{ top: '20%', left: '45%', background: 'rgba(43,217,255,0.04)', filter: 'blur(35px)' }}></div>
        <div className="absolute w-[280px] h-[160px] rounded-[60%_40%_60%_40%/40%_60%_40%_60%]" style={{ top: '50%', left: '25%', background: 'rgba(181,108,255,0.03)', filter: 'blur(30px)' }}></div>
        <div className="absolute w-[220px] h-[140px] rounded-[50%_50%_60%_40%/60%_40%_50%_50%]" style={{ top: '55%', left: '65%', background: 'rgba(0,229,255,0.04)', filter: 'blur(25px)' }}></div>
      </div>

      {/* Route lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
        <defs>
          <filter id="routeGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {ROUTES.map((r, i) => (
          <line
            key={i}
            x1={`${r.x1}%`} y1={`${r.y1}%`}
            x2={`${r.x2}%`} y2={`${r.y2}%`}
            stroke={r.color} strokeWidth="1.5" opacity="0.35"
            strokeDasharray="8 4"
            filter="url(#routeGlow)"
          />
        ))}
      </svg>

      {/* Solver Nodes */}
      {NODES.map((node) => (
        <div
          key={node.id}
          className="absolute z-10 flex flex-col items-center gap-1"
          style={{ left: `${node.lat}%`, top: `${node.lon}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border-2 cursor-pointer transition-transform hover:scale-110"
            style={{
              borderColor: node.color,
              background: `radial-gradient(circle, ${node.color}22 0%, transparent 70%)`,
              boxShadow: `0 0 20px ${node.color}40`,
            }}
          >
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: node.color }}></div>
          </div>
          <div className="bg-bg-card border border-outline-variant rounded-lg px-3 py-2 text-center min-w-[120px]"
            style={{ borderColor: node.color + '50', boxShadow: `0 4px 20px ${node.color}20` }}>
            <p className="font-mono-sm text-mono-sm font-bold" style={{ color: node.color }}>{node.id}</p>
            <p className="font-small text-small text-on-surface-variant">{node.latency}</p>
            <p className={`font-small text-small capitalize ${node.status === 'healthy' ? 'text-success' : 'text-warning'}`}>{node.status}</p>
          </div>
        </div>
      ))}

      {/* Mesh Diagnostics Panel */}
      <div className="absolute bottom-6 right-6 z-40 w-[280px] bg-bg-card/95 border border-outline-variant rounded-xl p-5 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-h3 text-h3 text-on-surface font-semibold">Mesh Diagnostics</h4>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Active Nodes', value: '1,402', color: 'text-primary' },
            { label: 'Peak Throughput', value: '45.2 GB/s', color: 'text-secondary-fixed' },
            { label: 'Route Optimization', value: '98.4%', color: 'text-success' },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="font-small text-small text-on-surface-variant">{row.label}</span>
              <span className={`font-mono-sm text-mono-sm font-bold ${row.color}`}>{row.value}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-outline-variant/50">
            <div className="flex justify-between mb-1.5">
              <span className="font-small text-small text-on-surface-variant">Global Latency Distribution</span>
            </div>
            <div className="flex gap-1 h-4 items-end">
              {[3, 5, 8, 12, 9, 6, 4, 7, 11, 8, 5, 3].map((h, i) => (
                <div key={i} className="flex-1 rounded-sm bg-primary" style={{ height: `${(h / 12) * 100}%`, opacity: 0.7 + (i % 3) * 0.1 }}></div>
              ))}
            </div>
            <div className="flex justify-between mt-1 font-mono-sm text-mono-sm text-on-surface-variant/60">
              <span>4ms</span><span>85ms</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
