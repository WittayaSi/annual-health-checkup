import { NextResponse } from 'next/server';
import { processBookingRemindersAction } from '@/app/actions';

/**
 * GET /api/cron/reminder
 * Automated hourly trigger for 1-Day Before Checkup Reminders
 */
export async function GET() {
  try {
    const result = await processBookingRemindersAction();
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Cron Execution Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
