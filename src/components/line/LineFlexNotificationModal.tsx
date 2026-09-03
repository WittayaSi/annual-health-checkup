'use client';

import { useState } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { BookingWithDetails, User } from '@/lib/types';
import {
  MessageSquare,
  CheckCircle2,
  CalendarCheck2,
  Clock,
  User as UserIcon,
  Building2,
  X,
  FileText,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  ChevronRight,
  Bell,
} from 'lucide-react';

interface LineFlexNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: BookingWithDetails | null;
  user?: User | null;
  type?: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELED' | 'PRE_CHECKUP_REMINDER';
  onCancelBooking?: () => void;
  onPrintTicket?: () => void;
}

export function LineFlexNotificationModal({
  isOpen,
  onClose,
  booking,
  user,
  type = 'BOOKING_CONFIRMED',
  onCancelBooking,
  onPrintTicket,
}: LineFlexNotificationModalProps) {
  const [activeCardType, setActiveCardType] = useState<
    'BOOKING_CONFIRMED' | 'BOOKING_CANCELED' | 'PRE_CHECKUP_REMINDER'
  >(type);

  if (!isOpen) return null;

  const targetUser = booking?.user || user;
  const slotDate = booking?.dailySlot?.date || '2026-09-15';
  const timeSlotStr = booking?.timeSlot
    ? `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime} น.`
    : '08:00 - 10:00 น.';
  const queueNum = booking?.queueNumber || 'A-012';
  const packageName = booking?.package
    ? `${booking.package.code}: ${booking.package.name}`
    : 'PKG-B: โปรแกรมตรวจชุดใหญ่ (ฟรีตามสวัสดิการ)';

  useModalLock(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md rounded-2xl bg-[#849EB2] text-slate-900 shadow-2xl overflow-hidden border border-slate-700/30 flex flex-col max-h-[90vh]">
        {/* LINE Chat Header */}
        <div className="bg-[#243545] p-3.5 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-[#00B900] flex items-center justify-center font-bold text-white shadow-sm border border-white/20">
                <MessageSquare className="h-5 w-5 fill-white text-[#00B900]" />
              </div>
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[#243545]" />
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                  @รพ.ท่าสองยาง ตรวจสุขภาพ
                </h3>
                <ShieldCheck className="h-3.5 w-3.5 text-[#00B900] fill-[#00B900]/20" />
              </div>
              <p className="text-[10px] text-slate-300">LINE Official Account (Verified)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Card Type Switcher Tabs (Demo Controls) */}
        <div className="bg-[#1C2A38] px-3 py-1.5 flex items-center justify-between text-[11px] text-slate-300 border-b border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-medium shrink-0">จำลองมุมมอง LINE:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveCardType('BOOKING_CONFIRMED')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeCardType === 'BOOKING_CONFIRMED'
                  ? 'bg-[#00B900] text-white font-bold'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
            >
              บัตรยืนยัน
            </button>
            <button
              onClick={() => setActiveCardType('PRE_CHECKUP_REMINDER')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeCardType === 'PRE_CHECKUP_REMINDER'
                  ? 'bg-amber-500 text-white font-bold'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
            >
              เตือนวันนัด
            </button>
            <button
              onClick={() => setActiveCardType('BOOKING_CANCELED')}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                activeCardType === 'BOOKING_CANCELED'
                  ? 'bg-red-500 text-white font-bold'
                  : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
              }`}
            >
              แจ้งยกเลิก
            </button>
          </div>
        </div>

        {/* LINE Chat Screen Area */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#849EB2] font-sans">
          {/* Timestamp Divider */}
          <div className="text-center">
            <span className="px-3 py-1 rounded-full bg-black/20 text-white text-[10px] font-medium tracking-wide">
              {new Date().toLocaleDateString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>

          {/* LINE Flex Message Bubble Card */}
          <div className="w-full max-w-[340px] mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200/80 animate-in slide-in-from-bottom-2 duration-300">
            {/* Flex Header Banner */}
            {activeCardType === 'BOOKING_CONFIRMED' && (
              <div className="bg-[#00B900] p-4 text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                    LINE Official Alert
                  </span>
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-base font-bold tracking-tight">
                  ยืนยันคิวจองตรวจสุขภาพประจำปี
                </h4>
                <p className="text-xs text-emerald-100">
                  ระบบได้ลงทะเบียนคิวตรวจสุขภาพเรียบร้อยแล้ว
                </p>
              </div>
            )}

            {activeCardType === 'PRE_CHECKUP_REMINDER' && (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                    Reminder Notification
                  </span>
                  <Bell className="h-5 w-5 text-white animate-bounce" />
                </div>
                <h4 className="text-base font-bold tracking-tight">
                  แจ้งเตือนนัดหมายตรวจสุขภาพ (พรุ่งนี้)
                </h4>
                <p className="text-xs text-amber-100">
                  กรุณาเตรียมตัวงดน้ำและอาหารหลัง 20:00 น.
                </p>
              </div>
            )}

            {activeCardType === 'BOOKING_CANCELED' && (
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 text-white space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 uppercase tracking-wider">
                    Status Updated
                  </span>
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-base font-bold tracking-tight">
                  แจ้งการยกเลิกสิทธิ์คิวจอง
                </h4>
                <p className="text-xs text-red-100">
                  คิวจองตรวจสุขภาพของคุณถูกยกเลิกแล้ว
                </p>
              </div>
            )}

            {/* Flex Message Details Body */}
            <div className="p-4 space-y-3.5 text-xs text-slate-700">
              {/* Highlight Queue Box */}
              {activeCardType !== 'BOOKING_CANCELED' && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center space-y-0.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    หมายเลขคิวของคุณ
                  </span>
                  <div className="text-2xl font-black tracking-wider text-[#00B900] font-mono">
                    {queueNum}
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 block">
                    {targetUser?.firstName} {targetUser?.lastName} ({targetUser?.organization || targetUser?.department || 'โรงพยาบาลท่าสองยาง'})
                  </span>
                </div>
              )}

              {/* Data Pairs Grid */}
              <div className="space-y-2.5 border-t border-b border-slate-100 py-3">
                <div className="flex items-start gap-2">
                  <UserIcon className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block">ชื่อบุคลากร</span>
                    <span className="font-semibold text-slate-900">
                      {targetUser?.firstName} {targetUser?.lastName}
                    </span>

                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block">สังกัด / หน่วยงาน</span>
                    <span className="font-medium text-slate-800">
                      {targetUser?.organization || targetUser?.department || 'โรงพยาบาลท่าสองยาง'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CalendarCheck2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block">วันที่และเวลาตรวจ</span>
                    <span className="font-semibold text-slate-900">
                      {new Date(slotDate).toLocaleDateString('th-TH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}{' '}
                      · {timeSlotStr}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 block">โปรแกรมตรวจสุขภาพ</span>
                    <span className="font-medium text-slate-800">{packageName}</span>
                  </div>
                </div>
              </div>

              {/* Fasting Notice */}
              {activeCardType === 'PRE_CHECKUP_REMINDER' && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    <span>ข้อปฏิบัติสำคัญก่อนตรวจ:</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                    <li>งดน้ำและอาหารทุกชนิดหลังเวลา 20:00 น. ก่อนวันตรวจ</li>
                    <li>สวมเสื้อคลุมสั้นเปิดแขนสะดวกสำหรับการเจาะเลือด</li>
                    <li>นำบัตรประชาชนและบัตรคิวนี้มายื่น ณ จุดลงทะเบียน</li>
                  </ul>
                </div>
              )}

              {/* Flex Action Buttons Footer */}
              <div className="pt-1 space-y-2">
                {activeCardType === 'BOOKING_CONFIRMED' && (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        if (onPrintTicket) onPrintTicket();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#00B900] hover:bg-[#009900] text-white font-bold text-xs transition-colors shadow-sm"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>เปิดบัตรคิวและ QR Code</span>
                    </button>

                    {onCancelBooking && (
                      <button
                        onClick={() => {
                          onClose();
                          if (onCancelBooking) onCancelBooking();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-medium text-xs transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>ยกเลิกการจองคิวนี้</span>
                      </button>
                    )}
                  </>
                )}

                {activeCardType === 'PRE_CHECKUP_REMINDER' && (
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>รับทราบข้อปฏิบัติ</span>
                  </button>
                )}

                {activeCardType === 'BOOKING_CANCELED' && (
                  <button
                    onClick={onClose}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
                  >
                    <span>เลือกวันจองคิวใหม่</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* LINE Brand Footer */}
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Powered by LINE Official Account</span>
              <span className="font-mono">Ref: {booking?.id || 'BK-DEMO'}</span>
            </div>
          </div>

          {/* Time Stamp label under message */}
          <div className="text-right text-[10px] text-slate-200 pr-4">
            {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น. · อ่านแล้ว
          </div>
        </div>
      </div>
    </div>
  );
}
