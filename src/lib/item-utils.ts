import { DepartmentItemRule } from './types';

export function resolveItemPrice(name: string, price: number = 0): number {
  if (typeof price === 'number' && price > 0) return price;
  const n = (name || '').toLowerCase();
  if (n.includes('hba1c') || n.includes('น้ำตาลสะสม')) return 150;
  if (n.includes('ตับ') || n.includes('ast') || n.includes('alt') || n.includes('alp') || n.includes('sgot') || n.includes('sgpt')) return 65;
  if (n.includes('ไขมัน') || n.includes('cholesterol') || n.includes('triglyceride') || n.includes('hdl') || n.includes('ldl') || n.includes('lipid')) return 65;

  if (n.includes('ยูริก') || n.includes('uric') || n.includes('เกาต์')) return 65;
  if (n.includes('ekg') || n.includes('หัวใจ')) return 250;
  if (n.includes('เอกซเรย์') || n.includes('x-ray') || n.includes('chest') || n.includes('pa upright')) return 180;

  return 0;
}


export function detectGender(_firstName: string = '', rawSex: any = ''): 'MALE' | 'FEMALE' {
  const sexStr = String(rawSex || '').toUpperCase().trim();
  if (sexStr === '2' || sexStr === 'F' || sexStr === 'FEMALE' || sexStr.includes('หญิง')) {
    return 'FEMALE';
  }
  if (sexStr === '1' || sexStr === 'M' || sexStr === 'MALE' || sexStr.includes('ชาย')) {
    return 'MALE';
  }

  return 'MALE';
}

export function isInternalStaffUser(user?: { organization?: string; department?: string } | null): boolean {
  if (!user) return true;
  const org = (user.organization || '').toLowerCase().trim();
  const dept = (user.department || '').toLowerCase().trim();

  if (!org && !dept) return true;

  const internalKeywords = ['โรงพยาบาล', 'รพ.', 'สสอ.', 'สาธารณสุข', 'hos'];
  const isOrgInternal = internalKeywords.some((k) => org.includes(k));
  const isDeptInternal = internalKeywords.some((k) => dept.includes(k));

  return isOrgInternal || isDeptInternal;
}

export interface DepartmentItemRuleResult {
  isMandatory: boolean;        // บังคับตรวจสำหรับแผนกนี้
  isFree: boolean;             // ตรวจฟรี (0 บาท)
  isHidden: boolean;           // ซ่อนไม่ให้แสดง (สำหรับแผนกอื่นที่ไม่เกี่ยวข้อง)
  specialPrice?: number | null;
  ruleMessage?: string;        // ข้อความกำกับสิทธิ์
}

/**
 * Evaluate department-specific rules for specialized test items:
 * Priority 1: Dynamic rules configured in database (`dbRules`)
 * Priority 2: Intelligent default fallback rules (Stool Exam & Methamphetamine Test)
 */
export function getDepartmentItemRule(
  itemName: string,
  departmentStr: string = '',
  dbRules?: DepartmentItemRule[]
): DepartmentItemRuleResult {
  const name = (itemName || '').toLowerCase().trim();
  const dept = (departmentStr || '').toLowerCase().trim();

  // 1. Evaluate Dynamic DB Rules if available
  // Priority: Specific department match > "ALL" wildcard match
  if (Array.isArray(dbRules) && dbRules.length > 0) {
    let specificMatch: DepartmentItemRule | undefined;
    let allMatch: DepartmentItemRule | undefined;

    for (const r of dbRules) {
      const rItemName = (r.itemName || '').toLowerCase().trim();
      const rDeptName = (r.departmentName || '').toLowerCase().trim();

      const isItemMatch = rItemName === name || name.includes(rItemName) || rItemName.includes(name);
      if (!isItemMatch) continue;

      // Check if this is a specific department match
      if (rDeptName !== 'all' && dept && (dept === rDeptName || dept.includes(rDeptName) || rDeptName.includes(dept))) {
        specificMatch = r;
        break; // Specific match found — highest priority, stop searching
      }

      // Check if this is an "ALL" wildcard match (fallback)
      if (rDeptName === 'all' && !allMatch) {
        allMatch = r;
      }
    }

    const matchedRule = specificMatch || allMatch;

    if (matchedRule) {
      if (matchedRule.ruleType === 'MANDATORY_FREE') {
        return {
          isMandatory: true,
          isFree: true,
          isHidden: false,
          ruleMessage: matchedRule.ruleMessage || `บังคับตรวจประจำ${matchedRule.departmentName} (ฟรีสวัสดิการ)`,
        };
      }
      if (matchedRule.ruleType === 'OPTIONAL_FREE') {
        return {
          isMandatory: false,
          isFree: true,
          isHidden: false,
          ruleMessage: matchedRule.ruleMessage || 'สิทธิ์ตรวจฟรี (เลือกตรวจตามสมัครใจ)',
        };
      }
      if (matchedRule.ruleType === 'SPECIAL_PRICE') {
        return {
          isMandatory: false,
          isFree: false,
          isHidden: false,
          specialPrice: matchedRule.specialPrice,
          ruleMessage: matchedRule.ruleMessage || `ราคาพิเศษ ฿${matchedRule.specialPrice ?? 0}`,
        };
      }
      if (matchedRule.ruleType === 'HIDDEN') {
        return {
          isMandatory: false,
          isFree: false,
          isHidden: true,
          ruleMessage: matchedRule.ruleMessage || 'ไม่ปรับใช้กับแผนกนี้',
        };
      }
    }
  }

  // 2. No DB rule matched → return neutral defaults (no auto-select, no hide)
  // All department-specific rules must be configured by Admin via "กติกาเฉพาะแผนก" UI
  return {
    isMandatory: false,
    isFree: false,
    isHidden: false,
  };
}

/** Calculate exact completed age (อายุบริบูรณ์) from DOB string (YYYY-MM-DD) as of target date (defaults to today) */
export function calculateAge(dob?: string | null, targetDate: Date = new Date()): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return 0;

  const target = targetDate || new Date();
  let age = target.getFullYear() - birth.getFullYear();
  const monthDiff = target.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/** Format age into detailed Years, Months, Days string (e.g. "34 ปี 9 เดือน 5 วัน") as of target date (defaults to today) */
export function formatDetailedAge(dob?: string | null, targetDate: Date = new Date()): string {
  if (!dob) return '-';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '-';

  const target = targetDate || new Date();
  let years = target.getFullYear() - birth.getFullYear();
  let months = target.getMonth() - birth.getMonth();
  let days = target.getDate() - birth.getDate();

  if (days < 0) {
    const prevMonthLastDay = new Date(target.getFullYear(), target.getMonth(), 0).getDate();
    days += prevMonthLastDay;
    months--;
  }

  if (months < 0) {
    months += 12;
    years--;
  }

  if (months === 0 && days === 0) {
    return `${years} ปี`;
  }

  return `${years} ปี ${months} เดือน ${days} วัน`;
}

const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const THAI_DAYS_OF_WEEK = [
  'อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'
];

/**
 * Format YYYY-MM-DD date string to Thai format e.g. "2 ตุลาคม 2569" or "วันศุกร์ที่ 2 ต.ค. 2569"
 */
export function formatThaiDate(
  dateStr?: string | null,
  mode: 'full' | 'short' | 'with-day' = 'full'
): string {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).split('T')[0].trim();
  const parts = cleanStr.split('-');
  if (parts.length < 3) return dateStr;

  const yearNum = Number(parts[0]);
  const monthNum = Number(parts[1]);
  const dayNum = Number(parts[2]);

  if (isNaN(yearNum) || isNaN(monthNum) || isNaN(dayNum) || monthNum < 1 || monthNum > 12) {
    return dateStr;
  }

  const thaiYear = yearNum + 543;
  const monthName = mode === 'short' ? THAI_MONTHS_SHORT[monthNum - 1] : THAI_MONTHS_FULL[monthNum - 1];

  if (mode === 'with-day') {
    const dObj = new Date(yearNum, monthNum - 1, dayNum);
    const dayOfWeekName = THAI_DAYS_OF_WEEK[dObj.getDay()];
    return `วัน${dayOfWeekName}ที่ ${dayNum} ${THAI_MONTHS_SHORT[monthNum - 1]} ${thaiYear}`;
  }

  return `${dayNum} ${monthName} ${thaiYear}`;
}



