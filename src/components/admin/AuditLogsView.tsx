'use client';

import { useState, useMemo } from 'react';
import { useAdminContext } from './AdminLayoutClientWrapper';
import { History, Search, Filter, ShieldAlert, UserCheck, Calendar } from 'lucide-react';
import { formatThaiDate } from '@/lib/item-utils';

export function AuditLogsView() {
  const { activeUser, auditLogs } = useAdminContext();

  const isFullAdmin = activeUser?.role === 'ADMIN';

  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearchTerm, setAuditSearchTerm] = useState<string>('');
  const [auditDisplayLimit, setAuditDisplayLimit] = useState<number>(50);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) {
        return false;
      }
      if (auditSearchTerm.trim()) {
        const q = auditSearchTerm.toLowerCase();
        const actorMatch = log.actorName?.toLowerCase().includes(q);
        const actionMatch = log.action?.toLowerCase().includes(q);
        const detailsMatch = log.details?.toLowerCase().includes(q);
        if (!actorMatch && !actionMatch && !detailsMatch) return false;
      }
      return true;
    });
  }, [auditLogs, auditActionFilter, auditSearchTerm]);

  const displayedAuditLogs = useMemo(() => {
    return filteredAuditLogs.slice(0, auditDisplayLimit);
  }, [filteredAuditLogs, auditDisplayLimit]);

  if (!isFullAdmin) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-8 text-center space-y-4 max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            เฉพาะผู้ดูแลระบบหลัก (Admin Only)
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            ประวัติการทำรายการและการแก้ไขข้อมูลสำคัญในระบบ (Audit Logs) สามารถเข้าถึงได้โดยผู้มีสิทธิ์ระดับ <span className="font-semibold text-rose-600 dark:text-rose-400">ADMIN</span> เท่านั้น
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <History className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                ประวัติการทำรายการระบบ (Audit Logs)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                ตรวจสอบร่องรอยการทำรายการ ทั้งการจองคิว ยกเลิกคิว ปรับปรุงโควต้า สิทธิ์ และการซิงค์ข้อมูล
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 tabular-nums">
              รวมทั้งหมด {auditLogs.length} รายการ
            </span>
          </div>
        </div>
      </div>

      {/* FILTER BAR & LOGS TABLE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>กรองประวัติการทำงาน ({filteredAuditLogs.length} รายการที่ตรงเงื่อนไข)</span>
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อผู้ทำรายการ/รายละเอียด..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
              />
            </div>

            <select
              value={auditActionFilter}
              onChange={(e) => setAuditActionFilter(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">ประเภทการทำงานทั้งหมด</option>
              <option value="CREATE_BOOKING">จองคิว (CREATE_BOOKING)</option>
              <option value="CANCEL_BOOKING">ยกเลิกคิว (CANCEL_BOOKING)</option>
              <option value="CREATE_CAMPAIGN">สร้างโครงการ (CREATE_CAMPAIGN)</option>
              <option value="UPDATE_CAMPAIGN">แก้ไขโครงการ (UPDATE_CAMPAIGN)</option>
              <option value="DELETE_CAMPAIGN">ลบโครงการ (DELETE_CAMPAIGN)</option>
              <option value="CREATE_ORGANIZATION">เพิ่มสังกัดองค์กร (CREATE_ORGANIZATION)</option>
              <option value="UPDATE_ORGANIZATION">แก้ไขสังกัดองค์กร (UPDATE_ORGANIZATION)</option>
              <option value="DELETE_ORGANIZATION">ลบสังกัดองค์กร (DELETE_ORGANIZATION)</option>
              <option value="CREATE_PACKAGE">เพิ่มโปรแกรมตรวจ (CREATE_PACKAGE)</option>
              <option value="UPDATE_PACKAGE">แก้ไขโปรแกรมตรวจ (UPDATE_PACKAGE)</option>
              <option value="DELETE_PACKAGE">ลบโปรแกรมตรวจ (DELETE_PACKAGE)</option>
              <option value="HIS_SYNC">HIS Sync</option>
              <option value="IMPORT_USERS">นำเข้าผู้ใช้ (IMPORT_USERS)</option>
              <option value="LINE_BIND">ผูก LINE OA (LINE_BIND)</option>
              <option value="LINE_UNBIND">ยกเลิกผูก LINE OA (LINE_UNBIND)</option>
              <option value="UPDATE_SLOT">ปรับ slot (UPDATE_SLOT)</option>
            </select>
          </div>
        </div>

        {/* LOG ITEMS LIST */}
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {displayedAuditLogs.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              ไม่พบประวัติการทำรายการที่ตรงตามเงื่อนไขค้นหา
            </div>
          ) : (
            displayedAuditLogs.map((log) => {
              const formattedDate = (() => {
                try {
                  const d = new Date(log.timestamp);
                  if (isNaN(d.getTime())) return log.timestamp;
                  return d.toLocaleString('th-TH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });
                } catch {
                  return log.timestamp;
                }
              })();

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold tracking-wide">
                        {log.action}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>โดย {log.actorName || 'System'}</span>
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed break-words">
                      {log.details}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium tabular-nums shrink-0 pt-0.5 self-end sm:self-start">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredAuditLogs.length > auditDisplayLimit && (
          <div className="text-center pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setAuditDisplayLimit((prev) => prev + 50)}
              className="px-5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
            >
              แสดงเพิ่มเติม (+50 รายการ)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
