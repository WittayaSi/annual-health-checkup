'use client';

import { useState } from 'react';
import {
  Hospital,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  FileCheck,
  Ban,
  CreditCard,
  Shirt,
  Coffee,
  PhoneCall,
  UserCheck,
  Activity,
  TestTube2,
  FileText,
  Stethoscope,
  Star,
  CalendarCheck2,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Heart,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Globe,
  Share2,
  Video,
  Smartphone,
  Search,
  LogOut,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { User, Campaign } from '@/lib/types';
import { LoginDialogModal } from '@/components/auth/LoginDialogModal';
import { logoutAction } from '@/app/actions';

interface CheckupGuideGraphicProps {
  activeUser?: User | null;
  campaign?: Campaign;
  advanceBookingDays?: number;
}

export function CheckupGuideGraphic({ activeUser, campaign, advanceBookingDays }: CheckupGuideGraphicProps) {
  const router = useRouter();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeStation, setActiveStation] = useState<number | null>(null);

  const advanceDays = advanceBookingDays ?? campaign?.advanceBookingDays ?? 2;

  const handleLoginOrNavigate = () => {
    if (activeUser) {
      setIsNavigating(true);
      router.push('/booking');
    } else {
      setIsLoginOpen(true);
    }
  };

  const handleLogout = async () => {
    await logoutAction();
    router.refresh();
  };

  // 9 Workflow Stations with Images (/steps/1.png - 9.png) & Descriptions
  const stations = [
    { id: 1, title: '1. ลงทะเบียนจองวันตรวจสุขภาพ', icon: Search, desc: `ลงทะเบียนจองวันตรวจสุขภาพผ่านระบบออนไลน์ล่วงหน้าอย่างน้อย ${advanceDays} วันก่อนวันนัดหมาย`, img: '/steps/1.png' },
    { id: 2, title: '2. ลงทะเบียน/กรอกประวัติ', icon: UserCheck, desc: 'กรอกข้อมูลเกี่ยวกับการเจ็บป่วยในแบบคัดกรอง ณ Wellness Center ชั้น 3', img: '/steps/2.png' },
    { id: 3, title: '3. ชั่งน้ำหนัก วัดส่วนสูง วัดรอบเอว', icon: Activity, desc: 'ด้วยตนเองล่วงหน้า / ณ จุดบริการ Wellness Center', img: '/steps/3.png' },
    { id: 4, title: '4. ยื่นโต๊ะซักประวัติ', icon: FileText, desc: 'เพื่อลงข้อมูลการตรวจสุขภาพและรับคำแนะนำจากเจ้าหน้าที่', img: '/steps/4.png' },
    { id: 5, title: '5. เจาะเลือดกับเจ้าหน้าที่ห้อง Lab', icon: TestTube2, desc: 'เจาะเลือดและส่งสิ่งส่งตรวจตามรายการตรวจของท่าน', img: '/steps/5.png' },
    { id: 6, title: '6. ยื่น X-ray', icon: FileCheck, desc: 'ถ่ายภาพเอกซเรย์ปอดและหัวใจดิจิทัล (Chest PA Upright)', img: '/steps/6.png' },
    { id: 7, title: '7. ยื่นตรวจฟัน', icon: Stethoscope, desc: 'ตรวจสุขภาพช่องปาก ทันตกรรม และรับคำแนะนำการดูแลฟัน', img: '/steps/7.png' },
    { id: 8, title: '8. จุดคืนเอกสาร', icon: CheckCircle2, desc: 'ตรวจสอบและคืนเอกสารสรุปการตรวจสุขภาพทั้งหมด', img: '/steps/8.png' },
    { id: 9, title: '9. ตอบแบบประเมินความพึงพอใจ', icon: QrCode, desc: 'สแกน QR Code เพื่อตอบแบบประเมินความพึงพอใจการรับบริการ', img: '/steps/9.png' },
  ];


  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-16">
      {/* ================= HERO HEADER ================= */}
      <section className="w-full bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative overflow-hidden border-b border-emerald-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="w-full max-w-7xl mx-auto px-4 py-10 sm:px-6 sm:py-14 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Header Info */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white font-bold shadow-md">
                  <Hospital className="h-5 w-5" />
                </div>
                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-800/90 text-emerald-100 border border-emerald-600/60 flex items-center gap-1.5 shadow-xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>โรงพยาบาลท่าสองยาง THASONGYANG HOSPITAL</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                การตรวจสุขภาพประจำปี
              </h1>

              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-light">
                ขอเชิญผู้รับบริการ บุคลากร และประชาชนทุกท่าน เข้ารับการตรวจสุขภาพประจำปี ณ จุดตรวจสุขภาพ ห้อง Wellness Center ชั้น 3 โรงพยาบาลท่าสองยาง จังหวัดตาก
              </p>

              {/* HERO ACTION LOGIN / LOGOUT BUTTONS */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleLoginOrNavigate}
                  disabled={isNavigating}
                  className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm sm:text-base shadow-xl transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-80"
                >
                  <CalendarCheck2 className={`h-5 w-5 text-white ${isNavigating ? 'animate-bounce' : ''}`} />
                  <span>
                    {isNavigating
                      ? 'กำลังนำคุณเข้าสู่ระบบ...'
                      : activeUser
                      ? `เข้าใช้งานระบบจองคิว (คุณ${activeUser.firstName})`
                      : 'เข้าสู่ระบบจองคิวตรวจสุขภาพ'}
                  </span>
                  {!isNavigating && <ArrowRight className="h-5 w-5" />}
                </button>

                {activeUser && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-red-600/90 hover:bg-red-500 text-white font-bold text-sm shadow-xl transition-all transform hover:-translate-y-0.5 border border-red-400/40 cursor-pointer"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>ออกจากระบบ</span>
                  </button>
                )}

                {!activeUser && (
                  <div className="flex items-center gap-2 text-xs text-emerald-200/90 font-medium">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span>ล็อกอินด้วย Username จากระบบ HosOffice</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Schedule & Location Card */}
            <div className="lg:col-span-5 bg-slate-900/85 backdrop-blur-md p-6 rounded-2xl border border-emerald-700/60 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                  <span>กำหนดการ & สถานที่บริการ</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  เปิดจองคิวแล้ว
                </span>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-3 text-slate-200">
                  <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 shrink-0 border border-emerald-800/50">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">ช่วงวันที่เปิดตรวจ:</p>
                    <p className="text-emerald-200 font-bold">จันทร์ - ศุกร์</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-200">
                  <div className="p-2 rounded-lg bg-emerald-950 text-emerald-400 shrink-0 border border-emerald-800/50">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">เวลาให้บริการ:</p>
                    <p className="text-emerald-200 font-bold">ตั้งแต่เวลา 08.00 - 10.00 น.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-slate-200 border-t border-emerald-800/80 pt-3">
                  <div className="p-2 rounded-lg bg-amber-950 text-amber-400 shrink-0 border border-amber-800/50">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-200">สถานที่ตรวจ:</p>
                    <p className="text-slate-300 leading-relaxed">
                      ณ จุดตรวจสุขภาพ ห้อง Wellness Center ชั้น 3 <br />
                      ณ โรงพยาบาลท่าสองยาง จังหวัดตาก
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN CONTENT GRAPHIC SECTIONS ================= */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 pt-8">

        {/* ----------------- SECTION 1: PREPARATION STEPS (5 ข้อปฏิบัติ) ----------------- */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 inline-block shadow-xs">
              คำแนะนำเตรียมความพร้อม
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              การเตรียมตัวก่อนการตรวจสุขภาพ (5 ข้อปฏิบัติ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              ข้อควรปฏิบัติสำคัญก่อนเข้ารับบริการเจาะเลือดและตรวจร่างกายประจำปี
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Step 1 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between space-y-4 group">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  1
                </span>
                <FileCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  1. ลงทะเบียนจอง
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  ลงทะเบียนจองวันตรวจสุขภาพล่วงหน้าอย่างน้อย {advanceDays} วันผ่านระบบออนไลน์
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-red-500 transition-all flex flex-col justify-between space-y-4 group">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-red-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  2
                </span>
                <Ban className="h-6 w-6 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  2. งดเครื่องดื่ม - อาหารทุกชนิด
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  ก่อนมาตรวจ 10 - 12 ชั่วโมง <span className="font-semibold text-red-600 dark:text-red-400">(กรณีตรวจชุดใหญ่ อายุ 35 ปี ขึ้นไป)</span>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-500 transition-all flex flex-col justify-between space-y-4 group">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  3
                </span>
                <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  3. เตรียม ปากกา มือถือ บัตรประชาชน
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  นำปากกา มือถือ และบัตรประชาชนติดตัวมาเพื่อความสะดวกในการเข้ารับบริการ
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all flex flex-col justify-between space-y-4 group">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  4
                </span>
                <Shirt className="h-6 w-6 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  4. สวมเสื้อที่ถอดง่าย ไม่มีโลหะ
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  งดสวมสร้อยคอ สุภาพสตรีไม่ควรสวมชุดชั้นในที่มีโครง เพื่อความสะดวกในการทำเอกซเรย์
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-500 transition-all flex flex-col justify-between space-y-4 group">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-full bg-teal-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-xs">
                  5
                </span>
                <Coffee className="h-6 w-6 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  5. เตรียมอาหารและเครื่องดื่ม
                </h3>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  เตรียมอาหารและเครื่องดื่ม มารับประทานหลังเจาะเลือดเสร็จสิ้น
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------- SECTION 2: WORKFLOW STATIONS (9 ขั้นตอน พร้อมรูปภาพและเส้นขั้นตอน) ----------------- */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 inline-block shadow-xs">
              ผังจุดรับบริการต่อเนื่อง
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span>ลำดับการเข้ารับบริการ (9 ขั้นตอน)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              ขั้นตอนจุดบริการเรียงตามลำดับต่อเนื่อง ณ อาคาร Wellness Center ชั้น 3
            </p>
          </div>

          {/* Visual Step Flow Line Bar (Desktop Process Pipeline Connector) */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between relative px-2">
              {/* Horizontal Flow Line Connecting 1 to 9 */}
              <div className="absolute top-1/2 left-8 right-8 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 -translate-y-1/2 rounded-full z-0 opacity-40" />

              {stations.map((st) => (
                <div
                  key={st.id}
                  className="relative z-10 flex flex-col items-center group cursor-pointer"
                  onClick={() => setActiveStation(st.id)}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-md ${activeStation === st.id
                      ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-900 scale-110'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-2 border-emerald-500 hover:scale-105'
                      }`}
                  >
                    {st.id}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1.5 max-w-[75px] text-center truncate">
                    {st.title.split('.')[1] || st.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Cards Grid with Images & Flow Arrows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 relative">
            {stations.map((st, index) => {
              const IconComp = st.icon;
              const isLast = index === stations.length - 1;

              return (
                <div
                  key={st.id}
                  onClick={() => setActiveStation(st.id)}
                  className={`relative bg-white dark:bg-slate-900 rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl group ${activeStation === st.id
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                >
                  {/* Top Bar with Step Badge & Next Arrow */}
                  <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-xs">
                        จุดที่ {st.id}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[150px] sm:max-w-[170px]">
                        {st.title}
                      </span>
                    </div>
                    {!isLast ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-0.5 shrink-0">
                        <span>ถัดไป {st.id + 1}</span>
                        <ArrowRight className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md shrink-0">
                        จุดสุดท้าย ✨
                      </span>
                    )}
                  </div>

                  {/* Step Image Display (/steps/1.png to /steps/9.png) */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center min-h-[160px]">
                    <img
                      src={st.img}
                      alt={st.title}
                      className="max-h-36 w-full object-contain rounded-xl transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Description & Icon */}
                  <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shrink-0 border border-emerald-100 dark:border-slate-700">
                        <IconComp className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                          {st.title}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                          {st.desc}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Flow Connector Indicator */}
                    {!isLast && (
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                          <ChevronRight className="h-3 w-3" />
                          <span>เดินทางต่อไปจุดบริการที่ {st.id + 1}</span>
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 font-medium">ขั้นตอน {st.id}/9</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>


        {/* ----------------- SECTION 3: PHYSICAL FITNESS TESTS (5 ท่า) ----------------- */}
        <section className="space-y-6">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 inline-block shadow-xs">
              การประเมินสุขภาพ
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
              <Dumbbell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <span>ทดสอบสมรรถภาพร่างกาย (Physical Fitness Tests)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              การประเมินความแข็งแรงและความทนทานของร่างกาย 5 ท่าทดสอบมาตรฐาน
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Fitness Test 1 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 transition-all space-y-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                ท่าที่ 1
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Wall sit test พิงกำแพง
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                (ทดสอบความแข็งแรงของกล้ามเนื้อต้นขา)
              </p>
            </div>

            {/* Fitness Test 2 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 transition-all space-y-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                ท่าที่ 2
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Plank test
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                (ทดสอบความแข็งแรงของแขนกลางลำตัว)
              </p>
            </div>

            {/* Fitness Test 3 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 transition-all space-y-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                ท่าที่ 3
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Hexagon Agility Test
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                (ทดสอบความคล่องตัว)
              </p>
            </div>

            {/* Fitness Test 4 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 transition-all space-y-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                ท่าที่ 4
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Push up
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                (การทดสอบดันพื้น 1 นาที)
              </p>
            </div>

            {/* Fitness Test 5 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500 transition-all space-y-2.5">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                ท่าที่ 5
              </span>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                Sit / Reach flexibility at home
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                (ทดสอบความยืดหยุ่นของกล้ามเนื้อ)
              </p>
            </div>
          </div>
        </section>

        {/* ----------------- SECTION 4: IMPORTANT REMARKS (หมายเหตุสำคัญ) ----------------- */}
        <section className="bg-amber-50/90 dark:bg-amber-950/40 p-6 sm:p-8 rounded-3xl border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-bold">
              หมายเหตุและข้อควรทราบสำคัญ:
            </h3>
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-amber-950 dark:text-amber-200 pl-2 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>
                <strong>กรณีพบรายชื่อหรือเพิ่มรายชื่อ:</strong> กรุณาแจ้งที่งานส่งเสริมฯ <strong className="text-amber-800 dark:text-amber-300 underline underline-offset-2">กด 155</strong> ทันที หรือต้องการเปลี่ยนวัน <strong className="text-amber-800 dark:text-amber-300 underline underline-offset-2">กด 101</strong> ห้องบัตร ล่วงหน้าอย่างน้อย 2 วัน
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>
                <strong>การรับผลตรวจ:</strong> รอรับผลตรวจสุขภาพผ่านระบบหมอพร้อม ภายใน <strong>7 - 10 วัน</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 dark:text-amber-400 font-bold">•</span>
              <span>
                <strong>ทดสอบสมรรถภาพร่างกาย:</strong> ที่ฟิตเนส (ศูนย์สุขภาพ) ชั้น 3 ตึกจ่ายกลาง ได้ตั้งแต่วันจันทร์ - ศุกร์ ที่ <strong>เวลา 13.00 - 16.00 น.</strong> <i>(สามารถทดสอบสมรรถภาพร่างกายก่อนตรวจสุขภาพประจำปีได้)</i>
              </span>
            </li>
          </ul>
        </section>

        {/* ----------------- SECTION 5: CONTACT & FOOTER (ข้อมูลการติดต่อ) ----------------- */}
        <section className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                ข้อมูลการติดต่อสอบถามเพิ่มเติม
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                กลุ่มงานบริการด้านปฐมภูมิและองค์รวม โรงพยาบาลท่าสองยาง จังหวัดตาก
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:0808385713"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                <PhoneCall className="h-4 w-4" />
                <span>080-8385713</span>
              </a>
              <span className="text-xs text-slate-400">หรือ 055-589256 ต่อ 156</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <a
              href="http://www.thasongyang.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 transition-colors border border-slate-700/60"
            >
              <Globe className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="truncate">www.thasongyang.com</span>
            </a>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/60">
              <FacebookIcon className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="truncate">เพจ รพ. ท่าสองยาง จังหวัดตาก</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/60">
              <Video className="h-4 w-4 text-pink-400 shrink-0" />
              <span className="truncate">TikTok: thasongyanghospital</span>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 text-slate-200 border border-slate-700/60">
              <Smartphone className="h-4 w-4 text-red-400 shrink-0" />
              <span className="truncate">YouTube: Tha Song Yang Tak</span>
            </div>
          </div>
        </section>

      </div>

      {/* LOGIN MODAL COMPONENT */}
      <LoginDialogModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}

// Helper icon component for Search
function SearchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

// Helper icon component for Facebook
function FacebookIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
