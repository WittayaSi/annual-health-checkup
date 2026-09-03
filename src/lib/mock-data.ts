import { User, Campaign, DailySlot, CheckupPackage, TimeSlot } from './types';

export const INITIAL_PACKAGES: CheckupPackage[] = [
  {
    id: 'pkg-a',
    code: 'PKG-A',
    name: 'โปรแกรม A: ตรวจสุขภาพมาตรฐาน (Standard Checkup)',
    targetGroup: 'บุคลากรทั่วไปและผู้เข้ารับการตรวจสุขภาพทุกท่าน',
    description: 'เน้นการตรวจดักกรองสุขภาพทั่วไป ระบบเลือด เบาหวาน การทำงานของไต เอกซเรย์ปอด และดรรชนีมวลกาย',
    minAge: 0,
    upgradePrice: 0,
    labTests: [
      'ตรวจความสมบูรณ์ของเม็ดเลือด (CBC - Complete Blood Count)',
      'ตรวจระดับน้ำตาลในเลือด (Blood sugar / FBS)',
      'ตรวจการทำงานของไต (BUN - Blood Urea Nitrogen)',
      'ตรวจการทำงานของไต (Creatinine)',
      'ตรวจปัสสาวะสมบูรณ์แบบ (Urine Analysis)',
      'เอกซเรย์ปอดและหัวใจ (Chest PA Upright)',
      'ตรวจร่างกายและประเมินโดยแพทย์ (Physical Examination)',
    ],
    items: [
      { name: 'ตรวจความสมบูรณ์ของเม็ดเลือด (CBC - Complete Blood Count)', price: 0 },
      { name: 'ตรวจระดับน้ำตาลในเลือด (Blood sugar / FBS)', price: 0 },
      { name: 'ตรวจการทำงานของไต (BUN - Blood Urea Nitrogen)', price: 0 },
      { name: 'ตรวจการทำงานของไต (Creatinine)', price: 0 },
      { name: 'ตรวจปัสสาวะสมบูรณ์แบบ (Urine Analysis)', price: 0 },
      { name: 'เอกซเรย์ปอดและหัวใจ (Chest PA Upright)', price: 0 },
      { name: 'ตรวจร่างกายและประเมินโดยแพทย์ (Physical Examination)', price: 0 },
    ],
  },
  {
    id: 'pkg-b',
    code: 'PKG-B',
    name: 'โปรแกรม B: ตรวจสุขภาพครอบคลุมเชิงลึก (Comprehensive Checkup)',
    targetGroup: 'ฟรีสวัสดิการสำหรับอายุ 35 ปีขึ้นไป (อายุน้อยกว่า 35 ปี เลือกคำนวณส่วนเกินตามรายการที่เลือก)',
    description: 'เพิ่มรายการตรวจไขมันในเลือด ตรวจการทำงานของตับ กรดยูริกเกาต์ และตรวจคลื่นไฟฟ้าหัวใจ (EKG 12-Leads)',
    minAge: 35,
    upgradePrice: 0,
    labTests: [
      'ตรวจความสมบูรณ์ของเม็ดเลือด (CBC - Complete Blood Count)',
      'ตรวจระดับน้ำตาลในเลือด (Blood sugar / FBS)',
      'ตรวจค่าน้ำตาลสะสม (HbA1c)',
      'ตรวจการทำงานของไต (BUN - Blood Urea Nitrogen)',
      'ตรวจการทำงานของไต (Creatinine)',
      'ตรวจการทำงานของตับ (AST - Aspartate Aminotransferase)',
      'ตรวจการทำงานของตับ (ALT - Alanine Aminotransferase)',
      'ตรวจการทำงานของตับ (ALP - Alkaline Phosphatase)',
      'ตรวจระดับคอเลสเตอรอลรวม (Cholesterol total)',
      'ตรวจระดับไตรกลีเซอไรด์ (Triglyceride)',
      'ตรวจระดับไขมันดี (HDL - High Density Lipoprotein)',
      'ตรวจระดับไขมันไม่ดี (LDL - Low Density Lipoprotein)',
      'ตรวจระดับกรดยูริก (Uric acid - โรคเกาต์)',
      'ตรวจปัสสาวะสมบูรณ์แบบ (Urine Analysis)',
      'เอกซเรย์ปอดและหัวใจ (Chest PA Upright)',
      'ตรวจคลื่นไฟฟ้าหัวใจ (EKG 12-Leads)',
      'ตรวจร่างกายและประเมินโดยแพทย์ (Physical Examination)',
    ],
    items: [
      { name: 'ตรวจความสมบูรณ์ของเม็ดเลือด (CBC - Complete Blood Count)', price: 0 },
      { name: 'ตรวจระดับน้ำตาลในเลือด (Blood sugar / FBS)', price: 0 },
      { name: 'ตรวจค่าน้ำตาลสะสม (HbA1c)', price: 150 },
      { name: 'ตรวจการทำงานของไต (BUN - Blood Urea Nitrogen)', price: 0 },
      { name: 'ตรวจการทำงานของไต (Creatinine)', price: 0 },
      { name: 'ตรวจการทำงานของตับ (AST - Aspartate Aminotransferase)', price: 65 },
      { name: 'ตรวจการทำงานของตับ (ALT - Alanine Aminotransferase)', price: 65 },
      { name: 'ตรวจการทำงานของตับ (ALP - Alkaline Phosphatase)', price: 65 },
      { name: 'ตรวจระดับคอเลสเตอรอลรวม (Cholesterol total)', price: 65 },
      { name: 'ตรวจระดับไตรกลีเซอไรด์ (Triglyceride)', price: 65 },
      { name: 'ตรวจระดับไขมันดี (HDL - High Density Lipoprotein)', price: 65 },
      { name: 'ตรวจระดับไขมันไม่ดี (LDL - Low Density Lipoprotein)', price: 65 },
      { name: 'ตรวจระดับกรดยูริก (Uric acid - โรคเกาต์)', price: 65 },
      { name: 'ตรวจปัสสาวะสมบูรณ์แบบ (Urine Analysis)', price: 0 },
      { name: 'เอกซเรย์ปอดและหัวใจ (Chest PA Upright)', price: 0 },
      { name: 'ตรวจคลื่นไฟฟ้าหัวใจ (EKG 12-Leads)', price: 250 },
      { name: 'ตรวจร่างกายและประเมินโดยแพทย์ (Physical Examination)', price: 0 },
    ],


  },
];


export const INITIAL_ORGANIZATIONS = [
  { id: 'dept-1', name: 'โรงพยาบาลท่าสองยาง' },
  { id: 'dept-2', name: 'สสอ.ท่าสองยาง' },
  { id: 'dept-3', name: 'รพ.สต. ในเขตพื้นที่' },
  { id: 'dept-4', name: 'สถานศึกษา / โรงเรียนในพื้นที่' },
  { id: 'dept-5', name: 'องค์กรปกครองส่วนท้องถิ่น (อบต./เทศบาล)' },
];

export const INITIAL_USERS: User[] = [];

export const INITIAL_CAMPAIGN: Campaign = {
  id: 'cmp-1787808208201',
  name: 'โครงการตรวจสุขภาพประจำปี 2570 (สำหรับเจ้าหน้าที่ รพ.)',
  targetDepartment: 'โรงพยาบาลท่าสองยาง',
  year: 2570,
  startDate: '2026-10-02',
  endDate: '2026-10-21',
  defaultQuota: 45,
  isActive: true,
  announcement:
    'สำหรับเจ้าหน้าที่ ที่ตรวจ ชุดใหญ่ (PKG-B) กรุณางดน้ำและอาหารหลัง 20.00 น.',
};

export function generateInitialTimeSlots(dailySlotId: string, totalQuota: number): TimeSlot[] {
  return [
    { id: `${dailySlotId}-t1`, dailySlotId, startTime: '08:00', endTime: '10:00', quota: totalQuota, bookedCount: 0 },
  ];
}

export function generateInitialSlots(campaignId: string): DailySlot[] {
  const slots: DailySlot[] = [];
  const start = new Date(2026, 7, 1); // Aug 1, 2026
  const end = new Date(2026, 8, 30);  // Sep 30, 2026

  let curr = new Date(start);
  let idCounter = 1;

  while (curr <= end) {
    const year = curr.getFullYear();
    const month = String(curr.getMonth() + 1).padStart(2, '0');
    const day = String(curr.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const dayOfWeek = curr.getDay();

    let isHoliday = false;
    let holidayNote: string | undefined = undefined;

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      isHoliday = true;
      holidayNote = 'วันหยุดเสาร์-อาทิตย์';
    }

    if (dateStr === '2026-08-12') {
      isHoliday = true;
      holidayNote = 'วันเฉลิมพระชนมพรรษา สมเด็จพระบรมราชชนนีพันปีหลวง';
    }

    const slotId = `slot-${idCounter++}`;
    const timeSlots = isHoliday ? [] : generateInitialTimeSlots(slotId, 45);

    slots.push({
      id: slotId,
      campaignId,
      date: dateStr,
      quota: isHoliday ? 0 : 45,
      bookedCount: 0,
      isHoliday,
      holidayNote,
      timeSlots,
    });

    curr.setDate(curr.getDate() + 1);
  }

  return slots;
}

export const INITIAL_SLOTS = generateInitialSlots(INITIAL_CAMPAIGN.id);

export const INITIAL_BOOKINGS: any[] = [];
export const INITIAL_AUDIT_LOGS: any[] = [];
export const CENTRAL_HOSPITAL_STAFF_DB: User[] = [];
