'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import { User } from '@/lib/types';
import { syncHospitalStaffDataAction } from '@/app/actions';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Users,
  Smartphone,
  Search,
  X,
} from 'lucide-react';

interface CentralDbSyncDialogProps {
  users: User[];
  onSuccess?: () => void;
}

export function CentralDbSyncDialog({ users, onSuccess }: CentralDbSyncDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ syncedCount: number; newUsersCount: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalStaffCount = users.length;
  const lineLinkedCount = users.filter((u) => u.isLineLinked).length;
  const lineLinkedPercent = totalStaffCount > 0 ? Math.round((lineLinkedCount / totalStaffCount) * 100) : 0;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.employeeCode.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      u.department.toLowerCase().includes(q)
    );
  });

  const handleSyncNow = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setSyncResult(null);

    const result = await syncHospitalStaffDataAction();
    setIsLoading(false);

    if (result.success) {
      setSyncResult({
        syncedCount: result.syncedCount,
        newUsersCount: result.newUsersCount,
      });
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(result.error || 'เกิดข้อผิดพลาดในการซิงก์ข้อมูล');
    }
  };

  useModalLock(isOpen && mounted);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors flex items-center gap-1.5"
      >
        <Database className="h-3.5 w-3.5" />
        <span>ซิงก์ฐานข้อมูลกลาง (HIS Sync)</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    ซิงก์ฐานข้อมูลกลาง (HIS Sync)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    นำเข้าข้อมูลบุคลากร และอัปเดตข้อมูลบัญชีผู้ใช้งานระบบ
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs text-slate-700 dark:text-slate-300">
              {/* Sync Actions Box */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    ซิงก์ข้อมูลจาก HOSOffice
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    อัปเดตพนักงาน บัญชีผู้ใช้ สังกัด และสถานะปฏิบัติงาน
                  </p>
                </div>

                <button
                  onClick={handleSyncNow}
                  disabled={isLoading}
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'กำลังซิงก์...' : 'เริ่มซิงก์ข้อมูล'}</span>
                </button>
              </div>

              {errorMsg && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  {errorMsg}
                </div>
              )}

              {syncResult && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>ซิงก์ข้อมูลสำเร็จ: อัปเดต {syncResult.syncedCount} คน (พนักงานใหม่ {syncResult.newUsersCount} คน)</span>
                </div>
              )}

              {/* Stats Overview Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-center">
                  <span className="text-xs text-slate-400">เจ้าหน้าที่ทั้งหมด</span>
                  <p className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">{totalStaffCount} คน</p>
                </div>
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-center">
                  <span className="text-xs text-slate-400">สถานะปฏิบัติงาน</span>
                  <p className="text-base font-semibold text-green-600 dark:text-green-400 mt-0.5">ปกติ</p>
                </div>
              </div>

              {/* Staff List Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">
                    รายชื่อเจ้าหน้าที่ ({filteredUsers.length})
                  </span>

                  <div className="relative w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, รหัส, สังกัด..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                  <div className="max-h-56 overflow-y-auto">
                    <table className="w-full min-w-[500px] text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                        <tr>
                          <th className="p-2.5">เจ้าหน้าที่</th>
                          <th className="p-2.5">สังกัด</th>
                          <th className="p-2.5">ตำแหน่ง</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {filteredUsers.slice(0, 50).map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200">
                              {u.firstName} {u.lastName}
                            </td>

                            <td className="p-2.5 text-slate-600 dark:text-slate-400">{u.department}</td>
                            <td className="p-2.5 text-slate-500">{u.position || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex justify-end shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
