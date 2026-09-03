'use server';

import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { User, UserRole } from '@/lib/types';

export async function getActiveUserAction(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('active_user_id')?.value;
    if (userIdCookie) {
      const user = await store.getUserById(userIdCookie);
      if (user && user.isActive !== false) {
        // Sliding Session Expiration: Auto-renew 1-hour cookie while user is actively using the app
        try {
          cookieStore.set('active_user_id', user.id, {
            path: '/',
            httpOnly: true,
            maxAge: 3600,
          });
        } catch (e) {}
        return user;
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

export async function getAllUsersAction() {
  return await store.getUsers();
}

export async function getOrganizationsAction() {
  return await store.getOrganizations();
}

export async function createOrganizationAction(data: { name: string }) {
  try {
    const org = await store.createOrganization(data);
    revalidatePath('/admin');
    revalidatePath('/booking');
    return { success: true, organization: org };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างสังกัดองค์กรหลัก';
    return { success: false, error: message };
  }
}

export async function updateOrganizationAction(id: string, updates: { name?: string }) {
  try {
    const org = await store.updateOrganization(id, updates);
    revalidatePath('/admin');
    revalidatePath('/booking');
    return { success: true, organization: org };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการแก้ไขสังกัดองค์กร';
    return { success: false, error: message };
  }
}

export async function deleteOrganizationAction(id: string) {
  try {
    await store.deleteOrganization(id);
    revalidatePath('/admin');
    revalidatePath('/booking');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบสังกัดองค์กร';
    return { success: false, error: message };
  }
}

export async function importOrganizationUsersAction(organizationName: string, usersData: any[]) {
  try {
    const res = await store.importUsersToOrganization(organizationName, usersData);
    revalidatePath('/admin');
    revalidatePath('/booking');
    return { success: true, count: res.count };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการนำเข้าเจ้าหน้าที่ประจำสังกัดองค์กร';
    return { success: false, error: message };
  }
}

export async function switchUserAction(userId: string) {
  const user = await store.setActiveUserId(userId);
  try {
    const cookieStore = await cookies();
    cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: 3600 });
  } catch (e) {}
  revalidatePath('/');
  revalidatePath('/booking');
  revalidatePath('/admin');
  return user;
}

export async function getCampaignAction(userOrg?: string, userDept?: string) {
  return await store.getCampaign(userOrg, userDept);
}

export async function getCampaignsAction(userOrg?: string, userDept?: string) {
  return await store.getCampaigns(userOrg, userDept);
}

export async function getPackagesAction() {
  return await store.getPackages();
}

export async function getSlotsAction(campaignId?: string, department?: string) {
  return await store.getDailySlots(campaignId, department);
}

export async function getBookingsAction() {
  return await store.getBookings();
}

export async function getUserBookingAction(userId: string) {
  return await store.getUserBooking(userId);
}

export async function getAuditLogsAction() {
  const activeUser = await store.getActiveUser();
  if (activeUser?.role !== 'ADMIN') {
    return [];
  }
  return await store.getAuditLogs();
}

import { sendLineFlexNotification, sendLine1DayReminderFlexNotification } from '@/lib/line-api';
import {
  sendTelegramBookingNotificationCard,
  sendTelegramCancellationNotificationCard,
  sendTelegramRescheduleNotificationCard,
  sendTelegram1DayReminderNotificationCard,
} from '@/lib/telegram-api';

export async function bookSlotAction(
  userId: string,
  dailySlotId: string,
  timeSlotId?: string,
  packageId?: string,
  notes?: string,
  selectedItems?: { id?: string; name: string; price: number }[]
) {
  try {
    const booking = await store.bookSlot(userId, dailySlotId, timeSlotId, packageId, notes, selectedItems);
    
    // Trigger real LINE Flex Message Push Notification if user linked LINE OA
    try {
      const user = await store.getUserById(userId);
      if (user && user.isLineLinked && user.lineUserId) {
        const slots = await store.getDailySlots();
        const slot = slots.find((s) => s.id === dailySlotId);
        const packages = await store.getPackages();
        const pkg = packages.find((p) => p.id === packageId);
        
        await sendLineFlexNotification(user.lineUserId, {
          queueNumber: booking.queueNumber || 'A-000',
          userName: `${user.firstName} ${user.lastName}`,
          organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
          dateStr: slot?.date || new Date().toISOString().split('T')[0],
          timeSlotStr: '08:00 - 12:00 น.',
          packageName: pkg?.name || 'แพ็กเกจตรวจสุขภาพประจำปี',
        });
      }
    } catch (lineErr) {
      console.error('Failed to dispatch LINE notification:', lineErr);
    }

    // Trigger Telegram Card Notification
    try {
      const user = await store.getUserById(userId);
      const slots = await store.getDailySlots();
      const slot = slots.find((s) => s.id === dailySlotId);
      const packages = await store.getPackages();
      const pkg = packages.find((p) => p.id === packageId);

      if (user && slot && pkg) {
        const pricingModeLabel =
          booking.pricingMode === 'FREE'
            ? 'ฟรีตามสิทธิ์ 100%'
            : booking.pricingMode === 'UPGRADE'
            ? 'ฟรีสวัสดิการ + ชำระส่วนต่าง'
            : booking.pricingMode === 'FLAT_RATE'
            ? 'เหมาจ่าย'
            : 'ชำระเต็มราคา';

        await sendTelegramBookingNotificationCard({
          userName: `${user.firstName} ${user.lastName}`,
          userPhone: user.phone,
          organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
          departmentName: user.department,
          dateStr: slot.date,
          packageName: pkg.name,
          packageCode: pkg.code,
          totalPrice: booking.totalPrice ?? 0,
          pricingModeLabel,
          selectedItems: selectedItems?.map((it) => it.name),
          notes: notes,
          userTelegramToken: user.telegramToken,
          userTelegramChatId: user.telegramChatId,
        });

      }
    } catch (telegramErr) {
      console.error('Failed to dispatch Telegram notification:', telegramErr);
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, booking };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการจองคิว';
    return { success: false, error: message };
  }
}


export async function cancelBookingAction(bookingId: string) {
  try {
    const bookings = await store.getBookings();
    const targetBooking = bookings.find((b) => b.id === bookingId);

    await store.cancelBooking(bookingId);

    if (targetBooking) {
      try {
        const user = targetBooking.user || (await store.getUserById(targetBooking.userId));
        if (user) {
          await sendTelegramCancellationNotificationCard({
            userName: `${user.firstName} ${user.lastName}`,
            userPhone: user.phone,
            organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
            departmentName: user.department,
            dateStr: targetBooking.dailySlot?.date || new Date().toISOString().split('T')[0],
            packageCode: targetBooking.package?.code,
            packageName: targetBooking.package?.name,
            queueNumber: targetBooking.queueNumber || undefined,
            userTelegramToken: user.telegramToken,
            userTelegramChatId: user.telegramChatId,
          });
        }
      } catch (telegramErr) {
        console.error('Failed to dispatch Telegram cancellation notification:', telegramErr);
      }
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกคิว';
    return { success: false, error: message };
  }
}

export async function rescheduleBookingAction(
  bookingId: string,
  newDailySlotId: string,
  newTimeSlotId?: string,
  newPackageId?: string,
  notes?: string,
  selectedItems?: { id?: string; name: string; price: number }[]
) {
  try {
    const bookingsList = await store.getBookings();
    const oldBooking = bookingsList.find((b) => b.id === bookingId);
    const oldDateStr = oldBooking?.dailySlot?.date;

    const newBooking = await store.rescheduleBooking(
      bookingId,
      newDailySlotId,
      newTimeSlotId,
      newPackageId,
      notes,
      selectedItems
    );

    // Trigger Telegram Reschedule Notification
    try {
      const user = await store.getUserById(newBooking.userId);
      const slots = await store.getDailySlots();
      const slot = slots.find((s) => s.id === newDailySlotId);
      const packages = await store.getPackages();
      const pkg = packages.find((p) => p.id === (newPackageId || newBooking.packageId));

      if (user && slot && pkg) {
        const pricingModeLabel =
          newBooking.pricingMode === 'FREE'
            ? 'ฟรีตามสิทธิ์ 100%'
            : newBooking.pricingMode === 'UPGRADE'
            ? 'ฟรีสวัสดิการ + ชำระส่วนต่าง'
            : newBooking.pricingMode === 'FLAT_RATE'
            ? 'เหมาจ่าย'
            : 'ชำระเต็มราคา';

        await sendTelegramRescheduleNotificationCard({
          userName: `${user.firstName} ${user.lastName}`,
          userPhone: user.phone,
          organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
          departmentName: user.department,
          oldDateStr: oldDateStr,
          newDateStr: slot.date,
          packageName: pkg.name,
          packageCode: pkg.code,
          queueNumber: newBooking.queueNumber || undefined,
          totalPrice: newBooking.totalPrice ?? 0,
          pricingModeLabel,
          selectedItems: selectedItems?.map((it) => it.name),
          userTelegramToken: user.telegramToken,
          userTelegramChatId: user.telegramChatId,
        });
      }
    } catch (telegramErr) {
      console.error('Failed to dispatch Telegram notification on reschedule:', telegramErr);
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, booking: newBooking };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการย้ายวันตรวจ';
    return { success: false, error: message };
  }
}

export async function updateDailySlotAction(
  slotId: string,
  quota: number,
  isHoliday: boolean,
  holidayNote?: string
) {
  try {
    const updated = await store.updateDailySlot(slotId, { quota, isHoliday, holidayNote });
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, updated };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสล็อต';
    return { success: false, error: message };
  }
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างโครงการใหม่';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะโครงการ';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตโครงการ';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบโครงการ';
    return { success: false, message };
  }
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างโปรแกรมตรวจ';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตโปรแกรมตรวจ';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบโปรแกรมตรวจ';
    return { success: false, error: message };
  }
}

export async function batchUpdateSlotsAction(
  startDate: string,
  endDate: string,
  quota?: number,
  isHoliday?: boolean,
  holidayNote?: string,
  campaignId?: string
) {
  try {
    const updatedCount = await store.batchUpdateSlots(startDate, endDate, quota, isHoliday, holidayNote, campaignId);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, updatedCount };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสล็อตแบบกลุ่ม';
    return { success: false, error: message };
  }
}

export async function syncHospitalStaffDataAction(): Promise<
  { success: true; syncedCount: number; newUsersCount: number } | { success: false; error: string }
> {
  try {
    const activeUser = await store.getActiveUser();
    if (activeUser?.role !== 'ADMIN') {
      return { success: false, error: 'เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถซิงก์ข้อมูลเจ้าหน้าที่ได้' };
    }
    const result = await store.syncCentralHospitalStaff();
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, ...result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการซิงก์ข้อมูลจากฐานกลาง';
    return { success: false, error: message };
  }
}

export async function bindLineAccountAction(
  username: string,
  last4NationalId: string,
  lineProfile?: { lineUserId: string; lineDisplayName: string; linePictureUrl?: string }
) {
  try {
    const user = await store.bindLineAccount(username, last4NationalId, lineProfile);
    try {
      const cookieStore = await cookies();
      cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: 3600 });
    } catch (e) {}
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการผูกบัญชี LINE OA';
    return { success: false, error: message };
  }
}

export async function loginWithHospitalCredentialsAction(username: string, last4NationalId: string) {
  try {
    const user = await store.loginWithHospitalCredentials(username, last4NationalId);
    try {
      const cookieStore = await cookies();
      cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: 3600 });
    } catch (e) {}
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    return { success: false, error: message };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('active_user_id');
  } catch (e) {}
  revalidatePath('/');
  revalidatePath('/booking');
  revalidatePath('/admin');
  return { success: true };
}

export async function loginWithLineAction(lineUserId: string) {
  try {
    const user = await store.loginWithLine(lineUserId);
    try {
      const cookieStore = await cookies();
      cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: 3600 });
    } catch (e) {}
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการล็อกอินด้วย LINE';
    return { success: false, error: message };
  }
}

export async function unbindLineAccountAction(userId: string) {
  try {
    const user = await store.unbindLineAccount(userId);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยกเลิกผูกบัญชี';
    return { success: false, error: message };
  }
}

export async function updateUserRoleAction(userId: string, newRole: UserRole) {
  try {
    const activeUser = await store.getActiveUser();
    if (activeUser?.role !== 'ADMIN') {
      return { success: false, error: 'เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถปรับเปลี่ยนสิทธิ์ผู้ใช้งานได้' };
    }
    const user = await store.updateUserRole(userId, newRole);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสิทธิ์ผู้ใช้งาน';
    return { success: false, error: message };
  }
}

// Master Items Catalog Actions
export async function getAllMasterItemsAction() {
  return await store.getAllMasterItems();
}

export async function createMasterItemAction(data: {
  name: string;
  price: number;
  category?: string;
}) {
  try {
    const item = await store.createMasterItem(data);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, item };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างรายการตรวจ';
    return { success: false, error: message };
  }
}

export async function updateMasterItemAction(
  itemId: string,
  updates: {
    name?: string;
    price?: number;
    category?: string;
  }
) {
  try {
    const item = await store.updateMasterItem(itemId, updates);
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, item };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตรายการตรวจ';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบรายการตรวจ';
    return { success: false, error: message };
  }
}

// --- Organization Entitlements Actions ---

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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการสร้างสิทธิ์ Package';
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
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตสิทธิ์ Package';
    return { success: false, error: message };
  }
}

export async function deleteEntitlementAction(entId: string) {
  try {
    await store.deleteEntitlement(entId);
    revalidatePath('/admin');
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบสิทธิ์ Package';
    return { success: false, error: message };
  }
}

// --- Pricing Calculation Action ---

export async function calculateBookingPriceAction(
  userId: string,
  packageId: string,
  selectedItems?: { id?: string; name: string; price: number }[]
) {
  try {
    const user = await store.getUserById(userId);
    if (!user) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };
    const pricing = await store.calculateBookingPrice(user, packageId, selectedItems);
    return { success: true, pricing };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการคำนวณราคา';
    return { success: false, error: message };
  }
}

export async function sendLineReminderAction(userId: string) {
  try {
    const user = await store.getUserById(userId);
    if (!user) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้งาน' };
    if (!user.isLineLinked || !user.lineUserId) {
      return { success: false, error: 'ผู้ใช้งานนี้ยังไม่ได้ผูกบัญชี LINE OA' };
    }

    await sendLineFlexNotification(user.lineUserId, {
      queueNumber: 'แจ้งเตือน',
      userName: `${user.firstName} ${user.lastName}`,
      organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
      dateStr: 'โปรดเลือกวันตรวจในระบบ',
      timeSlotStr: '08:00 - 12:00 น.',
      packageName: 'กรุณาลงทะเบียนจองคิวตรวจสุขภาพประจำปี',
    });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งข้อความ LINE';
    return { success: false, error: message };
  }
}

export async function sendTelegramBookingNotificationAction(
  bookingId: string,
  customBotToken?: string,
  customChatId?: string
) {
  try {
    const bookings = await store.getBookings();
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'ไม่พบข้อมูลการจอง' };

    const user = booking.user || (await store.getUserById(booking.userId));
    const slot = booking.dailySlot;
    const pkg = booking.package;

    if (!user || !slot || !pkg) {
      return { success: false, error: 'ข้อมูลการจองไม่สมบูรณ์' };
    }

    const pricingModeLabel =
      booking.pricingMode === 'FREE'
        ? 'ฟรีตามสิทธิ์ 100%'
        : booking.pricingMode === 'UPGRADE'
        ? 'ฟรีสวัสดิการ + ชำระส่วนต่าง'
        : booking.pricingMode === 'FLAT_RATE'
        ? 'เหมาจ่าย'
        : 'ชำระเต็มราคา';

    const selectedItemNames = booking.items?.map((it) => it.itemName) || [];

    const res = await sendTelegramBookingNotificationCard(
      {
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phone,
        organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
        departmentName: user.department,
        dateStr: slot.date,
        packageName: pkg.name,
        packageCode: pkg.code,
        totalPrice: booking.totalPrice ?? 0,
        pricingModeLabel,
        selectedItems: selectedItemNames,
        notes: booking.notes,
        userTelegramToken: user.telegramToken,
        userTelegramChatId: user.telegramChatId,
      },
      customBotToken,
      customChatId
    );


    return res;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่ง Telegram Card';
    return { success: false, error: message };
  }
}

/**
 * Server Action: Process 1-Day Before Checkup Booking Reminders Batch
 * Checks for CONFIRMED bookings where reminderSent === false
 * Attempts sending LINE Flex Notification / Telegram Card
 * If failed, enforces hourly retry backoff (tries once every 1 hour until successful).
 */
export async function processBookingRemindersAction(isForceRun = false) {
  try {
    const now = new Date();
    // Get current hour in Thailand Timezone (Asia/Bangkok)
    const currentHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: 'numeric',
        hour12: false,
      }).format(now),
      10
    );

    // Enforce Working Hours: 08:00 - 17:00 (8 <= currentHour < 17)
    // Allow override if Admin explicitly clicked force run button
    const isWorkingHours = currentHour >= 8 && currentHour < 17;
    if (!isWorkingHours && !isForceRun) {
      return {
        success: true,
        message: 'อยู่นอกเวลาทำการส่งแจ้งเตือน (เปิดส่งอัตโนมัติเฉพาะเวลา 08:00 - 17:00 น.)',
        processedCount: 0,
        sentSuccessCount: 0,
        failedCount: 0,
        tomorrowDate: '',
        details: [],
      };
    }

    const bookings = await store.getBookings();
    const activeBookings = bookings.filter((b) => b.status === 'CONFIRMED' && b.dailySlot?.date);

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    const eligibleBookings = activeBookings.filter((b) => {
      // Must not be sent yet
      if (b.reminderSent) return false;
      const slotDate = b.dailySlot?.date;
      if (!slotDate) return false;

      // Target tomorrow's bookings or any upcoming/today bookings that missed reminder
      const isTargetingDate = slotDate === tomorrowStr || slotDate === todayStr || slotDate < tomorrowStr;
      if (!isTargetingDate) return false;

      // Check 1-hour retry backoff window: if attempted previously, must be >= 60 minutes ago
      if (b.reminderLastAttemptAt) {
        const lastAttemptMs = new Date(b.reminderLastAttemptAt).getTime();
        const diffMinutes = (Date.now() - lastAttemptMs) / (1000 * 60);
        if (diffMinutes < 60) {
          return false; // Skip for now, retry next hour window
        }
      }

      return true;
    });

    let sentSuccessCount = 0;
    let failedCount = 0;
    const details: Array<{
      bookingId: string;
      userName: string;
      date: string;
      status: 'SENT' | 'FAILED';
      error?: string;
    }> = [];

    for (const b of eligibleBookings) {
      const user = b.user;
      const slot = b.dailySlot;
      const timeSlot = b.timeSlot;
      const pkg = b.package;

      if (!user) {
        details.push({
          bookingId: b.id,
          userName: 'Unknown User',
          date: slot?.date || 'N/A',
          status: 'FAILED',
          error: 'ไม่พบข้อมูลผู้ใช้',
        });
        continue;
      }

      let dispatchSuccess = false;
      let lastError = '';

      const timeSlotStr = timeSlot
        ? `${timeSlot.startTime} - ${timeSlot.endTime} น.`
        : 'ตามลำดับคิว (08:00 - 12:00 น.)';

      // 1. Send via Telegram Notification (Primary)
      const telegramRes = await sendTelegram1DayReminderNotificationCard({
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phone,
        organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
        departmentName: user.department,
        dateStr: slot?.date || tomorrowStr,
        timeSlotStr,
        queueNumber: b.queueNumber || 'N/A',
        packageName: pkg?.name || 'แพ็กเกจตรวจสุขภาพประจำปี',
        packageCode: pkg?.code || 'CHECKUP',
        totalPrice: b.totalPrice ?? 0,
        pricingModeLabel: 'เตือนนัดตรวจพรุ่งนี้ (งดน้ำงดอาหาร)',
        selectedItems: b.items?.map((i) => i.itemName) || [],
        preparationGuide: pkg?.preparationGuide,
        notes: b.notes,
        userTelegramToken: user.telegramToken,
        userTelegramChatId: user.telegramChatId,
      });

      if (telegramRes.success) {
        dispatchSuccess = true;
      } else {
        lastError = telegramRes.error || 'ส่ง Telegram Notification ไม่สำเร็จ';

        // 2. Fallback: Send via LINE Flex Message if Telegram Token is not configured for user
        if (user.lineUserId) {
          const lineRes = await sendLine1DayReminderFlexNotification(user.lineUserId, {
            queueNumber: b.queueNumber || 'A-001',
            userName: `${user.firstName} ${user.lastName}`,
            organizationName: user.organization || user.department || 'โรงพยาบาลท่าสองยาง',
            dateStr: slot?.date || tomorrowStr,
            timeSlotStr,
            packageName: pkg?.name || 'แพ็กเกจตรวจสุขภาพประจำปี',
          });

          if (lineRes.success) {
            dispatchSuccess = true;
          }
        }
      }

      if (dispatchSuccess) {
        await store.updateBookingReminderStatus(b.id, true);
        sentSuccessCount++;
        details.push({
          bookingId: b.id,
          userName: `${user.firstName} ${user.lastName}`,
          date: slot?.date || tomorrowStr,
          status: 'SENT',
        });
      } else {
        await store.updateBookingReminderStatus(b.id, false);
        failedCount++;
        details.push({
          bookingId: b.id,
          userName: `${user.firstName} ${user.lastName}`,
          date: slot?.date || tomorrowStr,
          status: 'FAILED',
          error: lastError || 'ยังไม่ได้ผูก Telegram Chat ID หรือ LINE ID',
        });
      }
    }

    revalidatePath('/admin');
    revalidatePath('/booking');

    return {
      success: true,
      processedCount: eligibleBookings.length,
      sentSuccessCount,
      failedCount,
      tomorrowDate: tomorrowStr,
      details,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการประมวลผลการแจ้งเตือน';
    return {
      success: false,
      error: errorMsg,
      processedCount: 0,
      sentSuccessCount: 0,
      failedCount: 0,
      tomorrowDate: '',
      details: [],
    };
  }
}

/**
 * Server Action: Send Telegram unbooked reminder to a specific staff member
 */
export async function sendTelegramUnbookedReminderAction(userId: string) {
  try {
    const user = await store.getUserById(userId);
    if (!user) return { success: false, error: 'ไม่พบข้อมูลผู้ใช้' };

    const botToken = user.telegramToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = user.telegramChatId || process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return {
        success: false,
        error: `ไม่พบ Telegram Token/Chat ID ในข้อมูลเจ้าหน้าที่ ${user.firstName} ${user.lastName}`,
      };
    }

    const campaign = await store.getCampaign();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5555';

    const textMessage = `
🔔 <b>แจ้งเตือนลงทะเบียนจองวันตรวจสุขภาพประจำปี</b>
🏥 <b>โรงพยาบาลท่าสองยาง</b>
━━━━━━━━━━━━━━━━━━━━━
เรียนคุณ <b>${user.firstName} ${user.lastName}</b> (${user.department || '-'})

ขอเรียนเชิญลงทะเบียนจองวันเข้ารับการตรวจสุขภาพประจำปี (${campaign.name})
📅 <b>ระยะเวลาเปิดรับจอง:</b> ${campaign.startDate} ถึง ${campaign.endDate}
📍 <b>สถานที่ตรวจ:</b> ศูนย์ตรวจสุขภาพ Wellness Center ชั้น 3

👉 <b>คลิกเพื่อเข้าจองวันตรวจสุขภาพทันที:</b>
${appUrl}/booking

⏱ <i>ข้อความแจ้งเตือนอัตโนมัติจากฝ่ายบริหารทรัพยากรบุคคล (HR)</i>
`.trim();

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
    });

    const result = await res.json();
    if (!res.ok || !result.ok) {
      return { success: false, error: result.description || 'ส่ง Telegram ไม่สำเร็จ' };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่ง Telegram';
    return { success: false, error: errorMsg };
  }
}

/**
 * Server Actions: Toggle & Check System Maintenance Mode
 */
let globalMaintenanceState = false;

export async function toggleMaintenanceModeAction(isMaintenance: boolean) {
  try {
    const activeUser = await getActiveUserAction();
    if (activeUser?.role !== 'ADMIN') {
      return { success: false, error: 'เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถสลับโหมดปิดปรับปรุงระบบได้' };
    }

    globalMaintenanceState = isMaintenance;

    const cookieStore = await cookies();
    if (isMaintenance) {
      cookieStore.set('maintenance_mode', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: false });
    } else {
      cookieStore.delete('maintenance_mode');
    }

    revalidatePath('/', 'layout');
    return { success: true, isMaintenance };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการสลับโหมดปิดปรับปรุงระบบ';
    return { success: false, error: errorMsg };
  }
}

export async function getMaintenanceModeAction() {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || process.env.MAINTENANCE_MODE === 'true';
}



