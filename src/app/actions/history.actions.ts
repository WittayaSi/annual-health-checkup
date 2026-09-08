'use server';

import { store } from '@/lib/store';
import { getActiveUserAction } from './user.actions';
import { syncUserHisHealthCheckupData } from '@/lib/his-sync';
import { revalidatePath } from 'next/cache';
import { formatErrorMessage } from './common';
import { HealthCheckupRecord } from '@/lib/types';

/**
 * Fetch personal health checkup history (all years) for active user or specified user
 */
export async function getUserHealthHistoryAction(targetUserId?: string): Promise<{
  success: boolean;
  user?: any;
  records: HealthCheckupRecord[];
  error?: string;
}> {
  try {
    const activeUser = await getActiveUserAction();
    const userId = targetUserId || activeUser?.id;

    if (!userId) {
      return { success: false, records: [], error: 'ยังไม่ได้เข้าสู่ระบบ' };
    }

    const user = await store.getUserById(userId);
    if (!user) {
      return { success: false, records: [], error: 'ไม่พบข้อมูลบุคลากร' };
    }

    const records = await store.getUserHealthHistory(userId);
    return { success: true, user, records };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการดึงประวัติผลตรวจสุขภาพ');
    return { success: false, records: [], error: message };
  }
}

/**
 * Manually trigger HIS synchronization (match HN via National ID + pull HIS checkup records)
 */
export async function syncUserHisDataAction(targetUserId?: string) {
  try {
    const activeUser = await getActiveUserAction();
    const userId = targetUserId || activeUser?.id;

    if (!userId) {
      return { success: false, error: 'ยังไม่ได้เข้าสู่ระบบ' };
    }

    const user = await store.getUserById(userId);
    if (!user) {
      return { success: false, error: 'ไม่พบข้อมูลบุคลากร' };
    }

    const res = await syncUserHisHealthCheckupData(user);

    revalidatePath('/history');
    revalidatePath('/admin');
    return res;
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการซิงก์ข้อมูลจาก HIS');
    return { success: false, error: message };
  }
}
