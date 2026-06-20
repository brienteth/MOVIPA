import React from 'react';
import { Handle, Position } from 'reactflow';

interface DeFiNodeProps {
  data: {
    label: string;
    protocol?: string;
    params?: any;
  };
}

const DeFiNode: React.FC<DeFiNodeProps> = ({ data }) => {
  const getNodeColor = (label: string) => {
    const colors: { [key: string]: string } = {
      'flash_loan': 'bg-red-600',
      'swap': 'bg-blue-600',
      'lend': 'bg-green-600',
      'borrow': 'bg-yellow-600',
      'repay': 'bg-purple-600',
      'bridge': 'bg-indigo-600',
      'Start': 'bg-gray-600',
      'ft deposit': 'bg-rose-500',
      'ft usd mint': 'bg-teal-500',
      'ft swap': 'bg-amber-500',
      'ft_deposit': 'bg-rose-500',
      'ft_usd_mint': 'bg-teal-500',
      'ft_swap': 'bg-amber-500',
    };
    return colors[label.toLowerCase()] || 'bg-gray-600';
  };

  const getIcon = (label: string) => {
    const icons: { [key: string]: string } = {
      'flash_loan': '⚡',
      'swap': '🔄',
      'lend': '📈',
      'borrow': '📉',
      'repay': '💰',
      'bridge': '🌉',
      'Start': '🚀',
      'ft deposit': '🌷',
      'ft usd mint': '🪙',
      'ft swap': '🔀',
      'ft_deposit': '🌷',
      'ft_usd_mint': '🪙',
      'ft_swap': '🔀',
    };
    return icons[label.toLowerCase()] || '🔧';
  };

  return (
    <div className={`px-4 py-3 shadow-lg rounded-lg border-2 border-gray-600 ${getNodeColor(data.label)} text-white min-w-[150px]`}>
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-lg">{getIcon(data.label)}</span>
        <div className="font-semibold text-sm">{data.label}</div>
      </div>

      {data.protocol && (
        <div className="text-xs text-gray-300 mb-1">
          {data.protocol}
        </div>
      )}

      {data.params && (
        <div className="text-xs text-gray-400">
          {Object.entries(data.params).map(([key, value]) => (
            <div key={key}>{key}: {String(value)}</div>
          ))}
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-white border-2 border-gray-800"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-white border-2 border-gray-800"
      />
    </div>
  );
};

export default DeFiNode;