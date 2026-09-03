'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import {
  ShieldCheck,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  Building2,
  Package,
  Calendar,
  DollarSign,
  Info,
} from 'lucide-react';
import { Organization, CheckupPackage, OrganizationEntitlement } from '@/lib/types';
import {
  getEntitlementsAction,
  createEntitlementAction,
  deleteEntitlementAction,
} from '@/app/actions';

interface AdminEntitlementsDialogProps {
  organizations: Organization[];
  packages: CheckupPackage[];
  onSuccess?: () => void;
}

export function AdminEntitlementsDialog({
  organizations,
  packages,
  onSuccess,
}: AdminEntitlementsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [entitlements, setEntitlements] = useState<OrganizationEntitlement[]>([]);
  const [selectedOrgName, setSelectedOrgName] = useState<string>(
    organizations[0]?.name || 'โรงพยาบาลท่าสองยาง'
  );

  // Form State for New Entitlement
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packages[0]?.id || '');
  const [entitlementMode, setEntitlementMode] = useState<'FREE' | 'FULL_PAY' | 'FLAT'>('FREE');
  const [ageMode, setAgeMode] = useState<'ALL' | 'UNDER_35' | 'OVER_35' | 'CUSTOM'>('ALL');
  const [minAge, setMinAge] = useState<string>('');
  const [maxAge, setMaxAge] = useState<string>('');
  const [flatPrice, setFlatPrice] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchEntitlements = async () => {
    setIsLoading(true);
    const data = await getEntitlementsAction();
    setEntitlements(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchEntitlements();
    }
  }, [isOpen]);

  const handleAgeModeChange = (mode: 'ALL' | 'UNDER_35' | 'OVER_35' | 'CUSTOM') => {
    setAgeMode(mode);
    if (mode === 'ALL') {
      setMinAge('');
      setMaxAge('');
    } else if (mode === 'UNDER_35') {
      setMinAge('');
      setMaxAge('34');
    } else if (mode === 'OVER_35') {
      setMinAge('35');
      setMaxAge('');
    }
  };

  const handleCreateEntitlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgName || !selectedPkgId) {
      setErrorMsg('กรุณาเลือกสังกัดองค์กรและโปรแกรมตรวจ');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    let finalMin: number | null = null;
    let finalMax: number | null = null;

    if (ageMode === 'UNDER_35') {
      finalMax = 34;
    } else if (ageMode === 'OVER_35') {
      finalMin = 35;
    } else if (ageMode === 'CUSTOM') {
      finalMin = minAge ? parseInt(minAge, 10) : null;
      finalMax = maxAge ? parseInt(maxAge, 10) : null;
    }

    const isFree = entitlementMode === 'FREE';
    const flatPriceVal = entitlementMode === 'FLAT' && flatPrice ? parseInt(flatPrice, 10) : null;

    const res = await createEntitlementAction({
      organizationName: selectedOrgName,
      packageId: selectedPkgId,
      minAge: finalMin,
      maxAge: finalMax,
      isFree,
      flatPrice: flatPriceVal,
    });


    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('เพิ่มสิทธิ์การตรวจเรียบร้อยแล้ว');
      fetchEntitlements();
      setMinAge('');
      setMaxAge('');
      setFlatPrice('');
      setTimeout(() => setSuccessMsg(null), 1500);
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการบันทึกสิทธิ์');
    }
  };


  const handleDeleteEntitlement = async (entId: string) => {
    setIsLoading(true);
    const res = await deleteEntitlementAction(entId);
    setIsLoading(false);
    if (res.success) {
      setSuccessMsg('ลบรายการสิทธิ์เรียบร้อยแล้ว');
      fetchEntitlements();
      setTimeout(() => setSuccessMsg(null), 1500);
      if (onSuccess) onSuccess();
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการลบสิทธิ์');
    }
  };

  const filteredEntitlements = entitlements.filter(
    (e) => e.organizationName === selectedOrgName
  );

  useModalLock(isOpen);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shadow-xs"
      >
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>ตั้งค่าสิทธิ์ Package (องค์กร/อายุ)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    ตั้งค่าสิทธิ์ Package ตรวจสุขภาพ (Organization Entitlements)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    กำหนดสิทธิ์ตรวจฟรี / อัปเกรดส่วนต่าง / ราคาเหมาจ่าย รายองค์กรและช่วงอายุ
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

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Select Organization */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>เลือกสังกัดองค์กรหลักที่ต้องการตั้งค่า</span>
                </label>
                <select
                  value={selectedOrgName}
                  onChange={(e) => setSelectedOrgName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.name}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Entitlements List for selected org */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-500" />
                    <span>รายการสิทธิ์ของ "{selectedOrgName}"</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    ({filteredEntitlements.length} สิทธิ์)
                  </span>
                </div>

                {filteredEntitlements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center text-xs text-slate-400">
                    <Info className="h-4 w-4 mx-auto mb-1 text-slate-400" />
                    องค์กรนี้ยังไม่มีการตั้งสิทธิ์เฉพาะ (ระบบจะใช้สิทธิ์เริ่มต้น: สวัสดิการเจ้าหน้าที่ Package A ฟรี / Package B ฟรีอายุ ≥ 35)
                  </div>
                ) : (
                  <div className="grid gap-2.5">
                    {filteredEntitlements.map((ent) => (
                      <div
                        key={ent.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                              {ent.packageCode || 'PKG'}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-white">
                              {ent.packageName || ent.packageId}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {ent.maxAge !== null && ent.maxAge !== undefined ? (
                                ent.minAge !== null && ent.minAge !== undefined ? (
                                  <span className="text-blue-600 dark:text-blue-400">อายุ {ent.minAge} - {ent.maxAge} ปี</span>
                                ) : (
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold">👦 อายุน้อยกว่า 35 ปี (0-{ent.maxAge} ปี)</span>
                                )
                              ) : ent.minAge !== null && ent.minAge !== undefined ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">👨 อายุ {ent.minAge} ปีขึ้นไป</span>
                              ) : (
                                <span className="text-slate-600 dark:text-slate-300">🌐 ทุกช่วงอายุ</span>
                              )}
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {ent.isFree ? (
                                <strong className="text-emerald-600 dark:text-emerald-400">
                                  🟢 ฟรีสวัสดิการ 100%
                                </strong>
                              ) : ent.flatPrice && ent.flatPrice > 0 ? (
                                <strong className="text-purple-600 dark:text-purple-400">
                                  💰 เหมาจ่าย ฿{ent.flatPrice} บาท
                                </strong>
                              ) : (
                                <strong className="text-amber-600 dark:text-amber-400">
                                  🛒 จ่ายตามรายการจริง (อัตราปกติ)
                                </strong>
                              )}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteEntitlement(ent.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors shrink-0"
                          title="ลบสิทธิ์นี้"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Entitlement Form */}
              <form
                onSubmit={handleCreateEntitlement}
                className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 space-y-3"
              >
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>เพิ่มสิทธิ์ Package ใหม่ให้ "{selectedOrgName}"</span>
                </h4>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      เลือก Package
                    </label>
                    <select
                      value={selectedPkgId}
                      onChange={(e) => setSelectedPkgId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      {packages.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.code}] {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      รูปแบบสิทธิ์
                    </label>
                    <select
                      value={entitlementMode}
                      onChange={(e) => setEntitlementMode(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      <option value="FREE">🟢 ฟรีสวัสดิการ 100%</option>
                      <option value="FULL_PAY">🛒 จ่ายตามรายการจริง (ชำระตามอัตราปกติ)</option>
                      <option value="FLAT">💰 เหมาจ่าย (กำหนดราคาเหมาจ่ายเอง)</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      เงื่อนไขเกณฑ์อายุที่ได้รับสิทธิ์
                    </label>
                    <select
                      value={ageMode}
                      onChange={(e) => handleAgeModeChange(e.target.value as any)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
                    >
                      <option value="ALL">🌐 ทุกช่วงอายุ (ไม่จำกัดอายุ)</option>
                      <option value="UNDER_35">👦 อายุน้อยกว่า 35 ปี (อายุ 0 - 34 ปี)</option>
                      <option value="OVER_35">👨 อายุ 35 ปีขึ้นไป (อายุ ≥ 35 ปี)</option>
                      <option value="CUSTOM">⚙️ กำหนดช่วงอายุเอง (Min - Max)</option>
                    </select>
                  </div>

                  {entitlementMode === 'FLAT' && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        ราคาเหมาจ่าย (บาท)
                      </label>
                      <input
                        type="number"
                        value={flatPrice}
                        onChange={(e) => setFlatPrice(e.target.value)}
                        placeholder="เช่น 500 หรือ 1200"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>


                {ageMode === 'CUSTOM' && (
                  <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-900/40">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        อายุขั้นต่ำ (ปี)
                      </label>
                      <input
                        type="number"
                        value={minAge}
                        onChange={(e) => setMinAge(e.target.value)}
                        placeholder="เช่น 18"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                        อายุสูงสุด (ปี)
                      </label>
                      <input
                        type="number"
                        value={maxAge}
                        onChange={(e) => setMaxAge(e.target.value)}
                        placeholder="เช่น 34"
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}


                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  <span>บันทึกสิทธิ์องค์กร</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
