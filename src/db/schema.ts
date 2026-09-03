import {
  mysqlTable,
  varchar,
  int,
  boolean,
  date,
  datetime,
  mysqlEnum,
  unique,
  index,
  text,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// --- ENUMS ---
export const roleEnum = mysqlEnum('role', ['ADMIN', 'SUPER_STAFF', 'STAFF']);
export const bookingStatusEnum = mysqlEnum('booking_status', [
  'CONFIRMED',
  'CANCELLED',
  'ATTENDED',
]);
export const genderEnum = mysqlEnum('gender', ['MALE', 'FEMALE']);
export const pricingModeEnum = mysqlEnum('pricing_mode', [
  'FREE',       // ฟรีทั้ง Package ตามสิทธิ์องค์กร
  'UPGRADE',    // ได้ฟรีบางส่วน จ่ายเฉพาะส่วนต่างที่เกินจาก Package สิทธิ์
  'FULL_PAY',   // จ่ายเต็มราคาทุกรายการ
  'FLAT_RATE',  // เหมาจ่ายตามราคาที่กำหนด
]);

// --- TABLES ---

// 0. Organizations Table: ข้อมูลสังกัดองค์กร Master (เช่น โรงพยาบาลท่าสองยาง, สสอ.ท่าสองยาง, โรงเรียนต่างๆ)
export const organizations = mysqlTable('organizations', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
  createdAt: datetime('created_at').default(new Date()).notNull(),
  updatedAt: datetime('updated_at').default(new Date()).notNull(),
});

// 0.1 Organization Entitlements Table: สิทธิ์ Package ตรวจฟรีตามองค์กร + เงื่อนไขอายุ
export const organizationEntitlements = mysqlTable('organization_entitlements', {
  id: varchar('id', { length: 36 }).primaryKey(),
  organizationName: varchar('organization_name', { length: 255 })
    .notNull()
    .references(() => organizations.name, { onDelete: 'cascade', onUpdate: 'cascade' }),
  packageId: varchar('package_id', { length: 36 })
    .notNull()
    .references(() => checkupPackages.id, { onDelete: 'cascade' }),
  minAge: int('min_age'),           // อายุขั้นต่ำที่ได้ฟรี (null = ทุกอายุ)
  maxAge: int('max_age'),           // อายุขั้นสูงที่ได้ฟรี (null = ไม่จำกัด)
  isFree: boolean('is_free').default(false).notNull(), // ได้ฟรีหรือไม่
  flatPrice: int('flat_price'),     // ราคาเหมาจ่าย (ถ้าไม่ฟรี)
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

// 1. Users Table: ข้อมูลบุคลากรโรงพยาบาล
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(),
  employeeCode: varchar('employee_code', { length: 50 }).notNull().unique(),
  username: varchar('username', { length: 50 }).unique(), // Hospital Username
  nationalId: varchar('national_id', { length: 20 }), // เลขบัตรประชาชน
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  gender: genderEnum.default('MALE'),
  dob: date('dob'),
  organization: varchar('organization', { length: 255 })
    .default('โรงพยาบาลท่าสองยาง')
    .references(() => organizations.name, { onDelete: 'set null', onUpdate: 'cascade' }), // อ้างอิงจากตาราง organizations (Master)
  department: varchar('department', { length: 100 }).notNull(), // แผนก/หน่วยงานย่อยภายในองค์กร (เช่น กลุ่มงานพยาบาล, ฝ่ายบริหาร)
  position: varchar('position', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  riskGroup: varchar('risk_group', { length: 100 }),
  role: roleEnum.default('STAFF').notNull(),
  hisSyncId: varchar('his_sync_id', { length: 50 }),
  lineUserId: varchar('line_user_id', { length: 100 }), // LINE User ID
  lineDisplayName: varchar('line_display_name', { length: 100 }), // ชื่อแสดงใน LINE
  linePictureUrl: text('line_picture_url'), // รูปโปรไฟล์ LINE
  isLineLinked: boolean('is_line_linked').default(false).notNull(),
  telegramToken: varchar('telegram_token', { length: 255 }), // Telegram Bot Token ส่วนตัวของเจ้าหน้าที่ (จาก hr_person)
  telegramChatId: varchar('telegram_chat_id', { length: 100 }), // Telegram Channel/Chat ID ส่วนตัวของเจ้าหน้าที่ (จาก hr_person)
  password: varchar('password', { length: 255 }), // รหัสผ่านจากระบบ HR / HosOffice
  startworkDate: date('startwork_date'), // วันที่เริ่มเข้าทำงาน (YYYY-MM-DD)
  isActive: boolean('is_active').default(true).notNull(),

  lastSyncedAt: datetime('last_synced_at'),
  createdAt: datetime('created_at').default(new Date()).notNull(),
  updatedAt: datetime('updated_at').default(new Date()).notNull(),
});

// 2. Packages Table: โปรแกรมตรวจสุขภาพประจำปี
export const checkupPackages = mysqlTable('packages', {
  id: varchar('id', { length: 36 }).primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(), // เช่น PKG-A
  name: varchar('name', { length: 255 }).notNull(),
  targetGroup: varchar('target_group', { length: 255 }).notNull(),
  description: text('description').notNull(),
  labTestsJson: text('lab_tests_json').notNull(), // JSON Array ของรายการเจาะเลือด/เอกซเรย์
  preparationGuide: text('preparation_guide'), // คำแนะนำการเตรียมตัวก่อนตรวจ
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

// 2.1 Items Master Catalog Table: ตารางหลักเก็บรายการตรวจสุขภาพย่อยของโรงพยาบาล (Master Catalog)
export const items = mysqlTable('items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  price: int('price').default(0).notNull(), // ราคามาตรฐาน (บาท)
  category: varchar('category', { length: 100 }), // เช่น ตรวจเลือด, ตรวจปัสสาวะ, เอกซเรย์
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

// 2.2 Package Items Junction Table: ตารางเชื่อมโยง Package กับ Items
export const packageItems = mysqlTable('package_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  packageId: varchar('package_id', { length: 36 })
    .notNull()
    .references(() => checkupPackages.id, { onDelete: 'cascade' }),
  itemId: varchar('item_id', { length: 36 })
    .notNull()
    .references(() => items.id, { onDelete: 'cascade' }),
  customPrice: int('custom_price'), // ราคาพิเศษเฉพาะ Package (ถ้ามี)
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

// 3. Campaigns Table: รอบการตรวจสุขภาพประจำปี
export const campaigns = mysqlTable('campaigns', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  organization: varchar('organization', { length: 255 }).default('ทั้งหมด'), // สังกัดองค์กรเป้าหมาย
  department: varchar('department', { length: 255 }).default('ทั้งหมด'), // Aliased department column
  targetDepartment: varchar('target_department', { length: 255 }).default('ทั้งหมด'), // Aliased target_department column
  year: int('year').notNull(),
  startDate: date('start_date', { mode: 'string' }).notNull(),
  endDate: date('end_date', { mode: 'string' }).notNull(),
  defaultQuota: int('default_quota').default(45).notNull(),
  openDaysOfWeek: varchar('open_days_of_week', { length: 50 }).default('1,2,3,4,5'), // เช่น "1,2,3,4,5" หรือ "1,3,5"
  advanceBookingDays: int('advance_booking_days').default(2).notNull(), // ต้องจองล่วงหน้าอย่างน้อยกี่วัน (default: 2 วัน)
  eligibleStartworkCutoffDate: date('eligible_startwork_cutoff_date', { mode: 'string' }), // วันที่เริ่มบรรจุ/เข้าทำงานวันสุดท้ายที่มีสิทธิ์ (เช่น "2026-04-01")
  isActive: boolean('is_active').default(false).notNull(),
  announcement: text('announcement'),
  createdAt: datetime('created_at').default(new Date()).notNull(),
  updatedAt: datetime('updated_at').default(new Date()).notNull(),
});

// 4. Daily Slots Table: สล็อตประจำวัน (FOREIGN KEY -> campaigns.id)
export const dailySlots = mysqlTable(
  'daily_slots',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    campaignId: varchar('campaign_id', { length: 36 })
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    date: date('date', { mode: 'string' }).notNull(),
    quota: int('quota').notNull(),
    bookedCount: int('booked_count').default(0).notNull(),
    isHoliday: boolean('is_holiday').default(false).notNull(),
    holidayNote: varchar('holiday_note', { length: 255 }),
    createdAt: datetime('created_at').default(new Date()).notNull(),
    updatedAt: datetime('updated_at').default(new Date()).notNull(),
  },
  (table) => ({
    unqCampaignDate: unique('unq_campaign_date').on(table.campaignId, table.date),
    dateIdx: index('date_idx').on(table.date),
  })
);

// 5. Time Slots Table: สล็อตเวลาย่อยประจำวัน (FOREIGN KEY -> daily_slots.id)
export const timeSlots = mysqlTable('time_slots', {
  id: varchar('id', { length: 36 }).primaryKey(),
  dailySlotId: varchar('daily_slot_id', { length: 36 })
    .notNull()
    .references(() => dailySlots.id, { onDelete: 'cascade' }),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  quota: int('quota').default(15).notNull(),
  bookedCount: int('booked_count').default(0).notNull(),
});

// 6. Department Quotas Table: จำกัดโควต้าการลาตรวจสุขภาพต่อวันของแต่ละแผนก
export const departmentQuotas = mysqlTable(
  'department_quotas',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    departmentName: varchar('department_name', { length: 100 }).notNull(),
    date: date('date').notNull(),
    maxQuota: int('max_quota').default(5).notNull(),
    bookedCount: int('booked_count').default(0).notNull(),
  },
  (table) => ({
    unqDeptDate: unique('unq_dept_date').on(table.departmentName, table.date),
  })
);

// 7. Bookings Table: บันทึกการจองคิวตรวจสุขภาพ (FOREIGN KEYS -> users, campaigns, daily_slots, time_slots, packages)
export const bookings = mysqlTable(
  'bookings',
  {
    id: varchar('id', { length: 36 }).primaryKey(),
    userId: varchar('user_id', { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    campaignId: varchar('campaign_id', { length: 36 })
      .notNull()
      .references(() => campaigns.id, { onDelete: 'cascade' }),
    dailySlotId: varchar('daily_slot_id', { length: 36 })
      .notNull()
      .references(() => dailySlots.id, { onDelete: 'cascade' }),
    timeSlotId: varchar('time_slot_id', { length: 36 })
      .references(() => timeSlots.id, { onDelete: 'set null' }),
    packageId: varchar('package_id', { length: 36 })
      .references(() => checkupPackages.id, { onDelete: 'set null' }),
    entitlementPackageId: varchar('entitlement_package_id', { length: 36 })
      .references(() => checkupPackages.id, { onDelete: 'set null' }), // Package ที่ได้ฟรีตามสิทธิ์ (null = ไม่มีสิทธิ์)
    queueNumber: varchar('queue_number', { length: 20 }),
    status: bookingStatusEnum.default('CONFIRMED').notNull(),
    pricingMode: pricingModeEnum.default('FREE'), // รูปแบบการคิดค่าใช้จ่าย
    totalPrice: int('total_price').default(0).notNull(), // ยอดรวมค่าใช้จ่ายที่ต้องจ่ายจริง
    flatRatePrice: int('flat_rate_price'), // ราคาเหมาจ่าย (ถ้าเป็น FLAT_RATE)
    notes: text('notes'),
    reminderSent: boolean('reminder_sent').default(false).notNull(), // สถานะส่งแจ้งเตือนล่วงหน้า 1 วัน
    reminderLastAttemptAt: datetime('reminder_last_attempt_at'), // เวลาพยายามส่งครั้งล่าสุด (เพื่อพยายามส่งซ้ำทุก 1 ชม.)
    createdAt: datetime('created_at').default(new Date()).notNull(),
    updatedAt: datetime('updated_at').default(new Date()).notNull(),
  },
  (table) => ({
    userCampaignIdx: index('user_campaign_idx').on(table.userId, table.campaignId),
  })
);

// 8. Booking Items Table: บันทึกรายการตรวจที่เลือกในแต่ละการจอง
export const bookingItems = mysqlTable('booking_items', {
  id: varchar('id', { length: 36 }).primaryKey(),
  bookingId: varchar('booking_id', { length: 36 })
    .notNull()
    .references(() => bookings.id, { onDelete: 'cascade' }),
  itemId: varchar('item_id', { length: 36 })
    .references(() => items.id, { onDelete: 'set null' }),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  price: int('price').default(0).notNull(),                             // ราคามาตรฐานของรายการ
  chargedPrice: int('charged_price').default(0).notNull(),              // ราคาที่คิดจริง (0 = ฟรีตามสิทธิ์)
  isCoveredByEntitlement: boolean('is_covered_by_entitlement').default(false).notNull(), // รายการนี้อยู่ในสิทธิ์ฟรีหรือไม่
  createdAt: datetime('created_at').default(new Date()).notNull(),
});

// 9. Audit Logs Table: บันทึกประวัติการทำรายการเพื่อการตรวจสอบ
export const auditLogs = mysqlTable('audit_logs', {
  id: varchar('id', { length: 36 }).primaryKey(),
  timestamp: datetime('timestamp').default(new Date()).notNull(),
  actorId: varchar('actor_id', { length: 36 }).notNull(),
  actorName: varchar('actor_name', { length: 100 }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  details: text('details').notNull(),
});

// --- DRIZZLE RELATIONS ---
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  entitlements: many(organizationEntitlements),
}));

export const organizationEntitlementsRelations = relations(organizationEntitlements, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationEntitlements.organizationName],
    references: [organizations.name],
  }),
  package: one(checkupPackages, {
    fields: [organizationEntitlements.packageId],
    references: [checkupPackages.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organizationRef: one(organizations, {
    fields: [users.organization],
    references: [organizations.name],
  }),
  bookings: many(bookings),
}));

export const checkupPackagesRelations = relations(checkupPackages, ({ many }) => ({
  packageItems: many(packageItems),
  bookings: many(bookings),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  packageItems: many(packageItems),
  bookingItems: many(bookingItems),
}));

export const packageItemsRelations = relations(packageItems, ({ one }) => ({
  package: one(checkupPackages, {
    fields: [packageItems.packageId],
    references: [checkupPackages.id],
  }),
  item: one(items, {
    fields: [packageItems.itemId],
    references: [items.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  dailySlots: many(dailySlots),
  bookings: many(bookings),
}));

export const dailySlotsRelations = relations(dailySlots, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [dailySlots.campaignId],
    references: [campaigns.id],
  }),
  timeSlots: many(timeSlots),
  bookings: many(bookings),
}));

export const timeSlotsRelations = relations(timeSlots, ({ one }) => ({
  dailySlot: one(dailySlots, {
    fields: [timeSlots.dailySlotId],
    references: [dailySlots.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  campaign: one(campaigns, {
    fields: [bookings.campaignId],
    references: [campaigns.id],
  }),
  dailySlot: one(dailySlots, {
    fields: [bookings.dailySlotId],
    references: [dailySlots.id],
  }),
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
  package: one(checkupPackages, {
    fields: [bookings.packageId],
    references: [checkupPackages.id],
  }),
  bookingItems: many(bookingItems),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  item: one(items, {
    fields: [bookingItems.itemId],
    references: [items.id],
  }),
}));
