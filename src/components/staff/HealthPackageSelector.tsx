'use client';

import { useState, useEffect } from 'react';
import { CheckupPackage, User, TestItem } from '@/lib/types';
import {
  CheckCircle2,
  Stethoscope,
  Check,
  Calculator,
  Plus,
} from 'lucide-react';


import { resolveItemPrice, isInternalStaffUser } from '@/lib/item-utils';
import { getAllMasterItemsAction, getEntitlementsAction } from '@/app/actions';
import { OrganizationEntitlement } from '@/lib/types';

interface HealthPackageSelectorProps {
  packages: CheckupPackage[];
  user: User;
  selectedPackageId: string;
  initialSelectedItems?: { id?: string; name: string; price?: number }[];
  onSelectPackage: (pkgId: string, selectedItems?: TestItem[], totalPrice?: number) => void;
}

export function HealthPackageSelector({
  packages,
  user,
  selectedPackageId,
  initialSelectedItems,
  onSelectPackage,
}: HealthPackageSelectorProps) {
  // Master Catalog items from MySQL DB strictly
  const [masterCatalogItems, setMasterCatalogItems] = useState<TestItem[]>([]);
  const [entitlements, setEntitlements] = useState<OrganizationEntitlement[]>([]);
  const [selectedExtraItemNames, setSelectedExtraItemNames] = useState<string[]>([]);
  const [hasAppliedInitial, setHasAppliedInitial] = useState(false);

  useEffect(() => {
    getAllMasterItemsAction().then((items) => {
      if (items && items.length > 0) {
        setMasterCatalogItems(items);
      }
    });
    getEntitlementsAction().then((data) => {
      if (data) {
        setEntitlements(data);
      }
    });
  }, []);

  // Determine user organization name and find DB entitlements strictly
  const userOrgName = (user.organization || user.department || '').trim();

  // Find DB entitlements for user's organization (fallback to internal staff match if org matches internal keywords)
  const isInternalStaff = isInternalStaffUser(user);
  const matchingEntitlements = entitlements.filter((e) => {
    const eOrg = (e.organizationName || '').toLowerCase().trim();
    const uOrg = userOrgName.toLowerCase();
    return eOrg === uOrg || (isInternalStaff && (eOrg.includes('โรงพยาบาล') || eOrg.includes('รพ.') || eOrg.includes('สสอ.')));
  });

  const hasEntitlements = matchingEntitlements.length > 0;

  // Calculate exact user age
  const userAge = user.dob
    ? new Date().getFullYear() - new Date(user.dob).getFullYear()
    : 30;

  // Find packages from Admin-configured packages list
  const pkgB = packages.find((p) => p.code === 'PKG-B' || p.id === 'pkg-b') || packages[1] || packages[0];
  const pkgA = packages.find((p) => p.code === 'PKG-A' || p.id === 'pkg-a') || packages[0];

  // Find DB entitlements for PKG-A and PKG-B strictly
  const pkgAEntitlement = matchingEntitlements.find((e) => e.packageId === pkgA.id && e.isFree);
  const pkgBEntitlement = matchingEntitlements.find((e) => e.packageId === pkgB.id && e.isFree);

  // Check if PKG-B has a valid free entitlement in DB for user's age
  const isPkgBFree = !!(
    pkgBEntitlement &&
    (pkgBEntitlement.minAge == null || userAge >= pkgBEntitlement.minAge) &&
    (pkgBEntitlement.maxAge == null || userAge <= pkgBEntitlement.maxAge)
  );

  // Check if PKG-A has a valid free entitlement in DB for user's age
  const isPkgAFree = !!(
    pkgAEntitlement &&
    (pkgAEntitlement.minAge == null || userAge >= pkgAEntitlement.minAge) &&
    (pkgAEntitlement.maxAge == null || userAge <= pkgAEntitlement.maxAge)
  );

  // Auto-select package based on DB entitlement
  const activePkgId = selectedPackageId || (isPkgBFree ? pkgB.id : pkgA.id);
  const activePkg = packages.find((p) => p.id === activePkgId) || pkgA;
  const isSelectedPkgB = activePkg.code === 'PKG-B' || activePkg.id === 'pkg-b';
  const isUpgradeMode = isSelectedPkgB && !isPkgBFree && isPkgAFree;


  // Helper to extract items directly from Admin-configured package data
  const getPkgItems = (pkg: CheckupPackage): TestItem[] => {
    if (pkg.items && pkg.items.length > 0) {
      return pkg.items.map((item) => ({
        ...item,
        price: resolveItemPrice(item.name, item.price),
      }));
    }
    return (pkg.labTests || []).map((testName) => ({
      name: testName,
      price: resolveItemPrice(testName, 0),
    }));
  };

  // Extract items of Base Package A to dynamically compare against Package B
  const pkgAItems = getPkgItems(pkgA);
  const pkgAItemNamesSet = new Set(pkgAItems.map((i) => i.name.trim().toLowerCase()));

  // Helper to check if an item is covered in base Package A
  const isIncludedInPkgA = (itemName: string) => {
    return pkgAItemNamesSet.has(itemName.trim().toLowerCase());
  };

  // Active package items
  const activeItems = getPkgItems(activePkg);
  const activeItemNamesSet = new Set(activeItems.map((i) => i.name.trim().toLowerCase()));

  // Selected items state for active package items
  const [selectedItemNames, setSelectedItemNames] = useState<string[]>(() => {
    if (initialSelectedItems && initialSelectedItems.length > 0) {
      const initNamesSet = new Set(initialSelectedItems.map((i) => i.name.trim().toLowerCase()));
      const matched = getPkgItems(activePkg)
        .filter((i) => initNamesSet.has(i.name.trim().toLowerCase()))
        .map((i) => i.name);
      return matched.length > 0 ? matched : getPkgItems(activePkg).map((i) => i.name);
    }
    return getPkgItems(activePkg).map((i) => i.name);
  });

  // Build Extra Add-on items list strictly from MySQL Database masterCatalogItems (excluding items in activePkg)
  const allAvailableItemsMap = new Map<string, TestItem>();

  masterCatalogItems.forEach((it) => {
    const key = it.name.trim().toLowerCase();
    if (!allAvailableItemsMap.has(key)) {
      allAvailableItemsMap.set(key, {
        ...it,
        price: resolveItemPrice(it.name, it.price),
      });
    }
  });

  // Filter out items that are already in activePkg
  const extraAddOnItems: TestItem[] = Array.from(allAvailableItemsMap.values()).filter(
    (item) => !activeItemNamesSet.has(item.name.trim().toLowerCase())
  );

  // Apply initialSelectedItems when initial data or master catalog items load
  useEffect(() => {
    if (!hasAppliedInitial && initialSelectedItems && initialSelectedItems.length > 0) {
      const initNamesSet = new Set(initialSelectedItems.map((i) => i.name.trim().toLowerCase()));
      const pkgItems = getPkgItems(activePkg);
      const matchedPkgNames = pkgItems
        .filter((i) => initNamesSet.has(i.name.trim().toLowerCase()))
        .map((i) => i.name);

      if (matchedPkgNames.length > 0) {
        setSelectedItemNames(matchedPkgNames);
      }

      if (masterCatalogItems.length > 0) {
        const matchedExtraNames = extraAddOnItems
          .filter((i) => initNamesSet.has(i.name.trim().toLowerCase()))
          .map((i) => i.name);
        if (matchedExtraNames.length > 0) {
          setSelectedExtraItemNames(matchedExtraNames);
        }
        setHasAppliedInitial(true);
      }
    }
  }, [initialSelectedItems, masterCatalogItems, activePkgId, hasAppliedInitial]);

  // Automatically sync package selection if PKG-B is free in DB (only if not rescheduling)
  useEffect(() => {
    if (!initialSelectedItems && isPkgBFree && selectedPackageId !== pkgB.id) {
      onSelectPackage(pkgB.id);
    }
  }, [isPkgBFree, selectedPackageId, pkgB.id, initialSelectedItems]);

  // When active package changes after initial load, pre-select ALL items of the new package by default
  useEffect(() => {
    if (hasAppliedInitial || !initialSelectedItems || initialSelectedItems.length === 0) {
      const items = getPkgItems(activePkg);
      setSelectedItemNames(items.map((i) => i.name));
      setSelectedExtraItemNames([]);
    }
  }, [activePkgId]);

  const toggleItem = (itemName: string) => {
    if (selectedItemNames.includes(itemName)) {
      setSelectedItemNames(selectedItemNames.filter((name) => name !== itemName));
    } else {
      setSelectedItemNames([...selectedItemNames, itemName]);
    }
  };

  const toggleExtraItem = (itemName: string) => {
    if (selectedExtraItemNames.includes(itemName)) {
      setSelectedExtraItemNames(selectedExtraItemNames.filter((name) => name !== itemName));
    } else {
      setSelectedExtraItemNames([...selectedExtraItemNames, itemName]);
    }
  };

  const selectAllItems = () => {
    const items = getPkgItems(activePkg);
    setSelectedItemNames(items.map((i) => i.name));
  };

  const deselectAllItems = () => {
    setSelectedItemNames([]);
  };

  // Dynamic Price calculations based strictly on DB entitlements:
  let pkgBasePrice = 0;

  if (isSelectedPkgB) {
    if (isPkgBFree) {
      pkgBasePrice = 0;
    } else if (isPkgAFree) {
      // Free base PKG-A entitlement → UPGRADE mode for PKG-B
      pkgBasePrice = activeItems
        .filter((item) => selectedItemNames.includes(item.name) && !isIncludedInPkgA(item.name))
        .reduce((sum, item) => sum + (item.price || 0), 0);
    } else {
      // Neither PKG-B nor PKG-A is free in DB → FULL PAY
      pkgBasePrice = activePkg.price ?? 1200;
    }
  } else {
    // Selected PKG-A
    if (isPkgAFree) {
      pkgBasePrice = 0;
    } else {
      pkgBasePrice = activePkg.price ?? 500;
    }
  }

  // Extra add-on items price calculation
  const extraItemsPrice = extraAddOnItems
    .filter((item) => selectedExtraItemNames.includes(item.name))
    .reduce((sum, item) => sum + (item.price || 0), 0);

  const totalPrice = pkgBasePrice + extraItemsPrice;


  // Notify parent on state change
  useEffect(() => {
    const selectedPkgItems = activeItems.filter((item) => selectedItemNames.includes(item.name));
    const selectedExtraItems = extraAddOnItems.filter((item) => selectedExtraItemNames.includes(item.name));
    const combinedSelectedItems = [...selectedPkgItems, ...selectedExtraItems];

    onSelectPackage(activePkgId, combinedSelectedItems, totalPrice);
  }, [activePkgId, selectedItemNames, selectedExtraItemNames, totalPrice]);


  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-slate-500" />
          <span>เลือกโปรแกรมตรวจสุขภาพ</span>
        </h3>
        
        {/* Entitlement Banner & Auto-Assigned Package Card */}
        <div className="mt-2 text-xs">
          {isPkgBFree ? (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold">
                  {pkgB.code} (สิทธิ์ฟรีสวัสดิการ 100%)
                </span>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  สิทธิ์เฉพาะอายุ 35 ปีขึ้นไป (อายุของคุณ {userAge} ปี)
                </span>
              </div>
              <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                {pkgB.name}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                {pkgB.description} (ระบบเลือกรวมรายการตรวจฟรีสวัสดิการทั้งหมดให้คุณเรียบร้อยแล้ว)
              </p>
            </div>
          ) : isPkgAFree ? (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-4 border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold">
                  {pkgA.code} (สิทธิ์ฟรีสวัสดิการ 100%)
                </span>
                <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  สิทธิ์เฉพาะอายุน้อยกว่า 35 ปี (อายุของคุณ {userAge} ปี)
                </span>
              </div>
              <p className="text-sm font-bold text-blue-950 dark:text-blue-100">
                {pkgA.name}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300/90 leading-relaxed">
                {pkgA.description} (หากต้องการตรวจแล็บเพิ่มเติม สามารถเลือก Add-on รายการตรวจด้านล่างได้เลยครับ)
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">
                  {activePkg.code} (ชำระตามอัตราปกติ)
                </span>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">
                  สังกัด: {userOrgName || 'ทั่วไป'}
                </span>
              </div>
              <p className="text-sm font-bold text-amber-950 dark:text-amber-100">
                {activePkg.name}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300/90 leading-relaxed">
                คิดค่าบริการตามรายการตรวจที่เลือกชำระจริง
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lab Checklist Section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
              รายการตรวจในแพ็กเกจ ({activePkg.code})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              {isPkgBFree
                ? 'รายการตรวจทั้งหมดรวมอยู่ในสิทธิ์สวัสดิการเรียบร้อยแล้ว'
                : isUpgradeMode
                ? `รายการที่มีอยู่ใน ${pkgA.code} จะฟรีทั้งหมด ส่วนรายการที่เกินมาจะคิดตามราคาปกติ`
                : isPkgAFree
                ? 'รายการตรวจชุดพื้นฐานอยู่ในสิทธิ์สวัสดิการฟรี'
                : 'คิดค่าบริการตามรายการตรวจที่เลือกชำระเงินจริง'}
            </p>
          </div>

          {isSelectedPkgB && isUpgradeMode && (

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllItems}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                เลือกทั้งหมด
              </button>
              <span className="text-slate-300 dark:border-slate-700">|</span>
              <button
                type="button"
                onClick={deselectAllItems}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
              >
                ล้าง
              </button>
            </div>
          )}
        </div>

        {/* Checkbox Grid with Scrollable Container */}
        <div className="grid gap-2 sm:grid-cols-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
          {activeItems.map((item, idx) => {
            const isChecked = selectedItemNames.includes(item.name);
            const canToggle = isSelectedPkgB && isUpgradeMode;
            const inPkgA = isIncludedInPkgA(item.name);

            let priceBadge = null;
            if (isSelectedPkgB) {
              if (isPkgBFree) {
                priceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-medium">ฟรี (สวัสดิการ)</span>;
              } else if (isPkgAFree) {
                if (inPkgA) {
                  priceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-medium">ฟรี (สิทธิ์ {pkgA.code})</span>;
                } else {
                  priceBadge = (
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-semibold">
                      +{item.price > 0 ? `${item.price} ฿` : '0 ฿'}
                    </span>
                  );
                }
              } else {
                priceBadge = <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">฿{item.price || 0}</span>;
              }
            } else {
              if (isPkgAFree) {
                priceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-medium">ฟรี (สวัสดิการ)</span>;
              } else {
                priceBadge = <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">฿{item.price || 0}</span>;
              }
            }


            return (
              <label
                key={idx}
                onClick={() => {
                  if (canToggle) {
                    toggleItem(item.name);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors select-none ${
                  !canToggle
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 cursor-default'
                    : isChecked
                    ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 cursor-pointer'
                    : 'bg-slate-100/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                      isChecked
                        ? 'bg-slate-800 dark:bg-slate-200 border-slate-800 dark:border-slate-200 text-white dark:text-slate-900'
                        : 'border-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3" />}
                  </div>
                  <span
                    className={`text-xs truncate ${
                      isChecked ? 'text-slate-800 dark:text-slate-200 font-medium' : 'text-slate-400 line-through'
                    }`}
                  >
                    {item.name}
                  </span>
                </div>

                <span className="text-xs shrink-0 ml-2">
                  {priceBadge}
                </span>
              </label>
            );
          })}
        </div>

        {/* Extra Add-on Items Section (รายการตรวจเพิ่มเติม นอกเหนือจากแพ็กเกจ) */}
        {extraAddOnItems.length > 0 && (
          <div className="pt-3.5 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h5 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>รายการตรวจเพิ่มเติม นอกเหนือจาก{activePkg.code} (Add-on Extra Tests)</span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  เลือกเพิ่มรายการตรวจย่อยนอกเหนือจากแพ็กเกจ (ไม่เลือกให้อัตโนมัติ — หากเลือกจะคิดค่าบริการเพิ่มตามราคาของรายการ)
                </p>
              </div>
              {selectedExtraItemNames.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shrink-0">
                  เลือกเพิ่ม {selectedExtraItemNames.length} รายการ (+{extraItemsPrice.toLocaleString()} บาท)
                </span>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">

              {extraAddOnItems.map((item, idx) => {
                const isChecked = selectedExtraItemNames.includes(item.name);
                return (
                  <label
                    key={idx}
                    onClick={() => toggleExtraItem(item.name)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors select-none cursor-pointer ${
                      isChecked
                        ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <span
                        className={`text-xs truncate ${
                          isChecked ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span className="text-xs shrink-0 ml-2 font-mono font-semibold text-amber-600 dark:text-amber-400">
                      +{item.price > 0 ? `${item.price} ฿` : '0 ฿'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Total Price Summary Bar */}
        <div className="rounded-lg bg-slate-800 dark:bg-slate-950 p-3 text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-300">
              เลือก {selectedItemNames.length + selectedExtraItemNames.length} รายการ (ในแพ็กเกจ {selectedItemNames.length} + เพิ่มเติม {selectedExtraItemNames.length})
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 mr-2">ราคารวมสุทธิ:</span>
            <span className="text-sm font-semibold text-white">
              {totalPrice > 0 ? (
                <span className="text-amber-400 font-bold font-mono text-base">{totalPrice.toLocaleString()} บาท</span>
              ) : (
                <span className="text-emerald-400 font-bold">0 บาท (ฟรีสวัสดิการ)</span>
              )}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
