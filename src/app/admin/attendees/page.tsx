'use client';

import { useAdminContext } from '@/components/admin/AdminLayoutClientWrapper';
import { DailyAttendeesView } from '@/components/admin/DailyAttendeesView';

export default function AdminAttendeesPage() {
  const { slots, bookings, packages, masterItems, onRefresh } = useAdminContext();

  return (
    <DailyAttendeesView
      slots={slots}
      bookings={bookings}
      packages={packages}
      masterItems={masterItems}
      onRefresh={onRefresh}
    />
  );
}
