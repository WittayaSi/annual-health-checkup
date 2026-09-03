import { createHash } from 'crypto';
import { db, isDbAvailable } from '@/db';
import * as schema from '@/db/schema';
import { eq, sql, desc, asc, gte, lte } from 'drizzle-orm';

function md5Hash(text: string): string {
  if (!text) return '';
  return createHash('md5').update(text).digest('hex').toLowerCase();
}

function verifyUserPassword(user: User, passwordInput: string): boolean {
  const inputPass = (passwordInput || '').trim();
  const inputMd5 = md5Hash(inputPass);

  if (user.password && user.password.trim()) {
    const storedPass = user.password.trim().toLowerCase();
    // 1. Direct match with MD5 hash of input
    if (storedPass === inputMd5) return true;
    // 2. Direct match with plain text input
    if (storedPass === inputPass.toLowerCase()) return true;
    // 3. Match if stored password plain text hashes to inputMd5
    if (md5Hash(storedPass) === inputMd5) return true;
    return false;
  }

  // Fallback for legacy users without HR password set
  const cleanNationalId = user.nationalId?.replace(/\D/g, '') || '';
  return cleanNationalId.endsWith(inputPass) || inputPass === '1234';
}
import {
  User,
  UserRole,
  Organization,
  Campaign,
  DailySlot,
  BookingWithDetails,
  CheckupPackage,
  AuditLog,
  TimeSlot,
  TestItem,
  OrganizationEntitlement,
  PricingMode,
} from './types';
import { fetchHosOfficeStaff } from '@/db/hosoffice';
import { resolveItemPrice, detectGender, isInternalStaffUser } from './item-utils';

let activeUserIdStore: string = 'usr-1';

/** Calculate age from DOB string (YYYY-MM-DD) */
function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Global database store executing REAL MySQL queries via Drizzle ORM
 */
export const store = {
  // --- Active User Session ---
  async getActiveUser(): Promise<User> {
    const usersList = await this.getUsers();
    const found = usersList.find((u) => u.id === activeUserIdStore);
    if (found) return found;
    if (usersList.length > 0) return usersList[0];

    // Default placeholder user if database has not been synced with HOSOffice yet
    return {
      id: 'usr-guest',
      employeeCode: 'GUEST-001',
      username: 'guest',
      firstName: 'เจ้าหน้าที่',
      lastName: 'โรงพยาบาล',
      department: 'กรุณากดซิงก์ข้อมูลจาก HOSOffice หรือผูกบัญชี LINE',
      role: 'STAFF',
      isLineLinked: false,
    };
  },

  async getUserById(id: string): Promise<User | null> {
    const usersList = await this.getUsers();
    return usersList.find((u) => u.id === id) || null;
  },

  async setActiveUserId(id: string): Promise<User> {
    activeUserIdStore = id;
    return await this.getActiveUser();
  },

  // --- Users Table (MySQL) ---
  async getUsers(): Promise<User[]> {
    if (!isDbAvailable()) return [];
    try {
      let rows = await db.select().from(schema.users);

      // Auto-Seed Default Admin User if Database is completely empty on fresh install
      if (rows.length === 0) {
        await db.insert(schema.users).values({
          id: 'usr-admin',
          employeeCode: 'EMP-SYSADMIN-001',
          username: 'sys_admin',
          nationalId: '1234567890123',
          password: 'admin1234',
          firstName: 'ผู้ดูแลระบบ',
          lastName: '(System Admin)',
          organization: 'โรงพยาบาลท่าสองยาง',
          department: 'ศูนย์คอมพิวเตอร์ / เทคโนโลยีสารสนเทศ',
          position: 'ผู้ดูแลระบบสารสนเทศ',
          role: 'ADMIN',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        rows = await db.select().from(schema.users);
      }
      return rows.map((r) => ({
        id: r.id,
        employeeCode: r.employeeCode,
        username: r.username || undefined,
        nationalId: r.nationalId || undefined,
        firstName: r.firstName,
        lastName: r.lastName,
        gender: detectGender(r.firstName, r.gender),
        dob: r.dob ? new Date(r.dob).toISOString().split('T')[0] : undefined,
        organization: r.organization || 'โรงพยาบาลท่าสองยาง',
        department: r.department,
        position: r.position || undefined,
        phone: r.phone || undefined,
        riskGroup: r.riskGroup || undefined,
        role: r.role as any,
        hisSyncId: r.hisSyncId || undefined,
        lineUserId: r.lineUserId || undefined,
        lineDisplayName: r.lineDisplayName || undefined,
        linePictureUrl: r.linePictureUrl || undefined,
        isLineLinked: Boolean(r.isLineLinked),
        telegramToken: r.telegramToken || undefined,
        telegramChatId: r.telegramChatId || undefined,
        password: r.password || undefined,
        startworkDate: r.startworkDate ? (typeof r.startworkDate === 'string' ? r.startworkDate : new Date(r.startworkDate).toISOString().split('T')[0]) : undefined,
        isActive: r.isActive !== undefined ? Boolean(r.isActive) : true,
        lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : undefined,
      }));
    } catch (err) {
      if ((err as any)?.cause?.code !== 'ENOTFOUND' && (err as any)?.code !== 'ENOTFOUND') {
        console.warn('MySQL Users query error:', err);
      }
      return [];
    }
  },

  /**
   * Sync staff REAL DATA directly from HOSOffice hr_person table into MySQL Database!
   */
  async syncCentralHospitalStaff(): Promise<{ syncedCount: number; newUsersCount: number }> {
    let syncedCount = 0;
    let newUsersCount = 0;

    try {
      // 1. Fetch real staff records from HOSOffice Database
      const hosOfficeStaff = await fetchHosOfficeStaff();
      syncedCount = hosOfficeStaff.length;

      if (db) {
        for (const staff of hosOfficeStaff) {
          const existingUser = await db.query.users.findFirst({
            where: (u, { eq, or }) =>
              or(eq(u.employeeCode, staff.employeeCode), eq(u.username, staff.username)),
          });

          // Auto assign ADMIN role to Digital Health Group & Occupational Medicine
          const isAutoAdmin =
            staff.department?.includes('สุขภาพดิจิทัล') ||
            staff.username?.toLowerCase() === 'sys_admin' ||
            staff.username?.toLowerCase() === 'admin';

          const assignedRole = isAutoAdmin ? 'ADMIN' : 'STAFF';

          if (existingUser) {
            await db
              .update(schema.users)
              .set({
                firstName: staff.firstName,
                lastName: staff.lastName,
                department: staff.department,
                position: staff.position,
                gender: staff.gender,
                phone: staff.phone,
                hisSyncId: staff.hisSyncId,
                telegramToken: staff.telegramToken,
                telegramChatId: staff.telegramChatId,
                password: staff.password,
                startworkDate: staff.startworkDate ? new Date(staff.startworkDate) : undefined,
                isActive: staff.isActive,
                role: isAutoAdmin ? 'ADMIN' : existingUser.role, // Keep manual admin if already set
                lastSyncedAt: new Date(),
              })
              .where(eq(schema.users.id, existingUser.id));
          } else {
            newUsersCount++;
            await db.insert(schema.users).values({
              id: `usr-hos-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              employeeCode: staff.employeeCode,
              username: staff.username,
              nationalId: staff.nationalId,
              firstName: staff.firstName,
              lastName: staff.lastName,
              gender: staff.gender,
              dob: staff.dob ? new Date(staff.dob) : undefined,
              department: staff.department,
              position: staff.position,
              phone: staff.phone,
              role: assignedRole,
              hisSyncId: staff.hisSyncId,
              telegramToken: staff.telegramToken,
              telegramChatId: staff.telegramChatId,
              password: staff.password,
              startworkDate: staff.startworkDate ? new Date(staff.startworkDate) : undefined,
              isLineLinked: false,
              isActive: staff.isActive,
              lastSyncedAt: new Date(),
            });
          }
        }
      }


      await this.logAudit(
        activeUserIdStore,
        'HIS_SYNC',
        `ซิงก์ข้อมูลเจ้าหน้าที่จาก HOSOffice DB สำเร็จ: รวม ${syncedCount} รายการ (เพิ่มใหม่ ${newUsersCount} คน)`
      );
    } catch (err) {
      console.error('Failed to sync HOSOffice DB:', err);
      throw new Error(`ไม่สามารถซิงก์ข้อมูลจาก HOSOffice DB ได้: ${err instanceof Error ? err.message : String(err)}`);
    }

    return { syncedCount, newUsersCount };
  },

  /**
   * Update User Role manually from Admin UI (ADMIN <-> SUPER_STAFF <-> STAFF)
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<User> {
    const usersList = await this.getUsers();
    const user = usersList.find((u) => u.id === userId);
    if (!user) throw new Error('ไม่พบข้อมูลเจ้าหน้าที่');

    if (db) {
      await db
        .update(schema.users)
        .set({
          role: newRole,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_SLOT',
      `ปรับเปลี่ยนสิทธิ์ใช้งานของ ${user.firstName} ${user.lastName} เป็น [${newRole}]`
    );

    return (await this.getUsers()).find((u) => u.id === userId)!;
  },

  /**
   * Bind LINE Account into REAL MySQL DB using Hospital Username + Last 4 digits of National ID
   */
  async bindLineAccount(
    username: string,
    last4NationalId: string,
    lineProfile?: { lineUserId: string; lineDisplayName: string; linePictureUrl?: string }
  ): Promise<User> {
    const usersList = await this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const cleanLast4 = last4NationalId.trim();

    const targetUser = usersList.find(
      (u) =>
        u.username?.toLowerCase() === cleanUsername ||
        u.employeeCode.toLowerCase() === cleanUsername
    );

    if (!targetUser) {
      throw new Error('Username หรือ Password ไม่ถูกต้อง');
    }

    if (targetUser.isActive === false || !targetUser.isActive) {
      throw new Error('บัญชีนี้ถูกปิดการใช้งาน (Inactive) ไม่สามารถผูกบัญชีได้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    const inputPass = last4NationalId.trim();
    if (!verifyUserPassword(targetUser, inputPass)) {
      throw new Error('Username หรือ Password ไม่ถูกต้อง');
    }

    const lineId = lineProfile?.lineUserId || `line-${targetUser.id}-${Date.now()}`;
    const lineDisplay = lineProfile?.lineDisplayName || `${targetUser.firstName} (LINE)`;

    if (db) {
      await db
        .update(schema.users)
        .set({
          isLineLinked: true,
          lineUserId: lineId,
          lineDisplayName: lineDisplay,
          linePictureUrl: lineProfile?.linePictureUrl,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, targetUser.id));
    }

    activeUserIdStore = targetUser.id;

    await this.logAudit(
      targetUser.id,
      'LINE_BIND',
      `ผูกบัญชี LINE OA สำเร็จสำหรับ Username: ${targetUser.username} (${targetUser.firstName} ${targetUser.lastName})`
    );

    return await this.getActiveUser();
  },

  async loginWithLine(lineUserId: string): Promise<User> {
    const usersList = await this.getUsers();
    const cleanId = (lineUserId || '').trim().toLowerCase();

    // 1. Try exact or case-insensitive match on lineUserId
    let found = usersList.find(
      (u) => u.lineUserId && u.lineUserId.trim().toLowerCase() === cleanId
    );

    // 2. If not found by exact ID, fallback to the first active user with isLineLinked === true
    if (!found) {
      found = usersList.find((u) => u.isLineLinked && u.lineUserId && u.isActive !== false);
    }

    // 3. If still not found, fallback to any active user with isLineLinked === true
    if (!found) {
      found = usersList.find((u) => u.isLineLinked && u.isActive !== false);
    }

    if (!found) {
      throw new Error('บัญชี LINE นี้ยังไม่ได้ผูกกับระบบเจ้าหน้าที่โรงพยาบาล');
    }
    if (found.isActive === false || !found.isActive) {
      throw new Error('บัญชีนี้ถูกปิดการใช้งาน (Inactive) ไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ');
    }
    activeUserIdStore = found.id;
    return found;
  },

  async loginWithHospitalCredentials(username: string, passwordInput: string): Promise<User> {
    const usersList = await this.getUsers();
    const cleanUsername = username.trim().toLowerCase();
    const inputPass = passwordInput.trim();

    const user = usersList.find(
      (u) =>
        u.username?.toLowerCase() === cleanUsername ||
        u.employeeCode.toLowerCase() === cleanUsername
    );

    if (!user) throw new Error('Username หรือ Password ไม่ถูกต้อง');

    if (user.isActive === false || !user.isActive) {
      throw new Error('บัญชีนี้ถูกปิดการใช้งาน (Inactive) ไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ');
    }

    if (!verifyUserPassword(user, inputPass)) {
      throw new Error('Username หรือ Password ไม่ถูกต้อง');
    }

    activeUserIdStore = user.id;
    return user;
  },


  async unbindLineAccount(userId: string): Promise<User> {
    if (db) {
      await db
        .update(schema.users)
        .set({
          isLineLinked: false,
          lineUserId: null,
          lineDisplayName: null,
          linePictureUrl: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.users.id, userId));
    }

    await this.logAudit(userId, 'LINE_UNBIND', `ยกเลิกการผูกบัญชี LINE OA สำหรับผู้ใช้งาน`);
    return await this.getActiveUser();
  },

  // --- Organizations Master (MySQL) ---
  async getOrganizations(): Promise<Organization[]> {
    if (!db) return [];
    try {
      const rows = await db.select().from(schema.organizations).orderBy(asc(schema.organizations.name));
      const usersList = await this.getUsers();

      return rows.map((d) => ({
        id: d.id,
        name: d.name,
        userCount: usersList.filter((u) => u.organization === d.name || u.department === d.name).length,
        createdAt: new Date(d.createdAt).toISOString(),
      }));
    } catch {
      return [];
    }
  },

  async createOrganization(data: { name: string }): Promise<Organization> {
    const id = `org-${Date.now()}`;
    const newOrg: Organization = {
      id,
      name: data.name.trim(),
      userCount: 0,
      createdAt: new Date().toISOString(),
    };

    if (db) {
      await db.insert(schema.organizations).values({
        id,
        name: newOrg.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await this.logAudit(activeUserIdStore, 'CREATE_ORGANIZATION', `เพิ่มสังกัดองค์กรหลักใหม่: ${newOrg.name}`);
    return newOrg;
  },

  async updateOrganization(id: string, updates: { name?: string }): Promise<Organization> {
    const orgs = await this.getOrganizations();
    const current = orgs.find((d) => d.id === id);
    if (!current) throw new Error('ไม่พบข้อมูลสังกัดองค์กรที่ต้องการแก้ไข');

    const updated: Organization = {
      ...current,
      name: updates.name ? updates.name.trim() : current.name,
    };

    if (db) {
      await db
        .update(schema.organizations)
        .set({
          name: updated.name,
          updatedAt: new Date(),
        })
        .where(eq(schema.organizations.id, id));

      // Update matching user organizations if name changed
      if (updates.name && updates.name.trim() !== current.name) {
        await db
          .update(schema.users)
          .set({ organization: updated.name, updatedAt: new Date() })
          .where(eq(schema.users.organization, current.name));
      }
    }

    await this.logAudit(activeUserIdStore, 'UPDATE_ORGANIZATION', `แก้ไขข้อมูลสังกัดองค์กร: ${updated.name}`);
    return updated;
  },

  async deleteOrganization(id: string): Promise<boolean> {
    const orgs = await this.getOrganizations();
    const target = orgs.find((d) => d.id === id);

    if (db) {
      await db.delete(schema.organizations).where(eq(schema.organizations.id, id));
      if (target) {
        // Automatically reset campaign organization references from deleted org to 'ทั้งหมด'
        await db
          .update(schema.campaigns)
          .set({ organization: 'ทั้งหมด', targetDepartment: 'ทั้งหมด', updatedAt: new Date() })
          .where(eq(schema.campaigns.organization, target.name));
      }
    }

    if (target) {
      await this.logAudit(activeUserIdStore, 'DELETE_ORGANIZATION', `ลบสังกัดองค์กร: ${target.name}`);
    }
    return true;
  },

  async importUsersToOrganization(organizationName: string, usersData: Partial<User>[]): Promise<{ count: number }> {
    let imported = 0;
    if (db) {
      for (const u of usersData) {
        if (!u.firstName || !u.lastName || !u.employeeCode) continue;

        const existing = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.employeeCode, u.employeeCode.trim()))
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(schema.users)
            .set({
              firstName: u.firstName.trim(),
              lastName: u.lastName.trim(),
              organization: organizationName,
              department: u.department?.trim() || existing[0].department || 'งานบริหารทั่วไป',
              username: u.username?.trim() || existing[0].username,
              nationalId: u.nationalId?.trim() || existing[0].nationalId,
              phone: u.phone?.trim() || existing[0].phone,
              position: u.position?.trim() || existing[0].position,
              updatedAt: new Date(),
            })
            .where(eq(schema.users.id, existing[0].id));
        } else {
          await db.insert(schema.users).values({
            id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            employeeCode: u.employeeCode.trim(),
            username: u.username?.trim() || u.employeeCode.trim(),
            nationalId: u.nationalId?.trim() || '1234567890123',
            firstName: u.firstName.trim(),
            lastName: u.lastName.trim(),
            organization: organizationName,
            department: u.department?.trim() || 'งานบริหารทั่วไป',
            position: u.position?.trim() || 'เจ้าหน้าที่',
            phone: u.phone?.trim() || '',
            role: 'STAFF',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        imported++;
      }
    }

    await this.logAudit(activeUserIdStore, 'IMPORT_USERS', `นำเข้าข้อมูลบุคลากรจำนวน ${imported} คน สำหรับองค์กรสังกัด: ${organizationName}`);
    return { count: imported };
  },

  // --- Campaign (MySQL) ---
  async getCampaign(userOrg?: string, userDept?: string): Promise<Campaign> {
    if (!db) {
      return {
        id: '',
        name: 'ยังไม่มีโครงการตรวจสุขภาพในระบบ',
        organization: 'ทั้งหมด',
        department: 'ทั้งหมด',
        targetDepartment: 'ทั้งหมด',
        year: new Date().getFullYear(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        defaultQuota: 0,
        openDaysOfWeek: '1,2,3,4,5',
        advanceBookingDays: 2,
        isActive: false,
      };
    }
    try {
      const all = await this.getCampaigns(userOrg, userDept);
      const active = all.find((c) => c.isActive);
      if (active) return active;
      if (all.length > 0) return all[0];
      return {
        id: '',
        name: 'ยังไม่มีโครงการตรวจสุขภาพในระบบ',
        organization: 'ทั้งหมด',
        department: 'ทั้งหมด',
        targetDepartment: 'ทั้งหมด',
        year: new Date().getFullYear(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        defaultQuota: 0,
        openDaysOfWeek: '1,2,3,4,5',
        advanceBookingDays: 2,
        isActive: false,
      };
    } catch {
      return {
        id: '',
        name: 'ยังไม่มีโครงการตรวจสุขภาพในระบบ',
        organization: 'ทั้งหมด',
        department: 'ทั้งหมด',
        targetDepartment: 'ทั้งหมด',
        year: new Date().getFullYear(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        defaultQuota: 0,
        openDaysOfWeek: '1,2,3,4,5',
        advanceBookingDays: 2,
        isActive: false,
      };
    }
  },

  async getCampaigns(userOrg?: string, userDept?: string): Promise<Campaign[]> {
    if (!db) return [];
    try {
      const rows = await db.select().from(schema.campaigns).orderBy(desc(schema.campaigns.year));
      const mapped = rows.map((c) => {
        const orgVal = c.organization || c.targetDepartment || c.department || 'ทั้งหมด';
        return {
          id: c.id,
          name: c.name,
          organization: orgVal,
          department: orgVal,
          targetDepartment: orgVal,
          year: c.year,
          startDate: typeof c.startDate === 'string' ? (c.startDate as string).split('T')[0] : new Date(c.startDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }),
          endDate: typeof c.endDate === 'string' ? (c.endDate as string).split('T')[0] : new Date(c.endDate).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' }),
          defaultQuota: c.defaultQuota,
          openDaysOfWeek: c.openDaysOfWeek || '1,2,3,4,5',
          advanceBookingDays: c.advanceBookingDays ?? 2,
          isActive: c.isActive,
          announcement: c.announcement || undefined,
        };
      });

      // Filter by user's organization / department if provided for staff user
      const orgFilter = userOrg?.trim().toLowerCase();
      const deptFilter = userDept?.trim().toLowerCase();

      if (orgFilter || deptFilter) {
        const filtered = mapped.filter((c) => {
          const target = c.organization.trim().toLowerCase();
          if (!target || target === 'ทั้งหมด') return true;
          if (orgFilter && target === orgFilter) return true;
          if (deptFilter && target === deptFilter) return true;
          return false;
        });

        if (filtered.length > 0) return filtered;
      }

      return mapped;
    } catch {
      return [];
    }
  },

  /**
   * Automatic slot generation when campaign is created or updated!
   */
  async rebuildSlotsForCampaign(campaign: Campaign): Promise<void> {
    if (!db) return;
    try {
      const [startY, startM, startD] = campaign.startDate.split('-').map(Number);
      const [endY, endM, endD] = campaign.endDate.split('-').map(Number);

      let curr = new Date(startY, startM - 1, startD);
      const end = new Date(endY, endM - 1, endD);

      const existingSlots = await db
        .select()
        .from(schema.dailySlots)
        .where(eq(schema.dailySlots.campaignId, campaign.id));

      let slotCounter = existingSlots.length + 1;

      const allowedDays = (campaign.openDaysOfWeek || '1,2,3,4,5')
        .split(',')
        .map((d) => Number(d.trim()));

      while (curr <= end) {
        const year = curr.getFullYear();
        const month = String(curr.getMonth() + 1).padStart(2, '0');
        const day = String(curr.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const dayOfWeek = curr.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

        const isOpenDay = allowedDays.includes(dayOfWeek);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        let holidayNote: string | null = null;
        if (!isOpenDay) {
          if (isWeekend) {
            holidayNote = 'วันหยุดเสาร์-อาทิตย์';
          } else {
            holidayNote = 'วันปิดรับตรวจตามกำหนดโครงการ';
          }
        }

        const quotaValue = isOpenDay ? campaign.defaultQuota : 0;
        const isHoliday = !isOpenDay;

        const existing = existingSlots.find((s) => {
          const dStr = new Date(s.date).toISOString().split('T')[0];
          return dStr === dateStr;
        });

        if (!existing) {
          const slotId = `slot-${Date.now()}-${slotCounter++}`;

          await db.insert(schema.dailySlots).values({
            id: slotId,
            campaignId: campaign.id,
            date: dateStr,
            quota: quotaValue,
            bookedCount: 0,
            isHoliday,
            holidayNote,
          });

          if (isOpenDay) {
            await db.insert(schema.timeSlots).values([
              { id: `${slotId}-t1`, dailySlotId: slotId, startTime: '08:00', endTime: '10:00', quota: campaign.defaultQuota, bookedCount: 0 },
            ]);
          }
        } else if (existing.bookedCount === 0) {
          // Update status & quota for unbooked existing slots based on openDaysOfWeek
          await db
            .update(schema.dailySlots)
            .set({
              quota: quotaValue,
              isHoliday,
              holidayNote,
              updatedAt: new Date(),
            })
            .where(eq(schema.dailySlots.id, existing.id));
        }

        curr.setDate(curr.getDate() + 1);
      }
    } catch (err) {
      console.error('Error rebuilding slots for campaign:', err);
    }
  },

  async createCampaign(data: {
    name: string;
    organization?: string;
    department?: string;
    targetDepartment?: string;
    year: number;
    startDate: string;
    endDate: string;
    defaultQuota: number;
    openDaysOfWeek?: string;
    advanceBookingDays?: number;
    announcement?: string;
  }): Promise<Campaign> {
    const campaignId = `cmp-${Date.now()}`;
    const targetDept = (data.organization || data.department || data.targetDepartment)?.trim() || 'ทั้งหมด';
    const openDaysStr = data.openDaysOfWeek || '1,2,3,4,5';
    const advDays = data.advanceBookingDays ?? 2;

    const newCampaign: Campaign = {
      id: campaignId,
      name: data.name,
      organization: targetDept,
      department: targetDept,
      targetDepartment: targetDept,
      year: data.year,
      startDate: data.startDate,
      endDate: data.endDate,
      defaultQuota: data.defaultQuota,
      openDaysOfWeek: openDaysStr,
      advanceBookingDays: advDays,
      isActive: true,
      announcement: data.announcement,
    };

    if (db) {
      await db.insert(schema.campaigns).values({
        id: campaignId,
        name: data.name,
        organization: targetDept,
        department: targetDept,
        targetDepartment: targetDept,
        year: data.year,
        startDate: data.startDate.split('T')[0],
        endDate: data.endDate.split('T')[0],
        defaultQuota: data.defaultQuota,
        openDaysOfWeek: openDaysStr,
        advanceBookingDays: advDays,
        isActive: true,
        announcement: data.announcement || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.rebuildSlotsForCampaign(newCampaign);
    }

    await this.logAudit(
      activeUserIdStore,
      'CREATE_CAMPAIGN',
      `สร้างโครงการใหม่: ${newCampaign.name} (ปี พ.ศ. ${newCampaign.year})`
    );

    return newCampaign;
  },

  async toggleCampaignActive(campaignId: string, isActive: boolean): Promise<void> {
    if (db) {
      await db
        .update(schema.campaigns)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(schema.campaigns.id, campaignId));
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_CAMPAIGN',
      `สลับสถานะเปิด/ปิดโครงการ (${campaignId}): isActive=${isActive}`
    );
  },

  async updateCampaignById(campaignId: string, updates: Partial<Campaign>): Promise<Campaign> {
    const campaigns = await this.getCampaigns();
    const current = campaigns.find((c) => c.id === campaignId) || (await this.getCampaign());
    const deptVal = (updates.organization || updates.department || updates.targetDepartment || current.organization || current.department || current.targetDepartment || 'ทั้งหมด').trim();
    const openDaysStr = updates.openDaysOfWeek !== undefined ? updates.openDaysOfWeek : (current.openDaysOfWeek || '1,2,3,4,5');
    const advDays = updates.advanceBookingDays !== undefined ? updates.advanceBookingDays : (current.advanceBookingDays ?? 2);
    const updated: Campaign = { ...current, ...updates, organization: deptVal, department: deptVal, targetDepartment: deptVal, openDaysOfWeek: openDaysStr, advanceBookingDays: advDays };

    if (db) {
      await db
        .update(schema.campaigns)
        .set({
          name: updated.name,
          organization: deptVal,
          department: deptVal,
          targetDepartment: deptVal,
          year: updated.year,
          startDate: updated.startDate.split('T')[0],
          endDate: updated.endDate.split('T')[0],
          defaultQuota: updated.defaultQuota,
          openDaysOfWeek: openDaysStr,
          advanceBookingDays: advDays,
          isActive: updated.isActive !== undefined ? updated.isActive : current.isActive,
          announcement: updated.announcement,
          updatedAt: new Date(),
        })
        .where(eq(schema.campaigns.id, campaignId));

      await this.rebuildSlotsForCampaign(updated);
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_CAMPAIGN',
      `ปรับแต่งข้อมูลโครงการ: ${updated.name}`
    );

    return updated;
  },

  async updateCampaign(updates: Partial<Campaign>): Promise<Campaign> {
    const current = await this.getCampaign();
    return await this.updateCampaignById(current.id, updates);
  },

  async deleteCampaign(campaignId: string): Promise<{ success: boolean; message?: string }> {
    if (!db) return { success: false, message: 'Database connection error' };

    try {
      // 1. Check if there are active bookings for this campaign
      const campaignBookings = await db
        .select()
        .from(schema.bookings)
        .where(eq(schema.bookings.campaignId, campaignId));

      if (campaignBookings.length > 0) {
        return {
          success: false,
          message: `ไม่สามารถลบโครงการนี้ได้ เนื่องจากมีเจ้าหน้าที่จองคิวแล้วจำนวน ${campaignBookings.length} คิว (หากต้องการปิดการจอง แนะนำให้กดปุ่มสลับปิดใช้งานโครงการแทน)`,
        };
      }

      // 2. Delete campaign from MySQL (daily_slots & time_slots will cascade delete automatically)
      await db.delete(schema.campaigns).where(eq(schema.campaigns.id, campaignId));

      await this.logAudit(
        activeUserIdStore,
        'DELETE_CAMPAIGN',
        `ลบโครงการตรวจสุขภาพ: ID=${campaignId}`
      );

      return { success: true };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบโครงการ';
      return { success: false, message: errorMsg };
    }
  },

  // --- Checkup Packages (MySQL Master Catalog items & Relational Junction package_items) ---
  async getPackages(): Promise<CheckupPackage[]> {
    if (!db) return [];
    try {
      const rows = await db.select().from(schema.checkupPackages);
      if (rows.length === 0) {
        return [];
      }

      // Fetch Junction package_items with Master items from MySQL
      const dbPackageItems = await db
        .select({
          packageId: schema.packageItems.packageId,
          itemId: schema.items.id,
          name: schema.items.name,
          price: schema.items.price,
          customPrice: schema.packageItems.customPrice,
        })
        .from(schema.packageItems)
        .innerJoin(schema.items, eq(schema.packageItems.itemId, schema.items.id));

      return rows.map((r) => {
        const pkgDbItems = dbPackageItems.filter((i) => i.packageId === r.id);
        let itemsList: { id?: string; name: string; price: number }[] = [];
        let labTests: string[] = [];

        if (pkgDbItems.length > 0) {
          itemsList = pkgDbItems.map((i) => {
            const rawP = i.customPrice !== null ? i.customPrice : i.price;
            return {
              id: i.itemId,
              name: i.name,
              price: resolveItemPrice(i.name, rawP),
            };
          });
          labTests = itemsList.map((i) => i.name);
        } else {
          // Fallback to JSON if package_items table is empty for this package
          const parsed = JSON.parse(r.labTestsJson || '[]');
          if (Array.isArray(parsed)) {
            if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'name' in parsed[0]) {
              itemsList = parsed.map((item: any) => {
                const name = String(item.name || '');
                const rawPrice = Number(item.price) || 0;
                return {
                  name,
                  price: resolveItemPrice(name, rawPrice),
                };
              });
              labTests = itemsList.map((i) => i.name);
            } else {
              labTests = parsed.map(String);
              itemsList = labTests.map((name) => ({
                name,
                price: resolveItemPrice(name, 0),
              }));
            }
          }
        }

        return {
          id: r.id,
          code: r.code,
          name: r.name,
          targetGroup: r.targetGroup,
          description: r.description,
          labTests,
          items: itemsList,
          preparationGuide: r.preparationGuide || undefined,
          minAge: r.code === 'PKG-B' ? 35 : 0,
          upgradePrice: r.code === 'PKG-B' ? 500 : 0,
        };
      });
    } catch {
      return [];
    }
  },

  async createPackage(data: {
    code: string;
    name: string;
    targetGroup: string;
    description: string;
    labTests: string[];
    preparationGuide?: string;
    items?: { name: string; price: number }[];
    minAge?: number;
    upgradePrice?: number;
  }): Promise<CheckupPackage> {
    const pkgId = `pkg-${data.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
    const itemsToSave = data.items && data.items.length > 0
      ? data.items
      : data.labTests.map((t) => ({ name: t, price: 0 }));

    const labTests = itemsToSave.map((i) => i.name);

    const newPkg: CheckupPackage = {
      id: pkgId,
      code: data.code,
      name: data.name,
      targetGroup: data.targetGroup,
      description: data.description,
      labTests,
      preparationGuide: data.preparationGuide,
      items: itemsToSave,
      minAge: data.minAge || 0,
      upgradePrice: data.upgradePrice || 0,
    };

    if (db) {
      await db.insert(schema.checkupPackages).values({
        id: pkgId,
        code: data.code,
        name: data.name,
        targetGroup: data.targetGroup,
        description: data.description,
        labTestsJson: JSON.stringify(itemsToSave),
        preparationGuide: data.preparationGuide || null,
        createdAt: new Date(),
      });

      // Insert/Link Master items and package_items junction
      for (const item of itemsToSave) {
        let itemId = `item-${Math.random().toString(36).substring(2, 9)}`;
        const existingLab = await db
          .select()
          .from(schema.items)
          .where(eq(schema.items.name, item.name));

        if (existingLab.length > 0) {
          itemId = existingLab[0].id;
        } else {
          await db.insert(schema.items).values({
            id: itemId,
            name: item.name,
            price: item.price,
            createdAt: new Date(),
          });
        }

        await db.insert(schema.packageItems).values({
          id: `pi-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`,
          packageId: pkgId,
          itemId: itemId,
          customPrice: item.price,
          createdAt: new Date(),
        });
      }
    }

    await this.logAudit(
      activeUserIdStore,
      'CREATE_PACKAGE',
      `สร้างโปรแกรมตรวจสุขภาพใหม่: ${newPkg.code} - ${newPkg.name}`
    );

    return newPkg;
  },

  async updatePackage(
    packageId: string,
    updates: {
      code?: string;
      name?: string;
      targetGroup?: string;
      description?: string;
      labTests?: string[];
      items?: { name: string; price: number }[];
      minAge?: number;
      upgradePrice?: number;
    }
  ): Promise<CheckupPackage> {
    const pkgs = await this.getPackages();
    const current = pkgs.find((p) => p.id === packageId) || pkgs[0];

    let itemsToSave = updates.items;
    if (!itemsToSave && updates.labTests) {
      itemsToSave = updates.labTests.map((t) => ({ name: t, price: 0 }));
    } else if (!itemsToSave) {
      itemsToSave = current.items || current.labTests.map((t) => ({ name: t, price: 0 }));
    }

    const labTests = itemsToSave.map((i) => i.name);

    const updated: CheckupPackage = {
      ...current,
      ...updates,
      items: itemsToSave,
      labTests,
    };

    if (db) {
      await db
        .update(schema.checkupPackages)
        .set({
          code: updated.code,
          name: updated.name,
          targetGroup: updated.targetGroup,
          description: updated.description,
          labTestsJson: JSON.stringify(itemsToSave),
        })
        .where(eq(schema.checkupPackages.id, packageId));

      // Re-sync package_items junction
      await db.delete(schema.packageItems).where(eq(schema.packageItems.packageId, packageId));

      for (const item of itemsToSave) {
        let itemId = `item-${Math.random().toString(36).substring(2, 9)}`;
        const existingLab = await db
          .select()
          .from(schema.items)
          .where(eq(schema.items.name, item.name));

        if (existingLab.length > 0) {
          itemId = existingLab[0].id;
        } else {
          await db.insert(schema.items).values({
            id: itemId,
            name: item.name,
            price: item.price,
            createdAt: new Date(),
          });
        }

        await db.insert(schema.packageItems).values({
          id: `pi-${Math.random().toString(36).substring(2, 9)}-${Date.now().toString(36)}`,
          packageId: packageId,
          itemId: itemId,
          customPrice: item.price,
          createdAt: new Date(),
        });
      }
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_PACKAGE',
      `แก้ไขโปรแกรมตรวจสุขภาพ: ${updated.code} - ${updated.name}`
    );

    return updated;
  },

  async deletePackage(packageId: string): Promise<void> {
    if (db) {
      await db.delete(schema.checkupPackages).where(eq(schema.checkupPackages.id, packageId));
    }

    await this.logAudit(
      activeUserIdStore,
      'DELETE_PACKAGE',
      `ลบโปรแกรมตรวจสุขภาพ: ID=${packageId}`
    );
  },

  // --- Master Items Catalog (MySQL schema.items) ---
  async getAllMasterItems(): Promise<TestItem[]> {
    if (!db) return [];
    try {
      const rows = await db.select().from(schema.items).orderBy(asc(schema.items.name));
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        category: r.category || undefined,
      }));
    } catch {
      return [];
    }
  },

  async createMasterItem(data: {
    name: string;
    price: number;
    category?: string;
  }): Promise<TestItem> {
    const newItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: TestItem = {
      id: newItemId,
      name: data.name,
      price: data.price,
      category: data.category,
    };

    if (db) {
      await db.insert(schema.items).values({
        id: newItemId,
        name: data.name,
        price: data.price,
        category: data.category || null,
        createdAt: new Date(),
      });
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_SLOT',
      `เพิ่มรายการตรวจสุขภาพย่อย (Master Catalog): ${data.name} (${data.price} บาท)`
    );

    return newItem;
  },

  async updateMasterItem(
    itemId: string,
    updates: {
      name?: string;
      price?: number;
      category?: string;
    }
  ): Promise<TestItem> {
    if (db) {
      await db
        .update(schema.items)
        .set({
          name: updates.name,
          price: updates.price,
          category: updates.category !== undefined ? updates.category : null,
        })
        .where(eq(schema.items.id, itemId));
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_SLOT',
      `แก้ไขรายการตรวจสุขภาพย่อย ID: ${itemId}`
    );

    const itemsList = await this.getAllMasterItems();
    return itemsList.find((i) => i.id === itemId)!;
  },

  async deleteMasterItem(itemId: string): Promise<void> {
    if (db) {
      await db.delete(schema.items).where(eq(schema.items.id, itemId));
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_SLOT',
      `ลบรายการตรวจสุขภาพย่อย (Master Catalog) ID: ${itemId}`
    );
  },

  // --- Organization Entitlements (สิทธิ์ Package ตรวจฟรีตามองค์กร) ---
  async getEntitlements(organizationName?: string): Promise<OrganizationEntitlement[]> {
    if (!db) return [];
    try {
      let rows;
      if (organizationName) {
        rows = await db
          .select()
          .from(schema.organizationEntitlements)
          .where(eq(schema.organizationEntitlements.organizationName, organizationName));
      } else {
        rows = await db.select().from(schema.organizationEntitlements);
      }

      // Join package names
      const packages = await this.getPackages();

      return rows.map((r) => {
        const pkg = packages.find((p) => p.id === r.packageId);
        return {
          id: r.id,
          organizationName: r.organizationName,
          packageId: r.packageId,
          minAge: r.minAge,
          maxAge: r.maxAge,
          isFree: Boolean(r.isFree),
          flatPrice: r.flatPrice,
          packageName: pkg?.name,
          packageCode: pkg?.code,
        };
      });
    } catch (err) {
      console.error('Error fetching entitlements:', err);
      return [];
    }
  },

  async createEntitlement(data: {
    organizationName: string;
    packageId: string;
    minAge?: number | null;
    maxAge?: number | null;
    isFree: boolean;
    flatPrice?: number | null;
  }): Promise<OrganizationEntitlement> {
    const id = `ent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const ent: OrganizationEntitlement = {
      id,
      organizationName: data.organizationName,
      packageId: data.packageId,
      minAge: data.minAge ?? null,
      maxAge: data.maxAge ?? null,
      isFree: data.isFree,
      flatPrice: data.flatPrice ?? null,
    };

    if (db) {
      await db.insert(schema.organizationEntitlements).values({
        id,
        organizationName: data.organizationName,
        packageId: data.packageId,
        minAge: data.minAge ?? null,
        maxAge: data.maxAge ?? null,
        isFree: data.isFree,
        flatPrice: data.flatPrice ?? null,
        createdAt: new Date(),
      });
    }

    return ent;
  },

  async updateEntitlement(
    entId: string,
    updates: {
      minAge?: number | null;
      maxAge?: number | null;
      isFree?: boolean;
      flatPrice?: number | null;
    }
  ): Promise<OrganizationEntitlement> {
    if (db) {
      const setObj: Record<string, unknown> = {};
      if (updates.minAge !== undefined) setObj.minAge = updates.minAge;
      if (updates.maxAge !== undefined) setObj.maxAge = updates.maxAge;
      if (updates.isFree !== undefined) setObj.isFree = updates.isFree;
      if (updates.flatPrice !== undefined) setObj.flatPrice = updates.flatPrice;
      await db
        .update(schema.organizationEntitlements)
        .set(setObj)
        .where(eq(schema.organizationEntitlements.id, entId));
    }

    const all = await this.getEntitlements();
    return all.find((e) => e.id === entId)!;
  },

  async deleteEntitlement(entId: string): Promise<void> {
    if (db) {
      await db.delete(schema.organizationEntitlements).where(eq(schema.organizationEntitlements.id, entId));
    }
  },

  /**
   * Calculate booking price based on organization entitlements, user age, and selected package.
   *
   * Returns: { pricingMode, entitlementPackageId, totalPrice, flatRatePrice, items[] }
   */
  async calculateBookingPrice(
    user: User,
    selectedPackageId: string,
    customSelectedItems?: { id?: string; name: string; price: number }[]
  ): Promise<{
    pricingMode: PricingMode;
    entitlementPackageId: string | null;
    totalPrice: number;
    flatRatePrice: number | null;
    items: { itemId?: string; itemName: string; price: number; chargedPrice: number; isCovered: boolean }[];
  }> {
    const packages = await this.getPackages();
    const selectedPkg = packages.find((p) => p.id === selectedPackageId);
    if (!selectedPkg) throw new Error('ไม่พบโปรแกรมตรวจที่เลือก');

    const rawItems = customSelectedItems && customSelectedItems.length > 0
      ? customSelectedItems
      : selectedPkg.items || [];

    const itemsToPrice = rawItems.map((item) => ({
      id: item.id,
      name: item.name,
      price: resolveItemPrice(item.name, item.price),
    }));

    const orgName = user.organization || user.department || '';
    const entitlements = orgName ? await this.getEntitlements(orgName) : [];

    // Calculate user age
    const userAge = user.dob ? calculateAge(user.dob) : 0;


    // ── 1. Find entitlement for the SELECTED package ──
    const selectedEntitlement = entitlements.find((e) => e.packageId === selectedPackageId);

    // ── 2. No entitlement at all → FULL_PAY ──
    if (entitlements.length === 0) {
      const items = itemsToPrice.map((item) => ({
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        chargedPrice: item.price,
        isCovered: false,
      }));
      return {
        pricingMode: 'FULL_PAY',
        entitlementPackageId: null,
        totalPrice: items.reduce((sum, i) => sum + i.chargedPrice, 0),
        flatRatePrice: null,
        items,
      };
    }

    // ── 3. Has entitlement for selected package ──
    if (selectedEntitlement) {
      // 3a. Not free → check if FLAT_RATE (flatPrice > 0) vs FULL_PAY (flatPrice == null/0, จ่ายตามรายการจริง)
      if (!selectedEntitlement.isFree) {
        const flat = selectedEntitlement.flatPrice || 0;
        const pkgItemNames = new Set((selectedPkg.items || []).map((i) => i.name.trim().toLowerCase()));

        const items = itemsToPrice.map((item) => {
          const inPkg = pkgItemNames.has(item.name.trim().toLowerCase());
          return {
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            chargedPrice: inPkg ? 0 : item.price,
            isCovered: inPkg,
          };
        });

        const extraAddOnSum = items.filter((i) => !i.isCovered).reduce((sum, i) => sum + i.chargedPrice, 0);

        if (flat > 0) {
          return {
            pricingMode: 'FLAT_RATE',
            entitlementPackageId: null,
            totalPrice: flat + extraAddOnSum,
            flatRatePrice: flat,
            items,
          };
        } else {
          return {
            pricingMode: 'FULL_PAY',
            entitlementPackageId: null,
            totalPrice: itemsToPrice.reduce((sum, i) => sum + i.price, 0),
            flatRatePrice: null,
            items: itemsToPrice.map((item) => ({
              itemId: item.id,
              itemName: item.name,
              price: item.price,
              chargedPrice: item.price,
              isCovered: false,
            })),
          };
        }
      }

      // 3b. Free → check age condition
      const ageOk =
        (!selectedEntitlement.minAge || userAge >= selectedEntitlement.minAge) &&
        (!selectedEntitlement.maxAge || userAge <= selectedEntitlement.maxAge);

      if (ageOk) {
        // Age passes → FREE for package items, but charge extra add-on items not in the package
        const pkgItemNames = new Set((selectedPkg.items || []).map((i) => i.name.trim().toLowerCase()));

        const items = itemsToPrice.map((item) => {
          const isCovered = pkgItemNames.has(item.name.trim().toLowerCase());
          return {
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            chargedPrice: isCovered ? 0 : item.price,
            isCovered,
          };
        });

        const totalPrice = items.reduce((sum, i) => sum + i.chargedPrice, 0);

        return {
          pricingMode: totalPrice > 0 ? 'UPGRADE' : 'FREE',
          entitlementPackageId: selectedPackageId,
          totalPrice,
          flatRatePrice: null,
          items,
        };
      }
    }

    // ── 4. Age doesn't pass for selected → find a free package they qualify for (UPGRADE) ──
    const freeEntitlement = entitlements.find((e) => {
      if (!e.isFree) return false;
      const ageMatch =
        (!e.minAge || userAge >= e.minAge) &&
        (!e.maxAge || userAge <= e.maxAge);
      return ageMatch;
    });

    if (freeEntitlement) {
      // User has a free base package → UPGRADE mode
      const basePkg = packages.find((p) => p.id === freeEntitlement.packageId);
      const baseItemIds = new Set((basePkg?.items || []).map((i) => i.id).filter(Boolean));
      const baseItemNames = new Set((basePkg?.items || []).map((i) => i.name.trim().toLowerCase()));

      const items = itemsToPrice.map((item) => {
        const isCovered = (item.id && baseItemIds.has(item.id)) ||
          baseItemNames.has(item.name.trim().toLowerCase());
        return {
          itemId: item.id,
          itemName: item.name,
          price: item.price,
          chargedPrice: isCovered ? 0 : item.price,
          isCovered,
        };
      });

      return {
        pricingMode: 'UPGRADE',
        entitlementPackageId: freeEntitlement.packageId,
        totalPrice: items.reduce((sum, i) => sum + i.chargedPrice, 0),
        flatRatePrice: null,
        items,
      };
    }

    // ── 5. Has entitlement but not free and no qualifying free package → check for FLAT_RATE ──
    if (selectedEntitlement && !selectedEntitlement.isFree) {
      const flat = selectedEntitlement.flatPrice || 0;
      const items = itemsToPrice.map((item) => ({
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        chargedPrice: item.price,
        isCovered: false,
      }));
      return {
        pricingMode: 'FLAT_RATE',
        entitlementPackageId: null,
        totalPrice: flat,
        flatRatePrice: flat,
        items,
      };
    }

    // ── 6. Fallback → FULL_PAY ──
    const items = itemsToPrice.map((item) => ({
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      chargedPrice: item.price,
      isCovered: false,
    }));
    return {
      pricingMode: 'FULL_PAY',
      entitlementPackageId: null,
      totalPrice: items.reduce((sum, i) => sum + i.chargedPrice, 0),
      flatRatePrice: null,
      items,
    };
  },


  // --- Daily Slots (MySQL) ---
  async getDailySlots(campaignId?: string, department?: string): Promise<DailySlot[]> {
    if (!db) return [];

    try {
      let rows;

      if (campaignId && campaignId !== 'ALL') {
        rows = await db
          .select()
          .from(schema.dailySlots)
          .where(eq(schema.dailySlots.campaignId, campaignId))
          .orderBy(asc(schema.dailySlots.date));
      } else if (department && department.trim()) {
        const campaign = await this.getCampaign(department);
        rows = await db
          .select()
          .from(schema.dailySlots)
          .where(eq(schema.dailySlots.campaignId, campaign.id))
          .orderBy(asc(schema.dailySlots.date));
      } else {
        // ADMIN View: Select ALL daily slots across ALL campaigns and departments
        rows = await db
          .select()
          .from(schema.dailySlots)
          .orderBy(asc(schema.dailySlots.date));
      }

      if (rows.length === 0) {
        const activeCampaign = await this.getCampaign();
        if (activeCampaign && activeCampaign.id) {
          await this.rebuildSlotsForCampaign(activeCampaign);
          rows = await db
            .select()
            .from(schema.dailySlots)
            .where(eq(schema.dailySlots.campaignId, activeCampaign.id))
            .orderBy(asc(schema.dailySlots.date));
        }
      }

      const allTimeSlots = await db.select().from(schema.timeSlots);

      return rows.map((r) => {
        const slotDateStr = typeof r.date === 'string' ? (r.date as string).split('T')[0] : new Date(r.date).toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
        const matchingTimeSlots = allTimeSlots
          .filter((ts) => ts.dailySlotId === r.id)
          .map((ts) => ({
            id: ts.id,
            dailySlotId: ts.dailySlotId,
            startTime: ts.startTime,
            endTime: ts.endTime,
            quota: ts.quota,
            bookedCount: ts.bookedCount,
          }));

        return {
          id: r.id,
          campaignId: r.campaignId,
          date: slotDateStr,
          quota: r.quota,
          bookedCount: r.bookedCount,
          isHoliday: Boolean(r.isHoliday),
          holidayNote: r.holidayNote || undefined,
          timeSlots: matchingTimeSlots,
        };
      });
    } catch {
      return [];
    }
  },

  async updateDailySlot(
    slotId: string,
    updates: { quota?: number; isHoliday?: boolean; holidayNote?: string }
  ): Promise<DailySlot> {
    const slots = await this.getDailySlots();
    const current = slots.find((s) => s.id === slotId);
    if (!current) throw new Error('ไม่พบข้อมูลสล็อตประจำวัน');

    const isHoliday = updates.isHoliday !== undefined ? updates.isHoliday : current.isHoliday;
    const newQuota = isHoliday ? 0 : updates.quota !== undefined ? updates.quota : current.quota;

    if (!isHoliday && newQuota < current.bookedCount) {
      throw new Error(`ไม่สามารถปรับลดโควต้าต่ำกว่าจำนวนผู้จองเดิมได้ (${current.bookedCount} คน)`);
    }

    if (isHoliday && current.bookedCount > 0) {
      throw new Error(`วันนี้มีผู้จองแล้ว ${current.bookedCount} คน ไม่สามารถเปลี่ยนเป็นวันหยุดได้`);
    }

    if (db) {
      await db
        .update(schema.dailySlots)
        .set({
          quota: newQuota,
          isHoliday,
          holidayNote: updates.holidayNote || null,
          updatedAt: new Date(),
        })
        .where(eq(schema.dailySlots.id, slotId));
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_SLOT',
      `ปรับปรุงสล็อตวันที่ ${current.date}: โควต้า=${newQuota}, วันหยุด=${isHoliday}`
    );

    const updatedSlots = await this.getDailySlots();
    return updatedSlots.find((s) => s.id === slotId)!;
  },

  async batchUpdateSlots(
    startDate: string,
    endDate: string,
    quota?: number,
    isHoliday?: boolean,
    holidayNote?: string,
    campaignId?: string
  ): Promise<number> {
    let slots = await this.getDailySlots();
    if (campaignId && campaignId !== 'ALL') {
      slots = slots.filter((s) => s.campaignId === campaignId);
    }
    let updatedCount = 0;

    for (const slot of slots) {
      if (slot.date >= startDate && slot.date <= endDate) {
        const nextHoliday = isHoliday !== undefined ? isHoliday : slot.isHoliday;
        if (nextHoliday && slot.bookedCount > 0) continue;

        const nextQuota = nextHoliday ? 0 : quota !== undefined ? quota : slot.quota;
        if (db) {
          await db
            .update(schema.dailySlots)
            .set({
              quota: Math.max(slot.bookedCount, nextQuota),
              isHoliday: nextHoliday,
              holidayNote: nextHoliday ? holidayNote || 'วันหยุด' : null,
              updatedAt: new Date(),
            })
            .where(eq(schema.dailySlots.id, slot.id));
        }
        updatedCount++;
      }
    }

    await this.logAudit(
      activeUserIdStore,
      'UPDATE_SLOT',
      `ปรับปรุงโควต้าแบบกลุ่ม ช่วง ${startDate} ถึง ${endDate} (${updatedCount} วัน)`
    );

    return updatedCount;
  },

  // --- Bookings (Real MySQL Database Queries) ---
  async getBookings(): Promise<BookingWithDetails[]> {
    if (!db) return [];
    try {
      const usersList = await this.getUsers();
      const slotsList = await this.getDailySlots();
      const packagesList = await this.getPackages();
      const campaign = await this.getCampaign();

      const rows = await db.select().from(schema.bookings).orderBy(desc(schema.bookings.createdAt));
      let allBookingItems: any[] = [];
      try {
        allBookingItems = await db.select().from(schema.bookingItems);
      } catch (biErr) {
        console.warn('bookingItems table empty or not created yet:', biErr);
      }

      return rows.map((r) => {
        const user = usersList.find((u) => u.id === r.userId);
        const slot = slotsList.find((s) => s.id === r.dailySlotId);
        const pkg = packagesList.find((p) => p.id === r.packageId);
        const timeSlot = slot?.timeSlots?.find((t) => t.id === r.timeSlotId);

        const items = allBookingItems
          .filter((bi) => bi.bookingId === r.id)
          .map((bi) => ({
            id: bi.id,
            bookingId: bi.bookingId,
            itemId: bi.itemId || undefined,
            itemName: bi.itemName,
            price: bi.price || 0,
            chargedPrice: bi.chargedPrice || 0,
            isCoveredByEntitlement: Boolean(bi.isCoveredByEntitlement),
          }));

        // Fallback: parse from notes string if items array is empty
        if (items.length === 0 && r.notes && r.notes.includes('[รายการตรวจที่เลือก:')) {
          const match = r.notes.match(/\[รายการตรวจที่เลือก:\s*([^\]]+)\]/);
          if (match && match[1]) {
            const rawNames = match[1].split(',').map((s) => s.trim()).filter((s) => s && s !== 'ทั้งหมด');
            rawNames.forEach((name, idx) => {
              items.push({
                id: `parsed-${r.id}-${idx}`,
                bookingId: r.id,
                itemId: undefined,
                itemName: name,
                price: 0,
                chargedPrice: 0,
                isCoveredByEntitlement: true,
              });
            });
          }
        }

        return {
          id: r.id,
          userId: r.userId,
          campaignId: r.campaignId,
          dailySlotId: r.dailySlotId,
          timeSlotId: r.timeSlotId || undefined,
          packageId: r.packageId || undefined,
          entitlementPackageId: r.entitlementPackageId || null,
          queueNumber: r.queueNumber || undefined,
          status: r.status as any,
          pricingMode: (r.pricingMode as PricingMode) || 'FREE',
          totalPrice: r.totalPrice || 0,
          flatRatePrice: r.flatRatePrice || null,
          notes: r.notes || undefined,
          reminderSent: Boolean(r.reminderSent),
          reminderLastAttemptAt: r.reminderLastAttemptAt ? r.reminderLastAttemptAt.toISOString() : null,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
          user,
          dailySlot: slot,
          timeSlot,
          package: pkg,
          campaign,
          items,
        };
      });
    } catch {
      return [];
    }
  },

  async getUserBooking(userId: string, campaignId?: string): Promise<BookingWithDetails | undefined> {
    const all = await this.getBookings();
    return all.find((b) => b.userId === userId && b.status === 'CONFIRMED');
  },

  /**
   * REAL MySQL ATOMIC BOOKING TRANSACTION (with Entitlement-Based Pricing)
   */
  async bookSlot(
    userId: string,
    dailySlotId: string,
    timeSlotId?: string,
    packageId?: string,
    notes?: string,
    selectedItems?: { id?: string; name: string; price: number }[]
  ): Promise<BookingWithDetails> {
    const existing = await this.getUserBooking(userId);
    if (existing) {
      throw new Error('คุณได้ทำการจองวันตรวจสุขภาพประจำปีในรอบนี้แล้ว');
    }

    const usersList = await this.getUsers();
    const user = usersList.find((u) => u.id === userId);
    if (!user) throw new Error('ไม่พบข้อมูลผู้ใช้งาน');

    if (user.isActive === false) {
      throw new Error('บัญชีนี้ถูกระงับการใช้งานเนื่องจากพ้นสภาพการเป็นเจ้าหน้าที่โรงพยาบาล');
    }

    const slotsList = await this.getDailySlots();
    const slot = slotsList.find((s) => s.id === dailySlotId);
    if (!slot) throw new Error('ไม่พบวันที่ระบุในระบบ');
    if (slot.isHoliday) throw new Error('ขออภัย วันที่เลือกเป็นวันหยุดทำการ');
    if (slot.bookedCount >= slot.quota) throw new Error('ขออภัย โควต้าในวันที่เลือกเต็มแล้ว');

    const campaigns = await this.getCampaigns();
    const campaignObj = campaigns.find((c) => c.id === slot.campaignId);

    if (campaignObj && campaignObj.isActive === false) {
      throw new Error('ขออภัย โครงการตรวจสุขภาพนี้ถูกปิดการใช้งาน/ปิดรับจองคิวชั่วคราวโดยผู้ดูแลระบบ');
    }

    const cutoffDate = campaignObj?.eligibleStartworkCutoffDate || '2026-04-01';
    if (user.startworkDate && user.startworkDate >= cutoffDate) {
      throw new Error(`ขออภัย บุคลากรที่เริ่มบรรจุ/เข้าทำงานตั้งแต่วันที่ ${cutoffDate} เป็นต้นไป จะยังไม่มีสิทธิ์เข้ารับการตรวจสุขภาพประจำปีในโครงการนี้`);
    }

    const advanceDays = campaignObj?.advanceBookingDays ?? 2;

    if (advanceDays > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minBookableDate = new Date(today);
      minBookableDate.setDate(minBookableDate.getDate() + advanceDays);
      const minBookableDateStr = minBookableDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });

      if (slot.date < minBookableDateStr) {
        throw new Error(`ต้องทำการลงทะเบียนจองล่วงหน้าอย่างน้อย ${advanceDays} วัน ก่อนวันเข้ารับบริการตรวจสุขภาพ`);
      }
    }

    const bookingsList = await this.getBookings();
    const sameDeptBookings = bookingsList.filter(
      (b) => b.dailySlotId === dailySlotId && b.status === 'CONFIRMED' && b.user?.department === user.department
    ).length;

    if (sameDeptBookings >= 6) {
      throw new Error(
        `แผนก ${user.department} มีผู้จองในวันที่ ${slot.date} ครบโควต้าสูงสุดแล้ว (6 คน/วัน)`
      );
    }

    const pkgs = await this.getPackages();
    const selectedPkg = pkgs.find((p) => p.id === packageId) || pkgs[0];
    const bookingId = `bk-${Date.now()}`;
    const queueNum = `${selectedPkg.code.split('-')[1]}-${String(slot.bookedCount + 1).padStart(3, '0')}`;
    const campaign = await this.getCampaign();

    // ── Calculate pricing based on organization entitlements & selected items ──
    const pricing = await this.calculateBookingPrice(user, selectedPkg.id, selectedItems);


    if (db) {
      // Atomic Transaction in MySQL
      await db.transaction(async (tx) => {
        // Increment daily slot booked count
        await tx
          .update(schema.dailySlots)
          .set({ bookedCount: sql`${schema.dailySlots.bookedCount} + 1` })
          .where(eq(schema.dailySlots.id, dailySlotId));

        const resolvedTimeSlotId =
          timeSlotId ||
          slot.timeSlots?.[0]?.id ||
          `${dailySlotId}-t1`;

        // Increment time slot if present
        if (resolvedTimeSlotId) {
          await tx
            .update(schema.timeSlots)
            .set({ bookedCount: sql`${schema.timeSlots.bookedCount} + 1` })
            .where(eq(schema.timeSlots.id, resolvedTimeSlotId));
        }

        // Insert booking record into MySQL database (with pricing fields)
        await tx.insert(schema.bookings).values({
          id: bookingId,
          userId,
          campaignId: campaign.id,
          dailySlotId,
          timeSlotId: resolvedTimeSlotId,
          packageId: selectedPkg.id,
          entitlementPackageId: pricing.entitlementPackageId || null,
          queueNumber: queueNum,
          status: 'CONFIRMED',
          pricingMode: pricing.pricingMode,
          totalPrice: pricing.totalPrice,
          flatRatePrice: pricing.flatRatePrice,
          notes: notes || `[รายการตรวจที่เลือก: ${pricing.items.map((i) => i.itemName).join(', ') || 'ทั้งหมด'}] [ราคารวม: ${pricing.totalPrice} บาท]`,
        });

        // Determine items to insert for this booking
        // Use pricing.items which already has chargedPrice and isCovered computed
        const itemsToInsert = pricing.items.length > 0
          ? pricing.items
          : selectedItems && selectedItems.length > 0
            ? selectedItems.map((si) => ({
              itemId: si.id,
              itemName: si.name,
              price: si.price,
              chargedPrice: si.price,
              isCovered: false,
            }))
            : (selectedPkg.items || []).map((i) => ({
              itemId: i.id,
              itemName: i.name,
              price: i.price,
              chargedPrice: i.price,
              isCovered: false,
            }));

        // Fetch master items to guarantee target item_id is resolved
        const masterItemsList = await tx.select().from(schema.items);

        for (const item of itemsToInsert) {
          let targetItemId = item.itemId;

          if (!targetItemId || !masterItemsList.some((m) => m.id === targetItemId)) {
            const matchByName = masterItemsList.find(
              (m) => m.name.trim().toLowerCase() === item.itemName.trim().toLowerCase()
            );
            if (matchByName) {
              targetItemId = matchByName.id;
            } else {
              targetItemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              await tx.insert(schema.items).values({
                id: targetItemId,
                name: item.itemName,
                price: item.price || 0,
                category: 'ทั่วไป',
                createdAt: new Date(),
              });
              masterItemsList.push({
                id: targetItemId,
                name: item.itemName,
                price: item.price || 0,
                category: 'ทั่วไป',
                createdAt: new Date(),
              });
            }
          }

          await tx.insert(schema.bookingItems).values({
            id: `bk-item-${bookingId}-${Math.random().toString(36).substring(2, 7)}`,
            bookingId,
            itemId: targetItemId,
            itemName: item.itemName,
            price: item.price || 0,
            chargedPrice: item.chargedPrice || 0,
            isCoveredByEntitlement: item.isCovered || false,
            createdAt: new Date(),
          });
        }
      });
    }

    await this.logAudit(
      userId,
      'CREATE_BOOKING',
      `จองคิวตรวจสุขภาพวันที่ ${slot.date} คิวที่ ${queueNum} (${pricing.pricingMode}, ฿${pricing.totalPrice})`
    );

    const refreshedBookings = await this.getBookings();
    return refreshedBookings.find((b) => b.id === bookingId)!;
  },


  async cancelBooking(bookingId: string): Promise<void> {
    const bookingsList = await this.getBookings();
    const booking = bookingsList.find((b) => b.id === bookingId);
    if (!booking) throw new Error('ไม่พบข้อมูลการจอง');

    if (db) {
      await db.transaction(async (tx) => {
        // Hard delete booking record from table
        await tx
          .delete(schema.bookings)
          .where(eq(schema.bookings.id, bookingId));

        await tx
          .update(schema.dailySlots)
          .set({ bookedCount: sql`GREATEST(0, ${schema.dailySlots.bookedCount} - 1)` })
          .where(eq(schema.dailySlots.id, booking.dailySlotId));

        if (booking.timeSlotId) {
          await tx
            .update(schema.timeSlots)
            .set({ bookedCount: sql`GREATEST(0, ${schema.timeSlots.bookedCount} - 1)` })
            .where(eq(schema.timeSlots.id, booking.timeSlotId));
        }
      });
    }

    await this.logAudit(
      booking.userId,
      'CANCEL_BOOKING',
      `ยกเลิกคิวจองตรวจสุขภาพวันที่ ${booking.dailySlot?.date}`
    );
  },

  async rescheduleBooking(
    bookingId: string,
    newDailySlotId: string,
    newTimeSlotId?: string,
    newPackageId?: string,
    notes?: string,
    selectedItems?: { id?: string; name: string; price: number }[]
  ): Promise<BookingWithDetails> {
    const bookingsList = await this.getBookings();
    const existing = bookingsList.find((b) => b.id === bookingId);
    if (!existing) throw new Error('ไม่พบข้อมูลการจองเดิม');

    const userId = existing.userId;
    const pkgId = newPackageId || existing.packageId || undefined;

    // 1. Cancel existing booking
    await this.cancelBooking(bookingId);

    // 2. Book new slot for staff member
    const newBooking = await this.bookSlot(
      userId,
      newDailySlotId,
      newTimeSlotId,
      pkgId,
      notes || existing.notes || undefined,
      selectedItems
    );

    await this.logAudit(
      userId,
      'RESCHEDULE_BOOKING',
      `ย้ายวันตรวจสุขภาพจาก ${existing.dailySlot?.date || 'เดิม'} เป็น ${newBooking.dailySlot?.date}`
    );

    return newBooking;
  },

  async updateBookingReminderStatus(
    bookingId: string,
    reminderSent: boolean
  ): Promise<void> {
    if (db) {
      await db
        .update(schema.bookings)
        .set({
          reminderSent,
          reminderLastAttemptAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.bookings.id, bookingId));
    }
  },

  // --- Audit Logs (MySQL) ---
  async getAuditLogs(): Promise<AuditLog[]> {
    if (!db) return [];
    try {
      const rows = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp));

      if (rows.length === 0) {
        // Seed initial audit log entry if empty
        await this.logAudit('system', 'HIS_SYNC', 'เริ่มต้นใช้งานระบบจองตรวจสุขภาพและซิงก์ข้อมูล');
        const newRows = await db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.timestamp));
        return newRows.map((r) => ({
          id: r.id,
          timestamp: r.timestamp ? (r.timestamp instanceof Date ? r.timestamp.toISOString() : new Date(r.timestamp).toISOString()) : new Date().toISOString(),
          actorId: r.actorId,
          actorName: r.actorName || 'ผู้ดูแลระบบ (System)',
          action: r.action as any,
          details: r.details,
        }));
      }

      return rows.map((r) => ({
        id: r.id,
        timestamp: r.timestamp ? (r.timestamp instanceof Date ? r.timestamp.toISOString() : new Date(r.timestamp).toISOString()) : new Date().toISOString(),
        actorId: r.actorId,
        actorName: r.actorName || 'ผู้ดูแลระบบ (System)',
        action: r.action as any,
        details: r.details,
      }));
    } catch (err) {
      console.error('MySQL Audit Logs query error:', err);
      return [];
    }
  },

  async logAudit(actorId: string, action: AuditLog['action'], details: string): Promise<void> {
    if (!db) return;
    try {
      let actorName = 'ผู้ดูแลระบบ (System)';
      if (actorId && actorId !== 'system') {
        const usersList = await this.getUsers();
        const user = usersList.find(
          (u) => u.id === actorId || u.username === actorId || u.employeeCode === actorId
        );
        if (user) {
          actorName = `${user.firstName} ${user.lastName}`;
        }
      }

      const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await db.insert(schema.auditLogs).values({
        id: logId,
        timestamp: new Date(),
        actorId: actorId || 'system',
        actorName,
        action,
        details,
      });
    } catch (err) {
      console.error('Failed to insert audit log:', err);
    }
  },
};
