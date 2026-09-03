'use client';

import { useState } from 'react';
import {
  Wrench,
  ShieldCheck,
  Clock,
  PhoneCall,
  Sparkles,
  ArrowRight,
  Lock,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { LoginDialogModal } from '@/components/auth/LoginDialogModal';
import { User } from '@/lib/types';
import Link from 'next/link';

interface MaintenanceNoticeProps {
  activeUser?: User | null;
  allUsers?: User[];
  title?: string;
  message?: string;
  estimatedTime?: string;
}

export function MaintenanceNotice({
  activeUser,
  allUsers = [],
  title = 'ระบบอยู่ระหว่างการปิดปรับปรุงชั่วคราว',
  message = 'ขออภัยในความไม่สะดวก ระบบจองวันตรวจสุขภาพประจำปี อยู่ระหว่างการปรับปรุงระบบและอัปเดตข้อมูลเพื่อเพิ่มประสิทธิภาพในการให้บริการที่ดีขึ้น',
  estimatedTime = 'คาดว่าจะเปิดให้บริการตามปกติภายในเวลา 17:00 น.',
}: MaintenanceNoticeProps) {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none">
      {/* Background Decorative Gradients & Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full mx-auto space-y-6 text-center">
        {/* Hospital Branding Header */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-inner text-slate-300 text-xs font-semibold">
          <Building2 className="h-4 w-4 text-emerald-400" />
          <span>โรงพยาบาลท่าสองยาง • ศูนย์ตรวจสุขภาพ Wellness Center</span>
        </div>

        {/* Hero Card */}
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-6 text-center relative overflow-hidden">
          {/* Top Decorative Banner Accent */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />

          {/* Animated Maintenance Icon Badge */}
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-amber-500/20 via-emerald-500/20 to-sky-500/20 animate-pulse blur-lg" />
            <div className="relative w-20 h-20 rounded-2xl bg-slate-800/90 border border-amber-500/30 flex items-center justify-center shadow-xl ring-1 ring-amber-500/20">
              <Wrench className="h-10 w-10 text-amber-400 animate-bounce" />
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg mx-auto">
              {message}
            </p>
          </div>

          {/* Timeline / Time Status Box */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-3 text-amber-400 font-semibold">
              <Clock className="h-5 w-5 text-amber-400 shrink-0" />
              <span>{estimatedTime}</span>
            </div>

            <div className="h-px sm:h-8 w-full sm:w-px bg-slate-800" />

            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>สถานะ: กำลังอัปเกรดฐานข้อมูล</span>
            </div>
          </div>

          {/* Emergency Contact & Guidance */}
          <div className="pt-2 border-t border-slate-800/60 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5 text-slate-500" />
              <span>สอบถามเพิ่มเติม: กลุ่มงานสุขภาพดิจิทัล</span>
            </div>
            <span className="hidden sm:inline text-slate-700">•</span>
            <div className="text-slate-400">
              โทรศัพท์โรงพยาบาล: 055-589-255 ภายใน 170
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>ลองใหม่อีกครั้ง (Refresh)</span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] text-slate-500">
          © 2026 โรงพยาบาลท่าสองยาง — Annual Health Checkup Management System
        </p>
      </div>
    </div>
  );
}
