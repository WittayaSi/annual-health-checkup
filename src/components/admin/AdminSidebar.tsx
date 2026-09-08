'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CalendarCheck2,
  Users,
  Building2,
  UserX,
  FileSpreadsheet,
  Settings,
  History,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Stethoscope,
  ShieldCheck,
  LayoutDashboard,
  FlaskConical,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { User } from '@/lib/types';

interface AdminSidebarProps {
  activeUser?: User | null;
  unbookedCount?: number;
  criticalDeptCount?: number;
}

export function AdminSidebar({
  activeUser,
  unbookedCount = 0,
  criticalDeptCount = 0,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isFullAdmin = activeUser?.role === 'ADMIN';

  const navGroups = [
    {
      groupTitle: 'การจัดคิวประจำวัน',
      items: [
        {
          href: '/admin/slots',
          label: 'สล็อตโควต้า & ปฏิทิน',
          icon: CalendarCheck2,
          badge: null,
        },
        {
          href: '/admin/attendees',
          label: 'ผู้เข้าตรวจประจำวัน',
          icon: Users,
          badge: null,
        },
      ],
    },
    {
      groupTitle: 'ติดตาม & รายงานวิเคราะห์',
      items: [
        {
          href: '/admin/department-reports',
          label: 'รายงานเปอร์เซ็นต์แผนก',
          icon: Building2,
          badge: criticalDeptCount > 0 ? `${criticalDeptCount} แผนก` : null,
          badgeColor: 'bg-rose-500 text-white',
        },
        {
          href: '/admin/unbooked',
          label: 'ติดตามผู้ยังไม่ได้จอง',
          icon: UserX,
          badge: unbookedCount > 0 ? `${unbookedCount} คน` : null,
          badgeColor: 'bg-amber-500 text-white',
        },
        {
          href: '/admin/reports',
          label: 'ศูนย์รวมรายงานวิเคราะห์',
          icon: FileSpreadsheet,
          badge: 'NEW',
          badgeColor: 'bg-purple-600 text-white',
        },
      ],
    },
    {
      groupTitle: 'การตั้งค่า & ระบบ',
      items: [
        {
          href: '/admin/settings',
          label: 'ตั้งค่าระบบ & Catalog',
          icon: Settings,
          badge: null,
        },
        ...(isFullAdmin
          ? [
              {
                href: '/admin/audit',
                label: 'ประวัติทำรายการ (Audit)',
                icon: History,
                badge: null,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <>
      {/* MOBILE HAMBURGER BUTTON & TOP BAR (Shown on small screens) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="เปิดเมนูส่วนผู้ดูแลระบบ"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
              AH
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
              Admin Portal
            </span>
          </div>
        </div>

        {/* Quick Staff Portal Link */}
        <Link
          href="/booking"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>หน้าจองคิว</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* MOBILE DRAWER OVERLAY BACKDROP */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
        />
      )}

      {/* SIDEBAR CONTAINER (Desktop Sidebar + Mobile Drawer) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isMobileOpen
            ? 'translate-x-0 w-72 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* SIDEBAR HEADER */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-sm shadow-md shadow-emerald-600/20 shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-slate-900 dark:text-white truncate leading-tight">
                  ระบบตรวจสุขภาพ
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  Admin Control Center
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'ขยายแถบเมนู' : 'ย่อแถบเมนู'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SIDEBAR USER INFO BADGE */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs shrink-0">
              {activeUser?.firstName?.[0] || 'A'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {activeUser?.firstName} {activeUser?.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold font-mono ${
                      isFullAdmin
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {activeUser?.role}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate">
                    {activeUser?.department || 'รพ.ท่าสองยาง'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR NAVIGATION ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6 scrollbar-thin">
          {navGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isCollapsed && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
                  {group.groupTitle}
                </p>
              )}

              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const IconComponent = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <IconComponent
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive
                            ? 'text-white'
                            : 'text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                          item.badgeColor || 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* SIDEBAR FOOTER (QUICK LINKS) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-1">
          <Link
            href="/booking"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Stethoscope className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {!isCollapsed && <span>ไปหน้าจองคิวบุคลากร</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
