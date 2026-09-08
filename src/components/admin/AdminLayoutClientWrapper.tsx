'use client';

import { useState, useMemo, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User,
  Campaign,
  Organization,
  CheckupPackage,
  MasterItem,
  DailySlot,
  BookingWithDetails,
  AuditLog,
} from '@/lib/types';
import { AdminSidebar } from './AdminSidebar';
import { processBookingRemindersAction, toggleMaintenanceModeAction } from '@/app/actions';
import {
  BellRing,
  Wrench,
  Loader2,
  Building2,
  FlaskConical,
  Settings,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { AdminOrganizationManagementDialog } from './AdminOrganizationManagementDialog';
import { AdminEntitlementsDialog } from './AdminEntitlementsDialog';
import { AdminCampaignConfigDialog } from './AdminCampaignConfigDialog';
import { AdminPackageConfigDialog } from './AdminPackageConfigDialog';
import { AdminItemCatalogDialog } from './AdminItemCatalogDialog';
import { AdminDepartmentRulesDialog } from './AdminDepartmentRulesDialog';
import { UserRoleManagementDialog } from './UserRoleManagementDialog';
import { CentralDbSyncDialog } from './CentralDbSyncDialog';

interface AdminContextType {
  activeUser?: User | null;
  campaign: Campaign;
  campaigns: Campaign[];
  organizations: Organization[];
  packages: CheckupPackage[];
  masterItems: MasterItem[];
  slots: DailySlot[];
  bookings: BookingWithDetails[];
  auditLogs: AuditLog[];
  users: User[];
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  onRefresh: () => void;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdminContext() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminContext must be used within AdminLayoutClientWrapper');
  return ctx;
}

interface AdminLayoutClientWrapperProps {
  activeUser?: User | null;
  campaign: Campaign;
  campaigns?: Campaign[];
  organizations?: Organization[];
  packages?: CheckupPackage[];
  masterItems?: MasterItem[];
  slots: DailySlot[];
  bookings: BookingWithDetails[];
  auditLogs?: AuditLog[];
  users?: User[];
  children: React.ReactNode;
}

export function AdminLayoutClientWrapper({
  activeUser,
  campaign,
  campaigns = [],
  organizations = [],
  packages = [],
  masterItems = [],
  slots,
  bookings,
  auditLogs = [],
  users = [],
  children,
}: AdminLayoutClientWrapperProps) {
  const router = useRouter();
  const pathname = usePathname();
  const handleRefresh = () => router.refresh();

  const isFullAdmin = activeUser?.role === 'ADMIN';
  const isSuperStaff = activeUser?.role === 'SUPER_STAFF';

  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isDeptRulesOpen, setIsDeptRulesOpen] = useState(false);

  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderResultMsg, setReminderResultMsg] = useState<string | null>(null);

  const allCampaigns = campaigns.length > 0 ? campaigns : [campaign];
  const orgList = organizations.length > 0 ? organizations : [];

  // Active selected campaign
  const activeCampaign = useMemo(() => {
    if (selectedCampaignId === 'ALL') return campaign;
    return campaigns.find((c) => c.id === selectedCampaignId) || campaign;
  }, [selectedCampaignId, campaigns, campaign]);

  // Filter staff users (excluding system admin accounts)
  const activeStaffUsers = useMemo(() => {
    return users.filter((u) => u.isActive !== false && u.username !== 'sys_admin');
  }, [users]);

  // Valid bookings for selected campaign
  const confirmedBookings = useMemo(() => {
    return selectedCampaignId === 'ALL'
      ? bookings.filter((b) => b.status === 'CONFIRMED')
      : bookings.filter(
          (b) => b.status === 'CONFIRMED' && (b.campaignId === selectedCampaignId || !b.campaignId)
        );
  }, [bookings, selectedCampaignId]);

  const bookedUserIds = useMemo(() => new Set(confirmedBookings.map((b) => b.userId)), [confirmedBookings]);
  const unbookedStaffCount = Math.max(0, activeStaffUsers.length - bookedUserIds.size);

  const handleRun1DayReminders = async () => {
    setIsSendingReminders(true);
    setReminderResultMsg(null);
    try {
      const res = await processBookingRemindersAction(true);
      if (res.success) {
        setReminderResultMsg(
          `ส่งเตือน Telegram สำเร็จ: ${res.sentSuccessCount} ราย (จากทั้งหมดที่ต้องส่ง ${res.processedCount} ราย)`
        );
        router.refresh();
      } else {
        setReminderResultMsg(`เกิดข้อผิดพลาด: ${res.error}`);
      }
    } catch {
      setReminderResultMsg('ไม่สามารถเชื่อมต่อระบบแจ้งเตือนได้');
    } finally {
      setIsSendingReminders(false);
    }
  };

  const contextValue: AdminContextType = {
    activeUser,
    campaign: activeCampaign,
    campaigns: allCampaigns,
    organizations: orgList,
    packages,
    masterItems,
    slots,
    bookings,
    auditLogs,
    users,
    selectedCampaignId,
    setSelectedCampaignId,
    onRefresh: handleRefresh,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 flex font-sans">
        {/* LEFT SIDEBAR NAVIGATION */}
        <AdminSidebar activeUser={activeUser} unbookedCount={unbookedStaffCount} />

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all duration-300">
          {/* TOP HEADER BAR */}
          <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {activeCampaign.name}
                </span>
              </div>
            </div>

            {/* TOP HEADER ACTIONS & DIALOG TRIGGERS */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Campaign Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
                <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">รวมทุกโครงการ ({allCampaigns.length})</option>
                  {allCampaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.year})
                    </option>
                  ))}
                </select>
              </div>

              {/* 1-Day Reminder Button */}
              <button
                onClick={handleRun1DayReminders}
                disabled={isSendingReminders}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors disabled:opacity-50 cursor-pointer"
                title="ส่งข้อความเตือน 1 วันล่วงหน้าผ่าน Telegram หาผู้จองคิวพรุ่งนี้"
              >
                {isSendingReminders ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                ) : (
                  <BellRing className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>เตือนล่วงหน้า 1 วัน</span>
              </button>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </header>

          {/* PAGE CONTENT CONTAINER */}
          <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6 pt-16 lg:pt-6">
            {reminderResultMsg && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs font-medium flex items-center justify-between">
                <span>{reminderResultMsg}</span>
                <button onClick={() => setReminderResultMsg(null)} className="text-emerald-700 font-bold">
                  ปิด
                </button>
              </div>
            )}
            {children}
          </main>
        </div>
      </div>

      {/* MASTER CATALOG & DEPARTMENT RULES DIALOGS */}
      {isCatalogOpen && (
        <AdminItemCatalogDialog
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          onSuccess={handleRefresh}
        />
      )}
      {isDeptRulesOpen && (
        <AdminDepartmentRulesDialog
          isOpen={isDeptRulesOpen}
          onClose={() => setIsDeptRulesOpen(false)}
          masterItems={masterItems}
          onSuccess={handleRefresh}
        />
      )}
    </AdminContext.Provider>
  );
}
