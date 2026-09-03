'use client';

import { useState, useEffect } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import { createPortal } from 'react-dom';
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Search,
  AlertTriangle,
  Stethoscope,
} from 'lucide-react';
import { TestItem } from '@/lib/types';
import {
  getAllMasterItemsAction,
  createMasterItemAction,
  updateMasterItemAction,
  deleteMasterItemAction,
} from '@/app/actions';

interface AdminItemCatalogDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AdminItemCatalogDialog({
  isOpen,
  onClose,
  onSuccess,
}: AdminItemCatalogDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<TestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form State for Create/Edit
  const [editingItem, setEditingItem] = useState<TestItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formCategory, setFormCategory] = useState('ตรวจเลือด');

  // Delete Confirmation State
  const [deletingItem, setDeletingItem] = useState<TestItem | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalLock(isOpen && mounted);

  const loadMasterItems = async () => {
    setLoading(true);
    try {
      const data = await getAllMasterItemsAction();
      setItems(data);
    } catch {
      setErrorMsg('เกิดข้อผิดพลาดในการโหลดรายการตรวจ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMasterItems();
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const categoriesList = ['ALL', 'ตรวจเลือด', 'ตรวจปัสสาวะ', 'เอกซเรย์', 'หัวใจ', 'ทั่วไป'];

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'ALL' || (item.category || 'ทั่วไป') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAddForm = () => {
    setEditingItem(null);
    setFormName('');
    setFormPrice('');
    setFormCategory('ตรวจเลือด');
    setIsAddingNew(true);
    setErrorMsg(null);
  };

  const handleOpenEditForm = (item: TestItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price !== undefined && item.price !== null ? item.price : '');
    setFormCategory(item.category || 'ตรวจเลือด');
    setIsAddingNew(true);
    setErrorMsg(null);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('กรุณากรอกชื่อรายการตรวจ');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const parsedPrice = formPrice === '' ? 0 : Number(formPrice) || 0;

    if (editingItem && editingItem.id) {
      // Update
      const res = await updateMasterItemAction(editingItem.id, {
        name: formName.trim(),
        price: parsedPrice,
        category: formCategory,
      });

      if (res.success) {
        setSuccessMsg('บันทึกการแก้ไขเรียบร้อย');
        setIsAddingNew(false);
        setEditingItem(null);
        await loadMasterItems();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการแก้ไข');
      }
    } else {
      // Create
      const res = await createMasterItemAction({
        name: formName.trim(),
        price: parsedPrice,
        category: formCategory,
      });


      if (res.success) {
        setSuccessMsg('เพิ่มรายการตรวจใหม่เรียบร้อย');
        setIsAddingNew(false);
        await loadMasterItems();
        if (onSuccess) onSuccess();
      } else {
        setErrorMsg(res.error || 'เกิดข้อผิดพลาดในการสร้างรายการ');
      }
    }
    setLoading(false);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingItem || !deletingItem.id) return;
    setLoading(true);
    const res = await deleteMasterItemAction(deletingItem.id);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('ลบรายการตรวจเรียบร้อย');
      setDeletingItem(null);
      await loadMasterItems();
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
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                จัดการรายการตรวจสุขภาพย่อย (Master Catalog)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                เพิ่ม/แก้ไข/ลบ รายการตรวจสำหรับใช้งานในแต่ละโปรแกรม (Package)
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
              <span>{successMsg}</span>
            </div>
          )}

          {/* Search & Add */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อรายการตรวจ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
              />
            </div>

            <button
              onClick={handleOpenAddForm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>เพิ่มรายการ</span>
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500 mr-1">หมวด:</span>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 dark:bg-slate-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat === 'ALL' ? 'ทั้งหมด' : cat}
              </button>
            ))}
          </div>

          {/* Create / Edit Inline Form */}
          {isAddingNew && (
            <form
              onSubmit={handleSaveForm}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">
                  {editingItem ? 'แก้ไขรายการตรวจ' : 'เพิ่มรายการตรวจใหม่'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    ชื่อรายการตรวจ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ตรวจความสมบูรณ์ของเม็ดเลือด (CBC)"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
                    ราคา (บาท)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-400/30"
                  />

                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-500 dark:text-slate-400">หมวด:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="ตรวจเลือด">ตรวจเลือด</option>
                    <option value="ตรวจปัสสาวะ">ตรวจปัสสาวะ</option>
                    <option value="เอกซเรย์">เอกซเรย์</option>
                    <option value="หัวใจ">หัวใจ</option>
                    <option value="ทั่วไป">ทั่วไป</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
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
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Items Table */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full min-w-[550px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 font-medium">ชื่อรายการตรวจ</th>
                  <th className="px-4 py-2.5 font-medium text-center">หมวด</th>
                  <th className="px-4 py-2.5 font-medium text-right">ราคา (บาท)</th>
                  <th className="px-4 py-2.5 font-medium text-center w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">
                      ไม่พบรายการตรวจ
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id || item.name}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                        {item.name}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category || 'ทั่วไป'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {item.price === 0 ? '-' : `${item.price.toLocaleString()}`}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditForm(item)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="แก้ไข"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
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
        {deletingItem && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-slate-900 p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 shrink-0">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">ยืนยันการลบ</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">รายการนี้จะถูกลบออกจากระบบ</p>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-3 text-sm text-slate-700 dark:text-slate-300">
                {deletingItem.name} — {deletingItem.price} บาท
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setDeletingItem(null)}
                  className="px-3 py-1.5 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'กำลังลบ...' : 'ลบรายการ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            ทั้งหมด {items.length} รายการ
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
