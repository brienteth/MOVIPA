import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export type BlockType = 'FLASH LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'REPAY' | 'RETURN FUNDS' | 'CLAIM' | 'CONDITION' | 'LOOP' | 'FT DEPOSIT' | 'FT USD MINT' | 'FT SWAP' | 'FT STAKE';

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
  amountMode?: 'fixed' | 'dynamic';
  sourceNodeId?: string;
  is_previous_output?: boolean;
}

const TOKEN_OPTIONS = ['USDC', 'USDT', 'DAI', 'ETH', 'WETH', 'WBTC', 'ftUSD', 'sftUSD'];
const CHAIN_OPTIONS = ['Ethereum', 'Base', 'Sonic', 'Arbitrum', 'Optimism', 'Polygon', '0G'];
const FLASH_PROVIDERS = ['Aave', 'Balancer', 'Morpho'];
const DEX_OPTIONS = ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'Flying Tulip CLOB'];

const renderTokenOptions = () => {
  const supported = ['USDC', 'ETH', 'WETH', 'ftUSD', 'sftUSD'];
  return TOKEN_OPTIONS.map(t => (
    <option key={t} value={t} disabled={!supported.includes(t)}>
      {!supported.includes(t) ? `${t} (Coming soon)` : t}
    </option>
  ));
};
const BRIDGE_PROVIDER_OPTIONS = ['standard', 'opacus'];

const DEX_OPTIONS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Auto', 'Uniswap', 'Curve', 'CowSwap'],
  Base: ['Auto', 'Uniswap V3', 'Aerodrome'],
  Sonic: ['Auto', 'SushiSwap', 'Equalizer', 'Flying Tulip CLOB'],
  Arbitrum: ['Auto', 'Uniswap', 'Curve', 'CowSwap'],
  Optimism: ['Auto', 'Uniswap', 'Curve'],
  Polygon: ['Auto', 'QuickSwap', 'Curve'],
  '0G': ['Auto', '0G DEX'],
};
const LENDING_PROTOCOLS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave', 'Compound', 'Maker'],
  Base: ['Aave', 'Moonwell'],
  Sonic: ['Aave'],
  Arbitrum: ['Aave', 'Compound'],
  Optimism: ['Aave', 'Compound'],
  Polygon: ['Aave', 'Aave v3'],
  '0G': ['Protocol Proxy'],
};
const FLASH_PROVIDERS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave', 'Balancer', 'Morpho'],
  Base: ['Aave'],
  Sonic: ['Aave'],
  Arbitrum: ['Aave'],
  Optimism: ['Aave'],
  Polygon: ['Aave'],
  '0G': ['Protocol Proxy'],
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
    previousBlocks?: CanvasBlock[];
  };
}

const ModuleNode = ({ id, data }: ModuleNodeProps) => {
  const { block, index, selectedChain, onUpdate, onRemove, onExecuteBridge, previousBlocks = [] } = data;
  const b = block;

  const renderAmountField = () => {
    const isDynamic = b.amountMode === 'dynamic';
    const validPrevBlocks = previousBlocks.filter(pb => 
      ['FLASH LOAN', 'SWAP', 'BORROW', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP', 'FT STAKE'].includes(pb.type)
    );

    return (
      <div className="flex flex-col gap-1 w-full col-span-2 mt-1">
        <div className="flex items-center justify-between text-[10px] text-white/50 px-0.5">
          <span>Amount Mode</span>
          <button
            type="button"
            onClick={() => {
              const nextMode = isDynamic ? 'fixed' : 'dynamic';
              onUpdate(id, {
                amountMode: nextMode,
                is_previous_output: nextMode === 'dynamic',
                sourceNodeId: nextMode === 'dynamic' ? (validPrevBlocks[0]?.id || '') : undefined,
                amount: nextMode === 'fixed' ? 0 : undefined
              });
            }}
            className="text-[#00D1C7] hover:underline"
          >
            {isDynamic ? '→ Set Fixed' : '→ Use Prev Output'}
          </button>
        </div>
        {isDynamic ? (
          <select
            value={b.sourceNodeId || ''}
            onChange={(e) => onUpdate(id, { sourceNodeId: e.target.value, is_previous_output: true })}
            className="nodrag bg-[#101826]/90 border border-[#00D1C7]/30 focus:border-[#00D1C7] rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 text-xs"
          >
            {validPrevBlocks.length === 0 ? (
              <option value="">No previous steps</option>
            ) : (
              validPrevBlocks.map((pb, idx) => (
                <option key={pb.id} value={pb.id}>
                  Step {idx + 1} ({pb.type})
                </option>
              ))
            )}
          </select>
        ) : (
          <input
            type="number"
            value={b.amount === undefined ? '' : b.amount}
            onChange={(e) => onUpdate(id, { amount: Number(e.target.value) })}
            className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 text-xs w-full"
            placeholder="Amount"
          />
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl border-t border-l border-r border-[#00D1C7]/15 border-b-[4px] border-b-[#00D1C7]/30 bg-[#070B14]/95 backdrop-blur-md p-3.5 w-[265px] relative shadow-[0_10px_35px_rgba(7,11,20,0.6)] group text-white transition-all duration-200 hover:-translate-y-1 hover:border-b-[5px] hover:border-[#00D1C7]/40 hover:shadow-[0_12px_25px_rgba(0,209,199,0.12)] active:translate-y-[1px] active:border-b-[2px]">
      {/* Target Handle (Left) */}
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-[#00D1C7] !border-2 !border-[#070B14] hover:!scale-125 !transition-transform" />
      
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D1C7]/[0.02] to-transparent pointer-events-none rounded-xl" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00D1C7]/10 text-[10px] font-mono text-[#00D1C7] border border-[#00D1C7]/20">{index + 1}</div>
          <h4 className="text-[13px] font-semibold tracking-wider text-[#D7DFE9]">{b.type}</h4>
        </div>
        <button onClick={() => onRemove(id)} className="text-white/30 hover:text-red-400 transition-colors">✕</button>
      </div>

      {/* Meta Labels */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#101826]/70 text-[#00D1C7] border border-[#00D1C7]/15 font-mono tracking-wider">
          {b.chain || selectedChain}
        </span>
      </div>

      {/* Inputs */}
      {b.type === 'FLASH LOAN' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.provider || ''} onChange={(e) => onUpdate(id, { provider: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {(FLASH_PROVIDERS_BY_CHAIN[b.chain || selectedChain] || FLASH_PROVIDERS).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {renderTokenOptions()}
          </select>
          {renderAmountField()}
        </div>
      )}

      {b.type === 'SWAP' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.from || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { from: e.target.value, to: (b.to && b.to !== e.target.value) ? b.to : TOKEN_OPTIONS.find(t => t !== e.target.value) || TOKEN_OPTIONS[0] })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150">
            {renderTokenOptions()}
          </select>
          <select value={b.to || TOKEN_OPTIONS[3]} onChange={(e) => onUpdate(id, { to: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150">
            {TOKEN_OPTIONS.filter((o) => o !== (b.from || TOKEN_OPTIONS[0])).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {renderAmountField()}
          <select value={b.dex || ''} onChange={(e) => onUpdate(id, { dex: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {(DEX_OPTIONS_BY_CHAIN[b.chain || selectedChain] || DEX_OPTIONS).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      )}

      {b.type === 'BRIDGE' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.bridgeProvider || 'standard'} onChange={(e) => onUpdate(id, { bridgeProvider: e.target.value as 'standard' | 'opacus' })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {BRIDGE_PROVIDER_OPTIONS.map((o) => <option key={o} value={o}>{o.toUpperCase()} Bridge</option>)}
          </select>
          <select value={b.from || CHAIN_OPTIONS[0]} onChange={(e) => onUpdate(id, { from: e.target.value, to: (b.to && b.to !== e.target.value) ? b.to : CHAIN_OPTIONS.find((c) => c !== e.target.value) || CHAIN_OPTIONS[0] })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150">
            {CHAIN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.to || CHAIN_OPTIONS[1]} onChange={(e) => onUpdate(id, { to: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150">
            {CHAIN_OPTIONS.filter((o) => o !== (b.from || CHAIN_OPTIONS[0])).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {renderTokenOptions()}
          </select>
          {renderAmountField()}
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
          <select value={b.provider || ''} onChange={(e) => onUpdate(id, { provider: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {(LENDING_PROTOCOLS_BY_CHAIN[b.chain || selectedChain] || ['Aave']).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {renderTokenOptions()}
          </select>
          {renderAmountField()}
        </div>
      )}

      {/* FLYING TULIP DEPOSIT / CROSS-MARGIN */}
      {b.type === 'FT DEPOSIT' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.ftAction || 'deposit'} onChange={(e) => onUpdate(id, { ftAction: e.target.value as 'deposit' | 'withdraw' })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            <option value="deposit">Deposit Collateral</option>
            <option value="withdraw">Withdraw Collateral</option>
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {TOKEN_OPTIONS.filter(t => t !== 'ftUSD').map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {renderAmountField()}
        </div>
      )}

      {/* FLYING TULIP ftUSD MINT/BURN */}
      {b.type === 'FT USD MINT' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.ftAction || 'mint'} onChange={(e) => onUpdate(id, { ftAction: e.target.value as 'mint' | 'burn' })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            <option value="mint">Mint ftUSD (Deposit Collateral)</option>
            <option value="burn">Burn ftUSD (Redeem Collateral)</option>
          </select>
          <select value={b.asset || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            {TOKEN_OPTIONS.filter(t => t !== 'ftUSD').map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {renderAmountField()}
        </div>
      )}

      {/* FLYING TULIP STAKE ftUSD */}
      {b.type === 'FT STAKE' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.asset || 'ftUSD'} onChange={(e) => onUpdate(id, { asset: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            <option value="ftUSD">ftUSD</option>
          </select>
          {renderAmountField()}
        </div>
      )}

      {/* FLYING TULIP SWAP */}
      {b.type === 'FT SWAP' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <select value={b.from || TOKEN_OPTIONS[0]} onChange={(e) => onUpdate(id, { from: e.target.value, to: (b.to && b.to !== e.target.value) ? b.to : TOKEN_OPTIONS.find(t => t !== e.target.value) || TOKEN_OPTIONS[0] })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150">
            {renderTokenOptions()}
          </select>
          <select value={b.to || TOKEN_OPTIONS[3]} onChange={(e) => onUpdate(id, { to: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150">
            {TOKEN_OPTIONS.filter((o) => o !== (b.from || TOKEN_OPTIONS[0])).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {renderAmountField()}
          <select value={b.ftOrderType || 'market'} onChange={(e) => onUpdate(id, { ftOrderType: e.target.value as 'market' | 'limit' })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2">
            <option value="market">Market Order</option>
            <option value="limit">Limit Order</option>
          </select>
        </div>
      )}

      {(b.type === 'CLAIM' || b.type === 'REPAY' || b.type === 'RETURN FUNDS') && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <input type="text" value={b.recipient || ''} onChange={(e) => onUpdate(id, { recipient: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2" placeholder="Recipient Address" />
        </div>
      )}

      {/* Source Handle (Right) */}
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-[#A7F432] !border-2 !border-[#070B14] hover:!scale-125 !transition-transform" />
    </div>
  );
};

export default memo(ModuleNode);
