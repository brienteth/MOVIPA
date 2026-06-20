import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

import DeFiNode from './DeFiNode';

const nodeTypes: NodeTypes = {
  defiNode: DeFiNode,
};

interface DeFiWorkflowCanvasProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  workflow: any;
}

const DeFiWorkflowCanvas: React.FC<DeFiWorkflowCanvasProps> = ({
  initialNodes,
  initialEdges,
  workflow
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when workflow changes
  useEffect(() => {
    if (workflow && workflow.steps) {
      const workflowNodes = workflow.steps.map((step: any, index: number) => ({
        id: `step-${index + 1}`,
        type: 'defiNode',
        position: { x: 250 + index * 250, y: 100 },
        data: {
          label: step.action || step.label,
          protocol: step.protocol,
          params: step.params
        },
      }));

      setNodes([...initialNodes, ...workflowNodes]);

      // Create edges between steps
      const workflowEdges = workflow.steps.slice(1).map((_: any, index: number) => ({
        id: `edge-${index + 1}`,
        source: `step-${index + 1}`,
        target: `step-${index + 2}`,
        type: 'smoothstep',
      }));

      setEdges(workflowEdges);
    }
  }, [workflow, setNodes, setEdges, initialNodes]);

  return (
    <div className="flex-1 bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-900"
      >
        <MiniMap
          nodeColor="#1f2937"
          maskColor="rgba(0, 0, 0, 0.2)"
        />
        <Controls className="bg-gray-800 border-gray-600" />
        <Background
          color="#374151"
          gap={20}
          size={1}
        />
      </ReactFlow>
    </div>
  );
};

export default DeFiWorkflowCanvas;