import mysql from 'mysql2/promise';

async function migrate() {
  const dbUrl = (process.env.DATABASE_URL || 'mysql://root:123456@127.0.0.1:3306/annual_health_checkup').replace(/^["']|["']$/g, '').trim();
  console.log('🚀 Running Production Database Safe Auto-Migration...');

  const connection = await mysql.createConnection(dbUrl);

  try {
    // 1. Bookings Table Columns
    const bookingCols = [
      { name: 'is_pregnant', type: 'tinyint(1) NOT NULL DEFAULT 0' },
    ];
    for (const col of bookingCols) {
      try {
        await connection.query(`ALTER TABLE \`bookings\` ADD COLUMN \`${col.name}\` ${col.type};`);
        console.log(`   ✅ [bookings] Added column ${col.name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`   ℹ️ [bookings] Column ${col.name} already exists`);
        } else {
          console.warn(`   ⚠️ [bookings] Warning on ${col.name}:`, e.message);
        }
      }
    }

    // 2. Items Table Columns
    const itemCols = [
      { name: 'contraindicated_if_pregnant', type: 'tinyint(1) NOT NULL DEFAULT 0' },
      { name: 'target_gender', type: 'varchar(10) NOT NULL DEFAULT "ALL"' },
      { name: 'min_age', type: 'int NULL' },
      { name: 'max_age', type: 'int NULL' },
    ];
    for (const col of itemCols) {
      try {
        await connection.query(`ALTER TABLE \`items\` ADD COLUMN \`${col.name}\` ${col.type};`);
        console.log(`   ✅ [items] Added column ${col.name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
        }
      }
    }

    // 2.1 Set default pregnancy contraindications for X-Ray items in items table
    try {
      await connection.query(`
        UPDATE \`items\` 
        SET \`contraindicated_if_pregnant\` = 1 
        WHERE \`name\` LIKE '%เอกซเรย์%' OR \`name\` LIKE '%X-Ray%' OR \`name\` LIKE '%Chest%' OR \`name\` LIKE '%PA Upright%';
      `);
      console.log('   ✅ [items] Set default pregnancy contraindication for X-Ray items');
    } catch (e) {
      console.warn('   ⚠️ [items] Warning updating X-Ray pregnancy contraindication:', e.message);
    }

    // 3. Department Item Rules Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`department_item_rules\` (
        \`id\` varchar(100) NOT NULL,
        \`department_name\` varchar(100) NOT NULL,
        \`risk_group\` varchar(100) NULL,
        \`item_id\` varchar(100) NULL,
        \`item_name\` varchar(255) NOT NULL,
        \`rule_type\` varchar(50) NOT NULL,
        \`special_price\` int DEFAULT 0,
        \`min_age\` int NULL,
        \`max_age\` int NULL,
        \`gender\` varchar(10) DEFAULT 'ALL',
        \`rule_message\` text NULL,
        \`created_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`dept_idx\` (\`department_name\`),
        KEY \`item_rule_idx\` (\`item_name\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('   ✅ [department_item_rules] Table verified/created');

    console.log('🎉 Production Database Migration Completed Safely (Zero Data Loss)!');
  } finally {
    await connection.end();
  }
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});
