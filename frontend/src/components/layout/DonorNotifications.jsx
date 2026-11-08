'use client';
import FeedBell from '@/components/notifications/FeedBell';
import { useUserAuth } from '@/store/UserAuthContext';
import { useT } from '@/i18n/I18nProvider';

// Bell for signed-in donors: team replies, appointment and blood-request status changes and
// upcoming-appointment reminders, from GET /api/notifications.
export default function DonorNotifications({ size = 38 }) {
  const { token } = useUserAuth();
  const t = useT();
  return (
    <FeedBell token={token} size={size} feedUrl="/api/notifications" seenUrl="/api/notifications/seen"
      emptyText={t('layout.bell.donorEmpty')}
      links={[{ labelKey: 'layout.bell.openMessages', href: '/notification' }, { labelKey: 'nav.myAppointments', href: '/my-appointments' }]} />
  );
}
