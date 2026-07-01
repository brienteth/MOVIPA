import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import CustomSelect from '../ui/CustomSelect';

export type BlockType = 'FLASH LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'REPAY' | 'RETURN FUNDS' | 'CLAIM' | 'CONDITION' | 'LOOP' | 'SETTLEMENT';

export interface CanvasBlock {
  id: string;
  type: BlockType;
  chain?: string;
  bridgeProvider?: 'standard' | 'opacus' | 'stargate' | 'layerzero';
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
  expression?: string;
  maxIterations?: number;
  // Settlement fields
  settlementNetwork?: 'stellar' | 'evm';
  settlementDistType?: string;
  settlementRecipients?: Array<{ id: string; name: string; address: string; share: number; memo?: string }>;
}

const TOKEN_OPTIONS = ['USDC', 'USDT', 'DAI', 'FRAX', 'ETH', 'WETH', 'WBTC', 'stETH', 'rETH', 'AAVE', 'LINK', 'UNI', 'CRV', 'MATIC', 'ARB', 'OP', 'SNX', 'MKR', 'LDO'];
const TOKEN_ICONS: Record<string, string> = {
  'USDC': 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  'USDT': 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  'DAI': 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  'FRAX': 'https://cryptologos.cc/logos/frax-frax-logo.png',
  'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'WETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  'WBTC': 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  'stETH': 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
  'rETH': 'https://cryptologos.cc/logos/rocket-pool-rpl-logo.png',
  'AAVE': 'https://cryptologos.cc/logos/aave-aave-logo.png',
  'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.png',
  'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
  'CRV': 'https://cryptologos.cc/logos/curve-dao-token-crv-logo.png',
  'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  'ARB': 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
  'OP': 'https://cryptologos.cc/logos/optimism-ethereum-op-logo.png',
  'SNX': 'https://cryptologos.cc/logos/synthetix-network-token-snx-logo.png',
  'MKR': 'https://cryptologos.cc/logos/maker-mkr-logo.png',
  'LDO': 'https://cryptologos.cc/logos/lido-dao-ldo-logo.png',
};

const FLASH_PROVIDERS = ['Aave', 'Aave V2', 'Aave V3', 'Spark', 'Radiant V2'];
const DEX_OPTIONS = ['Auto', 'Uniswap', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer'];

const SETTLEMENT_NETWORKS = [
  { value: 'stellar', label: 'Stellar', icon: 'https://cryptologos.cc/logos/stellar-xlm-logo.png' },
  { value: 'evm', label: 'EVM (Base/Ethereum)', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
];
const SETTLEMENT_ASSETS = [
  { value: 'USDC', label: 'USDC', icon: TOKEN_ICONS['USDC'] },
  { value: 'USDT', label: 'USDT', icon: TOKEN_ICONS['USDT'] },
  { value: 'DAI', label: 'DAI', icon: TOKEN_ICONS['DAI'] },
  { value: 'XLM', label: 'XLM', icon: 'https://cryptologos.cc/logos/stellar-xlm-logo.png' },
];
const DISTRIBUTION_TYPES = [
  { value: 'TREASURY', label: '🏦 Treasury' },
  { value: 'PAYROLL', label: '💰 Payroll' },
  { value: 'REVENUE_SHARE', label: '📊 Revenue Share' },
  { value: 'ROYALTY', label: '👑 Creator Royalty' },
  { value: 'TEAM', label: '🤝 Team Split' },
  { value: 'CUSTOM', label: '⚙️ Custom' },
];

const DEX_OPTIONS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Auto', 'Uniswap V3', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer'],
  Base: ['Auto', 'Uniswap V3', 'SushiSwap', 'Balancer', 'Curve', 'CowSwap', 'Aerodrome'],
  Sonic: ['Auto', 'Shadow Exchange', 'Beets', 'SushiSwap V3'],
  Arbitrum: ['Auto', 'Uniswap V3', 'Curve', 'CowSwap', 'SushiSwap', 'Balancer'],
  Optimism: ['Auto', 'Uniswap V3', 'Curve', 'SushiSwap', 'Balancer'],
  Polygon: ['Auto', 'QuickSwap', 'Curve', 'SushiSwap', 'Balancer'],
  '0G': ['Auto', '0G DEX'],
};
const LENDING_PROTOCOLS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave V3', 'Aave V2', 'Compound V3', 'Maker', 'Spark'],
  Base: ['Aave V3', 'Compound V3', 'Morpho', 'Moonwell'],
  Sonic: ['Aave V3', 'Morpho'],
  Arbitrum: ['Aave V3', 'Compound V3', 'Radiant V2'],
  Optimism: ['Aave V3', 'Compound V3'],
  Polygon: ['Aave V3', 'Aave V2'],
  '0G': ['Protocol Proxy'],
};
const FLASH_PROVIDERS_BY_CHAIN: Record<string, string[]> = {
  Ethereum: ['Aave V3', 'Aave V2', 'Spark', 'Balancer'],
  Base: ['Aave V3'],
  Sonic: ['Aave V3'],
  Arbitrum: ['Aave V3', 'Radiant V2'],
  Optimism: ['Aave V3'],
  Polygon: ['Aave V3', 'Aave V2'],
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
    onTutorialClick?: (type: BlockType) => void;
    previousBlocks?: CanvasBlock[];
  };
}

const ModuleNode = ({ id, data }: ModuleNodeProps) => {
  const { block, index, selectedChain, onUpdate, onRemove, onExecuteBridge, onTutorialClick, previousBlocks = [] } = data;
  const b = block;

  const renderAmountField = () => {
    const isDynamic = b.amountMode === 'dynamic';
    const validPrevBlocks = previousBlocks.filter(pb => 
      ['FLASH LOAN', 'SWAP', 'BORROW'].includes(pb.type)
    );

    return (
      <div className="flex flex-col gap-1 w-full col-span-2 mt-1 z-10 relative">
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

  const getTokenOptions = (filterToken?: string) => {
    return TOKEN_OPTIONS
      .filter(t => t !== filterToken)
      .map(t => ({
        value: t,
        label: t,
        icon: TOKEN_ICONS[t]
      }));
  };

  const getProviderOptions = (providers: string[]) => {
    return providers.map(p => ({
      value: p,
      label: p
    }));
  };


  return (
    <div className="rounded-xl border-t border-l border-r border-[#00D1C7]/15 border-b-[4px] border-b-[#00D1C7]/30 bg-[#070B14]/95 backdrop-blur-md p-3.5 w-[265px] relative shadow-[0_10px_35px_rgba(7,11,20,0.6)] group text-white transition-all duration-200 hover:-translate-y-1 hover:border-b-[5px] hover:border-[#00D1C7]/40 hover:shadow-[0_12px_25px_rgba(0,209,199,0.12)] active:translate-y-[1px] active:border-b-[2px]">
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-[#00D1C7] !border-2 !border-[#070B14] hover:!scale-125 !transition-transform" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#00D1C7]/[0.02] to-transparent pointer-events-none rounded-xl" />
      
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded flex items-center justify-center bg-[#00D1C7]/10 text-[10px] font-mono text-[#00D1C7] border border-[#00D1C7]/20">{index + 1}</div>
          <h4 className="text-[13px] font-semibold tracking-wider text-[#D7DFE9]">{b.type}</h4>
          {onTutorialClick && (
            <button
              type="button"
              onClick={() => onTutorialClick(b.type)}
              className="w-4.5 h-4.5 rounded-full flex items-center justify-center bg-[#00D1C7]/10 text-[10px] font-bold text-[#00D1C7] hover:bg-[#00D1C7]/20 border border-[#00D1C7]/15 transition-all cursor-pointer"
              title="Learn how this block works"
            >
              ?
            </button>
          )}
        </div>
        <button onClick={() => onRemove(id)} className="text-white/30 hover:text-red-400 transition-colors">✕</button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#101826]/70 text-[#00D1C7] border border-[#00D1C7]/15 font-mono tracking-wider">
          {b.chain || selectedChain}
        </span>
      </div>

      {b.type === 'FLASH LOAN' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="col-span-2 relative z-50">
            <CustomSelect 
              value={b.provider || (FLASH_PROVIDERS_BY_CHAIN[b.chain || selectedChain] || FLASH_PROVIDERS)[0]} 
              options={getProviderOptions(FLASH_PROVIDERS_BY_CHAIN[b.chain || selectedChain] || FLASH_PROVIDERS)}
              onChange={(val) => onUpdate(id, { provider: val })}
            />
          </div>
          <div className="col-span-2 relative z-40">
            <CustomSelect 
              value={b.asset || TOKEN_OPTIONS[0]} 
              options={getTokenOptions()}
              onChange={(val) => onUpdate(id, { asset: val })}
            />
          </div>
          {renderAmountField()}
        </div>
      )}

      {b.type === 'SWAP' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="relative z-50">
            <CustomSelect 
              value={b.from || TOKEN_OPTIONS[0]} 
              options={getTokenOptions()}
              onChange={(val) => onUpdate(id, { from: val, to: (b.to && b.to !== val) ? b.to : TOKEN_OPTIONS.find(t => t !== val) || TOKEN_OPTIONS[0] })}
            />
          </div>
          <div className="relative z-50">
            <CustomSelect 
              value={b.to || TOKEN_OPTIONS[3]} 
              options={getTokenOptions(b.from || TOKEN_OPTIONS[0])}
              onChange={(val) => onUpdate(id, { to: val })}
            />
          </div>
          {renderAmountField()}
          <div className="col-span-2 relative z-40 flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-white/50 px-0.5">DEX / Route</span>
            <CustomSelect 
              value={b.dex || (DEX_OPTIONS_BY_CHAIN[b.chain || selectedChain] || DEX_OPTIONS)[0]} 
              options={getProviderOptions(DEX_OPTIONS_BY_CHAIN[b.chain || selectedChain] || DEX_OPTIONS)}
              onChange={(val) => onUpdate(id, { dex: val })}
            />
          </div>
        </div>
      )}

      {b.type === 'BRIDGE' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="col-span-2 relative z-50 flex flex-col gap-1">
             <span className="text-[10px] text-white/50 px-0.5">Bridge Protocol</span>
             <CustomSelect 
              value={b.bridgeProvider || 'stargate'} 
              options={[{ value: 'stargate', label: 'Stargate V2 Bridge', icon: 'https://cryptologos.cc/logos/stargate-finance-stg-logo.png' }]}
              onChange={(val) => onUpdate(id, { bridgeProvider: val as any })}
            />
          </div>
          <div className="relative z-40 flex flex-col gap-1">
            <span className="text-[10px] text-white/50 px-0.5">From Chain</span>
            <CustomSelect 
              value={b.from || 'Ethereum'} 
              options={['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'].filter(c => c !== b.to).map(c => ({ value: c, label: c }))}
              onChange={(val) => onUpdate(id, { from: val, to: (b.to && b.to !== val) ? b.to : ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'].find((c) => c !== val) || 'Base' })}
            />
          </div>
          <div className="relative z-40 flex flex-col gap-1">
             <span className="text-[10px] text-white/50 px-0.5">To Chain</span>
             <CustomSelect 
              value={b.to || 'Base'} 
              options={['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'].filter(c => c !== b.from).map(c => ({ value: c, label: c }))}
              onChange={(val) => onUpdate(id, { to: val })}
            />
          </div>
          <div className="col-span-2 relative z-30 flex flex-col gap-1 mt-1">
            <span className="text-[10px] text-white/50 px-0.5">Asset to Bridge</span>
            <CustomSelect 
              value={b.asset || 'USDC'} 
              options={['USDC', 'USDT', 'DAI', 'ETH'].map(t => ({ value: t, label: t, icon: TOKEN_ICONS[t] }))}
              onChange={(val) => onUpdate(id, { asset: val })}
            />
          </div>
          {renderAmountField()}
          {onExecuteBridge && (
             <button onClick={() => onExecuteBridge(b)} className="col-span-2 mt-1 px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-[10px]">
               Run Bridge Step
             </button>
          )}
        </div>
      )}

      {(['LEND', 'BORROW', 'STAKE', 'YIELD'].includes(b.type)) && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="col-span-2 relative z-50">
             <CustomSelect 
              value={b.provider || (LENDING_PROTOCOLS_BY_CHAIN[b.chain || selectedChain] || ['Aave V3'])[0]} 
              options={getProviderOptions(LENDING_PROTOCOLS_BY_CHAIN[b.chain || selectedChain] || ['Aave V3'])}
              onChange={(val) => onUpdate(id, { provider: val })}
            />
          </div>
          <div className="col-span-2 relative z-40">
            <CustomSelect 
              value={b.asset || TOKEN_OPTIONS[0]} 
              options={getTokenOptions()}
              onChange={(val) => onUpdate(id, { asset: val })}
            />
          </div>
          {renderAmountField()}
        </div>
      )}

      {b.type === 'CONDITION' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-[10px] text-white/50 px-0.5">Execution Rule / Expression</span>
            <input 
              type="text" 
              value={b.expression || 'true'} 
              onChange={(e) => onUpdate(id, { expression: e.target.value })} 
              className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 text-xs w-full" 
              placeholder="e.g. price_usdc_eth > 3000" 
            />
          </div>
        </div>
      )}

      {b.type === 'LOOP' && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <div className="col-span-2 flex flex-col gap-1">
            <span className="text-[10px] text-white/50 px-0.5">Max Iterations</span>
            <input 
              type="number" 
              value={b.maxIterations === undefined ? 5 : b.maxIterations} 
              onChange={(e) => onUpdate(id, { maxIterations: Number(e.target.value) })} 
              className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 text-xs w-full" 
              placeholder="5" 
            />
          </div>
        </div>
      )}

      {b.type === 'SETTLEMENT' && (
        <div className="grid grid-cols-1 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {/* Network */}
          <div className="relative z-50 flex flex-col gap-1">
            <span className="text-[10px] text-white/50 px-0.5">Settlement Network</span>
            <CustomSelect
              value={b.settlementNetwork || 'stellar'}
              options={SETTLEMENT_NETWORKS}
              onChange={(val) => onUpdate(id, { settlementNetwork: val as any })}
            />
          </div>
          {/* Asset */}
          <div className="relative z-40 flex flex-col gap-1">
            <span className="text-[10px] text-white/50 px-0.5">Settlement Asset</span>
            <CustomSelect
              value={b.asset || 'USDC'}
              options={SETTLEMENT_ASSETS}
              onChange={(val) => onUpdate(id, { asset: val })}
            />
          </div>
          {/* Distribution Type */}
          <div className="relative z-30 flex flex-col gap-1">
            <span className="text-[10px] text-white/50 px-0.5">Distribution Type</span>
            <CustomSelect
              value={b.settlementDistType || 'TREASURY'}
              options={DISTRIBUTION_TYPES}
              onChange={(val) => onUpdate(id, { settlementDistType: val })}
            />
          </div>
          {/* Recipients */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/50 px-0.5">Recipients</span>
              <button
                type="button"
                onClick={() => {
                  const existing = b.settlementRecipients || [];
                  const newR = [...existing, { id: `r${Date.now()}`, name: '', address: '', share: 0 }];
                  onUpdate(id, { settlementRecipients: newR });
                }}
                className="text-[9px] text-[#A7F432] hover:text-[#c8ff6e] transition-colors"
              >
                + Add
              </button>
            </div>
            {(b.settlementRecipients || []).map((r, ri) => (
              <div key={r.id} className="flex gap-1 items-center">
                <input
                  type="text"
                  value={r.name}
                  onChange={(e) => {
                    const upd = [...(b.settlementRecipients || [])];
                    upd[ri] = { ...upd[ri], name: e.target.value };
                    onUpdate(id, { settlementRecipients: upd });
                  }}
                  className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded p-1 outline-none text-[#D7DFE9] text-[10px] w-[60px]"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={r.address}
                  onChange={(e) => {
                    const upd = [...(b.settlementRecipients || [])];
                    upd[ri] = { ...upd[ri], address: e.target.value };
                    onUpdate(id, { settlementRecipients: upd });
                  }}
                  className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded p-1 outline-none text-[#D7DFE9] text-[10px] flex-1 min-w-0"
                  placeholder="Wallet"
                />
                <input
                  type="number"
                  value={r.share || ''}
                  onChange={(e) => {
                    const upd = [...(b.settlementRecipients || [])];
                    upd[ri] = { ...upd[ri], share: Number(e.target.value) };
                    onUpdate(id, { settlementRecipients: upd });
                  }}
                  className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded p-1 outline-none text-[#D7DFE9] text-[10px] w-[35px]"
                  placeholder="%"
                />
                <button
                  type="button"
                  onClick={() => {
                    const upd = (b.settlementRecipients || []).filter((_, i) => i !== ri);
                    onUpdate(id, { settlementRecipients: upd });
                  }}
                  className="text-red-400/60 hover:text-red-400 text-[10px]"
                >
                  ✕
                </button>
              </div>
            ))}
            {(b.settlementRecipients || []).length > 0 && (
              <div className="text-[9px] text-white/40 text-right">
                Total: {(b.settlementRecipients || []).reduce((s, r) => s + (r.share || 0), 0)}%
              </div>
            )}
          </div>
          {/* Sink node indicator */}
          <div className="mt-1 px-2 py-1 rounded bg-[#A7F432]/10 border border-[#A7F432]/20 text-center">
            <span className="text-[9px] text-[#A7F432] font-mono tracking-wider">⬇ SINK NODE — Final Step</span>
          </div>
        </div>
      )}

      {(b.type === 'CLAIM' || b.type === 'REPAY' || b.type === 'RETURN FUNDS') && (
        <div className="grid grid-cols-2 gap-1.5 text-xs nodrag nopan" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <input type="text" value={b.recipient || ''} onChange={(e) => onUpdate(id, { recipient: e.target.value })} className="nodrag bg-[#101826]/90 border border-white/10 focus:border-[#00D1C7]/40 rounded-lg p-1.5 outline-none text-[#D7DFE9] transition-all duration-150 col-span-2" placeholder="Recipient Address" />
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-[#A7F432] !border-2 !border-[#070B14] hover:!scale-125 !transition-transform" />
    </div>
  );
};

export default memo(ModuleNode);
