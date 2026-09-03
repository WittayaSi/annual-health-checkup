'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import {
  Settings,
  Building2,
  ShieldCheck,
  Package,
  FlaskConical,
  FolderOpen,
  CalendarDays,
  Users,
  RefreshCw,
  X,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Organization, CheckupPackage, Campaign, User } from '@/lib/types';
import { AdminOrganizationManagementDialog } from './AdminOrganizationManagementDialog';
import { AdminEntitlementsDialog } from './AdminEntitlementsDialog';
import { AdminCampaignConfigDialog } from './AdminCampaignConfigDialog';
import { AdminPackageConfigDialog } from './AdminPackageConfigDialog';
import { AdminBatchConfigDialog } from './AdminBatchConfigDialog';
import { UserRoleManagementDialog } from './UserRoleManagementDialog';
import { CentralDbSyncDialog } from './CentralDbSyncDialog';

interface AdminGlobalSettingsDialogProps {
  organizations: Organization[];
  packages: CheckupPackage[];
  campaign: Campaign;
  campaigns: Campaign[];
  users: User[];
  onOpenCatalog: () => void;
}

export function AdminGlobalSettingsDialog({
  organizations,
  packages,
  campaign,
  campaigns,
  users,
  onOpenCatalog,
}: AdminGlobalSettingsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeUsersCount = users.filter((u) => u.isActive !== false).length;
  const activeOrgsCount = organizations.length;
  const activePackagesCount = packages.length;

  useModalLock(isOpen);

  return (
    <>
      {/* Master Launch Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl transition-all shadow-md hover:shadow-lg shadow-emerald-600/20 shrink-0 cursor-pointer"
      >
        <Settings className="h-4 w-4 animate-spin-slow" />
        <span>ศูนย์ตั้งค่าระบบ (Settings Center)</span>
      </button>

      {/* Main Settings Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
                  <Settings className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-2">
                    <span>ศูนย์รวมการตั้งค่าและโครงสร้างระบบ (System Settings Hub)</span>
                    <span className="text-[10px] font-semibold font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      ADMIN CONTROL
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    จัดการตั้งค่าส่วนกลางทั้งระบบ: องค์กร, สิทธิ์สวัสดิการ, แพ็กเกจ, รายการตรวจ, โครงการ และผู้ใช้งาน
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Category Grid (4 Modules) */}
              <div className="grid gap-4 md:grid-cols-2">
                {/* Module 1: องค์กรและสิทธิ์สวัสดิการ */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          1. องค์กร & สิทธิ์สวัสดิการ
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                        {activeOrgsCount} สังกัด
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      กำหนดโครงสร้างองค์กรหลัก (รพ., สสอ., รพ.สต.) และตั้งค่าสิทธิ์ฟรีสวัสดิการ/อัปเกรดส่วนต่างตามกลุ่มอายุของแต่ละสังกัด
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                    <AdminOrganizationManagementDialog organizations={organizations} users={users} />
                    <AdminEntitlementsDialog organizations={organizations} packages={packages} />
                  </div>
                </div>

                {/* Module 2: แพ็กเกจและรายการตรวจ */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                          <Package className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          2. แพ็กเกจ & Catalog รายการตรวจ
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                        {activePackagesCount} แพ็กเกจ
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      จัดการแพ็กเกจตรวจสุขภาพ (PKG-A ชุดพื้นฐาน, PKG-B ชุดสมบูรณ์) และบริหารคลังรายการตรวจ Lab/X-Ray (Master Pricing Catalog)
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                    <AdminPackageConfigDialog packages={packages} />
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenCatalog();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                    >
                      <FlaskConical className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>Catalog รายการตรวจ Lab</span>
                    </button>
                  </div>
                </div>

                {/* Module 3: โครงการและรอบการตรวจ */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                          <FolderOpen className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          3. โครงการ & รอบเปิดรับบริการ
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800">
                        {campaigns.length} โครงการ
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      สร้างและจัดการปีโครงการตรวจสุขภาพ (Campaign Setup) และสร้างรอบบริการรายวัน/โควต้ารับบริการ (Batch Daily Slots Generator)
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                    <AdminCampaignConfigDialog campaign={campaign} campaigns={campaigns} organizations={organizations} />
                    <AdminBatchConfigDialog campaign={campaign} />

                  </div>
                </div>

                {/* Module 4: ผู้ใช้งานและซิงก์ระบบ */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                          <Users className="h-4 w-4" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          4. ผู้ใช้งาน & ซิงก์ HOSOffice DB
                        </h4>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        Active {activeUsersCount} คน
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                      จัดการสิทธิ์เจ้าหน้าที่ (ADMIN/STAFF), สถานะ Active/Inactive และซิงก์อัปเดตข้อมูลบุคลากรจากฐานกลาง HOSOffice DB
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                    <UserRoleManagementDialog users={users} />
                    <CentralDbSyncDialog users={users} />
                  </div>
                </div>
              </div>

              {/* System Integration Principles Banner (ความสอดคล้องทั้งระบบ) */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="h-4 w-4" />
                  <span>หลักการทำงานที่สอดคล้องกันทั้งระบบ (System Consistency Principles)</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 text-xs text-slate-300">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <p className="font-semibold text-white">1. สิทธิ์การคำนวณราคาแบบ Real-time</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      เมื่อปรับสิทธิ์ในโมดูลที่ 1 (สิทธิ์สวัสดิการ) ระบบจองคิวจะคำนวณสิทธิ์ฟรีและราคาอัปเกรดให้อัตโนมัติตาม DB ทันที
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <p className="font-semibold text-white">2. รายการตรวจดึงจาก Master Catalog</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      รายการตรวจย่อยและราคาในโมดูลที่ 2 เชื่อมโยงตรงกับฐานข้อมูล ป้องกันข้อมูลคลาดเคลื่อนและไม่มีการ Hardcode
                    </p>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <p className="font-semibold text-white">3. ป้องกันสิทธิ์แบบปลอดภัย (Active Guard)</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      ผู้ใช้งานที่ปิดสถานะ (Inactive) ในโมดูลที่ 4 จะถูกระงับไม่ให้เข้าสู่ระบบหรือจองคิวโดยเด็ดขาด
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
