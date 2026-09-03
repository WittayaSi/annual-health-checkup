import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

export type Database = MySql2Database<typeof schema>;

const globalForDb = globalThis as unknown as {
  pool: mysql.Pool | undefined;
  db: Database | undefined;
};

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
