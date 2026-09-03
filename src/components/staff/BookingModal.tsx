'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import confetti from 'canvas-confetti';
import {
  CalendarCheck2,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { DailySlot, User, CheckupPackage, TestItem } from '@/lib/types';
import { bookSlotAction } from '@/app/actions';
import { HealthPackageSelector } from './HealthPackageSelector';

interface BookingModalProps {
  slot: DailySlot;
  activeUser: User;
  packages: CheckupPackage[];
  onClose: () => void;
  onSuccess: (bookingId: string) => void;
}

export function BookingModal({
  slot,
  activeUser,
  packages,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const userAge = activeUser.dob
    ? new Date().getFullYear() - new Date(activeUser.dob).getFullYear()
    : 30;
  const isSeniorEligible = userAge >= 35;

  const pkgBId = packages.find((p) => p.code === 'PKG-B' || p.id === 'pkg-b')?.id || packages[1]?.id || packages[0]?.id || 'pkg-b';
  const pkgAId = packages.find((p) => p.code === 'PKG-A' || p.id === 'pkg-a')?.id || packages[0]?.id || 'pkg-a';

  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    isSeniorEligible ? pkgBId : pkgAId
  );
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const remaining = slot.quota - slot.bookedCount;

  const [selectedLabItems, setSelectedLabItems] = useState<TestItem[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);

  useModalLock(true);

  const handleSelectPackage = (pkgId: string, items?: TestItem[], totalPrice?: number) => {
    setSelectedPackageId(pkgId);
    if (items) setSelectedLabItems(items);
    if (typeof totalPrice === 'number') setCalculatedPrice(totalPrice);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const itemsSummary = selectedLabItems.map((i) => i.name).join(', ');
    const fullNotes = `[รายการตรวจที่เลือก: ${itemsSummary || 'ทั้งหมด'}] [ราคารวม: ${calculatedPrice} บาท] ${notes ? `(${notes})` : ''}`.trim();

    const res = await bookSlotAction(
      activeUser.id,
      slot.id,
      slot.timeSlots?.[0]?.id || `${slot.id}-t1`,
      selectedPackageId,
      fullNotes,
      selectedLabItems
    );


    setIsLoading(false);

    if (res.success && res.booking) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
      onSuccess(res.booking.id);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการลงทะเบียนจองคิว');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl sm:max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">

        {/* Dedicated Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                ยืนยันการจองตรวจสุขภาพ
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ศูนย์ตรวจสุขภาพ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Date Highlight Banner */}
          <div className="rounded-lg bg-slate-800 dark:bg-slate-950 p-4 text-white">
            <p className="text-xs text-slate-400">วันที่เลือก:</p>
            <p className="text-lg font-semibold mt-0.5">{formattedDate}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-300 border-t border-slate-700 pt-2">
              <span>โควต้าคงเหลือ:</span>
              <span className="font-medium bg-slate-700 px-2 py-0.5 rounded text-xs">
                ว่าง {remaining} / {slot.quota} สิทธิ์
              </span>
            </div>
          </div>

          {/* Health Package Selector Component */}
          <div>
            <HealthPackageSelector
              packages={packages}
              user={activeUser}
              selectedPackageId={selectedPackageId}
              onSelectPackage={handleSelectPackage}
            />
          </div>


          {/* User Info Details */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ผู้ขอจอง:</span>
              <span className="font-medium text-slate-900 dark:text-white">
                {activeUser.firstName} {activeUser.lastName}
              </span>

            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">สังกัด/แผนก:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {activeUser.department}
              </span>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              หมายเหตุ (ถ้ามี):
            </label>
            <input
              type="text"
              placeholder="คำขอเพิ่มเติม..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>

          {/* Package Dynamic Preparation Guide Notice */}
          {(() => {
            const selectedPkg = packages.find((p) => p.id === selectedPackageId);
            const guide = selectedPkg?.preparationGuide;
            if (!guide) return null;
            return (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>คำแนะนำการเตรียมตัวก่อนตรวจ ({selectedPkg.code}):</span>
                </div>
                <p className="leading-relaxed pl-5 font-medium">
                  {guide}
                </p>
              </div>
            );
          })()}

          {/* Error Alert */}
          {errorMsg && (
            <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer Actions Bar */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <span>กำลังบันทึก...</span>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span>ยืนยันการจอง</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
