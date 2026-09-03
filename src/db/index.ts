import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export type Database = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
  db: Database | undefined;
};

let isEnsuredAdmin = false;
async function ensureDefaultAdmin(database: Database) {
  if (isEnsuredAdmin) return;
  isEnsuredAdmin = true;
  try {
    const existingOrg = await database.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.name, 'โรงพยาบาลท่าสองยาง'),
    });
    if (!existingOrg) {
      await database.insert(schema.organizations).values({
        id: 'org-main',
        name: 'โรงพยาบาลท่าสองยาง',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const existingAdmin = await database.query.users.findFirst({
      where: (u, { eq, or }) => or(eq(u.username, 'sys_admin'), eq(u.employeeCode, 'EMP-SYSADMIN-001'), eq(u.username, 'admin')),
    });
    if (!existingAdmin) {
      await database.insert(schema.users).values({
        id: 'usr-admin',
        employeeCode: 'EMP-SYSADMIN-001',
        username: 'sys_admin',
        nationalId: '1234567890123',
        password: 'admin1234',
        firstName: 'ผู้ดูแลระบบ',
        lastName: '(System Admin)',
        organization: 'โรงพยาบาลท่าสองยาง',
        department: 'ศูนย์คอมพิวเตอร์ / เทคโนโลยีสารสนเทศ',
        position: 'ผู้ดูแลระบบสารสนเทศ',
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('✅ Auto-seeded default admin account (username: admin / password: admin1234)');
    }
  } catch {
    isEnsuredAdmin = false;
  }
}

export function getDb(): Database | null {
  if (globalForDb.db) return globalForDb.db;

  const rawDbUrl = process.env.DATABASE_URL;
  if (!rawDbUrl) {
    return null;
  }
  const dbUrl = rawDbUrl.replace(/^["']|["']$/g, '').trim();

  try {
    if (!globalForDb.pool) {
      globalForDb.pool = mysql.createPool({
        uri: dbUrl,
        connectionLimit: 10,
        waitForConnections: true,
        queueLimit: 0,
      });
    }
    globalForDb.db = drizzle({ client: globalForDb.pool, schema, mode: 'default' });
    ensureDefaultAdmin(globalForDb.db);
    return globalForDb.db;
  } catch (error) {
    console.warn('MySQL connection warning:', error);
    return null;
  }
}

export const db = new Proxy({} as Database, {
  get(_target, prop) {
    const instance = getDb();
    if (!instance) return undefined;
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
