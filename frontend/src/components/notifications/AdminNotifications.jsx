'use client';
import FeedBell from '@/components/notifications/FeedBell';
import { useAuth } from '@/store/AuthContext';
import { useT } from '@/i18n/I18nProvider';

// Bell for administrators: new and critical blood requests, cancellations, new appointment
// bookings, donor messages, new donor registrations and central stock below its minimum, from
// GET /api/notifications/admin. "Seen" is stored per admin account.
export default function AdminNotifications({ size = 40 }) {
  const { token } = useAuth();
  const t = useT();
  return (
    <FeedBell token={token} size={size} feedUrl="/api/notifications/admin" seenUrl="/api/notifications/admin/seen"
      emptyText={t('layout.bell.adminEmpty')}
      links={[{ labelKey: 'nav.bloodRequests', href: '/dashboard/admin/requests' }, { labelKey: 'nav.messages', href: '/dashboard/admin/contacts' }]} />
  );
}
