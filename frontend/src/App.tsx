import React from 'react';
import { WagmiConfig } from 'wagmi';
import RootLayout from './app/layout';
import Brick3AppLayout from './app/app/layout';
import AppLandingPage from './app/app/page';
import CanvasPage from './app/canvas/page';
import MonitorPage from './app/monitor/page';
import StrategiesPage from './app/strategies/page';
import VaultsPage from './app/vaults/page';
import SettingsPage from './app/settings/page';
import DocsPage from './app/docs/page';
import LendingPage from './app/lending/page';
import PortfolioPage from './app/portfolio/page';
import AiPackagesPage from './app/ai_packages/page';
import { useUiStore } from './store/ui.store';
import { wagmiConfig } from './lib/web3';
import AuthModal from './components/modals/AuthModal';
import OnboardingFlow from './components/modals/OnboardingFlow';
import { useSessionStore } from './store/session.store';
import { Toaster } from './components/ui/toaster';

import './App.css';

function AppContent() {
  const view = useUiStore((s) => s.currentView);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const onboardingCompleted = useSessionStore((s) => s.onboardingCompleted);
  const rawPathname = window.location.pathname;
  const pathname = rawPathname.replace(/\/+$/, '') || '/';

  if (pathname === '/docs') {
    return <DocsPage />;
  }

  if (pathname === '/app' || pathname === '/') {
    return <AppLandingPage />;
  }

  if (pathname === '/lending') {
    return <LendingPage />;
  }

  return (
    <RootLayout>
      {!isAuthenticated && <AuthModal />}
      {isAuthenticated && !onboardingCompleted && <OnboardingFlow />}

      {isAuthenticated && onboardingCompleted && (
        <Brick3AppLayout>
          {view === 'canvas' && <CanvasPage />}
          {view === 'monitor' && <MonitorPage />}
          {view === 'strategies' && <StrategiesPage />}
          {view === 'vaults' && <VaultsPage />}
          {view === 'portfolio' && <PortfolioPage />}
          {view === 'settings' && <SettingsPage />}
          {view === 'docs' && <DocsPage />}
          {view === 'ai_packages' && <AiPackagesPage />}
        </Brick3AppLayout>
      )}
    </RootLayout>
  );
}

function App() {
  return (
    <WagmiConfig config={wagmiConfig}>
      <AppContent />
      <Toaster />
    </WagmiConfig>
  );
}

export default App;