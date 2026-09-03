export type UserRole = 'ADMIN' | 'SUPER_STAFF' | 'STAFF';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'ATTENDED';

export type Gender = 'MALE' | 'FEMALE';

export type PricingMode = 'FREE' | 'UPGRADE' | 'FULL_PAY' | 'FLAT_RATE';

export interface OrganizationEntitlement {
  id: string;
  organizationName: string;
  packageId: string;
  minAge?: number | null;
  maxAge?: number | null;
  isFree: boolean;
  flatPrice?: number | null;
  packageName?: string; // joined field
  packageCode?: string; // joined field
}

export interface Organization {
  id: string;
  name: string;
  userCount?: number;
  createdAt?: string;
}

export interface User {
  id: string;
  employeeCode: string;
  username?: string;    // Username ที่ใช้ในระบบของ รพ. (เช่น somchai.j, siriporn.w)
  nationalId?: string; // เลขบัตรประชาชน (Masked)
  firstName: string;
  lastName: string;
  gender?: Gender;
  dob?: string;        // YYYY-MM-DD
  organization?: string; // สังกัดองค์กรหลัก (เช่น "โรงพยาบาลท่าสองยาง", "สสอ.ท่าสองยาง", "สถานศึกษา / โรงเรียนในพื้นที่")
  department: string;    // หน่วยงานย่อย/แผนกภายในองค์กร (เช่น "กลุ่มงานพยาบาล", "ฝ่ายบริหาร")
  position?: string;
  phone?: string;
  riskGroup?: string;  // เช่น สัมผัสสารเคมี, รังสี, งานบริหารทั่วไป
  role: UserRole;
  hisSyncId?: string;  // ID อ้างอิงในระบบ HOSxP/HIS
  lineUserId?: string; // LINE User ID สำหรับ 1-Click Auto Login
  lineDisplayName?: string; // ชื่อที่แสดงใน LINE Profile
  linePictureUrl?: string;  // รูปโปรไฟล์ LINE
  isLineLinked?: boolean;   // สถานะผูกบัญชี LINE
  telegramToken?: string;   // Telegram Bot Token ส่วนตัวของเจ้าหน้าที่ (จาก hr_person)
  telegramChatId?: string;  // Telegram Channel/Chat ID ส่วนตัวของเจ้าหน้าที่ (จาก hr_person)
  password?: string;        // รหัสผ่านจากระบบ HR / HosOffice
  startworkDate?: string;   // วันที่เริ่มบรรจุ/เข้าทำงาน (YYYY-MM-DD)
  isActive?: boolean;       // สถานะการใช้งาน (true = ใช้งานปกติ, false = พ้นสภาพ/ไม่ใช้งานแล้ว)

  lastSyncedAt?: string;   // เวลาซิงก์ข้อมูลล่าสุดจากฐานกลาง รพ.
}

export interface TestItem {
  id?: string;
  name: string;      // ชื่อรายการตรวจ
  price: number;     // ราคา (บาท)
  category?: string; // หมวดหมู่ เช่น ตรวจเลือด, ตรวจปัสสาวะ, เอกซเรย์, ตรวจหัวใจ
}

export type MasterItem = TestItem;

export interface CheckupPackage {
  id: string;
  code: string;
  name: string;
  targetGroup: string; // เช่น บุคลากรอายุน้อยกว่า 35 ปี
  description: string;
  labTests: string[];  // รายการตรวจ เช่น CBC, Sugar, Lipid, Chest X-Ray
  preparationGuide?: string; // คำแนะนำการเตรียมตัวก่อนตรวจ (เช่น งดน้ำ/งดอาหาร)
  items?: TestItem[]; // รายการตรวจย่อยพร้อมราคาแต่ละรายการ
  minAge?: number;     // เกณฑ์อายุขั้นต่ำสำหรับสวัสดิการฟรี (เช่น 35 ปี)
  upgradePrice?: number; // ค่าใช้จ่ายส่วนต่างสำหรับผู้ที่อายุไม่ถึง 35 ปี แล้วเลือกอัปเกรด (เช่น 500 บาท)
  price?: number;      // ราคาเหมาจ่ายสำหรับหน่วยงานภายนอก/ประชาชนทั่วไป (เช่น 500 หรือ 1200 บาท)
}

export interface TimeSlot {
  id: string;
  dailySlotId: string;
  startTime: string; // เช่น "07:30"
  endTime: string;   // เช่น "08:30"
  quota: number;
  bookedCount: number;
}

export interface Campaign {
  id: string;
  name: string;
  organization?: string;     // สังกัดองค์กรเป้าหมาย (เช่น "โรงพยาบาลท่าสองยาง", "สสอ.ท่าสองยาง", หรือ "ทั้งหมด")
  department?: string;       // Aliased department field
  targetDepartment?: string; // Aliased targetDepartment field
  year: number;
  startDate: string;
  endDate: string;
  defaultQuota: number;
  openDaysOfWeek?: string;
  advanceBookingDays?: number;
  eligibleStartworkCutoffDate?: string; // YYYY-MM-DD
  isActive: boolean;
  announcement?: string;
}

export interface DailySlot {
  id: string;
  campaignId: string;
  date: string; // YYYY-MM-DD
  quota: number;
  bookedCount: number;
  isHoliday: boolean;
  holidayNote?: string;
  timeSlots?: TimeSlot[];
}

export interface DepartmentQuota {
  departmentName: string;
  date: string;
  maxQuota: number;
  bookedCount: number;
}

export interface Booking {
  id: string;
  userId: string;
  campaignId: string;
  dailySlotId: string;
  timeSlotId?: string;
  packageId?: string;
  entitlementPackageId?: string | null; // Package ที่ได้ฟรีตามสิทธิ์
  queueNumber?: string;
  status: BookingStatus;
  pricingMode?: PricingMode;
  totalPrice?: number;
  flatRatePrice?: number | null;
  notes?: string;
  reminderSent?: boolean;
  reminderLastAttemptAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingItem {
  id: string;
  bookingId: string;
  itemId?: string | null;
  itemName: string;
  price: number;              // ราคามาตรฐาน
  chargedPrice: number;       // ราคาที่คิดจริง (0 = ฟรี)
  isCoveredByEntitlement: boolean; // อยู่ในสิทธิ์ฟรีหรือไม่
}

export interface BookingWithDetails extends Booking {
  user?: User;
  dailySlot?: DailySlot;
  timeSlot?: TimeSlot;
  package?: CheckupPackage;
  campaign?: Campaign;
  items?: BookingItem[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action:
    | 'CREATE_BOOKING'
    | 'CANCEL_BOOKING'
    | 'RESCHEDULE_BOOKING'
    | 'UPDATE_SLOT'
    | 'HIS_SYNC'
    | 'LINE_BIND'
    | 'LINE_UNBIND'
    | 'CREATE_CAMPAIGN'
    | 'UPDATE_CAMPAIGN'
    | 'DELETE_CAMPAIGN'
    | 'CREATE_ORGANIZATION'
    | 'UPDATE_ORGANIZATION'
    | 'DELETE_ORGANIZATION'
    | 'CREATE_PACKAGE'
    | 'UPDATE_PACKAGE'
    | 'DELETE_PACKAGE'
    | 'IMPORT_USERS';
  details: string;
}
