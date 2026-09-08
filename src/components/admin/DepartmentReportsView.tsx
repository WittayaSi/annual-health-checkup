'use client';

import { useState, useMemo } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import * as XLSX from 'xlsx';
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  Percent,
  Search,
  FileSpreadsheet,
  FileText,
  Download,
  X,
  Send,
  CalendarPlus,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Filter,
  RefreshCw,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  User,
  BookingWithDetails,
  Campaign,
  Organization,
  DailySlot,
  CheckupPackage,
  MasterItem,
} from '@/lib/types';
import { sendTelegramUnbookedReminderAction } from '@/app/actions';
import { formatDetailedAge, formatThaiDate } from '@/lib/item-utils';
import { AdminBookModal } from './AdminBookModal';

interface DepartmentReportsViewProps {
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

export interface DeptStatSummary {
  deptName: string;
  totalUsers: number;
  bookedUsersCount: number;
  unbookedUsersCount: number;
  percentage: number;
}

export function DepartmentReportsView({
  users,
  bookings,
  selectedCampaignId,
  campaigns,
  organizations,
  dailySlots = [],
  packages = [],
  masterItems = [],
  onRefresh,
}: DepartmentReportsViewProps) {
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [deptSearchTerm, setDeptSearchTerm] = useState<string>('');
  const [staffSearchTerm, setStaffSearchTerm] = useState<string>('');
  const [staffStatusFilter, setStaffStatusFilter] = useState<'ALL' | 'BOOKED' | 'UNBOOKED'>('ALL');
  
  // Telegram notification state
  const [sendingTelegramUserId, setSendingTelegramUserId] = useState<string | null>(null);
  const [sendingTelegramDept, setSendingTelegramDept] = useState<string | null>(null);
  const [noticeMsg, setNoticeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Admin book modal states
  const [targetUserForBooking, setTargetUserForBooking] = useState<User | null>(null);
  const [targetBookingForReschedule, setTargetBookingForReschedule] = useState<BookingWithDetails | null>(null);

  // Filter active staff users (excluding only technical system account sys_admin)
  const activeUsers = useMemo(() => {
    return users.filter((u) => u.isActive !== false && u.username !== 'sys_admin');
  }, [users]);

  // Valid bookings for selected campaign
  const campaignBookings = useMemo(() => {
    return selectedCampaignId === 'ALL'
      ? bookings.filter((b) => b.status === 'CONFIRMED')
      : bookings.filter((b) => b.status === 'CONFIRMED' && (b.campaignId === selectedCampaignId || !b.campaignId));
  }, [bookings, selectedCampaignId]);

  // Map of userId -> BookingWithDetails
  const bookingByUserIdMap = useMemo(() => {
    const map = new Map<string, BookingWithDetails>();
    campaignBookings.forEach((b) => {
      if (b.userId) {
        map.set(b.userId, b);
      }
    });
    return map;
  }, [campaignBookings]);

  // Group stats by department
  const deptStatsList = useMemo<DeptStatSummary[]>(() => {
    const map = new Map<string, { total: number; booked: number }>();

    activeUsers.forEach((u) => {
      const dName = (u.department || 'ไม่ระบุแผนก').trim();
      if (!map.has(dName)) {
        map.set(dName, { total: 0, booked: 0 });
      }
      const entry = map.get(dName)!;
      entry.total += 1;
      if (bookingByUserIdMap.has(u.id)) {
        entry.booked += 1;
      }
    });

    const result: DeptStatSummary[] = [];
    map.forEach((val, dName) => {
      const percentage = val.total > 0 ? Number(((val.booked / val.total) * 100).toFixed(1)) : 0;
      result.push({
        deptName: dName,
        totalUsers: val.total,
        bookedUsersCount: val.booked,
        unbookedUsersCount: val.total - val.booked,
        percentage,
      });
    });

    // Sort by department name (or percentage ascending to highlight low progress)
    return result.sort((a, b) => a.deptName.localeCompare(b.deptName, 'th'));
  }, [activeUsers, bookingByUserIdMap]);

  // Filtered department list for table
  const filteredDeptStatsList = useMemo(() => {
    if (!deptSearchTerm.trim()) return deptStatsList;
    const term = deptSearchTerm.toLowerCase().trim();
    return deptStatsList.filter((d) => d.deptName.toLowerCase().includes(term));
  }, [deptStatsList, deptSearchTerm]);

  // Total Overview Counters
  const totalSystemUsers = activeUsers.length;
  const totalSystemBooked = campaignBookings.length;
  const totalSystemUnbooked = Math.max(0, totalSystemUsers - totalSystemBooked);
  const overallPercentage = totalSystemUsers > 0 ? ((totalSystemBooked / totalSystemUsers) * 100).toFixed(1) : '0';

  const completedDeptsCount = deptStatsList.filter((d) => d.percentage === 100).length;
  const criticalDeptsCount = deptStatsList.filter((d) => d.percentage < 50).length;

  // Selected Department Staff List
  const selectedDeptUsers = useMemo(() => {
    if (!selectedDept) return [];
    return activeUsers.filter((u) => (u.department || 'ไม่ระบุแผนก').trim() === selectedDept);
  }, [activeUsers, selectedDept]);

  // Filtered Staff List for selected department
  const filteredStaffList = useMemo(() => {
    return selectedDeptUsers.filter((u) => {
      const hasBooking = bookingByUserIdMap.has(u.id);

      // Filter by booking status tab
      if (staffStatusFilter === 'BOOKED' && !hasBooking) return false;
      if (staffStatusFilter === 'UNBOOKED' && hasBooking) return false;

      // Filter by search term
      if (staffSearchTerm.trim()) {
        const term = staffSearchTerm.toLowerCase().trim();
        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
        const empCode = (u.employeeCode || '').toLowerCase();
        const pos = (u.position || '').toLowerCase();
        const phone = (u.phone || '').toLowerCase();
        if (
          !fullName.includes(term) &&
          !empCode.includes(term) &&
          !pos.includes(term) &&
          !phone.includes(term)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [selectedDeptUsers, bookingByUserIdMap, staffStatusFilter, staffSearchTerm]);

  // Handle Telegram single user reminder
  const handleSendSingleTelegramReminder = async (user: User) => {
    setSendingTelegramUserId(user.id);
    setNoticeMsg(null);
    try {
      const res = await sendTelegramUnbookedReminderAction(user.id);
      if (res.success) {
        setNoticeMsg({
          type: 'success',
          text: `ส่งข้อความแจ้งเตือนหา ${user.firstName} ${user.lastName} ผ่าน Telegram สำเร็จ`,
        });
      } else {
        setNoticeMsg({ type: 'error', text: res.error || 'ไม่สามารถส่งข้อความได้' });
      }
    } catch {
      setNoticeMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์' });
    } finally {
      setSendingTelegramUserId(null);
    }
  };

  // Export Department Percentage Summary (Excel)
  const handleExportDepartmentSummary = () => {
    const rows = deptStatsList.map((d, idx) => ({
      'ลำดับ': idx + 1,
      'ชื่อแผนก/หน่วยงาน': d.deptName,
      'จำนวนบุคลากรทั้งหมด (คน)': d.totalUsers,
      'จองคิวแล้ว (คน)': d.bookedUsersCount,
      'ยังไม่ได้จอง (คน)': d.unbookedUsersCount,
      'เปอร์เซ็นต์การจอง (%)': `${d.percentage}%`,
      'สถานะ': d.percentage === 100 ? 'จองครบ 100%' : d.percentage >= 50 ? 'ความคืบหน้าดี' : 'ต้องติดตามเร่งด่วน',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'เปอร์เซ็นต์แยกรายแผนก');
    XLSX.writeFile(workbook, `department_booking_summary_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Selected Department Staff Detail List (Excel)
  const handleExportSelectedDeptStaff = () => {
    if (!selectedDept) return;

    const rows = filteredStaffList.map((u, idx) => {
      const booking = bookingByUserIdMap.get(u.id);
      const isBooked = Boolean(booking);

      return {
        'ลำดับ': idx + 1,
        'ชื่อ-นามสกุล': `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        'เพศ': u.gender === 'FEMALE' ? 'หญิง' : 'ชาย',
        'แผนก/หน่วยงาน': u.department || '-',
        'ตำแหน่ง': u.position || '-',
        'เบอร์โทรศัพท์': u.phone || '-',
        'สถานะการจอง': isBooked ? 'จองคิวแล้ว' : 'ยังไม่ได้จอง',
        'เลขคิว': booking?.queueNumber || '-',
        'วันที่ตรวจ': booking?.dailySlot?.date || '-',
        'รอบเวลา': booking?.timeSlot ? `${booking.timeSlot.startTime}-${booking.timeSlot.endTime}` : '-',
        'โปรแกรมตรวจ': booking?.package ? `${booking.package.code}: ${booking.package.name}` : '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 26 },
      { wch: 8 },
      { wch: 24 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `รายชื่อ_${selectedDept}`);
    XLSX.writeFile(workbook, `staff_report_${selectedDept}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* NOTICE MESSAGE BANNER */}
      {noticeMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 ${
            noticeMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 text-emerald-900 dark:text-emerald-100'
              : 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 text-rose-900 dark:text-rose-100'
          }`}
        >
          <div className="flex items-center gap-3">
            {noticeMsg.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="text-sm font-medium">{noticeMsg.text}</span>
          </div>
          <button
            onClick={() => setNoticeMsg(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-slate-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Overall Progress */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              ภาพรวมการจองคิวทั้งหมด
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {overallPercentage}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              ({totalSystemBooked} / {totalSystemUsers} คน)
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${Math.min(100, Number(overallPercentage))}%` }}
            />
          </div>
        </div>

        {/* Card 2: Completed Departments */}
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              แผนกที่จองครบ 100%
            </span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-950 dark:text-emerald-100">
              {completedDeptsCount}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              จากทั้งหมด {deptStatsList.length} แผนก
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
            🎉 บุคลากรในแผนกเหล่านี้จองคิวเรียบร้อยครบทุกคน
          </p>
        </div>

        {/* Card 3: Critical Attention Required */}
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
              แผนกที่ต้องติดตามเร่งด่วน
            </span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-950 dark:text-rose-100">
              {criticalDeptsCount}
            </span>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              แผนก (จองน้อยกว่า 50%)
            </span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-2 font-medium">
            ⚠️ แนะนำให้ Super Staff ส่งแจ้งเตือนหรือจองคิวแทน
          </p>
        </div>

        {/* Card 4: Total Remaining Unbooked Staff */}
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              ยอดบุคลากรยังไม่จองทั้งหมด
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <UserX className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-950 dark:text-amber-100">
              {totalSystemUnbooked}
            </span>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              คน
            </span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2 font-medium">
            📌 สามารถกดสลับดูรายชื่อด้านล่างเพื่อติดตามรายบุคคลได้
          </p>
        </div>
      </div>

      {/* MAIN CONTENT SECTION: DEPARTMENT SUMMARY TABLE & STAFF DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN (7 cols): DEPARTMENT PERCENTAGE SUMMARY TABLE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    สรุปเปอร์เซ็นต์การจองแยกรายแผนก
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  คลิกที่ชื่อแผนกเพื่อสลับดูรายชื่อบุคลากรที่จองแล้ว/ยังไม่ได้จอง
                </p>
              </div>

              {/* Action Export Button */}
              <button
                onClick={handleExportDepartmentSummary}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>ส่งออกรายงานแผนก (Excel)</span>
              </button>
            </div>

            {/* Search filter for Department */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อแผนก..."
                value={deptSearchTerm}
                onChange={(e) => setDeptSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>

            {/* Department Table */}
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto scrollbar-thin border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 sticky top-0 font-semibold backdrop-blur-md">
                  <tr>
                    <th className="px-3.5 py-3">ชื่อแผนก/หน่วยงาน</th>
                    <th className="px-3.5 py-3 text-center">ทั้งหมด</th>
                    <th className="px-3.5 py-3 text-center">จองแล้ว</th>
                    <th className="px-3.5 py-3 text-center">ยังไม่จอง</th>
                    <th className="px-3.5 py-3">ความคืบหน้า (%)</th>
                    <th className="px-3.5 py-3 text-center">ดูรายชื่อ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDeptStatsList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        ไม่พบข้อมูลแผนกตามคำค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredDeptStatsList.map((dept) => {
                      const isSelected = selectedDept === dept.deptName;
                      const pct = dept.percentage;

                      let statusBadge = null;
                      if (pct === 100) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            100%
                          </span>
                        );
                      } else if (pct >= 50) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            {pct}%
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            {pct}%
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={dept.deptName}
                          onClick={() => setSelectedDept(dept.deptName)}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50/80 dark:bg-emerald-950/40 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-3.5 py-3 font-medium text-slate-900 dark:text-white">
                            <div className="flex items-center gap-2">
                              <span>{dept.deptName}</span>
                              {isSelected && (
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center text-slate-600 dark:text-slate-400">
                            {dept.totalUsers}
                          </td>
                          <td className="px-3.5 py-3 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                            {dept.bookedUsersCount}
                          </td>
                          <td className="px-3.5 py-3 text-center text-rose-600 dark:text-rose-400 font-bold">
                            {dept.unbookedUsersCount}
                          </td>
                          <td className="px-3.5 py-3 min-w-[140px]">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                {statusBadge}
                                <span className="text-slate-400 text-[10px]">
                                  {dept.bookedUsersCount}/{dept.totalUsers}
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    pct === 100
                                      ? 'bg-emerald-500'
                                      : pct >= 50
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDept(dept.deptName);
                              }}
                              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                              }`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
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

        {/* RIGHT COLUMN (5 cols): DETAILED STAFF LIST FOR SELECTED DEPARTMENT */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 min-h-[480px]">
            {selectedDept ? (
              <>
                {/* Header for Selected Department */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        รายชื่อบุคลากร: {selectedDept}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      รวมทั้งหมด {selectedDeptUsers.length} คน (จองแล้ว {selectedDeptUsers.filter(u => bookingByUserIdMap.has(u.id)).length} คน)
                    </p>
                  </div>

                  <button
                    onClick={handleExportSelectedDeptStaff}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>ส่งออกแผนกนี้</span>
                  </button>
                </div>

                {/* Status Filter Tabs (ALL / BOOKED / UNBOOKED) */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                  <button
                    onClick={() => setStaffStatusFilter('ALL')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      staffStatusFilter === 'ALL'
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    ทั้งหมด ({selectedDeptUsers.length})
                  </button>
                  <button
                    onClick={() => setStaffStatusFilter('BOOKED')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      staffStatusFilter === 'BOOKED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    จองแล้ว ({selectedDeptUsers.filter((u) => bookingByUserIdMap.has(u.id)).length})
                  </button>
                  <button
                    onClick={() => setStaffStatusFilter('UNBOOKED')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      staffStatusFilter === 'UNBOOKED'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    ยังไม่จอง ({selectedDeptUsers.filter((u) => !bookingByUserIdMap.has(u.id)).length})
                  </button>
                </div>

                {/* Staff Search Box */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, ตำแหน่ง, เบอร์โทร..."
                    value={staffSearchTerm}
                    onChange={(e) => setStaffSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                </div>

                {/* Staff List View */}
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin">
                  {filteredStaffList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <UserX className="h-8 w-8 mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-xs font-medium">ไม่พบรายชื่อบุคลากรในเงื่อนไขนี้</p>
                    </div>
                  ) : (
                    filteredStaffList.map((u) => {
                      const booking = bookingByUserIdMap.get(u.id);
                      const isBooked = Boolean(booking);

                      return (
                        <div
                          key={u.id}
                          className={`p-3 rounded-xl border transition-all space-y-2 ${
                            isBooked
                              ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-xs">
                                  {u.firstName} {u.lastName}
                                </span>
                                {u.gender && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {u.gender === 'FEMALE' ? 'หญิง' : 'ชาย'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {u.position || 'ตำแหน่งไม่ระบุ'} {u.phone ? `• 📞 ${u.phone}` : ''}
                              </p>
                            </div>

                            {/* Booking Status Badge */}
                            <div>
                              {isBooked ? (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 inline-flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span>จองแล้ว ({booking?.queueNumber})</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 inline-flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>ยังไม่ได้จอง</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Booking Details if Booked */}
                          {isBooked && booking && (
                            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-100/50 dark:bg-emerald-950/60 text-[11px] text-emerald-900 dark:text-emerald-200">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="font-semibold">
                                  {booking.dailySlot?.date ? formatThaiDate(booking.dailySlot.date, 'short') : '-'}
                                </span>
                                <span>
                                  ({booking.timeSlot?.startTime}-{booking.timeSlot?.endTime})
                                </span>
                              </div>
                              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                                {booking.package?.code}
                              </span>
                            </div>
                          )}

                          {/* Actions: Admin Book or Send Telegram */}
                          <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                            {isBooked ? (
                              <button
                                type="button"
                                onClick={() => setTargetBookingForReschedule(booking!)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                              >
                                <CalendarPlus className="h-3 w-3 text-emerald-600" />
                                <span>ปรับเปลี่ยนสล็อต</span>
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSendSingleTelegramReminder(u)}
                                  disabled={sendingTelegramUserId === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                  <Send className="h-3 w-3 text-amber-600" />
                                  <span>{sendingTelegramUserId === u.id ? 'กำลังส่ง...' : 'ส่งเตือน'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setTargetUserForBooking(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs cursor-pointer"
                                >
                                  <CalendarPlus className="h-3 w-3" />
                                  <span>จองคิวแทน</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              /* Empty State when no department selected */
              <div className="flex flex-col items-center justify-center h-full min-h-[380px] text-center p-6 space-y-3">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Building2 className="h-10 w-10" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  โปรดเลือกแผนกจากตารางฝั่งซ้าย
                </h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  คลิกที่รายชื่อแผนกใดก็ได้เพื่อสลับดูรายชื่อบุคลากรทั้งหมดภายในแผนก พร้อมสถานะการจองและการจัดการคิวแทน
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADMIN BOOK MODAL (Book for staff or reschedule) */}
      {(Boolean(targetUserForBooking) || Boolean(targetBookingForReschedule)) && (
        <AdminBookModal
          isOpen={Boolean(targetUserForBooking) || Boolean(targetBookingForReschedule)}
          onClose={() => {
            setTargetUserForBooking(null);
            setTargetBookingForReschedule(null);
          }}
          targetUser={targetUserForBooking}
          existingBooking={targetBookingForReschedule}
          dailySlots={dailySlots}
          packages={packages}
          masterItems={masterItems}
          onSuccess={() => {
            setTargetUserForBooking(null);
            setTargetBookingForReschedule(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}
    </div>
  );
}
