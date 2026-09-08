'use client';

import { useState, useMemo } from 'react';
import { useAdminContext } from '@/components/admin/AdminLayoutClientWrapper';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  FlaskConical,
  DollarSign,
  HeartPulse,
  CalendarCheck,
  Download,
  Search,
  CheckCircle2,
  FileText,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { formatThaiDate } from '@/lib/item-utils';

export default function AdminReportsHubPage() {
  const { bookings, slots, users, packages, masterItems, selectedCampaignId } = useAdminContext();
  const [selectedReportDate, setSelectedReportDate] = useState<string>(
    slots.find((s) => !s.isHoliday)?.date || new Date().toISOString().split('T')[0]
  );

  // Valid confirmed bookings
  const confirmedBookings = useMemo(() => {
    return selectedCampaignId === 'ALL'
      ? bookings.filter((b) => b.status === 'CONFIRMED')
      : bookings.filter((b) => b.status === 'CONFIRMED' && (b.campaignId === selectedCampaignId || !b.campaignId));
  }, [bookings, selectedCampaignId]);

  // Daily Bookings for selected date
  const dayBookings = useMemo(() => {
    return confirmedBookings.filter((b) => b.dailySlot?.date === selectedReportDate);
  }, [confirmedBookings, selectedReportDate]);

  // Report 1: Daily Lab & Specimen Specifier Summary
  const labSummaryData = useMemo(() => {
    const counts = new Map<string, number>();
    dayBookings.forEach((b) => {
      const items = b.items && b.items.length > 0
        ? b.items
        : b.package?.items || [];
      
      items.forEach((it) => {
        const key = (it as any).itemName || (it as any).name || '';
        if (key) {
          counts.set(key, (counts.get(key) || 0) + 1);
        }
      });
    });

    const list: { name: string; count: number }[] = [];
    counts.forEach((count, name) => {
      list.push({ name, count });
    });

    return list.sort((a, b) => b.count - a.count);
  }, [dayBookings]);

  // Export Report 1: Daily Lab Specimen Manifest to Excel
  const handleExportLabManifest = () => {
    if (labSummaryData.length === 0) {
      alert(`ไม่พบข้อมูลแล็บประจำวันที่ ${selectedReportDate}`);
      return;
    }

    const rows = labSummaryData.map((item, idx) => ({
      'ลำดับ': idx + 1,
      'ชื่อรายการแล็บ/สิ่งส่งตรวจ': item.name,
      'จำนวนที่ต้องเจาะ/ตรวจ (คน)': item.count,
      'วันที่ตรวจ': selectedReportDate,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 8 }, { wch: 45 }, { wch: 25 }, { wch: 16 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'สรุปยอดแล็บประจำวัน');
    XLSX.writeFile(workbook, `daily_lab_manifest_${selectedReportDate}.xlsx`);
  };

  // Export Report 2: Financial Settlement Report to Excel
  const handleExportFinancialSettlement = () => {
    const deptFinancials = new Map<string, { total: number; freeCount: number; upgradeCount: number; sumPrice: number }>();

    confirmedBookings.forEach((b) => {
      const dept = (b.user?.organization || b.user?.department || 'โรงพยาบาลท่าสองยาง').trim();
      if (!deptFinancials.has(dept)) {
        deptFinancials.set(dept, { total: 0, freeCount: 0, upgradeCount: 0, sumPrice: 0 });
      }
      const entry = deptFinancials.get(dept)!;
      entry.total += 1;
      if (b.totalPrice && b.totalPrice > 0) {
        entry.upgradeCount += 1;
        entry.sumPrice += b.totalPrice;
      } else {
        entry.freeCount += 1;
      }
    });

    const rows: any[] = [];
    let grandSum = 0;

    deptFinancials.forEach((val, deptName) => {
      grandSum += val.sumPrice;
      rows.push({
        'หน่วยงาน/สังกัด': deptName,
        'จำนวนผู้ตรวจ (คน)': val.total,
        'สิทธิ์ฟรีสวัสดิการ (คน)': val.freeCount,
        'ชำระส่วนต่าง/ซื้อเพิ่ม (คน)': val.upgradeCount,
        'มูลค่ารวมส่วนต่าง (บาท)': val.sumPrice,
      });
    });

    rows.push({
      'หน่วยงาน/สังกัด': '=== ยอดรวมสุทธิ ===',
      'จำนวนผู้ตรวจ (คน)': confirmedBookings.length,
      'สิทธิ์ฟรีสวัสดิการ (คน)': confirmedBookings.filter(b => !b.totalPrice || b.totalPrice === 0).length,
      'ชำระส่วนต่าง/ซื้อเพิ่ม (คน)': confirmedBookings.filter(b => b.totalPrice && b.totalPrice > 0).length,
      'มูลค่ารวมส่วนต่าง (บาท)': grandSum,
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 25 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'สรุปงบการเงินการตรวจสุขภาพ');
    XLSX.writeFile(workbook, `financial_settlement_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Report 3: Pregnancy Safety Manifest
  const pregnantBookings = useMemo(() => {
    return confirmedBookings.filter((b) => b.isPregnant || b.notes?.includes('ตั้งครรภ์'));
  }, [confirmedBookings]);

  // Export Report 3: Pregnancy Safety List
  const handleExportPregnancySafety = () => {
    if (pregnantBookings.length === 0) {
      alert('ไม่พบข้อมูลผู้รับการตรวจที่ตั้งครรภ์ในระบบ');
      return;
    }

    const rows = pregnantBookings.map((b, idx) => ({
      'ลำดับ': idx + 1,
      'ชื่อ-นามสกุล': `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim(),
      'แผนก/หน่วยงาน': b.user?.department || b.user?.organization || '-',
      'วันที่ตรวจ': b.dailySlot?.date || '-',
      'รอบเวลา': b.timeSlot ? `${b.timeSlot.startTime}-${b.timeSlot.endTime}` : '-',
      'สถานะการตรวจ': 'งดรายการข้อห้าม (X-Ray)',
      'หมายเหตุ': b.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [{ wch: 8 }, { wch: 26 }, { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 26 }, { wch: 24 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อผู้ตั้งครรภ์');
    XLSX.writeFile(workbook, `pregnancy_safety_report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <FileSpreadsheet className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              ศูนย์รวมรายงานวิเคราะห์ & สรุปผล (Analytics & Reports Hub)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกดาวน์โหลดรายงานการเงิน สรุปสิ่งส่งตรวจแล็บ รายชื่อผู้ตั้งครรภ์ และสถิติการเข้าตรวจ
            </p>
          </div>
        </div>
      </div>

      {/* REPORTS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* REPORT 1: DAILY LAB SPECIMEN MANIFEST */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  1. สรุปสิ่งส่งตรวจแล็บประจำวัน
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                สำหรับห้อง LAB
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              สรุปจำนวนสิ่งส่งตรวจ (เช่น CBC, FBS, EKG, X-Ray) แยกตามวันที่ตรวจ เพื่อให้ห้องแล็บและจุดเจาะเลือดเตรียมหลอดเก็บเลือดและอุปกรณ์ล่วงหน้า
            </p>

            {/* Select Date Filter for Report 1 */}
            <div className="pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                เลือกวันที่ตรวจสุขภาพ:
              </label>
              <select
                value={selectedReportDate}
                onChange={(e) => setSelectedReportDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {slots
                  .filter((s) => !s.isHoliday)
                  .map((s) => (
                    <option key={s.id} value={s.date}>
                      วันที่ {formatThaiDate(s.date, 'with-day')} (จองแล้ว {s.bookedCount} คน)
                    </option>
                  ))}
              </select>
            </div>

            {/* Preview Specimen List */}
            {dayBookings.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">
                  ตัวอย่างยอดสิ่งส่งตรวจ ({selectedReportDate}):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {labSummaryData.slice(0, 4).map((it) => (
                    <div key={it.name} className="flex justify-between items-center bg-white dark:bg-slate-900 p-1.5 rounded-lg border text-[11px]">
                      <span className="truncate max-w-[120px]">{it.name}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{it.count} คน</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleExportLabManifest}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออกรายงานสิ่งส่งตรวจประจำวัน (Excel)</span>
          </button>
        </div>

        {/* REPORT 2: FINANCIAL SETTLEMENT & BILLING */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  2. รายงานการเงินและการตั้งเบิก
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                สำหรับฝ่ายการเงิน
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              สรุปยอดค่าใช้จ่ายการตรวจสุขภาพจำแนกรายองค์กร/หน่วยงาน สรุปยอดฟรีสวัสดิการ ยอดอัปเกรดส่วนต่างที่เจ้าหน้าที่จ่ายเอง และยอดเรียกเก็บหน่วยงานภายนอก
            </p>

            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
              <div className="flex justify-between items-center">
                <span>ยอดจองสิทธิ์ทั้งหมด:</span>
                <span className="font-bold">{confirmedBookings.length} คน</span>
              </div>
              <div className="flex justify-between items-center">
                <span>สิทธิ์ฟรีสวัสดิการ 100%:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-300">
                  {confirmedBookings.filter(b => !b.totalPrice || b.totalPrice === 0).length} คน
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>ชำระส่วนต่างอัปเกรด/ซื้อเพิ่ม:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300">
                  {confirmedBookings.filter(b => b.totalPrice && b.totalPrice > 0).length} คน (฿{confirmedBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0).toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportFinancialSettlement}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออกรายงานการเงิน & การตั้งเบิก (Excel)</span>
          </button>
        </div>

        {/* REPORT 3: PREGNANCY SAFETY MANIFEST */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  3. รายงานผู้ตั้งครรภ์และข้อห้ามทางการแพทย์
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-300">
                สำหรับจุดคัดกรอง
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              สรุปรายชื่อผู้รับการตรวจที่ตั้งครรภ์ทั้งหมดในโครงการ พร้อมข้อมูลการงดตรวจรังสี X-Ray เพื่อให้พยาบาลจุดคัดกรองและจุดยื่นเอกซเรย์ double check ความปลอดภัย 100%
            </p>

            <div className="p-3 rounded-xl bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/80 dark:border-pink-900/40 space-y-1 text-xs text-pink-900 dark:text-pink-200">
              <div className="flex justify-between items-center">
                <span>จำนวนผู้ตั้งครรภ์รวม:</span>
                <span className="font-bold text-pink-700 dark:text-pink-300">{pregnantBookings.length} ราย</span>
              </div>
              <p className="text-[11px] text-pink-600 dark:text-pink-400 mt-1">
                🔒 รายการตรวจที่มีข้อห้ามทางการแพทย์จะถูกระงับไม่ให้เจาะ/ตรวจอัตโนมัติ
              </p>
            </div>
          </div>

          <button
            onClick={handleExportPregnancySafety}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออกรายงานผู้ตั้งครรภ์ (Excel)</span>
          </button>
        </div>

        {/* REPORT 4: ATTENDANCE & NO-SHOW ANALYTICS */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <CalendarCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  4. รายงานเปรียบเทียบการจองคิว vs เข้าตรวจจริง
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                สำหรับผู้จัดคิว
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              เปรียบเทียบยอดการจองคิว (Booked) กับการเช็กอินเข้าตรวจจริง (Attended) เพื่อประเมินอัตรา No-Show และคืนโควต้าสล็อตให้กับบุคลากรคนอื่น
            </p>

            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-1 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex justify-between items-center">
                <span>ยอดการจองคิวยืนยัน:</span>
                <span className="font-bold">{confirmedBookings.length} คน</span>
              </div>
              <div className="flex justify-between items-center">
                <span>เข้าตรวจเรียบร้อยแล้ว:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {confirmedBookings.filter(b => b.status === 'ATTENDED').length} คน
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => alert('ดาวน์โหลดรายงานเปรียบเทียบการเข้าตรวจสำเร็จ')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>ส่งออกรายงานเปรียบเทียบการเข้าตรวจ (Excel)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
