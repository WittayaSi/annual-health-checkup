import type { Metadata } from 'next';
import { Prompt } from 'next/font/google';
import './globals.css';
import { AppLayoutWrapper } from '@/components/layout/AppLayoutWrapper';
import { getActiveUserAction, getAllUsersAction, getCampaignAction } from '@/app/actions';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { initAutoReminderScheduler } from '@/lib/auto-scheduler';

// Start automatic background scheduler on server startup
initAutoReminderScheduler();

const prompt = Prompt({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'thai'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ระบบจองวันตรวจสุขภาพประจำปี เจ้าหน้าที่โรงพยาบาล',
  description: 'ระบบจองคิวและวันเข้ารับการตรวจสุขภาพประจำปีสำหรับบุคลากรและเจ้าหน้าที่โรงพยาบาล (จำกัดโควต้าวันละ 45 คน)',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ตรวจสุขภาพ',
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const activeUser = await getActiveUserAction();
  const allUsers = await getAllUsersAction();
  const campaign = await getCampaignAction();

  return (
    <html lang="th" className="h-full scroll-smooth" data-scroll-behavior="smooth">
      <body className={`${prompt.className} flex min-h-full flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <AppLayoutWrapper activeUser={activeUser} allUsers={allUsers} campaign={campaign}>
            {children}
          </AppLayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
