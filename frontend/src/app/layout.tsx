import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <div className="h-screen bg-bg-void text-on-surface overflow-hidden">{children}</div>;
}
