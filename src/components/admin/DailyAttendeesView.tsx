'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  Search,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { DailySlot, BookingWithDetails, CheckupPackage, MasterItem } from '@/lib/types';
import { AdminBookModal } from './AdminBookModal';
import { AdminExportModal } from './AdminExportModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cancelBookingAction } from '@/app/actions';
import { CalendarDays, Trash2 } from 'lucide-react';

interface DailyAttendeesViewProps {
  slots: DailySlot[];
  bookings: BookingWithDetails[];
  packages?: CheckupPackage[];
  masterItems?: MasterItem[];
  onRefresh?: () => void;
}

export function DailyAttendeesView({
  slots,
  bookings,
  packages = [],
  masterItems = [],
  onRefresh,
}: DailyAttendeesViewProps) {
  const [rescheduleTarget, setRescheduleTarget] = useState<BookingWithDetails | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const executeCancelBooking = async () => {
    if (!confirmCancelBookingId) return;
    const bId = confirmCancelBookingId;
    setCancellingBookingId(bId);
    try {
      const res = await cancelBookingAction(bId);
      if (res.success && onRefresh) onRefresh();
    } finally {
      setCancellingBookingId(null);
      setConfirmCancelBookingId(null);
    }
  };
  // Sort slot dates chronologically
  const activeSlots = useMemo(() => {
    return slots
      .filter((s) => !s.isHoliday)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [slots]);

  // Selected date state (defaults to first available date or today)
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (activeSlots.length > 0) return activeSlots[0].date;
    const today = new Date().toISOString().split('T')[0];
    return today;
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Find slot for selected date
  const currentSlot = useMemo(() => {
    return slots.find((s) => s.date === selectedDate);
  }, [slots, selectedDate]);

  // Get all bookings for selected date
  const dayBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.dailySlot?.date === selectedDate) return true;
      if (currentSlot && b.dailySlotId === currentSlot.id) return true;
      return false;
    });
  }, [bookings, selectedDate, currentSlot]);

  // Filtered bookings based on user inputs
  const filteredBookings = useMemo(() => {
    return dayBookings.filter((b) => {
      // Package Filter
      if (selectedPackage !== 'ALL') {
        const pCode = b.package?.code || b.packageId;
        if (pCode !== selectedPackage && b.packageId !== selectedPackage) return false;
      }

      // Department Filter
      if (selectedDept !== 'ALL') {
        if (b.user?.department !== selectedDept) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const uName = b.user ? `${b.user.firstName} ${b.user.lastName}`.toLowerCase() : '';
        const uCode = b.user?.employeeCode?.toLowerCase() || '';
        const uDept = b.user?.department?.toLowerCase() || '';
        const pkgName = b.package?.name?.toLowerCase() || '';

        if (
          !uName.includes(q) &&
          !uCode.includes(q) &&
          !uDept.includes(q) &&
          !pkgName.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [dayBookings, selectedPackage, selectedDept, searchQuery]);

  // Extract unique departments for dropdown
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    dayBookings.forEach((b) => {
      if (b.user?.department) depts.add(b.user.department);
    });
    return Array.from(depts).sort();
  }, [dayBookings]);

  // Package distribution stats
  const pkgAStat = dayBookings.filter((b) => b.package?.code === 'PKG-A' || b.packageId === 'pkg-a').length;
  const pkgBStat = dayBookings.filter((b) => b.package?.code === 'PKG-B' || b.packageId === 'pkg-b').length;

  // Format date display in Thai
  const formattedDateThai = useMemo(() => {
    if (!selectedDate) return '-';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const thaiMonths = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    return `วัน${days[dateObj.getDay()]}ที่ ${d} ${thaiMonths[m - 1]} ${y + 543}`;
  }, [selectedDate]);

  // Date Navigation Handlers
  const handlePrevDate = () => {
    const currentIndex = activeSlots.findIndex((s) => s.date === selectedDate);
    if (currentIndex > 0) {
      setSelectedDate(activeSlots[currentIndex - 1].date);
    }
  };

  const handleNextDate = () => {
    const currentIndex = activeSlots.findIndex((s) => s.date === selectedDate);
    if (currentIndex >= 0 && currentIndex < activeSlots.length - 1) {
      setSelectedDate(activeSlots[currentIndex + 1].date);
    }
  };

  // Export Daily CSV
  const handleExportCSV = () => {
    if (filteredBookings.length === 0) {
      alert('ไม่มีข้อมูลสำหรับส่งออก');
      return;
    }

    const headers = [
      'ลำดับ',
      'ชื่อ-นามสกุล',
      'เพศ',
      'อายุ (ปี)',
      'สังกัด/หน่วยงาน',
      'โปรแกรมตรวจ',
      'รูปแบบสิทธิ์',
      'ค่าใช้จ่ายสุทธิ (บาท)',
      'สถานะ',
      'หมายเหตุ',
    ];

    const rows = filteredBookings.map((b, idx) => {
      const uName = b.user ? `${b.user.firstName} ${b.user.lastName}` : '-';
      const sex = b.user?.gender === 'MALE' ? 'ชาย' : b.user?.gender === 'FEMALE' ? 'หญิง' : '-';
      const userAge = b.user?.dob ? (new Date().getFullYear() - new Date(b.user.dob).getFullYear()) : '-';
      const dept = b.user?.department || b.user?.organization || '-';
      const pkgStr = b.package ? `${b.package.code}: ${b.package.name}` : '-';

      const modeStr = b.pricingMode === 'FREE' ? 'ฟรีตามสิทธิ์ 100%' : b.pricingMode === 'UPGRADE' ? 'ฟรีสวัสดิการ + ชำระส่วนต่าง' : b.pricingMode === 'FLAT_RATE' ? 'เหมาจ่าย' : 'ชำระเต็มราคา';
      const priceStr = b.totalPrice !== undefined ? String(b.totalPrice) : '0';

      return [
        idx + 1,
        `"${uName}"`,
        `"${sex}"`,
        `"${userAge}"`,
        `"${dept}"`,
        `"${pkgStr}"`,
        `"${modeStr}"`,
        `"${priceStr}"`,
        `"${b.status}"`,
        `"${b.notes || ''}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `รายชื่อผู้ตรวจสุขภาพ_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Daily Manifest
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* CONTROL & DATE SELECTOR BAR */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                รายชื่อผู้เข้ารับการตรวจสุขภาพประจำวัน
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกวันที่ต้องการเพื่อตรวจเช็กรายชื่อบุคลากรที่จองคิว โปรแกรมตรวจ และรายการแล็บ
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>ส่งออกรายงาน (Excel/CSV)</span>
            </button>
          </div>
        </div>

        {/* DATE SELECTOR NAVIGATOR */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDate}
              disabled={activeSlots.findIndex((s) => s.date === selectedDate) <= 0}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-64 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-xs"
              >
                {activeSlots.map((s) => {
                  const count = bookings.filter((b) => b.dailySlot?.date === s.date || b.dailySlotId === s.id).length;
                  return (
                    <option key={s.id} value={s.date}>
                      📅 {s.date} ({count} คน / โควต้า {s.quota})
                    </option>
                  );
                })}
              </select>
            </div>

            <button
              onClick={handleNextDate}
              disabled={activeSlots.findIndex((s) => s.date === selectedDate) >= activeSlots.length - 1}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 transition-colors"
              title="วันถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* DATE HIGHLIGHT & METRICS */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800 dark:text-white">
              {formattedDateThai}
            </span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-900">
                รวมทั้งหมด {dayBookings.length} คน
              </span>
              <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium">
                PKG-A: {pkgAStat}
              </span>
              <span className="px-2 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-medium">
                PKG-B: {pkgBStat}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 print:hidden">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Package Filter */}
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">📦 โปรแกรมตรวจทั้งหมด</option>
            <option value="PKG-A">PKG-A: โปรแกรมพื้นฐาน (&lt; 35 ปี)</option>
            <option value="PKG-B">PKG-B: โปรแกรมตรวจชุดใหญ่ (&gt;= 35 ปี)</option>
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">🏢 ทุกสังกัด/หน่วยงาน ({uniqueDepartments.length})</option>
            {uniqueDepartments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABLE DATA CONTAINER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">ชื่อ - นามสกุล / ข้อมูล</th>
                <th className="py-3 px-3">สังกัด / แผนก</th>
                <th className="py-3 px-3 w-28">โปรแกรมตรวจ</th>
                <th className="py-3 px-3 w-32 text-center">สิทธิ์ / ค่าใช้จ่าย</th>
                <th className="py-3 px-3 w-24 text-center">สถานะ</th>
                <th className="py-3 px-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    ไม่พบรายชื่อผู้เข้ารับการตรวจในวันที่ {selectedDate} ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, idx) => {
                  const u = b.user;
                  const isPkgB = b.package?.code === 'PKG-B' || b.packageId === 'pkg-b';

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Row Index */}
                      <td className="py-3 px-3 text-center font-mono text-slate-400 font-medium">
                        {idx + 1}
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-xs">
                            {u ? `${u.firstName} ${u.lastName}` : 'ผู้รับบริการ'}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {u?.gender === 'MALE' ? 'ชาย' : u?.gender === 'FEMALE' ? 'หญิง' : '-'}
                            {u?.dob ? ` • อายุ ${new Date().getFullYear() - new Date(u.dob).getFullYear()} ปี` : ''}
                          </p>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                        {u?.department || '-'}
                      </td>

                      {/* Package */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                            isPkgB
                              ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900'
                          }`}
                        >
                          {b.package?.code || (isPkgB ? 'PKG-B' : 'PKG-A')}
                        </span>
                      </td>

                      {/* Pricing Mode & Total */}
                      <td className="py-3 px-3 text-center">
                        <div className="space-y-0.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            b.pricingMode === 'FREE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : b.pricingMode === 'UPGRADE'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                                : b.pricingMode === 'FLAT_RATE'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                          }`}>
                            {b.pricingMode === 'FREE' ? 'ฟรีสวัสดิการ' : b.pricingMode === 'UPGRADE' ? 'ส่วนต่าง' : b.pricingMode === 'FLAT_RATE' ? 'เหมาจ่าย' : 'ชำระเต็ม'}
                          </span>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            ฿{b.totalPrice ?? 0}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>ยืนยันแล้ว</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setRescheduleTarget(b)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                            title="ย้ายวันตรวจ"
                          >
                            <CalendarDays className="h-3 w-3" />
                            <span>ย้ายวัน</span>
                          </button>
                          <button
                            onClick={() => setConfirmCancelBookingId(b.id)}
                            disabled={cancellingBookingId === b.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50"
                            title="ยกเลิกการจอง"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>ยกเลิก</span>
                          </button>
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

      {rescheduleTarget && (
        <AdminBookModal
          isOpen={Boolean(rescheduleTarget)}
          onClose={() => setRescheduleTarget(null)}
          existingBooking={rescheduleTarget}
          dailySlots={slots}
          packages={packages}
          masterItems={masterItems}
          onSuccess={() => {
            if (onRefresh) onRefresh();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmCancelBookingId)}
        title="ยืนยันการยกเลิกคิวตรวจสุขภาพ"
        message="คุณต้องการยกเลิกคิวจองตรวจสุขภาพนี้ใช่หรือไม่? ระบบจะทำการคืนโควต้าสล็อตให้อัตโนมัติ"
        confirmText="ยืนยันยกเลิกคิว"
        cancelText="ปิดหน้าต่าง"
        type="danger"
        onConfirm={executeCancelBooking}
        onCancel={() => setConfirmCancelBookingId(null)}
        isLoading={Boolean(cancellingBookingId)}
      />

      <AdminExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        bookingsData={dayBookings}
        dateFilter={selectedDate}
        title={`ส่งออกรายชื่อผู้เข้าตรวจประจำวันที่ ${selectedDate}`}
      />
    </div>
  );
}
