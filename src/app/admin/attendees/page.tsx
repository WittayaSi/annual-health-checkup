'use client';

import { useMemo } from 'react';
import { useAdminContext } from '@/components/admin/AdminLayoutClientWrapper';
import { DailyAttendeesView } from '@/components/admin/DailyAttendeesView';

export default function AdminAttendeesPage() {
  const { slots, bookings, packages, masterItems, selectedCampaignId, onRefresh } = useAdminContext();

  const campaignSlots = useMemo(() => {
    if (selectedCampaignId === 'ALL') return slots;
    return slots.filter((s) => s.campaignId === selectedCampaignId);
  }, [slots, selectedCampaignId]);

  const campaignBookings = useMemo(() => {
    if (selectedCampaignId === 'ALL') return bookings;
    return bookings.filter((b) => b.campaignId === selectedCampaignId || !b.campaignId);
  }, [bookings, selectedCampaignId]);

  return (
    <DailyAttendeesView
      slots={campaignSlots}
      bookings={campaignBookings}
      packages={packages}
      masterItems={masterItems}
      onRefresh={onRefresh}
    />
  );
}
