'use client';

import { useModalLock } from '@/lib/useModalLock';

import { useState } from 'react';
import { User } from '@/lib/types';
import {
  bindLineAccountAction,
  loginWithLineAction,
  unbindLineAccountAction,
} from '@/app/actions';
import { LineFlexNotificationModal } from '../line/LineFlexNotificationModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Smartphone,
  RefreshCw,
  LogOut,
  KeyRound,
  AlertCircle,
  X,
  UserCheck,
} from 'lucide-react';

interface LineAuthModalProps {
  activeUser: User;
  onSuccess?: () => void;
}

export function LineAuthModal({ activeUser, onSuccess }: LineAuthModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  useModalLock(isOpen);
  const [usernameInput, setUsernameInput] = useState(activeUser.username || '');
  const [last4Input, setLast4Input] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isLinked = !!activeUser.isLineLinked;

  const handleBindLine = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!usernameInput.trim()) {
      setErrorMsg('กรุณากรอก Username ที่ใช้ในระบบโรงพยาบาล');
      return;
    }

    if (!last4Input.trim() || last4Input.trim().length !== 4) {
      setErrorMsg('กรุณากรอกเลขบัตรประชาชน 4 ตัวท้ายให้ครบถ้วน');
      return;
    }

    setIsLoading(true);

    const result = await bindLineAccountAction(usernameInput.trim(), last4Input.trim(), {
      lineUserId: `line-${activeUser.id}-${Date.now()}`,
      lineDisplayName: `${activeUser.firstName} ${activeUser.lastName} (LINE OA)`,
    });

    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessMsg(`ผูกบัญชี LINE OA สำเร็จ (${result.user.firstName} ${result.user.lastName})`);
      setLast4Input('');
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการผูกบัญชี LINE');
    }
  };

  const [showConfirmUnbind, setShowConfirmUnbind] = useState(false);

  const executeUnbindLine = async () => {
    setShowConfirmUnbind(false);
    setIsLoading(true);
    setErrorMsg(null);

    const result = await unbindLineAccountAction(activeUser.id);
    setIsLoading(false);

    if (result.success) {
      setSuccessMsg('ยกเลิกการผูกบัญชี LINE OA เรียบร้อยแล้ว');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsOpen(false);
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการยกเลิกผูกบัญชี');
    }
  };

  const handleTest1ClickLogin = async () => {
    if (!activeUser.lineUserId) return;
    setIsLoading(true);
    setErrorMsg(null);

    const result = await loginWithLineAction(activeUser.lineUserId);
    setIsLoading(false);

    if (result.success) {
      setSuccessMsg('ทดสอบ 1-Click Auto Login ผ่าน LINE สำเร็จ');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsOpen(false);
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการทดสอบ 1-Click Login');
    }
  };

  const [bindMethod, setBindMethod] = useState<'FORM' | 'QR'>('QR');
  const [showFlexPreviewModal, setShowFlexPreviewModal] = useState(false);

  return (
    <>
      {/* Status Card Banner */}
      <div className="w-full max-w-full overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00B900]/10 text-[#00B900] dark:bg-[#00B900]/20 shrink-0 border border-[#00B900]/20">
            <Smartphone className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                สถานะ LINE OA
              </span>
              {isLinked ? (
                <span className="inline-flex items-center gap-1 rounded bg-green-50 dark:bg-green-950/40 px-2 py-0.5 text-xs text-green-700 dark:text-green-400 font-medium">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[140px]">ผูกแล้ว ({activeUser.lineDisplayName || 'LINE OA'})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>ยังไม่ผูก</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
              {isLinked
                ? `บัญชี: ${activeUser.lineDisplayName || 'ผูกเรียบร้อยแล้ว'}`
                : 'ผูกกับ Hospital Username เพื่อรับการแจ้งเตือนคิวและ 1-Click Login'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {isLinked && (
            <button
              onClick={() => setShowFlexPreviewModal(true)}
              className="px-3 py-2 sm:py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <QrCode className="h-3.5 w-3.5 shrink-0" />
              <span>ดูตัวอย่างการแจ้งเตือน LINE</span>
            </button>
          )}

          <button
            onClick={() => {
              setUsernameInput(activeUser.username || '');
              setIsOpen(true);
            }}
            className="px-3.5 py-2 sm:py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto"
          >
            <QrCode className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{isLinked ? 'จัดการบัญชี LINE' : 'ผูกบัญชี LINE OA'}</span>
          </button>
        </div>
      </div>

      {/* Dialog Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="bg-[#243545] p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[#00B900] flex items-center justify-center text-white font-bold">
                  <Smartphone className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">
                    ผูกบัญชี LINE Official Account
                  </h3>
                  <p className="text-xs text-slate-300">
                    ระบบผูกบัญชีอัตโนมัติประจำปี 2570
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Selector Tabs if not linked */}
            {!isLinked && (
              <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs font-medium">
                <button
                  onClick={() => setBindMethod('QR')}
                  className={`flex-1 py-2.5 text-center transition-colors ${
                    bindMethod === 'QR'
                      ? 'border-b-2 border-[#00B900] text-[#00B900] font-bold bg-white dark:bg-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  1. สแกน QR Code LINE OA
                </button>
                <button
                  onClick={() => setBindMethod('FORM')}
                  className={`flex-1 py-2.5 text-center transition-colors ${
                    bindMethod === 'FORM'
                      ? 'border-b-2 border-[#00B900] text-[#00B900] font-bold bg-white dark:bg-slate-900'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  2. ยืนยันด้วย Username
                </button>
              </div>
            )}

            {/* Content Body */}
            <div className="p-5 space-y-4 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <XCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-xs text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {isLinked ? (
                /* Already Linked View */
                <div className="space-y-4">
                  <div className="rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 p-4 border border-emerald-200 dark:border-emerald-900/50 space-y-3 text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                      <ShieldCheck className="h-5 w-5 text-[#00B900]" />
                      <span>ผูกบัญชี LINE OA เรียบร้อยแล้ว</span>
                    </div>

                    <div className="space-y-1.5 text-slate-700 dark:text-slate-300 pl-1">
                      <div>ชื่อผู้ใช้งาน: <strong className="text-slate-900 dark:text-white font-semibold">{activeUser.firstName} {activeUser.lastName}</strong></div>
                      <div>Username โรงพยาบาล: <strong className="text-slate-900 dark:text-white font-mono">{activeUser.username || '-'}</strong></div>

                      <div>LINE Display Name: <strong className="text-[#00B900] font-semibold">{activeUser.lineDisplayName || `${activeUser.firstName} (LINE OA)`}</strong></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        setShowFlexPreviewModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00B900] hover:bg-[#009900] py-2.5 text-xs font-bold text-white transition-colors shadow-sm"
                    >
                      <QrCode className="h-4 w-4" />
                      <span>ดูตัวอย่างการแจ้งเตือน LINE Flex Message</span>
                    </button>

                    <button
                      onClick={handleTest1ClickLogin}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 py-2.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                      <span>ทดสอบ 1-Click Auto Login ผ่าน LINE</span>
                    </button>

                    <button
                      onClick={() => setShowConfirmUnbind(true)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 py-2 text-xs text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>ยกเลิกการผูกบัญชี LINE OA</span>
                    </button>
                  </div>
                </div>
              ) : bindMethod === 'QR' ? (
                /* QR Code Method */
                <div className="space-y-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    สแกน QR Code เพื่อเพิ่มเพื่อนบัญชีทางการ <strong>@tak-health-checkup</strong> จากนั้นกดปุ่มยืนยันผูกบัญชี
                  </p>

                  <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 inline-block shadow-inner">
                    {/* SVG QR Code Simulation */}
                    <div className="w-44 h-44 bg-slate-900 p-2 rounded-xl flex items-center justify-center relative mx-auto">
                      <div className="w-full h-full bg-white p-2 rounded-lg flex flex-col items-center justify-center space-y-1">
                        <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 bg-slate-100 rounded">
                          <div className="bg-[#00B900] rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-[#00B900] rounded" />

                          <div className="bg-slate-900 rounded" />
                          <div className="bg-white rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-white rounded" />
                          <div className="bg-slate-900 rounded" />

                          <div className="bg-slate-900 rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-[#00B900] rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-slate-900 rounded" />

                          <div className="bg-slate-900 rounded" />
                          <div className="bg-white rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-white rounded" />
                          <div className="bg-slate-900 rounded" />

                          <div className="bg-[#00B900] rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-slate-900 rounded" />
                          <div className="bg-[#00B900] rounded" />
                        </div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-9 w-9 rounded-full bg-[#00B900] text-white flex items-center justify-center border-2 border-white font-bold text-xs shadow-md">
                          LINE
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl text-left text-xs space-y-1 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#00B900]" />
                      <span>ขั้นตอนการผูกบัญชี:</span>
                    </div>
                    <ol className="list-decimal pl-5 space-y-0.5 text-slate-500 dark:text-slate-400">
                      <li>สแกน QR Code ด้านบนเพื่อเพิ่มเพื่อน LINE OA</li>
                      <li>พิมพ์ <strong>#ผูกบัญชี</strong> ในช่องแชท LINE OA</li>
                      <li>หรือกดปุ่ม &quot;ผูกบัญชีทันที (1-Click Pairing)&quot; ด้านล่าง</li>
                    </ol>
                  </div>

                  <button
                    onClick={(e) => {
                      setUsernameInput(activeUser.username || '');

                      setLast4Input(activeUser.nationalId ? activeUser.nationalId.slice(-4) : '1234');
                      handleBindLine(e as any);
                    }}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#00B900] hover:bg-[#009900] py-2.5 text-xs font-bold text-white transition-colors shadow-md disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    <span>ยืนยันผูกบัญชีกับ LINE OA นี้ทันที (1-Click)</span>
                  </button>
                </div>
              ) : (
                /* Not Linked - Form View */
                <form onSubmit={handleBindLine} className="space-y-3">
                  <p className="text-xs text-slate-500">
                    กรอก Username ในระบบโรงพยาบาล และเลขบัตรประชาชน 4 ตัวท้ายเพื่อยืนยันตัวตน
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Hospital Username / รหัสพนักงาน
                      </label>
                      <input
                        type="text"
                        required
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="somchai.j"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B900]/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        เลขบัตรประชาชน 4 ตัวท้าย
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          maxLength={4}
                          required
                          value={last4Input}
                          onChange={(e) => setLast4Input(e.target.value.replace(/\D/g, ''))}
                          placeholder="1234"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00B900]/40"
                        />
                        <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 py-2.5 text-xs font-medium text-white transition-colors disabled:opacity-50 mt-2"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 text-[#00B900]" />
                    )}
                    <span>ยืนยันตัวตนและผูกบัญชี LINE OA</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LINE Flex Message Simulator Modal */}
      <LineFlexNotificationModal
        isOpen={showFlexPreviewModal}
        onClose={() => setShowFlexPreviewModal(false)}
        user={activeUser}
      />

      <ConfirmDialog
        isOpen={showConfirmUnbind}
        title="ยืนยันการยกเลิกผูกบัญชี LINE"
        message="คุณต้องการยกเลิกการผูกบัญชี LINE OA สำหรับรับการแจ้งเตือนใช่หรือไม่?"
        confirmText="ยืนยันยกเลิก"
        cancelText="ปิดหน้าต่าง"
        type="warning"
        onConfirm={executeUnbindLine}
        onCancel={() => setShowConfirmUnbind(false)}
        isLoading={isLoading}
      />
    </>
  );
}
