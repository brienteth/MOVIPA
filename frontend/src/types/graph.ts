export type GraphNodeType = 'intent' | 'simulation' | 'solver' | 'execution' | 'settlement';

export interface GraphNodeData {
  label: string;
  subtitle?: string;
  status?: 'idle' | 'live' | 'ready' | 'pending' | 'success' | 'failed';
  color?: string;
}

export interface ExecutionGraphNode {
  id: string;
  type: GraphNodeType;
  data: GraphNodeData;
  position: { x: number; y: number };
}

export interface ExecutionGraphEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
}

export interface ExecutionGraph {
  nodes: ExecutionGraphNode[];
  edges: ExecutionGraphEdge[];
}
