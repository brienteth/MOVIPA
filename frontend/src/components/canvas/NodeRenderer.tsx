import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export default function NodeRenderer({ data }: NodeProps<any>) {
  return (
    <div className="min-w-[220px] bg-brick3-slate border border-brick3-cyan/25 rounded-lg p-3 text-brick3-silver">
      <Handle type="target" position={Position.Left} />
      <p className="text-xs uppercase text-brick3-silver/60 mb-1">{data?.status || 'idle'}</p>
      <p className="font-semibold text-sm" style={{ color: data?.color || '#D7DFE9' }}>{data?.label}</p>
      {data?.subtitle ? <p className="text-xs text-brick3-silver/70 mt-1">{data.subtitle}</p> : null}
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
