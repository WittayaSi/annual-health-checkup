'use client';

import { useState, useMemo } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import * as XLSX from 'xlsx';
import {
  UserCheck,
  UserX,
  Search,
  Building2,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  AlertCircle,
  Send,
  CheckCircle2,
  Users,
  Filter,
} from 'lucide-react';
import { User, BookingWithDetails, Campaign, Organization, DailySlot, CheckupPackage, MasterItem } from '@/lib/types';
import { sendTelegramUnbookedReminderAction } from '@/app/actions';
import { AdminBookModal } from './AdminBookModal';
import { CalendarPlus } from 'lucide-react';

interface UnbookedStaffViewProps {
  users: User[];
  bookings: BookingWithDetails[];
  selectedCampaignId: string;
  campaigns: Campaign[];
  organizations: Organization[];
  dailySlots?: DailySlot[];
  packages?: CheckupPackage[];
  masterItems?: MasterItem[];
  onRefresh?: () => void;
}

export function UnbookedStaffView({
  users,
  bookings,
  selectedCampaignId,
  campaigns,
  organizations,
  dailySlots = [],
  packages = [],
  masterItems = [],
  onRefresh,
}: UnbookedStaffViewProps) {
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sendingTelegramUserId, setSendingTelegramUserId] = useState<string | null>(null);
  const [telegramNoticeMsg, setTelegramNoticeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');

  useModalLock(isExportModalOpen);

  // Admin book modal state
  const [targetUserForBooking, setTargetUserForBooking] = useState<User | null>(null);

  // Active users list
  const activeUsers = useMemo(() => {
    return users.filter((u) => u.isActive !== false);
  }, [users]);

  // Booked user IDs for the selected campaign
  const bookedUserIds = useMemo(() => {
    const validBookings = selectedCampaignId === 'ALL'
      ? bookings.filter((b) => b.status === 'CONFIRMED')
      : bookings.filter((b) => b.status === 'CONFIRMED' && (b.campaignId === selectedCampaignId || !b.campaignId));
    return new Set(validBookings.map((b) => b.userId));
  }, [bookings, selectedCampaignId]);

  // Filter unbooked users
  const unbookedUsers = useMemo(() => {
    return activeUsers.filter((u) => !bookedUserIds.has(u.id));
  }, [activeUsers, bookedUserIds]);

  const bookedUsersCount = activeUsers.length - unbookedUsers.length;
  const bookingPercentage = activeUsers.length > 0
    ? ((bookedUsersCount / activeUsers.length) * 100).toFixed(1)
    : '0';

  // Extract unique departments for filter dropdown
  const availableDepartments = useMemo(() => {
    const setDepts = new Set<string>();
    unbookedUsers.forEach((u) => {
      if (u.department) setDepts.add(u.department);
    });
    return Array.from(setDepts).sort();
  }, [unbookedUsers]);

  // Filtered unbooked staff list based on filters
  const filteredUnbookedList = useMemo(() => {
    return unbookedUsers.filter((u) => {
      // Organization filter
      if (selectedOrgFilter !== 'ALL') {
        const uOrg = u.organization || u.department || '';
        if (!uOrg.toLowerCase().includes(selectedOrgFilter.toLowerCase())) {
          return false;
        }
      }

      // Department filter
      if (selectedDeptFilter !== 'ALL') {
        if ((u.department || '') !== selectedDeptFilter) {
          return false;
        }
      }

      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const fullName = `${u.firstName} ${u.lastName}`.toLowerCase();
        const code = (u.employeeCode || '').toLowerCase();
        const pos = (u.position || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        if (
          !fullName.includes(term) &&
          !code.includes(term) &&
          !pos.includes(term) &&
          !phone.includes(term)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [unbookedUsers, selectedOrgFilter, selectedDeptFilter, searchTerm]);

  // Export Unbooked Staff (Excel/CSV)
  const handleExecuteExportUnbooked = (format: 'xlsx' | 'csv') => {
    const dataRows = filteredUnbookedList.map((u, idx) => ({
      'ลำดับ': idx + 1,
      'ชื่อ-นามสกุล': `${u.firstName} ${u.lastName}`.trim(),
      'เพศ': u.gender === 'FEMALE' ? 'หญิง' : 'ชาย',
      'สังกัด/องค์กร': u.organization || '-',
      'แผนก/หน่วยงาน': u.department || '-',
      'ตำแหน่ง': u.position || '-',
      'เบอร์โทรศัพท์': u.phone || '-',
      'สถานะผูก Telegram': (u.telegramChatId || u.telegramToken) ? 'ผูกแล้ว' : 'ยังไม่ผูก',
    }));

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `รายชื่อผู้ยังไม่ได้จองคิวตรวจสุขภาพ_${dateStr}`;

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(dataRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'ยังไม่ได้จองคิว');
      XLSX.writeFile(workbook, `${filename}.xlsx`);
    } else {
      const headers = ['ลำดับ', 'ชื่อ-นามสกุล', 'เพศ', 'สังกัด/องค์กร', 'แผนก/หน่วยงาน', 'ตำแหน่ง', 'เบอร์โทรศัพท์', 'สถานะผูก Telegram'];
      const csvRows = dataRows.map((r) => [
        r['ลำดับ'],
        `"${r['ชื่อ-นามสกุล']}"`,
        `"${r['เพศ']}"`,
        `"${r['สังกัด/องค์กร']}"`,
        `"${r['แผนก/หน่วยงาน']}"`,
        `"${r['ตำแหน่ง']}"`,
        `"${r['เบอร์โทรศัพท์']}"`,
        `"${r['สถานะผูก Telegram']}"`,
      ]);
      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setIsExportModalOpen(false);
  };

  // Handle Send Telegram Reminder Action
  const handleSendTelegramReminder = async (userId: string, userName: string) => {
    setSendingTelegramUserId(userId);
    setTelegramNoticeMsg(null);
    try {
      const res = await sendTelegramUnbookedReminderAction(userId);
      if (res.success) {
        setTelegramNoticeMsg({
          type: 'success',
          text: `ส่งข้อความแจ้งเตือนทาง Telegram ให้คุณ ${userName} เรียบร้อยแล้ว`,
        });
      } else {
        setTelegramNoticeMsg({
          type: 'error',
          text: res.error || 'เกิดข้อผิดพลาดในการส่งข้อความ Telegram',
        });
      }
    } catch (e) {
      setTelegramNoticeMsg({
        type: 'error',
        text: 'ไม่สามารถเชื่อมต่อระบบแจ้งเตือน Telegram ได้',
      });
    } finally {
      setSendingTelegramUserId(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total Active Staff */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">เจ้าหน้าที่ในระบบทั้งหมด:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{activeUsers.length}</span>
              <span className="text-xs text-slate-500">คน (Active)</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Booked Staff */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">ลงทะเบียนจองคิวแล้ว:</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{bookedUsersCount}</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">คน ({bookingPercentage}%)</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Unbooked Staff (Need Follow Up) */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">ยังไม่ได้จองคิว (ต้องติดตาม):</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700 dark:text-amber-300">{unbookedUsers.length}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">คน (ต้องติดตาม)</span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
            <UserX className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      {telegramNoticeMsg && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in duration-150 ${
            telegramNoticeMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {telegramNoticeMsg.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{telegramNoticeMsg.text}</span>
          </div>
          <button
            onClick={() => setTelegramNoticeMsg(null)}
            className="text-xs underline hover:opacity-80 cursor-pointer"
          >
            ปิด
          </button>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
              <UserX className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                รายชื่อเจ้าหน้าที่ที่ยังไม่ได้จองคิวตรวจสุขภาพ ({filteredUnbookedList.length} คน)
              </h3>
              <p className="text-xs text-slate-500">
                รายการบุคลากร Active ที่ยังไม่มีคิวตรวจ สามารถติดต่อโทรตามหรือกดส่งแจ้งเตือนผ่าน Telegram ได้
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            disabled={filteredUnbookedList.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            <span>ส่งออกรายชื่อยังไม่จอง (Excel/CSV) ({filteredUnbookedList.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid gap-2 sm:grid-cols-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาด้วย ชื่อ, รหัสพนักงาน, ตำแหน่ง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Org Filter */}
          <select
            value={selectedOrgFilter}
            onChange={(e) => setSelectedOrgFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">🏢 แสดงทุกสังกัด / องค์กร</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.name}>
                🏢 {org.name}
              </option>
            ))}
          </select>

          {/* Dept Filter */}
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
          >
            <option value="ALL">🏥 แสดงทุกแผนก/หน่วยงาน</option>
            {availableDepartments.map((dept) => (
              <option key={dept} value={dept}>
                🏥 แผนก {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {filteredUnbookedList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {unbookedUsers.length === 0
                ? 'บุคลากรทุกคนจองคิวครบ 100% แล้ว!'
                : 'ไม่พบข้อมูลตามเงื่อนไขค้นหา'}
            </h4>
            <p className="text-xs text-slate-500">
              {unbookedUsers.length === 0
                ? 'ไม่มีเจ้าหน้าที่ค้างจองในระบบขณะนี้'
                : 'ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสังกัด/แผนกใหม่'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th className="py-3 px-4">ชื่อ - นามสกุล</th>
                  <th className="py-3 px-4">สังกัด / แผนก</th>
                  <th className="py-3 px-4">ตำแหน่ง</th>
                  <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                  <th className="py-3 px-4 text-center">ผูก Telegram</th>
                  <th className="py-3 px-4 text-center">ดำเนินการติดตาม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredUnbookedList.map((user, idx) => {
                  const hasTelegram = Boolean(user.telegramChatId || user.telegramToken);
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-slate-400 text-center font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white text-sm">
                        {user.firstName} {user.lastName}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {user.organization || 'โรงพยาบาลท่าสองยาง'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          แผนก: {user.department || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {user.position || 'เจ้าหน้าที่'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        {user.phone ? (
                          <a
                            href={`tel:${user.phone}`}
                            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">ไม่ระบุ</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {hasTelegram ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            <Send className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                            <span>ผูกแล้ว</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            <span>ยังไม่ผูก</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                          {/* 1. Book on Behalf Button */}
                          <button
                            onClick={() => setTargetUserForBooking(user)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
                            title="จองวันตรวจสุขภาพให้เจ้าหน้าที่รายนี้"
                          >
                            <CalendarPlus className="h-3.5 w-3.5" />
                            <span>จองแทน</span>
                          </button>

                          {/* 2. Telegram Reminder Button */}
                          {hasTelegram && (
                            <button
                              onClick={() =>
                                handleSendTelegramReminder(user.id, `${user.firstName} ${user.lastName}`)
                              }
                              disabled={sendingTelegramUserId === user.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[11px] transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
                              title="ส่งข้อความเชิญชวนจองวันตรวจผ่าน Telegram"
                            >
                              <Send className="h-3.5 w-3.5" />
                              <span>
                                {sendingTelegramUserId === user.id ? 'กำลังส่ง...' : 'เตือน Telegram'}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {targetUserForBooking && (
        <AdminBookModal
          isOpen={Boolean(targetUserForBooking)}
          onClose={() => setTargetUserForBooking(null)}
          targetUser={targetUserForBooking}
          dailySlots={dailySlots}
          packages={packages}
          masterItems={masterItems}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Export Modal for Unbooked Staff */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ส่งออกรายชื่อผู้ยังไม่จอง
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เลือกรูปแบบไฟล์ที่ต้องการส่งออก (Excel หรือ CSV)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                รูปแบบไฟล์ที่ต้องการส่งออก:
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExportFormat('xlsx')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    exportFormat === 'xlsx'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <span>Microsoft Excel (.xlsx)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setExportFormat('csv')}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    exportFormat === 'csv'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <span>CSV File (.csv)</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteExportUnbooked(exportFormat)}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>ดาวน์โหลดไฟล์ .{exportFormat}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
