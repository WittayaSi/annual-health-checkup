'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserType,
  HealthCheckupRecord,
  HealthCheckupItem,
  HealthItemStatusColor,
} from '@/lib/types';
import { syncUserHisDataAction } from '@/app/actions';
import {
  Activity,
  Calendar,
  FileText,
  RefreshCw,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Award,
  HeartPulse,
  Sparkles,
  UserCheck,
  Building,
  ShieldCheck,
  Loader2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { formatDetailedAge } from '@/lib/item-utils';

interface PersonalHealthHistoryViewProps {
  user: UserType;
  records: HealthCheckupRecord[];
}

export function PersonalHealthHistoryView({ user, records: initialRecords }: PersonalHealthHistoryViewProps) {
  const router = useRouter();
  const [records, setRecords] = useState<HealthCheckupRecord[]>(initialRecords);
  const [selectedYear, setSelectedYear] = useState<number>(
    records.length > 0 ? records[0].year : new Date().getFullYear() + 543
  );

  const [selectedTrendItem, setSelectedTrendItem] = useState<string>('Fasting Blood Sugar (FBS)');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const activeRecord = records.find((r) => r.year === selectedYear) || records[0];

  const handleSyncHis = async () => {
    setIsSyncing(true);
    setSyncMsg(null);
    try {
      const res = await syncUserHisDataAction(user.id);
      if (res.success) {
        setSyncMsg(('message' in res && res.message) ? res.message : 'ดึงข้อมูลประวัติผลตรวจสุขภาพจาก HIS ล่าสุดเรียบร้อยแล้ว');
        router.refresh();
      } else {
        setSyncMsg(`ข้อผิดพลาด: ${('error' in res && res.error) ? res.error : 'ไม่สามารถดึงข้อมูลจาก HIS ได้'}`);
      }
    } catch (err: any) {
      setSyncMsg('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล HIS');
    } finally {
      setIsSyncing(false);
    }
  };

  // Extract trend data points across years for selectedTrendItem
  const trendPoints = records
    .map((r) => {
      const item = r.items.find((i) => i.itemName.toLowerCase().includes(selectedTrendItem.toLowerCase().split(' ')[0]));
      if (!item) return null;
      const numVal = parseFloat(item.value);
      return {
        year: r.year,
        date: r.checkupDate,
        value: isNaN(numVal) ? 0 : numVal,
        valStr: item.value,
        unit: item.unit || '',
        statusColor: item.statusColor,
        referenceRange: item.referenceRange,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.year - b!.year);

  // Group active record items by category
  const groupedItems = activeRecord
    ? activeRecord.items.reduce((acc, item) => {
        const cat = item.category || 'รายการตรวจทั่วไป';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      }, {} as Record<string, HealthCheckupItem[]>)
    : {};

  const normalCount = activeRecord?.items.filter((i) => i.statusColor === 'NORMAL').length || 0;
  const warningCount = activeRecord?.items.filter((i) => i.statusColor === 'WARNING').length || 0;
  const criticalCount = activeRecord?.items.filter((i) => i.statusColor === 'CRITICAL').length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* PAGE HEADER & HIS SYNC BANNER */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>HN: {user.hisSyncId || `HN-${user.employeeCode}`}</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ซิงก์เลขบัตรประชาชนก์กับ HIS รพ. แล้ว</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                <span>คลังประวัติผลตรวจสุขภาพย้อนหลัง</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                ระบบดูแลสุขภาพส่วนบุคคล 365 วัน (Personal Health & Wellness Portal) สำหรับคุณ <strong className="text-white font-semibold">{user.firstName} {user.lastName}</strong> ({user.department || user.organization})
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleSyncHis}
                disabled={isSyncing}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-sky-500/20 border border-sky-400/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-sky-200" />
                ) : (
                  <RefreshCw className="w-4 h-4 text-sky-200" />
                )}
                <span>{isSyncing ? 'กำลังซิงก์จาก HIS...' : '🔄 อัปเดตข้อมูลจาก HIS'}</span>
              </button>
            </div>
          </div>

          {syncMsg && (
            <div className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-700/60 text-sky-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{syncMsg}</span>
              </div>
              <button onClick={() => setSyncMsg(null)} className="text-sky-400 hover:text-white text-xs underline">
                ปิด
              </button>
            </div>
          )}

          {/* User Fast Stats Bar */}
          <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">รหัสพนักงาน:</span>
              <span className="font-semibold font-mono text-slate-200">{user.employeeCode || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">อายุ ณ ปัจจุบัน:</span>
              <span className="font-semibold text-slate-200">{formatDetailedAge(user.dob)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">สังกัด / แผนก:</span>
              <span className="font-semibold text-slate-200 truncate block">{user.department || user.organization || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">ประวัติสะสมในระบบ:</span>
              <span className="font-semibold text-emerald-400 font-mono">{records.length} ปี (พ.ศ. {records.map(r => r.year).join(', ')})</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: YEAR-OVER-YEAR HEALTH TRENDS (เปรียบเทียบแนวโน้มผลตรวจย้อนหลังหลายปี) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                แนวโน้มผลตรวจสุขภาพรายปี (Longitudinal Trend Comparison)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เปรียบเทียบทิศทางผลตรวจย้อนหลังหลายปี (พ.ศ. 2567 - 2569) เพื่อติดตามการพัฒนาสุขภาพตลอด 365 วัน
              </p>
            </div>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'Fasting Blood Sugar (FBS)', label: 'น้ำตาล (FBS)' },
              { id: 'Cholesterol (คอเลสเตอรอลรวม)', label: 'ไขมันคอเลสเตอรอล' },
              { id: 'Triglyceride (ไตรกลีเซอไรด์)', label: 'ไตรกลีเซอไรด์' },
              { id: 'Uric Acid (กรดยูริก - โรคเกาต์)', label: 'กรดยูริก (Uric)' },
              { id: 'ALT / SGPT (เอนไซม์ตับ ALT)', label: 'ค่าตับ (ALT)' },
              { id: 'Creatinine (การทำงานของไต)', label: 'ค่าไต (Creatinine)' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSelectedTrendItem(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedTrendItem === btn.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* VISUAL TREND COMPARISON CHART & CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {trendPoints.map((pt, idx) => {
            const isNormal = pt!.statusColor === 'NORMAL';
            const isWarning = pt!.statusColor === 'WARNING';

            return (
              <div
                key={pt!.year}
                className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden ${
                  isNormal
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                    : isWarning
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-white/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs">
                    พ.ศ. {pt!.year} ({pt!.date})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isNormal
                        ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                        : isWarning
                        ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                        : 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                    }`}
                  >
                    {isNormal ? '🟢 ปกติ' : isWarning ? '🟡 ควรระวัง' : '🔴 ผิดปกติ'}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{selectedTrendItem}</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white">
                      {pt!.valStr}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{pt!.unit}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>ค่าอ้างอิงปกติ: {pt!.referenceRange || '-'}</span>
                  {idx > 0 && (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {pt!.value > trendPoints[idx - 1]!.value ? '↗ เพิ่มขึ้น' : pt!.value < trendPoints[idx - 1]!.value ? '↘ ลดลง' : '➡️ เท่าเดิม'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: YEARLY TAB SELECTION & DETAILED CHECKUP RESULTS */}
      <div className="space-y-4">
        {/* YEAR SELECTION TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 mr-2 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-indigo-500" />
            <span>เลือกดูตามปี พ.ศ. :</span>
          </span>

          {records.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedYear(r.year)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                selectedYear === r.year
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span>พ.ศ. {r.year}</span>
              <span className="text-[10px] opacity-75 font-mono">({r.checkupDate})</span>
            </button>
          ))}
        </div>

        {/* ACTIVE YEAR DETAILED CARD */}
        {activeRecord && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
            {/* Header Status & Doctor Summary */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800/80 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-900/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-sky-200/60 dark:border-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      สรุปผลการวินิจฉัยและคำแนะนำจากแพทย์ประจำปี พ.ศ. {activeRecord.year}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      ตรวจ ณ {activeRecord.hospitalName} ({activeRecord.checkupDate}) • แพ็กเกจ: {activeRecord.packageCode}
                    </p>
                  </div>
                </div>

                {/* Health Badges Counter */}
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    🟢 ปกติ {normalCount} รายการ
                  </span>
                  {warningCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      🟡 ควรระวัง {warningCount} รายการ
                    </span>
                  )}
                  {criticalCount > 0 && (
                    <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      🔴 ผิดปกติ {criticalCount} รายการ
                    </span>
                  )}
                </div>
              </div>

              {/* Doctor Summary & Advice Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 space-y-1.5">
                  <span className="font-bold text-sky-900 dark:text-sky-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>ผลการวินิจฉัยภาพรวมจากแพทย์:</span>
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeRecord.overallDoctorSummary || 'ผลการตรวจสุขภาพภาพรวมอยู่ในเกณฑ์ดี'}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-sky-100 dark:border-slate-700 space-y-1.5">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>คำแนะนำการดูแลสุขภาพเฉพาะบุคคล:</span>
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeRecord.recommendations || 'รับประทานอาหารให้ครบ 5 หมู่ และออกกำลังกายสม่ำเสมอ'}
                  </p>
                </div>
              </div>

              {/* X-RAY & EKG FINDINGS */}
              {(activeRecord.xrayResult || activeRecord.ekgResult) && (
                <div className="pt-2 border-t border-sky-200/60 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {activeRecord.xrayResult && (
                    <div className="p-3 rounded-xl bg-slate-900/5 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <span>ผลตรวจเอกซเรย์ปอด (Chest X-Ray):</span>
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">{activeRecord.xrayResult}</p>
                    </div>
                  )}
                  {activeRecord.ekgResult && (
                    <div className="p-3 rounded-xl bg-slate-900/5 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-1">
                        <HeartPulse className="w-4 h-4 text-rose-500" />
                        <span>ผลตรวจคลื่นไฟฟ้าหัวใจ (EKG):</span>
                      </span>
                      <p className="text-slate-600 dark:text-slate-400">{activeRecord.ekgResult}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* CATEGORIZED LAB & HEALTH CHECKUP ITEM TABLES */}
            <div className="space-y-6 pt-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                <span>รายการผลตรวจย่อยทั้งหมดประจำปี พ.ศ. {activeRecord.year}</span>
              </h4>

              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-3">
                  <h5 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 inline-block">
                    📌 หมวดหมู่: {category} ({items.length} รายการ)
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((item) => {
                      const isNorm = item.statusColor === 'NORMAL';
                      const isWarn = item.statusColor === 'WARNING';

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between gap-3 ${
                            isNorm
                              ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                              : isWarn
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                              : 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                          }`}
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {item.itemName}
                            </span>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                              <span>ค่าอ้างอิง: {item.referenceRange || '-'}</span>
                              {item.note && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-700 dark:text-amber-400 font-medium">{item.note}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="flex items-baseline justify-end gap-1 font-mono">
                              <span
                                className={`text-base font-extrabold ${
                                  isNorm
                                    ? 'text-slate-900 dark:text-white'
                                    : isWarn
                                    ? 'text-amber-700 dark:text-amber-300 font-bold'
                                    : 'text-rose-600 dark:text-rose-400 font-bold'
                                }`}
                              >
                                {item.value}
                              </span>
                              <span className="text-[10px] text-slate-500 font-sans">{item.unit || ''}</span>
                            </div>

                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                isNorm
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : isWarn
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                              }`}
                            >
                              {isNorm ? '🟢 ปกติ' : isWarn ? '🟡 ควรระวัง' : '🔴 ผิดปกติ'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
