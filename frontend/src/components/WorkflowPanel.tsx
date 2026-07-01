import React from 'react';

const WorkflowPanel: React.FC = () => {
  const availableNodes = [
    { type: 'flash_loan', label: 'Flash Loan', protocol: 'Aave', icon: '⚡', category: 'Leverage' },
    { type: 'swap', label: 'Swap', protocol: 'Uniswap', icon: '🔄', category: 'DEX' },
    { type: 'lend', label: 'Lend', protocol: 'Compound', icon: '📈', category: 'Lending' },
    { type: 'borrow', label: 'Borrow', protocol: 'Aave', icon: '📉', category: 'Lending' },
    { type: 'repay', label: 'Repay', protocol: 'Aave', icon: '💰', category: 'Lending' },
    { type: 'bridge', label: 'Cross-Chain Bridge', protocol: 'Across', icon: '🌉', category: 'Bridge' },
    { type: 'stake', label: 'Stake', protocol: 'Lido', icon: '🏦', category: 'Staking' },
    { type: 'yield', label: 'Yield Farm', protocol: 'Curve', icon: '🌾', category: 'Yield' },
  ];

  const categories = [...new Set(availableNodes.map(node => node.category))];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-80 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">DeFi Nodes</h3>

      {categories.map(category => (
        <div key={category} className="mb-6">
          <h4 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wide">
            {category}
          </h4>
          <div className="space-y-2">
            {availableNodes
              .filter(node => node.category === category)
              .map((node) => (
                <div
                  key={node.type}
                  className="p-3 bg-gray-700 rounded-lg border border-gray-600 cursor-move hover:border-blue-400 transition-colors group"
                  onDragStart={(event) => onDragStart(event, node.type)}
                  draggable
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{node.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{node.label}</div>
                      <div className="text-xs text-gray-400">{node.protocol}</div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <h4 className="text-sm font-medium text-white mb-2">Agent Settings</h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Max Slippage</label>
            <input
              type="number"
              defaultValue="0.5"
              step="0.1"
              className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Gas Priority</label>
            <select className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="slow">Slow (Cheap)</option>
              <option value="standard">Standard</option>
              <option value="fast">Fast</option>
              <option value="instant">Instant</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Auto-Execute</label>
            <label className="flex items-center">
              <input
                type="checkbox"
                defaultChecked
                className="mr-2"
              />
              <span className="text-xs text-gray-300">Execute immediately after Citadel verification</span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-blue-400">🛡️</span>
          <span className="text-sm font-medium text-blue-400">Citadel Protected</span>
        </div>
        <p className="text-xs text-gray-400">
          All workflows are verified by Citadel Registry for security and compliance.
        </p>
      </div>
    </div>
  );
};

export default WorkflowPanel;