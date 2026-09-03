'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck2,
  User as UserIcon,
  KeyRound,
  AlertCircle,
  X,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  loginWithHospitalCredentialsAction,
  loginWithLineAction,
} from '@/app/actions';
import { User } from '@/lib/types';

interface LoginDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDialogModal({
  isOpen,
  onClose,
}: LoginDialogModalProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loginMode, setLoginMode] = useState<'LINE_BIND' | 'USERNAME'>('USERNAME');

  // Hospital credentials login state
  const [username, setUsername] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successUser, setSuccessUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalLock(isOpen && mounted);

  if (!isOpen || !mounted) return null;

  // 1. Handle Direct Hospital Credentials Login
  const handleHospitalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !passwordInput.trim()) {
      setErrorMsg('กรุณากรอก Username และรหัสผ่านระบบ HosOffice ให้ครบถ้วน');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await loginWithHospitalCredentialsAction(username, passwordInput);
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessUser(res.user);
      setTimeout(() => {
        onClose();
        router.push('/booking');
      }, 900);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    }
  };

  // 2. Handle Fast 1-Click Login for LINE accounts
  const handleFastLineLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    const demoLineUserId = 'U1001234567890abcdef';
    const res = await loginWithLineAction(demoLineUserId);
    setIsLoading(false);

    if (res.success && res.user) {
      setSuccessUser(res.user);
      setTimeout(() => {
        onClose();
        router.push('/booking');
      }, 900);
    } else {
      setErrorMsg(res.error || 'บัญชี LINE นี้ยังไม่ได้ผูกกับระบบ กรุณาเข้าสู่ระบบด้วย Username ด้านล่างเพื่อผูกบัญชี');
    }
  };

  const modalJSX = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">

      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 dark:bg-slate-950 p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                เข้าสู่ระบบจองคิวตรวจสุขภาพ
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                สำหรับเจ้าหน้าที่และบุคลากรโรงพยาบาล
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
          {successUser ? (
            <div className="py-8 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/20 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  เข้าสู่ระบบสำเร็จ!
                </h4>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  ยินดีต้อนรับ คุณ{successUser.firstName} {successUser.lastName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {successUser.department || successUser.organization || 'โรงพยาบาลท่าสองยาง'}
                </p>
              </div>
              <div className="pt-3 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                <span>กำลังนำคุณเข้าสู่ระบบจองคิว...</span>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* HOSPITAL CREDENTIALS FORM */}
              <form onSubmit={handleHospitalLogin} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Username จากระบบ HosOffice
                  </label>

                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="กรอก Username จากระบบ HosOffice"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                    รหัสผ่าน (Password จากระบบ HosOffice)
                  </label>

                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="กรอกรหัสผ่านระบบ HosOffice"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer p-0.5"
                      title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                  >
                    <span>{isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
                    {!isLoading && <ArrowRight className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
