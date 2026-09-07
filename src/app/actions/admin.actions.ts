'use server';

import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { formatErrorMessage } from './common';
import { sendLineFlexNotification, sendLine1DayReminderFlexNotification } from '@/lib/line-api';
import {
  sendTelegramBookingNotificationCard,
  sendTelegram1DayReminderNotificationCard,
} from '@/lib/telegram-api';

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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการสร้างสังกัดองค์กรหลัก');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการแก้ไขสังกัดองค์กร');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการลบสังกัดองค์กร');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการนำเข้าเจ้าหน้าที่ประจำสังกัดองค์กร');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการซิงก์ข้อมูลจากฐานกลาง');
    return { success: false, error: message };
  }
}

export async function getAuditLogsAction() {
  const activeUser = await store.getActiveUser();
  if (activeUser?.role !== 'ADMIN') {
    return [];
  }
  return await store.getAuditLogs();
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการส่งข้อความ LINE');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการส่ง Telegram Card');
    return { success: false, error: message };
  }
}

export async function processBookingRemindersAction(isForceRun = false) {
  try {
    const now = new Date();
    const currentHour = parseInt(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Bangkok',
        hour: 'numeric',
        hour12: false,
      }).format(now),
      10
    );

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
      if (b.reminderSent) return false;
      const slotDate = b.dailySlot?.date;
      if (!slotDate) return false;

      const isTargetingDate = slotDate === tomorrowStr || slotDate === todayStr || slotDate < tomorrowStr;
      if (!isTargetingDate) return false;

      if (b.reminderLastAttemptAt) {
        const lastAttemptMs = new Date(b.reminderLastAttemptAt).getTime();
        const diffMinutes = (Date.now() - lastAttemptMs) / (1000 * 60);
        if (diffMinutes < 60) {
          return false;
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

    try {
      revalidatePath('/admin');
      revalidatePath('/booking');
    } catch (e) {
      // Ignore revalidation errors when invoked from background auto-scheduler
    }

    return {
      success: true,
      processedCount: eligibleBookings.length,
      sentSuccessCount,
      failedCount,
      tomorrowDate: tomorrowStr,
      details,
    };
  } catch (err: unknown) {
    const errorMsg = formatErrorMessage(err, 'เกิดข้อผิดพลาดในการประมวลผลการแจ้งเตือน');
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
    const errorMsg = formatErrorMessage(err, 'เกิดข้อผิดพลาดในการส่ง Telegram');
    return { success: false, error: errorMsg };
  }
}

export async function toggleMaintenanceModeAction(isMaintenance: boolean) {
  try {
    const activeUser = await store.getActiveUser();
    if (activeUser?.role !== 'ADMIN') {
      return { success: false, error: 'เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่สามารถสลับโหมดปิดปรับปรุงระบบได้' };
    }

    const cookieStore = await cookies();
    if (isMaintenance) {
      cookieStore.set('maintenance_mode', 'true', { path: '/', maxAge: 60 * 60 * 24 * 30, httpOnly: false });
    } else {
      cookieStore.delete('maintenance_mode');
    }

    revalidatePath('/', 'layout');
    return { success: true, isMaintenance };
  } catch (err: unknown) {
    const errorMsg = formatErrorMessage(err, 'เกิดข้อผิดพลาดในการสลับโหมดปิดปรับปรุงระบบ');
    return { success: false, error: errorMsg };
  }
}

export async function getMaintenanceModeAction() {
  return process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true' || process.env.MAINTENANCE_MODE === 'true';
}
