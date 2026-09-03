'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  Settings,
  Plus,
  Edit2,
  Power,
  Trash2,
  AlertTriangle,
  X,
  Info,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { Campaign, Organization, DailySlot, BookingWithDetails } from '@/lib/types';
import {
  createCampaignAction,
  updateCampaignByIdAction,
  toggleCampaignActiveAction,
  deleteCampaignAction,
} from '@/app/actions';

interface AdminCampaignConfigDialogProps {
  campaign: Campaign;
  campaigns?: Campaign[];
  organizations?: Organization[];
  departments?: Organization[];
  slots?: DailySlot[];
  bookings?: BookingWithDetails[];
  onSuccess?: () => void;
}

export function AdminCampaignConfigDialog({
  campaign,
  campaigns = [],
  organizations = [],
  departments = [],
  slots = [],
  bookings = [],
  onSuccess,
}: AdminCampaignConfigDialogProps) {
  const orgList = organizations.length > 0 ? organizations : departments;
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign>(campaign);

  // Form State
  const [name, setName] = useState('');
  const [targetDepartment, setTargetDepartment] = useState('ทั้งหมด');
  const [year, setYear] = useState<number>(new Date().getFullYear() + 543);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [defaultQuota, setDefaultQuota] = useState(45);
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [advanceBookingDays, setAdvanceBookingDays] = useState<number>(2);
  const [eligibleStartworkCutoffDate, setEligibleStartworkCutoffDate] = useState<string>('2026-04-01');
  const [announcement, setAnnouncement] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const toggleDay = (dayNum: number) => {
    if (openDays.includes(dayNum)) {
      if (openDays.length === 1) return; // Keep at least one day selected
      setOpenDays(openDays.filter((d) => d !== dayNum));
    } else {
      setOpenDays([...openDays, dayNum]);
    }
  };

  const allCampaigns = campaigns;

  // Smart Data Guard Calculation: Check if the selected campaign has existing bookings
  const campaignSlots = slots.filter((s) => s.campaignId === selectedCampaign.id);
  const bookedSlots = campaignSlots.filter((s) => (s.bookedCount || 0) > 0);
  const totalBookedCount = bookedSlots.reduce((acc, s) => acc + (s.bookedCount || 0), 0);
  const hasBookings = totalBookedCount > 0;

  // Find the first and latest booked slot dates (YYYY-MM-DD)
  const bookedDates = bookedSlots
    .map((s) => {
      const d = new Date(s.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    })
    .sort();
  const firstBookedDateStr = bookedDates.length > 0 ? bookedDates[0] : null;
  const lastBookedDateStr = bookedDates.length > 0 ? bookedDates[bookedDates.length - 1] : null;

  const handleOpenEdit = (c: Campaign) => {
    setSelectedCampaign(c);
    setName(c.name);
    setTargetDepartment(c.organization || c.targetDepartment || c.department || 'ทั้งหมด');
    setYear(c.year);
    setStartDate(c.startDate);
    setEndDate(c.endDate);
    setDefaultQuota(c.defaultQuota);
    const parsedDays = (c.openDaysOfWeek || '1,2,3,4,5').split(',').map(Number).filter((n) => !isNaN(n));
    setOpenDays(parsedDays.length > 0 ? parsedDays : [1, 2, 3, 4, 5]);
    setAdvanceBookingDays(c.advanceBookingDays ?? 2);
    setEligibleStartworkCutoffDate(c.eligibleStartworkCutoffDate || '2026-04-01');
    setAnnouncement(c.announcement || '');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDeleteConfirm(false);
    setViewMode('EDIT');
  };

  const handleOpenCreate = () => {
    setName(`โครงการตรวจสุขภาพประจำปี ${new Date().getFullYear() + 543}`);
    setTargetDepartment('ทั้งหมด');
    setYear(new Date().getFullYear() + 543);
    setStartDate(`${new Date().getFullYear()}-08-01`);
    setEndDate(`${new Date().getFullYear()}-09-30`);
    setDefaultQuota(45);
    setOpenDays([1, 2, 3, 4, 5]);
    setAdvanceBookingDays(2);
    setEligibleStartworkCutoffDate('2026-04-01');
    setAnnouncement('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDeleteConfirm(false);
    setViewMode('CREATE');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อโครงการ');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    const res = await createCampaignAction({
      name,
      organization: targetDepartment,
      department: targetDepartment,
      targetDepartment: targetDepartment,
      year,
      startDate,
      endDate,
      defaultQuota,
      openDaysOfWeek: openDays.sort().join(','),
      advanceBookingDays,
      eligibleStartworkCutoffDate,
      announcement,
    });

    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('สร้างโครงการใหม่เรียบร้อยแล้ว');
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างโครงการ');
    }
  };

  const handleUpdate = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    if (viewMode === 'EDIT' && hasBookings) {
      if (firstBookedDateStr && startDate > firstBookedDateStr) {
        setErrorMsg(`ไม่สามารถเลื่อนวันเริ่มเปิดจองหลังวันที่ ${firstBookedDateStr} ได้ เนื่องจากมีผู้ลงทะเบียนคิวในวันดังกล่าวแล้ว`);
        setIsLoading(false);
        return;
      }
      if (lastBookedDateStr && endDate < lastBookedDateStr) {
        setErrorMsg(`ไม่สามารถปรับวันสิ้นสุดเปิดจองก่อนวันที่ ${lastBookedDateStr} ได้ เนื่องจากมีผู้ลงทะเบียนคิวในวันดังกล่าวแล้ว (${totalBookedCount} รายการ)`);
        setIsLoading(false);
        return;
      }
    }

    const res = await updateCampaignByIdAction(selectedCampaign.id, {
      name,
      organization: targetDepartment,
      department: targetDepartment,
      targetDepartment: targetDepartment,
      year,
      startDate,
      endDate,
      defaultQuota,
      openDaysOfWeek: openDays.sort().join(','),
      advanceBookingDays,
      eligibleStartworkCutoffDate,
      announcement,
    });

    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('อัปเดตข้อมูลโครงการสำเร็จ');
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการอัปเดตโครงการ');
    }
  };

  const handleToggleActive = async (c: Campaign) => {
    setIsLoading(true);
    await toggleCampaignActiveAction(c.id, !c.isActive);
    setIsLoading(false);
    if (onSuccess) onSuccess();
  };

  const executeDeleteCampaign = async () => {
    if (hasBookings) {
      setErrorMsg(`ไม่อนุญาตให้ลบโครงการนี้ เนื่องจากมีผู้ลงทะเบียนคิวแล้ว ${totalBookedCount} รายการ (เพื่อป้องกันข้อมูลผู้ตรวจสูญหาย)`);
      setShowDeleteConfirm(false);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await deleteCampaignAction(selectedCampaign.id);
    setIsLoading(false);

    if (res.success) {
      setShowDeleteConfirm(false);
      setSuccessMsg(`ลบโครงการ ${selectedCampaign.name} เรียบร้อยแล้ว`);
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setShowDeleteConfirm(false);
      setErrorMsg(res.message || 'เกิดข้อผิดพลาดในการลบโครงการ');
    }
  };

  useModalLock(isOpen && mounted);

  return (
    <>
      <button
        onClick={() => {
          setViewMode('LIST');
          setSelectedCampaign(campaign);
          setErrorMsg(null);
          setSuccessMsg(null);
          setShowDeleteConfirm(false);
          setIsOpen(true);
        }}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <Settings className="h-3.5 w-3.5 text-slate-400" />
        <span>จัดการโครงการตรวจสุขภาพ</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    จัดการโครงการตรวจสุขภาพ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    เพิ่ม แก้ไข และเปิด/ปิดการใช้งานโครงการ
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

            {/* Content Body */}
            <div className="p-5 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
              {errorMsg && (
                <div className="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <span>{errorMsg}</span>
                  <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">✕</button>
                </div>
              )}

              {successMsg && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-xs text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
                  {successMsg}
                </div>
              )}

              {viewMode === 'LIST' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      รายชื่อโครงการทั้งหมด ({allCampaigns.length})
                    </span>
                    <button
                      onClick={handleOpenCreate}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>เพิ่มโครงการใหม่</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {allCampaigns.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        ยังไม่มีโครงการตรวจสุขภาพในระบบ
                      </div>
                    ) : (
                      allCampaigns.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3.5 flex items-start justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-start gap-2 flex-wrap">
                              <span className="text-sm font-bold text-slate-900 dark:text-white leading-snug break-words">
                                {c.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded font-mono">
                                  พ.ศ. {c.year}
                                </span>
                                <span className="bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-[10px] px-1.5 py-0.5 rounded border border-teal-200 dark:border-teal-900/50">
                                  สังกัด: {c.targetDepartment || 'ทั้งหมด'}
                                </span>
                                {c.isActive ? (
                                  <span className="bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                    เปิดใช้งาน
                                  </span>
                                ) : (
                                  <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] px-1.5 py-0.5 rounded">
                                    ปิดใช้งาน
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-500">
                              เปิดจอง: {c.startDate} ถึง {c.endDate} · โควต้า: {c.defaultQuota} คน/วัน
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              onClick={() => handleToggleActive(c)}
                              disabled={isLoading}
                              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${c.isActive
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-950/40'
                                }`}
                              title={c.isActive ? 'ปิดการใช้งาน' : 'เปิดใช้งาน'}
                            >
                              <Power className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="แก้ไข"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {(viewMode === 'CREATE' || viewMode === 'EDIT') && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between pb-2 border-b border-slate-200 dark:border-slate-800 gap-2">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug break-words">
                      {viewMode === 'CREATE' ? 'สร้างโครงการใหม่' : `แก้ไขโครงการ: ${selectedCampaign.name}`}
                    </h4>

                    <button
                      onClick={() => setViewMode('LIST')}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer font-medium"
                    >
                      ← กลับหน้ารายการ
                    </button>
                  </div>

                  {showDeleteConfirm && viewMode === 'EDIT' && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-4 border border-red-200 dark:border-red-900 space-y-3">
                      <div className="flex items-start gap-2.5 text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-xs">
                            ยืนยันการลบโครงการ?
                          </h5>
                          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                            ข้อมูลสล็อตประจำวันทั้งหมดในโครงการนี้จะถูกลบออก
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-red-200 dark:border-red-900">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={executeDeleteCampaign}
                          disabled={isLoading}
                          className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          {isLoading ? 'กำลังลบ...' : 'ลบโครงการ'}
                        </button>
                      </div>
                    </div>
                  )}

                  {viewMode === 'EDIT' && hasBookings && (
                    <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800/80 text-sky-800 dark:text-sky-300 text-xs flex items-start gap-3 shadow-2xs">
                      <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold flex items-center gap-1.5 text-sky-900 dark:text-sky-200">
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                          <span>โหมดปกป้องข้อมูลคิวจอง (Smart Data Guard)</span>
                        </p>
                        <p className="text-[11px] leading-relaxed text-sky-700 dark:text-sky-300/90">
                          โครงการนี้มีผู้ลงทะเบียนแล้ว <strong>{totalBookedCount} รายการ</strong> (ล่าสุดวันที่ <strong>{lastBookedDateStr}</strong>) — ระบบจำกัดการเลือกวันที่เพื่อป้องกันคิวจองเดิมตกหล่น โดยท่านสามารถ<strong>ขยายวันเปิดจอง เพิ่มโควต้า ปรับวันเปิดตรวจประจำสัปดาห์ และแก้ไขประกาศได้ตามปกติ</strong>
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        ชื่อโครงการ
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="โครงการตรวจสุขภาพประจำปี 2570"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        สังกัดองค์กรเป้าหมาย (สิทธิ์การเห็นปฏิทินจอง)
                      </label>
                      <select
                        value={targetDepartment}
                        onChange={(e) => setTargetDepartment(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                      >
                        <option value="ทั้งหมด">ทั้งหมด (เปิดสำหรับบุคลากรทุกสังกัด)</option>
                        <option value="โรงพยาบาลท่าสองยาง">โรงพยาบาลท่าสองยาง</option>
                        <option value="สำนักงานสาธารณสุขอำเภอท่าสองยาง (สสอ.)">สำนักงานสาธารณสุขอำเภอท่าสองยาง (สสอ.)</option>
                        <option value="สถานศึกษา / โรงเรียนในพื้นที่">สถานศึกษา / โรงเรียนในพื้นที่</option>
                        <option value="ประชาชนทั่วไป / หน่วยงานภายนอก">ประชาชนทั่วไป / หน่วยงานภายนอก</option>
                      </select>
                      <p className="text-[10px] text-slate-400 mt-1">
                        *เลือกองค์กรเป้าหมายเพื่อจำกัดให้เฉพาะบุคลากรในสังกัดนั้นเห็นโครงการและปฏิทินจองในหน้า /booking
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          ปี พ.ศ. โครงการ
                        </label>
                        <input
                          type="number"
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          โควต้าปกติ/วัน (คน)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={200}
                          value={defaultQuota}
                          onChange={(e) => setDefaultQuota(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          จองล่วงหน้าอย่างน้อย (วัน)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={14}
                          value={advanceBookingDays}
                          onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Eligible Startwork Date Cutoff Field */}
                    <div>
                      <label className="block text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
                        📅 วันบรรจุ/เข้าทำงานวันสุดท้ายที่มีสิทธิ์ (Startwork Date Cutoff)
                      </label>
                      <input
                        type="date"
                        value={eligibleStartworkCutoffDate}
                        onChange={(e) => setEligibleStartworkCutoffDate(e.target.value)}
                        className="w-full rounded-lg border border-amber-200 dark:border-amber-900 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        *เจ้าหน้าที่ที่มีวันเริ่มเข้าทำงาน (startwork_date) หลังวันที่นี้ จะไม่มีสิทธิ์เลือกจองคิวบนปฏิทินในโครงการนี้
                      </p>
                    </div>

                    {/* Open Days of Week Selector */}
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        เปิดรับตรวจเฉพาะวันในสัปดาห์ (Days of Week)
                      </label>

                      {/* Quick Preset Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <button
                          type="button"
                          onClick={() => setOpenDays([1, 2, 3, 4, 5])}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                            openDays.join(',') === '1,2,3,4,5'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          จันทร์ - ศุกร์ (วันทำการปกติ)
                        </button>

                        <button
                          type="button"
                          onClick={() => setOpenDays([1, 3, 5])}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                            openDays.join(',') === '1,3,5'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          จันทร์, พุธ, ศุกร์
                        </button>

                        <button
                          type="button"
                          onClick={() => setOpenDays([2, 4])}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                            openDays.join(',') === '2,4'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          อังคาร, พฤหัสบดี
                        </button>

                        <button
                          type="button"
                          onClick={() => setOpenDays([0, 1, 2, 3, 4, 5, 6])}
                          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors cursor-pointer ${
                            openDays.join(',') === '0,1,2,3,4,5,6'
                              ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ทุกวัน (รวม ส.-อา.)
                        </button>
                      </div>

                      {/* Days Checkbox Grid */}
                      <div className="grid grid-cols-7 gap-1 bg-slate-50 dark:bg-slate-900/90 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                        {[
                          { num: 1, label: 'จ.' },
                          { num: 2, label: 'อ.' },
                          { num: 3, label: 'พ.' },
                          { num: 4, label: 'พฤ.' },
                          { num: 5, label: 'ศ.' },
                          { num: 6, label: 'ส.' },
                          { num: 0, label: 'อา.' },
                        ].map((d) => {
                          const isSelected = openDays.includes(d.num);
                          return (
                            <button
                              key={d.num}
                              type="button"
                              onClick={() => toggleDay(d.num)}
                              className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        *วันใดที่ไม่ได้เลือก ระบบจะกำหนดเป็น "วันปิดรับตรวจตามกำหนดโครงการ" ให้อัตโนมัติในปฏิทิน
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          วันที่เริ่มเปิดจอง
                        </label>
                        <input
                          type="date"
                          max={viewMode === 'EDIT' && hasBookings && firstBookedDateStr ? firstBookedDateStr : undefined}
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                        {viewMode === 'EDIT' && hasBookings && firstBookedDateStr && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                            *เลือกวันเริ่มได้ไม่เกินวันที่ {firstBookedDateStr}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          วันที่สิ้นสุดเปิดจอง
                        </label>
                        <input
                          type="date"
                          min={viewMode === 'EDIT' && hasBookings && lastBookedDateStr ? lastBookedDateStr : startDate}
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                        />
                        {viewMode === 'EDIT' && hasBookings && lastBookedDateStr && (
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                            *เลือกวันสิ้นสุดต้องไม่เร็วกว่าวันที่ {lastBookedDateStr}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        ข้อความประกาศคำแนะนำ
                      </label>
                      <textarea
                        rows={2}
                        value={announcement}
                        onChange={(e) => setAnnouncement(e.target.value)}
                        placeholder="คำแนะนำล่วงหน้า..."
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/40 shrink-0">
              {viewMode === 'LIST' ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-slate-500">
                    รวมทั้งสิ้น {allCampaigns.length} โครงการ
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  >
                    ปิดหน้าต่าง
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  {viewMode === 'EDIT' ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading || showDeleteConfirm}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors disabled:opacity-50 cursor-pointer border border-red-200 dark:border-red-900/50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>ลบโครงการ</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setViewMode('LIST');
                      }}
                      className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={viewMode === 'CREATE' ? handleCreate : handleUpdate}
                      disabled={isLoading || showDeleteConfirm}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
