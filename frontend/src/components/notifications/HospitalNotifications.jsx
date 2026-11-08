'use client';
import FeedBell from '@/components/notifications/FeedBell';
import { useAuth } from '@/store/AuthContext';
import { useT } from '@/i18n/I18nProvider';

// Bell for hospital staff: new and critical blood requests for their hospital, cancellations,
// appointment bookings, donor cancellations and reschedule requests, today's bookings and their
// own stock below its minimum — from GET /api/notifications/hospital. "Seen" is stored per
// staff account, so each person at the hospital has their own badge.
export default function HospitalNotifications({ size = 40 }) {
  const { token } = useAuth();
  const t = useT();
  return (
    <FeedBell token={token} size={size} feedUrl="/api/notifications/hospital" seenUrl="/api/notifications/hospital/seen"
      emptyText={t('layout.bell.hospitalEmpty')}
      links={[{ labelKey: 'nav.appointments', href: '/dashboard/hospital/appointments' }, { labelKey: 'nav.bloodRequests', href: '/dashboard/hospital/requests' }]} />
  );
}
