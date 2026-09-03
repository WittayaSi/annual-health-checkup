'use client';

import { useState } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Upload,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Organization, User } from '@/lib/types';
import {
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
  importOrganizationUsersAction,
} from '@/app/actions';

interface AdminOrganizationManagementDialogProps {
  organizations?: Organization[];
  departments?: Organization[];
  users?: User[];
  onSuccess?: () => void;
}

export function AdminOrganizationManagementDialog({
  organizations,
  departments,
  users = [],
  onSuccess,
}: AdminOrganizationManagementDialogProps) {
  const orgList = organizations || departments || [];
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'EDIT' | 'IMPORT'>('LIST');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  // Form State (Single clean field: Name)
  const [name, setName] = useState('');

  // Import State
  const [importInput, setImportInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setName('');
    setErrorMsg(null);
    setSuccessMsg(null);
    setViewMode('CREATE');
  };

  const handleOpenEdit = (org: Organization) => {
    setSelectedOrg(org);
    setName(org.name);
    setErrorMsg(null);
    setSuccessMsg(null);
    setViewMode('EDIT');
  };

  const handleOpenImport = (org: Organization) => {
    setSelectedOrg(org);
    setImportInput(
      `EMP001, นายสมชาย, ใจดี, somchai, 1234, ครู\nEMP002, นางสาวสิริพร, วงศ์ใหญ่, siriporn, 5678, เจ้าหน้าที่`
    );
    setErrorMsg(null);
    setSuccessMsg(null);
    setViewMode('IMPORT');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อสังกัดองค์กรหลัก');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    const res = await createOrganizationAction({ name: name.trim() });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('เพิ่มสังกัดองค์กรหลักใหม่เรียบร้อยแล้ว');
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างสังกัดองค์กร');
    }
  };

  const handleUpdate = async () => {
    if (!selectedOrg || !name.trim()) {
      setErrorMsg('กรุณากรอกชื่อสังกัดองค์กร');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    const res = await updateOrganizationAction(selectedOrg.id, { name: name.trim() });
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('อัปเดตข้อมูลสังกัดองค์กรเรียบร้อยแล้ว');
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1200);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการอัปเดตสังกัดองค์กร');
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    setErrorMsg(null);

    const res = await deleteOrganizationAction(id);
    setIsLoading(false);

    if (res.success) {
      setDeleteConfirmId(null);
      setSuccessMsg('ลบสังกัดองค์กรเรียบร้อยแล้ว');
      setTimeout(() => {
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1000);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการลบสังกัดองค์กร');
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedOrg || !importInput.trim()) {
      setErrorMsg('กรุณาระบุรายชื่อเจ้าหน้าที่ที่ต้องการนำเข้า');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const lines = importInput.split('\n').map((l) => l.trim()).filter(Boolean);
    const parsedUsers = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      return {
        employeeCode: parts[0] || `EMP-${Date.now()}`,
        firstName: parts[1] || 'เจ้าหน้าที่',
        lastName: parts[2] || 'นำเข้า',
        username: parts[3] || parts[0],
        nationalId: parts[4] || '1234567890123',
        position: parts[5] || 'เจ้าหน้าที่',
        organization: selectedOrg.name,
      };
    });

    const res = await importOrganizationUsersAction(selectedOrg.name, parsedUsers);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`นำเข้าบุคลากรเข้าสู่สังกัด "${selectedOrg.name}" จำนวน ${res.count} คนสำเร็จ`);
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการนำเข้าบุคลากร');
    }
  };

  useModalLock(isOpen);

  return (
    <>
      <button
        onClick={() => {
          setViewMode('LIST');
          setIsOpen(true);
        }}
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
      >
        <Building2 className="h-4 w-4 text-emerald-600" />
        <span>จัดการสังกัดองค์กร ({orgList.length})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    บริหารจัดการสังกัดองค์กรหลัก (Organizations)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    เพิ่ม แก้ไข ลบ สังกัดหลัก เช่น โรงพยาบาลท่าสองยาง, สสอ.ท่าสองยาง, โรงเรียนต่างๆ
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 text-xs text-green-700 dark:text-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {viewMode === 'LIST' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      รายการสังกัดองค์กรทั้งหมด ({orgList.length} แห่ง)
                    </span>
                    <button
                      onClick={handleOpenCreate}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>เพิ่มสังกัดองค์กรใหม่</span>
                    </button>
                  </div>

                  <div className="grid gap-3">
                    {orgList.map((org) => {
                      const staffCount = users.filter(
                        (u) => u.organization === org.name || u.department === org.name
                      ).length;
                      return (
                        <div
                          key={org.id}
                          className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 flex items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="space-y-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {org.name}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              <Users className="h-3.5 w-3.5" />
                              <span>เจ้าหน้าที่ในสังกัด: {staffCount} คน</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => handleOpenImport(org)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors"
                              title="นำเข้าบุคลากรเข้าสังกัดนี้"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>นำเข้าคน</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(org)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="แก้ไขสังกัดองค์กร"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {deleteConfirmId === org.id ? (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 bg-red-50 dark:bg-red-950/40 p-1.5 rounded-lg border border-red-200 dark:border-red-900/60">
                                {staffCount > 0 && (
                                  <span className="text-[11px] text-red-700 dark:text-red-300 font-medium">
                                    มีบุคลากร {staffCount} คน!
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(org.id)}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                                  >
                                    ยืนยันลบ
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(org.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="ลบสังกัดองค์กร"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(viewMode === 'CREATE' || viewMode === 'EDIT') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {viewMode === 'CREATE' ? 'เพิ่มสังกัดองค์กรหลักใหม่' : `แก้ไขสังกัดองค์กร (${selectedOrg?.name})`}
                    </h4>
                    <button
                      onClick={() => setViewMode('LIST')}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    >
                      ← กลับ
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อสังกัดองค์กรหลัก (Organization Name)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น โรงพยาบาลท่าสองยาง, สสอ.ท่าสองยาง, โรงเรียนท่าสองยางวิทยาคม"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setViewMode('LIST')}
                      className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={viewMode === 'CREATE' ? handleCreate : handleUpdate}
                      disabled={isLoading}
                      className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลองค์กร'}
                    </button>
                  </div>
                </div>
              )}

              {viewMode === 'IMPORT' && selectedOrg && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                        นำเข้ารายชื่อบุคลากรเข้าสังกัด: &quot;{selectedOrg.name}&quot;
                      </h4>
                      <p className="text-xs text-slate-500">
                        กรอกหรือวางรายชื่อบุคลากรแยกตามบรรทัด รูปแบบ: รหัสพนักงาน, ชื่อ, นามสกุล, Username, รหัสผ่าน/เลข4ตัว, ตำแหน่ง
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('LIST')}
                      className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 shrink-0"
                    >
                      ← กลับ
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      ข้อมูลรายชื่อบุคลากร (CSV / Text)
                    </label>
                    <textarea
                      rows={8}
                      value={importInput}
                      onChange={(e) => setImportInput(e.target.value)}
                      placeholder="EMP001, นายสมชาย, ใจดี, somchai, 1234, ครู\nEMP002, นางสาวสิริพร, วงศ์ใหญ่, siriporn, 5678, เจ้าหน้าที่"
                      className="w-full font-mono text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">
                      *บุคลากรที่นำเข้าจะถูกกำหนดสังกัดองค์กรเป็น &quot;{selectedOrg.name}&quot; สำหรับการเข้าถึงสิทธิ์โครงการ
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('LIST')}
                        className="px-4 py-2 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteImport}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4" />
                        <span>{isLoading ? 'กำลังนำเข้า...' : 'ยืนยันการนำเข้า'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
