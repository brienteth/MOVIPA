export interface SimulationResult {
  expectedProfit: number;
  risk: number;
  slippage: number;
  estimatedGasUsd?: number;
  netProfitUsd?: number;
  profitable?: boolean;
  estimatedGas?: number;
  gasCostEth?: number;
  gasCostUsd?: number;
  failureProbability?: number;
  failingNode?: string | null;
  revertReason?: string | null;
}
