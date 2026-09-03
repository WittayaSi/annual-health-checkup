'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  X,
  FileSpreadsheet,
  CalendarCheck2,
  Clock,
  User,
  Stethoscope,
  Building2,
  CalendarDays,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { DailySlot, BookingWithDetails, CheckupPackage, MasterItem } from '@/lib/types';
import { AdminExportModal } from './AdminExportModal';
import { AdminBookModal } from './AdminBookModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cancelBookingAction } from '@/app/actions';

interface SlotBookingsDialogProps {
  slot: DailySlot | null;
  bookings: BookingWithDetails[];
  dailySlots?: DailySlot[];
  packages?: CheckupPackage[];
  masterItems?: MasterItem[];
  onClose: () => void;
  onRefresh?: () => void;
}

export function SlotBookingsDialog({
  slot,
  bookings,
  dailySlots = [],
  packages = [],
  masterItems = [],
  onClose,
  onRefresh,
}: SlotBookingsDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMED' | 'CANCELLED' | 'ATTENDED'>('ALL');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Reschedule modal state
  const [rescheduleBookingTarget, setRescheduleBookingTarget] = useState<BookingWithDetails | null>(null);

  // Cancel state
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [confirmCancelBookingId, setConfirmCancelBookingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalLock(Boolean(slot && mounted));

  if (!slot || !mounted) return null;

  // Filter bookings for this slot date
  const dayBookings = bookings.filter((b) => {
    if (b.dailySlotId === slot.id) return true;
    if (b.dailySlot?.date === slot.date) return true;
    return false;
  });

  const filteredBookings = dayBookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;

    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const uName = b.user ? `${b.user.firstName} ${b.user.lastName}`.toLowerCase() : '';
    const uCode = b.user?.employeeCode?.toLowerCase() || '';
    const uDept = b.user?.department?.toLowerCase() || '';
    const queue = b.queueNumber?.toLowerCase() || '';
    const pkgName = b.package?.name?.toLowerCase() || '';
    const notes = b.notes?.toLowerCase() || '';

    return (
      uName.includes(q) ||
      uCode.includes(q) ||
      uDept.includes(q) ||
      queue.includes(q) ||
      pkgName.includes(q) ||
      notes.includes(q)
    );
  });

  const handleCancelBooking = (bookingId: string) => {
    setConfirmCancelBookingId(bookingId);
  };

  const executeCancelBooking = async () => {
    if (!confirmCancelBookingId) return;
    const bId = confirmCancelBookingId;
    setCancellingBookingId(bId);
    try {
      const res = await cancelBookingAction(bId);
      if (res.success && onRefresh) {
        onRefresh();
      }
    } catch (e) {
      console.error('Failed to cancel booking:', e);
    } finally {
      setCancellingBookingId(null);
      setConfirmCancelBookingId(null);
    }
  };

  const modalJSX = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div role="dialog" aria-modal="true" className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>รายชื่อผู้จองตรวจสุขภาพประจำวันที่ {slot.date}</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {dayBookings.length} / {slot.quota} คิว
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                จัดการย้ายวันตรวจ ยกเลิกคิว หรือดูรายละเอียดการจองย่อยในสล็อตนี้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ, รหัสพนักงาน, แผนก, หมายเลขคิว..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="CONFIRMED">ยืนยันคิว</option>
              <option value="ATTENDED">เข้าตรวจแล้ว</option>
              <option value="CANCELLED">ยกเลิกคิว</option>
            </select>
          </div>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>ส่งออก Excel/CSV</span>
          </button>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-2.5 w-12 text-center">คิว</th>
                  <th className="px-3 py-2.5">ชื่อ-นามสกุล</th>
                  <th className="px-3 py-2.5">สังกัด/แผนก</th>
                  <th className="px-3 py-2.5 text-center">รอบเวลา</th>
                  <th className="px-3 py-2.5 text-center">โปรแกรม</th>
                  <th className="px-3 py-2.5 text-center">สถานะ</th>
                  <th className="px-3 py-2.5 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      {dayBookings.length === 0
                        ? 'ยังไม่มีผู้จองในวันนี้'
                        : 'ไม่พบข้อมูลตรงตามเงื่อนไขค้นหา'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-3 py-2.5 text-center font-mono font-medium text-slate-900 dark:text-white">
                        {b.queueNumber || '-'}
                      </td>
                      <td className="px-3 py-2.5">
                        {b.user ? (
                          <span className="font-medium text-slate-900 dark:text-white block">
                            {b.user.firstName} {b.user.lastName}
                          </span>
                        ) : (
                          <span className="text-slate-400">ไม่ทราบชื่อ</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                        {b.user?.department || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-slate-600 dark:text-slate-400">
                        {b.timeSlot ? `${b.timeSlot.startTime} - ${b.timeSlot.endTime}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {b.package ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                            {b.package.code}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        {b.status === 'CONFIRMED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 font-medium">
                            ยืนยัน
                          </span>
                        ) : b.status === 'CANCELLED' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium">
                            ยกเลิก
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-medium">
                            ตรวจแล้ว
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {b.status === 'CONFIRMED' && (
                            <>
                              <button
                                onClick={() => setRescheduleBookingTarget(b)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors"
                                title="ย้ายวันตรวจสุขภาพ"
                              >
                                <CalendarDays className="h-3 w-3" />
                                <span>ย้ายวัน</span>
                              </button>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                disabled={cancellingBookingId === b.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors disabled:opacity-50"
                                title="ยกเลิกการจอง"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>ยกเลิก</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500">
            แสดง {filteredBookings.length} จาก {dayBookings.length} รายการ
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>

      <AdminExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        dateFilter={slot.date}
        bookingsData={dayBookings}
        title={`ส่งออกคิวจองวันที่ ${slot.date}`}
      />

      {rescheduleBookingTarget && (
        <AdminBookModal
          isOpen={Boolean(rescheduleBookingTarget)}
          onClose={() => setRescheduleBookingTarget(null)}
          existingBooking={rescheduleBookingTarget}
          dailySlots={dailySlots}
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
    </div>
  );

  return createPortal(modalJSX, document.body);
}
