'use client';
import FeedBell from '@/components/notifications/FeedBell';
import { useAuth } from '@/store/AuthContext';

// Bell for administrators: new and critical blood requests, cancellations, new appointment
// bookings, donor messages, new donor registrations and central stock below its minimum, from
// GET /api/notifications/admin. "Seen" is stored per admin account.
export default function AdminNotifications({ size = 40 }) {
  const { token } = useAuth();
  return (
    <FeedBell token={token} size={size} feedUrl="/api/notifications/admin" seenUrl="/api/notifications/admin/seen"
      emptyText="New requests, bookings, donor messages and stock alerts will appear here."
      links={[{ label: 'Blood requests', href: '/dashboard/admin/requests' }, { label: 'Messages', href: '/dashboard/admin/contacts' }]} />
  );
}
