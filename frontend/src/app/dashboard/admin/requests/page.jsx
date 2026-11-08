'use client';
import { statusLabel } from '@/components/ui/StatusBadge';
import { useT } from '@/i18n/I18nProvider';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Paper, useMediaQuery, useTheme } from '@mui/material';
import { Add, Assignment, Bloodtype, Cancel, CheckCircle, FilterAltOff, HourglassTop, Refresh, WarningAmber } from '@mui/icons-material';
import axios from 'axios';
import API_BASE_URL, { uploadUrl } from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { useAuth } from '@/store/AuthContext';
import { EmptyState, ListPagination, StatCard } from '@/components/ui';
import {
  MAX_PHOTO_SIZE, emptyForm, filterRequests, noFilters, reqStatus, statusTrend, validateRequestForm,
} from './_components/requests';
import RequestsHero from './_components/RequestsHero';
import { FilterBar, StatusTabs } from './_components/RequestFilters';
import { RequestActions, RequestCards, RequestsTable } from './_components/RequestsList';
import { DeleteDialog, DetailsDialog, PhotoDialog, RequestFormDialog } from './_components/RequestDialogs';

const API_BASE = `${API_BASE_URL}/api/requests`;

/**
 * Admin Blood Requests: every request on the platform (GET /api/requests returns all of them only
 * for an admin token). Approve / Reject go through PUT /:id, which enforces the status rules;
 * Edit and Delete are admin actions and the API checks that again.
 */
export default function ManageRequests() {
  const t = useT();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const { token, isAdmin } = useAuth();
  const authHeader = useCallback(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [statusTab, setStatusTab] = useState('All');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(noFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [viewing, setViewing] = useState(null);
  const [viewPhoto, setViewPhoto] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setLoadError('');
    try {
      const res = await axios.get(API_BASE, authHeader());
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setLoadError(err);
    } finally {
      setLoading(false);
    }
  }, [authHeader, token]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Free the preview URL of a picked photo once it is replaced or the form closes.
  useEffect(() => () => {
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview);
  }, [photoPreview]);

  const handleSetStatus = async (id, status) => {
    if (!token) return;
    setActionError('');
    setBusyId(id);
    try {
      const res = await axios.put(`${API_BASE}/${id}`, { status }, authHeader());
      setRequests((prev) => prev.map((r) => (r._id === id ? res.data : r)));
      setViewing((v) => (v?._id === id ? res.data : v));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('adm.reqs.statusFailed')));
    } finally {
      setBusyId(null);
    }
  };

  const openForm = (req) => {
    setForm(req ? {
      hospitalName: req.hospitalName || '',
      patientName: req.patientName || '',
      bloodType: req.bloodType || '',
      unitsNeeded: req.unitsNeeded || '',
      urgency: req.urgency || '',
      reason: req.reason || '',
      contact: req.contact || '',
      photo: req.photo || null,
    } : { ...emptyForm, unitsNeeded: 1, urgency: 'Medium' });
    setEditId(req?._id || null);
    setPhotoPreview(uploadUrl(req?.photo) || null);
    setPhotoFile(null);
    setFieldErrors({});
    setFormError('');
    setViewing(null);
    setFormOpen(true);
  };

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  };

  const pickPhoto = (file) => {
    if (file.size > MAX_PHOTO_SIZE) { setFormError(t('adm.reqs.photoSize')); return; }
    setFormError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setForm((prev) => ({ ...prev, photo: null }));
  };

  // editId set = edit (PUT), null = new request (POST, the same route the public form uses).
  const handleSubmit = async () => {
    const { errors, body } = validateRequestForm(form);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setFormError(t('adm.reqs.fixFields'));
      return;
    }
    setFieldErrors({});
    setFormError('');
    setSaving(true);
    // "Remove" on an existing photo clears it; a newly picked file is uploaded below instead.
    const photoRemoved = editId && !form.photo && !photoFile && requests.find((r) => r._id === editId)?.photo;
    if (photoRemoved) body.photo = null;
    let id = editId;
    try {
      if (editId) {
        await axios.put(`${API_BASE}/${editId}`, body, authHeader());
      } else {
        const res = await axios.post(API_BASE, body, authHeader());
        id = res.data._id;
      }
    } catch (err) {
      setFormError(apiErrorMessage(err, editId ? t('adm.reqs.updateFailed') : t('adm.reqs.createFailed')));
      setSaving(false);
      return;
    }
    if (photoFile) {
      try {
        const fd = new FormData();
        fd.append('photo', photoFile);
        await axios.post(`${API_BASE}/${id}/photo`, fd, authHeader());
      } catch {
        setActionError(editId ? t('adm.reqs.photoAfterUpdate') : t('adm.reqs.photoAfterCreate'));
      }
    }
    setSaving(false);
    setFormOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    await fetchRequests();
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    setActionError('');
    try {
      await axios.delete(`${API_BASE}/${confirmDelete._id}`, authHeader());
      setRequests((prev) => prev.filter((r) => r._id !== confirmDelete._id));
      setViewing((v) => (v?._id === confirmDelete._id ? null : v));
    } catch (err) {
      setActionError(apiErrorMessage(err, t('adm.reqs.deleteFailed')));
    } finally {
      setConfirmDelete(null);
      setDeleting(false);
    }
  };

  // Hospital filter options come from the requests themselves — no extra API call.
  const hospitalOptions = useMemo(
    () => [...new Set(requests.map((r) => r.hospitalName).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [requests],
  );

  const counts = useMemo(() => {
    const c = { All: requests.length };
    for (const r of requests) c[reqStatus(r)] = (c[reqStatus(r)] || 0) + 1;
    return c;
  }, [requests]);
  const countFor = (s) => counts[s] || 0;

  const trends = useMemo(() => ({
    All: statusTrend(requests),
    Pending: statusTrend(requests, 'Pending'),
    Approved: statusTrend(requests, 'Approved'),
    Rejected: statusTrend(requests, 'Rejected'),
  }), [requests]);

  const filtered = useMemo(
    () => filterRequests(requests, { tab: statusTab, search, filters }),
    [requests, statusTab, search, filters],
  );

  // Back to the first page whenever the tab, search or filters change the result set.
  useEffect(() => { setPage(0); }, [statusTab, filters, search]);
  // A delete can empty the last page; show the new last page instead of an empty one.
  const lastPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, lastPage);
  const pageRows = filtered.slice(currentPage * rowsPerPage, (currentPage + 1) * rowsPerPage);

  const filtersActive = !!search.trim() || Object.values(filters).some(Boolean);
  const clearFilters = () => { setSearch(''); setFilters(noFilters); };

  const actionsFor = (req) => (
    <RequestActions
      req={req}
      busy={busyId === req._id}
      canManage={isAdmin}
      onStatus={handleSetStatus}
      onView={setViewing}
      onEdit={openForm}
      onDelete={setConfirmDelete}
    />
  );

  const empty = (
    <EmptyState
      icon={filtersActive ? <FilterAltOff /> : <Bloodtype />}
      title={filtersActive ? t('adm.reqs.noMatch') : statusTab !== 'All' ? t('adm.reqs.noneStatus', { status: statusLabel(t, statusTab) }) : t('adm.reqs.noneYet')}
      description={filtersActive
        ? t('adm.reqs.tryDifferent')
        : t('adm.reqs.emptyText')}
      action={filtersActive
        ? <Button size="small" variant="outlined" startIcon={<FilterAltOff />} onClick={clearFilters}>{t('adm.reqs.clearFilters')}</Button>
        : <Button size="small" variant="contained" startIcon={<Add />} onClick={() => openForm(null)}>{t('adm.reqs.newRequest')}</Button>}
    />
  );

  const listProps = { rows: pageRows, loading, empty, actionsFor, onOpenPhoto: setViewPhoto };

  return (
    <Box>
      <RequestsHero loading={loading} onRefresh={fetchRequests} onCreate={() => openForm(null)} />

      {/* KPI cards: totals are all time; the footer compares requests submitted in the last 30 days with the 30 before. */}
      <Box sx={{ display: 'grid', gap: { xs: 1.5, md: 2.5 }, mb: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
        <StatCard decorated label={t('adm.reqs.totalRequests')} value={countFor('All')} icon={<Assignment />} tone="primary"
          loading={loading} trend={loadError ? null : trends.All} trendKey="last30" />
        <StatCard decorated label={t('adm.reqs.pending')} value={countFor('Pending')} icon={<HourglassTop />} tone="warning"
          loading={loading} hint={countFor('Pending') ? t('adm.reqs.awaitingReview') : t('adm.reqs.noneToReview')}
          trend={loadError ? null : trends.Pending} trendKey="last30" />
        <StatCard decorated label={t('adm.reqs.approved')} value={countFor('Approved')} icon={<CheckCircle />} tone="success"
          loading={loading} hint={t('adm.reqs.readyToFulfil')} trend={loadError ? null : trends.Approved} trendKey="last30" />
        <StatCard decorated label={t('adm.reqs.rejected')} value={countFor('Rejected')} icon={<Cancel />} tone="error"
          loading={loading} hint={countFor('Rejected') ? 'Declined requests' : 'No rejected requests'}
          trend={loadError ? null : trends.Rejected} trendKey="last30" />
      </Box>

      {actionError && (
        <Alert severity="error" onClose={() => setActionError('')} sx={{ mb: 2 }}>{actionError}</Alert>
      )}

      <Paper
        variant="outlined"
        sx={(t) => ({ borderRadius: `${t.custom.radius.card}px`, boxShadow: t.custom.shadow.sm, overflow: 'hidden' })}
      >
        <Box sx={{ px: { xs: 1.5, md: 2.5 }, pt: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
          <StatusTabs value={statusTab} onChange={setStatusTab} countFor={countFor} loading={loading} />
        </Box>
        <Box sx={{ px: { xs: 1.5, md: 2.5 }, py: 2, borderBottom: 1, borderColor: 'divider' }}>
          <FilterBar
            search={search}
            onSearch={setSearch}
            filters={filters}
            onFilter={(key, value) => setFilters((f) => ({ ...f, [key]: value }))}
            hospitalOptions={hospitalOptions}
            active={filtersActive}
            onClear={clearFilters}
          />
        </Box>

        {loadError ? (
          <EmptyState
            icon={<WarningAmber />}
            title={t('adm.reqs.couldnTLoadRequests')}
            description={apiErrorMessage(loadError, t('adm.reqs.loadFailed'))}
            action={<Button size="small" variant="contained" startIcon={<Refresh />} onClick={fetchRequests}>{t('adm.reqs.tryAgain')}</Button>}
          />
        ) : isDesktop ? (
          <Box sx={{ overflowX: 'auto' }}><RequestsTable {...listProps} /></Box>
        ) : (
          <RequestCards {...listProps} />
        )}

        {!loadError && !loading && filtered.length > 0 && (
          <ListPagination
            noun="request"
            total={filtered.length}
            page={currentPage}
            rowsPerPage={rowsPerPage}
            onPage={setPage}
            onRowsPerPage={(n) => { setRowsPerPage(n); setPage(0); }}
            compact={isPhone}
          />
        )}
      </Paper>

      <PhotoDialog photo={viewPhoto} onClose={() => setViewPhoto(null)} />
      <DetailsDialog
        req={viewing}
        onClose={() => setViewing(null)}
        fullScreen={isPhone}
        busy={busyId === viewing?._id}
        canManage={isAdmin}
        onStatus={handleSetStatus}
        onEdit={openForm}
        onDelete={setConfirmDelete}
        onOpenPhoto={setViewPhoto}
      />
      <DeleteDialog req={confirmDelete} deleting={deleting} onCancel={() => setConfirmDelete(null)} onConfirm={handleDelete} />
      <RequestFormDialog
        open={formOpen}
        editing={!!editId}
        form={form}
        errors={fieldErrors}
        formError={formError}
        saving={saving}
        fullScreen={isPhone}
        hospitalOptions={hospitalOptions}
        photoPreview={photoPreview}
        onField={setField}
        onPickPhoto={pickPhoto}
        onRemovePhoto={removePhoto}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </Box>
  );
}
