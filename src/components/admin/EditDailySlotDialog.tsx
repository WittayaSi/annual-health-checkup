'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import { Settings2, AlertTriangle, Check, X } from 'lucide-react';
import { DailySlot } from '@/lib/types';
import { updateDailySlotAction } from '@/app/actions';

interface EditDailySlotDialogProps {
  slot: DailySlot;
  onSuccess?: () => void;
}

export function EditDailySlotDialog({ slot, onSuccess }: EditDailySlotDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isHoliday, setIsHoliday] = useState(slot.isHoliday);
  const [quota, setQuota] = useState(slot.quota);
  const [holidayNote, setHolidayNote] = useState(slot.holidayNote || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format date display
  const [y, m, d] = slot.date.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const thaiMonths = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ];
  const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const formattedDate = `วัน${days[dateObj.getDay()]}ที่ ${d} ${thaiMonths[m - 1]} ${y + 543}`;

  const hasBookings = slot.bookedCount > 0;

  const handleSave = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await updateDailySlotAction(
      slot.id,
      isHoliday ? 0 : quota,
      isHoliday,
      isHoliday ? holidayNote || 'วันหยุดทำการ' : undefined
    );

    setIsLoading(false);

    if (res.success) {
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการอัปเดตสล็อต');
    }
  };

  useModalLock(isOpen && mounted);

  return (
    <>
      <button
        onClick={() => {
          setIsHoliday(slot.isHoliday);
          setQuota(slot.quota);
          setHolidayNote(slot.holidayNote || '');
          setErrorMsg(null);
          setIsOpen(true);
        }}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <Settings2 className="h-3.5 w-3.5 text-slate-400" />
        <span>แก้ไข</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <Settings2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    จัดการสล็อต {formattedDate}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    ปรับโควต้าหรือกำหนดเป็นวันหยุด
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Holiday Toggle Switch */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <label className="text-xs font-medium text-slate-900 dark:text-white block">
                    กำหนดเป็นวันหยุดทำการ
                  </label>
                  <p className="text-[11px] text-slate-400">
                    ปิดรับจองในวันนี้
                  </p>
                </div>
                <button
                  type="button"
                  disabled={hasBookings && !isHoliday}
                  onClick={() => setIsHoliday(!isHoliday)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isHoliday ? 'bg-slate-800 dark:bg-slate-600' : 'bg-slate-300 dark:bg-slate-700'
                  } ${hasBookings && !isHoliday ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isHoliday ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Warning when date has existing bookings */}
              {hasBookings && !isHoliday && (
                <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2.5 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    วันนี้มีผู้จองแล้ว {slot.bookedCount} คน ไม่สามารถเปลี่ยนเป็นวันหยุดได้
                  </span>
                </div>
              )}

              {/* Holiday Note */}
              {isHoliday && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    เหตุผลวันหยุด
                  </label>
                  <input
                    type="text"
                    placeholder="วันหยุดนักขัตฤกษ์"
                    value={holidayNote}
                    onChange={(e) => setHolidayNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {/* Quota Input */}
              {!isHoliday && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    โควต้าสูงสุด (คน)
                  </label>
                  <input
                    type="number"
                    min={hasBookings ? slot.bookedCount : 1}
                    max={150}
                    value={quota}
                    onChange={(e) => setQuota(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              )}

              {errorMsg && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  {errorMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>บันทึก</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
