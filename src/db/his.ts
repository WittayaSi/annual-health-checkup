import mysql from 'mysql2/promise';

/**
 * Get MySQL connection to Hospital Information System (HIS) Database (e.g. HOSxP, Jhcis, etc.)
 * Configured separately from HosOffice HR Database.
 */
export async function getHisConnection() {
  const dbUrl = process.env.HIS_DATABASE_URL || process.env.HIS_DB_URL;
  if (dbUrl) {
    const connection = await mysql.createConnection({
      uri: dbUrl.replace(/^["']|["']$/g, '').trim(),
      connectTimeout: 5000,
    });
    return connection;
  }

  const host = process.env.HIS_DB_HOST;
  if (!host) {
    return null; // HIS DB is not configured in environment
  }

  const port = Number(process.env.HIS_DB_PORT || 3306);
  const user = process.env.HIS_DB_USER || 'root';
  const password = process.env.HIS_DB_PASS || '';
  const database = process.env.HIS_DB_NAME || 'hosxp';

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

/**
 * Query Hospital Number (HN) from HIS using National ID (CID - เลขบัตรประชาชน)
 */
export async function fetchHisHnByNationalId(nationalId: string): Promise<string | null> {
  const cleanId = (nationalId || '').replace(/\D/g, '');
  if (!cleanId || cleanId.length !== 13) return null;

  try {
    const conn = await getHisConnection();
    if (!conn) return null;

    // Standard HOSxP patient query
    const [rows] = await conn.query<any[]>(
      `SELECT hn FROM patient WHERE cid = ? LIMIT 1`,
      [cleanId]
    );

    await conn.end();

    if (rows && rows.length > 0 && rows[0].hn) {
      return String(rows[0].hn).trim();
    }
    return null;
  } catch (error) {
    console.warn(`[HIS DB Warning] Unable to query HN for CID ${cleanId}:`, error);
    return null;
  }
}
