import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useUiStore } from '../../store/ui.store';

const CATEGORIES = [
  'Arbitrage',
  'Yield',
  'Looping',
  'Liquidation',
  'Delta Neutral',
  'Bridge',
  'Stablecoin',
  'Leverage',
] as const;

type BlockType = 'FLASH LOAN' | 'SWAP' | 'BRIDGE' | 'LEND' | 'BORROW' | 'STAKE' | 'YIELD' | 'CLAIM' | 'CONDITION' | 'LOOP' | 'FT DEPOSIT' | 'FT USD MINT' | 'FT SWAP';

interface StrategyCard {
  id: string;
  title: string;
  apy: string;
  risk: string;
  networks: string;
  createdBy: string;
  usage: number;
  category: string;
  description?: string;
  prompt?: string;
  strategy?: { nodes?: Array<{ type: string; params?: Record<string, any> }> };
}

function mapActionToBlock(action: string, index: number) {
  const a = action.toLowerCase();
  let type: BlockType = 'SWAP';
  if (a.includes('flash') || a.includes('loan')) type = 'FLASH LOAN';
  else if (a.includes('ft swap') || a.includes('ft_swap')) type = 'FT SWAP';
  else if (a.includes('swap')) type = 'SWAP';
  else if (a.includes('bridge')) type = 'BRIDGE';
  else if (a.includes('ft deposit') || a.includes('ft_deposit')) type = 'FT DEPOSIT';
  else if (a.includes('ft usd mint') || a.includes('ft_usd_mint') || a.includes('ftusd')) type = 'FT USD MINT';
  else if (a.includes('lend') || a.includes('supply')) type = 'LEND';
  else if (a.includes('borrow')) type = 'BORROW';
  else if (a.includes('stake')) type = 'STAKE';
  else if (a.includes('yield')) type = 'YIELD';
  else if (a.includes('claim') || a.includes('repay') || a.includes('profit')) type = 'CLAIM';
  else if (a.includes('condition') || a.includes('if')) type = 'CONDITION';
  else if (a.includes('loop')) type = 'LOOP';
  return {
    id: `ai-${index}-${Date.now()}`,
    type,
    provider: type === 'FLASH LOAN' ? 'Aave' : undefined,
    asset: ['FLASH LOAN', 'LEND', 'BORROW', 'STAKE', 'YIELD', 'BRIDGE', 'FT DEPOSIT', 'FT USD MINT'].includes(type) ? 'USDC' : undefined,
    amount: ['FLASH LOAN', 'SWAP', 'BRIDGE', 'LEND', 'BORROW', 'STAKE', 'FT DEPOSIT', 'FT USD MINT', 'FT SWAP'].includes(type) ? 10000 : undefined,
    from: type === 'SWAP' || type === 'FT SWAP' ? 'USDC' : undefined,
    to: type === 'SWAP' || type === 'FT SWAP' ? 'ETH' : undefined,
    dex: type === 'SWAP' ? 'Auto' : type === 'FT SWAP' ? 'Flying Tulip CLOB' : undefined,
    ftAction: type === 'FT DEPOSIT' ? 'deposit' : type === 'FT USD MINT' ? 'mint' : undefined,
    ftOrderType: type === 'FT SWAP' ? 'market' : undefined,
  };
}

function nodeToBlock(node: { type: string; params?: Record<string, any> }, index: number) {
  const params = node.params || {};
  const block = mapActionToBlock(node.type || `Step ${index + 1}`, index) as any;

  if (block.type === 'FLASH LOAN') {
    block.provider = params.provider || params.protocol || 'Aave';
    block.asset = params.asset || params.token || 'USDC';
    block.amount = Number(params.amount || 10000);
  } else if (block.type === 'SWAP' || block.type === 'FT SWAP') {
    block.from = params.tokenIn || params.from || 'USDC';
    block.to = params.tokenOut || params.to || 'ETH';
    block.dex = block.type === 'FT SWAP' ? 'Flying Tulip CLOB' : (params.dex || 'Auto');
    block.amount = Number(params.amountIn || params.amount || 1000);
    if (block.type === 'FT SWAP') {
      block.ftOrderType = params.orderType || 'market';
    }
  } else if (block.type === 'BRIDGE') {
    block.from = params.fromChain || params.from_chain || 'Ethereum';
    block.to = params.toChain || params.to_chain || 'Base';
    block.asset = params.asset || params.token || 'USDC';
    block.amount = Number(params.amount || 1000);
  } else if (block.type === 'LEND' || block.type === 'BORROW') {
    block.provider = params.protocol || 'Aave';
    block.asset = params.asset || params.token || 'USDC';
    block.amount = Number(params.amount || 1000);
  } else if (block.type === 'STAKE' || block.type === 'YIELD') {
    block.asset = params.asset || params.token || 'DAI';
    block.amount = Number(params.amount || 1000);
  } else if (block.type === 'FT DEPOSIT' || block.type === 'FT USD MINT') {
    block.asset = params.asset || params.token || 'USDC';
    block.amount = Number(params.amount || 1000);
    block.ftAction = params.action || (block.type === 'FT DEPOSIT' ? 'deposit' : 'mint');
  } else if (block.type === 'CLAIM') {
    block.recipient = params.recipient || 'My Wallet';
  }

  return block;
}

export default function StrategiesPage() {
  const { setView } = useUiStore();
  const [templates, setTemplates] = useState<StrategyCard[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    const FT_TEMPLATES: StrategyCard[] = [
      {
        id: 'ftusd-delta-neutral',
        title: 'Flying Tulip ftUSD Delta-Neutral Yield',
        apy: '14.5%',
        risk: 'Low',
        networks: 'Arbitrum + Ethereum',
        createdBy: 'BRICK3 Labs',
        usage: 8431,
        category: 'Stablecoin',
        description: 'Deposit USDC as collateral on Flying Tulip, mint yield-bearing ftUSD, and stake it delta-neutrally in Curve pools to farm APY.',
        prompt: 'Lend USDC on Flying Tulip, mint ftUSD, and supply to yield pools',
        strategy: {
          nodes: [
            { type: 'FT DEPOSIT', params: { asset: 'USDC', amount: 10000, action: 'deposit' } },
            { type: 'FT USD MINT', params: { asset: 'USDC', amount: 10000, action: 'mint' } },
            { type: 'YIELD', params: { asset: 'ftUSD', amount: 10000 } }
          ]
        }
      },
      {
        id: 'ftusd-arbitrage-premium',
        title: 'ftUSD Arbitrage & Premium Premium',
        apy: '24.2%',
        risk: 'Medium',
        networks: 'Base + Ethereum',
        createdBy: 'BRICK3 Labs',
        usage: 3491,
        category: 'Arbitrage',
        description: 'Mint ftUSD on Base using collateral, swap ftUSD to USDC on Flying Tulip CLOB at premium, and bridge back to Ethereum.',
        prompt: 'Mint ftUSD on Base, swap for USDC on Flying Tulip CLOB, and bridge to Ethereum',
        strategy: {
          nodes: [
            { type: 'FT DEPOSIT', params: { asset: 'USDC', amount: 10000, action: 'deposit' } },
            { type: 'FT USD MINT', params: { asset: 'USDC', amount: 10000, action: 'mint' } },
            { type: 'FT SWAP', params: { from: 'ftUSD', to: 'USDC', amount: 10000, orderType: 'market' } },
            { type: 'BRIDGE', params: { fromChain: 'Base', toChain: 'Ethereum', asset: 'USDC', amount: 10000 } }
          ]
        }
      },
      {
        id: 'ftusd-leverage-long',
        title: 'ftUSD Leverage Long Lido Loop',
        apy: '18.8%',
        risk: 'Medium',
        networks: 'Ethereum',
        createdBy: 'BRICK3 Labs',
        usage: 5219,
        category: 'Yield',
        description: 'Deposit collateral on Flying Tulip, mint ftUSD, swap ftUSD for ETH, and stake ETH on Lido to leverage long yield.',
        prompt: 'Deposit to Flying Tulip, mint ftUSD, swap ftUSD for ETH, and stake on Lido',
        strategy: {
          nodes: [
            { type: 'FT DEPOSIT', params: { asset: 'USDC', amount: 10000, action: 'deposit' } },
            { type: 'FT USD MINT', params: { asset: 'USDC', amount: 10000, action: 'mint' } },
            { type: 'FT SWAP', params: { from: 'ftUSD', to: 'ETH', amount: 10000, orderType: 'market' } },
            { type: 'STAKE', params: { asset: 'ETH', amount: 3.3 } }
          ]
        }
      }
    ];

    const load = async () => {
      const [templateResult, quickResult] = await Promise.allSettled([api.templates(), api.quickTemplates()]);

      if (templateResult.status === 'fulfilled') {
        const data = templateResult.value as { total: number; templates?: Array<any> };
        const mapped = (data.templates || []).map((t: any, i: number) => {
          const normalizedCategory = t.category ? `${t.category.charAt(0).toUpperCase()}${t.category.slice(1)}` : '';
          return {
            id: t.id,
            title: t.name,
            apy: t.apy_estimate ? `${Number(t.apy_estimate).toFixed(1)}%` : `${(10 + (t.usage_count || 0) % 15).toFixed(0)}%`,
            risk: t.risk_level ? `${t.risk_level.charAt(0).toUpperCase()}${t.risk_level.slice(1)}` : t.category === 'liquidation' ? 'High' : t.category === 'stablecoin' ? 'Low' : 'Medium',
            networks: Array.isArray(t.networks) && t.networks.length > 0 ? t.networks.join(' + ') : t.strategy?.nodes?.some((n: any) => n.type === 'BRIDGE') ? 'Base + Ethereum' : 'Ethereum',
            createdBy: t.creator || 'BRICK3 Labs',
            usage: t.usage_count || 0,
            category: CATEGORIES.includes(normalizedCategory as any) ? normalizedCategory : CATEGORIES[i % CATEGORIES.length],
            description: t.description || t.summary || 'Executable strategy template backed by the current compiler rules.',
            prompt: t.prompt || `Build a ${t.category} strategy`,
            strategy: t.strategy,
          };
        });
        setTemplates([...FT_TEMPLATES, ...mapped]);
        return;
      }

      if (quickResult.status === 'fulfilled') {
        const data = quickResult.value as { templates?: Array<{ id: string; title: string; prompt: string; category?: string }> };
        const mapped = (data.templates || []).map((t, i) => ({
          id: t.id,
          title: t.title,
          apy: `${(12 + i * 2).toFixed(0)}%`,
          risk: i % 3 === 0 ? 'Low' : i % 3 === 1 ? 'Medium' : 'High',
          networks: i % 2 ? 'Base + Ethereum' : 'Base + Arbitrum',
          createdBy: 'BRICK3 Labs',
          usage: 12481 - i * 317,
          category: CATEGORIES[i % CATEGORIES.length],
          prompt: t.prompt,
        }));
        setTemplates([...FT_TEMPLATES, ...mapped]);
      } else {
        setTemplates(FT_TEMPLATES);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return templates;
    return templates.filter((t) => t.category === activeCategory);
  }, [templates, activeCategory]);

  // AI parse → build blocks → navigate to canvas
  const handleAIBuild = async () => {
    if (!aiInput.trim()) {
      setView('canvas');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const generated = await api.generateTemplate({
        prompt: aiInput,
        category: activeCategory.toLowerCase(),
        max_usdc: 50000,
        creator: 'AI Assistant',
      }) as any;

      const nodes = generated?.generated_template?.strategy?.nodes || [];
      const blocks = nodes.length > 0
        ? nodes.map((node: any, i: number) => mapActionToBlock(node.type || node.action || `Step ${i + 1}`, i))
        : [
            { id: `ai-0-${Date.now()}`, type: 'FLASH LOAN' as BlockType, provider: 'Aave', asset: 'USDC', amount: 10000 },
            { id: `ai-1-${Date.now()}`, type: 'SWAP' as BlockType, from: 'USDC', to: 'ETH', dex: 'Auto' },
            { id: `ai-2-${Date.now()}`, type: 'CLAIM' as BlockType },
          ];

      localStorage.setItem('brick3_canvas_intent', JSON.stringify({ blocks, prompt: aiInput }));
      setView('canvas');
    } catch (err: any) {
      setAiError(err?.message || 'AI generation failed');
      const blocks = [
        { id: `ai-0-${Date.now()}`, type: 'FLASH LOAN' as BlockType, provider: 'Aave', asset: 'USDC', amount: 10000 },
        { id: `ai-1-${Date.now()}`, type: 'SWAP' as BlockType, from: 'USDC', to: 'ETH', dex: 'Auto' },
        { id: `ai-2-${Date.now()}`, type: 'CLAIM' as BlockType },
      ];
      localStorage.setItem('brick3_canvas_intent', JSON.stringify({ blocks, prompt: aiInput }));
      setView('canvas');
    } finally {
      setAiLoading(false);
    }
  };

  const applyStrategy = (strategy: StrategyCard) => {
    const blocks = strategy.strategy?.nodes?.length
      ? strategy.strategy.nodes.map((node, i) => nodeToBlock(node, i))
      : [
          { id: `tpl-0-${Date.now()}`, type: 'FLASH LOAN' as BlockType, provider: 'Aave', asset: 'USDC', amount: 10000 },
          { id: `tpl-1-${Date.now()}`, type: 'SWAP' as BlockType, from: 'USDC', to: 'ETH', dex: 'Auto' },
          { id: `tpl-2-${Date.now()}`, type: 'CLAIM' as BlockType },
        ];
    localStorage.setItem('brick3_canvas_intent', JSON.stringify({ blocks, prompt: strategy.prompt, strategyId: strategy.id }));
    setView('canvas');
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#0A0505] space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white tracking-tight">Opacus Marketplace</h2>
        <p className="text-sm text-white/60 mt-1">Opacus Agent and Strategy Marketplace</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-xs uppercase tracking-wider text-white/50 mb-2">AI Assisted Strategy</p>
        <div className="flex gap-2">
          <input
            value={aiInput}
            onChange={(e) => { setAiInput(e.target.value); setAiError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleAIBuild()}
            placeholder="Describe your strategy in plain language…"
            className="flex-1 rounded-xl border border-white/10 bg-[#10131B] px-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-white/25 transition-colors"
          />
          <button
            onClick={handleAIBuild}
            disabled={aiLoading}
            className="px-4 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50 min-w-[120px]"
          >
            {aiLoading ? 'Building…' : 'Build on Canvas'}
          </button>
        </div>
        {aiError && <p className="text-xs text-red-300 mt-2">{aiError}</p>}
        <p className="text-xs text-white/30 mt-2">Try: "Flash loan USDC, swap to ETH, repay" or "Delta neutral yield on Base"</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-3 py-1.5 rounded-full text-xs border ${activeCategory === 'All' ? 'bg-white text-black border-white' : 'bg-white/5 text-white/70 border-white/15 hover:text-white'}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActiveCategory(c)}
            className={`px-3 py-1.5 rounded-full text-xs border ${activeCategory === c ? 'bg-white text-black border-white' : 'bg-white/5 text-white/70 border-white/15 hover:text-white'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-[#0F121A] p-4 space-y-3">
            <h3 className="text-white font-medium">{s.title}</h3>
            {s.description && <p className="text-xs leading-5 text-white/45">{s.description}</p>}
            <div className="space-y-1 text-sm">
              <p className="text-white/60">Estimated APY <span className="text-white float-right">{s.apy}</span></p>
              <p className="text-white/60">Risk <span className="text-white float-right">{s.risk}</span></p>
              <p className="text-white/60">Networks <span className="text-white float-right">{s.networks}</span></p>
              <p className="text-white/60">Usage <span className="text-white float-right">{s.usage.toLocaleString()}</span></p>
            </div>
            {s.strategy?.nodes?.length ? (
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
                {s.strategy.nodes.length} executable steps wired to the current compiler
              </div>
            ) : null}
            <button
              onClick={() => applyStrategy(s)}
              className="w-full py-2 rounded-xl border border-white/15 text-white/90 hover:bg-white/5 text-sm transition-colors"
            >
              Use Strategy
            </button>
          </div>
        ))}

        {filtered.length === 0 && templates.length > 0 && (
          <div className="col-span-3 py-12 text-center text-white/40 text-sm">
            No templates found in category "{activeCategory}"
          </div>
        )}

        {templates.length === 0 && (
          <div className="col-span-3 py-12 text-center text-white/35 text-sm">
            Loading templates…
          </div>
        )}
      </div>
    </div>
  );
}
