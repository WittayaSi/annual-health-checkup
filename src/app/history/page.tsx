import { redirect } from 'next/navigation';
import { getActiveUserAction, getUserHealthHistoryAction } from '@/app/actions';
import { PersonalHealthHistoryView } from '@/components/history/PersonalHealthHistoryView';

export default async function HistoryPage() {
  const activeUser = await getActiveUserAction();

  // AUTH GUARD: Redirect to login if user is not logged in
  if (!activeUser) {
    redirect('/');
  }

  const res = await getUserHealthHistoryAction(activeUser.id);
  const user = res.user || activeUser;

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <PersonalHealthHistoryView user={user} records={res.records || []} />
    </div>
  );
}
