'use server';

import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { formatErrorMessage } from './common';

export async function getCampaignAction(userOrg?: string, userDept?: string) {
  return await store.getCampaign(userOrg, userDept);
}

export async function getCampaignsAction(userOrg?: string, userDept?: string) {
  return await store.getCampaigns(userOrg, userDept);
}

export async function createCampaignAction(data: {
  name: string;
  organization?: string;
  department?: string;
  targetDepartment?: string;
  year: number;
  startDate: string;
  endDate: string;
  defaultQuota: number;
  openDaysOfWeek?: string;
  advanceBookingDays?: number;
  eligibleStartworkCutoffDate?: string;
  announcement?: string;
}) {
  try {
    const newCampaign = await store.createCampaign(data);
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, campaign: newCampaign };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างโครงการใหม่');
    return { success: false, error: message };
  }
}

export async function toggleCampaignActiveAction(campaignId: string, isActive: boolean) {
  try {
    await store.toggleCampaignActive(campaignId, isActive);
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะโครงการ');
    return { success: false, error: message };
  }
}

export async function updateCampaignByIdAction(
  campaignId: string,
  updates: {
    name?: string;
    organization?: string;
    department?: string;
    targetDepartment?: string;
    year?: number;
    startDate?: string;
    endDate?: string;
    defaultQuota?: number;
    openDaysOfWeek?: string;
    advanceBookingDays?: number;
    eligibleStartworkCutoffDate?: string;
    isActive?: boolean;
    announcement?: string;
  }
) {
  try {
    const updated = await store.updateCampaignById(campaignId, updates);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, campaign: updated };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการอัปเดตโครงการ');
    return { success: false, error: message };
  }
}

export async function deleteCampaignAction(campaignId: string) {
  try {
    const res = await store.deleteCampaign(campaignId);
    revalidatePath('/');
    revalidatePath('/admin');
    return res;
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการลบโครงการ');
    return { success: false, message };
  }
}

export async function getPackagesAction() {
  return await store.getPackages();
}

export async function createPackageAction(data: {
  code: string;
  name: string;
  targetGroup: string;
  description: string;
  labTests: string[];
  preparationGuide?: string;
  items?: { name: string; price: number }[];
  minAge?: number;
  upgradePrice?: number;
}) {
  try {
    const pkg = await store.createPackage(data);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, package: pkg };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างโปรแกรมตรวจ');
    return { success: false, error: message };
  }
}

export async function updatePackageAction(
  packageId: string,
  updates: {
    code?: string;
    name?: string;
    targetGroup?: string;
    description?: string;
    labTests?: string[];
    preparationGuide?: string;
    items?: { name: string; price: number }[];
    minAge?: number;
    upgradePrice?: number;
  }
) {
  try {
    const pkg = await store.updatePackage(packageId, updates);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, package: pkg };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการอัปเดตโปรแกรมตรวจ');
    return { success: false, error: message };
  }
}

export async function deletePackageAction(packageId: string) {
  try {
    await store.deletePackage(packageId);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการลบโปรแกรมตรวจ');
    return { success: false, error: message };
  }
}

export async function getAllMasterItemsAction() {
  return await store.getAllMasterItems();
}

export async function createMasterItemAction(data: {
  name: string;
  price: number;
  category?: string;
  contraindicatedIfPregnant?: boolean;
  targetGender?: 'ALL' | 'MALE' | 'FEMALE';
  minAge?: number | null;
  maxAge?: number | null;
}) {
  try {
    const item = await store.createMasterItem(data);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, item };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างรายการตรวจ');
    return { success: false, error: message };
  }
}

export async function updateMasterItemAction(
  itemId: string,
  updates: {
    name?: string;
    price?: number;
    category?: string;
    contraindicatedIfPregnant?: boolean;
    targetGender?: 'ALL' | 'MALE' | 'FEMALE';
    minAge?: number | null;
    maxAge?: number | null;
  }
) {
  try {
    const item = await store.updateMasterItem(itemId, updates);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, item };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการอัปเดตรายการตรวจ');
    return { success: false, error: message };
  }
}

export async function deleteMasterItemAction(itemId: string) {
  try {
    await store.deleteMasterItem(itemId);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการลบรายการตรวจ');
    return { success: false, error: message };
  }
}

// --- Department Rules Server Actions ---
export async function getDepartmentRulesAction(departmentName?: string) {
  return await store.getDepartmentRules(departmentName);
}

export async function createDepartmentRuleAction(data: {
  departmentName: string;
  riskGroup?: string;
  itemId?: string;
  itemName: string;
  ruleType: 'MANDATORY_FREE' | 'OPTIONAL_FREE' | 'SPECIAL_PRICE' | 'HIDDEN';
  specialPrice?: number;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  ruleMessage?: string;
}) {
  try {
    const rule = await store.createDepartmentRule(data);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, rule };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างสิทธิ์เฉพาะแผนก');
    return { success: false, error: message };
  }
}

export async function updateDepartmentRuleAction(
  ruleId: string,
  updates: Parameters<typeof store.updateDepartmentRule>[1]
) {
  try {
    const rule = await store.updateDepartmentRule(ruleId, updates);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, rule };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขสิทธิ์เฉพาะแผนก');
    return { success: false, error: message };
  }
}

export async function deleteDepartmentRuleAction(ruleId: string) {
  try {
    await store.deleteDepartmentRule(ruleId);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการลบสิทธิ์เฉพาะแผนก');
    return { success: false, error: message };
  }
}

export async function getEntitlementsAction(organizationName?: string) {
  return await store.getEntitlements(organizationName);
}

export async function createEntitlementAction(data: {
  organizationName: string;
  packageId: string;
  minAge?: number | null;
  maxAge?: number | null;
  isFree: boolean;
  flatPrice?: number | null;
}) {
  try {
    const ent = await store.createEntitlement(data);
    revalidatePath('/admin');
    return { success: true, entitlement: ent };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างสิทธิ์ Package');
    return { success: false, error: message };
  }
}

export async function updateEntitlementAction(
  entId: string,
  updates: {
    minAge?: number | null;
    maxAge?: number | null;
    isFree?: boolean;
    flatPrice?: number | null;
  }
) {
  try {
    const ent = await store.updateEntitlement(entId, updates);
    revalidatePath('/admin');
    return { success: true, entitlement: ent };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์ Package');
    return { success: false, error: message };
  }
}

export async function deleteEntitlementAction(entId: string) {
  try {
    await store.deleteEntitlement(entId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการลบสิทธิ์ Package');
    return { success: false, error: message };
  }
}

export async function calculateBookingPriceAction(
  userId: string,
  packageId: string,
  selectedItems?: { id?: string; name: string; price: number }[],
  bookingDate?: Date | string
) {
  try {
    const user = await store.getUserById(userId);
    if (!user) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    const pricing = await store.calculateBookingPrice(user, packageId, selectedItems, bookingDate);
    return { success: true, pricing };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการคำนวณราคา');
    return { success: false, error: message };
  }
}
