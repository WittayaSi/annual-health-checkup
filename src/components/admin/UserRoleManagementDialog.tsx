'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { User as UserType } from '@/lib/types';
import { updateUserRoleAction } from '@/app/actions';

interface UserRoleManagementDialogProps {
  users?: UserType[];
}

export function UserRoleManagementDialog({ users = [] }: UserRoleManagementDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'SUPER_STAFF' | 'STAFF'>('ALL');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      u.firstName.toLowerCase().includes(term) ||
      u.lastName.toLowerCase().includes(term) ||
      u.employeeCode.toLowerCase().includes(term) ||
      u.department.toLowerCase().includes(term) ||
      (u.username && u.username.toLowerCase().includes(term));

    if (roleFilter === 'ADMIN') return matchesSearch && u.role === 'ADMIN';
    if (roleFilter === 'SUPER_STAFF') return matchesSearch && u.role === 'SUPER_STAFF';
    if (roleFilter === 'STAFF') return matchesSearch && u.role === 'STAFF';
    return matchesSearch;
  });

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const superStaffCount = users.filter((u) => u.role === 'SUPER_STAFF').length;
  const staffCount = users.filter((u) => u.role === 'STAFF').length;

  const handleRoleChange = async (targetUser: UserType, newRole: 'ADMIN' | 'SUPER_STAFF' | 'STAFF') => {
    setUpdatingUserId(targetUser.id);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await updateUserRoleAction(targetUser.id, newRole);
      if (res.success) {
        setSuccessMessage(`ปรับสิทธิ์ให้ ${targetUser.firstName} เป็น ${newRole} เรียบร้อยแล้ว`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setErrorMessage(res.error || 'เกิดข้อผิดพลาดในการปรับสิทธิ์');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการปรับสิทธิ์';
      setErrorMessage(message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  useModalLock(isOpen && mounted);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
        <span>จัดการสิทธิ์เจ้าหน้าที่ ({adminCount} Admin)</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">จัดการสิทธิ์ผู้ดูแลระบบ (Role Management)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    กำหนดสิทธิ์ Admin / Staff ให้แก่เจ้าหน้าที่
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

            {/* Content Body & Filters */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-slate-800 dark:text-slate-200 text-xs">
              {successMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 p-3 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-900">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ, รหัส, สังกัด..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 flex-wrap">
                  {(['ALL', 'ADMIN', 'SUPER_STAFF', 'STAFF'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoleFilter(r)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        roleFilter === r
                          ? 'bg-slate-800 dark:bg-slate-700 text-white'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {r === 'ALL'
                        ? `ทั้งหมด (${users.length})`
                        : r === 'ADMIN'
                        ? `Admin (${adminCount})`
                        : r === 'SUPER_STAFF'
                        ? `Super Staff (${superStaffCount})`
                        : `Staff (${staffCount})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff Table */}
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-2.5">เจ้าหน้าที่ / สังกัด</th>
                        <th className="px-4 py-2.5">ตำแหน่ง</th>
                        <th className="px-4 py-2.5 text-center">สิทธิ์ปัจจุบัน</th>
                        <th className="px-4 py-2.5 text-right">เปลี่ยนระดับสิทธิ์</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-400">
                            ไม่พบรายชื่อเจ้าหน้าที่
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="px-4 py-2.5">
                              <span className="font-medium text-slate-900 dark:text-white">
                                {u.firstName} {u.lastName}
                              </span>
                              <span className="block text-[10px] text-slate-400">{u.department}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {u.position || '-'}
                            </td>

                            <td className="px-4 py-2.5 text-center">
                              {u.role === 'ADMIN' ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold">
                                  🔴 ADMIN
                                </span>
                              ) : u.role === 'SUPER_STAFF' ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
                                  🟣 SUPER_STAFF
                                </span>
                              ) : (
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium">
                                  ⚪ STAFF
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-2.5 text-right">
                              <select
                                value={u.role || 'STAFF'}
                                disabled={updatingUserId === u.id}
                                onChange={(e) =>
                                  handleRoleChange(u, e.target.value as 'ADMIN' | 'SUPER_STAFF' | 'STAFF')
                                }
                                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                              >
                                <option value="ADMIN">🔴 ADMIN (ผู้ดูแลระบบสูงสุด)</option>
                                <option value="SUPER_STAFF">🟣 SUPER_STAFF (จัดการคิว)</option>
                                <option value="STAFF">⚪ STAFF (เจ้าหน้าที่ทั่วไป)</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 border-t border-slate-200 dark:border-slate-800 text-right shrink-0">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs transition-colors"
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
