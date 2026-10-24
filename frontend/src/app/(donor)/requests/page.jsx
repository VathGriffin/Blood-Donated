'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Alert, Box, Breadcrumbs, Button, Snackbar, Typography } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import API_BASE from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { getHospitals } from '@/lib/public-directory';
import { useUserAuth } from '@/store/UserAuthContext';
import RequestDetailsDialog from '@/components/donor/RequestDetailsDialog';
import CancelRequestDialog from '@/components/donor/CancelRequestDialog';
import RequestForm from './_components/RequestForm';
import MyRequestsPanel from './_components/MyRequestsPanel';
import { BloodTypeInfo, ImportantNotice, LifeBanner, Tips } from './_components/SidePanels';
import { EMPTY_FORM, clearDraft, readDraft, toPayload, validate, writeDraft } from './_components/formModel';

const LOGIN_AGAIN = `/login?next=${encodeURIComponent('/requests')}`;

/**
 * Request Blood (donor portal). The form posts to POST /api/requests — the server takes the
 * requester from the login token, checks the hospital id and every field, and refuses an
 * accidental double submit. Beside it: the donor's own request history (GET /api/requests,
 * which only ever returns the caller's requests) and guidance panels.
 */
export default function RequestBloodPage() {
  const router = useRouter();
  const { token, user, logout } = useUserAuth();
  const authHeader = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  // ── Session expiry: keep the draft, sign out, come back here after logging in ──
  const logoutRef = useRef(logout);
  logoutRef.current = logout;
  const sessionExpired = useCallback((err) => {
    if (err?.response?.status !== 401) return false;
    logoutRef.current();
    router.push(LOGIN_AGAIN);
    return true;
  }, [router]);

  // ── Hospitals (public directory, shared cache) ──
  const [hospitals, setHospitals] = useState([]);
  const [hospitalsState, setHospitalsState] = useState('loading');
  const loadHospitals = useCallback(() => {
    setHospitalsState('loading');
    getHospitals()
      .then((list) => { setHospitals(list.filter((h) => h?._id && h.name)); setHospitalsState('ready'); })
      .catch(() => setHospitalsState('error'));
  }, []);
  useEffect(() => { loadHospitals(); }, [loadHospitals]);
  const byId = useMemo(() => Object.fromEntries(hospitals.map((h) => [h._id, h])), [hospitals]);
  const byName = useMemo(() => Object.fromEntries(hospitals.map((h) => [h.name.trim().toLowerCase(), h])), [hospitals]);
  const hospitalFor = useCallback((r) => byId[r.hospital] || byName[(r.hospitalName || '').trim().toLowerCase()], [byId, byName]);

  // ── The donor's own requests ──
  const [requests, setRequests] = useState([]);
  const [listState, setListState] = useState('loading');
  const run = useRef(0);
  const loadRequests = useCallback((quiet = false) => {
    if (!token) return;
    const id = ++run.current;
    if (!quiet) setListState('loading');
    axios.get(`${API_BASE}/api/requests`, authHeader)
      .then(({ data }) => { if (id === run.current) { setRequests(Array.isArray(data) ? data : []); setListState('ready'); } })
      .catch((err) => { if (id === run.current && !sessionExpired(err) && !quiet) setListState('error'); });
  }, [token, authHeader, sessionExpired]);
  useEffect(() => { loadRequests(); }, [loadRequests]);

  // ── Form ──
  const [form, setForm] = useState(EMPTY_FORM);
  const [mounted, setMounted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { severity, message, request? }
  const inFlight = useRef(false);
  const formTop = useRef(null);

  useEffect(() => { setForm(readDraft()); setMounted(true); }, []);
  useEffect(() => { if (mounted) writeDraft(form); }, [form, mounted]);

  // A saved draft can point at a hospital that is no longer listed — drop it rather than keep a blank pick.
  useEffect(() => {
    if (hospitalsState === 'ready' && form.hospitalId && !byId[form.hospitalId]) setForm((f) => ({ ...f, hospitalId: '' }));
  }, [hospitalsState, byId, form.hospitalId]);

  const set = useCallback((field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setResult((r) => (r?.severity === 'error' ? null : r));
  }, []);
  const allErrors = validate(form, hospitalsState === 'ready' ? hospitals : null);
  const shownErrors = showErrors ? allErrors : {};
  const hospital = byId[form.hospitalId] || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return; // a second click while the first is still on its way
    const firstInvalid = Object.keys(allErrors)[0];
    if (firstInvalid) {
      setShowErrors(true);
      setResult({ severity: 'error', message: `Please fix ${Object.keys(allErrors).length === 1 ? 'the highlighted field' : `the ${Object.keys(allErrors).length} highlighted fields`} before submitting.` });
      const el = document.getElementById(`field-${firstInvalid}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const target = ['textarea', 'input:not([aria-hidden=true]):not([type=hidden])', '[role=combobox]', 'button'].map((s) => el?.querySelector(s)).find(Boolean);
      target?.focus({ preventScroll: true });
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setResult(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/requests`, toPayload(form, hospital), authHeader);
      clearDraft();
      setForm(EMPTY_FORM);
      setShowErrors(false);
      setRequests((list) => [data, ...list.filter((r) => r._id !== data._id)]);
      setResult({
        severity: 'success', request: data,
        message: `Your request has been sent to ${data.hospitalName}. The hospital will review it and contact you.`,
      });
      loadRequests(true);
    } catch (err) {
      if (sessionExpired(err)) return;
      const status = err?.response?.status;
      if (status === 409 && err.response.data?.duplicateOf) {
        const existing = requests.find((r) => r._id === err.response.data.duplicateOf);
        setResult({ severity: 'warning', message: apiErrorMessage(err), request: existing });
        loadRequests(true);
      } else {
        setResult({ severity: 'error', message: apiErrorMessage(err, 'Your request could not be submitted. Please try again.') });
      }
    } finally {
      inFlight.current = false;
      setSubmitting(false);
      requestAnimationFrame(() => formTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  // ── Details + cancel (shared donor dialogs) ──
  const [detail, setDetail] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);
  const replace = (data) => setRequests((list) => list.map((r) => (r._id === data._id ? data : r)));

  const banner = result && (
    <Alert severity={result.severity} role={result.severity === 'success' ? 'status' : 'alert'}
      onClose={() => setResult(null)} sx={{ mb: 2.5, borderRadius: '10px', alignItems: 'center' }}
      action={result.request ? (
        <Button color="inherit" size="small" onClick={() => setDetail(result.request)} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>View request</Button>
      ) : undefined}>
      {result.message}
    </Alert>
  );

  return (
    <Box sx={{
      display: 'grid', gap: { xs: 2, md: 2.5 }, pb: 4, minWidth: 0, alignItems: 'start',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', xl: 'minmax(0, 5fr) minmax(0, 7fr)' },
      gridTemplateAreas: {
        xs: '"title" "banner" "notice" "form" "history" "extras"',
        xl: '"title banner" "form notice" "form history" "form extras"',
      },
      gridTemplateRows: { xl: 'auto auto auto 1fr' },
    }}>
      <Box sx={{ gridArea: 'title', alignSelf: 'center' }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="Breadcrumb" sx={{ fontSize: '0.86rem', mb: 1 }}>
          <Box component={Link} href="/profile" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Dashboard</Box>
          <Box component={Link} href="/my-requests" sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Blood Requests</Box>
          <Typography aria-current="page" sx={{ fontSize: 'inherit', color: 'text.primary', fontWeight: 600 }}>New Request</Typography>
        </Breadcrumbs>
        <Typography component="h1" sx={{ fontWeight: 800, fontSize: { xs: '1.8rem', md: '2.1rem' }, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
          Request Blood
        </Typography>
        <Typography sx={{ color: 'text.secondary', mt: 0.5, fontSize: '1rem' }}>Submit a blood request to a hospital in need.</Typography>
      </Box>

      <Box sx={{ gridArea: 'banner' }}><LifeBanner /></Box>
      <Box sx={{ gridArea: 'notice' }}><ImportantNotice hospital={hospital} /></Box>

      <Box ref={formTop} sx={{ gridArea: 'form', scrollMarginTop: 88 }}>
        <RequestForm form={form} set={set} errors={shownErrors} hospitals={hospitals} hospitalsState={hospitalsState}
          onRetryHospitals={loadHospitals} accountEmail={user?.email} submitting={submitting} onSubmit={handleSubmit} banner={banner} />
      </Box>

      <Box sx={{ gridArea: 'history', minWidth: 0 }}>
        <MyRequestsPanel requests={requests} state={listState} onRetry={() => loadRequests()} hospitalFor={hospitalFor}
          onView={setDetail} onCancel={setCancelTarget} busyId={cancelling ? cancelTarget?._id : null} />
      </Box>

      <Box sx={{ gridArea: 'extras', display: 'grid', gap: { xs: 2, md: 2.5 }, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'stretch' }}>
        <BloodTypeInfo selected={form.bloodType} />
        <Tips />
      </Box>

      {detail && (
        <RequestDetailsDialog request={detail} token={token} hospitalPhone={hospitalFor(detail)?.phone}
          onClose={() => setDetail(null)} onCancel={setCancelTarget} onSessionExpired={sessionExpired} onFresh={replace} />
      )}
      <CancelRequestDialog request={cancelTarget} token={token} onClose={() => setCancelTarget(null)}
        onCancelled={(data) => {
          replace(data); setCancelTarget(null);
          setToast({ severity: 'success', message: 'Your blood request has been cancelled.' });
          loadRequests(true);
        }}
        onChanged={(message) => { setCancelTarget(null); setToast({ severity: 'warning', message }); loadRequests(true); }}
        onSessionExpired={sessionExpired} onBusyChange={setCancelling} />

      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ borderRadius: '10px', fontWeight: 600 }}>{toast.message}</Alert> : undefined}
      </Snackbar>
    </Box>
  );
}
