export interface SimulationResult {
  expectedProfit: number;
  risk: number;
  slippage: number;
  estimatedGasUsd?: number;
  netProfitUsd?: number;
  profitable?: boolean;
}
