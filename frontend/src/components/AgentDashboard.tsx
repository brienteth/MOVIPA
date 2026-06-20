import React, { useState, useEffect } from 'react';

const AgentDashboard: React.FC = () => {
  const [agentStats, setAgentStats] = useState({
    totalWorkflows: 0,
    successRate: 0,
    totalVolume: 0,
    activeAgents: 0
  });

  const [permissions, setPermissions] = useState({
    maxUsdcPerTrade: 1000,
    maxDailyVolume: 10000,
    allowedProtocols: ['Aave', 'Uniswap', 'Compound'],
    riskTolerance: 'medium'
  });

  useEffect(() => {
    // Fetch agent stats from backend
    // Placeholder data
    setAgentStats({
      totalWorkflows: 47,
      successRate: 96.2,
      totalVolume: 125000,
      activeAgents: 3
    });
  }, []);

  const handlePermissionChange = (key: string, value: any) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex-1 p-6 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Agent Dashboard</h2>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{agentStats.totalWorkflows}</div>
            <div className="text-sm text-gray-400">Total Workflows</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-green-400">{agentStats.successRate}%</div>
            <div className="text-sm text-gray-400">Success Rate</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">${agentStats.totalVolume.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Total Volume</div>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-2xl font-bold text-orange-400">{agentStats.activeAgents}</div>
            <div className="text-sm text-gray-400">Active Agents</div>
          </div>
        </div>

        {/* Permissions Settings */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Agent Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max USDC per Trade
              </label>
              <input
                type="number"
                value={permissions.maxUsdcPerTrade}
                onChange={(e) => handlePermissionChange('maxUsdcPerTrade', Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Daily Volume
              </label>
              <input
                type="number"
                value={permissions.maxDailyVolume}
                onChange={(e) => handlePermissionChange('maxDailyVolume', Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Risk Tolerance
              </label>
              <select
                value={permissions.riskTolerance}
                onChange={(e) => handlePermissionChange('riskTolerance', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Allowed Protocols
              </label>
              <div className="flex flex-wrap gap-2">
                {['Aave', 'Uniswap', 'Compound', 'Curve', 'Across'].map(protocol => (
                  <label key={protocol} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={permissions.allowedProtocols.includes(protocol)}
                      onChange={(e) => {
                        const newProtocols = e.target.checked
                          ? [...permissions.allowedProtocols, protocol]
                          : permissions.allowedProtocols.filter(p => p !== protocol);
                        handlePermissionChange('allowedProtocols', newProtocols);
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">{protocol}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'Flash Loan + Swap', amount: '$2,500', status: 'success', time: '2 min ago' },
              { action: 'Cross-chain Bridge', amount: '$1,000', status: 'success', time: '15 min ago' },
              { action: 'Yield Farming', amount: '$500', status: 'pending', time: '1 hour ago' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-md">
                <div>
                  <div className="font-medium text-white">{activity.action}</div>
                  <div className="text-sm text-gray-400">{activity.time}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-white">{activity.amount}</div>
                  <div className={`text-sm ${activity.status === 'success' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {activity.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;