'use client';

import { useState } from 'react';

import { ProtectedRoute } from '@/lib/auth/guard';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileNav } from '@/components/layout/mobile-nav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((prev) => !prev)}
        />
        <div className="flex flex-1 flex-col">
          <Topbar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
        </div>
        <MobileNav
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
        />
      </div>
    </ProtectedRoute>
  );
}
