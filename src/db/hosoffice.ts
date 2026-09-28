import mysql from 'mysql2/promise';

export async function getHosOfficeConnection() {
  const dbUrl = process.env.HOSOFFICE_DATABASE_URL || process.env.HOSOFFICE_DB_URL;
  if (dbUrl) {
    const connection = await mysql.createConnection({
      uri: dbUrl.replace(/^["']|["']$/g, '').trim(),
      connectTimeout: 5000,
    });
    return connection;
  }

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
  preName?: string;
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

    // 1. Dynamic Prefix Lookup Map from hr_prefix table
    const prefixMap = new Map<string, string>();
    try {
      const [prefixRows] = await conn.query<any[]>('SELECT * FROM hr_prefix');
      if (Array.isArray(prefixRows)) {
        for (const px of prefixRows) {
          const pId = px.HR_PREFIX_ID ?? px.HR_PRFIX_ID ?? px.hr_prefix_id ?? px.hr_prfix_id ?? px.PREFIX_ID ?? px.ID ?? px.id;
          const pName = px.HR_PREFIX_NAME ?? px.HR_PRFIX_NAME ?? px.HR_PREFIX_DESC ?? px.HR_PRFIX_DESC ?? px.PREFIX_NAME ?? px.PREFIX_DESC ?? px.NAME ?? px.name;
          if (pId !== undefined && pId !== null && pName) {
            prefixMap.set(String(pId).trim(), String(pName).trim());
          }
        }
      }
    } catch (e) {
      console.warn('Note: Could not query hr_prefix table directly:', e);
    }

    // 2. Query hr_person table joined with hr_prefix, hr_department, hr_department_sub, and hr_position in HOSOffice
    let rows: any[] = [];
    try {
      const [result] = await conn.query<any[]>(`
        SELECT 
          p.HR_CID AS nationalId,
          COALESCE(p.HR_USERNAME, p.HR_CID, CONCAT('usr-', p.ID)) AS username,
          CONCAT('EMP-', p.ID) AS employeeCode,
          COALESCE(px.HR_PREFIX_NAME, px.HR_PRFIX_NAME, px.HR_PREFIX_DESC, px.HR_PRFIX_DESC, px.PREFIX_NAME, px.NAME, '') AS prefixName,
          p.HR_PREFIX_ID AS hrPrefixId1,
          p.HR_PRFIX_ID AS hrPrefixId2,
          p.HR_FNAME AS rawFirstName,
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
        LEFT JOIN hr_prefix px ON (p.HR_PREFIX_ID = px.HR_PREFIX_ID OR p.HR_PRFIX_ID = px.HR_PRFIX_ID OR p.HR_PRFIX_ID = px.HR_PREFIX_ID OR p.HR_PREFIX_ID = px.HR_PRFIX_ID)
        LEFT JOIN hr_department d ON p.HR_DEPARTMENT_ID = d.HR_DEPARTMENT_ID
        LEFT JOIN hr_department_sub ds ON p.HR_DEPARTMENT_SUB_ID = ds.HR_DEPARTMENT_SUB_ID
        LEFT JOIN hr_position pos ON p.HR_POSITION_ID = pos.HR_POSITION_ID
        LIMIT 1000
      `);
      rows = result;
    } catch {
      const [result] = await conn.query<any[]>(`
        SELECT 
          p.*,
          p.HR_CID AS nationalId,
          COALESCE(p.HR_USERNAME, p.HR_CID, CONCAT('usr-', p.ID)) AS username,
          CONCAT('EMP-', p.ID) AS employeeCode,
          p.HR_FNAME AS rawFirstName,
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
      rows = result;
    }

    await conn.end();

    return rows.map((r) => {
      const statusId = String(r.hrStatusId || '01').trim();
      const isActive = statusId === '01';
      
      const rawPrefixId = r.hrPrefixId1 ?? r.hrPrefixId2 ?? r.HR_PREFIX_ID ?? r.HR_PRFIX_ID ?? r.hr_prefix_id ?? r.hr_prfix_id;
      let mappedPrefix = rawPrefixId !== undefined && rawPrefixId !== null ? prefixMap.get(String(rawPrefixId).trim()) : undefined;

      const preName = (mappedPrefix || String(r.prefixName || '').trim()) || undefined;
      const firstName = String(r.rawFirstName || r.firstName || 'ไม่ระบุชื่อ').trim();
      const resolvedGender = detectGender(firstName, r.sexRaw || r.gender);

      return {
        employeeCode: String(r.employeeCode || `EMP-${Date.now()}`),
        username: String(r.username || `user-${Date.now()}`),
        nationalId: String(r.nationalId || ''),
        preName,
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
        telegramChatId: r.telegramChatIdRaw ? String(r.telegramChatIdRaw).trim() : undefined,
      };
    });

  } catch (error: any) {
    const targetHost = process.env.HOSOFFICE_DATABASE_URL || process.env.HOSOFFICE_DB_URL || `${process.env.HOSOFFICE_DB_HOST || 'localhost'}:${process.env.HOSOFFICE_DB_PORT || 3306}`;
    console.error(`Error fetching staff from HOSOffice DB (${targetHost}):`, error);
    throw new Error(`ไม่สามารถเชื่อมต่อ HOSOffice DB (${targetHost}) ได้: ${error.message || String(error)}`);
  }
}
