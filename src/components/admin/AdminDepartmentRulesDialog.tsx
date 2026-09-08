'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  Building2,
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { DepartmentItemRule, TestItem, DepartmentRuleType } from '@/lib/types';
import {
  getDepartmentRulesAction,
  createDepartmentRuleAction,
  updateDepartmentRuleAction,
  deleteDepartmentRuleAction,
} from '@/app/actions';

interface AdminDepartmentRulesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  masterItems?: TestItem[];
  departments?: string[];
  onSuccess?: () => void;
}

export function AdminDepartmentRulesDialog({
  isOpen,
  onClose,
  masterItems = [],
  departments = [],
  onSuccess,
}: AdminDepartmentRulesDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [rules, setRules] = useState<DepartmentItemRule[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingRule, setEditingRule] = useState<DepartmentItemRule | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formDepartmentName, setFormDepartmentName] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [formItemName, setFormItemName] = useState('');
  const [formRuleType, setFormRuleType] = useState<DepartmentRuleType>('MANDATORY_FREE');
  const [formSpecialPrice, setFormSpecialPrice] = useState<number | string>('0');
  const [formRuleMessage, setFormRuleMessage] = useState('');

  // Delete State
  const [deletingRule, setDeletingRule] = useState<DepartmentItemRule | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalLock(isOpen && mounted);

  const loadRules = async () => {
    setLoading(true);
    try {
      const data = await getDepartmentRulesAction();
      setRules(data);
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดกติกาตามแผนก');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadRules();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const filteredRules = rules.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.departmentName.toLowerCase().includes(q) ||
      r.itemName.toLowerCase().includes(q) ||
      (r.ruleMessage || '').toLowerCase().includes(q)
    );
  });

  const handleOpenAddForm = () => {
    setEditingRule(null);
    const initialDept = departments[0] || 'กลุ่มงานโภชนศาสตร์';
    const initialItem = masterItems[0]?.name || 'Stool Examination';
    setFormDepartmentName(initialDept);
    setIsCustomDept(false);
    setFormItemName(initialItem);
    setFormRuleType('MANDATORY_FREE');
    setFormSpecialPrice('0');
    setFormRuleMessage('บังคับตรวจประจำแผนก (ฟรีสวัสดิการ)');
    setIsAddingNew(true);
    setErrorMsg(null);
  };

  const handleOpenEditForm = (rule: DepartmentItemRule) => {
    setEditingRule(rule);
    setFormDepartmentName(rule.departmentName);
    const isDeptInList = departments.includes(rule.departmentName);
    setIsCustomDept(!isDeptInList && rule.departmentName !== '');
    setFormItemName(rule.itemName);
    setFormRuleType(rule.ruleType);
    setFormSpecialPrice(rule.specialPrice !== null && rule.specialPrice !== undefined ? rule.specialPrice : 0);
    setFormRuleMessage(rule.ruleMessage || '');
    setIsAddingNew(true);
    setErrorMsg(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDepartmentName.trim() || !formItemName.trim()) {
      setErrorMsg('กรุณากรอกชื่อแผนกและชื่อรายการตรวจ');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const parsedPrice = formSpecialPrice === '' ? 0 : Number(formSpecialPrice) || 0;

    if (editingRule && editingRule.id) {
      const res = await updateDepartmentRuleAction(editingRule.id, {
        departmentName: formDepartmentName.trim(),
        itemName: formItemName.trim(),
        ruleType: formRuleType,
        specialPrice: parsedPrice,
        ruleMessage: formRuleMessage.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg('บันทึกการแก้ไขกติกาแผนกเรียบร้อย');
        setIsAddingNew(false);
        setEditingRule(null);
        await loadRules();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการแก้ไข');
      }
    } else {
      const res = await createDepartmentRuleAction({
        departmentName: formDepartmentName.trim(),
        itemName: formItemName.trim(),
        ruleType: formRuleType,
        specialPrice: parsedPrice,
        ruleMessage: formRuleMessage.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg('เพิ่มกติกาแผนกใหม่เรียบร้อย');
        setIsAddingNew(false);
        await loadRules();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างกติกา');
      }
    }
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRule || !deletingRule.id) return;
    setLoading(true);
    const res = await deleteDepartmentRuleAction(deletingRule.id);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('ลบกติกาแผนกเรียบร้อย');
      setDeletingRule(null);
      await loadRules();
      if (onSuccess) onSuccess();
    }
  };

  const modalJSX = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[85vh] min-h-[600px] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                จัดการกติกาแล็บเฉพาะแผนก (Department Item Rules)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                กำหนดสิทธิ์ตรวจแล็บเฉพาะกลุ่มเสี่ยง (เช่น โภชนศาสตร์ = ตรวจอุจจาระฟรี, ยานพาหนะ = ตรวจสารเสพติด)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-4">
          {/* Notifications */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 border border-red-200 dark:border-red-800/60 text-sm text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 px-4 py-3 border border-green-200 dark:border-green-800/60 text-sm text-green-700 dark:text-green-300">
              <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Search & Add */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อแผนก หรือชื่อรายการตรวจ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
              />
            </div>

            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มกติกาแผนก</span>
            </button>
          </div>

          {/* Create / Edit Inline Form */}
          {isAddingNew && (
            <form
              onSubmit={handleSaveForm}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                  {editingRule ? 'แก้ไขกติกาเฉพาะแผนก' : 'เพิ่มกติกาเฉพาะแผนกใหม่'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    ชื่อแผนก/คีย์เวิร์ดแผนก <span className="text-red-500">*</span>
                  </label>
                  {departments.length > 0 && !isCustomDept ? (
                    <div className="space-y-1">
                      <select
                        value={formDepartmentName}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM_INPUT') {
                            setIsCustomDept(true);
                            setFormDepartmentName('');
                          } else {
                            setFormDepartmentName(e.target.value);
                          }
                        }}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      >
                        <option value="ALL">ALL (ทุกแผนก — ค่าเริ่มต้น)</option>
                        {departments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                        <option value="CUSTOM_INPUT">+ กำหนดชื่อแผนก/คีย์เวิร์ดเอง...</option>
                      </select>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="เช่น กลุ่มงานโภชนศาสตร์, งานยานพาหนะ"
                        value={formDepartmentName}
                        onChange={(e) => setFormDepartmentName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      />
                      {departments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomDept(false);
                            setFormDepartmentName(departments[0] || '');
                          }}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg whitespace-nowrap"
                        >
                          เลือกจากรายการ
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    รายการตรวจ <span className="text-red-500">*</span>
                  </label>
                  {masterItems.length > 0 ? (
                    <select
                      value={formItemName}
                      onChange={(e) => setFormItemName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                    >
                      {masterItems.map((m) => (
                        <option key={m.id || m.name} value={m.name}>
                          {m.name} ({m.price} บาท)
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      placeholder="Stool Examination"
                      value={formItemName}
                      onChange={(e) => setFormItemName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    เงื่อนไขกติกา (Rule Type)
                  </label>
                  <select
                    value={formRuleType}
                    onChange={(e) => setFormRuleType(e.target.value as DepartmentRuleType)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="MANDATORY_FREE">บังคับตรวจ & ฟรี (0 บาท)</option>
                    <option value="OPTIONAL_FREE">เลือกตรวจตามสมัครใจ & ฟรี (0 บาท)</option>
                    <option value="SPECIAL_PRICE">ชำระราคาพิเศษ</option>
                    <option value="HIDDEN">ซ่อนรายการ (ไม่ต้องตรวจ)</option>
                  </select>
                </div>

                {formRuleType === 'SPECIAL_PRICE' && (
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                      ราคาพิเศษ (บาท)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formSpecialPrice}
                      onChange={(e) => setFormSpecialPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                )}

                <div className={formRuleType === 'SPECIAL_PRICE' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    ข้อความกำกับสิทธิ์แก่เจ้าหน้าที่
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น บังคับตรวจประจำกลุ่มงานโภชนศาสตร์ (ฟรีสวัสดิการ)"
                    value={formRuleMessage}
                    onChange={(e) => setFormRuleMessage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-800 dark:bg-slate-600 hover:bg-slate-700 dark:hover:bg-slate-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกกติกา'}
                </button>
              </div>
            </form>
          )}

          {/* Rules Table */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-medium">แผนก/หน่วยงาน</th>
                  <th className="px-4 py-2.5 font-medium">รายการตรวจ</th>
                  <th className="px-4 py-2.5 font-medium text-center">เงื่อนไขกติกา</th>
                  <th className="px-4 py-2.5 font-medium">คำอธิบายสิทธิ์</th>
                  <th className="px-4 py-2.5 font-medium text-center w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">
                      ยังไม่มีการกำหนดกติกาเฉพาะแผนกในระบบ (ระบบใช้กติกามาตรฐานเริ่มต้น)
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-white">
                        {rule.departmentName}
                      </td>
                      <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                        {rule.itemName}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {rule.ruleType === 'MANDATORY_FREE' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            บังคับตรวจ & ฟรี (0฿)
                          </span>
                        )}
                        {rule.ruleType === 'OPTIONAL_FREE' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                            เลือกตรวจได้ & ฟรี (0฿)
                          </span>
                        )}
                        {rule.ruleType === 'SPECIAL_PRICE' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            ชำระ ฿{rule.specialPrice ?? 0}
                          </span>
                        )}
                        {rule.ruleType === 'HIDDEN' && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            ซ่อนไม่แสดง
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                        {rule.ruleMessage || '-'}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditForm(rule)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingRule(rule)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {deletingRule && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">ยืนยันการลบกติกา</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">กติกาเฉพาะแผนกนี้จะถูกลบออกจากระบบ</p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-700 dark:text-slate-300">
                {deletingRule.departmentName} — {deletingRule.itemName} ({deletingRule.ruleType})
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeletingRule(null)}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'กำลังลบ...' : 'ลบกติกา'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            ทั้งหมด {rules.length} กติกา
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
}
