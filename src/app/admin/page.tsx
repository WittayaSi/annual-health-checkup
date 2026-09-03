import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  getActiveUserAction,
  getCampaignAction,
  getCampaignsAction,
  getPackagesAction,
  getSlotsAction,
  getBookingsAction,
  getAuditLogsAction,
  getAllUsersAction,
  getOrganizationsAction,
  getAllMasterItemsAction,
  getMaintenanceModeAction,
} from '@/app/actions';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { ShieldAlert, ArrowLeft, CalendarCheck2 } from 'lucide-react';

export default async function AdminPage() {
  const activeUser = await getActiveUserAction();

  // AUTH GUARD: Redirect to landing page (/) if not logged in
  if (!activeUser) {
    redirect('/');
  }

  // ROLE GUARD: Check if active user has ADMIN or SUPER_STAFF role
  const hasAdminAccess = activeUser.role === 'ADMIN' || activeUser.role === 'SUPER_STAFF';

  if (!hasAdminAccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ไม่มีสิทธิ์เข้าถึงหน้านี้
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              หน้าต่างนี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น บัญชีของคุณ (<span className="font-semibold text-slate-900 dark:text-white">{activeUser.firstName} {activeUser.lastName}</span>) มีสิทธิ์เป็น <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{activeUser.role}</span>
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/booking"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>ไปยังหน้าจองคิวตรวจสุขภาพ</span>
            </Link>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่หน้าหลัก</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch admin data only after verifying ADMIN authorization
  const campaign = await getCampaignAction();
  const campaigns = await getCampaignsAction();
  const organizations = await getOrganizationsAction();
  const packages = await getPackagesAction();
  const slots = await getSlotsAction();
  const bookings = await getBookingsAction();
  const auditLogs = await getAuditLogsAction();
  const users = await getAllUsersAction();
  const masterItems = await getAllMasterItemsAction();

  return (
    <div className="animate-in fade-in duration-300">
      <AdminDashboard
        activeUser={activeUser}
        campaign={campaign}
        campaigns={campaigns}
        organizations={organizations}
        packages={packages}
        slots={slots}
        bookings={bookings}
        auditLogs={auditLogs}
        users={users}
        masterItems={masterItems}
      />
    </div>
  );
}
