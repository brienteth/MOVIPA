import { IntentPayload } from '../types/intent';

// API base URL configuration:
// - Development: http://127.0.0.1:8001 (local backend)
// - Production: relative to frontend origin (same domain assumed)
// - Override: set REACT_APP_API_BASE_URL env var for different backend server
const getApiBase = (): string => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8001'; // SSR fallback
  
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  if (envUrl) return envUrl; // Explicit override
  
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8001'; // Local backend in dev
  }
  
  // In production, use the configured backend host for the BRICK3 frontend.
  // Since we are deploying frontend and backend together on Vercel, we can use relative paths
  return '';
};

export const API_BASE = getApiBase();

async function request<T>(path: string, init?: RequestInit & { timeout?: number }): Promise<T> {
  const timeout = init?.timeout || 30000; // 30s default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
      ...init,
      signal: controller.signal,
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`API ${path} failed (${res.status}): ${txt}`);
    }
    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  health: () => request('/api/v2/health'),
  quicStatus: () => request('/api/v2/opacus/quic/status'),
  quickTemplates: () => request('/api/v2/opacus/quick-templates'),
  templates: () => request('/api/v2/templates'),
  generateTemplate: (payload: { prompt: string; category?: string; max_usdc?: number; creator?: string; save?: boolean }) =>
    request('/api/v2/templates/generate', { method: 'POST', body: JSON.stringify(payload) }),
  benchmark: () => request('/api/v2/benchmark'),
  rpcStatus: () => request('/api/v2/rpc/status'),
  mempool: () => request('/api/v2/intents/mempool'),
  arbitrageStats: () => request('/api/v2/arbitrage/statistics'),
  executionHistory: (limit = 8, filterSuccess?: boolean) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (typeof filterSuccess === 'boolean') {
      params.set('filter_success', String(filterSuccess));
    }
    return request(`/api/v2/arbitrage/execution-history?${params.toString()}`);
  },
  strategyExecutionHistory: (limit = 8, userAddress?: string, filterSuccess?: boolean) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (userAddress) params.set('user_address', userAddress);
    if (typeof filterSuccess === 'boolean') params.set('filter_success', String(filterSuccess));
    return request(`/api/v2/strategy/execution-history?${params.toString()}`);
  },
  walletActivity: (userAddress: string, lookbackBlocks = 2500, limit = 20) =>
    request(`/api/v2/wallet/activity?user_address=${encodeURIComponent(userAddress)}&lookback_blocks=${lookbackBlocks}&limit=${limit}`),
  arbOpportunities: (minAmount = 100000, maxAmount = 10000000) =>
    request(`/api/v2/arbitrage/opportunities?min_amount=${minAmount}&max_amount=${maxAmount}`),
  publishIntent: (payload: {
    user: string;
    strategy_hash: string;
    chain: string;
    notional_usdc: number;
    min_profit_usdc: number;
    max_slippage_bps: number;
    deadline_ts: number;
    nonce: number;
    intent_stake_score: number;
  }) => request('/api/v2/intents/publish', { method: 'POST', body: JSON.stringify(payload) }),
  solveIntent: (intentId: string, payload: {
    tee_attestation: {
      quote_hash: string;
      enclave: string;
      signature: string;
      issued_at_ts: number;
    };
    relay_preference?: string;
  }) => request(`/api/v2/intents/solve/${intentId}`, { method: 'POST', body: JSON.stringify(payload) }),
  simulateStrategy: (payload: { nodes: Array<{ type: string; params: Record<string, unknown> }>; gas_price_gwei?: number; eth_price_usd?: number; slippage_bps?: number; gas_priority?: string }) =>
    request('/api/v2/strategy/simulate', { method: 'POST', body: JSON.stringify(payload) }),
  compileStrategy: (payload: { nodes: Array<{ type: string; params: Record<string, unknown> }>; slippage_bps?: number; gas_priority?: string }, opts?: { timeout?: number }) =>
    request('/api/v2/strategy/compile', { method: 'POST', body: JSON.stringify(payload), timeout: opts?.timeout }),
  bridgeTransfer: (payload: {
    from_chain: string;
    to_chain: string;
    token: string;
    amount: number;
    bridge?: string;
  }) => {
    const params = new URLSearchParams({
      from_chain: payload.from_chain,
      to_chain: payload.to_chain,
      token: payload.token,
      amount: String(payload.amount),
      bridge: payload.bridge || 'across',
    });
    return request(`/api/v2/bridge/transfer?${params.toString()}`, { method: 'POST' });
  },
  parseIntent: (payload: IntentPayload) => request('/api/v1/intent', { method: 'POST', body: JSON.stringify(payload) }),
  
  // Vault management
  vaults: (userAddress: string) => 
    request(`/api/v2/vaults?user_address=${encodeURIComponent(userAddress)}`),
  vaultDetail: (vaultId: string) => 
    request(`/api/v2/vaults/${vaultId}`),
  createVault: (payload: {
    user_address: string;
    name: string;
    description: string;
    strategy_template_id: string;
    deposit_amount_usdc: number;
    risk_level: string;
    solver_region: string;
    execution_mode: string;
    chain?: string;
  }) => request('/api/v2/vaults/create', { method: 'POST', body: JSON.stringify(payload) }),
  depositVault: (vaultId: string, payload: {
    user_address: string;
    amount_usdc: number;
    chain?: string;
  }) => request(`/api/v2/vaults/${vaultId}/deposit`, { method: 'POST', body: JSON.stringify(payload) }),
  withdrawVault: (vaultId: string, payload: {
    user_address: string;
    amount_usdc: number;
    chain?: string;
  }) => request(`/api/v2/vaults/${vaultId}/withdraw`, { method: 'POST', body: JSON.stringify(payload) }),
  marketplaceVaults: () => 
    request('/api/v2/vaults/marketplace'),
  suggestedVaults: (userAddress: string, riskProfile?: string) => {
    const params = new URLSearchParams({ user_address: userAddress });
    if (riskProfile) params.set('risk_profile', riskProfile);
    return request(`/api/v2/vaults/marketplace/suggested?${params.toString()}`);
  },
};
