'use server';

import { store } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { User, UserRole } from '@/lib/types';
import { formatErrorMessage } from './common';

/** Session Cookie Expiration: 1 วัน (24 ชั่วโมง = 86,400 วินาที) */
const SESSION_MAX_AGE = 60 * 60 * 24;

export async function getActiveUserAction(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const userIdCookie = cookieStore.get('active_user_id')?.value;
    if (userIdCookie) {
      const user = await store.getUserById(userIdCookie);
      if (user && user.isActive !== false) {
        try {
          cookieStore.set('active_user_id', user.id, {
            path: '/',
            httpOnly: true,
            maxAge: SESSION_MAX_AGE,
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

export async function getAllUsersAction(): Promise<User[]> {
  return await store.getUsers();
}

export async function switchUserAction(userId: string): Promise<User> {
  const user = await store.setActiveUserId(userId);
  try {
    const cookieStore = await cookies();
    cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: SESSION_MAX_AGE });
  } catch (e) {}
  revalidatePath('/');
  revalidatePath('/booking');
  revalidatePath('/admin');
  return user;
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
      cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: SESSION_MAX_AGE });
    } catch (e) {}
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการผูกบัญชี LINE OA');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการยกเลิกผูกบัญชี');
    return { success: false, error: message };
  }
}

export async function loginWithHospitalCredentialsAction(username: string, last4NationalId: string) {
  try {
    const user = await store.loginWithHospitalCredentials(username, last4NationalId);
    try {
      const cookieStore = await cookies();
      cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: SESSION_MAX_AGE });
    } catch (e) {}
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    return { success: false, error: message };
  }
}

export async function loginWithLineAction(lineUserId: string) {
  try {
    const user = await store.loginWithLine(lineUserId);
    try {
      const cookieStore = await cookies();
      cookieStore.set('active_user_id', user.id, { path: '/', httpOnly: true, maxAge: SESSION_MAX_AGE });
    } catch (e) {}
    revalidatePath('/');
    revalidatePath('/booking');
    revalidatePath('/admin');
    return { success: true, user };
  } catch (error: unknown) {
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการล็อกอินด้วย LINE');
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
    const message = formatErrorMessage(error, 'เกิดข้อผิดพลาดในการปรับเปลี่ยนสิทธิ์ผู้ใช้งาน');
    return { success: false, error: message };
  }
}
