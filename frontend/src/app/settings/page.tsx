import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useSessionStore } from '../../store/session.store';

const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
  <button onClick={onChange} className={`w-11 h-6 rounded-full transition-colors ${value ? 'bg-red-500' : 'bg-white/20'}`}>
    <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`}></span>
  </button>
);

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
    <span className="text-sm text-white/85">{label}</span>
    <div>{children}</div>
  </div>
);

export default function SettingsPage() {
  const { address } = useAccount();
  const { authMethod, embeddedWalletAddress, securityPrefs, setSecurityPrefs } = useSessionStore();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto p-6 bg-[#0A0505] space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-sm text-white/55 mt-1">Simple controls for wallet, security, and preferences.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F121A] p-4">
        <h3 className="text-white font-medium">Wallet</h3>
        <div className="mt-2">
          <Row label="Connected Wallets">
            <span className="text-sm text-white/70">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}</span>
          </Row>
          <Row label="Embedded Wallet">
            <span className="text-sm text-white/70">{authMethod === 'google' && embeddedWalletAddress ? `${embeddedWalletAddress.slice(0, 6)}...${embeddedWalletAddress.slice(-4)}` : 'Disabled'}</span>
          </Row>
          <Row label="Session Security">
            <span className="text-sm text-white/70">Protected</span>
          </Row>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F121A] p-4">
        <h3 className="text-white font-medium">Security</h3>
        <div className="mt-2">
          <Row label="MEV Protection">
            <Toggle value={securityPrefs.mevProtection} onChange={() => setSecurityPrefs({ mevProtection: !securityPrefs.mevProtection })} />
          </Row>
          <Row label="Private Execution">
            <Toggle value={securityPrefs.privateExecution} onChange={() => setSecurityPrefs({ privateExecution: !securityPrefs.privateExecution })} />
          </Row>
          <Row label="Auto-Revert Unsafe Trades">
            <Toggle value={securityPrefs.autoRevert} onChange={() => setSecurityPrefs({ autoRevert: !securityPrefs.autoRevert })} />
          </Row>
          <Row label="Simulation Before Execution">
            <Toggle value={securityPrefs.simulationBeforeExecution} onChange={() => setSecurityPrefs({ simulationBeforeExecution: !securityPrefs.simulationBeforeExecution })} />
          </Row>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F121A] p-4">
        <h3 className="text-white font-medium">Preferences</h3>
        <div className="mt-2">
          <Row label="Default Network">
            <select className="bg-[#11151F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm">
              {['Base', 'Ethereum', 'Arbitrum', 'Optimism', 'Polygon'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Row>
          <Row label="Currency">
            <select className="bg-[#11151F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm">
              {['USDC', 'USD', 'ETH'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Row>
          <Row label="Slippage Tolerance">
            <select className="bg-[#11151F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm">
              {['0.1%', '0.3%', '0.5%', '1.0%'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Row>
          <Row label="Gas Preference">
            <select className="bg-[#11151F] border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm">
              {['Balanced', 'Fast', 'Low Cost'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </Row>
          <Row label="Theme">
            <span className="text-sm text-white/70">Graphite</span>
          </Row>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F121A] p-4">
        <h3 className="text-white font-medium">Notifications</h3>
        <div className="mt-2">
          <Row label="Execution Completed"><Toggle value={true} onChange={() => {}} /></Row>
          <Row label="Vault Alerts"><Toggle value={true} onChange={() => {}} /></Row>
          <Row label="Large Profit Alerts"><Toggle value={true} onChange={() => {}} /></Row>
          <Row label="Failed Transactions"><Toggle value={true} onChange={() => {}} /></Row>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0F121A] p-4">
        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          className="w-full flex items-center justify-between text-white/85 text-sm"
        >
          <span>Advanced</span>
          <span>{advancedOpen ? '−' : '+'}</span>
        </button>

        {advancedOpen && (
          <div className="mt-3 space-y-2 text-sm text-white/65">
            <p>Developer Mode</p>
            <p>Show Execution Trace</p>
            <p>Show Simulation Logs</p>
            <p>Custom RPC</p>
            <p>Custom Solver Region</p>
          </div>
        )}
      </div>
    </div>
  );
}
