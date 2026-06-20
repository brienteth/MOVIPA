import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, GitBranch, ArrowRight, CheckCircle, XCircle } from 'lucide-react';

interface BridgeStatus {
  active_relayers: Array<{
    source: string;
    target: string;
    status: string;
  }>;
  supported_chains: string[];
  timestamp: string;
}

interface BridgeIntent {
  source_chain: string;
  target_chain: string;
  amount: number;
  token: string;
}

const BridgeDashboard: React.FC = () => {
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingRelayer, setStartingRelayer] = useState(false);
  const [executingIntent, setExecutingIntent] = useState(false);
  const [intent, setIntent] = useState<BridgeIntent>({
    source_chain: 'ethereum',
    target_chain: 'base',
    amount: 100,
    token: 'USDC'
  });

  const supportedChains = [
    { value: 'ethereum', label: 'Ethereum' },
    { value: 'base', label: 'Base' },
    { value: 'arbitrum', label: 'Arbitrum' },
    { value: 'optimism', label: 'Optimism' },
    { value: 'polygon', label: 'Polygon' },
    { value: '0g', label: '0G Chain' }
  ];

  const supportedTokens = ['USDC', 'ETH', 'WBTC', 'USDT'];

  useEffect(() => {
    fetchBridgeStatus();
  }, []);

  const fetchBridgeStatus = async () => {
    try {
      const response = await fetch('/api/v2/bridge/status');
      const data = await response.json();
      setBridgeStatus(data);
    } catch (error) {
      console.error('Failed to fetch bridge status:', error);
    }
  };

  const startRelayer = async (source: string, target: string) => {
    setStartingRelayer(true);
    try {
      const response = await fetch('/api/v2/bridge/start-relayer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_chain: source, target_chain: target })
      });
      const result = await response.json();
      alert(`Relayer started: ${result.message}`);
      fetchBridgeStatus();
    } catch (error) {
      console.error('Failed to start relayer:', error);
      alert('Failed to start relayer');
    }
    setStartingRelayer(false);
  };

  const executeBridgeIntent = async () => {
    setExecutingIntent(true);
    try {
      const response = await fetch('/api/v2/bridge/execute-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intent)
      });
      const result = await response.json();
      alert(`Bridge executed! TX: ${result.intent_result?.tx_hash || 'Pending'}`);
    } catch (error) {
      console.error('Failed to execute bridge intent:', error);
      alert('Failed to execute bridge intent');
    }
    setExecutingIntent(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <GitBranch className="w-8 h-8 text-blue-500" />
        <h1 className="text-3xl font-bold">Opacus Bridge Dashboard</h1>
      </div>

      <Alert>
        <GitBranch className="h-4 w-4" />
        <AlertDescription>
          Powered by Opacus intent-based bridge technology. Supports cross-chain transfers with escrow security and real-time monitoring.
        </AlertDescription>
      </Alert>

      {/* Bridge Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Active Bridge Relayers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bridgeStatus ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bridgeStatus.active_relayers.map((relayer, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {relayer.source.toUpperCase()} → {relayer.target.toUpperCase()}
                      </span>
                      <Badge color={relayer.status === 'running' ? 'green' : 'slate'}>
                        {relayer.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
              <div className="text-sm text-gray-600">
                Supported Chains: {bridgeStatus.supported_chains.join(', ')}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading bridge status...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Start New Relayer */}
      <Card>
        <CardHeader>
          <CardTitle>Start Bridge Relayer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Source Chain</Label>
              <Select value="base" onValueChange={(value) => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map(chain => (
                    <SelectItem key={chain.value} value={chain.value}>
                      {chain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Chain</Label>
              <Select value="0g" onValueChange={(value) => {}}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map(chain => (
                    <SelectItem key={chain.value} value={chain.value}>
                      {chain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => startRelayer('base', '0g')}
            disabled={startingRelayer}
            className="w-full"
          >
            {startingRelayer ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Starting Relayer...
              </>
            ) : (
              'Start Base → 0G Relayer'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Execute Bridge Intent */}
      <Card>
        <CardHeader>
          <CardTitle>Execute Bridge Intent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Source Chain</Label>
              <Select
                value={intent.source_chain}
                onValueChange={(value) => setIntent({...intent, source_chain: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map(chain => (
                    <SelectItem key={chain.value} value={chain.value}>
                      {chain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Target Chain</Label>
              <Select
                value={intent.target_chain}
                onValueChange={(value) => setIntent({...intent, target_chain: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map(chain => (
                    <SelectItem key={chain.value} value={chain.value}>
                      {chain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Amount</Label>
              <Input
                type="number"
                value={intent.amount}
                onChange={(e) => setIntent({...intent, amount: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <Label>Token</Label>
              <Select
                value={intent.token}
                onValueChange={(value) => setIntent({...intent, token: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedTokens.map(token => (
                    <SelectItem key={token} value={token}>
                      {token}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={executeBridgeIntent}
            disabled={executingIntent}
            className="w-full"
          >
            {executingIntent ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Executing Bridge...
              </>
            ) : (
              <>
                Execute Bridge Intent
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bridge Technology Info */}
      <Card>
        <CardHeader>
          <CardTitle>Opacus Bridge Technology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Key Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Intent-based execution with escrow security</li>
                <li>Multi-chain support (Ethereum, Base, Arbitrum, Optimism, Polygon, 0G)</li>
                <li>Real-time event monitoring and automated completion</li>
                <li>Gas optimization and slippage protection</li>
                <li>TEE-secured solver execution</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How It Works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>User initiates bridge on source chain</li>
                <li>Relayer detects BridgeInitiated event</li>
                <li>Funds held in escrow during transfer</li>
                <li>Automated completion on target chain</li>
                <li>Real-time monitoring and status updates</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BridgeDashboard;