import { api } from '../lib/api';

export interface SimulateStrategyPayload {
  nodes: Array<{ type: string; params: Record<string, unknown>; order?: number }>;
  slippage_bps?: number;
  gas_priority?: string;
  gas_price_gwei?: number;
  eth_price_usd?: number;
  user_address?: string;
  target_chain_id?: number;
}

export const simulationEngine = {
  simulateStrategy: async (payload: SimulateStrategyPayload) => {
    try {
      // Direct call to updated backend simulation endpoint
      const response = await api.simulateStrategy(payload as any);
      return response;
    } catch (error) {
      console.error('Failed to simulate strategy on-chain:', error);
      throw error;
    }
  }
};
