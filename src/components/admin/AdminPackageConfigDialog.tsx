'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  Package,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { CheckupPackage, TestItem } from '@/lib/types';
import {
  createPackageAction,
  updatePackageAction,
  deletePackageAction,
  getAllMasterItemsAction,
  createMasterItemAction,
} from '@/app/actions';

interface AdminPackageConfigDialogProps {
  packages?: CheckupPackage[];
  onSuccess?: () => void;
}

export function AdminPackageConfigDialog({
  packages = [],
  onSuccess,
}: AdminPackageConfigDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState<'LIST' | 'CREATE' | 'EDIT'>('LIST');
  const [selectedPkg, setSelectedPkg] = useState<CheckupPackage | null>(null);

  // Master Catalog Items State
  const [masterItems, setMasterItems] = useState<TestItem[]>([]);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');

  // Form States for Package
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [targetGroup, setTargetGroup] = useState('');
  const [description, setDescription] = useState('');
  const [preparationGuide, setPreparationGuide] = useState('');

  // Selected items map: { [itemNameOrId]: price }
  const [selectedItemPrices, setSelectedItemPrices] = useState<{ [name: string]: number }>({});

  // Quick Add Master Item State
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [newMasterCode, setNewMasterCode] = useState('');
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterPrice, setNewMasterPrice] = useState<number>(0);
  const [newMasterCategory, setNewMasterCategory] = useState('ตรวจเลือด');

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadMasterCatalog = async () => {
    try {
      const items = await getAllMasterItemsAction();
      setMasterItems(items);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMasterCatalog();
    }
  }, [isOpen]);

  const handleOpenCreate = async () => {
    await loadMasterCatalog();
    setCode('PKG-C');
    setName('โปรแกรม C: ตรวจสุขภาพพิเศษบริหาร/ผู้สูงอายุ');
    setTargetGroup('กลุ่มบุคลากรผู้บริหาร หรือผู้ที่มีอายุ 50 ปีขึ้นไป');
    setDescription('เพิ่มการตรวจมวลกระดูก ตรวจระดับวิตามิน และการตรวจอัลตราซาวด์ช่องท้อง');
    setPreparationGuide('กรุณางดน้ำและอาหารทุกชนิดหลังเวลา 20.00 น. ก่อนวันรับบริการตรวจสุขภาพอย่างน้อย 8-10 ชั่วโมง');
    setSelectedItemPrices({});
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDeleteConfirm(false);
    setViewMode('CREATE');
  };

  const handleOpenEdit = async (pkg: CheckupPackage) => {
    await loadMasterCatalog();
    setSelectedPkg(pkg);
    setCode(pkg.code);
    setName(pkg.name);
    setTargetGroup(pkg.targetGroup);
    setDescription(pkg.description);
    setPreparationGuide(pkg.preparationGuide || '');

    const priceMap: { [name: string]: number } = {};
    if (pkg.items && pkg.items.length > 0) {
      pkg.items.forEach((item) => {
        priceMap[item.name] = Number(item.price) || 0;
      });
    } else if (pkg.labTests) {
      pkg.labTests.forEach((t) => {
        priceMap[t] = 0;
      });
    }
    setSelectedItemPrices(priceMap);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDeleteConfirm(false);
    setViewMode('EDIT');
  };

  const toggleItemSelection = (item: TestItem) => {
    const nextMap = { ...selectedItemPrices };
    if (item.name in nextMap) {
      delete nextMap[item.name];
    } else {
      nextMap[item.name] = item.price;
    }
    setSelectedItemPrices(nextMap);
  };

  const handlePriceChange = (itemName: string, priceVal: number) => {
    setSelectedItemPrices((prev) => ({
      ...prev,
      [itemName]: Math.max(0, priceVal || 0),
    }));
  };

  const handleQuickCreateMasterItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMasterName.trim()) return;

    setIsLoading(true);
    const res = await createMasterItemAction({
      name: newMasterName.trim(),
      price: Number(newMasterPrice) || 0,
      category: newMasterCategory,
    });
    setIsLoading(false);

    if (res.success && res.item) {
      // Auto select new item for the package
      setSelectedItemPrices((prev) => ({
        ...prev,
        [res.item!.name]: res.item!.price,
      }));
      setShowAddMasterModal(false);
      setNewMasterName('');
      await loadMasterCatalog();
    }
  };

  const handleCreatePackage = async () => {
    if (!code.trim() || !name.trim()) {
      setErrorMsg('กรุณากรอกรหัสและชื่อโปรแกรมตรวจ');
      return;
    }

    const selectedEntries = Object.entries(selectedItemPrices);
    if (selectedEntries.length === 0) {
      setErrorMsg('กรุณาเลือกรายการตรวจอย่างน้อย 1 รายการ');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const validItems = selectedEntries.map(([itemName, price]) => ({
      name: itemName,
      price,
    }));
    const labTests = validItems.map((i) => i.name);

    const res = await createPackageAction({
      code,
      name,
      targetGroup,
      description,
      preparationGuide,
      labTests,
      items: validItems,
    });

    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('สร้างโปรแกรมตรวจใหม่เรียบร้อย');
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างโปรแกรม');
    }
  };

  const handleUpdatePackage = async () => {
    if (!selectedPkg) return;

    const selectedEntries = Object.entries(selectedItemPrices);
    if (selectedEntries.length === 0) {
      setErrorMsg('กรุณาเลือกรายการตรวจอย่างน้อย 1 รายการ');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const validItems = selectedEntries.map(([itemName, price]) => ({
      name: itemName,
      price,
    }));
    const labTests = validItems.map((i) => i.name);

    const res = await updatePackageAction(selectedPkg.id, {
      code,
      name,
      targetGroup,
      description,
      preparationGuide,
      labTests,
      items: validItems,
    });

    setIsLoading(false);

    if (res.success) {
      setSuccessMsg('บันทึกเรียบร้อย');
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  const executeDeletePackage = async () => {
    if (!selectedPkg) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await deletePackageAction(selectedPkg.id);
    setIsLoading(false);

    if (res.success) {
      setShowDeleteConfirm(false);
      setSuccessMsg(`ลบโปรแกรม ${selectedPkg.code} เรียบร้อย`);
      setTimeout(() => {
        setViewMode('LIST');
        setSuccessMsg(null);
        if (onSuccess) onSuccess();
      }, 1500);
    } else {
      setShowDeleteConfirm(false);
      setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const removeSelectedItem = (itemName: string) => {
    const nextMap = { ...selectedItemPrices };
    delete nextMap[itemName];
    setSelectedItemPrices(nextMap);
  };

  const addItemFromCatalog = (item: TestItem) => {
    setSelectedItemPrices((prev) => ({
      ...prev,
      [item.name]: item.price,
    }));
  };

  // Items from master catalog that are NOT yet selected & match search query
  const availableCatalogItems = masterItems.filter((item) => {
    if (item.name in selectedItemPrices) return false;
    const q = searchCatalogQuery.toLowerCase();
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  useModalLock(isOpen && mounted);

  return (
    <>
      <button
        onClick={() => {
          setViewMode('LIST');
          setErrorMsg(null);
          setSuccessMsg(null);
          setShowDeleteConfirm(false);
          setIsOpen(true);
        }}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
      >
        <Package className="h-3.5 w-3.5 text-slate-400" />
        <span>จัดการโปรแกรมตรวจ</span>
      </button>

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div role="dialog" aria-modal="true" className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    จัดการโปรแกรมตรวจสุขภาพ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    กำหนดรายการตรวจสุขภาพในแต่ละโปรแกรม
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
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-sm">
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-950/40 px-4 py-3 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="rounded-lg bg-green-50 dark:bg-green-950/40 px-4 py-3 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300">
                  {successMsg}
                </div>
              )}

              {/* LIST MODE */}
              {viewMode === 'LIST' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      โปรแกรมตรวจทั้งหมด ({packages.length})
                    </span>
                    <button
                      onClick={handleOpenCreate}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>สร้างโปรแกรมใหม่</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {packages.map((pkg) => {
                      const itemCount = pkg.items ? pkg.items.length : pkg.labTests.length;
                      return (
                        <div
                          key={pkg.id}
                          className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {pkg.code}
                              </span>
                              <span className="font-medium text-slate-900 dark:text-white truncate">
                                {pkg.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {pkg.targetGroup}
                            </p>
                            <p className="text-xs text-slate-400">
                              {itemCount} รายการตรวจ
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenEdit(pkg)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                            <span>แก้ไข</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CREATE / EDIT MODE */}
              {(viewMode === 'CREATE' || viewMode === 'EDIT') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="font-medium text-slate-900 dark:text-white">
                      {viewMode === 'CREATE' ? 'สร้างโปรแกรมตรวจใหม่' : `แก้ไขโปรแกรม ${code}`}
                    </h4>
                    <button
                      onClick={() => setViewMode('LIST')}
                      className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      ← กลับ
                    </button>
                  </div>

                  {showDeleteConfirm && (
                    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>ยืนยันการลบโปรแกรมนี้?</span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="button"
                          onClick={executeDeletePackage}
                          disabled={isLoading}
                          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? 'กำลังลบ...' : 'ยืนยันลบ'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          รหัส (Code)
                        </label>
                        <input
                          type="text"
                          value={code}
                          onChange={(e) => setCode(e.target.value)}
                          placeholder="PKG-A"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          ชื่อโปรแกรม
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="โปรแกรม A: ตรวจสุขภาพมาตรฐาน"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        กลุ่มเป้าหมาย
                      </label>
                      <input
                        type="text"
                        value={targetGroup}
                        onChange={(e) => setTargetGroup(e.target.value)}
                        placeholder="บุคลากรทั่วไปอายุน้อยกว่า 35 ปี"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        รายละเอียด
                      </label>
                      <textarea
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="คำอธิบายรายละเอียดโปรแกรมตรวจ"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
                        📋 คำแนะนำการเตรียมตัวก่อนเข้ารับการตรวจ (Preparation Guide)
                      </label>
                      <textarea
                        rows={2}
                        value={preparationGuide}
                        onChange={(e) => setPreparationGuide(e.target.value)}
                        placeholder="เช่น งดน้ำและอาหารหลัง 20.00 น. ก่อนวันตรวจอย่างน้อย 8-10 ชั่วโมง (จิบน้ำเปล่าได้เล็กน้อย), สวมเสื้อผ้าที่ถอดง่าย"
                        className="w-full rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        * คำแนะนำนี้จะแสดงในสลิปจองคิวและส่งแจ้งเตือนทาง LINE OA / Telegram ล่วงหน้า 1 วัน
                      </p>
                    </div>

                    {/* Selected Package Items Section */}
                    <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            รายการตรวจ ({Object.keys(selectedItemPrices).length})
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            เพิ่มรายการตรวจจาก Catalog หรือสร้างใหม่
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setShowCatalogPicker(true); setSearchCatalogQuery(''); }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>เพิ่มจาก Catalog</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddMasterModal(true)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>สร้างรายการใหม่</span>
                          </button>
                        </div>
                      </div>

                      {/* Selected Items List */}
                      <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                          {Object.keys(selectedItemPrices).length === 0 ? (
                            <div className="text-center py-8 text-slate-400 text-sm">
                              ยังไม่มีรายการตรวจ — กด &quot;เพิ่มจาก Catalog&quot;
                            </div>
                          ) : (
                            Object.entries(selectedItemPrices).map(([itemName, price], idx) => {
                              const masterItem = masterItems.find((m) => m.name === itemName);
                              return (
                                <div
                                  key={itemName}
                                  className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                >
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                                    <span className="text-xs text-slate-400 w-5 text-center tabular-nums shrink-0">
                                      {idx + 1}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm text-slate-800 dark:text-slate-200 truncate">
                                          {itemName}
                                        </span>
                                      </div>
                                      {masterItem?.category && (
                                        <span className="text-xs text-slate-400">
                                          {masterItem.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 w-24">
                                      <input
                                        type="number"
                                        min="0"
                                        value={price}
                                        onChange={(e) => handlePriceChange(itemName, Number(e.target.value))}
                                        className="w-full text-right rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm tabular-nums text-slate-700 dark:text-slate-300 focus:outline-none"
                                      />
                                      <span className="text-xs text-slate-400">฿</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeSelectedItem(itemName)}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                                      title="นำออก"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Catalog Picker Dropdown */}
                      {showCatalogPicker && (
                        <div className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">เลือกจาก Master Catalog</span>
                            <button
                              type="button"
                              onClick={() => setShowCatalogPicker(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="p-3">
                            <div className="relative mb-2">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                              <input
                                type="text"
                                autoFocus
                                placeholder="ค้นหา..."
                                value={searchCatalogQuery}
                                onChange={(e) => setSearchCatalogQuery(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-0.5">
                              {availableCatalogItems.length === 0 ? (
                                <div className="text-center py-4 text-slate-400 text-sm">
                                  {masterItems.length === 0
                                    ? 'ยังไม่มีรายการใน Catalog'
                                    : 'ไม่พบรายการ'}
                                </div>
                              ) : (
                                availableCatalogItems.map((item) => (
                                  <button
                                    key={item.id || item.name}
                                    type="button"
                                    onClick={() => addItemFromCatalog(item)}
                                    className="flex items-center justify-between w-full px-3 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <Plus className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate">
                                        {item.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                      {item.category && (
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                          {item.category}
                                        </span>
                                      )}
                                      <span className="text-sm tabular-nums text-slate-500">
                                        {item.price === 0 ? '-' : `${item.price} ฿`}
                                      </span>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    {viewMode === 'EDIT' ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        disabled={isLoading || showDeleteConfirm}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>ลบโปรแกรม</span>
                      </button>
                    ) : <div />}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('LIST')}
                        className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={viewMode === 'CREATE' ? handleCreatePackage : handleUpdatePackage}
                        disabled={isLoading}
                        className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Add Master Item Inner Modal */}
            {showAddMasterModal && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
                <form
                  onSubmit={handleQuickCreateMasterItem}
                  className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                      เพิ่มรายการใหม่เข้า Catalog
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddMasterModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                        ชื่อรายการตรวจ
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ตรวจระดับวิตามิน D"
                        value={newMasterName}
                        onChange={(e) => setNewMasterName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          ราคา (บาท)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={newMasterPrice}
                          onChange={(e) => setNewMasterPrice(Number(e.target.value))}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                          หมวดหมู่
                        </label>
                        <select
                          value={newMasterCategory}
                          onChange={(e) => setNewMasterCategory(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
                        >
                          <option value="ตรวจเลือด">ตรวจเลือด</option>
                          <option value="ตรวจปัสสาวะ">ตรวจปัสสาวะ</option>
                          <option value="เอกซเรย์">เอกซเรย์</option>
                          <option value="หัวใจ">หัวใจ</option>
                          <option value="ทั่วไป">ทั่วไป</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMasterModal(false)}
                      className="px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
