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
