import { redirect } from 'next/navigation';
import {
  getActiveUserAction,
  getCampaignAction,
  getCampaignsAction,
  getPackagesAction,
  getSlotsAction,
  getBookingsAction,
  getAuditLogsAction,
  getAllUsersAction,
  getOrganizationsAction,
  getAllMasterItemsAction,
} from '@/app/actions';
import { AdminLayoutClientWrapper } from '@/components/admin/AdminLayoutClientWrapper';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeUser = await getActiveUserAction();

  // AUTH GUARD: Redirect to landing page (/) if not logged in
  if (!activeUser) {
    redirect('/');
  }

  // ROLE GUARD: Only ADMIN and SUPER_STAFF are allowed. Redirect STAFF users directly to /booking
  const hasAdminAccess = activeUser.role === 'ADMIN' || activeUser.role === 'SUPER_STAFF';

  if (!hasAdminAccess) {
    redirect('/booking');
  }

  // Fetch admin data only after verifying ADMIN authorization
  const campaign = await getCampaignAction();
  const campaigns = await getCampaignsAction();
  const organizations = await getOrganizationsAction();
  const packages = await getPackagesAction();
  const slots = await getSlotsAction();
  const bookings = await getBookingsAction();
  const auditLogs = await getAuditLogsAction();
  const users = await getAllUsersAction();
  const masterItems = await getAllMasterItemsAction();

  return (
    <AdminLayoutClientWrapper
      activeUser={activeUser}
      campaign={campaign}
      campaigns={campaigns}
      organizations={organizations}
      packages={packages}
      slots={slots}
      bookings={bookings}
      auditLogs={auditLogs}
      users={users}
      masterItems={masterItems}
    >
      {children}
    </AdminLayoutClientWrapper>
  );
}
