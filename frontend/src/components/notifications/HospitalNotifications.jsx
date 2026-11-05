'use client';
import FeedBell from '@/components/notifications/FeedBell';
import { useAuth } from '@/store/AuthContext';

// Bell for hospital staff: new and critical blood requests for their hospital, cancellations,
// appointment bookings, donor cancellations and reschedule requests, today's bookings and their
// own stock below its minimum — from GET /api/notifications/hospital. "Seen" is stored per
// staff account, so each person at the hospital has their own badge.
export default function HospitalNotifications({ size = 40 }) {
  const { token } = useAuth();
  return (
    <FeedBell token={token} size={size} feedUrl="/api/notifications/hospital" seenUrl="/api/notifications/hospital/seen"
      emptyText="New requests, bookings, cancellations and stock alerts for your hospital will appear here."
      links={[{ label: 'Appointments', href: '/dashboard/hospital/appointments' }, { label: 'Blood requests', href: '/dashboard/hospital/requests' }]} />
  );
}
