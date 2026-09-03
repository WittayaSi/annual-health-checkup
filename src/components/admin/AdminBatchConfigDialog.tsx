'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import { Layers, Users, Check, X } from 'lucide-react';
import { Campaign } from '@/lib/types';
import { batchUpdateSlotsAction } from '@/app/actions';

interface AdminBatchConfigDialogProps {
  campaign?: Campaign;
  onSuccess?: () => void;
}

export function AdminBatchConfigDialog({ campaign, onSuccess }: AdminBatchConfigDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [startDate, setStartDate] = useState(campaign?.startDate || '2026-08-01');
  const [endDate, setEndDate] = useState(campaign?.endDate || '2026-08-31');
  const [quota, setQuota] = useState(campaign?.defaultQuota || 45);
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayNote, setHolidayNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (campaign) {
      setStartDate(campaign.startDate);
      setEndDate(campaign.endDate);
      setQuota(campaign.defaultQuota);
    }
  }, [campaign]);

  const handleOpen = () => {
    if (campaign) {
      setStartDate(campaign.startDate);
      setEndDate(campaign.endDate);
      setQuota(campaign.defaultQuota);
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsOpen(true);
  };

  const handleApplyBatch = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await batchUpdateSlotsAction(
      startDate,
      endDate,
      quota,
      isHoliday,
      isHoliday ? holidayNote || 'วันหยุด' : undefined,
      campaign?.id
    );

    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`ปรับปรุงสล็อตสำเร็จ ${res.updatedCount} วัน`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการปรับสล็อต');
    }
  };

  useModalLock(isOpen && mounted);

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <Layers className="h-3.5 w-3.5 text-slate-400" />
        <span>ปรับโควต้าเป็นช่วงวัน (Batch Edit)</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ปรับแต่งสล็อตหลายวัน (Batch Update)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {campaign ? `${campaign.name} (${campaign.year})` : 'กำหนดโควต้าหลายวันพร้อมกัน'}
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
              {/* Date Range Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    จากวันที่
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Holiday Toggle */}
              <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-800/40">
                <div>
                  <label className="text-xs font-medium text-slate-900 dark:text-white block">
                    กำหนดเป็นวันหยุด
                  </label>
                  <p className="text-[11px] text-slate-400">
                    วันที่มีผู้จองแล้วจะไม่ถูกปรับเป็นวันหยุด
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHoliday(!isHoliday)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isHoliday ? 'bg-slate-800 dark:bg-slate-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                      isHoliday ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {isHoliday ? (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    หมายเหตุวันหยุด
                  </label>
                  <input
                    type="text"
                    placeholder="วันหยุดราชการประจำปี"
                    value={holidayNote}
                    onChange={(e) => setHolidayNote(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    โควต้าใหม่ต่อวัน (คน)
                  </label>
                  <input
                    type="number"
                    min={1}
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

              {successMsg && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/40 p-2.5 text-xs text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
                  {successMsg}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatch}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>กำลังปรับปรุง...</span>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>ยืนยัน</span>
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
