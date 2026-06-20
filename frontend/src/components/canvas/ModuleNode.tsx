import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export type BlockType = 'FLASH LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'CLAIM' | 'CONDITION' | 'LOOP' | 'FT DEPOSIT' | 'FT USD MINT' | 'FT SWAP';

export interface CanvasBlock {
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
}

const TOKEN_OPTIONS = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH', 'WBTC', 'ftUSD'];
const CHAIN_OPTIONS = ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon', '0G'];
const FLASH_PROVIDERS = ['Aave', 'Balancer', 'Morpho'];
const DEX_OPTIONS = ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'Flying Tulip CLOB'];

const renderTokenOptions = () => {
  const supported = ['USDC', 'ETH', 'WETH', 'ftUSD'];
  return TOKEN_OPTIONS.map(t => (
    <option key={t} value={t} disabled={!supported.includes(t)}>
      {!supported.includes(t) ? `${t} (Coming soon)` : t}
    </option>
  ));
};
const BRIDGE_PROVIDER_OPTIONS = ['standard', 'opacus'];

const DEX_OPTIONS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Auto', 'Uniswap', 'Curve', 'CowSwap'],
  Base: ['Auto', 'Hop', 'Orbiter', 'Native Base DEX'],
  Arbitrum: ['Auto', 'Uniswap', 'Curve', 'CowSwap'],
  Optimism: ['Auto', 'Uniswap', 'Curve'],
  Polygon: ['Auto', 'QuickSwap', 'Curve'],
  '0G': ['Auto', '0G DEX'],
};
const LENDING_PROTOCOLS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave', 'Compound', 'Maker'],
  Base: ['Aave', 'Base Lending'],
  Arbitrum: ['Aave', 'Compound'],
  Optimism: ['Aave', 'Compound'],
  Polygon: ['Aave', 'Aave v3'],
  '0G': ['Protocol Proxy'],
};
const FLASH_PROVIDERS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave', 'Balancer', 'Morpho'],
  Base: ['Aave'],
  Arbitrum: ['Aave'],
  Optimism: ['Aave'],
  Polygon: ['Aave'],
  '0G': ['Aave'],
};

interface ModuleNodeProps {
  id: string;
  data: {
    block: CanvasBlock;
    index: number;
    selectedChain: string;
    onUpdate: (id: string, updates: Partial<CanvasBlock>) => void;
    onRemove: (id: string) => void;
    onExecuteBridge?: (block: CanvasBlock) => void;
  };
}

const ModuleNode = ({ id, data }: ModuleNodeProps) => {
  const { block, index, selectedChain, onUpdate, onRemove, onExecuteBridge } = data;
  const b = block;

  return (
    <div className="rounded-xl border border-white/10 bg-[#11151F]/80 backdrop-blur-md p-3 w-[260px] relative shadow-2xl group text-white">
      {/* Target Handle (Left) */}
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-white/20 border-2 border-[#11151F]" />
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-white/10 text-[10px] font-mono text-white/50">{index + 1}</div>
          <h4 className="text-[13px] font-semibold tracking-wide">{b.type}</h4>
        </div>
        <button onClick={() => onRemove(id)} className="text-white/30 hover:text-red-400 transition-colors">✕</button>
      </div>

      {/* Meta Labels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/5">
          {b.chain || selectedChain}
        </span>
      </div>

      {/* Inputs */}
      {b.type === 'FLASH LOAN' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.provider || ''} onChange={(e) => onUpdate(id, { provider: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none col-span-2">
            {(FLASH_PROVIDERS_BY_CHAIN[b.chain || selectedChain] || FLASH_PROVIDERS).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {renderTokenOptions()}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
        </div>
      )}

      {b.type === 'SWAP' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.from || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { from: e.target.value, to: (b.to && b.to !== e.target.value) ? b.to : TOKEN_OPTIONS.find(t => t !== e.target.value) || TOKEN_OPTIONS[0] })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {renderTokenOptions()}
          </select>
          <select value={b.to || TOKEN_OPTIONS[3]} onChange={(e) => onUpdate(id, { to: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {TOKEN_OPTIONS.filter((o) => o !== (b.from || TOKEN_OPTIONS[0])).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
          <select value={b.dex || ''} onChange={(e) => onUpdate(id, { dex: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {(DEX_OPTIONS_BY_CHAIN[b.chain || selectedChain] || DEX_OPTIONS).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {b.type === 'BRIDGE' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.bridgeProvider || 'standard'} onChange={(e) => onUpdate(id, { bridgeProvider: e.target.value as 'standard' | 'opacus' })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none col-span-2">
            {BRIDGE_PROVIDER_OPTIONS.map((o) => <option key={o} value={o}>{o.toUpperCase()} Bridge</option>)}
          </select>
          <select value={b.from || CHAIN_OPTIONS[0]} onChange={(e) => onUpdate(id, { from: e.target.value, to: (b.to && b.to !== e.target.value) ? b.to : CHAIN_OPTIONS.find((c) => c !== e.target.value) || CHAIN_OPTIONS[0] })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {CHAIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.to || CHAIN_OPTIONS[1]} onChange={(e) => onUpdate(id, { to: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {CHAIN_OPTIONS.filter((o) => o !== (b.from || CHAIN_OPTIONS[0])).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {renderTokenOptions()}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
          {onExecuteBridge && (
             <button onClick={() => onExecuteBridge(b)} className="col-span-2 mt-1 px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-[10px]">
               Run Bridge Step
             </button>
          )}
        </div>
      )}

      {/* LEND / BORROW */}
      {(b.type === 'LEND' || b.type === 'BORROW') && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.provider || ''} onChange={(e) => onUpdate(id, { provider: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none col-span-2">
            {(LENDING_PROTOCOLS_BY_CHAIN[b.chain || selectedChain] || ['Aave']).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {renderTokenOptions()}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
        </div>
      )}

      {/* FLYING TULIP DEPOSIT / CROSS-MARGIN */}
      {b.type === 'FT DEPOSIT' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.ftAction || 'deposit'} onChange={(e) => onUpdate(id, { ftAction: e.target.value as 'deposit' | 'withdraw' })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none col-span-2">
            <option value="deposit">Deposit Collateral</option>
            <option value="withdraw">Withdraw Collateral</option>
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {TOKEN_OPTIONS.filter(t => t !== 'ftUSD').map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
        </div>
      )}

      {/* FLYING TULIP ftUSD MINT/BURN */}
      {b.type === 'FT USD MINT' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.ftAction || 'mint'} onChange={(e) => onUpdate(id, { ftAction: e.target.value as 'mint' | 'burn' })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none col-span-2">
            <option value="mint">Mint ftUSD (Deposit Collateral)</option>
            <option value="burn">Burn ftUSD (Redeem Collateral)</option>
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {TOKEN_OPTIONS.filter(t => t !== 'ftUSD').map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
        </div>
      )}

      {/* FLYING TULIP SWAP */}
      {b.type === 'FT SWAP' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.from || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { from: e.target.value, to: (b.to && b.to !== e.target.value) ? b.to : TOKEN_OPTIONS.find(t => t !== e.target.value) || TOKEN_OPTIONS[0] })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {renderTokenOptions()}
          </select>
          <select value={b.to || TOKEN_OPTIONS[3]} onChange={(e) => onUpdate(id, { to: e.target.value })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            {TOKEN_OPTIONS.filter((o) => o !== (b.from || TOKEN_OPTIONS[0])).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="number" value={b.amount || ''} onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none" placeholder="Amount" />
          <select value={b.ftOrderType || 'market'} onChange={(e) => onUpdate(id, { ftOrderType: e.target.value as 'market' | 'limit' })} className="nodrag bg-black/40 border border-white/10 rounded p-1.5 outline-none">
            <option value="market">Market Order</option>
            <option value="limit">Limit Order</option>
          </select>
        </div>
      )}

      {/* Source Handle (Right) */}
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-white border-2 border-[#11151F]" />
    </div>
  );
};

export default memo(ModuleNode);
