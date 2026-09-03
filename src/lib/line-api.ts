'use server';

export interface BookingFlexDetails {
  queueNumber: string;
  userName: string;
  organizationName: string;
  dateStr: string;
  timeSlotStr: string;
  packageName: string;
}

/**
 * Send real LINE Flex Message Push Notification via Messaging API
 */
export async function sendLineFlexNotification(
  lineUserId: string,
  details: BookingFlexDetails
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN is not configured in .env.local');
    return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN missing' };
  }

  if (!lineUserId) {
    return { success: false, error: 'Target lineUserId is missing' };
  }

  const flexContents = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#00B900',
      contents: [
        {
          type: 'text',
          text: 'โรงพยาบาลท่าสองยาง',
          color: '#FFFFFF',
          size: 'xs',
          weight: 'bold',
        },
        {
          type: 'text',
          text: 'ยืนยันคิวจองตรวจสุขภาพ',
          color: '#FFFFFF',
          size: 'lg',
          weight: 'bold',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#F4FBF4',
          cornerRadius: 'md',
          paddingAll: 'md',
          contents: [
            {
              type: 'text',
              text: 'หมายเลขคิวของคุณ',
              size: 'xs',
              color: '#888888',
            },
            {
              type: 'text',
              text: details.queueNumber,
              size: '3xl',
              weight: 'bold',
              color: '#00B900',
              margin: 'xs',
            },
          ],
        },
        {
          type: 'separator',
          margin: 'lg',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'ชื่อ-สกุล:', size: 'xs', color: '#888888', flex: 2 },
                { type: 'text', text: details.userName, size: 'xs', color: '#333333', flex: 5, weight: 'bold' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'สังกัด:', size: 'xs', color: '#888888', flex: 2 },
                { type: 'text', text: details.organizationName, size: 'xs', color: '#333333', flex: 5 },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'วันนัดตรวจ:', size: 'xs', color: '#888888', flex: 2 },
                { type: 'text', text: details.dateStr, size: 'xs', color: '#00B900', flex: 5, weight: 'bold' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'ช่วงเวลา:', size: 'xs', color: '#888888', flex: 2 },
                { type: 'text', text: details.timeSlotStr, size: 'xs', color: '#333333', flex: 5 },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'โปรแกรม:', size: 'xs', color: '#888888', flex: 2 },
                { type: 'text', text: details.packageName, size: 'xs', color: '#333333', flex: 5 },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '⚠️ ข้อปฏิบัติ: กรุณางดน้ำและอาหารหลัง 20:00 น. ก่อนวันตรวจ',
          size: 'xxs',
          color: '#D97706',
          wrap: true,
          align: 'center',
        },
      ],
    },
  };

  const payload = {
    to: lineUserId,
    messages: [
      {
        type: 'flex',
        altText: `ยืนยันคิวจองตรวจสุขภาพ หมายเลขคิว ${details.queueNumber}`,
        contents: flexContents,
      },
    ],
  };

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('LINE Messaging API Error:', res.status, errorText);
      return { success: false, error: `LINE API responded ${res.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to call LINE Messaging API';
    console.error('LINE Push Error:', error);
    return { success: false, error: msg };
  }
}

/**
 * Send 1-Day Before Checkup Reminder Flex Message via LINE Messaging API
 */
export async function sendLine1DayReminderFlexNotification(
  lineUserId: string,
  details: BookingFlexDetails
): Promise<{ success: boolean; error?: string }> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN is not configured in .env.local');
    return { success: false, error: 'LINE_CHANNEL_ACCESS_TOKEN missing' };
  }

  if (!lineUserId) {
    return { success: false, error: 'Target lineUserId is missing' };
  }

  const flexContents = {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#D97706', // Amber-600 warning accent
      contents: [
        {
          type: 'text',
          text: 'โรงพยาบาลท่าสองยาง',
          color: '#FFFFFF',
          size: 'xs',
          weight: 'bold',
        },
        {
          type: 'text',
          text: '🔔 เตือนนัดตรวจสุขภาพ (พรุ่งนี้!)',
          color: '#FFFFFF',
          size: 'lg',
          weight: 'bold',
          margin: 'xs',
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'box',
          layout: 'vertical',
          backgroundColor: '#FFFBEB',
          cornerRadius: 'lg',
          paddingAll: 'md',
          contents: [
            {
              type: 'text',
              text: 'หมายเลขคิวของคุณ',
              size: 'xs',
              color: '#B45309',
              align: 'center',
            },
            {
              type: 'text',
              text: details.queueNumber || 'N/A',
              size: '3xl',
              weight: 'bold',
              color: '#D97706',
              align: 'center',
              margin: 'xs',
            },
          ],
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: [
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'ชื่อผู้รับตรวจ:', color: '#888888', size: 'xs', flex: 2 },
                { type: 'text', text: details.userName, color: '#111111', size: 'xs', flex: 4, weight: 'bold' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'วันที่ตรวจ:', color: '#888888', size: 'xs', flex: 2 },
                { type: 'text', text: details.dateStr, color: '#D97706', size: 'xs', flex: 4, weight: 'bold' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'เวลา:', color: '#888888', size: 'xs', flex: 2 },
                { type: 'text', text: details.timeSlotStr, color: '#111111', size: 'xs', flex: 4, weight: 'bold' },
              ],
            },
            {
              type: 'box',
              layout: 'baseline',
              contents: [
                { type: 'text', text: 'โปรแกรม:', color: '#888888', size: 'xs', flex: 2 },
                { type: 'text', text: details.packageName, color: '#111111', size: 'xs', flex: 4, weight: 'bold' },
              ],
            },
          ],
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      backgroundColor: '#FEF3C7',
      contents: [
        {
          type: 'text',
          text: '🚨 คำแนะนำสำคัญก่อนตรวจ:',
          size: 'xs',
          color: '#92400E',
          weight: 'bold',
          align: 'center',
        },
        {
          type: 'text',
          text: 'กรุณางดน้ำและอาหารทุกชนิด หลังเวลา 20:00 น. คืนนี้ (สามารถจิบน้ำสะอาดได้เล็กน้อย)',
          size: 'xxs',
          color: '#B45309',
          wrap: true,
          align: 'center',
          margin: 'xs',
        },
      ],
    },
  };

  const payload = {
    to: lineUserId,
    messages: [
      {
        type: 'flex',
        altText: `🔔 เตือนนัดตรวจสุขภาพพรุ่งนี้ คิวที่ ${details.queueNumber}`,
        contents: flexContents,
      },
    ],
  };

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('LINE Messaging API Error:', res.status, errorText);
      return { success: false, error: `LINE API responded ${res.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to call LINE Messaging API';
    console.error('LINE Push Error:', error);
    return { success: false, error: msg };
  }
}
