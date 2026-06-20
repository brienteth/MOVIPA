import { useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { BRICK3_CONTRACTS, canvasFlashLoanBlockAbi } from '@/lib/contracts';
import { useState, useCallback } from 'react';

/**
 * Canvas Flash Loan Hook
 * Execute flash loans directly from Canvas UI
 */

export interface FlashLoanExecutionParams {
  provider: 'aave' | 'uniswap-v3' | 'uniswap-v4';
  token: string;
  amount: string;
  minProfit: string;
  arbitrageData: string; // Encoded strategy logic
  strategyExecutor: string; // Address of strategy executor contract
}

export interface FlashLoanResult {
  profit: string;
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export function useCanvasFlashLoan() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<FlashLoanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { write: executeFlashLoan, data: executeData } = useContractWrite({
    address: BRICK3_CONTRACTS.CanvasFlashLoanBlock as `0x${string}`,
    abi: canvasFlashLoanBlockAbi,
    functionName: 'executeFlashLoanStrategy',
  });

  const { isLoading: isTxLoading, isSuccess: isTxSuccess } = useWaitForTransaction({
    hash: executeData?.hash,
  });

  /**
   * Get available flash loan adapters and their info
   */
  const { data: adaptersInfo } = useContractRead({
    address: BRICK3_CONTRACTS.CanvasFlashLoanBlock as `0x${string}`,
    abi: canvasFlashLoanBlockAbi,
    functionName: 'getAdaptersInfo',
    watch: true,
  });

  /**
   * Execute flash loan strategy
   */
  const executeStrategy = useCallback(
    async (params: FlashLoanExecutionParams) => {
      setIsLoading(true);
      setError(null);

      try {
        const providerMap = {
          'aave': 'aave',
          'uniswap-v3': 'uniswap-v3',
          'uniswap-v4': 'uniswap-v4',
        };

        executeFlashLoan({
          args: [
            providerMap[params.provider],
            params.token as `0x${string}`,
            BigInt(params.amount),
            BigInt(params.minProfit),
            params.arbitrageData as `0x${string}`,
            params.strategyExecutor as `0x${string}`,
          ],
        });
      } catch (err: any) {
        const errorMsg = err?.message || 'Flash loan execution failed';
        setError(errorMsg);
        console.error('Flash loan error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [executeFlashLoan]
  );

  /**
   * Parse adapters info for UI display
   */
  const adapters = adaptersInfo
    ? (() => {
        const [names, addresses, fees] = adaptersInfo as readonly [readonly string[], readonly `0x${string}`[], readonly bigint[]];
        return names.map((name, idx) => ({
          name,
          address: addresses[idx],
          fee: fees[idx]?.toString() ?? '0',
        }));
      })()
    : [];

  return {
    executeStrategy,
    isLoading: isLoading || isTxLoading,
    adapters,
    transactionHash: executeData?.hash,
    isSuccess: isTxSuccess,
    result,
    error,
  };
}

/**
 * Parse flash loan execution logs
 */
export function parseFlashLoanEvent(log: any) {
  return {
    strategyId: log.args?.strategyId,
    adapter: log.args?.adapter,
    token: log.args?.token,
    amount: log.args?.amount?.toString(),
    profit: log.args?.profit?.toString(),
    success: log.args?.success,
  };
}
