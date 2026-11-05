'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Alert, IconButton, CircularProgress,
  Avatar, Tooltip, Tabs, Tab, InputAdornment, Skeleton, Snackbar, Menu, ListItemIcon, ListItemText,
  useMediaQuery, useTheme,
} from '@mui/material';
import {
  Add, Delete, Edit, PersonAdd, AddPhotoAlternateOutlined, LocalHospital, People, Search, Close, Refresh,
  Place, Phone, Email, WarningAmber, FilterAltOff, PhotoCamera, HideImageOutlined, MoreVert, LockReset,
  Visibility, VisibilityOff, PersonOff, CheckCircle,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '@/store/AuthContext';
import API_BASE, { uploadUrl } from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { formatDate, initialsOf, telHref } from '@/lib/format';
import { PageHeader, StatCard, StatusBadge, TableCard, EmptyState, ResponsiveGrid } from '@/components/ui';

const PASSWORD_MIN = 8; // must match Backend/src/staff/password-rules.js
const PHOTO_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const EMPTY_HOSPITAL = { name: '', address: '', city: '', phone: '', email: '', licenseNumber: '', lat: '', lng: '' };
const EMPTY_STAFF = { fullName: '', email: '', password: '', hospital: '' };

const hasCoords = (h) => Number.isFinite(h.location?.lat) && Number.isFinite(h.location?.lng);

// Hospital photo: uploaded files are served by the API, full URLs pass through.
const imageSrc = (image) => (image?.startsWith('/uploads/') ? `${API_BASE}${image}` : image || undefined);

export default function AdminHospitals() {
  const { token } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [hospitals, setHospitals] = useState(null);
  const [staff, setStaff] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('hospitals');
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoadError('');
    Promise.all([
      axios.get(`${API_BASE}/api/hospitals`, { headers }),
      axios.get(`${API_BASE}/api/staff`, { headers }),
    ])
      .then(([h, s]) => { setHospitals(h.data); setStaff(s.data); })
      .catch((err) => setLoadError(apiErrorMessage(err, 'Failed to load hospitals and staff.')));
  }, [headers]);
  useEffect(() => { load(); }, [load]);

  const loading = (!hospitals || !staff) && !loadError;
  const hospitalStaff = useMemo(() => (staff || []).filter((s) => s.role === 'hospital_staff'), [staff]);
  const staffOf = useCallback((id) => hospitalStaff.filter((s) => String(s.hospital?._id || s.hospital) === String(id)), [hospitalStaff]);
  const hospitalIds = useMemo(() => new Set((hospitals || []).map((h) => String(h._id))), [hospitals]);
  const orphaned = (s) => !s.hospital || !hospitalIds.has(String(s.hospital?._id || s.hospital));

  const stats = useMemo(() => ({
    hospitals: hospitals?.length || 0,
    staff: hospitalStaff.length,
    noStaff: (hospitals || []).filter((h) => staffOf(h._id).length === 0).length,
    onMap: (hospitals || []).filter(hasCoords).length,
  }), [hospitals, hospitalStaff, staffOf]);

  const q = search.trim().toLowerCase();
  const filteredHospitals = useMemo(() => (hospitals || [])
    .filter((h) => !q || [h.name, h.city, h.address, h.phone, h.email].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => a.name.localeCompare(b.name)), [hospitals, q]);
  const filteredStaff = useMemo(() => hospitalStaff
    .filter((s) => !q || [s.fullName, s.email, s.hospital?.name].some((v) => v?.toLowerCase().includes(q)))
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || '')), [hospitalStaff, q]);

  // ── Hospital add / edit ──
  const [hospitalDialog, setHospitalDialog] = useState(null); // { id?, form }
  const [hospitalErr, setHospitalErr] = useState('');
  const [saving, setSaving] = useState(false);
  const openHospital = (h) => {
    setHospitalErr('');
    setHospitalDialog(h ? {
      id: h._id,
      form: {
        name: h.name || '', address: h.address || '', city: h.city || '', phone: h.phone || '', email: h.email || '',
        licenseNumber: h.licenseNumber || '', lat: hasCoords(h) ? String(h.location.lat) : '', lng: hasCoords(h) ? String(h.location.lng) : '',
      },
    } : { form: EMPTY_HOSPITAL });
  };
  const setHField = (k) => (e) => { setHospitalDialog((d) => ({ ...d, form: { ...d.form, [k]: e.target.value } })); setHospitalErr(''); };

  const saveHospital = async () => {
    const { id, form } = hospitalDialog;
    if (!form.name.trim()) { setHospitalErr('Hospital name is required.'); return; }
    // Coordinates are optional; when given they let the booking page show "km away" and sort nearest first.
    const { lat, lng, ...details } = form;
    const payload = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, v.trim()]));
    if (lat !== '' || lng !== '') {
      const latN = Number(lat), lngN = Number(lng);
      if (lat === '' || lng === '' || !Number.isFinite(latN) || !Number.isFinite(lngN) || Math.abs(latN) > 90 || Math.abs(lngN) > 180) {
        setHospitalErr('Enter both latitude (-90 to 90) and longitude (-180 to 180), or leave both empty.');
        return;
      }
      payload.location = { lat: latN, lng: lngN };
    } else if (id) {
      payload.location = { lat: null, lng: null };
    }
    setSaving(true);
    try {
      if (id) await axios.put(`${API_BASE}/api/hospitals/${id}`, payload, { headers });
      else await axios.post(`${API_BASE}/api/hospitals`, payload, { headers });
      setHospitalDialog(null);
      setToast(id ? `${payload.name} updated.` : `${payload.name} added.`);
      load();
    } catch (err) {
      setHospitalErr(apiErrorMessage(err, 'Failed to save the hospital.'));
    } finally { setSaving(false); }
  };

  // ── Hospital photo ──
  const [photoBusy, setPhotoBusy] = useState(null);
  const uploadPhoto = async (h, file) => {
    if (!file) return;
    setPhotoBusy(h._id);
    setActionError('');
    try {
      const body = new FormData();
      body.append('image', file);
      await axios.post(`${API_BASE}/api/hospitals/${h._id}/image`, body, { headers });
      setToast(`Photo updated for ${h.name}.`);
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Failed to upload the photo.'));
    } finally { setPhotoBusy(null); }
  };
  const removePhoto = async (h) => {
    setPhotoBusy(h._id);
    setActionError('');
    try {
      await axios.delete(`${API_BASE}/api/hospitals/${h._id}/image`, { headers });
      setToast(`Photo removed from ${h.name}.`);
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Failed to remove the photo.'));
    } finally { setPhotoBusy(null); }
  };

  // ── Staff add / edit ──
  const [staffDialog, setStaffDialog] = useState(null); // { id?, form }
  const [staffErr, setStaffErr] = useState('');
  const [showPw, setShowPw] = useState(false);
  const openStaff = (s, hospitalId = '') => {
    setStaffErr('');
    setShowPw(false);
    setStaffDialog(s
      ? { id: s._id, form: { fullName: s.fullName || '', email: s.email, password: '', hospital: s.hospital?._id || s.hospital || '' } }
      : { form: { ...EMPTY_STAFF, hospital: hospitalId } });
  };
  const setSField = (k) => (e) => { setStaffDialog((d) => ({ ...d, form: { ...d.form, [k]: e.target.value } })); setStaffErr(''); };

  const saveStaff = async () => {
    const { id, form } = staffDialog;
    if (!form.fullName.trim()) { setStaffErr('Full name is required.'); return; }
    if (!id && !/\S+@\S+\.\S+/.test(form.email)) { setStaffErr('Enter a valid email address.'); return; }
    if (!form.hospital) { setStaffErr('Choose the hospital this account belongs to.'); return; }
    if ((!id || form.password) && form.password.length < PASSWORD_MIN) { setStaffErr(`Password must be at least ${PASSWORD_MIN} characters.`); return; }
    setSaving(true);
    try {
      if (id) {
        const body = { fullName: form.fullName.trim(), hospital: form.hospital };
        if (form.password) body.password = form.password;
        await axios.patch(`${API_BASE}/api/staff/${id}`, body, { headers });
      } else {
        await axios.post(`${API_BASE}/api/staff`, { ...form, fullName: form.fullName.trim(), email: form.email.trim(), role: 'hospital_staff' }, { headers });
      }
      setStaffDialog(null);
      setToast(id ? `${form.fullName.trim()} updated${form.password ? ' — new password set' : ''}.` : `Account created for ${form.fullName.trim()}.`);
      load();
    } catch (err) {
      setStaffErr(apiErrorMessage(err, 'Failed to save the staff account.'));
    } finally { setSaving(false); }
  };

  // ── Delete (hospital or staff) ──
  const [confirmDelete, setConfirmDelete] = useState(null); // { type, item }
  const [deleting, setDeleting] = useState(false);
  const doDelete = async () => {
    const { type, item } = confirmDelete;
    setDeleting(true);
    setActionError('');
    try {
      await axios.delete(`${API_BASE}/api/${type === 'hospital' ? 'hospitals' : 'staff'}/${item._id}`, { headers });
      setToast(`${type === 'hospital' ? item.name : item.fullName} deleted.`);
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Delete failed. Please try again.'));
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  // ── Row menu (hospitals) ──
  const [menu, setMenu] = useState(null); // { anchor, h }
  const closeMenu = () => setMenu(null);

  // ── Pieces ──
  const hospitalThumb = (h, size = 48) => (
    <Box position="relative" flexShrink={0}>
      <Avatar variant="rounded" src={imageSrc(h.image)} alt={h.image ? `Photo of ${h.name}` : ''}
        sx={(t) => ({ width: size * 1.4, height: size, borderRadius: '10px', bgcolor: t.custom.tones.primary.bg, color: 'primary.main' })}>
        <LocalHospital />
      </Avatar>
      {photoBusy === h._id && <CircularProgress size={20} sx={{ position: 'absolute', top: size / 2 - 10, left: size * 0.7 - 10 }} />}
    </Box>
  );

  const staffChips = (h) => {
    const list = staffOf(h._id);
    if (list.length === 0) {
      return <Button size="small" startIcon={<PersonAdd />} onClick={() => openStaff(null, h._id)} sx={{ px: 1 }}>Add staff</Button>;
    }
    return (
      <Box display="flex" alignItems="center" gap={0.75}>
        <Box display="flex">
          {list.slice(0, 3).map((s, i) => (
            <Tooltip key={s._id} title={s.fullName} arrow>
              <Avatar src={uploadUrl(s.photo)} alt={s.fullName}
                sx={(t) => ({ width: 30, height: 30, fontSize: '0.72rem', fontWeight: 700, ml: i ? -0.75 : 0, border: '2px solid', borderColor: 'background.paper', bgcolor: t.custom.tones.info.bg, color: t.custom.tones.info.fg })}>
                {initialsOf(s.fullName)}
              </Avatar>
            </Tooltip>
          ))}
        </Box>
        <Typography fontSize="0.8rem" color="text.secondary" noWrap>{list.length} account{list.length === 1 ? '' : 's'}</Typography>
      </Box>
    );
  };

  const hospitalActions = (h) => (
    <Box display="flex" justifyContent="flex-end" gap={0.25}>
      <Tooltip title="Edit hospital" arrow>
        <IconButton size="small" aria-label={`Edit ${h.name}`} onClick={() => openHospital(h)} sx={{ color: 'info.main' }}><Edit fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="More" arrow>
        <IconButton size="small" aria-label={`More actions for ${h.name}`} onClick={(e) => setMenu({ anchor: e.currentTarget, h })}><MoreVert fontSize="small" /></IconButton>
      </Tooltip>
    </Box>
  );

  const staffActions = (s) => (
    <Box display="flex" justifyContent="flex-end" gap={0.25}>
      <Tooltip title="Edit or reset password" arrow>
        <IconButton size="small" aria-label={`Edit ${s.fullName}`} onClick={() => openStaff(s)} sx={{ color: 'info.main' }}><Edit fontSize="small" /></IconButton>
      </Tooltip>
      <Tooltip title="Delete account" arrow>
        <IconButton size="small" aria-label={`Delete ${s.fullName}`} onClick={() => setConfirmDelete({ type: 'staff', item: s })} sx={{ color: 'error.main' }}><Delete fontSize="small" /></IconButton>
      </Tooltip>
    </Box>
  );

  const toolbar = (
    <Box display="flex" flexDirection="column" gap={1.5}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40, mx: -1 }}>
        {[
          { key: 'hospitals', label: 'Hospitals', icon: <LocalHospital />, count: stats.hospitals },
          { key: 'staff', label: 'Staff accounts', icon: <People />, count: stats.staff },
        ].map((t) => (
          <Tab key={t.key} value={t.key} icon={t.icon} iconPosition="start" sx={{ minHeight: 40, textTransform: 'none', fontWeight: 600 }}
            label={<Box display="flex" alignItems="center" gap={0.75}>{t.label}
              <Box component="span" sx={{ px: 0.8, minWidth: 20, height: 20, borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: tab === t.key ? 'primary.main' : 'action.hover', color: tab === t.key ? '#fff' : 'text.secondary' }}>
                {loading ? '·' : t.count}
              </Box>
            </Box>} />
        ))}
      </Tabs>
      <TextField size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ maxWidth: { sm: 420 } }}
        placeholder={tab === 'hospitals' ? 'Search name, city, phone…' : 'Search name, email, hospital…'}
        slotProps={{ input: {
          startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          endAdornment: search && <InputAdornment position="end"><IconButton size="small" aria-label="Clear search" onClick={() => setSearch('')}><Close fontSize="small" /></IconButton></InputAdornment>,
        } }} />
    </Box>
  );

  const empty = (what) => (
    <EmptyState
      icon={search ? <FilterAltOff /> : what === 'hospitals' ? <LocalHospital /> : <People />}
      title={search ? 'Nothing matches your search' : what === 'hospitals' ? 'No hospitals yet' : 'No staff accounts yet'}
      description={search ? 'Try another search term.' : what === 'hospitals'
        ? 'Add partner hospitals so donors can book appointments there.'
        : 'Create an account for each person who manages a hospital’s appointments, requests and stock.'}
      action={search ? <Button size="small" variant="outlined" onClick={() => setSearch('')}>Clear search</Button>
        : what === 'hospitals' ? <Button size="small" variant="contained" startIcon={<Add />} onClick={() => openHospital(null)}>Add hospital</Button>
          : <Button size="small" variant="contained" startIcon={<PersonAdd />} onClick={() => openStaff(null)} disabled={!hospitals?.length}>Add staff</Button>}
    />
  );

  const skeleton = isMobile
    ? <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>{[0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={110} />)}</Box>
    : <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}</Box>;

  const hospitalsView = filteredHospitals.length === 0 ? empty('hospitals') : isMobile ? (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {filteredHospitals.map((h) => (
        <Paper key={h._id} variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
          <Box display="flex" gap={1.5} alignItems="center">
            {hospitalThumb(h, 44)}
            <Box minWidth={0} flex={1}>
              <Typography fontWeight={700} noWrap>{h.name}</Typography>
              <Typography variant="body2" color="text.secondary" noWrap>{[h.city, h.phone].filter(Boolean).join(' · ') || '—'}</Typography>
            </Box>
            {hospitalActions(h)}
          </Box>
          <Box display="flex" alignItems="center" justifyContent="space-between" mt={1.5} pt={1.5} borderTop={1} borderColor="divider" gap={1} flexWrap="wrap">
            {staffChips(h)}
            <StatusBadge status="map" size="small" tone={hasCoords(h) ? 'success' : 'neutral'} label={hasCoords(h) ? 'On map' : 'No location'} />
          </Box>
        </Paper>
      ))}
    </Box>
  ) : (
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Hospital', 'Contact', 'Location', 'Staff', 'Actions'].map((h) => (
            <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ py: 1.5 }}>{h}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredHospitals.map((h) => (
          <TableRow key={h._id} hover>
            <TableCell sx={{ py: 1.25, maxWidth: 320 }}>
              <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
                {hospitalThumb(h, 40)}
                <Box minWidth={0}>
                  <Typography fontWeight={700} fontSize="0.88rem" noWrap title={h.name}>{h.name}</Typography>
                  <Typography fontSize="0.75rem" color="text.secondary" noWrap title={h.address}>{h.address || h.city || '—'}</Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell sx={{ maxWidth: 220 }}>
              {h.phone ? <Typography fontSize="0.84rem" component="a" href={telHref(h.phone)} sx={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>{h.phone}</Typography> : <Typography fontSize="0.84rem" color="text.disabled">No phone</Typography>}
              <Typography fontSize="0.75rem" color="text.secondary" noWrap title={h.email}>{h.email || '—'}</Typography>
            </TableCell>
            <TableCell>
              <Typography fontSize="0.84rem" mb={0.4}>{h.city || '—'}</Typography>
              <StatusBadge status="map" size="small" tone={hasCoords(h) ? 'success' : 'neutral'} label={hasCoords(h) ? 'On map' : 'No location'} />
            </TableCell>
            <TableCell>{staffChips(h)}</TableCell>
            <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap' }}>{hospitalActions(h)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const staffView = filteredStaff.length === 0 ? empty('staff') : isMobile ? (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {filteredStaff.map((s) => (
        <Paper key={s._id} variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar src={uploadUrl(s.photo)} alt={s.fullName} sx={(t) => ({ width: 44, height: 44, fontWeight: 700, bgcolor: t.custom.tones.info.bg, color: t.custom.tones.info.fg })}>{initialsOf(s.fullName)}</Avatar>
          <Box minWidth={0} flex={1}>
            <Typography fontWeight={700} noWrap>{s.fullName}</Typography>
            <Typography variant="body2" color={orphaned(s) ? 'warning.main' : 'text.secondary'} noWrap>{orphaned(s) ? 'No hospital assigned' : s.hospital?.name}</Typography>
          </Box>
          {staffActions(s)}
        </Paper>
      ))}
    </Box>
  ) : (
    <Table size="small">
      <TableHead>
        <TableRow>
          {['Name', 'Hospital', 'Added', 'Actions'].map((h) => <TableCell key={h} align={h === 'Actions' ? 'right' : 'left'} sx={{ py: 1.5 }}>{h}</TableCell>)}
        </TableRow>
      </TableHead>
      <TableBody>
        {filteredStaff.map((s) => (
          <TableRow key={s._id} hover>
            <TableCell sx={{ py: 1.25 }}>
              <Box display="flex" alignItems="center" gap={1.25}>
                <Avatar src={uploadUrl(s.photo)} alt={s.fullName} sx={(t) => ({ width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, bgcolor: t.custom.tones.info.bg, color: t.custom.tones.info.fg })}>{initialsOf(s.fullName)}</Avatar>
                <Box minWidth={0}>
                  <Typography fontWeight={700} fontSize="0.88rem" noWrap>{s.fullName}</Typography>
                  <Typography fontSize="0.75rem" color="text.secondary" noWrap>{s.email}</Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              {orphaned(s)
                ? <StatusBadge status="none" tone="warning" size="small" label="No hospital — reassign" />
                : <Box display="flex" alignItems="center" gap={0.75}><LocalHospital sx={{ fontSize: 16, color: 'primary.main' }} /><Typography fontSize="0.85rem">{s.hospital?.name}</Typography></Box>}
            </TableCell>
            <TableCell sx={{ color: 'text.secondary', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatDate(s.createdAt)}</TableCell>
            <TableCell align="right" sx={{ width: 1, whiteSpace: 'nowrap' }}>{staffActions(s)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const hd = hospitalDialog?.form;
  const sd = staffDialog?.form;
  const delItem = confirmDelete?.item;
  const delStaffCount = confirmDelete?.type === 'hospital' ? staffOf(delItem._id).length : 0;

  return (
    <Box>
      <PageHeader
        eyebrow="BloodLife AI · Admin"
        title="Hospitals & Staff"
        subtitle="Partner hospitals donors can book at, and the staff accounts that manage them."
        actions={<>
          <Button variant="outlined" startIcon={<Refresh />} onClick={load} disabled={loading}>Refresh</Button>
          <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => openStaff(null)} disabled={!hospitals?.length}>Add Staff</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => openHospital(null)}>Add Hospital</Button>
        </>}
      />

      <ResponsiveGrid min={150} gap={{ xs: 1.5, md: 2.5 }} sx={{ mb: 3 }}>
        <StatCard label="Hospitals" value={stats.hospitals} icon={<LocalHospital />} tone="primary" loading={loading} hint={isPhone ? undefined : 'Partner hospitals'} />
        <StatCard label="Staff" value={stats.staff} icon={<People />} tone="info" loading={loading} hint={isPhone ? undefined : 'Hospital accounts'} />
        <StatCard label="No staff" value={stats.noStaff} icon={<PersonOff />} tone={stats.noStaff ? 'warning' : 'success'} loading={loading} hint={isPhone ? undefined : 'Need an account'} />
        <StatCard label="On map" value={stats.onMap} icon={<Place />} tone="success" loading={loading} hint={isPhone ? undefined : 'Have a location set'} />
      </ResponsiveGrid>

      {actionError && <Alert severity="error" onClose={() => setActionError('')} sx={{ mb: 2 }}>{actionError}</Alert>}

      <TableCard minWidth={isMobile ? 0 : 760} toolbar={toolbar}>
        {loadError ? (
          <EmptyState icon={<WarningAmber />} title="Couldn’t load hospitals" description={loadError}
            action={<Button size="small" variant="contained" startIcon={<Refresh />} onClick={load}>Try again</Button>} />
        ) : loading ? skeleton : tab === 'hospitals' ? hospitalsView : staffView}
      </TableCard>

      {/* Hospital row menu */}
      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={closeMenu} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
        {menu && [
          <MenuItem key="photo" component="label">
            <ListItemIcon>{menu.h.image ? <PhotoCamera fontSize="small" /> : <AddPhotoAlternateOutlined fontSize="small" />}</ListItemIcon>
            <ListItemText>{menu.h.image ? 'Replace photo' : 'Upload photo'}</ListItemText>
            <input hidden type="file" accept={PHOTO_TYPES} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; const h = menu.h; closeMenu(); uploadPhoto(h, f); }} />
          </MenuItem>,
          menu.h.image && (
            <MenuItem key="rmphoto" onClick={() => { const h = menu.h; closeMenu(); removePhoto(h); }}>
              <ListItemIcon><HideImageOutlined fontSize="small" /></ListItemIcon><ListItemText>Remove photo</ListItemText>
            </MenuItem>
          ),
          <MenuItem key="staff" onClick={() => { const h = menu.h; closeMenu(); openStaff(null, h._id); }}>
            <ListItemIcon><PersonAdd fontSize="small" /></ListItemIcon><ListItemText>Add staff account</ListItemText>
          </MenuItem>,
          <MenuItem key="del" onClick={() => { const h = menu.h; closeMenu(); setConfirmDelete({ type: 'hospital', item: h }); }} sx={{ color: 'error.main' }}>
            <ListItemIcon><Delete fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete hospital</ListItemText>
          </MenuItem>,
        ]}
      </Menu>

      {/* Hospital add / edit */}
      <Dialog open={!!hospitalDialog} onClose={() => !saving && setHospitalDialog(null)} maxWidth="sm" fullWidth fullScreen={isPhone}>
        <DialogTitle fontWeight={800}>
          {hospitalDialog?.id ? 'Edit Hospital' : 'Add Hospital'}
          <Typography variant="body2" color="text.secondary" mt={0.5}>Only the name is required. Donors see these details when booking.</Typography>
        </DialogTitle>
        <DialogContent dividers>
          {hd && (
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2}>
              <TextField label="Hospital name" value={hd.name} onChange={setHField('name')} required autoFocus sx={{ gridColumn: '1 / -1' }} />
              <TextField label="Address" value={hd.address} onChange={setHField('address')} sx={{ gridColumn: '1 / -1' }} />
              <TextField label="City / Province" value={hd.city} onChange={setHField('city')} />
              <TextField label="Phone" type="tel" value={hd.phone} onChange={setHField('phone')} />
              <TextField label="Email" type="email" value={hd.email} onChange={setHField('email')} />
              <TextField label="License number" value={hd.licenseNumber} onChange={setHField('licenseNumber')} />
              <Typography variant="subtitle2" sx={{ gridColumn: '1 / -1', mt: 1, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Place fontSize="small" color="primary" /> Map location <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography>
              </Typography>
              <TextField type="number" label="Latitude" placeholder="11.5564" value={hd.lat} onChange={setHField('lat')} slotProps={{ htmlInput: { step: 'any', min: -90, max: 90 } }} />
              <TextField type="number" label="Longitude" placeholder="104.9282" value={hd.lng} onChange={setHField('lng')} slotProps={{ htmlInput: { step: 'any', min: -180, max: 180 } }} />
              <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1', mt: -1 }}>
                Right-click the place in Google Maps and click the coordinates to copy them. With a location, the booking page can show how far away the hospital is.
              </Typography>
            </Box>
          )}
          {hospitalErr && <Alert severity="error" sx={{ mt: 2 }}>{hospitalErr}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setHospitalDialog(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveHospital} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}>
            {hospitalDialog?.id ? 'Save Changes' : 'Add Hospital'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Staff add / edit */}
      <Dialog open={!!staffDialog} onClose={() => !saving && setStaffDialog(null)} maxWidth="xs" fullWidth fullScreen={isPhone}>
        <DialogTitle fontWeight={800}>
          {staffDialog?.id ? 'Edit Staff Account' : 'Add Staff Account'}
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {staffDialog?.id ? 'Leave the password empty to keep the current one.' : 'They sign in at /hospital/login with this email and password.'}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          {sd && (
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField label="Full name" value={sd.fullName} onChange={setSField('fullName')} required autoFocus />
              <TextField label="Email" type="email" value={sd.email} onChange={setSField('email')} required={!staffDialog.id}
                disabled={!!staffDialog.id} helperText={staffDialog.id ? 'The sign-in email can’t be changed.' : ' '} />
              <TextField select label="Hospital" value={sd.hospital} onChange={setSField('hospital')} required>
                {(hospitals || []).map((h) => <MenuItem key={h._id} value={h._id}>{h.name}</MenuItem>)}
              </TextField>
              <TextField label={staffDialog.id ? 'New password' : 'Password'} type={showPw ? 'text' : 'password'} value={sd.password}
                onChange={setSField('password')} required={!staffDialog.id} autoComplete="new-password"
                error={!!sd.password && sd.password.length < PASSWORD_MIN}
                helperText={`At least ${PASSWORD_MIN} characters.${staffDialog.id ? ' Share it with them securely.' : ''}`}
                slotProps={{ input: {
                  startAdornment: staffDialog.id ? <InputAdornment position="start"><LockReset fontSize="small" /></InputAdornment> : undefined,
                  endAdornment: <InputAdornment position="end"><IconButton size="small" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((v) => !v)}>{showPw ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment>,
                } }} />
            </Box>
          )}
          {staffErr && <Alert severity="error" sx={{ mt: 2 }}>{staffErr}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setStaffDialog(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={saveStaff} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}>
            {staffDialog?.id ? 'Save Changes' : 'Create Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onClose={() => !deleting && setConfirmDelete(null)} maxWidth="xs" fullWidth>
        {confirmDelete && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
              <Box sx={(t) => ({ width: 40, height: 40, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: t.custom.tones.error.bg, color: 'error.main' })}><Delete /></Box>
              {confirmDelete.type === 'hospital' ? 'Delete this hospital?' : 'Delete this staff account?'}
            </DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                {confirmDelete.type === 'hospital'
                  ? <><b>{delItem.name}</b> will be removed from the booking page and map. Existing appointments keep their details. This can&apos;t be undone.</>
                  : <><b>{delItem.fullName}</b> ({delItem.email}) will no longer be able to sign in. This can&apos;t be undone.</>}
              </Typography>
              {delStaffCount > 0 && (
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  {delStaffCount} staff account{delStaffCount === 1 ? '' : 's'} belong{delStaffCount === 1 ? 's' : ''} to this hospital. They are kept, but will need to be moved to another hospital.
                </Alert>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5 }}>
              <Button color="inherit" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
              <Button variant="contained" color="error" onClick={doDelete} disabled={deleting} startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <Delete />}>Delete</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3500} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
