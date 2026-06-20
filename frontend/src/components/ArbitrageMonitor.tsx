import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE } from '../lib/api';

interface Opportunity {
  index: number;
  token_in: string;
  token_out: string;
  amount: number;
  buy_chain: string;
  sell_chain: string;
  buy_price: number;
  sell_price: number;
  profit_usdc: number;
  profit_percentage: number;
  flash_loan_fee: number;
  bridge_fee: number;
  execution_time_ms: number;
  risk_score: number;
  route: Array<any>;
}

interface ExecutionHistory {
  success: boolean;
  profit: number;
  gas_used: number;
  execution_time_ms: number;
  transaction_hash: string;
  error?: string;
}

interface Statistics {
  total_executions: number;
  successful: number;
  failed: number;
  total_profit: number;
  avg_profit_per_trade: number;
  win_rate: number;
  avg_execution_time_ms: number;
  best_trade: number;
  worst_trade: number;
}

const ArbitrageMonitor: React.FC = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [backendWallet, setBackendWallet] = useState<string | null>(null);
  const [backendChain, setBackendChain] = useState<string | null>(null);
  const [minAmount, setMinAmount] = useState(100_000);
  const [maxAmount, setMaxAmount] = useState(10_000_000);

  // Scan for opportunities
  const scanOpportunities = useCallback(async () => {
    setIsScanning(true);
    try {
      const response = await axios.get(`${API_BASE}/api/v2/arbitrage/opportunities`, {
        params: {
          min_amount: minAmount,
          max_amount: maxAmount
        }
      });
      
      setOpportunities(response.data.opportunities);
      
      // Fetch statistics
        const statsResponse = await axios.get(`${API_BASE}/api/v2/arbitrage/statistics`);
      setStatistics(statsResponse.data);
      
    } catch (error) {
      console.error('Error scanning opportunities:', error);
    } finally {
      setIsScanning(false);
    }
  }, [minAmount, maxAmount]);

  // Auto-scan
  useEffect(() => {
    if (!autoScan) return;
    
    scanOpportunities();
    const interval = setInterval(scanOpportunities, 10000); // Scan every 10s
    
    return () => clearInterval(interval);
  }, [autoScan, scanOpportunities]);

  useEffect(() => {
    const loadWalletInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/v2/wallet`);
        setBackendWallet(response.data.address);
        setBackendChain(String(response.data.chain_id || response.data.chainId || ''));
      } catch (error) {
        console.error('Wallet info load failed:', error);
      }
    };

    loadWalletInfo();
  }, []);

  // Execute arbitrage
  const executeArbitrage = async (opportunityIndex: number) => {
    if (!walletAddress && !backendWallet) {
      alert('No wallet configured. Enter a wallet address or configure PRIVATE_KEY in backend .env.local.');
      return;
    }
    
    setIsExecuting(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/v2/arbitrage/execute`,
        {
          opportunity_index: opportunityIndex,
          wallet_address: walletAddress || backendWallet,
          allow_multi_chain: true
        }
      );
      
      console.log('Execution result:', response.data);
      
      const executionPayload: ExecutionHistory = {
        success: response.data.success,
        profit: response.data.profit_usdc ?? 0,
        gas_used: response.data.gas_used_eth ?? 0,
        execution_time_ms: response.data.execution_time_ms ?? 0,
        transaction_hash: response.data.real_tx_hash || response.data.transaction_hash || '',
        error: response.data.error,
      };
      
      setExecutionHistory([executionPayload, ...executionHistory]);
      
      if (response.data.success) {
        await scanOpportunities();
      }
      
    } catch (error) {
      console.error('Execution error:', error);
      alert('Execution failed. Check console for details.');
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 0.3) return 'text-green-400';
    if (risk < 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">🚀 Arbitrage Monitor</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Min Amount ($)</label>
            <input
              type="number"
              value={minAmount}
              onChange={(e) => setMinAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Max Amount ($)</label>
            <input
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmount(Number(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Wallet Address</label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={scanOpportunities}
              disabled={isScanning}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </button>
            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScan}
                onChange={(e) => setAutoScan(e.target.checked)}
              />
              <span className="text-sm">Auto</span>
            </label>
          </div>
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-400">${statistics.total_profit.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Total Profit</div>
          </div>
          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{statistics.successful}/{statistics.total_executions}</div>
            <div className="text-sm text-gray-400">Success Rate: {(statistics.win_rate * 100).toFixed(1)}%</div>
          </div>
          <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">${statistics.avg_profit_per_trade.toFixed(2)}</div>
            <div className="text-sm text-gray-400">Avg Profit/Trade</div>
          </div>
          <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">{statistics.avg_execution_time_ms.toFixed(0)}ms</div>
            <div className="text-sm text-gray-400">Avg Execution Time</div>
          </div>
        </div>
      )}

      {/* Opportunities */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          💰 Opportunities ({opportunities.length})
        </h3>
        
        {opportunities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No profitable opportunities found. Adjust filters or wait for market conditions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Token Pair</th>
                  <th className="text-right py-3 px-4 text-gray-400">Amount</th>
                  <th className="text-right py-3 px-4 text-gray-400">Profit USDC</th>
                  <th className="text-right py-3 px-4 text-gray-400">Profit %</th>
                  <th className="text-center py-3 px-4 text-gray-400">Risk</th>
                  <th className="text-center py-3 px-4 text-gray-400">Speed</th>
                  <th className="text-center py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.index} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-white font-medium">
                      {opp.token_in} → {opp.token_out}
                      <div className="text-xs text-gray-400">
                        {opp.buy_chain} → {opp.sell_chain}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      ${opp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right text-green-400 font-semibold">
                      ${opp.profit_usdc.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-400">
                      {opp.profit_percentage.toFixed(3)}%
                    </td>
                    <td className={`py-3 px-4 text-center font-medium ${getRiskColor(opp.risk_score)}`}>
                      {(opp.risk_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300">
                      {opp.execution_time_ms}ms
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => executeArbitrage(opp.index)}
                        disabled={isExecuting || !walletAddress}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Execute
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">
            📊 Execution History ({executionHistory.length})
          </h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {executionHistory.map((execution, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  execution.success
                    ? 'bg-green-900/20 border-green-500/30'
                    : 'bg-red-900/20 border-red-500/30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className={`font-semibold ${execution.success ? 'text-green-400' : 'text-red-400'}`}>
                      {execution.success ? '✅ Success' : '❌ Failed'}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Profit: ${execution.profit.toFixed(2)} | Gas: {execution.gas_used.toFixed(4)} ETH
                    </div>
                    <div className="text-xs text-gray-500">
                      Time: {execution.execution_time_ms.toFixed(0)}ms | TX: {execution.transaction_hash.slice(0, 10)}...
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArbitrageMonitor;
