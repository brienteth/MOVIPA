import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useContractWrite, useWaitForTransaction } from 'wagmi';
import { motion } from 'framer-motion';
import ReactFlow, { Background, Controls, NodeChange, BackgroundVariant } from 'reactflow';
import 'reactflow/dist/style.css';
import ModuleNode from '../../components/canvas/ModuleNode';
import { api } from '../../lib/api';
import { BRICK3_CONTRACTS_BY_CHAIN, bandleRouterAbi, strategyRegistryAbi } from '../../lib/contracts';
import { useToast } from '../../hooks/use-toast';

import { simulationEngine } from '../../services/simulationEngine';
import { useSimulationStore } from '../../store/simulation.store';

const TUTORIAL_CONTENT: Record<BlockType, { title: string; desc: string }> = {
  'FLASH LOAN': { title: 'Flash Loan', desc: 'Borrow uncollateralized funds for a single transaction. You must return the funds + fee within the same block.' },
  'SWAP': { title: 'Swap', desc: 'Exchange one token for another using the best available Decentralized Exchange (DEX).' },
  'BRIDGE': { title: 'Bridge', desc: 'Transfer assets seamlessly between different blockchains.' },
  'LEND': { title: 'Lend', desc: 'Supply assets to lending protocols (like Aave or Morpho) to earn interest.' },
  'BORROW': { title: 'Borrow', desc: 'Borrow assets against your deposited collateral.' },
  'STAKE': { title: 'Stake', desc: 'Deposit tokens (e.g., ETH) to receive Liquid Staking Tokens (like stETH) and earn staking rewards.' },
  'YIELD': { title: 'Yield', desc: 'Deposit assets into yield aggregators to maximize your passive returns.' },
  'REPAY': { title: 'Repay', desc: 'Pay back your borrowed debt.' },
  'RETURN FUNDS': { title: 'Return Funds', desc: 'Return flash loaned funds back to the flash loan provider.' },
  'CLAIM': { title: 'Claim', desc: 'Claim accrued rewards from lending, staking, or farming.' },
  'CONDITION': { title: 'Condition', desc: 'Execute logic only if specific market conditions (prices, rates) are met.' },
  'LOOP': { title: 'Loop', desc: 'Repeat a set of actions recursively (e.g., recursive borrowing for leverage).' },
  'FT DEPOSIT': { title: 'Flying Tulip Deposit', desc: 'Deposit collateral once and use it simultaneously for lending, borrow margin, and trading on Flying Tulip.' },
  'FT USD MINT': { title: 'Mint ftUSD', desc: 'Mint yield-bearing ftUSD using your deposited collateral, providing delta-neutral yield for idle assets.' },
  'FT SWAP': { title: 'Flying Tulip Swap', desc: 'Swap with depth-aware pricing directly through the Flying Tulip CLOB/AMM routing adapter.' },
  'FT STAKE': { title: 'Stake ftUSD (Yield)', desc: 'Stake your ftUSD to receive sftUSD, accruing delta-neutral yields over time.' },
};

type BlockType = 'FLASH LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'REPAY' | 'RETURN FUNDS' | 'CLAIM' | 'CONDITION' | 'LOOP' | 'FT DEPOSIT' | 'FT USD MINT' | 'FT SWAP' | 'FT STAKE';

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
  amountMode?: 'fixed' | 'dynamic';
  sourceNodeId?: string;
  is_previous_output?: boolean;
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
  failingNode?: string | null;
  revertReason?: string | null;
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

const MODULES: BlockType[] = ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'];

const TOKEN_OPTIONS = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH', 'WBTC', 'ftUSD', 'sftUSD'] as const;
const CHAIN_OPTIONS = ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', '0G', 'Sonic'] as const;
const NETWORK_OPTIONS = CHAIN_OPTIONS;
const FLASH_PROVIDERS = ['Aave', 'Balancer', 'Morpho'] as const;
const DEX_OPTIONS = ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer', 'Flying Tulip CLOB'] as const;
const DEX_OPTIONS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer', 'Flying Tulip CLOB'],
  Base: ['Auto', 'Uniswap', 'SushiSwap', 'Balancer', 'Curve', 'CowSwap', 'Flying Tulip CLOB'],
  Arbitrum: ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer', 'Flying Tulip CLOB'],
  Optimism: ['Auto', 'Uniswap', 'Curve', 'SushiSwap', 'Balancer', 'Flying Tulip CLOB'],
  Polygon: ['Auto', 'QuickSwap', 'Curve', 'SushiSwap', 'Balancer', 'Flying Tulip CLOB'],
  '0G': ['Auto', '0G DEX'],
  Sonic: ['Auto', 'Shadow Exchange', 'Equalizer', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer', 'Flying Tulip CLOB'],
};
const FLASH_PROVIDERS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave', 'Balancer', 'Morpho', 'dYdX'],
  Base: ['Aave', 'Morpho', 'dYdX'],
  Arbitrum: ['Aave', 'dYdX'],
  Optimism: ['Aave'],
  Polygon: ['Aave'],
  '0G': ['Aave'],
  Sonic: ['Aave', 'Morpho', 'dYdX'],
};
const MODULE_SUPPORT_BY_CHAIN: Record<string, Array<CanvasBlock['type']>> = {
  Ethereum: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'],
  Base: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'],
  Arbitrum: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'],
  Optimism: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'],
  Polygon: ['SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'],
  '0G': ['SWAP', 'BRIDGE', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP'],
  Sonic: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'REPAY', 'RETURN FUNDS', 'CLAIM', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'],
};

const TOKEN_ADDRESSES_BY_CHAIN: Record<string, Record<string, string>> = {
  Base: {
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    'USDT': '0x0000000000000000000000000000000000000000',
    'DAI': '0x0000000000000000000000000000000000000000',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x4200000000000000000000000000000000000006',
    'WBTC': '0x0000000000000000000000000000000000000000',
    'ftUSD': '0x7bb700f9f3d2db8df6e235ce144f6b001a1d1ed5',
    'sftUSD': '0x7bb700f9f3d2db8df6e235ce144f6b001a1d1ed6',
  },
  Sonic: {
    'USDC': '0x29219dd400f2Bf60E5a23d13Be72B486D4038894',
    'USDT': '0x0000000000000000000000000000000000000000',
    'DAI': '0x0000000000000000000000000000000000000000',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x50c4271a269386c6b17dc69a5a4086ad2791d01b',
    'WBTC': '0x0000000000000000000000000000000000000000',
    'ftUSD': '0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718D',
    'sftUSD': '0x618A13a1dE79cde892a1cA5B3FC24D4AA66b718E',
  },
  Ethereum: {
    'USDC': '0xA0b86a33E6441e88C5F2712C3E9b74F5c4d6E3E6',
    'USDT': '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    'DAI': '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0xC02aaA39b223FE8D0A0e5C4F27ead9083C756Cc2',
    'WBTC': '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    'ftUSD': '0x0000000000000000000000000000000000000000',
  },
  Arbitrum: {
    'USDC': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    'USDT': '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c0890698',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x82aF49447D8a07e3bd95BD0d56f352415231aa11',
    'WBTC': '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    'ftUSD': '0x0000000000000000000000000000000000000000',
  },
  Optimism: {
    'USDC': '0x0b2C639c53A0d312891d604cEE0ddC1BCA43D36F',
    'USDT': '0x94b008aA00579c1307B0EF2c4B2A7002277BE55f',
    'DAI': '0xDA10009cBd5D07dd0CeCc66161FC93D7c0890698',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x4200000000000000000000000000000000000006',
    'WBTC': '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    'ftUSD': '0x0000000000000000000000000000000000000000',
  },
  Polygon: {
    'USDC': '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x7ceB23fD6bC3adD59E62ac25578270cFf1b9f619',
    'WBTC': '0x1BFD67037B42Cf73acF2047067bd4F2C47d9BfD6',
    'ftUSD': '0x0000000000000000000000000000000000000000',
  },
  '0G': {
    'USDC': '0x0000000000000000000000000000000000000000',
    'USDT': '0x0000000000000000000000000000000000000000',
    'DAI': '0x0000000000000000000000000000000000000000',
    'ETH': '0x0000000000000000000000000000000000000000',
    'WETH': '0x0000000000000000000000000000000000000000',
    'WBTC': '0x0000000000000000000000000000000000000000',
    'ftUSD': '0x0000000000000000000000000000000000000000',
  }
};

export default function CanvasPage() {
  const { address, isConnected } = useAccount();
  const { toast } = useToast();
  const [selectedChain, setSelectedChain] = useState<string>('Base');
  const [blocks, setBlocks] = useState<CanvasBlock[]>([]);
  const [tutorialModal, setTutorialModal] = useState<BlockType | null>(null);
  const [dragging, setDragging] = useState<BlockType | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const currentChainId = selectedChain === 'Base' ? 8453 : selectedChain === 'Sonic' ? 146 : 11155111;
  const currentContracts = BRICK3_CONTRACTS_BY_CHAIN[currentChainId] || BRICK3_CONTRACTS_BY_CHAIN[8453];

  const TOKEN_ADDRESSES = TOKEN_ADDRESSES_BY_CHAIN[selectedChain] || TOKEN_ADDRESSES_BY_CHAIN['Base'];
  const ADDRESS_TO_TOKEN = useMemo(() => {
    return Object.entries(TOKEN_ADDRESSES).reduce((acc, [symbol, address]) => {
      acc[address.toLowerCase()] = symbol;
      return acc;
    }, {} as Record<string, string>);
  }, [TOKEN_ADDRESSES]);

  const formatTokenName = useCallback((token: string) => {
    if (!token) return '';
    return ADDRESS_TO_TOKEN[token.toLowerCase()] || token;
  }, [ADDRESS_TO_TOKEN]);

  const validateCanvasDAG = useCallback((blocksList: CanvasBlock[]): string | null => {
    if (blocksList.length === 0) return null;

    const normalizeToken = (t?: string) => {
      if (!t) return '';
      const addr = TOKEN_ADDRESSES[t] || t;
      return addr.toLowerCase();
    };

    // 1. Unrepaid Flash Loan Check
    const hasFlashLoan = blocksList.some(b => b.type === 'FLASH LOAN');
    const hasRepay = blocksList.some(b => b.type === 'REPAY' || b.type === 'RETURN FUNDS');
    if (hasFlashLoan && !hasRepay) {
      return "Critical Error: The strategy contains a FLASH LOAN but no REPAY or RETURN FUNDS step has been added to close the loan!";
    }

    // 2. Naked Borrow Check
    let hasCollateral = false;
    for (const b of blocksList) {
      if (['LEND', 'FT DEPOSIT', 'FLASH LOAN', 'STAKE', 'YIELD'].includes(b.type)) {
        hasCollateral = true;
      } else if (['BORROW', 'FT USD MINT'].includes(b.type)) {
        if (!hasCollateral) {
          return `Critical Error: A Deposit/Lend or Flash Loan step must exist before the ${b.type} step to create collateral (Naked Borrow detected)!`;
        }
      }
    }

    // 3. Asset Mismatch & Flow Check
    let activeAssets: string[] = [];
    for (let i = 0; i < blocksList.length; i++) {
      const b = blocksList[i];
      const type = b.type;
      
      if (type === 'FLASH LOAN') {
        const asset = b.asset;
        if (asset) {
          activeAssets.push(normalizeToken(asset));
        }
      } else if (type === 'SWAP' || type === 'FT SWAP') {
        const tokenIn = b.from;
        const tokenOut = b.to;
        if (!tokenIn) {
          continue;
        }
        
        const normIn = normalizeToken(tokenIn);
        const normOut = normalizeToken(tokenOut);
        
        let isValidInput = false;
        for (const a of activeAssets) {
          if (a === normIn || normIn.includes(a) || a.includes(normIn)) {
            isValidInput = true;
            break;
          }
        }
        
        if (!isValidInput && activeAssets.length > 0) {
          return `Critical Error: The input asset for the Swap step (${tokenIn}) does not match the assets generated in previous steps! Either insufficient liquidity was found in the selected pool or the pool address is invalid. Please check the amounts and routing steps.`;
        }
        
        activeAssets = activeAssets.filter(a => a !== normIn);
        if (tokenOut) {
          activeAssets.push(normOut);
        }
      } else if (['BRIDGE', 'LEND', 'FT DEPOSIT', 'STAKE', 'YIELD'].includes(type)) {
        const asset = b.asset;
        if (!asset) continue;
        
        const normAsset = normalizeToken(asset);
        let isValidInput = false;
        for (const a of activeAssets) {
          if (a === normAsset || normAsset.includes(a) || a.includes(normAsset)) {
            isValidInput = true;
            break;
          }
        }
        
        if (!isValidInput && activeAssets.length > 0) {
          return `Critical Error: The input asset for the ${type} step (${asset}) does not match the assets generated in previous steps! Please check the amounts and routing steps.`;
        }
      } else if (['BORROW', 'FT USD MINT'].includes(type)) {
        if (type === 'FT USD MINT') {
          activeAssets.push(normalizeToken('ftUSD'));
        } else {
          const asset = b.asset;
          if (asset) {
            activeAssets.push(normalizeToken(asset));
          }
        }
      }
    }

    return null;
  }, [TOKEN_ADDRESSES]);

  useEffect(() => {
    setValidationError(validateCanvasDAG(blocks));
  }, [blocks, validateCanvasDAG]);

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
    data: {
      block: b,
      index: i,
      selectedChain,
      onUpdate: updateBlock,
      onRemove: removeBlock,
      onExecuteBridge: executeBridgeBlock,
      previousBlocks: blocks.slice(0, i)
    }
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
    address: currentContracts.BandleRouter as `0x${string}`,
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
      'REPAY': [],
      'RETURN FUNDS': [],
      'CONDITION': [],
      'LOOP': [],
      'FT DEPOSIT': ['asset', 'amount'],
      'FT USD MINT': ['asset', 'amount'],
      'FT SWAP': ['from', 'to', 'amount'],
      'FT STAKE': ['asset', 'amount'],
    };

    blocks.forEach((b, idx) => {
      const reqs = required[b.type] || [];
      reqs.forEach((field) => {
        if (field === 'amount' && b.amountMode === 'dynamic') {
          if (!b.sourceNodeId) {
            errors.push(`Block ${idx + 1} (${b.type}): missing "sourceNodeId" for dynamic amount`);
          }
          return;
        }
        const value = b[field as keyof CanvasBlock];
        if (!value) {
          errors.push(`Block ${idx + 1} (${b.type}): missing "${field}"`);
        }
      });
    });

    return { valid: errors.length === 0, errors };
  };

  const getDecimals = (assetAddress: string) => {
    if (!assetAddress) return 18;
    const lower = assetAddress.toLowerCase();
    if (lower === '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913') return 6; // USDC on Base
    if (lower === '0x29219dd400f2bf60e5a23d13be72b486d4038894') return 6; // USDC on Sonic
    if (lower === '0x50c5725949a6f0c72e6c4a641f24049a917db0cb') return 6; // USDT on Base
    return 18;
  };

  const scaleAmount = (amount: string | number | undefined, assetAddress: string) => {
    try {
      if (!amount) return '0';
      const decimals = getDecimals(assetAddress);
      return ethers.parseUnits(amount.toString(), decimals).toString();
    } catch (e) {
      return '0';
    }
  };

  const buildNodes = () => {
    return blocks.map((b, i) => {
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
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amountIn = scaleAmount(b.amount, params.tokenIn as string);
        }
      } else if (typeNormalized === 'flash_loan') {
        // Normalize provider name to lowercase for backend
        const providerLower = (b.provider || 'aave').toLowerCase();
        params.provider = providerLower;
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
      } else if (typeNormalized === 'bridge') {
        params.bridge = b.bridgeProvider === 'opacus' ? 'opacus' : 'across';
        params.fromChain = b.from || '';
        params.toChain = b.to || '';
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
      } else if (typeNormalized === 'lend' || typeNormalized === 'borrow') {
        const providerLower = (b.provider || 'aave').toLowerCase();
        params.protocol = providerLower;
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
      } else if (typeNormalized === 'claim' || typeNormalized === 'repay' || typeNormalized === 'return_funds') {
        params.recipient = b.recipient || '';
      } else if (typeNormalized === 'ft_deposit') {
        params.action = b.ftAction || 'deposit';
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
        params.protocol = 'flying_tulip';
      } else if (typeNormalized === 'ft_usd_mint') {
        params.action = b.ftAction || 'mint';
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
        params.protocol = 'flying_tulip';
      } else if (typeNormalized === 'ft_swap') {
        params.tokenIn = TOKEN_ADDRESSES[b.from || ''] || b.from || '';
        params.tokenOut = TOKEN_ADDRESSES[b.to || ''] || b.to || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amountIn = scaleAmount(b.amount, params.tokenIn as string);
        }
        params.orderType = b.ftOrderType || 'market';
        params.dex = 'flying_tulip';
      } else if (typeNormalized === 'ft_stake') {
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
      } else {
        // For other types, include all block properties
        params.provider = (b.provider || '').toLowerCase();
        params.asset = TOKEN_ADDRESSES[b.asset || ''] || b.asset || '';
        if (b.amountMode === 'dynamic') {
          params.is_previous_output = true;
          params.source_node_id = b.sourceNodeId || '';
        } else {
          params.amount = scaleAmount(b.amount, params.asset as string);
        }
        params.from = b.from;
        params.to = b.to;
        params.dex = (b.dex || '').toLowerCase();
        params.recipient = b.recipient;
      }

      return { type: typeUppercase, params };
    });
  };

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
        let provider = params.provider?.toString() || currentContracts.AaveFlashAdapter;
        if (provider === 'aave' || !provider.startsWith('0x')) {
          provider = currentContracts.AaveFlashAdapter;
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
        let dex = params.dex?.toString() || currentContracts.UniV3Adapter;
        if (dex === 'uniswap' || !dex.startsWith('0x')) {
          dex = currentContracts.UniV3Adapter;
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
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
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
        let protocol = params.protocol?.toString() || currentContracts.AaveV3LendingAdapter;
        if (protocol === 'aave' || !protocol.startsWith('0x')) {
          protocol = currentContracts.AaveV3LendingAdapter;
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
        let protocol = params.protocol?.toString() || currentContracts.AaveV3LendingAdapter;
        if (protocol === 'aave' || !protocol.startsWith('0x')) {
          protocol = currentContracts.AaveV3LendingAdapter;
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

      if (type === 'CLAIM' || type === 'REPAY' || type === 'RETURN FUNDS' || type === 'RETURN_FUNDS') {
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
        const protocol = currentContracts.MockLendingAdapter; // Flying Tulip Mock Adapter
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
        const protocol = currentContracts.MockLendingAdapter; // Flying Tulip Mock Adapter
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
        const dex = currentContracts.UniV3AdapterMockSwap; // Flying Tulip Mock Swap Adapter
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

      if (type === 'FT_STAKE') {
        const asset = params.asset?.toString() || '0x0000000000000000000000000000000000000000';
        const amount = BigInt(params.amount?.toString() || '0');

        return {
          actionType: 6, // Map to STAKE action type
          params: new ethers.AbiCoder().encode(
            ['tuple(address, uint256)'],
            [[asset, amount]]
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

  // Auto-collect unique ERC20 token addresses from compiled actions for sweep
  const collectSweepTokens = (compiled: BackendCompiledStrategy | null): string[] => {
    if (!compiled?.actions?.length) return [];
    const tokenSet = new Set<string>();
    for (const action of compiled.actions) {
      const type = action.type?.toString().toUpperCase();
      const params = action.params || {};
      if (type === 'FLASH_LOAN') {
        const asset = params.asset?.toString();
        if (asset && asset.startsWith('0x') && asset !== ethers.ZeroAddress) tokenSet.add(asset.toLowerCase());
      }
      if (type === 'SWAP' || type === 'FT_SWAP') {
        const tokenIn = params.tokenIn?.toString();
        const tokenOut = params.tokenOut?.toString();
        if (tokenIn && tokenIn.startsWith('0x') && tokenIn !== ethers.ZeroAddress) tokenSet.add(tokenIn.toLowerCase());
        if (tokenOut && tokenOut.startsWith('0x') && tokenOut !== ethers.ZeroAddress) tokenSet.add(tokenOut.toLowerCase());
      }
      if (type === 'LEND' || type === 'BORROW' || type === 'FT_DEPOSIT' || type === 'FT_USD_MINT') {
        const asset = params.asset?.toString();
        if (asset && asset.startsWith('0x') && asset !== ethers.ZeroAddress) tokenSet.add(asset.toLowerCase());
      }
    }
    // Return checksummed addresses
    return Array.from(tokenSet).map(t => ethers.getAddress(t));
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
    else if (a.includes('claim') || a.includes('profit') || a.includes('repay') || a.includes('return')) type = 'REPAY';
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
      recipient: (type as string === 'CLAIM' || type === 'REPAY' || type as string === 'RETURN FUNDS') ? 'My Wallet' : undefined,
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
            mapActionToBlock('repay', 3),
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
    const hasRepay = blocks.some((b) => b.type === 'CLAIM' || b.type === 'REPAY' || b.type === 'RETURN FUNDS');
    const supported = MODULE_SUPPORT_BY_CHAIN[selectedChain] || [];

    if (!supported.includes(type)) return false;
    if (blocks.length >= 6) return false;

    if (blocks.length === 0) {
      return type === 'FLASH LOAN' || type === 'BRIDGE' || type === 'SWAP' || type === 'FT DEPOSIT' || type === 'FT USD MINT' || type === 'FT SWAP';
    }

    if (type === 'FLASH LOAN') return false;
    if (type === 'CLAIM' || type === 'REPAY' || type === 'RETURN FUNDS') return blocks.length >= 1 && !hasRepay;
    if (type === 'SWAP' || type === 'FT SWAP') {
      const swapCount = blocks.filter((b) => b.type === 'SWAP' || b.type === 'FT SWAP').length;
      return swapCount < 3;
    }

    if (['BRIDGE', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'CONDITION', 'LOOP', 'FT DEPOSIT', 'FT USD MINT', 'FT STAKE'].includes(type)) {
      return count === 0;
    }

    return false;
  };

  const addBlock = (type: BlockType) => {
    if (!canAddModule(type)) return;
    const chain = selectedChain;

    const createBlock = (t: BlockType): CanvasBlock => ({
      id: `${t}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: t,
      chain,
      bridgeProvider: t === 'BRIDGE' ? 'standard' : undefined,
      provider: ['FLASH LOAN', 'LEND', 'BORROW'].includes(t)
        ? FLASH_PROVIDERS_BY_CHAIN[chain]?.[0] || FLASH_PROVIDERS[0]
        : undefined,
      asset: ['FLASH LOAN', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'BRIDGE', 'FT DEPOSIT', 'FT USD MINT', 'FT STAKE'].includes(t) ? TOKEN_OPTIONS[0] : undefined,
      amount: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'FT DEPOSIT', 'FT USD MINT', 'FT STAKE'].includes(t) ? 1000 : undefined,
      from: t === 'SWAP' ? TOKEN_OPTIONS[0] : t === 'BRIDGE' ? CHAIN_OPTIONS[0] : undefined,
      to: t === 'SWAP' ? TOKEN_OPTIONS[3] : t === 'BRIDGE' ? CHAIN_OPTIONS[1] : undefined,
      dex: t === 'SWAP' ? (DEX_OPTIONS_BY_CHAIN[chain]?.[0] || DEX_OPTIONS[0]) : undefined,
      recipient: (t === 'CLAIM' || t === 'REPAY' || t === 'RETURN FUNDS') ? 'My Wallet' : undefined,
      position: { x: 0, y: 150 }
    });

    setBlocks((prev) => {
      let updated: CanvasBlock[] = [];
      if (type === 'FLASH LOAN') {
        const flashLoanBlock = createBlock('FLASH LOAN');
        const repayBlock = createBlock('REPAY');
        updated = [...prev, flashLoanBlock, repayBlock];
      } else {
        const newBlock = createBlock(type);
        const lastBlock = prev[prev.length - 1];
        if (lastBlock && ['REPAY', 'RETURN FUNDS', 'CLAIM'].includes(lastBlock.type)) {
          updated = [...prev.slice(0, -1), newBlock, lastBlock];
        } else {
          updated = [...prev, newBlock];
        }
      }

      // Recalculate horizontal positions dynamically to prevent overlap
      return updated.map((b, i) => ({
        ...b,
        position: { x: i * 320 + 50, y: 150 }
      }));
    });

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
    return Number((flash * 0.0084).toFixed(4));
  }, [blocks]);

  const fallbackToken = useMemo(() => {
    const firstBlock = blocks.find((b) => b.type === 'FLASH LOAN') || blocks[0];
    return formatTokenName(firstBlock?.asset || (firstBlock as any)?.tokenIn || firstBlock?.from || 'USDC');
  }, [blocks, formatTokenName]);

  const fallbackAmount = useMemo(() => {
    const firstBlock = blocks.find((b) => b.type === 'FLASH LOAN') || blocks[0];
    return Number(firstBlock?.amount || (firstBlock as any)?.amountIn || 1000);
  }, [blocks]);

  const displayProfit = simResult?.netProfit ?? fallbackProfit;
  const displayProfitUsd = simResult?.netProfitUsd ?? fallbackProfit;
  const displayProfitToken = formatTokenName(simResult?.profitToken ?? fallbackToken);
  const displayNotionalAmount = simResult?.notionalAmount ?? fallbackAmount;
  const displayNotionalToken = formatTokenName(simResult?.notionalToken ?? fallbackToken);

  const displayGas = simResult
    ? `${simResult.gasCostEth.toFixed(5)} ETH`
    : `${(0.002 + blocks.length * 0.0002).toFixed(4)} ETH`;
  const displayConfidence = simResult
    ? Math.round((1 - simResult.failureProbability) * 100)
    : Math.min(95, 18 + blocks.length * 9);
  const displayNetworkRoute = simResult?.networkRoute || `Private Route · ${currentChainId === 146 ? 'Sonic' : currentChainId === 11155111 ? 'Sepolia' : 'Base'}`;
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
      useSimulationStore.getState().setIsSimulating(true);
      const payload = {
        nodes: buildNodes(),
        slippage_bps: 50,
        gas_priority: 'standard',
        gas_price_gwei: 15,
        eth_price_usd: 3000,
        user_address: address || '0xacdca266ecaf23af68f4b53ac497d891f2a99209007910cc50ed50fa8e43550f',
        target_chain_id: currentChainId,
      };
      console.log('🔄 Simulating strategy onchain with payload:', JSON.stringify(payload, null, 2));
      const res = (await simulationEngine.simulateStrategy(payload)) as any;
      console.log('✅ Strategy simulated successfully:', res);
      const sim = res?.simulation || res;
      
      const newSimResult = {
        netProfitUsd: Number(sim?.netProfitUsd ?? fallbackProfit),
        netProfit: Number(sim?.netProfit ?? sim?.netProfitUsd ?? fallbackProfit),
        profitToken: sim?.profitToken ?? fallbackToken,
        notionalAmount: Number(sim?.notionalAmount ?? fallbackAmount),
        notionalToken: sim?.notionalToken ?? fallbackToken,
        gasCostEth: Number(sim?.gasCostEth ?? sim?.gas_cost_eth ?? 0.002),
        profitable: Boolean(sim?.profitable ?? true),
        failureProbability: Number(sim?.failureProbability ?? sim?.failure_probability ?? 0.12),
        estimatedGas: Number(sim?.estimatedGas ?? sim?.estimated_gas ?? 250000),
        failingNode: sim?.failingNode || null,
        revertReason: sim?.revertReason || null,
      };
      
      setSimResult(newSimResult);
      
      // Update Zustand store
      useSimulationStore.getState().updateResult({
        expectedProfit: newSimResult.netProfitUsd,
        risk: newSimResult.failureProbability,
        slippage: 0.005,
        estimatedGasUsd: sim?.gasCostUsd ?? 6,
        netProfitUsd: newSimResult.netProfitUsd,
        profitable: newSimResult.profitable,
        estimatedGas: newSimResult.estimatedGas,
        gasCostEth: newSimResult.gasCostEth,
        gasCostUsd: sim?.gasCostUsd,
        failureProbability: newSimResult.failureProbability,
        failingNode: newSimResult.failingNode,
        revertReason: newSimResult.revertReason
      });

      if (newSimResult.failingNode || newSimResult.revertReason) {
        let displayReason = newSimResult.revertReason || 'Revert';
        const reasonLower = displayReason.toLowerCase();
        if (reasonLower.includes('not found') || reasonLower.includes('stf') || reasonLower.includes('safetransferfailed')) {
          displayReason = 'Seçtiğiniz havuzda yeterli likidite bulunamadı veya havuz adresi geçersiz. Lütfen girdiğiniz miktarları veya rota adımlarını kontrol edin.';
        }
        setTxError(`Simulation failed at step [${newSimResult.failingNode || 'EVM'}]: ${displayReason}`);
        setSimStatus('error');
      } else {
        setTxError(null);
        setSimStatus('done');
      }
      setSimModal({ open: true, stage: 'done' });
    } catch (err: any) {
      console.error('❌ Strategy simulation failed:', err);
      setTxError(`Simulation failed: ${err?.message || 'Unknown error'}`);
      setSimStatus('error');
      setSimModal({ open: true, stage: 'done' });
    } finally {
      useSimulationStore.getState().setIsSimulating(false);
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

    let strategyHash = (strategy?.strategyHash as string) || generateStrategyHash();
    if (!strategyHash.startsWith('0x')) {
      strategyHash = `0x${strategyHash}`;
    }

    try {
      console.log('🔒 Checking/registering strategyHash on-chain:', strategyHash);
      let provider = new ethers.BrowserProvider((window as any).ethereum, "any");
      
      // Prevent BAD_DATA error by checking if we're on the right chain
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(currentChainId)) {
        const networkConfigs: Record<number, any> = {
          8453: {
            chainId: '0x2105',
            chainName: 'Base Mainnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org'],
          },
          146: {
            chainId: '0x92',
            chainName: 'Sonic',
            nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
            rpcUrls: ['https://rpc.soniclabs.com'],
            blockExplorerUrls: ['https://sonicscan.org'],
          },
          11155111: {
            chainId: '0xaa36a7',
            chainName: 'Sepolia',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }
        };
        const targetConfig = networkConfigs[currentChainId] || networkConfigs[8453];

        try {
          // Request MetaMask to switch networks
          await (window as any).ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: targetConfig.chainId }],
          });
        } catch (switchError: any) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [targetConfig],
              });
            } catch (addError) {
              setTxError(`Could not add ${targetConfig.chainName} network. Please add it manually.`);
              return;
            }
          } else {
            setTxError(`You rejected the network switch. Please switch to ${targetConfig.chainName} to continue.`);
            return;
          }
        }
        
        // Wait briefly for MetaMask to apply the network switch
        await new Promise(r => setTimeout(r, 1500));
        // Re-instantiate provider so ethers picks up the new network state immediately
        provider = new ethers.BrowserProvider((window as any).ethereum, "any");
        
        const updatedNetwork = await provider.getNetwork();
        if (updatedNetwork.chainId !== BigInt(currentChainId)) {
          setTxError(`Network switch failed. Please change MetaMask network to ${targetConfig.chainName} manually.`);
          return;
        }
      }
      
      const signer = await provider.getSigner();
      const registry = new ethers.Contract(
        currentContracts.StrategyRegistry,
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

      // Auto-collect sweep tokens from compiled strategy
      const sweepTokens = collectSweepTokens(compiledStrategy);
      console.log('🧹 Auto-collected sweepTokens:', sweepTokens);

      console.log('🧠 executeStrategy args:', { 
        actionsLength: actions.length, 
        minProfitWei, 
        deadline, 
        strategyHash,
        sweepTokens
      });
      
      // Use ethers directly to bypass CORS issues with Wagmi simulation
      const provider = new ethers.BrowserProvider((window as any).ethereum, "any");
      const signer = await provider.getSigner();
      const bandle = new ethers.Contract(
        currentContracts.BandleRouter,
        bandleRouterAbi,
        signer
      );
      
      console.log('🚀 Sending executeStrategy transaction...');
        // Disable automatic estimateGas by setting a fixed gasLimit so MetaMask still pops up!
        const tx = await bandle.executeStrategy(actions, minProfitWei, deadline, strategyHash, sweepTokens, {
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
            <div
              key={m}
              draggable={canAddModule(m)}
              onDragStart={() => setDragging(m)}
              onClick={() => addBlock(m)}
              className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm flex items-center justify-between transition-colors ${
                canAddModule(m)
                  ? 'border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer'
                  : 'border-white/5 bg-white/[0.02] text-white/25 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span>{m}</span>
              </div>
              <button
                type="button"
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setTutorialModal(m);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>
            </div>
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
                  <option key={n} value={n} disabled={n !== 'Base' && n !== 'Sonic'}>
                    {n !== 'Base' && n !== 'Sonic' ? `${n} (Coming Soon)` : n}
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
          disabled={simStatus === 'running' || !!validationError}
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
          disabled={blocks.length === 0 || compiling || !!validationError}
          className="px-5 py-2 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-40 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.15)] relative overflow-hidden"
        >
          {compiling && (
             <div className="absolute inset-0 bg-black/5 animate-pulse" />
          )}
          <span className="relative z-10">{compiling ? 'Compiling…' : 'Execute'}</span>
        </motion.button>
      </div>

      {(validationError || txError) && !showExecuteModal && (
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300 leading-relaxed">
            <div>{validationError || txError}</div>
            {simStatus === 'error' && (
              <div className="mt-2 pt-2 border-t border-red-400/10 text-red-400/90 font-medium">
                Simulation failed; the transaction was not triggered on the live network. Thanks to Brick3 protection, your principal capital is safe and no premium fee deductions have been made.
              </div>
            )}
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
                      {displayNotionalAmount.toLocaleString()} {formatTokenName(displayNotionalToken)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/55">Est. Profit</span>
                    <span className="text-red-500">+{displayProfit.toFixed(2)} {formatTokenName(displayProfitToken)}</span>
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

      {/* Tutorial Modal */}
      {tutorialModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#11151F] border border-white/10 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                {TUTORIAL_CONTENT[tutorialModal].title}
              </h3>
              <button onClick={() => setTutorialModal(null)} className="text-white/40 hover:text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <p className="text-white/70 leading-relaxed text-sm">
              {TUTORIAL_CONTENT[tutorialModal].desc}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setTutorialModal(null)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
