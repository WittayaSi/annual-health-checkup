'use client';

import { useState } from 'react';
import {
  CalendarCheck2,
  Clock,
  MapPin,
  AlertTriangle,
  Printer,
  CheckCircle2,
  Stethoscope,
  CreditCard,
} from 'lucide-react';
import { BookingWithDetails } from '@/lib/types';
import { cancelBookingAction } from '@/app/actions';
import { PrintableQueueTicket } from './PrintableQueueTicket';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';


interface CurrentBookingCardProps {
  booking: BookingWithDetails;
  onCancelSuccess?: () => void;
  onRescheduleClick?: () => void;
}

export function CurrentBookingCard({
  booking,
  onCancelSuccess,
}: CurrentBookingCardProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showPrintTicket, setShowPrintTicket] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const slotDateStr = booking.dailySlot?.date;
  let formattedDate = slotDateStr || 'ไม่ระบุ';

  if (slotDateStr) {
    const [y, m, d] = slotDateStr.split('-').map(Number);
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
    formattedDate = `วัน${days[dateObj.getDay()]}ที่ ${d} ${thaiMonths[m - 1]} ${y + 543}`;
  }

  const handleCancel = async () => {
    setIsCancelling(true);
    setErrorMsg(null);
    const res = await cancelBookingAction(booking.id);
    setIsCancelling(false);
    if (res.success) {
      setShowConfirmCancel(false);
      if (onCancelSuccess) onCancelSuccess();
    } else {
      setErrorMsg(res.error || 'ไม่สามารถยกเลิกการจองได้');
    }
  };

  const timeRange = booking.timeSlot
    ? `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime} น.`
    : '08:00 - 10:00 น.';

  return (
    <div className="w-full max-w-full overflow-hidden rounded-2xl border-2 border-emerald-500/40 dark:border-emerald-500/30 bg-white dark:bg-slate-900 shadow-xl shadow-emerald-500/5 space-y-4 sm:space-y-5">
      {/* Prominent Success Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md ring-1 ring-white/40 shadow-inner">
            <CheckCircle2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/20 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full ring-1 ring-white/30">
                สถานะ: ยืนยันสิทธิ์เรียบร้อย
              </span>
              <span className="text-[11px] text-emerald-100">
                ลงทะเบียนเมื่อ {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('th-TH') : 'ล่าสุด'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold mt-1 tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>หมายเลขคิวของคุณ:</span>
              <span className="font-mono text-amber-300 text-xl sm:text-2xl font-black underline decoration-amber-300/50 underline-offset-4">
                {booking.queueNumber || 'A-015'}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setShowPrintTicket(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-950/60 hover:bg-emerald-950/80 rounded-xl transition-all border border-emerald-400/30 backdrop-blur-sm shadow-md active:scale-95 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-emerald-200 shrink-0" />
            <span>พิมพ์ QR Code นำทาง</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 pt-0 space-y-4 sm:space-y-5">
        {/* Main Grid */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date */}
          <div className="min-w-0 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CalendarCheck2 className="h-4 w-4 shrink-0" />
              <span>วันที่นัดตรวจ</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white pt-0.5 break-words">
              {formattedDate}
            </p>
          </div>

          {/* Time */}
          <div className="min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Clock className="h-4 w-4 shrink-0" />
              <span>เวลารับบริการ</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white pt-0.5 break-words">
              {timeRange}
            </p>
          </div>

          {/* Package */}
          <div className="min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Stethoscope className="h-4 w-4 shrink-0" />
              <span>โปรแกรมตรวจ</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white pt-0.5 break-words">
              {booking.package?.code || 'PKG-A'}: {booking.package?.name || 'โปรแกรมมาตรฐาน'}
            </p>
          </div>

          {/* Location */}
          <div className="min-w-0 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3.5 border border-slate-200 dark:border-slate-700/60 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>สถานที่</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white pt-0.5 break-words">
              อาคาร Wellness Center ชั้น 3
            </p>
          </div>
        </div>

        {/* Pricing & Entitlement Summary Card */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/30 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                สิทธิ์และค่าบริการ:
              </span>
              {booking.pricingMode === 'FREE' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  🟢 สิทธิ์สวัสดิการ 100% (ตรวจฟรี 0 บาท)
                </span>
              )}
              {booking.pricingMode === 'UPGRADE' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  🔵 สิทธิ์สวัสดิการ + อัปเกรด (ชำระเพิ่ม ฿{booking.totalPrice ?? 0} บาท)
                </span>
              )}
              {booking.pricingMode === 'FLAT_RATE' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                  🟣 อัตราเหมาจ่ายองค์กร (฿{booking.totalPrice ?? booking.flatRatePrice ?? 0} บาท)
                </span>
              )}
              {booking.pricingMode === 'FULL_PAY' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  🟡 ชำระตามอัตราบริการ (฿{booking.totalPrice ?? 0} บาท)
                </span>
              )}
            </div>

            <div className="text-xs font-bold text-slate-900 dark:text-white">
              ค่าใช้จ่ายสุทธิ: <span className="text-emerald-600 dark:text-emerald-400 text-sm">฿{booking.totalPrice ?? 0} บาท</span>
            </div>
          </div>

          {booking.items && booking.items.length > 0 && (() => {
            const freeItems = booking.items.filter((item) => item.isCoveredByEntitlement || item.chargedPrice === 0);
            const paidItems = booking.items.filter((item) => !item.isCoveredByEntitlement && item.chargedPrice > 0);

            return (
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-700/60 space-y-3">
                <p className="text-[11px] font-semibold text-slate-500">
                  รายการตรวจที่เลือก ({booking.items.length} รายการ):
                </p>

                {/* 🟢 สิทธิ์สวัสดิการ (ฟรี) */}
                {freeItems.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="text-[11px] font-bold">
                        รายการสิทธิ์สวัสดิการ (ฟรี {freeItems.length} รายการ):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-0.5">
                      {freeItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                        >
                          {item.itemName} <span className="font-semibold text-emerald-600 dark:text-emerald-400">(ฟรี)</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 🟠 จ่ายเอง (ชำระเพิ่ม) */}
                {paidItems.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/40">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                      <CreditCard className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-[11px] font-bold">
                        รายการที่ต้องชำระเงินเพิ่ม (จ่ายเอง {paidItems.length} รายการ):
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pl-0.5">
                      {paidItems.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200"
                        >
                          {item.itemName} <span className="font-bold font-mono text-amber-700 dark:text-amber-300">(฿{item.chargedPrice})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>


        {/* Rules Notice */}
        <div className="rounded-xl bg-amber-50/90 dark:bg-amber-950/30 p-4 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>ข้อควรปฏิบัติก่อนเข้ารับการตรวจสุขภาพ:</span>
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
            <li>งดน้ำและอาหารหลังเวลา 20.00 น. ก่อนวันตรวจ 1 คืน</li>
            <li>สวมเสื้อผ้าที่สะดวกต่อการเจาะเลือดและเอกซเรย์</li>
            <li>นำบัตรประจำตัวประชาชน แสดงต่อเจ้าหน้าที่ ณ จุดลงทะเบียน</li>
          </ul>
        </div>

        {/* Action Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 pt-2 text-xs">
          <button
            onClick={() => setShowConfirmCancel(true)}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-red-200 dark:border-red-900/40 sm:border-none self-end sm:self-auto"
          >
            ยกเลิกการจอง
          </button>
        </div>


        {/* Confirm Cancel Modal */}
        <ConfirmDialog
          isOpen={showConfirmCancel}
          title="ยกเลิกการจองคิว?"
          message={`การยกเลิกการจองวันที่ ${formattedDate} จะคืนคิวสู่ระบบ`}
          confirmText="ยืนยันยกเลิก"
          cancelText="ย้อนกลับ"
          type="danger"
          onConfirm={handleCancel}
          onCancel={() => setShowConfirmCancel(false)}
          isLoading={isCancelling}
        />

        {/* Printable Ticket Dialog */}
        {showPrintTicket && (
          <PrintableQueueTicket booking={booking} onClose={() => setShowPrintTicket(false)} />
        )}
      </div>
    </div>
  );
}
