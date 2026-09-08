'use client';

import { useState, useMemo } from 'react';
import { useAdminContext } from './AdminLayoutClientWrapper';
import {
  Settings,
  Building2,
  FolderOpen,
  Package,
  FlaskConical,
  ShieldCheck,
  Database,
  Wrench,
  Sparkles,
  Users,
  CheckCircle2,
  Sliders,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { AdminOrganizationManagementDialog } from './AdminOrganizationManagementDialog';
import { AdminEntitlementsDialog } from './AdminEntitlementsDialog';
import { AdminCampaignConfigDialog } from './AdminCampaignConfigDialog';
import { AdminPackageConfigDialog } from './AdminPackageConfigDialog';
import { AdminItemCatalogDialog } from './AdminItemCatalogDialog';
import { AdminDepartmentRulesDialog } from './AdminDepartmentRulesDialog';
import { UserRoleManagementDialog } from './UserRoleManagementDialog';
import { CentralDbSyncDialog } from './CentralDbSyncDialog';

export function AdminSettingsView() {
  const {
    activeUser,
    campaign,
    campaigns,
    organizations,
    packages,
    masterItems,
    slots,
    bookings,
    users,
    onRefresh,
  } = useAdminContext();

  const isFullAdmin = activeUser?.role === 'ADMIN';

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isDeptRulesOpen, setIsDeptRulesOpen] = useState(false);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department && u.department.trim()) set.add(u.department.trim());
    });
    return Array.from(set).sort();
  }, [users]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              <Settings className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                ตั้งค่าระบบ & แคตตาล็อก (System Configuration)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ศูนย์กลางการบริหารจัดการโครงสร้างสังกัด โครงการเปิดจอง โปรแกรมการตรวจ และสิทธิ์การใช้งาน
              </p>
            </div>
          </div>

          <button
            onClick={onRefresh}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            <span>รีเฟรชการตั้งค่า</span>
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">องค์กร/สังกัดทั้งหมด</span>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {organizations.length} สังกัด
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">โครงการจองทั้งหมด</span>
            <FolderOpen className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {campaigns.length} โครงการ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">รายการแล็บใน Master Catalog</span>
            <FlaskConical className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {masterItems.length} รายการ
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">ผู้ใช้งานในระบบ</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
            {users.length} คน
          </p>
        </div>
      </div>

      {/* SECTION 1: องค์กร & โครงการ (ORGANIZATION & CAMPAIGN CONFIG) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            1. การจัดการองค์กร & โครงการตรวจสุขภาพ
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Organization Management Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {organizations.length} สังกัด
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                สังกัดองค์กร (Organizations)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                เพิ่ม/แก้ไข/ลบ รายชื่อสังกัดหรือกลุ่มหน่วยงานบุคลากร เพื่อจัดหมวดหมู่การจอง
              </p>
            </div>
            <div className="pt-2">
              <AdminOrganizationManagementDialog
                organizations={organizations}
                users={users}
                onSuccess={onRefresh}
              />
            </div>
          </div>

          {/* Entitlements Management Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Sliders className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {packages.length} แพ็กเกจ
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                สิทธิ์การตรวจตามสังกัด (Entitlements)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                กำหนดว่าบุคลากรสังกัดใด ได้สิทธิ์ตรวจโปรแกรมใด หรือตรวจฟรีตามเกณฑ์
              </p>
            </div>
            <div className="pt-2">
              <AdminEntitlementsDialog
                organizations={organizations}
                packages={packages}
                onSuccess={onRefresh}
              />
            </div>
          </div>

          {/* Campaign Config Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {campaigns.length} โครงการ
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                โครงการตรวจสุขภาพ (Campaigns)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                สร้างโครงการประจำปี กำหนดวันที่เปิด-ปิดระบบจอง และโควต้าพื้นฐานต่อวัน
              </p>
            </div>
            <div className="pt-2">
              <AdminCampaignConfigDialog
                campaign={campaign}
                campaigns={campaigns}
                organizations={organizations}
                slots={slots}
                bookings={bookings}
                onSuccess={onRefresh}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: รายการตรวจ & แพ็กเกจ (PACKAGES & CATALOG CONFIG) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            2. แคตตาล็อกรายการตรวจ & แพ็กเกจตรวจสุขภาพ
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Checkup Packages Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Package className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  Package A / B
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                โปรแกรมตรวจหลัก (Packages)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                จัดการราคา เงื่อนไขช่วงอายุ สิทธิ์ และเลือกรายการแล็บที่รวมในโปรแกรม
              </p>
            </div>
            <div className="pt-2">
              <AdminPackageConfigDialog packages={packages} onSuccess={onRefresh} />
            </div>
          </div>

          {/* Master Item Catalog Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                  <FlaskConical className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {masterItems.length} รายการ
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Catalog รายการตรวจ (Master Items)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                คลังรายการตรวจแล็บ/เอกซเรย์ ทั้งหมด เช่น CBC, FBS, Lipid, Chest X-Ray ฯลฯ
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsCatalogOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <FlaskConical className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                <span>จัดการ Master Catalog</span>
              </button>
            </div>
          </div>

          {/* Department Rules Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  กติกาเฉพาะแผนก
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                กติกาการตรวจเฉพาะแผนก/ความเสี่ยง
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                บังคับให้ตรวจหรือเลือกได้สำหรับแผนกที่มีความเสี่ยงเฉพาะ (เช่น ห้องแล็บ, เอกซเรย์)
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => setIsDeptRulesOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <Building2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>ตั้งค่ากติกาเฉพาะแผนก</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: สิทธิ์ผู้ใช้งาน & ระบบกลาว (FULL ADMIN ONLY) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            3. การจัดการสิทธิ์ผู้ใช้ & การซิงค์ฐานข้อมูล (เฉพาะ Admin)
          </h2>
        </div>

        {isFullAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Roles Management Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono">
                    Admin Access
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  จัดการสิทธิ์ใช้งานบุคลากร (User Roles)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  กำหนดหรือเปลี่ยนสิทธิ์ของบุคลากรระหว่าง USER, SUPER_STAFF (ผู้จัดการคิว) และ ADMIN
                </p>
              </div>
              <div className="pt-2">
                <UserRoleManagementDialog users={users} onSuccess={onRefresh} />
              </div>
            </div>

            {/* Central DB Sync Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold text-sky-600 dark:text-sky-400 font-mono">
                    HIS / Central DB
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  ซิงค์ข้อมูลเจ้าหน้าที่ (Central DB Sync)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  นำเข้าหรืออัปเดตรายชื่อบุคลากร สังกัด ตำแหน่ง จากระบบฐานข้อมูลกลางโรงพยาบาล
                </p>
              </div>
              <div className="pt-2">
                <CentralDbSyncDialog users={users} onSuccess={onRefresh} />
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-5 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-bold">จำกัดการเข้าถึงส่วนจัดการสิทธิ์</p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                บัญชีของคุณมีสิทธิ์เป็น <span className="font-bold">SUPER_STAFF</span> สามารถกำหนดและตั้งค่ารายการตรวจ/โครงการได้ แต่ไม่สามารถเปลี่ยนสิทธิ์ผู้ใช้หรือสั่งซิงค์ฐานข้อมูลกลางได้
              </p>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG PORTALS FOR CATALOG AND DEPARTMENT RULES */}
      {isCatalogOpen && (
        <AdminItemCatalogDialog
          isOpen={isCatalogOpen}
          onClose={() => setIsCatalogOpen(false)}
          onSuccess={onRefresh}
        />
      )}

      {isDeptRulesOpen && (
        <AdminDepartmentRulesDialog
          isOpen={isDeptRulesOpen}
          onClose={() => setIsDeptRulesOpen(false)}
          masterItems={masterItems}
          departments={uniqueDepartments}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
