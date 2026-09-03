'use client';

import { useState } from 'react';
import { useModalLock } from '@/lib/useModalLock';
import {
  Send,
  X,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  ExternalLink,
  Bot,
  Copy,
  Check,
} from 'lucide-react';
import { BookingWithDetails } from '@/lib/types';
import { sendTelegramBookingNotificationAction } from '@/app/actions';

interface TelegramNotificationModalProps {
  booking: BookingWithDetails;
  onClose?: () => void;
}

export function TelegramNotificationModal({ booking, onClose }: TelegramNotificationModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customBotToken, setCustomBotToken] = useState('');
  const [customChatId, setCustomChatId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const u = booking.user;
  const pkg = booking.package;
  const slot = booking.dailySlot;

  const dateStr = slot?.date || 'ไม่ระบุ';
  const userName = u ? `${u.firstName} ${u.lastName}` : 'ผู้ขอจอง';
  const orgName = u?.organization || u?.department || 'โรงพยาบาลท่าสองยาง';
  const pkgCode = pkg?.code || 'PKG';
  const pkgName = pkg?.name || 'แพ็กเกจตรวจสุขภาพ';
  const totalPrice = booking.totalPrice ?? 0;

  const pricingModeLabel =
    booking.pricingMode === 'FREE'
      ? 'ฟรีตามสิทธิ์ 100%'
      : booking.pricingMode === 'UPGRADE'
      ? 'ฟรีสวัสดิการ + ชำระส่วนต่าง'
      : booking.pricingMode === 'FLAT_RATE'
      ? 'เหมาจ่าย'
      : 'ชำระเต็มราคา';

  const itemsList = booking.items && booking.items.length > 0
    ? booking.items.map((it) => it.itemName)
    : ['รายการตรวจมาตรฐานครบชุด'];

  const handleSendTelegram = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    try {
      const res = await sendTelegramBookingNotificationAction(
        booking.id,
        customBotToken || undefined,
        customChatId || undefined
      );

      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: 'ส่ง Card การจองเข้า Telegram เรียบร้อยแล้ว! 🚀',
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'เกิดข้อผิดพลาดในการส่งข้อความเข้า Telegram',
        });
      }
    } catch (e) {
      setStatusMsg({
        type: 'error',
        text: 'ไม่สามารถเชื่อมต่อระบบ Telegram API ได้',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formattedTelegramText = `
🏥 ใบบันทึกการจองตรวจสุขภาพประจำปี
━━━━━━━━━━━━━━━━━━━━━
👤 ผู้ขอจอง: ${userName}
🏢 สังกัด/หน่วยงาน: ${orgName}
📞 เบอร์ติดต่อ: ${u?.phone || 'ไม่ระบุ'}

📅 วันที่นัดตรวจ: ${dateStr}
📦 แพ็กเกจตรวจ: ${pkgCode} - ${pkgName}
💰 ค่าบริการสุทธิ: ${totalPrice > 0 ? `฿${totalPrice.toLocaleString()} บาท` : 'ฟรี 100%'} [${pricingModeLabel}]

🔬 รายการตรวจที่เลือก:
${itemsList.map((i) => `  • ${i}`).join('\n')}
━━━━━━━━━━━━━━━━━━━━━
✅ สถานะ: ยืนยันการจองเรียบร้อยแล้ว
`.trim();

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedTelegramText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useModalLock(isOpen);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#229ED9] hover:bg-[#1d8bc0] rounded-xl transition-all shadow-xs shrink-0 cursor-pointer"
        title="ส่ง Card บันทึกการจองผ่าน Telegram"
      >
        <Send className="h-3.5 w-3.5" />
        <span>ส่ง Card เข้า Telegram</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto cursor-pointer animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              if (onClose) onClose();
            }
          }}
        >
          <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-[#229ED9] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white">
                  <Send className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    ส่ง Card การจองผ่าน Telegram
                  </h3>
                  <p className="text-[11px] text-sky-100 mt-0.5">
                    ส่ง Card ยืนยันคิวตรวจสุขภาพไปยังกลุ่ม/แชนเนล Telegram
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Telegram Card Preview Box */}
              <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/60 dark:bg-slate-800/80 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#229ED9] flex items-center gap-1.5">
                    <Bot className="h-4 w-4" />
                    <span>ตัวอย่าง Telegram Message Card (Preview):</span>
                  </span>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>คัดลอกแล้ว</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>คัดลอกข้อความ</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="text-[11px] font-sans text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {formattedTelegramText}
                </pre>
              </div>

              {/* Notice Banner */}
              {statusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                    statusMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {statusMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span>{statusMsg.text}</span>
                  </div>
                </div>
              )}

              {/* Personal Telegram Badge */}
              <div className="rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 p-3.5 space-y-1.5 text-xs">
                <span className="font-bold text-sky-900 dark:text-sky-200 flex items-center gap-1.5">
                  <Bot className="h-4 w-4 text-[#229ED9]" />
                  <span>ช่องทาง Telegram ส่วนตัวของเจ้าหน้าที่ (ดึงจาก hr_person):</span>
                </span>
                <div className="text-[11px] text-sky-800 dark:text-sky-300 space-y-1 pl-1">
                  <div>
                    • <b>Telegram Channel / Chat ID:</b>{' '}
                    <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 font-mono font-bold text-sky-700 dark:text-sky-300">
                      {u?.telegramChatId || 'ระบุใน hr_person / ระบบกลาง'}
                    </code>
                  </div>
                  {u?.telegramToken && (
                    <div>
                      • <b>Telegram Bot Token ส่วนตัว:</b>{' '}
                      <code className="bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800 font-mono text-sky-700 dark:text-sky-300">
                        {u.telegramToken.slice(0, 12)}...
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Bot Config Fields (Optional override) */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5 space-y-3 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  ⚙️ หรือระบุเพื่อเปลี่ยน Bot Token / Chat ID ชั่วคราว:
                </span>


                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Telegram Bot Token (ระบุหากต้องการเปลี่ยนชั่วคราว):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 7890123456:AAFxXxXxXxXxXxXx..."
                      value={customBotToken}
                      onChange={(e) => setCustomBotToken(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#229ED9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Telegram Chat ID / Group ID:
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น -100123456789 หรือ @mychannel"
                      value={customChatId}
                      onChange={(e) => setCustomChatId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-[#229ED9]"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSendTelegram}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1d8bc0] text-white font-bold text-sm transition-all shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{isLoading ? 'กำลังส่ง Card เข้า Telegram...' : 'กดส่ง Card บันทึกการจองทันที'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
