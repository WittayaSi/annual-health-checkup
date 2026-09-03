import mysql from 'mysql2/promise';

export async function getHosOfficeConnection() {
  const host = process.env.HOSOFFICE_DB_HOST || 'localhost';
  const port = Number(process.env.HOSOFFICE_DB_PORT || 3306);
  const user = process.env.HOSOFFICE_DB_USER || 'root';
  const password = process.env.HOSOFFICE_DB_PASS || '';
  const database = process.env.HOSOFFICE_DB_NAME || 'hosoffice';

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 5000,
  });

  return connection;
}

import { detectGender } from '@/lib/item-utils';

export interface HosOfficePersonRow {
  employeeCode: string;
  username: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  dob?: string;
  department: string;
  position: string;
  phone?: string;
  hisSyncId: string;
  hrStatusId: string;
  isActive: boolean;
  password?: string;
  startworkDate?: string;
  telegramToken?: string;
  telegramChatId?: string;
}

/**
 * Fetch staff records from HOSOffice MySQL Database
 */
export async function fetchHosOfficeStaff(): Promise<HosOfficePersonRow[]> {
  try {
    const conn = await getHosOfficeConnection();

    // Query hr_person table joined with hr_department, hr_department_sub, and hr_position in HOSOffice
    const [rows] = await conn.query<any[]>(`
      SELECT 
        p.HR_CID AS nationalId,
        COALESCE(p.HR_USERNAME, p.HR_CID, CONCAT('usr-', p.ID)) AS username,
        CONCAT('EMP-', p.ID) AS employeeCode,
        p.HR_FNAME AS firstName,
        p.HR_LNAME AS lastName,
        p.SEX AS sexRaw,
        IF(p.SEX = '2', 'FEMALE', 'MALE') AS gender,
        DATE_FORMAT(p.HR_BIRTHDAY, '%Y-%m-%d') AS dob,
        COALESCE(ds.HR_DEPARTMENT_SUB_NAME, d.HR_DEPARTMENT_NAME, 'กลุ่มงานทั่วไป') AS department,
        COALESCE(pos.HR_POSITION_NAME, p.POSITION_IN_WORK, 'เจ้าหน้าที่') AS position,
        p.HR_PHONE AS phone,
        CONCAT('HN-', p.ID) AS hisSyncId,
        COALESCE(p.HR_STATUS_ID, '01') AS hrStatusId,
        COALESCE(p.HR_PASSWORD, '') AS passwordRaw,
        DATE_FORMAT(p.HR_STARTWORK_DATE, '%Y-%m-%d') AS startworkDateRaw,
        p.TELEGRAM_BOT_TOKEN AS telegramTokenRaw,
        p.TELEGRAM_CHAT_ID AS telegramChatIdRaw
      FROM hr_person p
      LEFT JOIN hr_department d ON p.HR_DEPARTMENT_ID = d.HR_DEPARTMENT_ID
      LEFT JOIN hr_department_sub ds ON p.HR_DEPARTMENT_SUB_ID = ds.HR_DEPARTMENT_SUB_ID
      LEFT JOIN hr_position pos ON p.HR_POSITION_ID = pos.HR_POSITION_ID
      LIMIT 1000
    `);

    await conn.end();

    return rows.map((r) => {
      const statusId = String(r.hrStatusId || '01').trim();
      const isActive = statusId === '01';
      const firstName = String(r.firstName || 'ไม่ระบุชื่อ');
      const resolvedGender = detectGender(firstName, r.sexRaw || r.gender);

      return {
        employeeCode: String(r.employeeCode || `EMP-${Date.now()}`),
        username: String(r.username || `user-${Date.now()}`),
        nationalId: String(r.nationalId || ''),
        firstName,
        lastName: String(r.lastName || 'ไม่ระบุนามสกุล'),
        gender: resolvedGender,
        dob: r.dob || undefined,
        department: String(r.department || 'กลุ่มงานทั่วไป'),
        position: String(r.position || 'เจ้าหน้าที่'),
        phone: r.phone ? String(r.phone) : undefined,
        hisSyncId: String(r.hisSyncId || `HN-${r.employeeCode}`),
        hrStatusId: statusId,
        isActive,
        password: r.passwordRaw ? String(r.passwordRaw).trim() : undefined,
        startworkDate: r.startworkDateRaw ? String(r.startworkDateRaw).trim() : undefined,
        telegramToken: r.telegramTokenRaw ? String(r.telegramTokenRaw).trim() : undefined,
        telegramChatId: r.telegramChannelRaw
          ? String(r.telegramChannelRaw).trim()
          : r.telegramChatIdRaw
            ? String(r.telegramChatIdRaw).trim()
            : undefined,
      };
    });

  } catch (error) {
    console.error('Error fetching staff from HOSOffice DB:', error);
    throw error;
  }
}
