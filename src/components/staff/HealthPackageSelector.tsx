'use client';

import { useState, useEffect } from 'react';
import { CheckupPackage, User, TestItem } from '@/lib/types';
import {
  CheckCircle2,
  Stethoscope,
  Check,
  Calculator,
  Plus,
  X,
} from 'lucide-react';


import { resolveItemPrice, isInternalStaffUser, calculateAge, formatDetailedAge, getDepartmentItemRule, detectGender } from '@/lib/item-utils';
import { getAllMasterItemsAction, getEntitlementsAction, getDepartmentRulesAction } from '@/app/actions';
import { OrganizationEntitlement, DepartmentItemRule } from '@/lib/types';

interface HealthPackageSelectorProps {
  packages: CheckupPackage[];
  user: User;
  selectedPackageId: string;
  initialSelectedItems?: { id?: string; name: string; price?: number }[];
  targetDate?: Date | string;
  initialIsPregnant?: boolean;
  onSelectPackage: (pkgId: string, selectedItems?: TestItem[], totalPrice?: number, isPregnant?: boolean) => void;
}

export function HealthPackageSelector({
  packages,
  user,
  selectedPackageId,
  initialSelectedItems,
  targetDate,
  initialIsPregnant = false,
  onSelectPackage,
}: HealthPackageSelectorProps) {
  // Master Catalog items from MySQL DB strictly
  const [masterCatalogItems, setMasterCatalogItems] = useState<TestItem[]>([]);
  const [entitlements, setEntitlements] = useState<OrganizationEntitlement[]>([]);
  const [dbDepartmentRules, setDbDepartmentRules] = useState<DepartmentItemRule[]>([]);
  const [selectedExtraItemNames, setSelectedExtraItemNames] = useState<string[]>([]);
  const [hasAppliedInitial, setHasAppliedInitial] = useState(false);

  // Pregnancy screening state (only applicable for female staff)
  const isFemale = detectGender(user.firstName, user.gender) === 'FEMALE';
  const [isPregnant, setIsPregnant] = useState<boolean>(Boolean(initialIsPregnant));

  useEffect(() => {
    if (typeof initialIsPregnant === 'boolean') {
      setIsPregnant(initialIsPregnant);
    }
  }, [initialIsPregnant]);



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
    getDepartmentRulesAction().then((rules) => {
      if (rules) {
        setDbDepartmentRules(rules);
      }
    });
  }, []);

  // Determine user organization name and find DB entitlements strictly
  const userOrgName = (user.organization || user.department || '').trim();

  // Find DB entitlements strictly for user's organization name
  const isInternalStaff = isInternalStaffUser(user);
  const matchingEntitlements = entitlements.filter((e) => {
    const eOrg = (e.organizationName || '').toLowerCase().trim();
    const uOrg = userOrgName.toLowerCase();
    if (!eOrg || !uOrg) return false;

    // 1. Exact match on organization name
    if (eOrg === uOrg) return true;

    // 2. Only for Hospital Staff (โรงพยาบาลท่าสองยาง), allow matching hospital default entitlement
    if (isInternalStaff && (eOrg.includes('โรงพยาบาลท่าสองยาง') || eOrg.includes('รพ.ท่าสองยาง'))) {
      return true;
    }

    return false;
  });

  const hasEntitlements = matchingEntitlements.length > 0;

  // Calculate exact completed user age (อายุบริบูรณ์) as of target checkup date
  const checkupTargetDate = targetDate ? new Date(targetDate) : new Date();
  const userAge = user.dob ? calculateAge(user.dob, checkupTargetDate) : 30;

  // Find packages from Admin-configured packages list
  const pkgB = packages.find((p) => p.code === 'PKG-B' || p.id === 'pkg-b') || packages[1] || packages[0];
  const pkgA = packages.find((p) => p.code === 'PKG-A' || p.id === 'pkg-a') || packages[0];

  // Find DB entitlement for a given package and user age
  const getEntitlementForPackage = (pkg: CheckupPackage) => {
    const pkgCodeUpper = (pkg.code || pkg.id || '').toUpperCase();
    const isPkgA = pkgCodeUpper.includes('A');
    const isPkgB = pkgCodeUpper.includes('B');

    return matchingEntitlements.find((e) => {
      const ePkgCode = (e.packageCode || e.packageId || '').toUpperCase();
      let isPkgMatch = (
        (e.packageId && (e.packageId === pkg.id || e.packageId === pkg.code)) ||
        (e.packageCode && (e.packageCode === pkg.code || e.packageCode === pkg.id))
      );

      if (!isPkgMatch) {
        if (isPkgA && (ePkgCode.includes('A') || ePkgCode.includes('1'))) isPkgMatch = true;
        if (isPkgB && (ePkgCode.includes('B') || ePkgCode.includes('2'))) isPkgMatch = true;
      }
      if (!isPkgMatch) return false;

      const minOk = e.minAge == null || userAge >= e.minAge;
      const maxOk = e.maxAge == null || userAge <= e.maxAge;
      return minOk && maxOk;
    });
  };

  const pkgAEntitlement = getEntitlementForPackage(pkgA);
  const pkgBEntitlement = getEntitlementForPackage(pkgB);

  const isPkgAFree = Boolean(pkgAEntitlement?.isFree);
  const isPkgBFree = Boolean(pkgBEntitlement?.isFree);

  // Auto-select package strictly based on user age (age < 35 -> Package A, age >= 35 -> Package B)
  const defaultPkg = userAge >= 35 ? pkgB : pkgA;
  const activePkgId = selectedPackageId || defaultPkg.id;
  const activePkg = packages.find((p) => p.id === activePkgId) || defaultPkg;
  const isSelectedPkgB = activePkg.code === 'PKG-B' || activePkg.id === 'pkg-b';
  const isUpgradeMode = isSelectedPkgB && !isPkgBFree && isPkgAFree;
  const activePkgEntitlement = getEntitlementForPackage(activePkg);


  // Helper to extract items directly from Admin-configured package data and attach master catalog metadata
  const getPkgItems = (pkg: CheckupPackage): TestItem[] => {
    const rawItems: TestItem[] = (pkg.items && pkg.items.length > 0)
      ? pkg.items
      : (pkg.labTests || []).map((testName) => ({ name: testName, price: resolveItemPrice(testName, 0) }));

    return rawItems.map((item) => {
      const master = masterCatalogItems.find((m) => m.name.trim().toLowerCase() === item.name.trim().toLowerCase());
      
      const lowerName = (item.name || '').toLowerCase();
      const isXRayOrChest = lowerName.includes('เอกซเรย์') ||
        lowerName.includes('x-ray') ||
        lowerName.includes('chest') ||
        lowerName.includes('pa upright');

      const contraindicatedIfPregnant = master
        ? (master.contraindicatedIfPregnant || isXRayOrChest)
        : (item.contraindicatedIfPregnant ?? isXRayOrChest);

      return {
        ...item,
        price: resolveItemPrice(item.name, item.price),
        category: master?.category || item.category,
        contraindicatedIfPregnant: Boolean(contraindicatedIfPregnant),
        targetGender: master?.targetGender || item.targetGender || 'ALL',
      };
    });
  };

  // Extract items of Base Package A to dynamically compare against Package B
  const pkgAItems = getPkgItems(pkgA);
  const pkgAItemNamesSet = new Set(pkgAItems.map((i) => i.name.trim().toLowerCase()));

  // Helper to check if an item is covered in base Package A
  const isIncludedInPkgA = (itemName: string) => {
    return pkgAItemNamesSet.has(itemName.trim().toLowerCase());
  };

  // Active package items
  const activeItems = hasEntitlements ? getPkgItems(activePkg) : [];
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

  const userGender = detectGender(user.firstName, user.gender);

  // Filter out items that are already in activePkg or hidden by department rules or gender mismatch
  const extraAddOnItems: TestItem[] = Array.from(allAvailableItemsMap.values()).filter((item) => {
    const inActivePkg = activeItemNamesSet.has(item.name.trim().toLowerCase());
    if (inActivePkg) return false;
    if (item.targetGender && item.targetGender !== 'ALL' && item.targetGender !== userGender) return false;
    const rule = getDepartmentItemRule(item.name, user.department || '', user.organization || '', dbDepartmentRules);
    return !rule.isHidden;
  });

  // Auto-select mandatory department items for user (e.g. Stool Exam for Nutrition, Methamphetamine for Vehicles)
  useEffect(() => {
    extraAddOnItems.forEach((item) => {
      const rule = getDepartmentItemRule(item.name, user.department || '', user.organization || '', dbDepartmentRules);
      if (rule.isMandatory && !selectedExtraItemNames.includes(item.name)) {
        setSelectedExtraItemNames((prev) => [...prev, item.name]);
      }
    });
  }, [extraAddOnItems, user.department, user.organization, dbDepartmentRules]);

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

  const toggleSelectAllExtraItems = () => {
    const allNames = extraAddOnItems.map((i) => i.name);
    const isAllSelected = allNames.length > 0 && allNames.every((n) => selectedExtraItemNames.includes(n));
    if (isAllSelected) {
      setSelectedExtraItemNames([]);
    } else {
      setSelectedExtraItemNames(allNames);
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

  if (hasEntitlements) {
    if (activePkgEntitlement) {
      if (activePkgEntitlement.isFree) {
        pkgBasePrice = 0;
      } else if (activePkgEntitlement.flatPrice != null && activePkgEntitlement.flatPrice >= 0) {
        pkgBasePrice = activePkgEntitlement.flatPrice;
      } else {
        pkgBasePrice = activePkg.price ?? 500;
      }
    } else {
      if (isSelectedPkgB && isPkgAFree) {
        pkgBasePrice = activeItems
          .filter((item) => 
            selectedItemNames.includes(item.name) && 
            !isIncludedInPkgA(item.name) &&
            !(isFemale && isPregnant && item.contraindicatedIfPregnant)
          )
          .reduce((sum, item) => sum + (item.price || 0), 0);
      } else {
        pkgBasePrice = activePkg.price ?? 500;
      }
    }
  } else {
    // No package entitlement configured for this organization → No base package price
    pkgBasePrice = 0;
  }

  // Extra add-on items price calculation (considering department rule free status)
  const extraItemsPrice = extraAddOnItems
    .filter((item) => 
      selectedExtraItemNames.includes(item.name) &&
      !(isFemale && isPregnant && item.contraindicatedIfPregnant)
    )
    .reduce((sum, item) => {
      const rule = getDepartmentItemRule(item.name, user.department || '', user.organization || '', dbDepartmentRules);
      if (rule.isFree) return sum; // Free entitlement for department/staff
      if (rule.specialPrice !== null && rule.specialPrice !== undefined) return sum + rule.specialPrice;
      return sum + (item.price || 0);
    }, 0);

  const totalPrice = pkgBasePrice + extraItemsPrice;


  // Notify parent on state change (filtering out contraindicated items if pregnant)
  useEffect(() => {
    let selectedPkgItems = hasEntitlements ? activeItems.filter((item) => selectedItemNames.includes(item.name)) : [];
    let selectedExtraItems = extraAddOnItems.filter((item) => selectedExtraItemNames.includes(item.name));

    if (isFemale && isPregnant) {
      selectedPkgItems = selectedPkgItems.filter((item) => !item.contraindicatedIfPregnant);
      selectedExtraItems = selectedExtraItems.filter((item) => !item.contraindicatedIfPregnant);
    }

    const combinedSelectedItems = [...selectedPkgItems, ...selectedExtraItems];

    onSelectPackage(hasEntitlements ? activePkgId : 'custom', combinedSelectedItems, totalPrice, isFemale ? isPregnant : false);
  }, [hasEntitlements, activePkgId, selectedItemNames, selectedExtraItemNames, totalPrice, isPregnant, isFemale]);


  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-slate-500" />
          <span>{hasEntitlements ? 'เลือกโปรแกรมตรวจสุขภาพ' : 'รายการตรวจสุขภาพ (เลือกตามความประสงค์)'}</span>
        </h3>
        
        {/* Entitlement Banner & Auto-Assigned Package Card */}
        <div className="mt-2 text-xs">
          {hasEntitlements ? (
            activePkgEntitlement?.isFree ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold">
                    {activePkg.code} (สิทธิ์ฟรีสวัสดิการ 100%)
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    สังกัด: {userOrgName} | อายุ ณ วันที่ตรวจ: {formatDetailedAge(user.dob, checkupTargetDate)}
                  </span>
                </div>
                <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">
                  {activePkg.name}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300/90 leading-relaxed">
                  {activePkg.description} (สิทธิ์สวัสดิการตรวจฟรี 100%)
                </p>
              </div>
            ) : activePkgEntitlement?.flatPrice != null ? (
              <div className="rounded-xl bg-purple-50 dark:bg-purple-950/40 p-4 border border-purple-200 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 font-bold">
                    {activePkg.code} (เหมาจ่ายสวัสดิการ ฿{activePkgEntitlement.flatPrice.toLocaleString()} บาท)
                  </span>
                  <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                    สังกัด: {userOrgName} | อายุ ณ วันที่ตรวจ: {formatDetailedAge(user.dob, checkupTargetDate)}
                  </span>
                </div>
                <p className="text-sm font-bold text-purple-950 dark:text-purple-100">
                  {activePkg.name} — อัตราเหมาจ่าย ฿{activePkgEntitlement.flatPrice.toLocaleString()} บาท
                </p>
                <p className="text-xs text-purple-700 dark:text-purple-300/90 leading-relaxed">
                  {activePkg.description} (คิดค่าบริการอัตราเหมาจ่ายสวัสดิการองค์กร รวมรายการตรวจในชุดมาตรฐานเรียบร้อยแล้ว)
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-4 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold">
                    {activePkg.code} (ชำระอัตราปกติ ฿{(activePkg.price ?? 500).toLocaleString()})
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
            )
          ) : (
            <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 p-4 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-bold">
                  รายการตรวจธรรมดา (ไม่มีแพ็กเกจประจำองค์กร)
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  สังกัด: {userOrgName || 'ทั่วไป'}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                เลือกรายการตรวจสุขภาพรายบุคคล (รายการตรวจธรรมดา)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                หน่วยงานของคุณไม่ได้ตั้งค่าแพ็กเกจประจำองค์กรไว้ ท่านสามารถเลือกรายการตรวจสุขภาพธรรมดาจาก Master Catalog ด้านล่างได้ตามความประสงค์
              </p>
            </div>
          )}
        </div>

        {/* Pregnancy Screening Option (Female Staff Only) */}
        {isFemale && (
          <div className="mt-3 rounded-xl bg-pink-50 dark:bg-pink-950/40 p-3.5 border border-pink-200 dark:border-pink-900/50 text-pink-900 dark:text-pink-200 space-y-1.5 transition-all">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer font-bold text-xs text-pink-950 dark:text-pink-100 select-none">
                <input
                  type="checkbox"
                  checked={isPregnant}
                  onChange={(e) => setIsPregnant(e.target.checked)}
                  className="h-4 w-4 rounded border-pink-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                />
                <span>🤰 อยู่ระหว่างตั้งครรภ์ หรือสงสัยว่าตั้งครรภ์ (Pregnancy Screening)</span>
              </label>
              {isPregnant && (
                <span className="px-2 py-0.5 rounded bg-pink-200 dark:bg-pink-900 text-pink-900 dark:text-pink-100 text-[10px] font-extrabold animate-pulse shrink-0">
                  งดรายการข้อห้ามอัตโนมัติ
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
              * สำหรับบุคลากรหญิงที่ตั้งครรภ์ ระบบจะยกเว้น/งดรายการตรวจที่มีข้อห้ามสำหรับสตรีมีครรภ์ (เช่น เอกซเรย์ / รังสีวินิจฉัย) อัตโนมัติตามที่ Admin กำหนดไว้ใน Master Catalog
            </p>
          </div>
        )}
      </div>

      {/* Lab Checklist Section */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
        {hasEntitlements && (
          <>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                  รายการตรวจในแพ็กเกจ ({activePkg.code})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePkgEntitlement?.isFree
                    ? 'รายการตรวจทั้งหมดรวมอยู่ในสิทธิ์สวัสดิการฟรีเรียบร้อยแล้ว'
                    : activePkgEntitlement?.flatPrice != null
                    ? `รายการตรวจทั้งหมดรวมอยู่ในอัตราเหมาจ่ายสวัสดิการองค์กร ฿${activePkgEntitlement.flatPrice.toLocaleString()} บาทเรียบร้อยแล้ว`
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
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={deselectAllItems}
                    className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium"
                  >
                    ล้างการเลือก
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {activeItems.map((item, idx) => {
                const isChecked = selectedItemNames.includes(item.name);
                const isBasePkgAItem = isIncludedInPkgA(item.name);

                let priceBadge = null;
                if (activePkgEntitlement?.isFree) {
                  priceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">ฟรี (0 ฿)</span>;
                } else if (activePkgEntitlement?.flatPrice != null) {
                  priceBadge = <span className="text-purple-600 dark:text-purple-400 font-semibold font-mono">รวมในเหมาจ่าย</span>;
                } else if (isUpgradeMode) {
                  if (isBasePkgAItem) {
                    priceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">ฟรีสิทธิ์ {pkgA.code}</span>;
                  } else {
                    priceBadge = <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">+{item.price ?? 0} ฿</span>;
                  }
                } else if (isPkgAFree) {
                  priceBadge = <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">ฟรี (0 ฿)</span>;
                } else {
                  priceBadge = <span className="text-amber-600 dark:text-amber-400 font-semibold font-mono">{item.price ?? 0} ฿</span>;
                }

                const isDisabledByPregnancy = isFemale && isPregnant && item.contraindicatedIfPregnant;

                return (
                  <label
                    key={idx}
                    onClick={() => {
                      if (!isDisabledByPregnancy && (!isPkgBFree || isUpgradeMode)) {
                        toggleItem(item.name);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors select-none ${
                      isDisabledByPregnancy
                        ? 'bg-pink-50/60 dark:bg-pink-950/20 border-pink-200 dark:border-pink-900/50 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 shadow-sm cursor-pointer'
                        : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 opacity-60 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          isDisabledByPregnancy
                            ? 'border-pink-300 bg-pink-100 dark:bg-pink-900/50'
                            : isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {isChecked && !isDisabledByPregnancy && <Check className="h-3 w-3" />}
                        {isDisabledByPregnancy && <X className="h-3 w-3 text-pink-700 dark:text-pink-300" />}
                      </div>
                      <span
                        className={`text-xs truncate ${
                          isDisabledByPregnancy
                            ? 'text-pink-800 dark:text-pink-300 font-medium line-through'
                            : isChecked
                            ? 'text-slate-800 dark:text-slate-200 font-medium'
                            : 'text-slate-400 line-through'
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
          </>
        )}

        {/* Extra Add-on / Regular Test Items Section */}
        {extraAddOnItems.length > 0 && (
          <div className={`${hasEntitlements ? 'pt-3.5 border-t border-slate-200 dark:border-slate-700' : ''} space-y-2.5`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {hasEntitlements
                      ? `รายการตรวจเพิ่มเติม นอกเหนือจาก ${activePkg.code} (Add-on Extra Tests)`
                      : 'รายการตรวจสุขภาพธรรมดา (เลือกรายการตรวจตามความประสงค์)'}
                  </span>
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {hasEntitlements
                    ? 'เลือกเพิ่มรายการตรวจย่อยนอกเหนือจากแพ็กเกจ (ไม่เลือกให้อัตโนมัติ — หากเลือกจะคิดค่าบริการเพิ่มตามราคาของรายการ)'
                    : 'เลือกรายการตรวจสุขภาพรายบุคคลที่ต้องการ (คิดตามราคาปกติ หรือ สิทธิ์ฟรีตามแผนกถ้ามี)'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={toggleSelectAllExtraItems}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {extraAddOnItems.every((i) => selectedExtraItemNames.includes(i.name))
                      ? 'ยกเลิกเลือกทั้งหมด'
                      : 'เลือกทั้งหมด'}
                  </span>
                </button>
                {selectedExtraItemNames.length > 0 && (
                  <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    เลือกแล้ว {selectedExtraItemNames.length} รายการ (+{extraItemsPrice.toLocaleString()} ฿)
                  </span>
                )}
              </div>
            </div>

            <div className={`grid gap-2 sm:grid-cols-2 ${hasEntitlements ? 'max-h-56' : 'max-h-80'} overflow-y-auto pr-1 scrollbar-thin`}>
              {extraAddOnItems.map((item, idx) => {
                const isChecked = selectedExtraItemNames.includes(item.name);
                const rule = getDepartmentItemRule(item.name, user.department || '', user.organization || '', dbDepartmentRules);
                const isMandatory = rule.isMandatory;
                const isFree = rule.isFree;

                return (
                  <label
                    key={idx}
                    onClick={() => {
                      if (!isMandatory) {
                        toggleExtraItem(item.name);
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors select-none ${
                      isMandatory
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 cursor-not-allowed'
                        : isChecked
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 cursor-pointer'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          isChecked
                            ? isMandatory
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'border-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="h-3 w-3" />}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-xs truncate block ${
                            isChecked ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.name}
                        </span>
                        {rule.ruleMessage && (
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-medium">
                            {rule.ruleMessage}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-xs shrink-0 ml-2 font-mono font-semibold">
                      {isFree ? (
                        <span className="text-emerald-600 dark:text-emerald-400">ฟรี (0 ฿)</span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400">+{item.price > 0 ? `${item.price} ฿` : '0 ฿'}</span>
                      )}
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
