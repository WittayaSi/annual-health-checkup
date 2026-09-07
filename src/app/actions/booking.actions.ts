'use server';

import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { formatErrorMessage } from './common';
import { sendLineFlexNotification } from '@/lib/line-api';
import {
  sendTelegramBookingNotificationCard,
  sendTelegramCancellationNotificationCard,
  sendTelegramRescheduleNotificationCard,
} from '@/lib/telegram-api';

export async function getSlotsAction(campaignId?: string, department?: string) {
  return await store.getDailySlots(campaignId, department);
}

export async function getBookingsAction() {
  return await store.getBookings();
}

export async function getUserBookingAction(userId: string) {
  return await store.getUserBooking(userId);
}

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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการจองคิว');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการยกเลิกคิว');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการย้ายวันตรวจ');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสล็อต');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสล็อตแบบกลุ่ม');
    return { success: false, error: message };
  }
}
