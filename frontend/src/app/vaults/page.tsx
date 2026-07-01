'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { api } from '../../lib/api';

type VaultStatus = 'CREATED' | 'FUNDED' | 'ACTIVE' | 'OPTIMIZING' | 'REBALANCING' | 'SETTLED';
type RiskLevel = 'Low' | 'Medium' | 'High';

interface Vault {
  id: string;
  user_address: string;
  name: string;
  description: string;
  status: VaultStatus;
  tvl_usdc: number;
  apy_estimate: number;
  risk_level: RiskLevel;
  chain: string;
  strategy_template_id: string;
  strategy_nodes: Array<{ type: string; params: Record<string, unknown> }>;
  profit_today_usdc: number;
  profit_7d_usdc: number;
  profit_30d_usdc: number;
  cumulative_profit_usdc: number;
  latency_ms: number;
  solver_region: string;
  health_status: string;
  execution_mode: string;
  created_at: number;
  last_rebalance_at: number;
  settlement_tx_hash?: string;
}

interface MarketplaceVault {
  id: string;
  name: string;
  description: string;
  apy_estimate: number;
  tvl_usdc: number;
  win_rate_percent: number;
  risk_level: RiskLevel;
  creator_fee_percent: number;
  users_count: number;
  strategy_category: string;
}

const DEFAULT_STRATEGY_TEMPLATES = [
  { id: 'default-arbitrage', name: 'Flash Loan Arbitrage', category: 'arbitrage' },
  { id: 'default-yield', name: 'Multi-Chain Yield', category: 'yield' },
  { id: 'default-bridge', name: 'Cross-Chain Bridge', category: 'bridge' },
];

const createFlowSteps = [
  'Template Selection',
  'Capital Input',
  'Risk Profile',
  'Execution Mode',
  'Solver Selection',
  'Review',
];

export default function VaultsPage() {
  const { address } = useAccount();
  const [strategyTemplates, setStrategyTemplates] = useState(DEFAULT_STRATEGY_TEMPLATES);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [marketplaceVaults, setMarketplaceVaults] = useState<MarketplaceVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Create flow state
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(DEFAULT_STRATEGY_TEMPLATES[0].id);
  const [vaultName, setVaultName] = useState('My Strategy Vault');
  const [depositAmount, setDepositAmount] = useState(1000);
  const [riskProfile, setRiskProfile] = useState<RiskLevel>('Medium');
  const [executionMode, setExecutionMode] = useState<'Autonomous' | 'Manual' | 'Simulation'>('Autonomous');
  const [solverRegion, setSolverRegion] = useState<'Auto' | 'Frankfurt' | 'Singapore' | 'Virginia'>('Auto');

  // Deposit/Withdraw modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedVaultForAction, setSelectedVaultForAction] = useState<string | null>(null);
  const [actionAmount, setActionAmount] = useState(0);

  // Load vaults on mount and when address changes
  useEffect(() => {
    const loadData = async () => {
      if (!address) {
        setVaults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [vaultsResRaw, marketplaceResRaw, templatesResRaw] = await Promise.all([
          api.vaults(address),
          api.marketplaceVaults(),
          api.templates(),
        ]);
        const vaultsRes = vaultsResRaw as { vaults?: Vault[] };
        const marketplaceRes = marketplaceResRaw as { vaults?: MarketplaceVault[] };
        const templatesRes = templatesResRaw as { templates?: Array<{ id: string; name: string; category?: string }> };
        setVaults(vaultsRes.vaults || []);
        setMarketplaceVaults(marketplaceRes.vaults || []);
        const mappedTemplates = (templatesRes.templates || []).map((t: any) => ({
          id: t.id,
          name: t.name,
          category: t.category || 'general',
        }));
        const combinedTemplates = [...mappedTemplates];
        setStrategyTemplates(combinedTemplates);
        if (!combinedTemplates.some((t: any) => t.id === selectedTemplate)) {
          setSelectedTemplate(combinedTemplates[0].id);
        }
      } catch (err) {
        console.error('Failed to load vaults:', err);
        setVaults([]);
        setMarketplaceVaults([]);
        setStrategyTemplates(DEFAULT_STRATEGY_TEMPLATES);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [address, selectedTemplate]);

  const totalTvl = useMemo(
    () => vaults.reduce((sum, vault) => sum + vault.tvl_usdc, 0),
    [vaults]
  );

  const avgApy = useMemo(
    () => (vaults.length ? vaults.reduce((sum, vault) => sum + vault.apy_estimate, 0) / vaults.length : 0),
    [vaults]
  );

  const systemHealth = useMemo(() => {
    if (vaults.length === 0) return 'Stable';
    const healthyCount = vaults.filter((v) => v.health_status === 'healthy').length;
    const ratio = healthyCount / vaults.length;
    if (ratio > 0.8) return 'Stable';
    if (ratio > 0.5) return 'Caution';
    return 'Risk';
  }, [vaults]);

  const createVault = async () => {
    if (!address) {
      alert('Connect wallet to create vault');
      return;
    }

    setCreating(true);
    try {
      const template = strategyTemplates.find((t) => t.id === selectedTemplate);
      const newVaultRaw = await api.createVault({
        user_address: address,
        name: vaultName,
        description: `${template?.name || 'Custom'} with ${riskProfile} risk`,
        strategy_template_id: selectedTemplate,
        deposit_amount_usdc: depositAmount,
        risk_level: riskProfile.toLowerCase(),
        solver_region: solverRegion.toLowerCase(),
        execution_mode: executionMode.toLowerCase(),
        chain: 'base',
      });
      const newVault = newVaultRaw as Vault;

      setVaults((prev) => [newVault, ...prev]);
      alert('Vault created successfully!');
      
      // Reset form
      setActiveStep(1);
      setSelectedTemplate((strategyTemplates[0] || DEFAULT_STRATEGY_TEMPLATES[0]).id);
      setVaultName('My Strategy Vault');
      setDepositAmount(1000);
      setRiskProfile('Medium');
      setExecutionMode('Autonomous');
      setSolverRegion('Auto');
    } catch (err) {
      console.error('Failed to create vault:', err);
      alert(`Failed to create vault: ${String(err)}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDeposit = async () => {
    if (!address || !selectedVaultForAction) return;

    try {
      await api.depositVault(selectedVaultForAction, {
        user_address: address,
        amount_usdc: actionAmount,
        chain: 'base',
      });

      // Update vault TVL
      setVaults((prev) =>
        prev.map((v) =>
          v.id === selectedVaultForAction
            ? { ...v, tvl_usdc: v.tvl_usdc + actionAmount }
            : v
        )
      );

      alert('Deposit successful!');
      setShowDepositModal(false);
      setActionAmount(0);
      setSelectedVaultForAction(null);
    } catch (err) {
      console.error('Deposit failed:', err);
      alert(`Deposit failed: ${String(err)}`);
    }
  };

  const handleWithdraw = async (vaultId: string, amount: number) => {
    if (!address) return;

    try {
      await api.withdrawVault(vaultId, {
        user_address: address,
        amount_usdc: amount,
        chain: 'base',
      });

      // Update vault TVL
      setVaults((prev) =>
        prev.map((v) =>
          v.id === vaultId ? { ...v, tvl_usdc: v.tvl_usdc - amount } : v
        )
      );

      alert('Withdrawal successful!');
    } catch (err) {
      console.error('Withdrawal failed:', err);
      alert(`Withdrawal failed: ${String(err)}`);
    }
  };

  const advanceStep = () => setActiveStep((prev) => Math.min(prev + 1, createFlowSteps.length));
  const retreatStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#0A0505] space-y-8 text-white">
      {/* Header & Stats */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/40">Autonomous Capital Execution Layer</p>
            <h1 className="text-3xl font-semibold tracking-tight">Vaults</h1>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Total TVL</p>
              <p className="mt-3 text-2xl font-semibold">${(totalTvl / 1000000).toFixed(2)}M</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Active Vaults</p>
              <p className="mt-3 text-2xl font-semibold">{vaults.length}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/60">Avg APY</p>
              <p className="mt-3 text-2xl font-semibold">{avgApy.toFixed(1)}%</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">System Health</p>
                <p className="mt-3 text-2xl font-semibold">{systemHealth}</p>
              </div>
              <span
                className={`h-4 w-4 rounded-full ${
                  systemHealth === 'Stable'
                    ? 'bg-red-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]'
                    : systemHealth === 'Caution'
                    ? 'bg-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.45)]'
                    : 'bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.45)]'
                }`}
              ></span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          {/* Active Vaults Section */}
          <section className="rounded-3xl border border-white/10 bg-[#0F121A] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">Active Vaults</p>
                <h2 className="mt-3 text-xl font-semibold">Capital deployment</h2>
              </div>
              <div className="flex gap-2 text-xs text-white/60">
                <span className="rounded-full bg-white/5 px-3 py-2">CREATED</span>
                <span className="rounded-full bg-white/5 px-3 py-2">FUNDED</span>
                <span className="rounded-full bg-white/5 px-3 py-2">ACTIVE</span>
              </div>
            </div>

            {loading ? (
              <div className="mt-6 text-center text-white/60">Loading vaults...</div>
            ) : vaults.length === 0 ? (
              <div className="mt-6 text-center text-white/60">
                {address ? 'No vaults yet. Create one using the form on the right.' : 'Connect wallet to view vaults.'}
              </div>
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {vaults.map((vault) => (
                  <div key={vault.id} className="rounded-3xl border border-white/10 bg-[#121622] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{vault.name}</h3>
                        <p className="text-sm text-white/60 mt-2">{vault.description}</p>
                      </div>
                      <span className="text-xs tracking-[0.24em] text-white/40 px-2 py-1 bg-white/5 rounded">
                        {vault.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-white/50">TVL</p>
                        <p className="mt-2 text-xl font-semibold">${vault.tvl_usdc.toLocaleString()}</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-white/50">APY</p>
                        <p className="mt-2 text-xl font-semibold">{vault.apy_estimate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-white/60 space-y-2">
                      <p>
                        Risk: <span className="text-white">{vault.risk_level}</span>
                      </p>
                      <p>
                        Chain: <span className="text-white">{vault.chain.toUpperCase()}</span>
                      </p>
                      <p>
                        Profit Today:{' '}
                        <span className="text-red-400">+${vault.profit_today_usdc.toLocaleString()}</span>
                      </p>
                      <p>
                        7D: <span className="text-red-400">+${vault.profit_7d_usdc.toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-white/50">Latency</p>
                        <p className="mt-2 text-lg font-semibold">{vault.latency_ms.toFixed(0)}ms</p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-4">
                        <p className="text-xs text-white/50">Solver</p>
                        <p className="mt-2 text-lg font-semibold">{vault.solver_region}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">
                        View
                      </button>
                      <button
                        onClick={() => {
                          setSelectedVaultForAction(vault.id);
                          setShowDepositModal(true);
                        }}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/15"
                      >
                        Deposit
                      </button>
                      <button
                        onClick={() =>
                          handleWithdraw(vault.id, Math.min(100, vault.tvl_usdc * 0.1))
                        }
                        className="rounded-xl border border-white/10 bg-red-500/10 px-4 py-2 text-sm text-red-400 hover:bg-red-500/15"
                      >
                        Withdraw
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Performance Section */}
          <section className="rounded-3xl border border-white/10 bg-[#0F121A] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-white/40">Portfolio Analytics</p>
                <h2 className="mt-3 text-xl font-semibold">Vault performance</h2>
              </div>
              <div className="text-right text-sm text-white/60">
                <p>Cumulative Return</p>
                <p className="mt-1 font-semibold text-red-400">
                  +${vaults.reduce((sum, v) => sum + v.cumulative_profit_usdc, 0).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">Total Profit (7D)</p>
                <p className="mt-2 text-2xl font-semibold text-red-400">
                  +${vaults.reduce((sum, v) => sum + v.profit_7d_usdc, 0).toLocaleString()}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs text-white/50">Avg Solver Latency</p>
                <p className="mt-2 text-2xl font-semibold">
                  {(vaults.reduce((sum, v) => sum + v.latency_ms, 0) / Math.max(vaults.length, 1)).toFixed(0)}ms
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: Create Vault + Marketplace */}
        <aside className="space-y-6">
          {/* Create Vault Section */}
          <section className="rounded-3xl border border-white/10 bg-[#0F121A] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">Create Vault</p>
            <h2 className="mt-3 text-xl font-semibold">New autonomous vault</h2>

            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs text-white/50 uppercase tracking-[0.22em] mb-3">
                  Step {activeStep} — {createFlowSteps[activeStep - 1]}
                </p>

                {/* Step 1: Template Selection */}
                {activeStep === 1 && (
                  <div className="space-y-3">
                    {strategyTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          selectedTemplate === template.id
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-white/60 mt-1">{template.category}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 2: Capital Input */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Vault Name</label>
                      <input
                        type="text"
                        value={vaultName}
                        onChange={(e) => setVaultName(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#10131B] px-4 py-3 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-white/70 mb-2">Deposit Amount (USDC)</label>
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full rounded-2xl border border-white/10 bg-[#10131B] px-4 py-3 text-white"
                      />
                      <p className="text-xs text-white/50 mt-2">Min: $100 | Recommended: $1,000+</p>
                    </div>
                  </div>
                )}

                {/* Step 3: Risk Profile */}
                {activeStep === 3 && (
                  <div className="space-y-3">
                    {(['Low', 'Medium', 'High'] as RiskLevel[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => setRiskProfile(option)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          riskProfile === option
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option}</span>
                          <span
                            className={`text-xs ${
                              option === 'Low'
                                ? 'text-blue-300'
                                : option === 'Medium'
                                ? 'text-yellow-300'
                                : 'text-red-300'
                            }`}
                          >
                            {option === 'Low'
                              ? 'Stable'
                              : option === 'Medium'
                              ? 'Balanced'
                              : 'Aggressive'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 4: Execution Mode */}
                {activeStep === 4 && (
                  <div className="space-y-3">
                    {(['Autonomous', 'Manual', 'Simulation'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setExecutionMode(mode)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          executionMode === mode
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <p className="font-medium">{mode}</p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 5: Solver Selection */}
                {activeStep === 5 && (
                  <div className="space-y-3">
                    {(['Auto', 'Frankfurt', 'Singapore', 'Virginia'] as const).map((region) => (
                      <button
                        key={region}
                        onClick={() => setSolverRegion(region)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                          solverRegion === region
                            ? 'border-red-500/40 bg-red-500/10'
                            : 'border-white/10 bg-white/5 text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <span className="font-medium">{region}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Step 6: Review */}
                {activeStep === 6 && (
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-white/80 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Vault Name:</span>
                      <span className="text-white">{vaultName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Deposit:</span>
                      <span className="text-white">${depositAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Risk Level:</span>
                      <span className="text-white">{riskProfile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Execution:</span>
                      <span className="text-white">{executionMode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Solver Region:</span>
                      <span className="text-white">{solverRegion}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4">
                <button
                  onClick={retreatStep}
                  disabled={activeStep === 1}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={activeStep === createFlowSteps.length ? createVault : advanceStep}
                  disabled={creating}
                  className="flex-1 rounded-xl bg-red-500 text-white px-4 py-3 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50"
                >
                  {activeStep === createFlowSteps.length ? (creating ? 'Creating...' : 'Create Vault') : 'Next'}
                </button>
              </div>
            </div>
          </section>

          {/* Marketplace Vaults Section */}
          <section className="rounded-3xl border border-white/10 bg-[#0F121A] p-6">
            <p className="text-sm uppercase tracking-[0.22em] text-white/40">Marketplace</p>
            <h2 className="mt-3 text-xl font-semibold">Featured vaults</h2>
            <div className="mt-5 space-y-3">
              {marketplaceVaults.slice(0, 3).map((vault) => (
                <div key={vault.id} className="rounded-2xl border border-white/10 bg-[#121622] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold">{vault.name}</h3>
                      <p className="text-xs text-white/60 mt-1">{vault.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      vault.risk_level === 'Low'
                        ? 'bg-blue-500/20 text-blue-300'
                        : vault.risk_level === 'Medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-red-500/20 text-red-300'
                    }`}>
                      {vault.risk_level}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-xs text-white/50">APY</p>
                      <p className="text-sm font-semibold">{vault.apy_estimate.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-xs text-white/50">Win Rate</p>
                      <p className="text-sm font-semibold">{vault.win_rate_percent.toFixed(0)}%</p>
                    </div>
                    <div className="rounded-lg bg-white/5 p-2 text-center">
                      <p className="text-xs text-white/50">Fee</p>
                      <p className="text-sm font-semibold">{vault.creator_fee_percent.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="rounded-3xl border border-white/10 bg-[#0F121A] p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white">Deposit to Vault</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-2">Amount (USDC)</label>
                <input
                  type="number"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(Number(e.target.value))}
                  className="w-full rounded-2xl border border-white/10 bg-[#10131B] px-4 py-3 text-white"
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setActionAmount(0);
                  }}
                  className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeposit}
                  className="flex-1 rounded-xl bg-red-500 text-white px-4 py-3 text-sm font-semibold hover:bg-emerald-600"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
