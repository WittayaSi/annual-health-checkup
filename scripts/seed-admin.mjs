import mysql from 'mysql2/promise';

async function main() {
  const dbUrl = process.env.DATABASE_URL || 'mysql://checkup_user:CheckupPass@2026@127.0.0.1:3308/annual_health_checkup';
  console.log('Connecting to MySQL database...');
  
  const conn = await mysql.createConnection(dbUrl);

  // 1. Ensure master organization 'โรงพยาบาลท่าสองยาง' exists first for foreign key integrity
  const [orgRows] = await conn.query('SELECT * FROM organizations WHERE name = "โรงพยาบาลท่าสองยาง"');
  if (!Array.isArray(orgRows) || orgRows.length === 0) {
    await conn.query(`
      INSERT INTO organizations (id, name, created_at, updated_at) 
      VALUES ('org-main', 'โรงพยาบาลท่าสองยาง', NOW(), NOW())
    `);
    console.log('✅ Master Organization created: โรงพยาบาลท่าสองยาง');
  }

  // 2. Ensure default admin account exists with username: sys_admin
  const [rows] = await conn.query('SELECT * FROM users WHERE username = "sys_admin" OR username = "admin" OR employee_code = "EMP-SYSADMIN-001"');
  
  if (Array.isArray(rows) && rows.length > 0) {
    console.log('ℹ️ Admin account already exists in database.');
  } else {
    await conn.query(`
      INSERT INTO users (
        id, employee_code, username, national_id, password, 
        first_name, last_name, organization, department, position, 
        role, is_active, created_at, updated_at
      ) VALUES (
        'usr-admin', 'EMP-SYSADMIN-001', 'sys_admin', '1234567890123', 'admin1234',
        'ผู้ดูแลระบบ', '(System Admin)', 'โรงพยาบาลท่าสองยาง', 'ศูนย์คอมพิวเตอร์ / เทคโนโลยีสารสนเทศ', 'ผู้ดูแลระบบสารสนเทศ',
        'ADMIN', 1, NOW(), NOW()
      )
    `);
    console.log('✅ Default Admin account created successfully!');
    console.log('   Username: sys_admin');
    console.log('   Password: admin1234');
  }

  await conn.end();
}

main().catch((err) => {
  console.error('❌ Failed to seed admin:', err.message);
  process.exit(1);
});
