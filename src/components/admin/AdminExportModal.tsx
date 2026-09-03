'use client';

import { useState } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { FileSpreadsheet, FileText, Download, X, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { BookingWithDetails } from '@/lib/types';
import { getBookingsAction } from '@/app/actions';

interface AdminExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  campaignId?: string;
  dateFilter?: string;
  bookingsData?: BookingWithDetails[];
}

export function AdminExportModal({
  isOpen,
  onClose,
  title = 'ส่งออกข้อมูลการจองคิวตรวจสุขภาพ',
  subtitle = 'เลือกรูปแบบไฟล์ที่ต้องการส่งออก (Excel หรือ CSV)',
  campaignId,
  dateFilter,
  bookingsData,
}: AdminExportModalProps) {
  const [fileFormat, setFileFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useModalLock(isOpen);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      // 1. Get bookings list
      let list = bookingsData || [];
      if (list.length === 0) {
        try {
          const rawBookings = await getBookingsAction();
          list = rawBookings.filter((b) => b.status === 'CONFIRMED');
        } catch (fetchErr) {
          console.error('Failed to fetch bookings for export:', fetchErr);
        }
      }

      if (campaignId && campaignId !== 'ALL') {
        list = list.filter((b) => b.campaignId === campaignId || b.dailySlot?.campaignId === campaignId);
      }
      if (dateFilter) {
        list = list.filter((b) => b.dailySlot?.date === dateFilter);
      }

      // 2. Map data rows with Thai column titles
      const mappedRows = list.map((b, idx) => {
        const userAge = b.user?.dob ? (new Date().getFullYear() - new Date(b.user.dob).getFullYear()) : '';
        const modeStr = b.pricingMode === 'FREE' ? 'ฟรีสวัสดิการ 100%' : b.pricingMode === 'UPGRADE' ? 'ฟรีสวัสดิการ + ชำระส่วนต่าง' : b.pricingMode === 'FLAT_RATE' ? 'เหมาจ่าย' : 'ชำระเต็มราคา';

        return {
          'ลำดับ': idx + 1,
          'เลขคิว': b.queueNumber || '',
          'Hospital Username': b.user?.username || '',
          'เลขบัตรประชาชน': b.user?.nationalId || '',
          'ชื่อ-นามสกุล': `${b.user?.firstName || ''} ${b.user?.lastName || ''}`.trim(),
          'เพศ': b.user?.gender === 'FEMALE' ? 'หญิง' : 'ชาย',
          'อายุ (ปี)': userAge,
          'สังกัดองค์กรหลัก': b.user?.organization || 'โรงพยาบาลท่าสองยาง',
          'แผนก/หน่วยงานย่อย': b.user?.department || '',
          'ตำแหน่ง': b.user?.position || '',
          'วันที่ตรวจ': b.dailySlot?.date || '',
          'รอบเวลา': b.timeSlot ? `${b.timeSlot.startTime}-${b.timeSlot.endTime}` : '08:00-10:00',
          'โปรแกรมตรวจ': `${b.package?.code || 'PKG-A'}: ${b.package?.name || ''}`,
          'รูปแบบสิทธิ์': modeStr,
          'ค่าใช้จ่ายสุทธิ (บาท)': b.totalPrice !== undefined ? b.totalPrice : 0,
          'สถานะ': b.status === 'CONFIRMED' ? 'ยืนยันสิทธิ์' : 'ยกเลิก',
          'หมายเหตุ': b.notes || '',
        };
      });

      const baseFilename = dateFilter
        ? `health_checkup_bookings_${dateFilter}`
        : campaignId && campaignId !== 'ALL'
        ? `health_checkup_bookings_campaign_${campaignId}`
        : `health_checkup_bookings_all`;

      // 3. Export as XLSX or CSV using SheetJS
      if (mappedRows.length === 0) {
        alert('ไม่พบข้อมูลการจองคิวตามเงื่อนไขที่เลือก');
        setIsExporting(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(mappedRows);

      // Auto-adjust column widths for Excel
      const colWidths = [
        { wch: 8 },  // ลำดับ
        { wch: 14 }, // เลขคิว
        { wch: 20 }, // Username
        { wch: 18 }, // เลขบัตรประชาชน
        { wch: 26 }, // ชื่อ-นามสกุล
        { wch: 8 },  // เพศ
        { wch: 10 }, // อายุ (ปี)
        { wch: 26 }, // สังกัดองค์กรหลัก
        { wch: 22 }, // แผนกย่อย
        { wch: 20 }, // ตำแหน่ง
        { wch: 14 }, // วันที่ตรวจ
        { wch: 14 }, // รอบเวลา
        { wch: 24 }, // โปรแกรมตรวจ
        { wch: 24 }, // รูปแบบสิทธิ์
        { wch: 18 }, // ค่าใช้จ่ายสุทธิ (บาท)
        { wch: 14 }, // สถานะ
        { wch: 24 }, // หมายเหตุ
      ];

      worksheet['!cols'] = colWidths;

      if (fileFormat === 'xlsx') {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อผู้จองคิว');
        XLSX.writeFile(workbook, `${baseFilename}.xlsx`);
      } else {
        const csvText = XLSX.utils.sheet_to_csv(worksheet);
        const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
        const blob = new Blob([bom, csvText], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, `${baseFilename}.csv`);
      }

      setSuccessMsg(`ส่งออกไฟล์ ${fileFormat.toUpperCase()} สำเร็จ (${mappedRows.length} รายการ)`);
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error('Export error:', err);
      alert(`เกิดข้อผิดพลาดในการส่งออกไฟล์: ${err?.message || 'โปรดลองอีกครั้ง'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
            รูปแบบไฟล์ที่ต้องการส่งออก (File Format):
          </label>

          <div className="grid grid-cols-2 gap-3">
            {/* XLSX Option */}
            <button
              type="button"
              onClick={() => setFileFormat('xlsx')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                fileFormat === 'xlsx'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${fileFormat === 'xlsx' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <FileSpreadsheet className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold">Microsoft Excel (.xlsx)</span>
              <span className="text-[10px] text-slate-500 text-center">แนะนำสำหรับ Excel / Sheets</span>
            </button>

            {/* CSV Option */}
            <button
              type="button"
              onClick={() => setFileFormat('csv')}
              className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                fileFormat === 'csv'
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className={`p-2.5 rounded-xl ${fileFormat === 'csv' ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold">ไฟล์ CSV (.csv)</span>
              <span className="text-[10px] text-slate-500 text-center">UTF-8 BOM ภาษาไทยไม่เพี้ยน</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'กำลังส่งออก...' : `ดาวน์โหลดไฟล์ .${fileFormat}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
