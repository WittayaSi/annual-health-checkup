'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Hospital,
  ShieldCheck,
  CalendarCheck2,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { User, Campaign } from '@/lib/types';
import { switchUserAction, logoutAction } from '@/app/actions';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface NavbarProps {
  activeUser: User | null;
  allUsers: User[];
  campaign?: Campaign;
}

export function Navbar({ activeUser, allUsers, campaign }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsLoading(true);
    setIsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    await logoutAction();
    setIsLoading(false);
    router.push('/');
  };

  const isAdmin = activeUser?.role === 'ADMIN' || activeUser?.role === 'SUPER_STAFF';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shrink-0">
            <Hospital className="h-5 w-5" />
          </div>
          <div>
            <span className="font-semibold text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
              ระบบจองตรวจสุขภาพ
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              โครงการตรวจสุขภาพประจำปี
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname === '/'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Hospital className="h-4 w-4 text-slate-500" />
            <span>หน้าหลัก</span>
          </Link>
          <Link
            href="/booking"
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              pathname.startsWith('/booking')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CalendarCheck2 className="h-4 w-4 text-slate-500" />
            <span>จองวันตรวจสุขภาพ</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>ผู้ดูแลระบบ</span>
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User Profile / Dropdown */}
          {activeUser ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-800 dark:bg-slate-700 text-white font-medium text-xs shrink-0">
                  {activeUser.firstName ? activeUser.firstName[0] : 'U'}
                </div>

                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                      {activeUser.firstName} {activeUser.lastName}
                    </span>
                    {isAdmin && (
                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-bold font-mono">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {activeUser.department}
                  </p>
                </div>

                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu / Profile Card */}
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 p-3 shadow-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">
                          บัญชีผู้ใช้งานระบบ
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                        {activeUser.firstName} {activeUser.lastName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeUser.department} · {activeUser.position || 'เจ้าหน้าที่'}
                      </p>
                    </div>

                    {/* Theme Selector inside Profile Dropdown Card */}
                    <div className="px-1 py-1">
                      <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>โหมดการแสดงผล (Theme)</span>
                      </p>
                      <ThemeToggle variant="inline" />
                    </div>

                    {/* Navigation Items in Profile Dropdown (Especially for Mobile/Tablet) */}
                    <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <Link
                        href="/"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <Hospital className="h-4 w-4 text-slate-400" />
                        <span>หน้าหลัก</span>
                      </Link>
                      <Link
                        href="/booking"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        <CalendarCheck2 className="h-4 w-4 text-slate-400" />
                        <span>จองวันตรวจสุขภาพ</span>
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900"
                        >
                          <ShieldCheck className="h-4 w-4 text-emerald-600" />
                          <span>เมนูผู้ดูแลระบบ (Admin Panel)</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout Action Button */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors border border-red-200 dark:border-red-900/50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>ออกจากระบบ (Logout)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation Links */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-1 shadow-lg">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold ${
              pathname === '/'
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Hospital className="h-4 w-4 text-slate-500" />
            <span>หน้าหลัก</span>
          </Link>

          <Link
            href="/booking"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold ${
              pathname.startsWith('/booking')
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <CalendarCheck2 className="h-4 w-4 text-slate-500" />
            <span>จองวันตรวจสุขภาพ</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-xs"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>ผู้ดูแลระบบ (Admin Dashboard)</span>
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
