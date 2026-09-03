/**
 * Telegram Bot API Notification Utility
 * Sends rich formatted HTML booking cards to Telegram groups or channels
 */

export interface TelegramBookingData {
  userName: string;
  userPhone?: string;
  organizationName: string;
  departmentName?: string;
  dateStr: string;
  packageName: string;
  packageCode: string;
  totalPrice: number;
  pricingModeLabel: string;
  selectedItems?: string[];
  preparationGuide?: string;
  notes?: string;
  userTelegramToken?: string;
  userTelegramChatId?: string;
}

export async function sendTelegramBookingNotificationCard(
  data: TelegramBookingData,
  customBotToken?: string,
  customChatId?: string
): Promise<{ success: boolean; error?: string }> {
  // Priority: 1. Custom passed args -> 2. Personal Telegram config from hr_person -> 3. Environment variables fallback
  const botToken = (customBotToken || data.userTelegramToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (customChatId || data.userTelegramChatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing for user:', data.userName);
    return {
      success: false,
      error: `ไม่พบ Telegram Token/Channel ในข้อมูลเจ้าหน้าที่ (hr_person) ของคุณ ${data.userName} หรือในระบบ`,
    };
  }

  const itemsFormatted =
    data.selectedItems && data.selectedItems.length > 0
      ? data.selectedItems.map((item) => `  • ${item}`).join('\n')
      : '  • รายการตรวจมาตรฐานครบชุด';

  const priceText =
    data.totalPrice > 0 ? `฿${data.totalPrice.toLocaleString()} บาท` : 'ฟรี 100% (สิทธิสวัสดิการ)';

  const textMessage = `
🏥 <b>ใบบันทึกการจองตรวจสุขภาพประจำปี</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>ผู้ขอจอง:</b> ${escapeHtml(data.userName)}
🏢 <b>สังกัด/หน่วยงาน:</b> ${escapeHtml(data.organizationName)}${data.departmentName ? ` (${escapeHtml(data.departmentName)})` : ''}
📞 <b>เบอร์ติดต่อ:</b> ${escapeHtml(data.userPhone || 'ไม่ระบุ')}

📅 <b>วันที่นัดตรวจ:</b> <code>${escapeHtml(data.dateStr)}</code>
📦 <b>แพ็กเกจตรวจ:</b> <b>${escapeHtml(data.packageCode)}</b> - ${escapeHtml(data.packageName)}
💰 <b>ค่าบริการสุทธิ:</b> ${escapeHtml(priceText)} [${escapeHtml(data.pricingModeLabel)}]

🔬 <b>รายการตรวจที่เลือก:</b>
${escapeHtml(itemsFormatted)}
━━━━━━━━━━━━━━━━━━━━━
✅ <b>สถานะ:</b> ยืนยันการจองเรียบร้อยแล้ว
⏱ <i>เวลาบันทึก: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.</i>
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.ok) {
      console.error('Telegram API error:', result);
      return {
        success: false,
        error: result.description || 'เกิดข้อผิดพลาดในการส่งข้อความ Telegram',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้',
    };
  }
}

export async function sendTelegramCancellationNotificationCard(
  data: {
    userName: string;
    userPhone?: string;
    organizationName: string;
    departmentName?: string;
    dateStr: string;
    packageCode?: string;
    packageName?: string;
    queueNumber?: string;
    userTelegramToken?: string;
    userTelegramChatId?: string;
  },
  customBotToken?: string,
  customChatId?: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = (customBotToken || data.userTelegramToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (customChatId || data.userTelegramChatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing for cancellation:', data.userName);
    return {
      success: false,
      error: `ไม่พบ Telegram Token/Channel ในระบบสำหรับ ${data.userName}`,
    };
  }

  const textMessage = `
❌ <b>แจ้งยกเลิกการจองคิวตรวจสุขภาพประจำปี</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>ผู้ขอจอง:</b> ${escapeHtml(data.userName)}
🏢 <b>สังกัด/หน่วยงาน:</b> ${escapeHtml(data.organizationName)}${data.departmentName ? ` (${escapeHtml(data.departmentName)})` : ''}
📞 <b>เบอร์ติดต่อ:</b> ${escapeHtml(data.userPhone || 'ไม่ระบุ')}

📅 <b>วันที่ยกเลิกคิว:</b> <code>${escapeHtml(data.dateStr)}</code>
${data.queueNumber ? `🔢 <b>หมายเลขคิว:</b> <code>${escapeHtml(data.queueNumber)}</code>\n` : ''}${data.packageCode ? `📦 <b>แพ็กเกจตรวจ:</b> <b>${escapeHtml(data.packageCode)}</b> ${data.packageName ? `- ${escapeHtml(data.packageName)}` : ''}\n` : ''}━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>สถานะ:</b> ยกเลิกการจองเรียบร้อยแล้ว (คืนโควต้าสล็อตแล้ว)
⏱ <i>เวลาบันทึก: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.</i>
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.ok) {
      console.error('Telegram Cancellation API error:', result);
      return {
        success: false,
        error: result.description || 'เกิดข้อผิดพลาดในการส่งข้อความ Telegram',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send Telegram cancellation message:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้',
    };
  }
}

export async function sendTelegramRescheduleNotificationCard(
  data: {
    userName: string;
    userPhone?: string;
    organizationName: string;
    departmentName?: string;
    oldDateStr?: string;
    newDateStr: string;
    packageName: string;
    packageCode: string;
    queueNumber?: string;
    totalPrice: number;
    pricingModeLabel: string;
    selectedItems?: string[];
    userTelegramToken?: string;
    userTelegramChatId?: string;
  },
  customBotToken?: string,
  customChatId?: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = (customBotToken || data.userTelegramToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (customChatId || data.userTelegramChatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing for reschedule:', data.userName);
    return {
      success: false,
      error: `ไม่พบ Telegram Token/Channel ในระบบสำหรับ ${data.userName}`,
    };
  }

  const itemsFormatted =
    data.selectedItems && data.selectedItems.length > 0
      ? data.selectedItems.map((item) => `  • ${item}`).join('\n')
      : '  • รายการตรวจมาตรฐานครบชุด';

  const priceText =
    data.totalPrice > 0 ? `฿${data.totalPrice.toLocaleString()} บาท` : 'ฟรี 100% (สิทธิสวัสดิการ)';

  const textMessage = `
🔄 <b>แจ้งย้ายวันตรวจสุขภาพประจำปี (อัปเดตวันตรวจใหม่)</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>ผู้ขอจอง:</b> ${escapeHtml(data.userName)}
🏢 <b>สังกัด/หน่วยงาน:</b> ${escapeHtml(data.organizationName)}${data.departmentName ? ` (${escapeHtml(data.departmentName)})` : ''}
📞 <b>เบอร์ติดต่อ:</b> ${escapeHtml(data.userPhone || 'ไม่ระบุ')}

${data.oldDateStr ? `📅 <b>วันนัดเดิม:</b> <s>${escapeHtml(data.oldDateStr)}</s>\n` : ''}🆕 <b>วันนัดตรวจใหม่:</b> <code>${escapeHtml(data.newDateStr)}</code>
${data.queueNumber ? `🔢 <b>หมายเลขคิวใหม่:</b> <code>${escapeHtml(data.queueNumber)}</code>\n` : ''}📦 <b>แพ็กเกจตรวจ:</b> <b>${escapeHtml(data.packageCode)}</b> - ${escapeHtml(data.packageName)}
💰 <b>ค่าบริการสุทธิ:</b> ${escapeHtml(priceText)} [${escapeHtml(data.pricingModeLabel)}]

🔬 <b>รายการตรวจที่เลือก:</b>
${escapeHtml(itemsFormatted)}
━━━━━━━━━━━━━━━━━━━━━
🔄 <b>สถานะ:</b> เปลี่ยนแปลงวันนัดตรวจสุขภาพเรียบร้อยแล้ว
⏱ <i>เวลาบันทึก: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.</i>
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.ok) {
      console.error('Telegram Reschedule API error:', result);
      return {
        success: false,
        error: result.description || 'เกิดข้อผิดพลาดในการส่งข้อความ Telegram',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send Telegram reschedule message:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้',
    };
  }
}

export interface TelegramReminderData {
  userName: string;
  userPhone?: string;
  organizationName: string;
  departmentName?: string;
  dateStr: string;
  timeSlotStr: string;
  queueNumber?: string;
  packageName: string;
  packageCode: string;
  totalPrice: number;
  pricingModeLabel: string;
  selectedItems?: string[];
  preparationGuide?: string;
  notes?: string;
  userTelegramToken?: string;
  userTelegramChatId?: string;
}

export async function sendTelegram1DayReminderNotificationCard(
  data: TelegramReminderData,
  customBotToken?: string,
  customChatId?: string
): Promise<{ success: boolean; error?: string }> {
  const botToken = (customBotToken || data.userTelegramToken || process.env.TELEGRAM_BOT_TOKEN || '').trim();
  const chatId = (customChatId || data.userTelegramChatId || process.env.TELEGRAM_CHAT_ID || '').trim();

  if (!botToken || !chatId) {
    console.warn('Telegram Bot Token or Chat ID is missing for user:', data.userName);
    return {
      success: false,
      error: `ไม่พบ Telegram Token/Chat ID ในข้อมูลเจ้าหน้าที่ (hr_person) ของคุณ ${data.userName} หรือในระบบ`,
    };
  }

  const itemsFormatted =
    data.selectedItems && data.selectedItems.length > 0
      ? data.selectedItems.map((item) => `  • ${item}`).join('\n')
      : '  • รายการตรวจมาตรฐานครบชุด';

  const guideText = data.preparationGuide
    ? escapeHtml(data.preparationGuide)
    : '<b>กรุณาเตรียมความพร้อมก่อนเข้ารับการตรวจสุขภาพประจำปี</b>';

  const textMessage = `
🔔 <b>แจ้งเตือนนัดหมายตรวจสุขภาพประจำปี (พรุ่งนี้!)</b>
🏥 <b>โรงพยาบาลท่าสองยาง</b>
━━━━━━━━━━━━━━━━━━━━━
🎫 <b>หมายเลขคิว:</b> <code>${escapeHtml(data.queueNumber || 'N/A')}</code>
👤 <b>ผู้เข้ารับการตรวจ:</b> ${escapeHtml(data.userName)}
🏢 <b>สังกัด/หน่วยงาน:</b> ${escapeHtml(data.organizationName)}${data.departmentName ? ` (${escapeHtml(data.departmentName)})` : ''}

📅 <b>วันที่นัดตรวจ:</b> <code>${escapeHtml(data.dateStr)}</code>
⏰ <b>เวลานัดหมาย:</b> ${escapeHtml(data.timeSlotStr)}
📦 <b>แพ็กเกจตรวจ:</b> <b>${escapeHtml(data.packageCode)}</b> - ${escapeHtml(data.packageName)}

🔬 <b>รายการตรวจที่เลือก:</b>
${escapeHtml(itemsFormatted)}
━━━━━━━━━━━━━━━━━━━━━
🚨 <b>คำแนะนำการเตรียมตัวก่อนตรวจ:</b>
${guideText}

⏱ <i>ส่งจากระบบแจ้งเตือนอัตโนมัติ: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })} น.</i>
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: textMessage,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.ok) {
      console.error('Telegram Reminder API error:', result);
      return {
        success: false,
        error: result.description || 'เกิดข้อผิดพลาดในการส่งข้อความ Telegram',
      };
    }

    return { success: true };
  } catch (err) {
    console.error('Failed to send Telegram reminder message:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'ไม่สามารถเชื่อมต่อกับ Telegram API ได้',
    };
  }
}

/** Helper to escape HTML special characters for Telegram HTML parse_mode */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
