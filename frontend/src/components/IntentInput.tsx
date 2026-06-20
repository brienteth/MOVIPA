import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/api';

interface IntentInputProps {
  onWorkflowGenerated: (workflow: any) => void;
}

const IntentInput: React.FC<IntentInputProps> = ({ onWorkflowGenerated }) => {
  const [intent, setIntent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [maxUsdc, setMaxUsdc] = useState(1000);
  const [riskTolerance, setRiskTolerance] = useState('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/api/v1/intent`, {
        intent,
        max_usdc: maxUsdc,
        risk_tolerance: riskTolerance
      });

      onWorkflowGenerated(response.data);
    } catch (error) {
      console.error('Error processing intent:', error);
      // Show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const exampleIntents = [
    "Flash loan 1000 USDC from Aave, swap to ETH on Uniswap, repay the loan",
    "Bridge 500 USDC from Ethereum to Base using the fastest bridge",
    "Close my Aave debt position with minimum slippage",
    "Lend 2000 USDC on Compound and borrow against it",
  ];

  return (
    <div className="bg-gray-800 border-b border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe your DeFi intent
            </label>
            <input
              type="text"
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Close my Aave debt with cheapest route"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
          </div>

          <div className="flex space-x-2">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max USDC
              </label>
              <input
                type="number"
                value={maxUsdc}
                onChange={(e) => setMaxUsdc(Number(e.target.value))}
                className="w-24 px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Level
              </label>
              <select
                value={riskTolerance}
                onChange={(e) => setRiskTolerance(e.target.value)}
                className="w-24 px-2 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !intent.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Generate Workflow'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Example intents:
          </label>
          <div className="flex flex-wrap gap-2">
            {exampleIntents.map((example, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setIntent(example)}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded-md text-sm hover:bg-gray-600 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default IntentInput;