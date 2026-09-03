import { redirect } from 'next/navigation';
import {
  getActiveUserAction,
  getCampaignAction,
  getSlotsAction,
  getUserBookingAction,
  getPackagesAction,
  getMaintenanceModeAction,
} from '@/app/actions';
import { CurrentBookingCard } from '@/components/staff/CurrentBookingCard';
import { BookingCalendar } from '@/components/staff/BookingCalendar';
import { CalendarCheck2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default async function BookingPage() {
  const activeUser = await getActiveUserAction();
  const isMaintenanceMode = await getMaintenanceModeAction();

  if (isMaintenanceMode) {
    redirect('/maintenance');
  }

  // AUTH GUARD: Redirect to landing page (/) if not logged in
  if (!activeUser) {
    redirect('/');
  }

  const campaign = await getCampaignAction(activeUser.organization, activeUser.department);
  const slots = await getSlotsAction(campaign.id, activeUser.organization || activeUser.department);
  const userBooking = await getUserBookingAction(activeUser.id);
  const packages = await getPackagesAction();

  // Calculate user age & welfare eligibility
  const userAge = activeUser.dob
    ? new Date().getFullYear() - new Date(activeUser.dob).getFullYear()
    : 30;
  const isSeniorEligible = userAge >= 35;

  return (
    <div className="space-y-6">
      {/* Staff Greeting Banner */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                โครงการตรวจสุขภาพประจำปี {campaign.year}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50">
                สิทธิ์เฉพาะสังกัด: {campaign.organization || campaign.targetDepartment || 'ทุกหน่วยงาน'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              สวัสดีคุณ {activeUser.firstName} {activeUser.lastName}
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              สังกัด / แผนก: <span className="font-medium text-slate-700 dark:text-slate-300">{activeUser.department || activeUser.organization || 'โรงพยาบาลท่าสองยาง'}</span>
            </p>


            <div className="pt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <ShieldCheck className="h-4 w-4 text-slate-500 shrink-0" />
              <span>
                สิทธิ์สวัสดิการของคุณ (อายุ {userAge} ปี):{' '}
                <strong className="text-slate-900 dark:text-white font-medium">
                  {isSeniorEligible ? 'PKG-B ตรวจชุดใหญ่ (ฟรี)' : 'PKG-A ตรวจชุดมาตรฐาน (ฟรี)'}
                </strong>
              </span>
            </div>
          </div>

          {/* Process Steps Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 text-xs space-y-2 min-w-[240px]">
            <p className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-slate-500" />
              <span>ขั้นตอนการลงทะเบียน:</span>
            </p>
            <ol className="space-y-1 text-slate-600 dark:text-slate-400 pl-4 list-decimal">
              <li>เลือกวันที่มีสล็อตว่างในปฏิทิน</li>
              <li>เลือกแพ็กเกจตรวจสุขภาพและตรวจสอบรายการตรวจ</li>

              <li>กด &quot;ยืนยันการจองคิว&quot;</li>
            </ol>
          </div>
        </div>
      </div>

      {/* User Current Booking Status Section */}
      {userBooking && userBooking.status === 'CONFIRMED' ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50">
            <h2 className="text-base font-bold text-emerald-950 dark:text-emerald-100 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
                <ShieldCheck className="h-4.5 w-4.5" />
              </span>
              <span>สถานะการจองคิวของคุณ</span>
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-white dark:bg-emerald-900/80 px-3 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>ยืนยันสิทธิ์เรียบร้อย</span>
            </span>
          </div>

          <CurrentBookingCard booking={userBooking} />

          {/* Calendar for reference */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
              ปฏิทินแสดงรอบวันตรวจทั้งหมด
            </h3>
            <BookingCalendar slots={slots} activeUser={activeUser} packages={packages} campaign={campaign} readOnly={true} />
          </div>
        </section>
      ) : (
        /* Booking Calendar Section */
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck2 className="h-5 w-5 text-slate-500" />
              <span>ปฏิทินเลือกวันเข้ารับการตรวจสุขภาพ</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              เลือกวันที่มีสถานะ &quot;เปิดรับจอง&quot; เพื่อยืนยันการจองคิว
            </p>
          </div>

          <BookingCalendar slots={slots} activeUser={activeUser} packages={packages} campaign={campaign} />
        </section>
      )}
    </div>
  );
}
