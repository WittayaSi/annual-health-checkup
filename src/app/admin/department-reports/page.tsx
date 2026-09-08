'use client';

import { useAdminContext } from '@/components/admin/AdminLayoutClientWrapper';
import { DepartmentReportsView } from '@/components/admin/DepartmentReportsView';

export default function AdminDepartmentReportsPage() {
  const {
    users,
    bookings,
    selectedCampaignId,
    campaigns,
    organizations,
    slots,
    packages,
    masterItems,
    onRefresh,
  } = useAdminContext();

  return (
    <DepartmentReportsView
      users={users}
      bookings={bookings}
      selectedCampaignId={selectedCampaignId}
      campaigns={campaigns}
      organizations={organizations}
      dailySlots={slots}
      packages={packages}
      masterItems={masterItems}
      onRefresh={onRefresh}
    />
  );
}
