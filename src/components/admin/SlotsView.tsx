'use client';

import { useState, useMemo } from 'react';
import { useAdminContext } from './AdminLayoutClientWrapper';
import { formatThaiDate } from '@/lib/item-utils';
import { DailySlot } from '@/lib/types';
import {
  Users,
  CheckCircle,
  Stethoscope,
  Percent,
  Search,
  CalendarCheck2,
  CalendarDays,
} from 'lucide-react';
import { EditDailySlotDialog } from './EditDailySlotDialog';
import { AdminBatchConfigDialog } from './AdminBatchConfigDialog';
import { SlotBookingsDialog } from './SlotBookingsDialog';

export function SlotsView() {
  const {
    campaign,
    campaigns,
    slots,
    bookings,
    users,
    selectedCampaignId,
    onRefresh,
  } = useAdminContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'available' | 'full' | 'holiday'>('open');
  const [selectedSlotForBookings, setSelectedSlotForBookings] = useState<DailySlot | null>(null);

  // Active slots for selected campaign (excluding weekends)
  const campaignSlots = useMemo(() => {
    const rawSlots = selectedCampaignId === 'ALL' ? slots : slots.filter((s) => s.campaignId === selectedCampaignId);
    return rawSlots.filter((slot) => {
      const day = new Date(slot.date + 'T00:00:00').getDay();
      return day !== 0 && day !== 6;
    });
  }, [slots, selectedCampaignId]);

  const activeSlots = campaignSlots.filter((s) => !s.isHoliday);
  const totalQuota = activeSlots.reduce((acc, s) => acc + s.quota, 0);
  const totalBooked = activeSlots.reduce((acc, s) => acc + s.bookedCount, 0);
  const remainingQuota = Math.max(0, totalQuota - totalBooked);
  const occupancyRate = totalQuota > 0 ? ((totalBooked / totalQuota) * 100).toFixed(1) : '0';

  const selectedCampaign = useMemo(() => {
    if (selectedCampaignId === 'ALL') return null;
    return campaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  const activeStaffUsers = useMemo(() => {
    const filtered = users.filter((u) => u.isActive !== false && u.username !== 'sys_admin');
    if (!selectedCampaign || !selectedCampaign.organization || selectedCampaign.organization === 'ทั้งหมด') {
      return filtered;
    }
    const targetOrg = selectedCampaign.organization.trim().toLowerCase();
    return filtered.filter((u) => {
      const uOrg = (u.organization || '').trim().toLowerCase();
      const uDept = (u.department || '').trim().toLowerCase();
      return uOrg === targetOrg || uDept === targetOrg;
    });
  }, [users, selectedCampaign]);

  const confirmedBookings = useMemo(() => {
    return selectedCampaignId === 'ALL'
      ? bookings.filter((b) => b.status === 'CONFIRMED')
      : bookings.filter((b) => b.status === 'CONFIRMED' && b.campaignId === selectedCampaignId);
  }, [bookings, selectedCampaignId]);

  const pkgACount = confirmedBookings.filter((b) => b.packageId === 'pkg-a' || b.package?.code === 'PKG-A').length;
  const pkgBCount = confirmedBookings.filter((b) => b.packageId === 'pkg-b' || b.package?.code === 'PKG-B').length;

  const activeStaffCount = activeStaffUsers.length;
  const bookedUserIds = new Set(confirmedBookings.map((b) => b.userId));
  const bookedStaffCount = bookedUserIds.size;
  const bookingRate = activeStaffCount > 0 ? ((bookedStaffCount / activeStaffCount) * 100).toFixed(1) : '0';

  const filteredSlots = useMemo(() => {
    return campaignSlots.filter((slot) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const dateMatch =
          slot.date.includes(q) ||
          formatThaiDate(slot.date, 'full').toLowerCase().includes(q) ||
          formatThaiDate(slot.date, 'with-day').toLowerCase().includes(q);
        const noteMatch = slot.holidayNote?.toLowerCase().includes(q);
        if (!dateMatch && !noteMatch) return false;
      }

      if (statusFilter === 'open' || statusFilter === 'available') return !slot.isHoliday;
      if (statusFilter === 'holiday') return slot.isHoliday;
      if (statusFilter === 'full') return !slot.isHoliday && slot.bookedCount >= slot.quota;

      return true;
    });
  }, [campaignSlots, searchTerm, statusFilter]);

  const sortedSlots = [...filteredSlots].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Dynamic Metric Cards per Selected Campaign */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Quota */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">โควต้ารวมในโครงการ</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {totalQuota} คน
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            โควต้าเฉลี่ย {campaign.defaultQuota} คน/วัน
          </p>
        </div>

        {/* Total Booked */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">จำนวนจองแล้ว</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {totalBooked} คน
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            เหลือที่ว่าง {remainingQuota} ที่นั่ง
          </p>
        </div>

        {/* Package Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover-lift">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">สัดส่วนโปรแกรมตรวจ</span>
            <Stethoscope className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-0.5">
            <span className="text-slate-600 dark:text-slate-300 font-medium">PKG-A (&lt;35ปี): {pkgACount} คน</span>
            <span className="text-slate-600 dark:text-slate-300 font-medium">PKG-B (≥35ปี): {pkgBCount} คน</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden flex">
            <div
              className="bg-blue-500 h-full"
              style={{ width: `${confirmedBookings.length > 0 ? (pkgACount / confirmedBookings.length) * 100 : 0}%` }}
            />
            <div
              className="bg-emerald-500 h-full"
              style={{ width: `${confirmedBookings.length > 0 ? (pkgBCount / confirmedBookings.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Occupancy & Staff Booking Rate */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs hover-lift">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">อัตราการจองเต็ม</span>
            <Percent className="h-4 w-4 text-purple-500" />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">ต่อที่นั่ง (Quota)</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                {occupancyRate}%
              </p>
              <p className="text-[10px] text-slate-400">
                ({totalBooked}/{totalQuota} คิว)
              </p>
            </div>
            <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">ต่อเจ้าหน้าที่</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {bookingRate}%
              </p>
              <p className="text-[10px] text-slate-400">
                ({bookedStaffCount}/{activeStaffCount} คน)
              </p>
            </div>
          </div>

          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full mt-2.5 overflow-hidden flex gap-1">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Number(occupancyRate))}%` }}
              title={`ต่อที่นั่ง: ${occupancyRate}%`}
            />
          </div>
        </div>
      </div>

      {/* Slots Table Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
        {/* Header & Actions */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-emerald-600" />
              <span>ตารางโควต้าและสล็อตการจองรายวัน ({sortedSlots.length} วัน)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              แสดงรายการเฉพาะวันทำการ (จันทร์-ศุกร์) ตามปฏิทินของโครงการ
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <AdminBatchConfigDialog campaign={campaign} onSuccess={onRefresh} />

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="open">เปิดรับคิวปกติ</option>
              <option value="all">แสดงทุกวัน (รวมวันหยุด)</option>
              <option value="full">คิวเต็มแล้ว</option>
              <option value="holiday">วันหยุดงดตรวจ</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาวันที่..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Slots Table Render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">วันที่ตรวจ</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
                <th className="py-3 px-4 text-center">โควต้าทั้งหมด</th>
                <th className="py-3 px-4 text-center">จองแล้ว</th>
                <th className="py-3 px-4 text-center">คงเหลือ</th>
                <th className="py-3 px-4">อัตราส่วนการจอง</th>
                <th className="py-3 px-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sortedSlots.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    ไม่พบข้อมูลสล็อตตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                sortedSlots.map((slot) => {
                  const isFull = slot.bookedCount >= slot.quota;
                  const remaining = Math.max(0, slot.quota - slot.bookedCount);
                  const percent = slot.quota > 0 ? (slot.bookedCount / slot.quota) * 100 : 0;

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{formatThaiDate(slot.date, 'with-day')}</span>
                          {slot.holidayNote && (
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                              ({slot.holidayNote})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {slot.isHoliday ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                            วันหยุดงดตรวจ
                          </span>
                        ) : isFull ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300">
                            คิวเต็มแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                            เปิดรับปกติ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums">{slot.quota}</td>
                      <td className="py-3 px-4 text-center tabular-nums font-medium">
                        {slot.bookedCount > 0 ? (
                          <button
                            onClick={() => setSelectedSlotForBookings(slot)}
                            className="text-emerald-600 dark:text-emerald-400 hover:underline transition-all cursor-pointer font-semibold"
                            title="คลิกเพื่อดูรายชื่อผู้จองประจำวันนี้"
                          >
                            {slot.bookedCount} คน
                          </button>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center tabular-nums">
                        {slot.isHoliday ? '-' : remaining}
                      </td>
                      <td className="py-3 px-4 min-w-[120px]">
                        {slot.isHoliday ? (
                          <span className="text-xs text-slate-400">-</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isFull ? 'bg-red-500' : remaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 tabular-nums">{percent.toFixed(0)}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {slot.bookedCount > 0 && (
                            <button
                              onClick={() => setSelectedSlotForBookings(slot)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                              title="ดูรายชื่อผู้จองประจำวันนี้"
                            >
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <span>รายชื่อ ({slot.bookedCount})</span>
                            </button>
                          )}
                          <EditDailySlotDialog slot={slot} />
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

      {/* SLOT BOOKINGS DIALOG */}
      {selectedSlotForBookings && (
        <SlotBookingsDialog
          slot={selectedSlotForBookings}
          bookings={bookings}
          dailySlots={campaignSlots}
          onClose={() => setSelectedSlotForBookings(null)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
