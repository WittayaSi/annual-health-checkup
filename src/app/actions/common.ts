/**
 * Format and sanitize error messages for client UI.
 * Internal utility for server actions.
 */
export function formatErrorMessage(error: unknown, fallbackMessage: string): string {
  console.error('Server Action Error:', error);
  if (error instanceof Error) {
    const msg = error.message || '';
    if (
      msg.includes('Failed query:') ||
      msg.includes('ER_') ||
      msg.includes('SQL') ||
      msg.includes('params:') ||
      msg.includes('drizzle')
    ) {
      return `${fallbackMessage} (เกิดข้อผิดพลาดในการประมวลผลฐานข้อมูล)`;
    }
    return msg;
  }
  return fallbackMessage;
}
