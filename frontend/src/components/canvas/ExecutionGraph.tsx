import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap, useReactFlow, NodeTypes } from 'reactflow';
import 'reactflow/dist/style.css';
import { ExecutionGraph as Graph } from '../../types/graph';
import NodeRenderer from './NodeRenderer';
import CanvasToolbar from './CanvasToolbar';

const nodeTypes: NodeTypes = {
  intent: NodeRenderer,
  simulation: NodeRenderer,
  solver: NodeRenderer,
  execution: NodeRenderer,
  settlement: NodeRenderer,
};

export default function ExecutionGraph({ graph }: { graph: Graph | null }) {
  if (!graph) {
    return <div className="p-6 text-brick3-silver/60">No graph yet. Enter an intent to compile.</div>;
  }

  return <ExecutionGraphContent graph={graph} />;
}

function ExecutionGraphContent({ graph }: { graph: Graph }) {
  const { fitView } = useReactFlow();
  const edges = useMemo(
    () => graph.edges.map((e) => ({ ...e, style: { stroke: '#00D1C7', strokeWidth: 2 } })),
    [graph.edges]
  );

  return (
    <div className="h-full w-full">
      <CanvasToolbar onFit={() => fitView({ padding: 0.2 })} />
      <div className="h-[calc(100%-42px)]">
        <ReactFlow nodes={graph.nodes as any} edges={edges as any} nodeTypes={nodeTypes} fitView>
          <MiniMap />
          <Controls />
          <Background color="#223046" />
        </ReactFlow>
      </div>
    </div>
  );
}
