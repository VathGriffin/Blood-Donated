'use client';
import FeedBell from '@/components/notifications/FeedBell';
import { useUserAuth } from '@/store/UserAuthContext';

// Bell for signed-in donors: team replies, appointment and blood-request status changes and
// upcoming-appointment reminders, from GET /api/notifications.
export default function DonorNotifications({ size = 38 }) {
  const { token } = useUserAuth();
  return (
    <FeedBell token={token} size={size} feedUrl="/api/notifications" seenUrl="/api/notifications/seen"
      emptyText="Updates on your appointments, blood requests and messages will appear here."
      links={[{ label: 'Open messages', href: '/notification' }, { label: 'My appointments', href: '/my-appointments' }]} />
  );
}
