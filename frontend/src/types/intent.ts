export type RiskLevel = 'low' | 'medium' | 'high';

export interface IntentPayload {
  intent: string;
  max_usdc: number;
  risk_tolerance: RiskLevel;
}

export interface PublishedIntent {
  intent_id: string;
  user: string;
  strategy_hash: string;
  chain: string;
  notional_usdc: number;
  min_profit_usdc: number;
  max_slippage_bps: number;
  deadline_ts: number;
  nonce: number;
  intent_stake_score: number;
  created_at: string;
}
