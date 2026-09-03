'use client';

import { useRef } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import {
  Hospital,
  Printer,
  X,
  CheckSquare,
} from 'lucide-react';
import { BookingWithDetails } from '@/lib/types';

interface PrintableQueueTicketProps {
  booking: BookingWithDetails;
  onClose: () => void;
}

export function PrintableQueueTicket({ booking, onClose }: PrintableQueueTicketProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const user = booking.user;
  const slot = booking.dailySlot;
  const pkg = booking.package;
  const timeSlot = booking.timeSlot;

  // Format date display
  let dateFormatted = slot?.date || '-';
  if (slot?.date) {
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
    dateFormatted = `วัน${days[dateObj.getDay()]}ที่ ${d} ${thaiMonths[m - 1]} ${y + 543}`;
  }

  const handlePrint = () => {
    window.print();
  };

  useModalLock(true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-xl bg-white p-5 shadow-xl border border-slate-200 my-6">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 print:hidden">
          <span className="text-sm font-semibold text-slate-800">
            ใบนำทางตรวจสุขภาพ (Queue Voucher)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Section Container */}
        <div ref={printRef} className="mt-3 p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50">
          {/* Hospital Header Slip */}
          <div className="text-center border-b border-slate-200 pb-3">
            <div className="flex items-center justify-center gap-1.5 text-slate-800">
              <Hospital className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-sm">
                โรงพยาบาล
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              เอกสารนำทางตรวจสุขภาพประจำปี {booking.campaign?.year}
            </p>
          </div>

          {/* Queue Row */}
          <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400">หมายเลขคิว:</span>
              <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
                {booking.queueNumber || 'A-015'}
              </p>
              <p className="text-xs font-medium text-slate-800">
                {dateFormatted}
              </p>
            </div>
          </div>

          {/* Staff Info Details */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400">บุคลากร:</span>
              <p className="font-medium text-slate-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <span className="text-slate-400">สังกัด:</span>
              <p className="text-slate-800">
                {user?.department}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-slate-400">โปรแกรม:</span>
              <p className="font-medium text-slate-900">
                {pkg?.code || 'PKG-A'}: {pkg?.name || 'โปรแกรมมาตรฐาน'}
              </p>
            </div>
          </div>

          {/* Service Stations Checklist */}
          <div className="mt-3 space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-800 flex items-center gap-1">
              <CheckSquare className="h-3.5 w-3.5 text-slate-500" />
              <span>จุดรับบริการ:</span>
            </h4>

            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                <span>1. ลงทะเบียน ที่ห้อง wellness center ชั้น 3</span>
                <span className="h-3.5 w-3.5 rounded border border-slate-300" />
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                <span>2. เจาะเลือด & ส่งสิ่งส่งตรวจปัสสาวะ</span>
                <span className="h-3.5 w-3.5 rounded border border-slate-300" />
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                <span>3. เอกซเรย์ปอดและหัวใจ (Chest X-Ray)</span>
                <span className="h-3.5 w-3.5 rounded border border-slate-300" />
              </div>
              {pkg?.code === 'PKG-B' && (
                <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                  <span>4. ตรวจคลื่นไฟฟ้าหัวใจ (EKG Room - เฉพาะ PKG-B)</span>
                  <span className="h-3.5 w-3.5 rounded border border-slate-300" />
                </div>
              )}
              <div className="flex items-center justify-between p-1.5 rounded bg-white border border-slate-200">
                <span>5. ซักประวัติ ตรวจร่างกาย & สรุปผลโดยแพทย์</span>
                <span className="h-3.5 w-3.5 rounded border border-slate-300" />
              </div>
            </div>
          </div>

          <div className="mt-3 text-center text-[10px] text-slate-400 border-t border-slate-200 pt-2">
            กรุณานำเอกสารนี้ยื่น ณ จุดลงทะเบียนตามเวลาที่กำหนด
          </div>
        </div>
      </div>
    </div>
  );
}
