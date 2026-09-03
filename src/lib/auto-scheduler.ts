import { processBookingRemindersAction } from '@/app/actions';

let isSchedulerRunning = false;

/**
 * Auto Scheduler: Runs on Next.js Server side
 * Automatically executes processBookingRemindersAction every 1 hour (3600000 ms)
 */
export function initAutoReminderScheduler() {
  if (typeof window !== 'undefined') return; // Server-side only
  if (isSchedulerRunning) return;

  isSchedulerRunning = true;
  console.log('[AutoScheduler] 🚀 Starting automatic Telegram 1-Day Reminder Scheduler (runs every 1 hour)...');

  // Trigger initial check after 10 seconds of server startup
  setTimeout(async () => {
    try {
      console.log('[AutoScheduler] Executing scheduled Telegram 1-Day Reminder check...');
      const res = await processBookingRemindersAction();
      console.log('[AutoScheduler] Result:', {
        processed: res.processedCount,
        sentSuccess: res.sentSuccessCount,
        failed: res.failedCount,
      });
    } catch (err) {
      console.error('[AutoScheduler] Error executing reminder check:', err);
    }
  }, 10000);

  // Repeat every 1 hour
  setInterval(async () => {
    try {
      console.log('[AutoScheduler] Executing hourly Telegram 1-Day Reminder check...');
      const res = await processBookingRemindersAction();
      console.log('[AutoScheduler] Result:', {
        processed: res.processedCount,
        sentSuccess: res.sentSuccessCount,
        failed: res.failedCount,
      });
    } catch (err) {
      console.error('[AutoScheduler] Error executing hourly reminder check:', err);
    }
  }, 3600000);
}
