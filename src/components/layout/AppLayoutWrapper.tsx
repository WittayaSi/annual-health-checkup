'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { User, Campaign } from '@/lib/types';
import { useLineLiff } from '@/lib/useLineLiff';

import { MaintenanceNotice } from '@/components/maintenance/MaintenanceNotice';

interface AppLayoutWrapperProps {
  children: React.ReactNode;
  activeUser: User | null;
  allUsers: User[];
  campaign?: Campaign;
}

export function AppLayoutWrapper({
  children,
  activeUser,
  allUsers,
  campaign,
}: AppLayoutWrapperProps) {
  const pathname = usePathname();
  const isMaintenancePage = pathname === '/maintenance';
  const isLandingPage = pathname === '/';

  if (isMaintenancePage) {
    return <>{children}</>;
  }

  const isMaintenanceEnv = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || process.env.MAINTENANCE_MODE === 'true';

  if (isMaintenanceEnv && pathname !== '/admin') {
    return <MaintenanceNotice activeUser={activeUser} allUsers={allUsers} />;
  }

  // LINE LIFF integration paused for current phase
  // useLineLiff();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {!isLandingPage && (
        <Navbar activeUser={activeUser} allUsers={allUsers} campaign={campaign} />
      )}

      <main className={isLandingPage ? 'w-full flex-1' : 'flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8'}>
        {children}
      </main>

      <footer className="mt-auto w-full border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>© 2026 ระบบจองวันตรวจสุขภาพประจำปี ศูนย์ตรวจสุขภาพ</p>
      </footer>
    </div>
  );
}
