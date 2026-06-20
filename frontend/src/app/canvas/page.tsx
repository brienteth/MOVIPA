import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { motion } from 'framer-motion';
import ReactFlow, { Background, Controls, NodeChange, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import ModuleNode from '../../components/canvas/ModuleNode';
import { api } from '../../lib/api';
import { BRICK3_CONTRACTS, BRICK3_CHAIN, bandleRouterAbi, strategyRegistryAbi } from '../../lib/contracts';
import { useToast } from '../../hooks/use-toast';

type BlockType = 'FLASH LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'CLAIM' | 'CONDITION' | 'LOOP' | 'FT DEPOSIT' | 'FT USD MINT' | 'FT SWAP';

interface CanvasBlock {
  id: string;
  type: BlockType;
  chain?: string;
  bridgeProvider?: 'standard' | 'opacus';
  provider?: string;
  asset?: string;
  amount?: number;
  from?: string;
  to?: string;
  dex?: string;
  recipient?: string;
  ftAction?: 'deposit' | 'withdraw' | 'mint' | 'burn';
  ftOrderType?: 'market' | 'limit';
  position?: { x: number; y: number };
}

interface SimResult {
  netProfitUsd: number;
  netProfit?: number;
  profitToken?: string;
  notionalAmount?: number;
  notionalToken?: string;
  gasCostEth: number;
  profitable: boolean;
  failureProbability: number;
  estimatedGas: number;
  networkRoute?: string;
  executionRegion?: string;
}

interface BackendCompiledAction {
  type: string;
  params: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

interface BackendCompiledStrategy {
  actions: BackendCompiledAction[];
  encodedCalldata?: string;
  stats?: Record<string, unknown>;
  warnings?: Array<{ code: string; message: string }>;
  strategyHash?: string;
}

interface SimModalState {
  open: boolean;
  stage: 'running' | 'done';
}

const MODULES: BlockType[] = ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'];

const TOKEN_OPTIONS = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH', 'WBTC', 'ftUSD'] as const;
const CHAIN_OPTIONS = ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', '0G'] as const;
const NETWORK_OPTIONS = CHAIN_OPTIONS;
const FLASH_PROVIDERS = ['Aave', 'Balancer', 'Morpho'] as const;
const DEX_OPTIONS = ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'Flying Tulip CLOB'] as const;
const DEX_OPTIONS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'Flying Tulip CLOB'],
  Base: ['Auto', 'Hop', 'Orbiter', 'Native Base DEX', 'Flying Tulip CLOB'],
  Arbitrum: ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'Flying Tulip CLOB'],
  Optimism: ['Auto', 'Uniswap', 'Curve', 'Flying Tulip CLOB'],
  Polygon: ['Auto', 'QuickSwap', 'Curve', 'Flying Tulip CLOB'],
  '0G': ['Auto', '0G DEX'],
};
const FLASH_PROVIDERS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave', 'Balancer', 'Morpho'],
  Base: ['Aave'],
  Arbitrum: ['Aave'],
  Optimism: ['Aave'],
  Polygon: ['Aave'],
  '0G': ['Aave'],
};
const MODULE_SUPPORT_BY_CHAIN: Record<string, Array<CanvasBlock['type']>> = {
  Ethereum: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'],
  Base: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'],
  Arbitrum: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'],
  Optimism: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'],
  Polygon: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'],
  '0G': ['SWAP', 'BRIDGE', 'CLAIM', 'CONDITION', 'LOOP'],
};

// Token address mapping for Base Mainnet
const TOKEN_ADDRESSES: Record<string, string> = {
  'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC Base
  'USDT': '0x0000000000000000000000000000000000000000', // Unused
  'DAI': '0x0000000000000000000000000000000000000000',  // Unused
  'ETH': '0x0000000000000000000000000000000000000000',
  'WETH': '0x4200000000000000000000000000000000000006', // WETH Base
  'WBTC': '0x0000000000000000000000000000000000000000', // Unused
  'ftUSD': '0x7bb700f9f3d2db8df6e235ce144f6b001a1d1ed5', // Flying Tulip ftUSD
};

export default function CanvasPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<string>('Base');
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [dragging, setDragging] = useState<BlockType | null>(null);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setBlocks((prev) => {
      let updated = [...prev];
      let hasChanges = false;
      changes.forEach(c => {
        if (c.type === 'position' && c.position) {
          const idx = updated.findIndex(b => b.id === c.id);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], position: c.position };
            hasChanges = true;
          }
        }
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  const reactFlowNodes = useMemo(() => blocks.map((b, i) => ({
    id: b.id,
    type: 'module',
    position: b.position || { x: i * 320 + 50, y: 150 },
    data: { block: b, index: i, selectedChain, onUpdate: updateBlock, onRemove: removeBlock, onExecuteBridge: executeBridgeBlock }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  })), [blocks, selectedChain]);

  const reactFlowEdges = useMemo(() => {
    const edges = [];
    for (let i = 0; i < blocks.length - 1; i++) {
      edges.push({
        id: `e-${blocks[i].id}-${blocks[i+1].id}`,
        source: blocks[i].id,
        target: blocks[i+1].id,
        animated: true,
        style: { stroke: '#00e5ff', strokeWidth: 2 }
      });
    }
    return edges;
  }, [blocks]);

  const nodeTypes = useMemo(() => ({ module: ModuleNode }), []);

  useEffect(() => {
    setBlocks((prev) => prev.map((b) => ({ ...b, chain: b.chain || selectedChain })));
  }, [selectedChain]);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simStatus, setSimStatus] = useState<'idle' | 'running' | 'done' | 'error'>('idle');
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [compiledStrategy, setCompiledStrategy] = useState<BackendCompiledStrategy | null>(null);
  // Ref to avoid stale closure in confirmExecute
  const compiledStrategyRef = useRef<BackendCompiledStrategy | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [intentText, setIntentText] = useState('');
  const [intentLoading, setIntentLoading] = useState(false);
  const [simModal, setSimModal] = useState<SimModalState>({ open: false, stage: 'running' });
  const [simStep, setSimStep] = useState(0);

  // Load pre-built strategy from Strategies page
  useEffect(() => {
    const pending = localStorage.getItem('brick3_canvas_intent');
    if (pending) {
      localStorage.removeItem('brick3_canvas_intent');
      try {
        const parsed = JSON.parse(pending);
        if (parsed.blocks && Array.isArray(parsed.blocks)) {
          setBlocks(parsed.blocks);
        }
      } catch {}
    }
  }, []);

  // Wagmi: write BandleRouter.executeStrategy
  const {
    data: writeTxData,
    isLoading: isWriteLoading,
    error: writeError,
    reset: resetWrite,
  } = useContractWrite({
    address: BRICK3_CONTRACTS.BandleRouter as `0x${string}`,
    abi: bandleRouterAbi,
    functionName: 'executeStrategy',
  });

  const { isLoading: isTxConfirming, isSuccess: isTxConfirmed } = useWaitForTransaction({
    hash: writeTxData?.hash,
  });

  // Show toast notifications for transaction status
  useEffect(() => {
    if (isTxConfirmed && writeTxData?.hash) {
      toast({
        title: "Strategy Executed Successfully",
        description: `Transaction confirmed: ${writeTxData.hash.slice(0, 10)}...${writeTxData.hash.slice(-8)}`,
        variant: "success",
      });
    }
  }, [isTxConfirmed, writeTxData?.hash, toast]);

  useEffect(() => {
    if (writeError) {
      toast({
        title: "Transaction Failed",
        description: writeError.message || "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [writeError, toast]);

  // Validate blocks have required parameters
  const validateBlocks = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const required: Record<BlockType, string[]> = {
      'FLASH LOAN': ['provider', 'asset', 'amount'],
      'SWAP': ['dex', 'from', 'to', 'amount'],
      'BRIDGE': ['from', 'to', 'asset', 'amount'],
      'LEND': ['provider', 'asset', 'amount'],
      'BORROW': ['provider', 'asset', 'amount'],
      'STAKE': ['asset', 'amount'],
      'YIELD': ['asset'],
      'CLAIM': [],
      'CONDITION': [],
      'LOOP': [],
      'FT DEPOSIT': ['asset', 'amount'],
      'FT USD MINT': ['asset', 'amount'],
      'FT SWAP': ['from', 'to', 'amount'],
    };

    blocks.forEach((b, idx) => {
      const reqs = required[b.type] || [];
      reqs.forEach((field) => {
        const value = b[field as keyof CanvasBlock];
        if (!value) {
          errors.push(`Block ${idx + 1} (${b.type}): missing "${field}"`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  };

  const buildNodes = () =>
    blocks.map((b, i) => {
      const typeNormalized = b.type.toLowerCase().replace(/\s+/g, '_');
      const typeUppercase = b.type.toUpperCase().replace(/\s+/g, '_');
      const params: Record<string, unknown> = { order: i, chain: b.chain || selectedChain };

      // Map Canvas block properties to backend expected properties
      if (typeNormalized === 'swap') {
        // Normalize dex name to lowercase for backend
        const dexLower = (b.dex || 'uniswap').toLowerCase().replace(/\s+/g, '_');
        params.dex = dexLower;
        params.tokenIn = TOKEN_ADDRESSES[b.from || ''] || b.from || '';
        params.tokenOut = TOKEN_ADDRESSES[b.to || ''] || b.to || '';
        params.amountIn = String(b.amount || '0');
      } else if (typeNormalized === 'flash_loan') {
        // Normalize provider name to lowercase for backend
        const providerLower = (b.provider || 'aave').toLowerCase();
        params.provider = providerLower;
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
      } else if (typeNormalized === 'bridge') {
        params.bridge = b.bridgeProvider === 'opacus' ? 'opacus' : 'across';
        params.fromChain = b.from || '';
        params.toChain = b.to || '';
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
      } else if (typeNormalized === 'lend' || typeNormalized === 'borrow') {
        params.protocol = b.provider?.toString().toLowerCase() || 'aave';
        params.chain = b.chain || selectedChain;
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
        const providerLower = (b.provider || 'aave').toLowerCase();
        params.protocol = providerLower;
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
      } else if (typeNormalized === 'claim') {
        params.recipient = b.recipient || '';
      } else if (typeNormalized === 'ft_deposit') {
        params.action = b.ftAction || 'deposit';
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
        params.protocol = 'flying_tulip';
      } else if (typeNormalized === 'ft_usd_mint') {
        params.action = b.ftAction || 'mint';
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
        params.protocol = 'flying_tulip';
      } else if (typeNormalized === 'ft_swap') {
        params.tokenIn = TOKEN_ADDRESSES[b.from || ''] || b.from || '';
        params.tokenOut = TOKEN_ADDRESSES[b.to || ''] || b.to || '';
        params.amountIn = String(b.amount || '0');
        params.orderType = b.ftOrderType || 'market';
        params.dex = 'flying_tulip';
      } else {
        // For other types, include all block properties
        params.provider = (b.provider || '').toLowerCase();
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        params.amount = String(b.amount || '0');
        params.from = b.from;
        params.to = b.to;
        params.dex = (b.dex || '').toLowerCase();
        params.recipient = b.recipient;
      }

      return { type: typeUppercase, params };
    });

  const buildOnchainActions = (compiled: BackendCompiledStrategy | null) => {
    if (!compiled?.actions?.length) {
      console.warn('⚠️  No actions to build - compiled?.actions?.length:', compiled?.actions?.length);
      return [] as Array<{ actionType: number; params: `0x${string}` }>;
    }

    return compiled.actions.map((action) => {
      const type = action.type?.toString().toUpperCase();
      const params = action.params || {};

      if (type === 'FLASH_LOAN') {
        // Provider can be string name or address
        let provider = params.provider?.toString() || BRICK3_CONTRACTS.AaveFlashAdapter;
        if (provider === 'aave' || !provider.startsWith('0x')) {
          provider = BRICK3_CONTRACTS.AaveFlashAdapter;
        }
        params.chain = params.chain || selectedChain;
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');

        return {
          actionType: 0,
          params: new ethers.AbiCoder().encode(
            ['tuple(address, address, uint256)'],
            [[provider, asset, amount]]
          ) as `0x${string}`,
        };
      }

      if (type === 'SWAP') {
        let dex = params.dex?.toString() || BRICK3_CONTRACTS.UniV3Adapter;
        if (dex === 'uniswap' || !dex.startsWith('0x')) {
          dex = BRICK3_CONTRACTS.UniV3Adapter;
        }
        params.chain = params.chain || selectedChain;
        const tokenIn = params.tokenIn?.toString() || '0x0000000000000000000000000000000000000000';
        const tokenOut = params.tokenOut?.toString() || '0x0000000000000000000000000000000000000000';
        const amountIn = BigInt(params.amountIn?.toString() || '0');
        const minAmountOut = BigInt(params.minAmountOut?.toString() || '0');

        return {
          actionType: 1,
          params: new ethers.AbiCoder().encode(
            ['tuple(address, address, address, uint256, uint256, bytes)'],
            [[dex, tokenIn, tokenOut, amountIn, minAmountOut, '0x']]
          ) as `0x${string}`,
        };
      }

      if (type === 'BRIDGE') {
        let bridge = params.bridge?.toString() || '0x0000000000000000000000000000000000000000';
        if (bridge === 'stargate' || !bridge.startsWith('0x')) {
          bridge = '0x0000000000000000000000000000000000000000';
        }
        const fromChain = params.fromChain?.toString() || '';
        const toChain = params.toChain?.toString() || '';
        const asset = params.asset?.toString() || '0x00000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');

        return {
          actionType: 4,
          params: new ethers.AbiCoder().encode(
            ['tuple(address, string, string, address, uint256)'],
            [[bridge, fromChain, toChain, asset, amount]]
          ) as `0x${string}`,
        };
      }

      if (type === 'LEND') {
        let protocol = params.protocol?.toString() || BRICK3_CONTRACTS.MockLendingAdapter;
        if (protocol === 'aave' || !protocol.startsWith('0x')) {
          protocol = BRICK3_CONTRACTS.MockLendingAdapter;
        }
        params.chain = params.chain || selectedChain;
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');

        return {
          actionType: 2,
          params: new ethers.AbiCoder().encode(
            ['address', 'uint8', 'address', 'uint256', 'bytes'],
            [protocol, 0, asset, amount, '0x']
          ) as `0x${string}`,
        };
      }

      if (type === 'BORROW') {
        let protocol = params.protocol?.toString() || BRICK3_CONTRACTS.MockLendingAdapter;
        if (protocol === 'aave' || !protocol.startsWith('0x')) {
          protocol = BRICK3_CONTRACTS.MockLendingAdapter;
        }
        params.chain = params.chain || selectedChain;
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');

        return {
          actionType: 3,
          params: new ethers.AbiCoder().encode(
            ['address', 'uint8', 'address', 'uint256', 'bytes'],
            [protocol, 2, asset, amount, '0x']
          ) as `0x${string}`,
        };
      }

      if (type === 'STAKE') {
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');

        return {
          actionType: 6,
          params: new ethers.AbiCoder().encode(
            ['tuple(address, uint256)'],
            [[asset, amount]]
          ) as `0x${string}`,
        };
      }

      if (type === 'YIELD') {
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';

        return {
          actionType: 7,
          params: new ethers.AbiCoder().encode(
            ['tuple(address)'],
            [[asset]]
          ) as `0x${string}`,
        };
      }

      if (type === 'CLAIM') {
        let recipient = params.recipient?.toString() || address || '0x00000000000000000000000000000000000000000';
        if (recipient === 'My Wallet' || !recipient.startsWith('0x')) {
          recipient = address || '0x0000000000000000000000000000000000000000';
        }

        return {
          actionType: 5,
          params: new ethers.AbiCoder().encode(
            ['tuple(address)'],
            [[recipient]]
          ) as `0x${string}`,
        };
      }

      if (type === 'CONDITION') {
        const expression = params.expression?.toString() || 'true';

        return {
          actionType: 8,
          params: new ethers.AbiCoder().encode(
            ['tuple(string)'],
            [[expression]]
          ) as `0x${string}`,
        };
      }

      if (type === 'LOOP') {
        const maxIterations = parseInt(params.maxIterations?.toString() || '1');

        return {
          actionType: 9,
          params: new ethers.AbiCoder().encode(
            ['uint256'],
            [maxIterations]
          ) as `0x${string}`,
        };
      }

      if (type === 'FT_DEPOSIT') {
        const protocol = '0x228435d6c251e8ea7651fb7f935a11205864d2d6'; // Flying Tulip Mock Adapter
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');
        const operation = params.action?.toString() === 'withdraw' ? 1 : 0; // 0: Deposit, 1: Withdraw

        return {
          actionType: 2, // Map to LEND action type
          params: new ethers.AbiCoder().encode(
            ['address', 'uint8', 'address', 'uint256', 'bytes'],
            [protocol, operation, asset, amount, '0x']
          ) as `0x${string}`,
        };
      }

      if (type === 'FT_USD_MINT') {
        const protocol = '0x228435d6c251e8ea7651fb7f935a11205864d2d6'; // Flying Tulip Mock Adapter
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');
        const operation = params.action?.toString() === 'burn' ? 3 : 2; // 2: Mint ftUSD, 3: Burn ftUSD

        return {
          actionType: 2, // Map to LEND action type
          params: new ethers.AbiCoder().encode(
            ['address', 'uint8', 'address', 'uint256', 'bytes'],
            [protocol, operation, asset, amount, '0x']
          ) as `0x${string}`,
        };
      }

      if (type === 'FT_SWAP') {
        const dex = '0x228435d6c251e8ea7651fb7f935a11205864d2d6'; // Flying Tulip Mock Swap Adapter
        const tokenIn = params.tokenIn?.toString() || '0x0000000000000000000000000000000000000000';
        const tokenOut = params.tokenOut?.toString() || '0x0000000000000000000000000000000000000000';
        const amountIn = BigInt(params.amountIn?.toString() || '0');
        const minAmountOut = BigInt(params.minAmountOut?.toString() || '0');

        return {
          actionType: 1, // Map to SWAP action type
          params: new ethers.AbiCoder().encode(
            ['tuple(address, address, address, uint256, uint256, bytes)'],
            [[dex, tokenIn, tokenOut, amountIn, minAmountOut, '0x']]
          ) as `0x${string}`,
        };
      }

      // Fallback for unknown types
      console.warn(`⚠️ Unknown action type: ${type}`);
      return {
        actionType: 0,
        params: '0x' as `0x${string}`,
      };
    });
  };

  const generateStrategyHash = () =>
    ethers.keccak256(
      ethers.toUtf8Bytes(
        JSON.stringify({ wallet: address, blocks })
      )
    );

  const mapActionToBlock = (action: string, index: number): CanvasBlock => {
    const a = action.toLowerCase();
    let type: BlockType = 'SWAP';
    if (a.includes('flash') || a.includes('loan')) type = 'FLASH LOAN';
    else if (a.includes('swap')) type = 'SWAP';
    else if (a.includes('bridge')) type = 'BRIDGE';
    else if (a.includes('lend') || a.includes('supply')) type = 'LEND';
    else if (a.includes('borrow')) type = 'BORROW';
    else if (a.includes('stake')) type = 'STAKE';
    else if (a.includes('yield')) type = 'YIELD';
    else if (a.includes('claim') || a.includes('profit') || a.includes('repay')) type = 'CLAIM';
    else if (a.includes('condition')) type = 'CONDITION';
    else if (a.includes('loop')) type = 'LOOP';

    return {
      id: `ai-${index}-${Date.now()}`,
      type,
      chain: selectedChain,
      bridgeProvider: type === 'BRIDGE' ? 'standard' : undefined,
      provider: ['FLASH LOAN', 'LEND', 'BORROW'].includes(type) ? FLASH_PROVIDERS_BY_CHAIN[selectedChain]?.[0] || FLASH_PROVIDERS[0] : undefined,
      asset: ['FLASH LOAN', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'BRIDGE'].includes(type) ? TOKEN_OPTIONS[0] : undefined,
      amount: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE'].includes(type) ? 1000 : undefined,
      from: type === 'SWAP' ? TOKEN_OPTIONS[0] : type === 'BRIDGE' ? CHAIN_OPTIONS[0] : undefined,
      to: type === 'SWAP' ? TOKEN_OPTIONS[3] : type === 'BRIDGE' ? CHAIN_OPTIONS[1] : undefined,
      dex: type === 'SWAP' ? (DEX_OPTIONS_BY_CHAIN[selectedChain]?.[0] || DEX_OPTIONS[0]) : undefined,
      recipient: type === 'CLAIM' ? 'My Wallet' : undefined,
    };
  };

  const applyParsedIntent = async (text: string) => {
    if (!text.trim()) return;
    setIntentLoading(true);
    try {
      // Simulating AI parsing delay
      await new Promise(resolve => setTimeout(resolve, 800));
      const parsed = (await api.parseIntent({
        intent: text,
        max_usdc: 50000,
        risk_tolerance: 'medium',
      })) as any;
      const steps: string[] = parsed?.steps?.map((s: any) => s.action || s.type || s.step || String(s)) || [];
      const generated = steps.length > 0
        ? steps.slice(0, 6).map((s, i) => mapActionToBlock(s, i))
        : [
            mapActionToBlock('flash loan', 0),
            mapActionToBlock('swap', 1),
            mapActionToBlock('swap', 2),
            mapActionToBlock('claim', 3),
          ];
      setBlocks(generated);
      setSimResult(null);
      setSimStatus('idle');
    } catch {
      // Intent error handling removed
    } finally {
      setIntentLoading(false);
    }
  };

  const canAddModule = (type: BlockType) => {
    const count = blocks.filter((b) => b.type === type).length;
    const hasClaim = blocks.some((b) => b.type === 'CLAIM');
    const supported = MODULE_SUPPORT_BY_CHAIN[selectedChain] || [];

    if (!supported.includes(type)) return false;
    if (hasClaim) return false;
    if (blocks.length >= 6) return false;

    if (blocks.length === 0) {
      return type === 'FLASH LOAN' || type === 'BRIDGE' || type === 'SWAP' || type === 'FT DEPOSIT' || type === 'FT USD MINT' || type === 'FT SWAP';
    }

    if (type === 'FLASH LOAN') return false;
    if (type === 'CLAIM') return blocks.length >= 2 && count === 0;
    if (type === 'SWAP' || type === 'FT SWAP') return count < 3;

    if (['BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT'].includes(type)) {
      return count === 0;
    }

    return false;
  };

  const addBlock = (type: BlockType) => {
    if (!canAddModule(type)) return;
    const chain = selectedChain;
    const block: CanvasBlock = {
      id: `${type}-${Date.now()}`,
      type,
      chain,
      bridgeProvider: type === 'BRIDGE' ? 'standard' : undefined,
      provider: ['FLASH LOAN', 'LEND', 'BORROW'].includes(type)
        ? FLASH_PROVIDERS_BY_CHAIN[chain]?.[0] || FLASH_PROVIDERS[0]
        : undefined,
      asset: ['FLASH LOAN', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'BRIDGE'].includes(type) ? TOKEN_OPTIONS[0] : undefined,
      amount: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE'].includes(type) ? 1000 : undefined,
      from: type === 'SWAP' ? TOKEN_OPTIONS[0] : type === 'BRIDGE' ? CHAIN_OPTIONS[0] : undefined,
      to: type === 'SWAP' ? TOKEN_OPTIONS[3] : type === 'BRIDGE' ? CHAIN_OPTIONS[1] : undefined,
      dex: type === 'SWAP' ? (DEX_OPTIONS_BY_CHAIN[chain]?.[0] || DEX_OPTIONS[0]) : undefined,
      recipient: type === 'CLAIM' ? 'My Wallet' : undefined,
      position: { x: blocks.length * 320 + 50, y: 150 }
    };
    setBlocks((prev) => [...prev, block]);
    setSimResult(null);
    setSimStatus('idle');
  };

  function removeBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setSimResult(null);
    setSimStatus('idle');
  };

  function updateBlock(id: string, patch: Partial<CanvasBlock>) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    setSimResult(null);
    setSimStatus('idle');
  };

  // Fallback estimates when backend is unavailable
  const fallbackProfit = useMemo(() => {
    const flash = blocks.find((b) => b.type === 'FLASH LOAN')?.amount || 0;
    return Number((flash * 0.0084).toFixed(2));
  }, [blocks]);

  const fallbackToken = useMemo(() => {
    const firstBlock = blocks.find((b) => b.type === 'FLASH LOAN') || blocks[0];
    return firstBlock?.asset || (firstBlock as any)?.tokenIn || firstBlock?.from || 'USDC';
  }, [blocks]);

  const fallbackAmount = useMemo(() => {
    const firstBlock = blocks.find((b) => b.type === 'FLASH LOAN') || blocks[0];
    return Number(firstBlock?.amount || (firstBlock as any)?.amountIn || 10000);
  }, [blocks]);

  const displayProfit = simResult?.netProfit ?? fallbackProfit;
  const displayProfitUsd = simResult?.netProfitUsd ?? fallbackProfit;
  const displayProfitToken = simResult?.profitToken ?? fallbackToken;
  const displayNotionalAmount = simResult?.notionalAmount ?? fallbackAmount;
  const displayNotionalToken = simResult?.notionalToken ?? fallbackToken;

  const displayGas = simResult
    ? `${simResult.gasCostEth.toFixed(5)} ETH`
    : `${(0.002 + blocks.length * 0.0002).toFixed(4)} ETH`;
  const displayConfidence = simResult
    ? Math.round((1 - simResult.failureProbability) * 100)
    : Math.min(95, 18 + blocks.length * 9);
  const displayNetworkRoute = simResult?.networkRoute || 'Private Route · Base';
  const displayExecutionRegion = simResult?.executionRegion || '';

  const simulate = async () => {
    if (blocks.length === 0) {
      setTxError('Simulate icin once en az bir blok ekleyin.');
      setSimStatus('error');
      return;
    }
    setTxError(null);
    
    // Validate blocks before simulation
    const validation = validateBlocks();
    if (!validation.valid) {
      setTxError('Missing parameters: ' + validation.errors.join('; '));
      setSimStatus('error');
      return;
    }
    
    setSimModal({ open: true, stage: 'running' });
    setSimStep(0);
    setSimStatus('running');
    setSimResult(null);

    const stepTimer = setInterval(() => {
      setSimStep((v) => (v < 4 ? v + 1 : v));
    }, 650);

    try {
      const payload = {
        nodes: buildNodes(),
        slippage_bps: 50,
        gas_priority: 'standard',
        gas_price_gwei: 15,
        eth_price_usd: 3000,
      };
      console.log('🔄 Simulating strategy with payload:', JSON.stringify(payload, null, 2));
      const res = (await api.simulateStrategy(payload)) as any;
      console.log('✅ Strategy simulated successfully:', res);
      const sim = res?.simulation || res;
      setSimResult({
        netProfitUsd: Number(sim?.netProfitUsd ?? sim?.net_profit_usd ?? fallbackProfit),
        netProfit: Number(sim?.netProfit ?? sim?.netProfitUsd ?? fallbackProfit),
        profitToken: sim?.profitToken ?? fallbackToken,
        notionalAmount: Number(sim?.notionalAmount ?? fallbackAmount),
        notionalToken: sim?.notionalToken ?? fallbackToken,
        gasCostEth: Number(sim?.gasCostEth ?? sim?.gas_cost_eth ?? 0.002),
        profitable: Boolean(sim?.profitable ?? true),
        failureProbability: Number(sim?.failureProbability ?? sim?.failure_probability ?? 0.12),
        estimatedGas: Number(sim?.estimatedGas ?? sim?.estimated_gas ?? 250000),
      });
      setTxError(null);
      setSimStatus('done');
      setSimModal({ open: true, stage: 'done' });
    } catch (err: any) {
      console.error('❌ Strategy simulation failed:', err);
      setTxError(`Simulation failed: ${err?.message || 'Unknown error'}`);
      setSimStatus('error');
      setSimModal({ open: true, stage: 'done' });
    } finally {
      clearInterval(stepTimer);
    }
  };

  const handleExecute = async () => {
    console.log('🚀 handleExecute called');
    if (blocks.length === 0) return;
    
    // Validate blocks before compilation
    const validation = validateBlocks();
    if (!validation.valid) {
      setTxError('Missing parameters: ' + validation.errors.join('; '));
      setShowExecuteModal(true);
      return;
    }
    
    setCompiling(true);
    setTxError(null);
    resetWrite?.();

    // Retry logic with exponential backoff
    const maxRetries = 3;
    let lastError: any = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const payload = {
          nodes: buildNodes(),
          slippage_bps: 50,
          gas_priority: 'fast',
        };
        console.log(`🔄 Compiling strategy (attempt ${attempt}/${maxRetries}):`, JSON.stringify(payload, null, 2));
const compiled = (await api.compileStrategy(
          {
            nodes: buildNodes(),
            slippage_bps: 50,
            gas_priority: 'fast',
          },
          { timeout: 45000 }
        )) as any;

      console.log('✅ Raw API response:', compiled);
      if (!compiled?.actions?.length) {
        throw new Error('Backend returned empty actions array. Check block parameters.');
      }

        compiledStrategyRef.current = compiled;
        setCompiledStrategy(compiled);
        sessionStorage.setItem('brick3_compiled_strategy', JSON.stringify(compiled));
        console.log('✅ Compiled strategy saved, opening modal with', compiled.actions.length, 'actions');
        setShowExecuteModal(true);
        setCompiling(false);
        return;
        
      } catch (err: any) {
        lastError = err;
        console.error(`❌ Strategy compilation failed (attempt ${attempt}/${maxRetries}):`, err?.message);
        
        if (attempt < maxRetries) {
          const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }
    
    // All retries failed
    console.error('❌ All compilation attempts failed:', lastError);
    const errorMsg = lastError?.message || 'Backend compilation service unavailable';
    setTxError(
      lastError?.name === 'AbortError' 
        ? `Compilation timeout after 45s. Backend may be slow or unreachable on port 8001.`
        : `Compilation failed: ${errorMsg}`
    );
    compiledStrategyRef.current = null;
    setCompiledStrategy(null);
    setCompiling(false);
  };

  async function executeBridgeBlock(block: CanvasBlock) {
    try {
      const fromChain = (block.from || 'Ethereum').toLowerCase();
      const toChain = (block.to || 'Base').toLowerCase();
      const token = block.asset || 'USDC';
      const amount = Number(block.amount || 0);

      if (!amount || amount <= 0) {
        setTxError('Bridge amount must be greater than zero.');
        return;
      }

      const bridge = block.bridgeProvider === 'opacus' ? 'opacus' : 'across';
      const res = await api.bridgeTransfer({
        from_chain: fromChain,
        to_chain: toChain,
        token,
        amount,
        bridge,
      }) as any;

      setTxError(null);
      setSimStatus('done');
      toast({
        title: 'Bridge executed',
        description: `${token} ${amount} ${fromChain} -> ${toChain} via ${bridge} (${res?.execution_time_ms || 'n/a'}ms)`,
        variant: 'success',
      });
    } catch (err: any) {
      const msg = err?.message || 'Bridge execution failed';
      setTxError(msg);
      toast({
        title: 'Bridge failed',
        description: msg,
        variant: 'destructive',
      });
    }
  };

  const confirmExecute = async () => {
    console.log('🚀 confirmExecute called');
    
    // Priority: ref (always current) → state → sessionStorage
    let strategy: BackendCompiledStrategy | null =
      compiledStrategyRef.current || compiledStrategy;
    if (!strategy) {
      const saved = sessionStorage.getItem('brick3_compiled_strategy');
      if (saved) {
        try {
          strategy = JSON.parse(saved);
          compiledStrategyRef.current = strategy;
          console.log('📦 Recovered strategy from sessionStorage, actions:', strategy?.actions?.length);
        } catch { /* ignore parse errors */ }
      }
    }
    
    console.log('🚀 strategy actions:', strategy?.actions?.length);
    
    setTxError(null);

    if (!isConnected || !address) {
      setTxError('Connect your wallet to execute on-chain.');
      return;
    }

    const actions = buildOnchainActions(strategy);
    
    console.log('🔧 Built actions:', actions);
    console.log('🔧 Actions length:', actions.length);

    // Check if actions are populated BEFORE doing anything on-chain
    if (actions.length === 0) {
      setTxError('No actions compiled. Please click Execute again to recompile the strategy.');
      return;
    }

    const strategyHash = generateStrategyHash() as `0x${string}`;

    try {
      console.log('🔒 Checking/registering strategyHash on-chain:', strategyHash);
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      
      // Prevent BAD_DATA error by checking if we're on the right chain
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(8453)) {
        try {
          // Request MetaMask to switch networks
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // 8453 in hex
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x2105',
                    chainName: 'Base Mainnet',
                    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://mainnet.base.org'],
                    blockExplorerUrls: ['https://basescan.org'],
                  },
                ],
              });
            } catch (addError) {
              setTxError('Could not add Base network. Please add it manually.');
              return;
            }
          } else {
            setTxError('You rejected the network switch. Please switch to Base to continue.');
            return;
          }
        }
        
        // Wait briefly for MetaMask to apply the network switch
        await new Promise(r => setTimeout(r, 1500));
        const updatedNetwork = await provider.getNetwork();
        if (updatedNetwork.chainId !== BigInt(8453)) {
          setTxError('Network switch failed. Please change MetaMask network to Base manually.');
          return;
        }
      }
      
      const signer = await provider.getSigner();
      const registry = new ethers.Contract(
        BRICK3_CONTRACTS.StrategyRegistry,
        strategyRegistryAbi,
        signer
      );
      const creator: string = await registry.getCreator(strategyHash);
      const alreadyRegistered = creator !== ethers.ZeroAddress;
      if (alreadyRegistered) {
        console.log('✅ Strategy already registered, skipping TX1.');
      } else {
        const registerTx = await registry.registerStrategy(strategyHash, `ipfs://brick3-canvas/${strategyHash}`);
        await registerTx.wait();
        console.log('✅ Strategy registered.');
      }
    } catch (err: any) {
      console.error('🧨 Strategy registration failed:', err);
      setTxError(`Strategy registration failed: ${err?.message || String(err)}`);
      return;
    }

    // Check if actions are populated
    if (actions.length === 0) {
      setTxError('No actions compiled. Strategy is empty.');
      return;
    }

    try {
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 300);
      const minProfitWei = BigInt(0);
      console.log('🧠 executeStrategy args:', { 
        actionsLength: actions.length, 
        minProfitWei, 
        deadline, 
        strategyHash 
      });
      
      // Use ethers directly to bypass CORS issues with Wagmi simulation
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const bandle = new ethers.Contract(
        BRICK3_CONTRACTS.BandleRouter,
        bandleRouterAbi,
        signer
      );
      
      console.log('🚀 Sending executeStrategy transaction...');
        // Disable automatic estimateGas by setting a fixed gasLimit so MetaMask still pops up!
        const tx = await bandle.executeStrategy(actions, minProfitWei, deadline, strategyHash, {
          gasLimit: 3000000
        });
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);
      setTxError(null);
      sessionStorage.removeItem('brick3_compiled_strategy');
      setShowExecuteModal(false);
    } catch (err: any) {
      console.error('🧨 executeStrategy failed:', err);
      const errString = err.reason || err.message || String(err);
      if (errString.includes("execution reverted") || errString.includes("CALL_EXCEPTION")) {
         setTxError("Execution Reverted: The on-chain execution failed.");
      } else {
         setTxError(`Execute failed: ${errString.slice(0, 200)}...`);
      }
    }
  };

  const saveStrategy = () => {
    const key = `brick3_strategy_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ blocks, savedAt: Date.now() }));
  };

  return (
    <div className="h-full bg-[#0A0505] text-white flex flex-col">
      <div className="grid grid-cols-[200px_1fr] flex-1 min-h-0">

        {/* Left: Module Library */}
        <aside className="border-r border-white/10 p-3 space-y-2 overflow-y-auto">
          <p className="text-[11px] uppercase tracking-wider text-white/40 mb-3">Modules</p>
          {MODULES.map((m) => (
            <button
              key={m}
              disabled={!canAddModule(m)}
              draggable
              onDragStart={() => setDragging(m)}
              onClick={() => addBlock(m)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm flex items-center gap-2.5 transition-colors ${
                canAddModule(m)
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-white/5 bg-white/[0.02] text-white/25 cursor-not-allowed'
              }`}
            >
              <span>{m}</span>
            </button>
          ))}
        </aside>

        {/* Center: Canvas */}
        <main
          className="relative flex-1 min-h-0 overflow-hidden"
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => { if (dragging) { addBlock(dragging); setDragging(null); } }}
        >
          {/* Floating Strategy Builder */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-5xl rounded-2xl border border-white/10 bg-[#11151F]/90 backdrop-blur-xl p-3 shadow-2xl flex items-center gap-4">
            <p className="text-[11px] uppercase tracking-wider text-white/40 whitespace-nowrap hidden sm:block">Strategy Builder</p>
            
            <div className="flex-1 flex items-center gap-3 bg-[#0E121A] border border-white/10 rounded-lg p-1.5">
              <input
                value={intentText}
                onChange={(e) => { setIntentText(e.target.value); }}
                placeholder="Arbitrage ETH price differences"
                className="flex-1 bg-transparent px-2 py-1 text-sm text-white placeholder:text-white/30 outline-none"
              />
              <button
                onClick={() => applyParsedIntent(intentText)}
                disabled={intentLoading}
                className="px-4 py-1.5 rounded bg-white text-black text-xs font-medium disabled:opacity-50 whitespace-nowrap"
              >
                {intentLoading ? 'Building…' : 'Generate'}
              </button>
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-4">
              <label className="text-[10px] text-white/40 uppercase hidden sm:block">Network</label>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="rounded-lg border border-white/10 bg-[#0E121A] px-2 py-1.5 text-xs text-white outline-none"
              >
                {NETWORK_OPTIONS.map((n) => (
                  <option key={n} value={n} disabled={n !== 'Base'}>
                    {n !== 'Base' ? `${n} (Coming Soon)` : n}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div className="w-full h-full bg-[#0F121A]">
            {blocks.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-center gap-2">
                <span className="material-symbols-outlined text-white/25" style={{ fontSize: '32px' }}>add_circle</span>
                <p className="text-white/40 text-sm">Click or drag modules to add steps</p>
                <p className="text-white/25 text-xs">No funds at risk until you execute</p>
              </div>
            ) : (
              <ReactFlow 
                nodes={reactFlowNodes} 
                edges={reactFlowEdges} 
                onNodesChange={onNodesChange}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background variant={BackgroundVariant.Dots} gap={16} color="#ffffff20" />
                <Controls className="!bg-[#11151F] !border-white/10 !text-white [&>button]:!border-b-white/10" />
              </ReactFlow>
            )}
          </div>
        </main>
      </div>

      {/* Action Bar */}
      <div className="h-[68px] border-t border-white/10 bg-[#0B0D12] px-6 flex items-center justify-end gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={simulate}
          disabled={simStatus === 'running'}
          className="px-4 py-2 rounded-xl border border-white/15 text-white/90 hover:bg-white/10 disabled:opacity-40 text-sm transition-colors relative overflow-hidden"
        >
          {simStatus === 'running' && (
            <div className="absolute inset-0 bg-white/5 animate-pulse" />
          )}
          <span className="relative z-10">{simStatus === 'running' ? 'Simulating…' : 'Simulate'}</span>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={saveStrategy}
          disabled={blocks.length === 0}
          className="px-4 py-2 rounded-xl border border-white/15 text-white/90 hover:bg-white/10 disabled:opacity-40 text-sm transition-colors"
        >
          Save
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExecute}
          disabled={blocks.length === 0 || compiling}
          className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)] relative overflow-hidden"
        >
          {compiling && (
             <div className="absolute inset-0 bg-black/5 animate-pulse" />
          )}
          <span className="relative z-10">{compiling ? 'Compiling…' : 'Execute'}</span>
        </motion.button>
      </div>

      {txError && !showExecuteModal && (
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300 leading-relaxed">
            {txError}
          </div>
        </div>
      )}

      {simModal.open && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[115] flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#11151F] p-6">
            {simModal.stage === 'running' ? (
              <>
                <h3 className="text-xl font-semibold text-white">Running secure execution simulation...</h3>
                <div className="mt-4 space-y-2 text-sm">
                  {[
                    'Analyzing liquidity',
                    'Finding optimal route',
                    'Protecting execution',
                    'Estimating profitability',
                    'Finalizing strategy',
                  ].map((s, idx) => (
                    <div key={s} className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${simStep >= idx ? 'bg-red-500' : 'bg-white/20'}`}></span>
                      <span className={simStep >= idx ? 'text-white' : 'text-white/45'}>{s}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-white">Simulation Complete</h3>
                <div className="mt-4 space-y-2 text-sm">
                  <p className="text-white/70">Estimated Net: <span className="text-red-500">+{displayProfit.toFixed(2)} {displayProfitToken}</span> <span className="text-white/40 text-xs">(${displayProfitUsd.toFixed(2)})</span></p>
                  <p className="text-white/70">Execution Risk: <span className="text-white">{displayConfidence >= 70 ? 'Low' : displayConfidence >= 50 ? 'Medium' : 'High'}</span></p>
                  <p className="text-white/70">Protected Route: <span className="text-white">Enabled</span></p>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={handleExecute} className="px-4 py-2 rounded-xl bg-white text-black text-sm font-medium">Execute</button>
                  <button onClick={() => setSimModal({ open: false, stage: 'done' })} className="px-4 py-2 rounded-xl border border-white/15 text-white/85 text-sm">Edit Strategy</button>
                  <button onClick={() => { saveStrategy(); setSimModal({ open: false, stage: 'done' }); }} className="px-4 py-2 rounded-xl border border-white/15 text-white/85 text-sm">Save Strategy</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Execute Modal */}
      {showExecuteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#11151F] p-6 space-y-5">
            {isTxConfirmed ? (
              <>
                <div className="text-center space-y-2">
                  <div className="text-4xl">✓</div>
                  <h3 className="text-xl font-semibold text-white">Execution Confirmed</h3>
                  <p className="text-white/55 text-sm">Your strategy executed successfully on Base.</p>
                </div>
                {writeTxData?.hash && (
                  <a
                    href={`https://basescan.org/tx/${writeTxData.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-sm text-[#00e5ff] hover:underline"
                  >
                    View on Etherscan →
                  </a>
                )}
                <button
                  onClick={() => { setShowExecuteModal(false); resetWrite?.(); }}
                  className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-medium"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-semibold text-white">Confirm Execution</h3>
                  <p className="text-white/45 text-sm mt-1">Review before submitting to Base.</p>
                </div>

                <div className="space-y-2.5 text-sm bg-white/[0.03] rounded-xl p-4">
                  <div className="flex justify-between">
                    <span className="text-white/55">Steps</span>
                    <span className="text-white">{blocks.length} module{blocks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Notional</span>
                    <span className="text-white">
                      {displayNotionalAmount.toLocaleString()} {displayNotionalToken}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Est. Profit</span>
                    <span className="text-red-500">+{displayProfit.toFixed(2)} {displayProfitToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Gas</span>
                    <span className="text-white">{displayGas}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                      <span className="text-white/55">Settlement</span>
                      <span className="text-white">{displayNetworkRoute}</span>
                    </div>
                    {displayExecutionRegion && (
                      <div className="flex justify-between items-center">
                        <span className="text-white/55">Execution Region</span>
                        <span className="text-[#A2FFE6] text-xs font-mono bg-[#A2FFE6]/10 px-2 py-0.5 rounded-full">{displayExecutionRegion}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Compiled</span>
                    <span className={compiledStrategy ? 'text-red-500' : 'text-yellow-400'}>
                      {compiledStrategy ? '✓ Ready' : 'Fallback mode'}
                    </span>
                  </div>
                </div>

                {!isConnected && (
                  <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 p-3 text-xs text-yellow-300">
                    Connect your wallet to execute on-chain.
                  </div>
                )}

                {(txError || writeError) && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300 whitespace-pre-wrap">
                    {txError || writeError?.message || 'Transaction declined. The market may have moved. No funds were lost.'}
                  </div>
                )}

                {isTxConfirming && (
                  <div className="flex items-center gap-2 text-sm text-white/55">
                    <span>·</span>
                    Waiting for confirmation…
                    {writeTxData?.hash && (
                      <a
                        href={`https://basescan.org/tx/${writeTxData.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00e5ff] text-xs"
                      >
                        Track →
                      </a>
                    )}
                  </div>
                )}

                {isWriteLoading && (
                  <p className="text-sm text-white/55">Confirm in wallet…</p>
                )}

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowExecuteModal(false); resetWrite?.(); }}
                    className="px-4 py-2 rounded-xl border border-white/15 text-white/80 hover:text-white text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmExecute}
                    disabled={isWriteLoading || isTxConfirming || !isConnected || (!compiledStrategy && !compiledStrategyRef.current)}
                    className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40"
                    title={(!compiledStrategy && !compiledStrategyRef.current) ? 'Recompile first - click Execute' : undefined}
                  >
                    {isWriteLoading ? 'Confirm in Wallet…' : isTxConfirming ? 'Broadcasting…' : 'Execute on Chain'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
