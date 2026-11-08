'use client';
import { useI18n } from '@/i18n/I18nProvider';
import Link from 'next/link';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Container, FormControlLabel, Paper, Switch, Typography, useMediaQuery, useTheme } from '@mui/material';
import { BloodtypeOutlined, LocalHospitalOutlined, PeopleAlt, Refresh, SearchOff, VolunteerActivism, WarningAmber } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { BLOOD_TYPES } from '@/lib/inventory';
import { getPublicDonors, peekPublicDonors } from '@/lib/public-directory';
import { RECEIVES_FROM } from '@/lib/blood-compat';
import { useUserAuth } from '@/store/UserAuthContext';
import { EmptyState, ListPagination, StatCard } from '@/components/ui';
import { citiesOf, noFilters, prepareDonors, queryDirectory, registrationTrend } from './donors';
import DonorsHero from './DonorsHero';
import { DonorFilterBar, DonorTabs } from './DonorFilters';
import { BloodTypeSummary, DonorCards, DonorTable } from './DonorsList';
import { DonorProfileDialog, MessageTeamDialog } from './DonorDialogs';

/**
 * Donor Directory. Donors come from GET /api/donors, requested without a login so the API only
 * returns public fields (never phone or email), and partner hospital totals from /api/stats/public.
 * Used by two routes: the public /donors page and /donor-directory inside the donor dashboard
 * (`inDashboard`), whose shell already pads the content.
 */
export default function DonorDirectory({ inDashboard = false }) {
  const { t, formatNumber } = useI18n();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isWide = useMediaQuery(theme.breakpoints.up('xl'));
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const { token } = useUserAuth();
  const signedIn = !!token;

  // A list loaded in the last minute (e.g. on the other directory page) shows straight away.
  const [donors, setDonors] = useState(() => peekPublicDonors() || []);
  const [status, setStatus] = useState(() => (peekPublicDonors() ? 'ready' : 'loading')); // 'loading' | 'ready' | 'error'
  const [attempt, setAttempt] = useState(0);
  const [pub, setPub] = useState(null); // real totals from /api/stats/public

  const [filters, setFilters] = useState(noFilters);
  const [view, setView] = useState('list'); // 'list' | 'types'
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [profile, setProfile] = useState(null);
  const [messaging, setMessaging] = useState(null);
  const resultsRef = useRef(null);
  const paramsRead = useRef(false);

  // ?type=O%2B&q=Phnom+Penh (used by the site search and home page links) pre-sets the filters.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const q = params.get('q')?.trim();
    setFilters((f) => ({ ...f, ...(BLOOD_TYPES.includes(type) && { bloodType: type }), ...(q && { search: q }) }));
    paramsRead.current = true;
  }, []);

  // Keep the address bar in step with the main filters, so a filtered list can be shared.
  useEffect(() => {
    if (!paramsRead.current) return;
    const params = new URLSearchParams(window.location.search);
    if (filters.bloodType) params.set('type', filters.bloodType); else params.delete('type');
    if (filters.search.trim()) params.set('q', filters.search.trim()); else params.delete('q');
    const qs = params.toString();
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, [filters.bloodType, filters.search]);

  useEffect(() => {
    let cancelled = false;
    if (!peekPublicDonors() || attempt) setStatus('loading');
    // No Authorization header on purpose: the directory always gets the public fields only.
    getPublicDonors({ fresh: attempt > 0 })
      .then((list) => { if (!cancelled) { setDonors(list); setStatus('ready'); } })
      .catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [attempt]);

  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/stats/public`, { signal: ctrl.signal })
      .then((res) => setPub(res.data))
      .catch(() => { /* the hospitals card shows "—" */ });
    return () => ctrl.abort();
  }, []);

  const changeFilters = useCallback((patch) => {
    setFilters((f) => {
      const next = { ...f, ...patch };
      if (!next.bloodType) next.compatible = false;
      return next;
    });
    if ('availability' in patch) setView('list');
    setPage(0);
  }, []);
  const clearFilters = () => { setFilters(noFilters); setPage(0); };

  // Per-donor values (city, search text, readiness, dates) are worked out once per load.
  const prepared = useMemo(() => prepareDonors(donors), [donors]);
  const cities = useMemo(() => citiesOf(prepared), [prepared]);

  // Typing stays responsive: the inputs update at once, the results follow a moment later.
  const shownFilters = useDeferredValue(filters);
  const shownSort = useDeferredValue(sortBy);
  const updating = shownFilters !== filters || shownSort !== sortBy;
  const { rows: filtered, tabCounts, typeCounts } = useMemo(
    () => queryDirectory(prepared, shownFilters, shownSort),
    [prepared, shownFilters, shownSort],
  );

  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const changePage = (p) => {
    setPage(p);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resultsRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const loading = status === 'loading';
  const ready = status === 'ready';
  const filtersActive = !!filters.search.trim() || !!filters.bloodType || !!filters.city || filters.availability !== 'all';

  // KPI values, all from real data. Blood types counts the types at least one donor has.
  const { availableCount, typesPresent } = useMemo(() => {
    const present = new Set();
    let available = 0;
    for (const d of donors) {
      present.add(d.bloodType);
      if (d.available) available += 1;
    }
    return { availableCount: available, typesPresent: BLOOD_TYPES.filter((t) => present.has(t)) };
  }, [donors]);
  const trend = useMemo(() => registrationTrend(donors), [donors]);
  const pct = donors.length ? Math.round((availableCount / donors.length) * 100) : 0;

  // Stable handlers, so table rows only re-render when their own donor changes.
  const openMessage = useCallback((d) => { setProfile(null); setMessaging(d); }, []);
  const listProps = { rows: pageRows, loading, onView: setProfile, onMessage: openMessage };

  const emptyState = donors.length === 0 ? (
    <EmptyState
      icon={<VolunteerActivism />}
      title={t('directory.empty.noneTitle')}
      description={t('directory.empty.noneText')}
      action={<Button variant="contained" component={Link} href="/donate">{t('directory.empty.becomeDonor')}</Button>}
    />
  ) : (
    <EmptyState
      icon={<SearchOff />}
      title={t('directory.empty.filteredTitle')}
      description={filters.bloodType && !filters.compatible
        ? t('directory.empty.tryCompatible', { type: filters.bloodType })
        : t('directory.empty.tryOther')}
      action={
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {filters.bloodType && !filters.compatible && (
            <Button variant="outlined" onClick={() => changeFilters({ compatible: true })}>{t('directory.empty.includeCompatible')}</Button>
          )}
          <Button variant="outlined" color="inherit" onClick={clearFilters} sx={{ borderColor: 'divider' }}>{t('directory.empty.clear')}</Button>
        </Box>
      }
    />
  );

  const content = (
    <>
      <DonorsHero inDashboard={inDashboard} signedIn={signedIn} />

      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2.5 }, mb: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
        <StatCard decorated label={t('directory.stats.total')} value={ready ? formatNumber(donors.length) : null} icon={<PeopleAlt />} tone="primary"
          loading={loading} trend={ready ? trend : status === 'error' ? null : undefined} trendKey="joined" />
        <StatCard decorated label={t('directory.stats.available')} value={ready ? formatNumber(availableCount) : null} icon={<BloodtypeOutlined />} tone="warning"
          loading={loading} hint={ready ? t('directory.stats.availableHint', { pct: formatNumber(pct) }) : undefined} />
        <StatCard decorated label={t('directory.stats.hospitals')} value={pub?.hospitals != null ? formatNumber(pub.hospitals) : null}
          icon={<LocalHospitalOutlined />} tone="info" loading={!pub && loading} hint={t('directory.stats.hospitalsHint')} />
        <StatCard decorated label={t('directory.stats.types')} value={ready ? formatNumber(typesPresent.length) : null} icon={<VolunteerActivism />} tone="error"
          loading={loading} hint={ready ? (typesPresent.join(', ') || t('directory.stats.noDonors')) : undefined} />
      </Box>

      <Paper
        ref={resultsRef}
        component="section"
        aria-label={t('directory.section')}
        variant="outlined"
        sx={(t) => ({ borderRadius: `${t.custom.radius.card}px`, boxShadow: t.custom.shadow.sm, overflow: 'hidden', scrollMarginTop: { xs: 80, md: 90 } })}
      >
        <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <DonorFilterBar filters={filters} onChange={changeFilters} cities={cities} active={filtersActive} onClear={clearFilters} />
        </Box>
        <Box sx={{ px: { xs: 1, md: 2 }, borderBottom: 1, borderColor: 'divider' }}>
          <DonorTabs
            value={view === 'types' ? 'types' : filters.availability}
            onChange={(v) => { if (v === 'types') setView('types'); else changeFilters({ availability: v }); }}
            counts={ready ? tabCounts : {}}
            loading={loading}
            sortBy={sortBy}
            onSort={(v) => { setSortBy(v); setPage(0); }}
            showSort={view === 'list'}
          />
        </Box>

        {view === 'list' && filters.bloodType && ready && (
          <Box sx={{ px: { xs: 2, md: 3 }, py: 1, borderBottom: 1, borderColor: 'divider', bgcolor: (t) => t.custom.tones.primary.bg }}>
            <FormControlLabel
              control={<Switch size="small" checked={filters.compatible} onChange={(e) => changeFilters({ compatible: e.target.checked })} />}
              label={
                <Typography variant="body2">
                  <b>{t('directory.compatible.label')}</b>: {t('directory.compatible.text', { type: filters.bloodType, types: RECEIVES_FROM[filters.bloodType].join(', ') })}
                </Typography>
              }
            />
          </Box>
        )}

        {status === 'error' ? (
          <EmptyState
            icon={<WarningAmber />}
            title={t('directory.loadError.title')}
            description={t('directory.loadError.text')}
            action={<Button variant="contained" startIcon={<Refresh />} onClick={() => setAttempt((n) => n + 1)}>{t('common.tryAgain')}</Button>}
          />
        ) : view === 'types' ? (
          <BloodTypeSummary counts={typeCounts} loading={loading}
            onPick={(type) => { changeFilters({ bloodType: type, availability: filters.availability }); setView('list'); }} />
        ) : !loading && filtered.length === 0 ? emptyState
          : isDesktop ? (
            <Box sx={{ overflowX: 'auto', opacity: updating ? 0.6 : 1, transition: 'opacity .15s' }} aria-busy={updating}>
              <DonorTable {...listProps} compactActions={!isWide} />
            </Box>
          ) : (
            <Box sx={{ opacity: updating ? 0.6 : 1, transition: 'opacity .15s' }} aria-busy={updating}>
              <DonorCards {...listProps} />
            </Box>
          )}

        {view === 'list' && ready && filtered.length > 0 && (
          <ListPagination
            noun="donor"
            total={filtered.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPage={changePage}
            onRowsPerPage={(n) => { setRowsPerPage(n); setPage(0); }}
            compact={isPhone}
          />
        )}
      </Paper>

      {profile && <DonorProfileDialog donor={profile} onClose={() => setProfile(null)} onMessage={openMessage} />}
      {messaging && <MessageTeamDialog key={messaging._id} donor={messaging} token={token} onClose={() => setMessaging(null)} />}
    </>
  );

  // The dashboard shell already pads its content; the public site needs a page container.
  return inDashboard ? content : (
    <Container maxWidth={false} sx={{ maxWidth: 1440, py: { xs: 2, md: 4 }, pb: { xs: 6, md: 9 } }}>{content}</Container>
  );
}
