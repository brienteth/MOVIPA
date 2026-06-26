import React, { useState } from 'react';

import WalletButton from '../../components/ui/WalletButton';
import CanvasPage from '../canvas/page';
import Portfolio from '../../components/Portfolio';
import StrategiesPage from '../strategies/page';

import { motion } from 'framer-motion';

export default function LendingPage() {
  const [activeTab, setActiveTab] = useState<'workspace' | 'marketplace' | 'portfolio'>('workspace');

  return (
    <div className="min-h-screen bg-[#0A0505] text-white">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0A0505]/95 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="/brick3-logo.jpg" alt="BRICK3" className="w-7 h-7" />
              <div className="hidden sm:block">
                <div className="text-sm font-semibold">Manage</div>
                <div className="text-xs text-white/50">Lending & Marketplace</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 ml-4">
              <button
                onClick={() => setActiveTab('workspace')}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'workspace' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {activeTab === 'workspace' && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-lg" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">dashboard_customize</span>
                  Workspace
                </span>
              </button>
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'marketplace' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {activeTab === 'marketplace' && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-lg" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">storefront</span>
                  Marketplace
                </span>
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`relative px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${activeTab === 'portfolio' ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {activeTab === 'portfolio' && (
                  <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-lg" />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                  Portfolio
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <WalletButton />
          </div>
        </div>
      </div>

      <div className="pt-[88px] h-screen flex flex-col">
        <div className="flex-1 w-full mx-auto min-h-0">
          {activeTab === 'workspace' ? (
            <CanvasPage />
          ) : activeTab === 'marketplace' ? (
            <StrategiesPage />
          ) : (
            <Portfolio />
          )}
        </div>
      </div>
    </div>
  );
}
