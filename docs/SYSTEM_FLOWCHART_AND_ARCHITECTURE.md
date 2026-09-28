# 📐 แผนผังระบบและสถาปัตยกรรมกระบวนการทำงานเต็มระบบ (Full System Flowchart & Architecture)

> **ระบบจองวันและบริหารจัดการการตรวจสุขภาพประจำปี (Annual Health Checkup System)**  
> โรงพยาบาลท่าสองยาง และ หน่วยงานภาคีเครือข่ายสาธารณสุข

---

## 1. 📊 แผนผังกระบวนการทำงานภาพรวม (Overall System Flowchart)

![แผนผังกระบวนการทำงานภาพรวม](images/flowchart_overall.png)

> 🔍 **ตัวเลือกการดูแบบขยายใหญ่ (คมชัด ไม่แตก)**:
> - 📐 [เปิดดูภาพ Vector SVG (ขยายได้ไม่จำกัด เท่าไหร่ก็ไม่แตก)](images/flowchart_overall.svg)
> - 🖼️ [ดาวน์โหลดภาพความละเอียดสูง 4K PNG](images/flowchart_overall_4k.png)
> - 🌐 [เปิดหน้าต่าง Interactive Drag & Zoom (ลากเมาส์ / หมุนซูมเข้า-ออกได้)](http://localhost:5555/flowchart.html)

<details>
<summary>🔍 คลิกเพื่อดู Mermaid Code (Overall System Flowchart)</summary>

```mermaid
flowchart TD
    Start([เริ่มต้นใช้งานระบบ]) --> LoginProcess[1. เข้าสู่ระบบด้วย เลขบัตรประชาชน / Username]

    LoginProcess --> CheckRole{2. ตรวจสอบสิทธิ์ผู้ใช้<br/>User Role}
    
    %% ADMIN ROUTE
    CheckRole -- "ADMIN / SUPER_STAFF" --> AdminDashboard[3A. หน้าบริหารจัดการผู้ดูแลระบบ Admin Dashboard]
    
    AdminDashboard --> AdminTask1[จัดการโครงสร้างองค์กร / นำเข้าไฟล์ Excel บุคลากร]
    AdminDashboard --> AdminTask2[กำหนดโควตาและเปิดวันจองคิว Slot Quota]
    AdminDashboard --> AdminTask3[ตั้งค่าสิทธิ์ Package ตามองค์กร Organization Entitlements]
    AdminDashboard --> AdminTask4[ตั้งค่ากฎสิทธิ์เฉพาะแผนก Department Item Rules]
    AdminDashboard --> AdminTask5[เช็กชื่อผู้รับบริการ / ดูรายงานสรุปและ Audit Logs]

    %% STAFF ROUTE
    CheckRole -- "STAFF (บุคลากรทั่วไป)" --> UserBookingPage[3B. หน้าหลักการลงทะเบียนจองคิว /booking]

    UserBookingPage --> CheckExistingBooking{มีรายการจองคิว<br/>อยู่แล้วหรือไม่?}
    
    CheckExistingBooking -- "มีรายการแล้ว" --> DisplayCard[แสดงบัตรจองคิว Current Booking Card<br/>- สถานะ/วันนัด/คิวจอง<br/>- ปุ่มยกเลิกคิว / พิมพ์ใบแจ้ง]
    
    CheckExistingBooking -- "ยังไม่มีรายการ" --> SelectDate[4. เลือกวันรับบริการจากปฏิทิน Calendar Slot]

    SelectDate --> CheckQuota{โควตาวันที่เลือก<br/>ว่างหรือไม่?}
    CheckQuota -- "เต็ม (Quota 100%)" --> AlertFull[แสดงเตือนโควตาเต็ม ให้เลือกวันอื่น]
    AlertFull --> SelectDate

    CheckQuota -- "ว่าง (Quota Available)" --> OpenPackageSelector[5. เปิด Modal เลือกรายการตรวจ Health Package Selector]

    OpenPackageSelector --> AgeCalc[6. คำนวณอายุบริบูรณ์ ณ วันที่ตรวจ & ตรวจสอบเพศ]
    
    AgeCalc --> MatchEntitlement[7. ตรวจสอบสิทธิ์สวัสดิการประจำองค์กร Organization Entitlement]
    
    MatchEntitlement --> EntitlementDecision{สถานะสิทธิ์องค์กร}
    
    EntitlementDecision -- "มีสิทธิ์ Package (FREE/FLAT)" --> DisplayPkgMode[แสดงการ์ดสิทธิ์ประจำองค์กร<br/>- ฟรี 100% FREE<br/>- เหมาจ่าย FLAT_RATE เช่น ฿150/฿500]
    
    EntitlementDecision -- "ไม่มีแพ็กเกจประจำองค์กร" --> DisplayCustomMode[แสดงโหมดเลือกรายการตรวจธรรมดา<br/>- แสดงรายการจาก Master Catalog 100%]

    DisplayPkgMode --> EvaluateDeptRules[8. ประเมินกฎสิทธิ์เฉพาะแผนก Department Item Rules 4 ระดับ]
    DisplayCustomMode --> EvaluateDeptRules

    EvaluateDeptRules --> PregnancyCheck{บุคลากรหญิง<br/>ตั้งครรภ์หรือไม่?}
    PregnancyCheck -- "ตั้งครรภ์" --> ExcludePregnancyItems[งดรายการข้อห้ามตั้งครรภ์อัตโนมัติ<br/>เช่น เอกซเรย์ปอด/รังสี]
    PregnancyCheck -- "ไม่ได้ตั้งครรภ์ / เพศชาย" --> AllowAllItems[เปิดให้เลือกรายการตรวจตามสิทธิ์]

    ExcludePregnancyItems --> CalculateTotal[9. คำนวณราคารวมสุทธิและสรุปรายการตรวจ]
    AllowAllItems --> CalculateTotal

    CalculateTotal --> ConfirmBooking[10. กดกดยืนยันการจองคิว Confirm Booking]

    ConfirmBooking --> SaveDB[(11. บันทึกข้อมูลลงฐานข้อมูล MySQL<br/>- สร้าง Booking Record<br/>- บันทึก Selected Items<br/>- ตัดโควตาวันจองคิว Instant Quota)]

    SaveDB --> TelegramSchedule[12. ทำการตั้งเวลาแจ้งเตือนล่วงหน้า 1 วัน<br/>ผ่านระบบ Telegram Bot Scheduler]

    TelegramSchedule --> Finish([เสร็จสิ้นการจองคิว แสดงบัตรนัดหมาย])

    %% Styling
    classDef startEnd fill:#1e293b,stroke:#64748b,stroke-width:2px,color:#fff;
    classDef process fill:#0284c7,stroke:#0369a1,stroke-width:2px,color:#fff;
    classDef decision fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff;
    classDef admin fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff;
    classDef success fill:#059669,stroke:#047857,stroke-width:2px,color:#fff;

    class Start,Finish startEnd;
    class LoginProcess,UserBookingPage,SelectDate,OpenPackageSelector,AgeCalc,MatchEntitlement,DisplayPkgMode,DisplayCustomMode,EvaluateDeptRules,ExcludePregnancyItems,AllowAllItems,CalculateTotal,ConfirmBooking,SaveDB,TelegramSchedule process;
    class CheckRole,CheckExistingBooking,CheckQuota,AlertFull,EntitlementDecision,PregnancyCheck decision;
    class AdminDashboard,AdminTask1,AdminTask2,AdminTask3,AdminTask4,AdminTask5 admin;
    class DisplayCard success;
```
</details>

---

## 2. 🧮 แผนผังระบบคำนวณสิทธิ์และราคาไดนามิก (Dynamic Pricing & Entitlements Engine)

![แผนผังระบบคำนวณสิทธิ์และราคาไดนามิก](images/flowchart_pricing.png)

> 🔍 **ตัวเลือกการดูแบบขยายใหญ่ (คมชัด ไม่แตก)**:
> - 📐 [เปิดดูภาพ Vector SVG (ขยายได้ไม่จำกัด เท่าไหร่ก็ไม่แตก)](images/flowchart_pricing.svg)
> - 🖼️ [ดาวน์โหลดภาพความละเอียดสูง 4K PNG](images/flowchart_pricing_4k.png)
> - 🌐 [เปิดหน้าต่าง Interactive Drag & Zoom (ลากเมาส์ / หมุนซูมเข้า-ออกได้)](http://localhost:5555/flowchart.html)

<details>
<summary>🔍 คลิกเพื่อดู Mermaid Code (Dynamic Pricing & Entitlements Engine)</summary>

```mermaid
flowchart TD
    Input[ข้อมูลผู้ใช้: สังกัดองค์กร, แผนก, อายุ ณ วันตรวจ, เพศ] --> Step1[1. ค้นหา สิทธิ์แพ็กเกจประจำองค์กร Organization Entitlements]

    Step1 --> CheckAgePkg{อายุของผู้ใช้}
    CheckAgePkg -- "อายุน้อยกว่า 35 ปี (0-34 ปี)" --> MatchPkgA[จับคู่กับ PKG-A ชุดมาตรฐาน]
    CheckAgePkg -- "อายุ 35 ปีขึ้นไป (35+ ปี)" --> MatchPkgB[จับคู่กับ PKG-B ชุดครอบคลุม]

    MatchPkgA --> ModeCheck{ประเภทสิทธิ์องค์กร}
    MatchPkgB --> ModeCheck

    ModeCheck -- "FREE (ฟรีสวัสดิการ)" --> SetPkgPrice0[ราคาแพ็กเกจ = 0 บาท]
    ModeCheck -- "FLAT (เหมาจ่ายองค์กร)" --> SetPkgFlat[ราคาแพ็กเกจ = ราคาเหมาจ่าย เช่น ฿150 / ฿500]
    ModeCheck -- "FULL_PAY / ไม่มีแพ็กเกจ" --> SetPkgFull[ราคาแพ็กเกจ = ราคาปกติ / คิดตามรายการจริง]

    SetPkgPrice0 --> ItemRules[2. ประเมินสิทธิ์รายการตรวจย่อย Department Item Rules]
    SetPkgFlat --> ItemRules
    SetPkgFull --> ItemRules

    ItemRules --> PriorityCheck{ตรวจสอบลำดับความสำคัญ 4 ระดับ}
    
    PriorityCheck -- "ระดับ 1 (Priority 1)" --> P1[ตรงทั้ง องค์กรระบุ + แผนกระบุ]
    PriorityCheck -- "ระดับ 2 (Priority 2)" --> P2[ตรง องค์กรระบุ + ทุกแผนก ALL]
    PriorityCheck -- "ระดับ 3 (Priority 3)" --> P3[ตรง ทุกองค์กร ALL + แผนกระบุ]
    PriorityCheck -- "ระดับ 4 (Priority 4)" --> P4[กฎทั่วไป ทุกองค์กร ALL + ทุกแผนก ALL]

    P1 --> ApplyRuleType[คำนวณสิทธิ์ตาม Rule Type]
    P2 --> ApplyRuleType
    P3 --> ApplyRuleType
    P4 --> ApplyRuleType

    ApplyRuleType --> RuleTypes{ประเภทกฎสิทธิ์}
    RuleTypes -- "MANDATORY_FREE" --> Rule1[บังคับตรวจประจำแผนก + ฟรี 0 บาท]
    RuleTypes -- "OPTIONAL_FREE" --> Rule2[ตรวจตามสมัครใจ + ฟรี 0 บาท]
    RuleTypes -- "SPECIAL_PRICE" --> Rule3[คิดราคาพิเศษเฉพาะแผนก]
    RuleTypes -- "HIDDEN" --> Rule4[ซ่อนรายการตรวจไม่ให้แสดง]

    Rule1 --> SummaryPrice[3. สรุปรวมราคาสุทธิ = ราคาแพ็กเกจฐาน + ราคารายการตรวจเพิ่มเติม]
    Rule2 --> SummaryPrice
    Rule3 --> SummaryPrice
    Rule4 --> SummaryPrice

    %% Styling
    classDef input fill:#0284c7,stroke:#0369a1,color:#fff;
    classDef logic fill:#475569,stroke:#334155,color:#fff;
    classDef tier fill:#7c3aed,stroke:#6d28d9,color:#fff;
    classDef result fill:#059669,stroke:#047857,color:#fff;

    class Input input;
    class Step1,CheckAgePkg,MatchPkgA,MatchPkgB,ModeCheck,ItemRules,ApplyRuleType,RuleTypes logic;
    class PriorityCheck,P1,P2,P3,P4 tier;
    class SetPkgPrice0,SetPkgFlat,SetPkgFull,Rule1,Rule2,Rule3,Rule4,SummaryPrice result;
```
</details>

---

## 3. 📝 คำอธิบายการทำงานแต่ละโมดูลอย่างละเอียด (Detailed Technical Breakdown)

### 🔑 โมดูลที่ 1: ระบบยืนยันตัวตนและการกระจายสิทธิ์ตามบทบาท (Authentication & Authorization)
1. **การเข้าสู่ระบบ (Login Process)**:
   - ผู้ใช้เข้าสู่ระบบด้วย **เลขบัตรประชาชน (Citizen ID)** หรือ Username และ รหัสผ่าน
   - ระบบทำการดึงข้อมูลจากตาราง `users` และตรวจเช็กบทบาทผู้ใช้ (`role`):
     - `STAFF`: บุคลากรทั่วไปที่เข้ามารับบริการตรวจสุขภาพ
     - `SUPER_STAFF`: หัวหน้าหน่วยงาน/ผู้ดูแลแผนกที่สามารถดูรายงานย่อยได้
     - `ADMIN`: ผู้ดูแลระบบหลักที่มีสิทธิ์ตั้งค่าทั้งหมด
2. **การคำนวณอายุและเพศ (Age & Gender Detection)**:
   - ระบบคำนวณ **อายุบริบูรณ์ (Completed Age)** ณ วันที่เข้ารับการตรวจสุขภาพจริง (`checkupTargetDate`) โดยใช้สูตรเปรียบเทียบ ปี/เดือน/วัน เพื่อความแม่นยำสูง
   - ตรวจสอบเพศสภาพจากคำนำหน้าชื่อหรือฟิลด์เพศ เพื่อใช้กรองรายการตรวจเฉพาะเพศ (เช่น มะเร็งปากมดลูก ThinPrep, อัลตราซาวด์เต้านม Mammogram)

---

### 📅 โมดูลที่ 2: ระบบบริหารจัดการโควตาและเปิดวันจองคิว (Slot Quota Engine)
1. **โควตารายวัน (Daily Quotas)**:
   - ผู้ดูแลระบบกำหนดสล็อตวันรับบริการในตาราง `slots` พร้อมระบุจำนวนโควตารับบริการสูงสุด (`quota`)
2. **การตรวจสอบโควตาคงเหลือแบบ Real-time**:
   - เมื่อผู้ใช้เลือกวันที่ในปฏิทิน ระบบจะคำนวณ `remaining = quota - bookedCount`
   - หากโควตาเต็ม (`remaining <= 0`) ระบบจะปิดกั้นปุ่มกด และแสดงสถานะ **"โควตาเต็ม 100%"** เพื่อป้องกันการจองคิวซ้ำซ้อน (Overbooking)

---

### 💳 โมดูลที่ 3: ระบบคำนวณสิทธิ์แพ็กเกจประจำองค์กร (Organization Entitlements Engine)
ระบบรองรับสิทธิ์สวัสดิการของแต่ละสังกัดองค์กร (`organization_entitlements`) ในรูปแบบที่ยืดหยุ่น:
1. **สิทธิ์ตรวจฟรีสวัสดิการ 100% (FREE Mode)**:
   - เหมาะสำหรับบุคลากรประจำ (เช่น โรงพยาบาลท่าสองยาง) 
   - แบ่งเกณฑ์ตามอายุ: **อายุน้อยกว่า 35 ปี (PKG-A)** และ **อายุ 35 ปีขึ้นไป (PKG-B)**
2. **สิทธิ์เหมาจ่ายสวัสดิการองค์กร (FLAT RATE Mode)**:
   - เหมาะสำหรับองค์กรภายนอกที่มีงบประมาณเหมาจ่าย (เช่น สสอ.ท่าสองยาง)
   - กำหนดราคาเหมาจ่ายตามช่วงอายุ เช่น PKG-A = เหมาจ่าย ฿150 บาท, PKG-B = เหมาจ่าย ฿500 บาท
3. **โหมดไม่มีแพ็กเกจประจำองค์กร (Custom / Regular Mode)**:
   - หากองค์กรใดไม่ได้มีการตั้งค่าแพ็กเกจไว้ ระบบจะ **ไม่แสดงการ์ดแพ็กเกจแบบสุ่มสี่สุ่มห้า** แต่จะเปลี่ยนเป็นโหมด **"รายการตรวจสุขภาพธรรมดา"** โดยดึงรายการตรวจจาก Master Catalog มาให้เลือกเป็นรายบุคคลตามราคาปกติ

---

### 📍 โมดูลที่ 4: ระบบกฎสิทธิ์เฉพาะแผนก/หน่วยงาน (Department Item Rules Engine)
เพื่อแก้ปัญหาบุคลากรบางแผนกต้องได้รับตรวจแล็บเฉพาะทาง (เช่น โภชนาการต้องตรวจอุจจาระ Stool Exam หรือ พนักงานขับรถต้องตรวจสารเสพติด) ระบบใช้ **Matching Hierarchy 4 ลำดับความสำคัญ**:

1. **Priority 1 (เจาะจงสูงสุด)**: ตรงทั้ง `องค์กรระบุ` + `แผนกระบุ` (เช่น *โรงพยาบาลท่าสองยาง* + *งานชันสูตรสาธารณสุข*)
2. **Priority 2 (ระดับองค์กร)**: ตรง `องค์กรระบุ` + `ทุกแผนก (ALL)` (เช่น *โรงพยาบาลท่าสองยาง* + *ทั้งหมด*)
3. **Priority 3 (ระดับแผนกข้ามองค์กร)**: ตรง `ทุกองค์กร (ALL)` + `แผนกระบุ` (เช่น *ทั้งหมด* + *งานโภชนาการ*)
4. **Priority 4 (กฎส่วนกลาง)**: `ทุกองค์กร (ALL)` + `ทุกแผนก (ALL)`

**ประเภทของกฎ (Rule Types)**:
- `MANDATORY_FREE`: บังคับตรวจประจำแผนก + ฟรีสวัสดิการ (ระบบเลือกให้อัตโนมัติและไม่คิดเงิน)
- `OPTIONAL_FREE`: สิทธิ์ตรวจฟรีเพิ่มเติมตามสมัครใจ
- `SPECIAL_PRICE`: คิดราคาพิเศษเฉพาะแผนก/องค์กรนั้นๆ
- `HIDDEN`: ซ่อนรายการตรวจออกจากหน้าจอ

---

### 🤰 โมดูลที่ 5: ระบบคัดกรองความปลอดภัยสตรีมีครรภ์ (Pregnancy Screening Protection)
- สำหรับบุคลากรหญิง เมื่อติ๊กเลือก *"อยู่ระหว่างตั้งครรภ์ หรือสงสัยว่าตั้งครรภ์"*
- ระบบจะทำการ **งด/ยกเว้นรายการตรวจที่มีข้อห้ามสำหรับสตรีมีครรภ์อัตโนมัติ (เช่น เอกซเรย์ปอด Chest X-Ray / รังสีวินิจฉัย)** เพื่อความปลอดภัยสูงสุดของผู้รับบริการ

---

### 🔔 โมดูลที่ 6: ระบบแจ้งเตือนอัตโนมัติและการดำเนินงานหลังบ้าน (Background Scheduler & Admin Operations)
1. **การนำเข้าข้อมูลบุคลากรแบบกลุ่ม (Bulk Excel Import)**:
   - ผู้ดูแลระบบสามารถดาวน์โหลด Template และอัปโหลดไฟล์ Excel เพื่อนำเข้าสังกัดองค์กร แผนก และรายชื่อเจ้าหน้าที่พร้อมกันคราวละมากๆ
2. **ระบบแจ้งเตือนผ่าน Telegram (Automatic 1-Day Reminder)**:
   - มีระบบ Background Task (`AutoScheduler`) รันตรวจสอบคิวนัดหมายล่วงหน้า 1 วันโดยอัตโนมัติทุกๆ 1 ชั่วโมง 
   - ส่งข้อความแจ้งเตือนใบนัดและสถานที่รับบริการไปยัง Telegram Bot ของบุคลากร
3. **ระบบติดตามผู้เข้ารับบริการ (Daily Attendance & Audit Logging)**:
   - เจ้าหน้าที่จุดลงทะเบียนสามารถค้นหาชื่อ สแกน และกดบันทึกสถานะการเข้ารับบริการจริง (`ATTENDED`) 
   - บันทึกการเปลี่ยนแปลงสำคัญลงในตาราง `audit_logs` เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้ 100%
