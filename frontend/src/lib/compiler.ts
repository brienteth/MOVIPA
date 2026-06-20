import { ExecutionGraph } from '../types/graph';

export function compileIntent(intent: string): ExecutionGraph {
  return {
    nodes: [
      {
        id: 'intent',
        type: 'intent',
        position: { x: 50, y: 140 },
        data: { label: 'User Intent', subtitle: intent || 'No intent yet', color: '#00D1C7', status: 'ready' },
      },
      {
        id: 'simulation',
        type: 'simulation',
        position: { x: 320, y: 140 },
        data: { label: '0G Stream Simulation', subtitle: 'Hot-state / prophetic', status: 'live' },
      },
      {
        id: 'solver',
        type: 'solver',
        position: { x: 620, y: 140 },
        data: { label: 'H3 Solver Mesh', subtitle: 'TEE + latency routing', status: 'live' },
      },
      {
        id: 'execution',
        type: 'execution',
        position: { x: 900, y: 140 },
        data: { label: 'Private Relay Execution', subtitle: 'Flashbots / Titan / bloXroute', status: 'pending' },
      },
      {
        id: 'settlement',
        type: 'settlement',
        position: { x: 1190, y: 140 },
        data: { label: 'Onchain Settlement', subtitle: 'IntentSettlement + Profit', status: 'idle' },
      },
    ],
    edges: [
      { id: 'e1', source: 'intent', target: 'simulation', animated: true },
      { id: 'e2', source: 'simulation', target: 'solver', animated: true },
      { id: 'e3', source: 'solver', target: 'execution', animated: true },
      { id: 'e4', source: 'execution', target: 'settlement', animated: true },
    ],
  };
}
