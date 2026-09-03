'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DailySlot, User, CheckupPackage, Campaign } from '@/lib/types';
import { BookingModal } from './BookingModal';

interface BookingCalendarProps {
  slots: DailySlot[];
  activeUser: User;
  packages: CheckupPackage[];
  campaign?: Campaign;
  onBookingSuccess?: () => void;
  readOnly?: boolean;
}

const thaiMonthNames = [
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

function getMonthsFromCampaign(campaign?: Campaign) {
  const defaultThaiYear = campaign?.year || 2569;
  const defaultYear = defaultThaiYear > 2500 ? defaultThaiYear - 543 : defaultThaiYear;

  if (!campaign || !campaign.startDate || !campaign.endDate) {
    return [
      { name: `สิงหาคม ${defaultThaiYear}`, year: defaultYear, month: 7 },
      { name: `กันยายน ${defaultThaiYear}`, year: defaultYear, month: 8 },
    ];
  }

  const [startY, startM] = campaign.startDate.split('-').map(Number);
  const [endY, endM] = campaign.endDate.split('-').map(Number);

  const monthList: { name: string; year: number; month: number }[] = [];
  let currY = startY;
  let currM = startM;

  while (currY < endY || (currY === endY && currM <= endM)) {
    const jsMonth = currM - 1;
    const thaiYear = campaign?.year || (currY + 543);
    monthList.push({
      name: `${thaiMonthNames[jsMonth]} ${thaiYear}`,
      year: currY,
      month: jsMonth,
    });

    currM++;
    if (currM > 12) {
      currM = 1;
      currY++;
    }
  }

  return monthList.length > 0
    ? monthList
    : [{ name: `สิงหาคม ${defaultThaiYear}`, year: defaultYear, month: 7 }];
}

export function BookingCalendar({
  slots,
  activeUser,
  packages,
  campaign,
  onBookingSuccess,
  readOnly = false,
}: BookingCalendarProps) {
  const [currentMonthIndex, setCurrentMonthIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<DailySlot | null>(null);
  const [showLineSuccessModal, setShowLineSuccessModal] = useState(false);

  const months = getMonthsFromCampaign(campaign);
  const currentMonth = months[Math.min(currentMonthIndex, months.length - 1)] || months[0];

  // Filter slots for current month
  const monthSlots = slots.filter((slot) => {
    const [y, m] = slot.date.split('-').map(Number);
    return y === currentMonth.year && m === currentMonth.month + 1;
  });

  const firstDate = new Date(currentMonth.year, currentMonth.month, 1);
  const startDayOfWeek = firstDate.getDay();
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();

  const calendarCells: (DailySlot | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(currentMonth.month + 1).padStart(2, '0');
    const dateKey = `${currentMonth.year}-${monthStr}-${dayStr}`;
    const foundSlot = monthSlots.find((s) => s.date === dateKey);
    if (foundSlot) {
      calendarCells.push(foundSlot);
    } else {
      calendarCells.push({
        id: `dummy-${dateKey}`,
        campaignId: campaign?.id || 'cmp-2026',
        date: dateKey,
        quota: campaign?.defaultQuota || 45,
        bookedCount: 0,
        isHoliday: false,
      });
    }
  }

  const isCampaignInactive = campaign?.isActive === false;
  const cutoffDate = campaign?.eligibleStartworkCutoffDate || '2026-04-01';
  const isStartworkIneligible = Boolean(
    activeUser?.startworkDate && activeUser.startworkDate >= cutoffDate
  );

  const availableSlotsCount = (isCampaignInactive || isStartworkIneligible) ? 0 : monthSlots.filter((s) => {
    const isOutside =
      campaign &&
      ((campaign.startDate && s.date < campaign.startDate) ||
        (campaign.endDate && s.date > campaign.endDate));
    return !isOutside && !s.isHoliday && s.bookedCount < s.quota;
  }).length;

  return (
    <div className="space-y-4">
      {/* Startwork Date Cutoff Banner */}
      {isStartworkIneligible && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs">
          <span className="text-base">🚫</span>
          <span>
            ขออภัย บุคลากรที่เริ่มบรรจุ/เข้าทำงานตั้งแต่วันที่ {cutoffDate} เป็นต้นไป (วันเริ่มเข้าทำงานของคุณ: {activeUser.startworkDate}) จะยังไม่มีสิทธิ์เลือกจองคิวบนปฏิทินในโครงการนี้
          </span>
        </div>
      )}

      {/* Campaign Inactive Banner */}
      {isCampaignInactive && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 shadow-2xs">
          <span className="text-base">⚠️</span>
          <span>โครงการตรวจสุขภาพนี้ปิดรับการลงทะเบียนจองคิวชั่วคราว (โดยผู้ดูแลระบบ)</span>
        </div>
      )}

      {/* Top Controls & Month Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{readOnly ? 'ปฏิทินแสดงรอบวันตรวจสุขภาพ' : 'เลือกรอบวันตรวจสุขภาพ'}</span>
            {readOnly ? (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                🔒 อ่านอย่างเดียว (ยืนยันสิทธิ์แล้ว)
              </span>
            ) : isCampaignInactive ? (
              <span className="text-xs font-normal text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/80 px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-900 font-bold">
                🔒 ปิดรับการจองชั่วคราว
              </span>
            ) : null}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {readOnly
              ? 'แสดงข้อมูลรอบวันตรวจสุขภาพเพื่อการอ้างอิง (คุณมีคิวที่ยืนยันแล้วเรียบร้อย)'
              : isCampaignInactive
              ? 'โครงการนี้ปิดรับการลงทะเบียนจองคิวเป็นการชั่วคราว'
              : campaign?.startDate && campaign?.endDate
              ? `เปิดรับจอง: ${campaign.startDate} ถึง ${campaign.endDate} (โควต้า ${campaign.defaultQuota} คน/วัน)`
              : `โควต้าวันละ ${campaign?.defaultQuota || 45} คน`}
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          {months.map((mObj, idx) => (
            <button
              key={`${mObj.year}-${mObj.month}`}
              onClick={() => setCurrentMonthIndex(idx)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                currentMonthIndex === idx
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {mObj.name}
            </button>
          ))}
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <span>เปิดรับจอง</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span>เหลือน้อย (&lt; 5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
            <span>เต็ม</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span>วันหยุด</span>
          </div>
        </div>

        <div className="text-slate-500">
          ว่าง <span className="font-semibold text-slate-900 dark:text-white">{availableSlotsCount}</span> วันในเดือนนี้
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 text-center font-medium text-xs text-slate-400 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="text-red-500">อา</div>
          <div>จ</div>
          <div>อ</div>
          <div>พ</div>
          <div>พฤ</div>
          <div>ศ</div>
          <div className="text-red-500">ส</div>
        </div>

        {/* Date Cells Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {calendarCells.map((slot, idx) => {
            if (!slot) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="h-24 rounded-lg bg-slate-50/50 dark:bg-slate-800/20"
                />
              );
            }

            const dayNum = Number(slot.date.split('-')[2]);
            const remaining = Math.max(0, slot.quota - slot.bookedCount);
            const isFull = slot.bookedCount >= slot.quota && !slot.isHoliday;

            const advanceDays = campaign?.advanceBookingDays ?? 2;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const minBookableDate = new Date(today);
            minBookableDate.setDate(minBookableDate.getDate() + advanceDays);
            const minBookableDateStr = minBookableDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

            const isTooClose = advanceDays > 0 && slot.date < minBookableDateStr;

            const isOutside =
              campaign &&
              ((campaign.startDate && slot.date < campaign.startDate) ||
                (campaign.endDate && slot.date > campaign.endDate));

            const isSelectable = !readOnly && !isCampaignInactive && !isStartworkIneligible && !slot.isHoliday && !isFull && !isOutside && !isTooClose;

            return (
              <div
                key={slot.id}
                onClick={() => isSelectable && setSelectedSlot(slot)}
                className={`flex flex-col justify-between h-24 rounded-xl p-2.5 transition-all border shadow-2xs ${
                  isCampaignInactive
                    ? 'bg-slate-100/90 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    : isOutside
                    ? 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-40 cursor-not-allowed'
                    : slot.isHoliday
                    ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    : isTooClose
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 opacity-75 cursor-not-allowed'
                    : isFull
                    ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900/60 cursor-not-allowed'
                    : readOnly
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 cursor-default opacity-85'
                    : remaining <= 5
                    ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/80 hover:bg-amber-100 dark:hover:bg-amber-900/80 hover:border-amber-400 cursor-pointer'
                    : 'bg-emerald-50/80 dark:bg-emerald-950/50 border-emerald-200/90 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 hover:border-emerald-400 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-bold ${
                    isCampaignInactive || slot.isHoliday || isTooClose
                      ? 'text-slate-400 dark:text-slate-500'
                      : isFull
                      ? 'text-red-700 dark:text-red-300 font-extrabold'
                      : remaining <= 5
                      ? 'text-amber-950 dark:text-amber-100 font-extrabold'
                      : 'text-emerald-950 dark:text-emerald-100 font-extrabold'
                  }`}>
                    {dayNum}
                  </span>

                  {isSelectable && (
                    <span className={`h-2 w-2 rounded-full ${
                      remaining <= 5 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                  )}
                </div>

                <div className="space-y-0.5">
                  {isCampaignInactive ? (
                    <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 block truncate">
                      🔒 ปิดรับการจอง
                    </span>
                  ) : isOutside ? (
                    <span className="text-[10px] text-slate-400">นอกช่วง</span>
                  ) : isTooClose ? (
                    <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold truncate block" title={`ต้องจองล่วงหน้าอย่างน้อย ${advanceDays} วัน`}>
                      🔒 จองก่อน {advanceDays} วัน
                    </span>
                  ) : slot.isHoliday ? (
                    <span className="text-[10px] text-slate-400 truncate block">
                      {slot.holidayNote || 'วันหยุด'}
                    </span>
                  ) : isFull ? (
                    <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400">
                      เต็มแล้ว
                    </span>
                  ) : (
                    <div>
                      <span className={`text-[10px] font-bold block tabular-nums ${
                        remaining <= 5 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'
                      }`}>
                        ว่าง {remaining}/{slot.quota}
                      </span>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${remaining <= 5 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${(slot.bookedCount / slot.quota) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {isSelectable && (
                  <button className="w-full py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    เลือก
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Dialog Modal */}
      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          activeUser={activeUser}
          packages={packages}
          onClose={() => setSelectedSlot(null)}
          onSuccess={() => {
            setSelectedSlot(null);
            if (onBookingSuccess) onBookingSuccess();
          }}
        />
      )}
    </div>
  );
}
