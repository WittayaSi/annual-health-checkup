import { User, CheckupPackage } from '../types';

export interface HISStaffRecord {
  employeeCode: string;
  nationalIdMasked: string; // e.g. 1-1002-XXXXX-12-3
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  age: number;
  department: string;
  position: string;
  licenseNumber?: string;   // เลขใบอนุญาตประกอบวิชาชีพ (ถ้ามี)
  hisPatientHn?: string;    // เลข HN ในระบบ HOSxP
  riskLevel: 'STANDARD' | 'RADIATION_EXPOSED' | 'LAB_CHEMICAL_EXPOSED' | 'HIGH_RISK_OPD';
}

export interface HISAdapterInterface {
  getStaffInfo(employeeCode: string): Promise<HISStaffRecord | null>;
  syncStaffList(): Promise<{ syncedCount: number }>;
  recommendCheckupPackage(staff: HISStaffRecord): Promise<string>; // Returns Package Code e.g. "PKG-A" or "PKG-B"
}

export class MockHospitalHISAdapter implements HISAdapterInterface {
  async getStaffInfo(employeeCode: string): Promise<HISStaffRecord | null> {
    // Simulated HOSxP / HIS API Response
    return {
      employeeCode,
      nationalIdMasked: '1-1002-XXXXX-88-1',
      fullName: 'เจ้าหน้าที่ รพ. สมมติ',
      gender: 'MALE',
      age: 38,
      department: 'ศูนย์ตรวจสุขภาพ',
      position: 'นักวิชาการสาธารณสุข',
      hisPatientHn: 'HN-6900124',
      riskLevel: 'STANDARD',
    };
  }

  async syncStaffList(): Promise<{ syncedCount: number }> {
    return { syncedCount: 150 };
  }

  async recommendCheckupPackage(staff: HISStaffRecord): Promise<string> {
    if (staff.age >= 35 || staff.riskLevel !== 'STANDARD') {
      return 'PKG-B'; // โปรแกรมตรวจละเอียด (ผู้มีอายุ 35 ปีขึ้นไป หรือสัมผัสความเสี่ยง)
    }
    return 'PKG-A'; // โปรแกรมตรวจมาตรฐาน
  }
}

export const hisAdapter = new MockHospitalHISAdapter();
