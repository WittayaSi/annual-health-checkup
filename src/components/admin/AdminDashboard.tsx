'use client';

import { useState, useMemo, useEffect } from 'react';
import { startViewTransition } from '@/lib/viewTransition';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserX,
  CalendarCheck2,
  CheckCircle,
  Percent,
  Search,
  FileSpreadsheet,
  History,
  ShieldCheck,
  Settings,
  Package,
  FlaskConical,
  Building2,
  FolderOpen,
  Stethoscope,
  BellRing,
  Loader2,
  Wrench,
} from 'lucide-react';
import { processBookingRemindersAction, toggleMaintenanceModeAction } from '@/app/actions';
import { Campaign, DailySlot, BookingWithDetails, AuditLog, User, CheckupPackage, Organization, MasterItem } from '@/lib/types';
import { EditDailySlotDialog } from './EditDailySlotDialog';
import { AdminCampaignConfigDialog } from './AdminCampaignConfigDialog';
import { AdminPackageConfigDialog } from './AdminPackageConfigDialog';
import { AdminItemCatalogDialog } from './AdminItemCatalogDialog';
import { AdminBatchConfigDialog } from './AdminBatchConfigDialog';
import { CentralDbSyncDialog } from './CentralDbSyncDialog';
import { UserRoleManagementDialog } from './UserRoleManagementDialog';
import { SlotBookingsDialog } from './SlotBookingsDialog';
import { AdminOrganizationManagementDialog } from './AdminOrganizationManagementDialog';
import { AdminEntitlementsDialog } from './AdminEntitlementsDialog';
import { AdminExportModal } from './AdminExportModal';
import { DailyAttendeesView } from './DailyAttendeesView';
import { UnbookedStaffView } from './UnbookedStaffView';

interface AdminDashboardProps {
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
}

export function AdminDashboard({
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
}: AdminDashboardProps) {
  const router = useRouter();
  const handleRefresh = () => router.refresh();

  const isFullAdmin = activeUser?.role === 'ADMIN';
  const isSuperStaff = activeUser?.role === 'SUPER_STAFF';

  const [activeTab, setActiveTab] = useState<'SLOTS' | 'ATTENDEES' | 'UNBOOKED' | 'AUDIT'>('SLOTS');

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedSlotForBookings, setSelectedSlotForBookings] = useState<DailySlot | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'full' | 'available' | 'holiday'>('all');

  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [reminderResultMsg, setReminderResultMsg] = useState<string | null>(null);

  const handleRun1DayReminders = async () => {
    setIsSendingReminders(true);
    setReminderResultMsg(null);
    try {
      const res = await processBookingRemindersAction(true);
      if (res.success) {
        setReminderResultMsg(
          `ส่งเตือน Telegram สำเร็จ: ${res.sentSuccessCount} ราย (จากทั้งหมดที่ต้องส่ง ${res.processedCount} ราย, ล้มเหลว/ไม่มี Telegram ${res.failedCount} ราย)`
        );
        router.refresh();
      } else {
        setReminderResultMsg(`เกิดข้อผิดพลาด: ${res.error}`);
      }
    } catch (e) {
      setReminderResultMsg('ไม่สามารถเชื่อมต่อระบบแจ้งเตือนได้');
    } finally {
      setIsSendingReminders(false);
    }
  };

  // Audit log filter & pagination states
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [auditDisplayLimit, setAuditDisplayLimit] = useState<number>(50);

  // Filter slots for active selected campaign
  const activeCampaign = useMemo(() => {
    if (selectedCampaignId === 'ALL') return campaign;
    return campaigns.find((c) => c.id === selectedCampaignId) || campaign;
  }, [selectedCampaignId, campaigns, campaign]);

  const allCampaigns = campaigns.length > 0 ? campaigns : [campaign];
  const orgList = organizations.length > 0 ? organizations : [];

  const campaignSlots = useMemo(() => {
    if (selectedCampaignId === 'ALL') return slots;
    return slots.filter((s) => s.campaignId === selectedCampaignId);
  }, [slots, selectedCampaignId]);

  // Dashboard Stats Calculations
  const activeSlots = campaignSlots.filter((s) => !s.isHoliday);
  const totalQuota = activeSlots.reduce((acc, s) => acc + s.quota, 0);
  const totalBooked = activeSlots.reduce((acc, s) => acc + s.bookedCount, 0);
  const remainingQuota = Math.max(0, totalQuota - totalBooked);
  const occupancyRate = totalQuota > 0 ? ((totalBooked / totalQuota) * 100).toFixed(1) : '0';

  const confirmedBookings = selectedCampaignId === 'ALL'
    ? bookings.filter((b) => b.status === 'CONFIRMED')
    : bookings.filter(
      (b) => b.status === 'CONFIRMED' && (b.campaignId === selectedCampaignId || !b.campaignId)
    );
  const pkgACount = confirmedBookings.filter((b) => b.packageId === 'pkg-a' || b.package?.code === 'PKG-A').length;
  const pkgBCount = confirmedBookings.filter((b) => b.packageId === 'pkg-b' || b.package?.code === 'PKG-B').length;

  const activeStaffCount = users.filter((u) => u.isActive !== false).length;
  const bookedUserIds = new Set(confirmedBookings.map((b) => b.userId));
  const bookedStaffCount = bookedUserIds.size;
  const unbookedStaffCount = Math.max(0, activeStaffCount - bookedStaffCount);
  const bookingRate = activeStaffCount > 0 ? ((bookedStaffCount / activeStaffCount) * 100).toFixed(1) : '0';

  const filteredSlots = useMemo(() => {
    return campaignSlots.filter((slot) => {
      if (searchTerm) {
        const dateMatch = slot.date.includes(searchTerm);
        const noteMatch = slot.holidayNote?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!dateMatch && !noteMatch) return false;
      }

      if (statusFilter === 'holiday') return slot.isHoliday;
      if (statusFilter === 'full') return !slot.isHoliday && slot.bookedCount >= slot.quota;
      if (statusFilter === 'available') return !slot.isHoliday && slot.bookedCount < slot.quota;

      return true;
    });
  }, [campaignSlots, searchTerm, statusFilter]);

  const sortedSlots = [...filteredSlots].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* GLOBAL MAIN MANAGEMENT HEADER (เมนูหลักส่วนกลาง) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                แดชบอร์ดผู้ดูแลระบบ (Admin Control Center)
              </h1>
              {isFullAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  🔴 Admin (Full Access)
                </span>
              ) : isSuperStaff ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  🟣 Super Staff (ผู้จัดการคิว)
                </span>
              ) : null}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ระบบจัดการส่วนกลาง: บริหารสังกัดองค์กร, ตั้งค่าโครงการเปิดจอง, จัดการโปรแกรมตรวจ และติดตามสิทธิ์เจ้าหน้าที่
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Access Setting Dialogs */}
            <AdminOrganizationManagementDialog organizations={orgList} users={users} />
            <AdminEntitlementsDialog organizations={orgList} packages={packages} />
            <AdminCampaignConfigDialog campaign={activeCampaign} campaigns={allCampaigns} organizations={orgList} slots={slots} bookings={bookings} />
            <AdminPackageConfigDialog packages={packages} />
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs cursor-pointer"
            >
              <FlaskConical className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              <span>Catalog รายการตรวจ</span>
            </button>

            {/* ONLY FULL ADMIN CAN ACCESS ROLE MANAGEMENT & SYSTEM DATA SYNC */}
            {isFullAdmin && (
              <>
                <UserRoleManagementDialog users={users} />
                <CentralDbSyncDialog users={users} />
              </>
            )}
          </div>

        </div>

        {/* CAMPAIGN DYNAMIC SELECTOR BAR (เลือกโครงการแล้วข้อมูลภายในและ CSV เปลี่ยนตาม) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                เลือกโครงการเพื่อดูข้อมูลและส่งออกคิวจอง:
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedCampaignId === 'ALL'
                  ? `กำลังแสดงข้อมูลรวมทุกโครงการ (${allCampaigns.length} โครงการ)`
                  : `กำลังแสดงข้อมูลของ: ${activeCampaign.name} (สังกัด: ${activeCampaign.organization || 'ทั้งหมด'})`}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full sm:w-auto bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
            >
              <option value="ALL">📁 แสดงทุกโครงการ (ALL - {allCampaigns.length} โครงการ)</option>
              {allCampaigns.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  📋 {c.name} (สังกัด: {c.organization || 'ทั้งหมด'})
                </option>
              ))}
            </select>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
              title={`ส่งออกข้อมูลการจองคิว (${selectedCampaignId === 'ALL' ? 'ทุกโครงการ' : activeCampaign.name})`}
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>ส่งออกคิวจอง (Excel/CSV)</span>
            </button>

            <button
              onClick={handleRun1DayReminders}
              disabled={isSendingReminders}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
              title="รันระบบพยายามส่ง Telegram / LINE แจ้งเตือนล่วงหน้า 1 วัน สำหรับคิวพรุ่งนี้"
            >
              {isSendingReminders ? (
                <Loader2 className="h-4 w-4 text-sky-200 animate-spin" />
              ) : (
                <BellRing className="h-4 w-4 text-sky-200" />
              )}
              <span>{isSendingReminders ? 'กำลังส่งเตือน...' : '✈️ ส่ง Telegram เตือนคิวล่วงหน้า 1 วัน'}</span>
            </button>
          </div>
        </div>

        {reminderResultMsg && (
          <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-between">
            <span>{reminderResultMsg}</span>
            <button
              onClick={() => setReminderResultMsg(null)}
              className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 text-xs underline cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}
      </div>

      {/* TABS (Scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-slate-200 dark:border-slate-800 pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => startViewTransition(() => setActiveTab('SLOTS'))}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 cursor-pointer ${activeTab === 'SLOTS'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <CalendarCheck2 className="h-4 w-4" />
          <span>สล็อตโควต้า & ปฏิทินจองคิว</span>
        </button>

        <button
          onClick={() => startViewTransition(() => setActiveTab('ATTENDEES'))}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 cursor-pointer ${activeTab === 'ATTENDEES'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <Users className="h-4 w-4" />
          <span>📋 รายชื่อผู้ตรวจประจำวัน (Daily Attendees)</span>
        </button>

        <button
          onClick={() => startViewTransition(() => setActiveTab('UNBOOKED'))}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 cursor-pointer ${activeTab === 'UNBOOKED'
              ? 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
        >
          <UserX className="h-4 w-4 text-amber-500" />
          <span>⚠️ ติดตามผู้ยังไม่ได้จองคิว</span>
        </button>

        {isFullAdmin && (
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 cursor-pointer ${activeTab === 'AUDIT'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
          >
            <History className="h-4 w-4" />
            <span>ประวัติการทำรายการ (Audit Logs)</span>
          </button>
        )}
      </div>


      {/* TAB 1: SLOTS & DYNAMIC CAMPAIGN METRICS */}
      {activeTab === 'SLOTS' && (
        <div className="space-y-6">
          {/* Dynamic Metric Cards per Selected Campaign */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Quota */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">โควต้ารวมในโครงการ</span>
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {totalQuota} คน
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                โควต้าเฉลี่ย {activeCampaign.defaultQuota} คน/วัน
              </p>
            </div>

            {/* Total Booked */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">จำนวนจองแล้ว</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {totalBooked} คน
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                เหลือที่ว่าง {remainingQuota} ที่นั่ง
              </p>
            </div>

            {/* Package Breakdown */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">สัดส่วนโปรแกรมตรวจ</span>
                <Stethoscope className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex items-center justify-between text-xs mt-2 pt-0.5">
                <span className="text-slate-600 dark:text-slate-300 font-medium">PKG-A (&lt;35ปี): {pkgACount} คน</span>
                <span className="text-slate-600 dark:text-slate-300 font-medium">PKG-B (≥35ปี): {pkgBCount} คน</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full"
                  style={{ width: `${confirmedBookings.length > 0 ? (pkgACount / confirmedBookings.length) * 100 : 0}%` }}
                />
                <div
                  className="bg-emerald-500 h-full"
                  style={{ width: `${confirmedBookings.length > 0 ? (pkgBCount / confirmedBookings.length) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">อัตราการจองเต็ม</span>
                <Percent className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                {occupancyRate}%
              </p>

              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${occupancyRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Slots Table Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            {/* Header & Actions */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="space-y-0.5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  ตารางสล็อตคิวตรวจสุขภาพ ({filteredSlots.length} วัน)
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedCampaignId === 'ALL'
                    ? 'แสดงผลรวมทุกสล็อตในระบบ'
                    : `เฉพาะโครงการ: ${activeCampaign.name} (สังกัด: ${activeCampaign.organization || 'ทั้งหมด'})`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <AdminBatchConfigDialog campaign={activeCampaign} />

                {/* Search */}
                <div className="relative min-w-[160px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาวันที่..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Filter Buttons */}
                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700">
                  {(['all', 'available', 'full', 'holiday'] as const).map((f) => {
                    const labels = { all: 'ทั้งหมด', available: 'ว่าง', full: 'เต็ม', holiday: 'หยุด' };
                    return (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === f
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                      >
                        {labels[f]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Slots Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-3 px-4 font-medium">วันที่</th>
                    <th className="py-3 px-4 font-medium">สังกัดโครงการ</th>
                    <th className="py-3 px-4 font-medium">สถานะ</th>
                    <th className="py-3 px-4 font-medium text-center">โควต้า</th>
                    <th className="py-3 px-4 font-medium text-center">จองแล้ว</th>
                    <th className="py-3 px-4 font-medium text-center">เหลือ</th>
                    <th className="py-3 px-4 font-medium">ความหนาแน่น</th>
                    <th className="py-3 px-4 font-medium text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm text-slate-700 dark:text-slate-300">
                  {filteredSlots.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        ไม่พบสล็อตคิวจองตามเงื่อนไขที่เลือก
                      </td>
                    </tr>
                  ) : (
                    filteredSlots.map((slot) => {
                      const remaining = Math.max(0, slot.quota - slot.bookedCount);
                      const isFull = slot.bookedCount >= slot.quota && !slot.isHoliday;
                      const percent = slot.quota > 0 ? Math.min(100, (slot.bookedCount / slot.quota) * 100) : 0;
                      const slotCampaign = allCampaigns.find((c) => c.id === slot.campaignId);

                      return (
                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-white tabular-nums">
                            {slot.date}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              🏢 {slotCampaign?.organization || slotCampaign?.targetDepartment || 'ทั้งหมด'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {slot.isHoliday ? (
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-500">
                                {slot.holidayNote || 'วันหยุด'}
                              </span>
                            ) : isFull ? (
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400">
                                เต็ม
                              </span>
                            ) : remaining <= 5 ? (
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                                เหลือน้อย ({remaining})
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400">
                                เปิดรับจอง
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums">{slot.quota}</td>
                          <td className="py-3 px-4 text-center tabular-nums font-medium">
                            {slot.bookedCount > 0 ? (
                              <button
                                onClick={() => setSelectedSlotForBookings(slot)}
                                className="text-emerald-600 dark:text-emerald-400 hover:underline transition-all cursor-pointer font-semibold"
                                title="คลิกเพื่อดูรายชื่อผู้จองประจำวันนี้"
                              >
                                {slot.bookedCount} คน
                              </button>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums">
                            {slot.isHoliday ? '-' : remaining}
                          </td>
                          <td className="py-3 px-4 min-w-[120px]">
                            {slot.isHoliday ? (
                              <span className="text-xs text-slate-400">-</span>
                            ) : (
                              <div className="space-y-1">
                                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : remaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400 tabular-nums">{percent.toFixed(0)}%</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {slot.bookedCount > 0 && (
                                <button
                                  onClick={() => setSelectedSlotForBookings(slot)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
                                  title="ดูรายชื่อผู้จองประจำวันนี้"
                                >
                                  <Users className="h-3.5 w-3.5 text-slate-400" />
                                  <span>รายชื่อ ({slot.bookedCount})</span>
                                </button>
                              )}
                              <EditDailySlotDialog slot={slot} />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY ATTENDEES MANIFEST */}
      {activeTab === 'ATTENDEES' && (
        <DailyAttendeesView
          slots={campaignSlots}
          bookings={bookings}
          packages={packages}
          masterItems={masterItems}
          onRefresh={handleRefresh}
        />
      )}

      {/* TAB 3: UNBOOKED STAFF TRACKER */}
      {activeTab === 'UNBOOKED' && (
        <UnbookedStaffView
          users={users}
          bookings={bookings}
          selectedCampaignId={selectedCampaignId}
          campaigns={allCampaigns}
          organizations={orgList}
          dailySlots={campaignSlots}
          packages={packages}
          masterItems={masterItems}
          onRefresh={handleRefresh}
        />
      )}

      {/* TAB 4: AUDIT LOGS (ADMIN ONLY) */}
      {activeTab === 'AUDIT' && isFullAdmin && (() => {
        const filteredAuditLogs = auditLogs.filter((log) => {
          if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
          if (auditSearchTerm.trim()) {
            const q = auditSearchTerm.trim().toLowerCase();
            const matchDetails = log.details?.toLowerCase().includes(q);
            const matchActor = log.actorName?.toLowerCase().includes(q);
            const matchAction = log.action?.toLowerCase().includes(q);
            if (!matchDetails && !matchActor && !matchAction) return false;
          }
          return true;
        });

        const displayedAuditLogs = filteredAuditLogs.slice(0, auditDisplayLimit);

        return (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <History className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    ประวัติการทำรายการในระบบ (Audit Logs)
                  </h3>
                  <p className="text-xs text-slate-500">
                    บันทึกกิจกรรมและการแก้ไขข้อมูลสำคัญในระบบ ({filteredAuditLogs.length} รายการ)
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearchTerm}
                    onChange={(e) => setAuditSearchTerm(e.target.value)}
                    placeholder="ค้นหาใน Audit Log..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                  />
                </div>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="ALL">ประเภทการทำงานทั้งหมด</option>
                  <option value="CREATE_BOOKING">จองคิว (CREATE_BOOKING)</option>
                  <option value="CANCEL_BOOKING">ยกเลิกคิว (CANCEL_BOOKING)</option>
                  <option value="CREATE_CAMPAIGN">สร้างโครงการ (CREATE_CAMPAIGN)</option>
                  <option value="UPDATE_CAMPAIGN">แก้ไขโครงการ (UPDATE_CAMPAIGN)</option>
                  <option value="DELETE_CAMPAIGN">ลบโครงการ (DELETE_CAMPAIGN)</option>
                  <option value="CREATE_ORGANIZATION">เพิ่มสังกัดองค์กร (CREATE_ORGANIZATION)</option>
                  <option value="UPDATE_ORGANIZATION">แก้ไขสังกัดองค์กร (UPDATE_ORGANIZATION)</option>
                  <option value="DELETE_ORGANIZATION">ลบสังกัดองค์กร (DELETE_ORGANIZATION)</option>
                  <option value="CREATE_PACKAGE">เพิ่มโปรแกรมตรวจ (CREATE_PACKAGE)</option>
                  <option value="UPDATE_PACKAGE">แก้ไขโปรแกรมตรวจ (UPDATE_PACKAGE)</option>
                  <option value="DELETE_PACKAGE">ลบโปรแกรมตรวจ (DELETE_PACKAGE)</option>
                  <option value="HIS_SYNC">HIS Sync</option>
                  <option value="IMPORT_USERS">นำเข้าผู้ใช้ (IMPORT_USERS)</option>
                  <option value="LINE_BIND">ผูก LINE OA (LINE_BIND)</option>
                  <option value="LINE_UNBIND">ยกเลิกผูก LINE OA (LINE_UNBIND)</option>
                  <option value="UPDATE_SLOT">ปรับ slot (UPDATE_SLOT)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {displayedAuditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">ไม่พบประวัติการทำรายการที่ตรงตามเงื่อนไข</div>
              ) : (
                displayedAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 text-xs flex items-start justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono font-medium">
                          {log.action}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          โดย {log.actorName || 'System'}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{log.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 tabular-nums shrink-0 pt-0.5">
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </span>
                  </div>
                ))
              )}
            </div>

            {filteredAuditLogs.length > auditDisplayLimit && (
              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setAuditDisplayLimit((prev) => prev + 50)}
                  className="px-4 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  แสดงเพิ่มเติม (+50 รายการ)
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Export Choice Modal */}
      <AdminExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        campaignId={selectedCampaignId}
        bookingsData={bookings}
        title={selectedCampaignId === 'ALL' ? 'ส่งออกข้อมูลคิวจอง (ทุกโครงการ)' : `ส่งออกข้อมูลคิวจอง: ${activeCampaign.name}`}
      />

      {/* Catalog Dialog */}
      <AdminItemCatalogDialog isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} />

      {/* Slot Bookings Modal */}
      {selectedSlotForBookings && (
        <SlotBookingsDialog
          slot={selectedSlotForBookings}
          bookings={bookings}
          dailySlots={campaignSlots}
          packages={packages}
          masterItems={masterItems}
          onClose={() => setSelectedSlotForBookings(null)}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
