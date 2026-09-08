'use client';

import { useAdminContext } from '@/components/admin/AdminLayoutClientWrapper';
import { UnbookedStaffView } from '@/components/admin/UnbookedStaffView';

export default function AdminUnbookedPage() {
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
    <UnbookedStaffView
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
