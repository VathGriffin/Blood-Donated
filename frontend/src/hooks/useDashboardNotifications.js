'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { ROLES } from '@/lib/navigation';

const POLL_MS = 60_000;
const MIN_GAP_MS = 20_000; // don't re-fetch on navigation if we just did

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const sum = (list, pick) => list.reduce((s, x) => s + (pick(x) || 0), 0);
const value = (settled) => (settled.status === 'fulfilled' ? settled.value.data : null);

// Each builder turns live API data into actionable items — counts of things that need
// attention right now. Nothing is stored or invented: an item exists only while the
// condition it describes is true in the database. Zero-count items are dropped.
const keep = (items) => items.filter((i) => i.count > 0);

async function loadAdmin(token) {
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [stats, convs, inv] = await Promise.allSettled([
    axios.get(`${API_BASE}/api/stats`, auth),
    axios.get(`${API_BASE}/api/messages/conversations`, auth),
    axios.get(`${API_BASE}/api/inventory/stats`),
  ]);
  const s = value(stats);
  const c = value(convs);
  const i = value(inv);
  if (!s && !c && !i) return null; // everything failed — keep what we had
  const critical = s?.requests?.critical || 0;
  const pending = Math.max(0, (s?.requests?.pending || 0) - critical); // `pending` includes the critical ones
  const toConfirm = s?.appointments?.pending || 0;
  const unread = sum(Array.isArray(c) ? c : [], (x) => x.unread);
  const lowStock = i?.critical || 0;
  return keep([
    { id: 'crit', tone: 'error', count: critical, title: `${plural(critical, 'critical request')} awaiting review`, detail: 'Urgent blood needs', href: '/dashboard/admin/requests' },
    { id: 'pend', tone: 'warning', count: pending, title: plural(pending, 'pending request'), detail: 'Waiting for approval', href: '/dashboard/admin/requests' },
    { id: 'appt', tone: 'info', count: toConfirm, title: `${plural(toConfirm, 'appointment')} to confirm`, detail: 'Donor bookings', href: '/dashboard/admin/appointments' },
    { id: 'msg', tone: 'primary', count: unread, title: plural(unread, 'unread message'), detail: 'From donors', href: '/dashboard/admin/contacts' },
    { id: 'stock', tone: 'warning', count: lowStock, title: `${plural(lowStock, 'blood type')} critically low`, detail: 'Central inventory', href: '/dashboard/admin/inventory' },
  ]);
}

async function loadHospital(hospitalId) {
  if (!hospitalId) return [];
  const [reqs, appts, inv] = await Promise.allSettled([
    axios.get(`${API_BASE}/api/requests?hospital=${hospitalId}`),
    axios.get(`${API_BASE}/api/appointments?hospital=${hospitalId}`),
    axios.get(`${API_BASE}/api/inventory?hospital=${hospitalId}`),
  ]);
  const r = value(reqs);
  const a = value(appts);
  const s = value(inv);
  if (!r && !a && !s) return null;
  const pending = (Array.isArray(r) ? r : []).filter((x) => x.status === 'Pending');
  const critical = pending.filter((x) => x.urgency === 'Critical').length;
  const toConfirm = (Array.isArray(a) ? a : []).filter((x) => x.status === 'Pending').length;
  const low = (Array.isArray(s) ? s : []).filter((x) => x.status === 'critical' || x.status === 'empty').length;
  return keep([
    { id: 'crit', tone: 'error', count: critical, title: `${plural(critical, 'critical request')} awaiting review`, detail: 'Urgent blood needs', href: '/dashboard/hospital/requests' },
    { id: 'pend', tone: 'warning', count: pending.length - critical, title: `${plural(pending.length - critical, 'pending request')}`, detail: 'Waiting for approval', href: '/dashboard/hospital/requests' },
    { id: 'appt', tone: 'info', count: toConfirm, title: `${plural(toConfirm, 'appointment')} to confirm`, detail: 'Donor bookings', href: '/dashboard/hospital/appointments' },
    { id: 'stock', tone: 'warning', count: low, title: `${plural(low, 'blood type')} critically low`, detail: 'Your inventory', href: '/dashboard/hospital/inventory' },
  ]);
}

// Donors: upcoming bookings, and replies from support they haven't opened yet.
// The API doesn't track "read" for replies to donors, so "unread" is measured against
// the last time this browser opened the Messages page (a per-viewer convenience).
async function loadDonor({ token, account, onMessagesPage }) {
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const email = account?.email;
  const [msgs, appts] = await Promise.allSettled([
    axios.get(`${API_BASE}/api/messages/mine`, auth),
    email ? axios.get(`${API_BASE}/api/appointments?email=${encodeURIComponent(email)}`) : Promise.reject(new Error('no email')),
  ]);
  const m = value(msgs);
  const a = value(appts);
  if (!m && !a) return null;

  let unreplied = 0;
  try {
    const key = `bd:messagesSeenAt:${account?.id}`;
    if (onMessagesPage || !localStorage.getItem(key)) localStorage.setItem(key, String(Date.now()));
    const seenAt = Number(localStorage.getItem(key)) || 0;
    unreplied = (Array.isArray(m) ? m : []).filter((x) => x.sender === 'admin' && new Date(x.createdAt).getTime() > seenAt).length;
  } catch { /* storage unavailable — skip the unread badge */ }

  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local time
  const upcoming = (Array.isArray(a) ? a : [])
    .filter((x) => ['Pending', 'Confirmed'].includes(x.status) && x.date >= today)
    .sort((p, q) => p.date.localeCompare(q.date));
  return keep([
    { id: 'reply', tone: 'primary', count: unreplied, title: `${plural(unreplied, 'new reply')} from support`, detail: 'Open your messages', href: '/notification' },
    { id: 'appt', tone: 'info', count: upcoming.length, title: `${plural(upcoming.length, 'upcoming appointment')}`, detail: upcoming[0] ? `Next: ${upcoming[0].date} at ${upcoming[0].time}` : '', href: '/profile' },
  ]);
}

/**
 * Real, role-specific notifications for the top bar. Refreshes on route change and
 * every minute. `session` is the object from useDashboardSession.
 */
export function useDashboardNotifications(session) {
  const { status, role, token, account } = session;
  const pathname = usePathname();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const latest = useRef(0);
  const lastLoad = useRef(0);

  const load = useCallback(async () => {
    if (status !== 'ready') return;
    const run = ++latest.current;
    lastLoad.current = Date.now();
    let next = null;
    try {
      if (role === ROLES.ADMIN) next = await loadAdmin(token);
      else if (role === ROLES.HOSPITAL_STAFF) next = await loadHospital(account?.hospitalId);
      else if (role === ROLES.DONOR) next = await loadDonor({ token, account, onMessagesPage: pathname.startsWith('/notification') });
    } catch { next = null; }
    if (run !== latest.current) return; // a newer refresh superseded this one
    if (next) setItems(next);
    setLoading(false);
  }, [status, role, token, account, pathname]);

  useEffect(() => {
    if (status !== 'ready') return undefined;
    // Refresh on route change, but not more than once per MIN_GAP_MS — each refresh is
    // several API calls. The donor Messages page is the exception: opening it is what
    // clears the "new reply" badge, so it always refreshes.
    const fresh = Date.now() - lastLoad.current < MIN_GAP_MS;
    if (!fresh || pathname.startsWith('/notification')) load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load, status, pathname]);

  return { items, count: sum(items, (i) => i.count), loading, refresh: load };
}
