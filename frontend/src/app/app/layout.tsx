import React from 'react';
import Sidebar from '../../components/ui/Sidebar';
import Topbar from '../../components/ui/Topbar';
import { useUiStore } from '../../store/ui.store';

export default function Brick3AppLayout({ children }: { children: React.ReactNode }) {
  const { currentView, setView } = useUiStore();

  return (
    <div className="h-screen bg-bg-void text-on-surface overflow-hidden">
      <Sidebar current={currentView} onChange={setView} />
      <Topbar />
      <main className="ml-[280px] mt-[64px] h-[calc(100vh-64px)] overflow-hidden">
        {children}
      </main>
    </div>
  );
}
