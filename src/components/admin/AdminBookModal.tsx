'use client';

import { useState, useMemo, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  Calendar,
  X,
  CheckCircle2,
  AlertCircle,
  User,
  CalendarDays,
} from 'lucide-react';
import {
  User as UserType,
  BookingWithDetails,
  DailySlot,
  CheckupPackage,
  MasterItem,
  TestItem,
} from '@/lib/types';
import { bookSlotAction, rescheduleBookingAction } from '@/app/actions';
import { HealthPackageSelector } from '@/components/staff/HealthPackageSelector';

interface AdminBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, mode is "Book for Staff"
  targetUser?: UserType | null;
  // If provided, mode is "Reschedule"
  existingBooking?: BookingWithDetails | null;
  dailySlots: DailySlot[];
  packages: CheckupPackage[];
  masterItems: MasterItem[];
  onSuccess: () => void;
}

export function AdminBookModal({
  isOpen,
  onClose,
  targetUser,
  existingBooking,
  dailySlots,
  packages,
  masterItems,
  onSuccess,
}: AdminBookModalProps) {
  const isReschedule = Boolean(existingBooking);
  const user = targetUser || existingBooking?.user;

  const pkgBId = packages.find((p) => p.code === 'PKG-B' || p.id === 'pkg-b')?.id || packages[1]?.id || packages[0]?.id || 'pkg-b';
  const pkgAId = packages.find((p) => p.code === 'PKG-A' || p.id === 'pkg-a')?.id || packages[0]?.id || 'pkg-a';

  const userAge = user?.dob
    ? new Date().getFullYear() - new Date(user.dob).getFullYear()
    : 30;

  const [selectedSlotId, setSelectedSlotId] = useState<string>(
    existingBooking?.dailySlotId || ''
  );
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    existingBooking?.packageId || (userAge >= 35 ? pkgBId : pkgAId)
  );
  const [selectedLabItems, setSelectedLabItems] = useState<TestItem[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  const [notes, setNotes] = useState<string>(existingBooking?.notes || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available non-holiday slots
  const availableSlots = useMemo(() => {
    return dailySlots.filter((s) => !s.isHoliday);
  }, [dailySlots]);

  useModalLock(isOpen && Boolean(user));

  if (!isOpen || !user) return null;

  const handleSelectPackage = (pkgId: string, items?: TestItem[], totalPrice?: number) => {
    setSelectedPackageId(pkgId);
    if (items) setSelectedLabItems(items);
    if (typeof totalPrice === 'number') setCalculatedPrice(totalPrice);
  };

  const handleSubmit = async () => {
    if (!selectedSlotId) {
      setErrorMsg('กรุณาเลือกวันที่ต้องการจอง');
      return;
    }
    if (!selectedPackageId) {
      setErrorMsg('กรุณาเลือกแพ็กเกจตรวจ');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const chosenItems = selectedLabItems.map((it) => ({
      id: it.id,
      name: it.name,
      price: it.price || 0,
    }));

    const itemsSummary = selectedLabItems.map((i) => i.name).join(', ');
    const fullNotes = `[รายการตรวจที่เลือก: ${itemsSummary || 'ทั้งหมด'}] [ราคารวม: ${calculatedPrice} บาท] ${notes ? `(${notes})` : ''}`.trim();

    try {
      if (isReschedule && existingBooking) {
        const res = await rescheduleBookingAction(
          existingBooking.id,
          selectedSlotId,
          undefined,
          selectedPackageId,
          fullNotes,
          chosenItems
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการย้ายวันตรวจ');
        }
      } else {
        const targetSlot = dailySlots.find((s: DailySlot) => s.id === selectedSlotId);
        const res = await bookSlotAction(
          user.id,
          selectedSlotId,
          targetSlot?.timeSlots?.[0]?.id || `${selectedSlotId}-t1`,
          selectedPackageId,
          fullNotes,
          chosenItems
        );
        if (res.success) {
          onSuccess();
          onClose();
        } else {
          setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการจองคิว');
        }
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'เกิดข้อผิดพลาดในระบบ');
    } finally {
      setIsLoading(false);
    }
  };

  const initialItems = useMemo(() => {
    if (!existingBooking?.items) return undefined;
    return existingBooking.items.map((it) => ({
      id: it.itemId || undefined,
      name: it.itemName,
      price: it.price || 0,
    }));
  }, [existingBooking]);

  const modalJSX = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl sm:max-w-3xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-5 w-5" />
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isReschedule ? 'ย้ายวันตรวจสุขภาพ (Admin)' : 'จองวันตรวจสุขภาพให้เจ้าหน้าที่ (Admin)'}
              </h3>
              <p className="text-xs text-sky-100 mt-0.5">
                สำหรับคุณ {user.firstName} {user.lastName} ({user.department || user.organization})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* User Info Badge */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-sm">
                <User className="h-4 w-4 text-sky-500" />
                <span>คุณ {user.firstName} {user.lastName}</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2.5 flex-wrap">
                <span>รหัสพนักงาน: {user.employeeCode || '-'}</span>
                <span>•</span>
                <span>สังกัด/หน่วยงาน: {user.organization || user.department || '-'}</span>
                {user.dob && (
                  <>
                    <span>•</span>
                    <span>อายุ: {new Date().getFullYear() - new Date(user.dob).getFullYear()} ปี</span>
                  </>
                )}
              </div>
            </div>
            {isReschedule && existingBooking?.dailySlot && (
              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 block">วันตรวจเดิม:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                  {existingBooking.dailySlot.date}
                </span>
              </div>
            )}
          </div>

          {/* 1. Select Date Slot */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
              <Calendar className="h-4 w-4 text-sky-500" />
              <span>เลือกวันตรวจสุขภาพ: *</span>
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">-- เลือกวันตรวจ --</option>
              {availableSlots.map((s) => {
                const isFull = s.bookedCount >= s.quota;
                return (
                  <option key={s.id} value={s.id} disabled={isFull}>
                    วันที่ {s.date} (ว่าง {s.quota - s.bookedCount}/{s.quota} คิว){isFull ? ' [เต็ม]' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Package Selector with Lab Checklist */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <HealthPackageSelector
              packages={packages}
              user={user}
              selectedPackageId={selectedPackageId}
              initialSelectedItems={initialItems}
              onSelectPackage={handleSelectPackage}
            />
          </div>

          {/* 3. Notes */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            <label className="font-bold text-slate-700 dark:text-slate-300 text-xs">
              หมายเหตุเพิ่มเติม (Admin):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ระบุหมายเหตุหรือเหตุผล..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 rounded-b-2xl text-xs">
          <div className="text-slate-500 dark:text-slate-400">
            <span>ราคาสุทธิ: </span>
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
              {calculatedPrice > 0 ? `฿${calculatedPrice.toLocaleString()}` : 'ฟรีสวัสดิการ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-md disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              {isLoading ? (
                <span>กำลังบันทึก...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{isReschedule ? 'ยืนยันการย้ายวันตรวจ' : 'บันทึกการจองคิว'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
