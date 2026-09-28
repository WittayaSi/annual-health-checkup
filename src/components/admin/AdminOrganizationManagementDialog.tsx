'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import * as XLSX from 'xlsx';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Upload,
  X,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  FileText,
  FileUp,
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

  // Import State (Excel file upload & template download)
  const [importTab, setImportTab] = useState<'EXCEL' | 'TEXT'>('EXCEL');
  const [importInput, setImportInput] = useState('');
  const [parsedUsers, setParsedUsers] = useState<Partial<User>[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useModalLock(isOpen);

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
    setImportTab('EXCEL');
    setUploadedFileName(null);
    setParsedUsers([]);
    setImportInput(
      `EMP001, นายสมชาย, ใจดี, somchai, 1234567890123, ครูชำนาญการ, ฝ่ายบริหาร\nEMP002, นางสาวสิริพร, วงศ์ใหญ่, siriporn, 5678901234567, นักวิชาการสาธารณสุข, กลุ่มงานการพยาบาล`
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

  // Helper to parse Date of Birth string or Excel date serial number to YYYY-MM-DD
  const parseDob = (val: any): string | undefined => {
    if (val === null || val === undefined || val === '') return undefined;
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    const str = String(val).trim();
    if (!str) return undefined;

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      let [y, m, d] = str.split('-').map(Number);
      if (y > 2400) y -= 543;
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    // DD/MM/YYYY or DD-MM-YYYY or YYYY/MM/DD
    const parts = str.split(/[/.\-]/);
    if (parts.length === 3) {
      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);

      if (d > 1000) {
        const temp = d;
        d = y;
        y = temp;
      }

      if (y > 2400) y -= 543;
      if (y > 1900 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    return undefined;
  };

  const parseGender = (rawGender: any, prefix: string): 'MALE' | 'FEMALE' => {
    const gStr = String(rawGender || '').trim().toLowerCase();
    const pStr = prefix.trim().toLowerCase();

    if (gStr.includes('หญิง') || gStr.includes('female') || gStr === 'f' || gStr.includes('นาง')) {
      return 'FEMALE';
    }
    if (gStr.includes('ชาย') || gStr.includes('male') || gStr === 'm' || gStr.includes('นาย')) {
      return 'MALE';
    }
    if (pStr.includes('หญิง') || pStr.includes('นาง')) {
      return 'FEMALE';
    }
    return 'MALE';
  };

  // Download Excel Template for importing organization staff
  const handleDownloadExcelTemplate = (orgName: string) => {
    const templateRows = [
      {
        'รหัสพนักงาน': 'EMP-001',
        'เพศ (ชาย/หญิง)': 'ชาย',
        'คำนำหน้า': 'นาย',
        'ชื่อ': 'สมชาย',
        'นามสกุล': 'ใจดี',
        'เลขบัตรประชาชน': '1234567890123',
        'วันเดือนปีเกิด (YYYY-MM-DD)': '1990-05-15',
        'ชื่อผู้ใช้งาน (Username - ถ้าไม่ระบุใช้เลขบัตรฯ)': '1234567890123',
        'รหัสผ่าน (ถ้าไม่ระบุใช้เลขบัตรฯ 4 หลักท้าย)': '0123',
        'ตำแหน่ง': 'ครูชำนาญการ',
        'แผนก/หน่วยงานย่อย': 'ฝ่ายบริหารงานบุคคล',
        'เบอร์โทรศัพท์': '0812345678',
      },
      {
        'รหัสพนักงาน': 'EMP-002',
        'เพศ (ชาย/หญิง)': 'หญิง',
        'คำนำหน้า': 'นางสาว',
        'ชื่อ': 'สิริพร',
        'นามสกุล': 'วงศ์ใหญ่',
        'เลขบัตรประชาชน': '5678901234567',
        'วันเดือนปีเกิด (YYYY-MM-DD)': '1995-12-20',
        'ชื่อผู้ใช้งาน (Username - ถ้าไม่ระบุใช้เลขบัตรฯ)': '5678901234567',
        'รหัสผ่าน (ถ้าไม่ระบุใช้เลขบัตรฯ 4 หลักท้าย)': '4567',
        'ตำแหน่ง': 'นักวิชาการสาธารณสุข',
        'แผนก/หน่วยงานย่อย': 'กลุ่มงานการพยาบาล',
        'เบอร์โทรศัพท์': '0898765432',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 18 },
      { wch: 20 },
      { wch: 26 },
      { wch: 34 },
      { wch: 34 },
      { wch: 24 },
      { wch: 24 },
      { wch: 16 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อเจ้าหน้าที่');
    const cleanOrgName = orgName.replace(/[/\\?%*:|"<>]/g, '_');
    XLSX.writeFile(workbook, `แบบฟอร์มนำเข้าเจ้าหน้าที่_${cleanOrgName}.xlsx`);
  };

  // Handle Excel/CSV File Upload & Read
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!jsonRows || jsonRows.length === 0) {
          setErrorMsg('ไม่พบข้อมูลเจ้าหน้าที่ในไฟล์ที่เลือก');
          setParsedUsers([]);
          return;
        }

        const mapped: Partial<User>[] = jsonRows.map((r, idx) => {
          const empCode = String(
            r['รหัสพนักงาน'] || r['รหัสเจ้าหน้าที่'] || r['employeeCode'] || r['ID'] || r['Code'] || ''
          ).trim();

          const prefix = String(r['คำนำหน้า'] || r['prefix'] || '').trim();
          let rawFirstName = String(r['ชื่อ'] || r['firstName'] || r['First Name'] || '').trim();
          const lastName = String(r['นามสกุล'] || r['lastName'] || r['Last Name'] || '').trim();

          let firstName = rawFirstName;
          if (prefix && !rawFirstName.startsWith(prefix)) {
            firstName = `${prefix}${rawFirstName}`;
          }

          const nationalId = String(
            r['เลขบัตรประชาชน'] || r['เลขประจำตัวประชาชน'] || r['nationalId'] || r['CID'] || ''
          ).trim() || '1234567890123';

          const username = String(
            r['ชื่อผู้ใช้งาน (Username - ถ้าไม่ระบุใช้เลขบัตรฯ)'] ||
            r['ชื่อผู้ใช้งาน (Username)'] ||
            r['ชื่อผู้ใช้งาน'] ||
            r['Username'] ||
            r['username'] ||
            nationalId ||
            empCode
          ).trim();

          const rawPass = String(
            r['รหัสผ่าน (ถ้าไม่ระบุใช้เลขบัตรฯ 4 หลักท้าย)'] ||
            r['รหัสผ่าน (ถ้าไม่ระบุใช้ 4 หลักท้าย CID)'] ||
            r['รหัสผ่าน'] ||
            r['Password'] ||
            r['password'] ||
            ''
          ).trim();

          const password = rawPass || (nationalId.length >= 4 ? nationalId.slice(-4) : '1234');
          const gender = parseGender(r['เพศ (ชาย/หญิง)'] || r['เพศ'] || r['gender'] || r['Sex'], prefix);
          const dob = parseDob(r['วันเดือนปีเกิด (YYYY-MM-DD)'] || r['วันเดือนปีเกิด'] || r['วันเกิด'] || r['dob'] || r['DOB']);

          const position = String(r['ตำแหน่ง'] || r['position'] || 'เจ้าหน้าที่').trim();
          const department = String(r['แผนก/หน่วยงานย่อย'] || r['แผนก'] || r['department'] || '').trim();
          const phone = String(r['เบอร์โทรศัพท์'] || r['เบอร์โทร'] || r['phone'] || '').trim();

          return {
            employeeCode: empCode || `EMP-${Date.now()}-${idx + 1}`,
            firstName: firstName || `เจ้าหน้าที่${idx + 1}`,
            lastName: lastName || 'นำเข้า',
            gender,
            dob,
            username,
            nationalId,
            password,
            position,
            department,
            phone,
            organization: selectedOrg?.name || '',
          };
        });

        setParsedUsers(mapped);
      } catch {
        setErrorMsg('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบรูปแบบไฟล์');
        setParsedUsers([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Sync parsed users if user types/pastes text in CSV Text tab
  useEffect(() => {
    if (importTab === 'TEXT' && importInput.trim()) {
      const lines = importInput.split('\n').map((l) => l.trim()).filter(Boolean);
      const rows: Partial<User>[] = lines.map((line, idx) => {
        const parts = line.split(',').map((p) => p.trim());
        const empCode = parts[0] || `EMP-${Date.now()}-${idx + 1}`;
        const fname = parts[1] || 'เจ้าหน้าที่';
        const lname = parts[2] || 'นำเข้า';
        const cid = parts[3] || '1234567890123';
        const gender = parseGender(parts[4], fname);
        const dob = parseDob(parts[5]);
        const pos = parts[6] || 'เจ้าหน้าที่';
        const dept = parts[7] || '';
        const userPass = parts[8] || (cid.length >= 4 ? cid.slice(-4) : '1234');

        return {
          employeeCode: empCode,
          firstName: fname,
          lastName: lname,
          nationalId: cid,
          username: cid,
          password: userPass,
          gender,
          dob,
          position: pos,
          department: dept,
          organization: selectedOrg?.name || '',
        };
      });
      setParsedUsers(rows);
    }
  }, [importInput, importTab, selectedOrg]);

  const handleExecuteImport = async () => {
    if (!selectedOrg || parsedUsers.length === 0) {
      setErrorMsg('กรุณาเลือกไฟล์ Excel หรือระบุข้อมูลเจ้าหน้าที่ที่ต้องการนำเข้า');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await importOrganizationUsersAction(selectedOrg.name, parsedUsers);
    setIsLoading(false);

    if (res.success) {
      setSuccessMsg(`นำเข้าบุคลากรเข้าสู่สังกัด "${selectedOrg.name}" จำนวน ${res.count} คนสำเร็จ`);
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        setParsedUsers([]);
        setUploadedFileName(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการนำเข้าบุคลากร');
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setViewMode('LIST');
          setIsOpen(true);
        }}
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
      >
        <Building2 className="h-4 w-4 text-emerald-600" />
        <span>จัดการสังกัดองค์กร ({orgList.length})</span>
      </button>

      {isOpen && (
        <div className="token-modal-backdrop">
          <div className="token-modal-card max-w-2xl">
            {/* Modal Header */}
            <div className="token-modal-header">
              <div className="flex items-center gap-3">
                <div className="token-badge-icon bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="token-modal-title">
                    บริหารจัดการสังกัดองค์กรหลัก (Organizations)
                  </h3>
                  <p className="token-modal-subtitle">
                    เพิ่ม แก้ไข ลบ สังกัดหลัก และนำเข้าบุคลากรประจำองค์กรด้วยไฟล์ Excel
                  </p>
                </div>
              </div>

              <button onClick={() => setIsOpen(false)} className="token-modal-close-btn">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Alert Messages */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 font-medium">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="token-modal-body p-6 space-y-4">
              {viewMode === 'LIST' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      รายการสังกัดองค์กรทั้งหมด ({orgList.length} แห่ง)
                    </span>
                    <button
                      onClick={handleOpenCreate}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>เพิ่มสังกัดองค์กรใหม่</span>
                    </button>
                  </div>

                  <div className="grid gap-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
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
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
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
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors cursor-pointer"
                              title="นำเข้าบุคลากรด้วยไฟล์ Excel"
                            >
                              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                              <span>นำเข้า Excel</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(org)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="แก้ไขสังกัดองค์กร"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            {deleteConfirmId === org.id ? (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60">
                                {staffCount > 0 && (
                                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
                                    มีบุคลากร {staffCount} คน!
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(org.id)}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 text-xs font-bold text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-colors cursor-pointer"
                                  >
                                    ยืนยันลบ
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                                  >
                                    ยกเลิก
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(org.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {viewMode === 'CREATE' ? 'เพิ่มสังกัดองค์กรหลักใหม่' : `แก้ไขสังกัดองค์กร (${selectedOrg?.name})`}
                    </h4>
                    <button
                      onClick={() => setViewMode('LIST')}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                    >
                      ← กลับหน้ารายการ
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อสังกัดองค์กรหลัก (Organization Name)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="เช่น โรงพยาบาลท่าสองยาง, สสอ.ท่าสองยาง, โรงเรียนท่าสองยางวิทยาคม"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => setViewMode('LIST')}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="button"
                      onClick={viewMode === 'CREATE' ? handleCreate : handleUpdate}
                      disabled={isLoading}
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูลองค์กร'}
                    </button>
                  </div>
                </div>
              )}

              {viewMode === 'IMPORT' && selectedOrg && (
                <div className="space-y-4">
                  {/* Header & Excel Template Download Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        นำเข้ารายชื่อเจ้าหน้าที่เข้าสังกัด: &quot;{selectedOrg.name}&quot;
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        ดาวน์โหลดแม่แบบ Excel เติมข้อมูลเจ้าหน้าที่ แล้วอัปโหลดเพื่อนำเข้าสู่ระบบได้ทันที
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Excel Template Download Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadExcelTemplate(selectedOrg.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>ดาวน์โหลดแม่แบบ (.xlsx)</span>
                      </button>

                      <button
                        onClick={() => setViewMode('LIST')}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 cursor-pointer"
                      >
                        ← กลับ
                      </button>
                    </div>
                  </div>

                  {/* Mode Tab Switcher: EXCEL vs TEXT */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setImportTab('EXCEL')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        importTab === 'EXCEL'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>อัปโหลดไฟล์ Excel / CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportTab('TEXT')}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                        importTab === 'TEXT'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>วางข้อความ CSV</span>
                    </button>
                  </div>

                  {/* EXCEL FILE UPLOAD DROPZONE */}
                  {importTab === 'EXCEL' ? (
                    <div className="space-y-3">
                      <label className="relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors cursor-pointer group">
                        <input
                          type="file"
                          accept=".xlsx, .xls, .csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                          <FileUp className="h-6 w-6" />
                        </div>
                        <p className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                          {uploadedFileName ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              📄 ไฟล์ที่เลือก: {uploadedFileName}
                            </span>
                          ) : (
                            'คลิกหรือลากไฟล์ Excel (.xlsx, .xls, .csv) มาวางที่นี่'
                          )}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          รองรับหัวตาราง: รหัสพนักงาน, เพศ, คำนำหน้า, ชื่อ, นามสกุล, เลขบัตรประชาชน (Username อัตโนมัติ), วันเกิด (YYYY-MM-DD), รหัสผ่าน (4 หลักท้าย CID อัตโนมัติ), ตำแหน่ง, แผนก
                        </p>
                      </label>
                    </div>
                  ) : (
                    /* TEXT / CSV PASTING AREA */
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        วางรายชื่อเจ้าหน้าที่แยกตามบรรทัด (CSV)
                      </label>
                      <textarea
                        rows={5}
                        value={importInput}
                        onChange={(e) => setImportInput(e.target.value)}
                        placeholder="EMP001, นายสมชาย, ใจดี, 1234567890123, ชาย, 1990-05-15, ครูชำนาญการ, ฝ่ายบริหาร&#10;EMP002, นางสาวสิริพร, วงศ์ใหญ่, 5678901234567, หญิง, 1995-12-20, นักวิชาการสาธารณสุข, กลุ่มงานการพยาบาล"
                        className="w-full text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  )}

                  {/* LIVE PREVIEW TABLE OF PARSED ROWS */}
                  {parsedUsers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          <span>ตัวอย่างข้อมูลพร้อมนำเข้า ({parsedUsers.length} รายการ)</span>
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          สังกัดที่จะกำหนด: {selectedOrg.name}
                        </span>
                      </div>

                      <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl scrollbar-thin">
                        <table className="w-full text-left text-[11px]">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 font-bold whitespace-nowrap">
                            <tr>
                              <th className="px-2.5 py-2 text-center">#</th>
                              <th className="px-2.5 py-2">รหัสพนักงาน</th>
                              <th className="px-2.5 py-2">ชื่อ-นามสกุล</th>
                              <th className="px-2.5 py-2">เพศ</th>
                              <th className="px-2.5 py-2">วันเกิด (DOB)</th>
                              <th className="px-2.5 py-2">Username (CID)</th>
                              <th className="px-2.5 py-2">Pass (4 หลักท้าย)</th>
                              <th className="px-2.5 py-2">ตำแหน่ง</th>
                              <th className="px-2.5 py-2">แผนก/หน่วยงาน</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 whitespace-nowrap">
                            {parsedUsers.slice(0, 50).map((u, idx) => (
                              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <td className="px-2.5 py-1.5 text-center text-slate-400">{idx + 1}</td>
                                <td className="px-2.5 py-1.5 font-medium text-slate-900 dark:text-white">
                                  {u.employeeCode}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-800 dark:text-slate-200">
                                  {u.firstName} {u.lastName}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400">
                                  {u.gender === 'FEMALE' ? 'หญิง' : 'ชาย'}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                                  {u.dob || '-'}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-500 font-mono text-[10px]">
                                  {u.username}
                                </td>
                                <td className="px-2.5 py-1.5 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                                  {u.password || '-'}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400">
                                  {u.position || '-'}
                                </td>
                                <td className="px-2.5 py-1.5 text-slate-600 dark:text-slate-400">
                                  {u.department || '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {parsedUsers.length > 50 && (
                        <p className="text-[10px] text-slate-400 text-right">
                          *แสดงตัวอย่าง 50 รายการแรก จากทั้งหมด {parsedUsers.length} รายการ
                        </p>
                      )}
                    </div>
                  )}

                  {/* ACTION FOOTER */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400">
                      *บุคลากรที่นำเข้าจะได้รับการกำหนดสังกัดองค์กรเป็น &quot;{selectedOrg.name}&quot; อัตโนมัติ
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('LIST')}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteImport}
                        disabled={isLoading || parsedUsers.length === 0}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        <Upload className="h-4 w-4" />
                        <span>
                          {isLoading
                            ? 'กำลังนำเข้า...'
                            : `ยืนยันการนำเข้าเจ้าหน้าที่ (${parsedUsers.length} คน)`}
                        </span>
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
