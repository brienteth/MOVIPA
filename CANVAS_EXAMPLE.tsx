/**
 * MOVIPA Canvas Example Component (Sanitized for Public Distribution)
 * 
 * This is a reference implementation showing how to build the strategy canvas.
 * Real contract addresses, API endpoints, and backend logic have been removed.
 * 
 * For production use, integrate with your own backend API.
 */

import React, { useState } from 'react';

interface BlockConfig {
  id: string;
  type: 'FLASH_LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'CLAIM' | 'CONDITION' | 'LOOP';
  label: string;
  config: Record<string, any>;
}

interface StrategyState {
  blocks: BlockConfig[];
  connections: Array<{ from: string; to: string }>;
  selectedNetwork: string;
}

/**
 * Supported block types in the Canvas
 */
const BLOCK_TYPES = {
  FLASH_LOAN: { label: 'Flash Loan', color: '#FF6B6B', providers: ['Aave', 'DyDx', 'Balancer'] },
  SWAP: { label: 'DEX Swap', color: '#4ECDC4', dexes: ['Uniswap', 'Curve', '1Inch'] },
  BRIDGE: { label: 'Bridge', color: '#45B7D1', bridges: ['Across', 'Stargate', 'Wormhole'] },
  LEND: { label: 'Lend', color: '#96CEB4', protocols: ['Aave', 'Compound', 'Curve'] },
  BORROW: { label: 'Borrow', color: '#FFEAA7', protocols: ['Aave', 'Compound'] },
  STAKE: { label: 'Stake', color: '#DDA0DD', protocols: ['Lido', 'Rocket Pool'] },
  YIELD: { label: 'Yield Farm', color: '#F0AD4E', protocols: ['Curve', 'Balancer'] },
  CLAIM: { label: 'Claim', color: '#87CEEB', types: ['Rewards', 'Airdrops'] },
  CONDITION: { label: 'Condition', color: '#D3D3D3', operators: ['IF', 'WHILE', 'LOOP'] },
  LOOP: { label: 'Loop', color: '#A9A9A9', iterations: '1-100' },
};

/**
 * Network configurations
 */
const NETWORKS = [
  { name: 'Ethereum', id: 'ethereum', chainId: 1 },
  { name: 'Base', id: 'base', chainId: 8453 },
  { name: 'Arbitrum', id: 'arbitrum', chainId: 42161 },
  { name: 'Optimism', id: 'optimism', chainId: 10 },
  { name: 'Polygon', id: 'polygon', chainId: 137 },
];

/**
 * Example Canvas Component
 */
export function CanvasExample() {
  const [strategy, setStrategy] = useState<StrategyState>({
    blocks: [],
    connections: [],
    selectedNetwork: 'ethereum',
  });

  const addBlock = (blockType: keyof typeof BLOCK_TYPES) => {
    const newBlock: BlockConfig = {
      id: `block-${Date.now()}`,
      type: blockType,
      label: BLOCK_TYPES[blockType].label,
      config: {},
    };
    setStrategy(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
  };

  const removeBlock = (blockId: string) => {
    setStrategy(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId),
      connections: prev.connections.filter(c => c.from !== blockId && c.to !== blockId),
    }));
  };

  const handleExecute = async () => {
    // Example: Send strategy to backend for compilation
    // const response = await fetch('https://api.example.com/compile', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     blocks: strategy.blocks,
    //     connections: strategy.connections,
    //     network: strategy.selectedNetwork,
    //   }),
    // });
    
    console.log('Strategy to execute:', strategy);
    alert('In production, this would send to your backend API for compilation and execution.');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-2xl font-bold">MOVIPA Strategy Builder</h1>
        <div className="flex gap-4">
          <select 
            value={strategy.selectedNetwork}
            onChange={(e) => setStrategy(prev => ({ ...prev, selectedNetwork: e.target.value }))}
            className="bg-gray-700 px-4 py-2 rounded"
          >
            {NETWORKS.map(net => (
              <option key={net.id} value={net.id}>{net.name}</option>
            ))}
          </select>
          <button 
            onClick={handleExecute}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-semibold"
          >
            Execute Strategy
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Block Palette */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h2 className="font-bold mb-4">Available Blocks</h2>
          <div className="space-y-2">
            {Object.entries(BLOCK_TYPES).map(([typeKey, type]) => (
              <button
                key={typeKey}
                onClick={() => addBlock(typeKey as keyof typeof BLOCK_TYPES)}
                className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-left"
                style={{ borderLeft: `4px solid ${type.color}` }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-gray-950 p-8 overflow-auto">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Active Strategy Blocks</h2>
            
            {strategy.blocks.length === 0 ? (
              <p className="text-gray-500">Drag blocks from the left panel to create your strategy</p>
            ) : (
              <div className="space-y-3">
                {strategy.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-center gap-4 p-4 bg-gray-800 rounded border border-gray-700"
                    style={{ borderLeftColor: BLOCK_TYPES[block.type]?.color }}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{block.label}</h3>
                      <p className="text-sm text-gray-400">{block.type}</p>
                    </div>
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
          <h2 className="font-bold mb-4">Strategy Info</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-400">Network</p>
              <p className="font-semibold">{strategy.selectedNetwork.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-gray-400">Total Blocks</p>
              <p className="font-semibold">{strategy.blocks.length}</p>
            </div>
            <div>
              <p className="text-gray-400">Connections</p>
              <p className="font-semibold">{strategy.connections.length}</p>
            </div>
            <hr className="border-gray-700" />
            <div className="text-xs text-gray-500">
              <p className="font-semibold mb-2">Instructions:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Select network at top</li>
                <li>Add blocks from left panel</li>
                <li>Configure block parameters</li>
                <li>Click Execute to run</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CanvasExample;
