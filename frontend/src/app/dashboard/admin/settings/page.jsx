'use client';
import React, { useState } from 'react';
import {
  Box, Typography, Paper, useTheme, Avatar, List, ListItemButton,
  ListItemIcon, ListItemText, Divider, TextField, Switch, Button,
  Chip, Select, MenuItem, FormControl, InputLabel, Alert, IconButton,
  Table, TableBody, TableCell, TableHead, TableRow, Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Settings, SmartToy, LocalHospital, Bloodtype, CalendarMonth,
  Notifications, Security, Backup, Assignment, Key,
  Save, Add, Delete, Refresh, Visibility, VisibilityOff,
  CheckCircle, ContentCopy, Warning,
} from '@mui/icons-material';

const SECTIONS = [
  { id: 'general',     label: 'General',              icon: <Settings sx={{ fontSize: 18 }} /> },
  { id: 'ai',          label: 'AI Configuration',     icon: <SmartToy sx={{ fontSize: 18 }} /> },
  { id: 'hospitals',   label: 'Hospital Management',  icon: <LocalHospital sx={{ fontSize: 18 }} /> },
  { id: 'blood',       label: 'Blood Rules',          icon: <Bloodtype sx={{ fontSize: 18 }} /> },
  { id: 'appointment', label: 'Appointment Rules',    icon: <CalendarMonth sx={{ fontSize: 18 }} /> },
  { id: 'notifications', label: 'Notifications',      icon: <Notifications sx={{ fontSize: 18 }} /> },
  { id: 'security',    label: 'Security',             icon: <Security sx={{ fontSize: 18 }} /> },
  { id: 'backup',      label: 'Backup',               icon: <Backup sx={{ fontSize: 18 }} /> },
  { id: 'audit',       label: 'Audit Logs',           icon: <Assignment sx={{ fontSize: 18 }} /> },
  { id: 'api',         label: 'API Keys',             icon: <Key sx={{ fontSize: 18 }} /> },
];

const HOSPITALS = [
  { id: 1, name: 'Calmette Hospital', city: 'Phnom Penh', type: 'Public', status: 'Active' },
  { id: 2, name: 'Royal Phnom Penh Hospital', city: 'Phnom Penh', type: 'Private', status: 'Active' },
  { id: 3, name: 'Angkor Hospital for Children', city: 'Siem Reap', type: 'NGO', status: 'Active' },
  { id: 4, name: 'Battambang Provincial Hospital', city: 'Battambang', type: 'Public', status: 'Inactive' },
];

const AUDIT_LOGS = [
  { time: '2026-08-07 09:14', user: 'Admin', action: 'Updated donor Vith Vath', level: 'info' },
  { time: '2026-08-07 08:55', user: 'Admin', action: 'Deleted blood request #4812', level: 'warning' },
  { time: '2026-08-07 08:30', user: 'System', action: 'Auto-backup completed successfully', level: 'success' },
  { time: '2026-08-06 21:10', user: 'Admin', action: 'Changed JWT secret key', level: 'warning' },
  { time: '2026-08-06 18:44', user: 'System', action: 'Failed login attempt — 3 retries', level: 'error' },
  { time: '2026-08-06 14:22', user: 'Admin', action: 'Added hospital: Siem Reap Medical', level: 'info' },
];

const API_KEYS = [
  { id: 1, name: 'Anthropic AI', key: 'sk-ant-••••••••••••••••••••••••••••••••', created: '2026-07-01', status: 'Active' },
  { id: 2, name: 'Google Maps', key: 'AIza••••••••••••••••••••••••••••••••••', created: '2026-07-01', status: 'Active' },
  { id: 3, name: 'Google OAuth', key: '••••••••••••••.apps.googleusercontent.com', created: '2026-07-01', status: 'Active' },
];

const levelColor = (l) => ({ info: '#3b82f6', success: '#16a34a', warning: '#d97706', error: '#dc2626' }[l] || '#888');
const levelBg   = (l, dark) => ({
  info:    dark ? 'rgba(59,130,246,0.12)'  : '#eff6ff',
  success: dark ? 'rgba(22,163,74,0.12)'   : '#f0fdf4',
  warning: dark ? 'rgba(217,119,6,0.12)'   : '#fffbeb',
  error:   dark ? 'rgba(220,38,38,0.12)'   : '#fff0f0',
}[l] || (dark ? '#1a1a1a' : '#f5f5f5'));

export default function AdminSettings() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [section, setSection] = useState('general');
  const [saved, setSaved]     = useState(false);
  const [showKey, setShowKey] = useState({});

  // General state
  const [siteName, setSiteName]   = useState('BloodLife Platform');
  const [siteEmail, setSiteEmail] = useState('admin@bloodlife.kh');
  const [timezone, setTimezone]   = useState('Asia/Phnom_Penh');
  const [lang, setLang]           = useState('en');

  // AI state
  const [aiEnabled, setAiEnabled]       = useState(true);
  const [aiModel, setAiModel]           = useState('claude-sonnet-4-6');
  const [aiMaxTokens, setAiMaxTokens]   = useState(1024);
  const [aiTemp, setAiTemp]             = useState('0.7');
  const [aiApiKey, setAiApiKey]         = useState('sk-ant-api03-••••••••••••••••••••••');

  // Blood rules
  const [minAge, setMinAge]           = useState(18);
  const [maxAge, setMaxAge]           = useState(60);
  const [minWeight, setMinWeight]     = useState(45);
  const [intervalDays, setIntervalDays] = useState(90);

  // Appointment rules
  const [maxPerDay, setMaxPerDay]       = useState(20);
  const [slotMinutes, setSlotMinutes]   = useState(30);
  const [cancelHours, setCancelHours]   = useState(24);
  const [reminderHours, setReminderHours] = useState(12);

  // Notifications
  const [emailNotif, setEmailNotif]     = useState(true);
  const [smsNotif, setSmsNotif]         = useState(false);
  const [criticalAlert, setCriticalAlert] = useState(true);
  const [appointmentReminder, setAppointmentReminder] = useState(true);
  const [newDonorAlert, setNewDonorAlert] = useState(false);

  // Security
  const [mfa, setMfa]                       = useState(false);
  const [sessionMinutes, setSessionMinutes] = useState(480);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [passwordExpiry, setPasswordExpiry] = useState(90);

  // Hospitals
  const [hospitals, setHospitals] = useState(HOSPITALS);
  const [newHospital, setNewHospital] = useState({ name: '', city: '', type: 'Public' });

  const card  = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f1f1f' : '#e5e5e5';
  const subBg  = isDark ? '#0a0a0a' : '#f8f8f8';

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleKey = (id) => setShowKey(p => ({ ...p, [id]: !p[id] }));

  const addHospital = () => {
    if (!newHospital.name.trim()) return;
    setHospitals(p => [...p, { ...newHospital, id: Date.now(), status: 'Active' }]);
    setNewHospital({ name: '', city: '', type: 'Public' });
  };

  const removeHospital = (id) => setHospitals(p => p.filter(h => h.id !== id));

  const Row = ({ label, children }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5,
      borderBottom: `1px solid ${border}`, '&:last-child': { borderBottom: 'none' } }}>
      <Typography fontSize="0.88rem" fontWeight={500} color="text.secondary">{label}</Typography>
      <Box sx={{ minWidth: 240, display: 'flex', justifyContent: 'flex-end' }}>{children}</Box>
    </Box>
  );

  const SectionTitle = ({ children, sub }) => (
    <Box mb={2.5}>
      <Typography fontWeight={800} fontSize="1rem" letterSpacing="-0.01em">{children}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  );

  const renderContent = () => {
    switch (section) {

      /* ── GENERAL ── */
      case 'general':
        return (
          <Box>
            <SectionTitle sub="Platform identity and regional settings">General Settings</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 3 }}>
              <Box px={3} py={2}>
                <Row label="Platform Name">
                  <TextField size="small" value={siteName} onChange={e => setSiteName(e.target.value)} sx={{ width: 240 }} />
                </Row>
                <Row label="Admin Email">
                  <TextField size="small" value={siteEmail} onChange={e => setSiteEmail(e.target.value)} sx={{ width: 240 }} />
                </Row>
                <Row label="Timezone">
                  <FormControl size="small" sx={{ width: 240 }}>
                    <Select value={timezone} onChange={e => setTimezone(e.target.value)}>
                      <MenuItem value="Asia/Phnom_Penh">Asia/Phnom_Penh (UTC+7)</MenuItem>
                      <MenuItem value="Asia/Bangkok">Asia/Bangkok (UTC+7)</MenuItem>
                      <MenuItem value="UTC">UTC</MenuItem>
                    </Select>
                  </FormControl>
                </Row>
                <Row label="Language">
                  <FormControl size="small" sx={{ width: 240 }}>
                    <Select value={lang} onChange={e => setLang(e.target.value)}>
                      <MenuItem value="en">English</MenuItem>
                      <MenuItem value="km">Khmer</MenuItem>
                    </Select>
                  </FormControl>
                </Row>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: isDark ? 'rgba(220,38,38,0.06)' : '#fff0f0' }}>
              <Box display="flex" gap={1.5} alignItems="flex-start">
                <Warning sx={{ color: '#dc2626', fontSize: 20, mt: 0.1, flexShrink: 0 }} />
                <Box>
                  <Typography fontWeight={700} fontSize="0.85rem" color="error.main">Danger Zone</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                    These actions are irreversible. Proceed with caution.
                  </Typography>
                  <Button variant="outlined" color="error" size="small" sx={{ textTransform: 'none', borderRadius: 2, fontWeight: 600 }}>
                    Reset All Settings
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        );

      /* ── AI CONFIGURATION ── */
      case 'ai':
        return (
          <Box>
            <SectionTitle sub="Claude AI chatbot and assistant configuration">AI Configuration</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 3 }}>
              <Box px={3} py={2}>
                <Row label="Enable AI Assistant">
                  <Switch checked={aiEnabled} onChange={e => setAiEnabled(e.target.checked)} color="error" />
                </Row>
                <Row label="Model">
                  <FormControl size="small" sx={{ width: 240 }}>
                    <Select value={aiModel} onChange={e => setAiModel(e.target.value)} disabled={!aiEnabled}>
                      <MenuItem value="claude-sonnet-4-6">Claude Sonnet 4.6</MenuItem>
                      <MenuItem value="claude-haiku-4-5">Claude Haiku 4.5</MenuItem>
                      <MenuItem value="claude-opus-4-8">Claude Opus 4.8</MenuItem>
                    </Select>
                  </FormControl>
                </Row>
                <Row label="Max Tokens">
                  <TextField size="small" type="number" value={aiMaxTokens}
                    onChange={e => setAiMaxTokens(Number(e.target.value))}
                    disabled={!aiEnabled} sx={{ width: 240 }}
                    InputProps={{ inputProps: { min: 256, max: 4096 } }} />
                </Row>
                <Row label="Temperature">
                  <TextField size="small" type="number" value={aiTemp}
                    onChange={e => setAiTemp(e.target.value)}
                    disabled={!aiEnabled} sx={{ width: 240 }}
                    InputProps={{ inputProps: { min: 0, max: 1, step: 0.1 } }} />
                </Row>
                <Row label="Anthropic API Key">
                  <TextField size="small" type={showKey['ai'] ? 'text' : 'password'}
                    value={aiApiKey} onChange={e => setAiApiKey(e.target.value)}
                    disabled={!aiEnabled} sx={{ width: 240 }}
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => toggleKey('ai')}>
                          {showKey['ai'] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )}} />
                </Row>
              </Box>
            </Paper>
            <Alert severity="info" sx={{ borderRadius: 3, fontSize: '0.82rem' }}>
              The AI assistant uses rule-based fallback responses when the API key is not configured.
            </Alert>
          </Box>
        );

      /* ── HOSPITAL MANAGEMENT ── */
      case 'hospitals':
        return (
          <Box>
            <SectionTitle sub="Partner hospitals and blood centers">Hospital Management</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? '#1a1a1a' : '#fbe9e7' }}>
                  <TableRow>
                    {['Hospital Name', 'City', 'Type', 'Status', ''].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hospitals.map(h => (
                    <TableRow key={h.id} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{h.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>{h.city}</TableCell>
                      <TableCell>
                        <Chip label={h.type} size="small" variant="outlined"
                          sx={{ fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5 }} />
                      </TableCell>
                      <TableCell>
                        <Chip label={h.status} size="small"
                          sx={{ fontSize: '0.72rem', fontWeight: 700,
                            bgcolor: h.status === 'Active' ? (isDark ? 'rgba(22,163,74,0.15)' : '#f0fdf4') : (isDark ? '#1a1a1a' : '#f5f5f5'),
                            color: h.status === 'Active' ? '#16a34a' : '#9ca3af' }} />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Remove">
                          <IconButton size="small" color="error" onClick={() => removeHospital(h.id)}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card }}>
              <Typography fontWeight={700} fontSize="0.88rem" mb={2}>Add Hospital</Typography>
              <Box display="flex" gap={1.5} flexWrap="wrap" alignItems="flex-end">
                <TextField label="Name" size="small" value={newHospital.name}
                  onChange={e => setNewHospital(p => ({ ...p, name: e.target.value }))}
                  sx={{ flex: '2 1 180px' }} />
                <TextField label="City" size="small" value={newHospital.city}
                  onChange={e => setNewHospital(p => ({ ...p, city: e.target.value }))}
                  sx={{ flex: '1 1 130px' }} />
                <FormControl size="small" sx={{ flex: '1 1 120px' }}>
                  <InputLabel>Type</InputLabel>
                  <Select label="Type" value={newHospital.type}
                    onChange={e => setNewHospital(p => ({ ...p, type: e.target.value }))}>
                    {['Public', 'Private', 'NGO'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button variant="contained" color="error" startIcon={<Add />} onClick={addHospital}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, flexShrink: 0 }}>
                  Add
                </Button>
              </Box>
            </Paper>
          </Box>
        );

      /* ── BLOOD RULES ── */
      case 'blood':
        return (
          <Box>
            <SectionTitle sub="Eligibility and donation interval rules">Blood Rules</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' }}>
              <Box px={3} py={2}>
                <Row label="Minimum Donor Age (years)">
                  <TextField size="small" type="number" value={minAge} onChange={e => setMinAge(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 16, max: 25 } }} />
                </Row>
                <Row label="Maximum Donor Age (years)">
                  <TextField size="small" type="number" value={maxAge} onChange={e => setMaxAge(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 50, max: 70 } }} />
                </Row>
                <Row label="Minimum Weight (kg)">
                  <TextField size="small" type="number" value={minWeight} onChange={e => setMinWeight(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 40, max: 60 } }} />
                </Row>
                <Row label="Minimum Interval Between Donations (days)">
                  <TextField size="small" type="number" value={intervalDays} onChange={e => setIntervalDays(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 56, max: 180 } }} />
                </Row>
              </Box>
            </Paper>
          </Box>
        );

      /* ── APPOINTMENT RULES ── */
      case 'appointment':
        return (
          <Box>
            <SectionTitle sub="Scheduling and booking configuration">Appointment Rules</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' }}>
              <Box px={3} py={2}>
                <Row label="Max Appointments Per Day">
                  <TextField size="small" type="number" value={maxPerDay} onChange={e => setMaxPerDay(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 1, max: 100 } }} />
                </Row>
                <Row label="Slot Duration (minutes)">
                  <FormControl size="small" sx={{ width: 140 }}>
                    <Select value={slotMinutes} onChange={e => setSlotMinutes(e.target.value)}>
                      {[15, 20, 30, 45, 60].map(m => <MenuItem key={m} value={m}>{m} min</MenuItem>)}
                    </Select>
                  </FormControl>
                </Row>
                <Row label="Cancellation Window (hours)">
                  <TextField size="small" type="number" value={cancelHours} onChange={e => setCancelHours(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 1 } }} />
                </Row>
                <Row label="Reminder Sent Before (hours)">
                  <TextField size="small" type="number" value={reminderHours} onChange={e => setReminderHours(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 1 } }} />
                </Row>
              </Box>
            </Paper>
          </Box>
        );

      /* ── NOTIFICATIONS ── */
      case 'notifications':
        return (
          <Box>
            <SectionTitle sub="Alert channels and notification triggers">Notifications</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' }}>
              <Box px={3} py={2}>
                <Row label="Email Notifications">
                  <Switch checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)} color="error" />
                </Row>
                <Row label="SMS Notifications">
                  <Switch checked={smsNotif} onChange={e => setSmsNotif(e.target.checked)} color="error" />
                </Row>
                <Row label="Critical Stock Alerts">
                  <Switch checked={criticalAlert} onChange={e => setCriticalAlert(e.target.checked)} color="error" />
                </Row>
                <Row label="Appointment Reminders">
                  <Switch checked={appointmentReminder} onChange={e => setAppointmentReminder(e.target.checked)} color="error" />
                </Row>
                <Row label="New Donor Registered Alert">
                  <Switch checked={newDonorAlert} onChange={e => setNewDonorAlert(e.target.checked)} color="error" />
                </Row>
              </Box>
            </Paper>
          </Box>
        );

      /* ── SECURITY ── */
      case 'security':
        return (
          <Box>
            <SectionTitle sub="Authentication and access control">Security</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden', mb: 3 }}>
              <Box px={3} py={2}>
                <Row label="Two-Factor Authentication">
                  <Switch checked={mfa} onChange={e => setMfa(e.target.checked)} color="error" />
                </Row>
                <Row label="Session Timeout (minutes)">
                  <TextField size="small" type="number" value={sessionMinutes} onChange={e => setSessionMinutes(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 15 } }} />
                </Row>
                <Row label="Max Login Attempts">
                  <TextField size="small" type="number" value={maxLoginAttempts} onChange={e => setMaxLoginAttempts(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 3, max: 10 } }} />
                </Row>
                <Row label="Password Expiry (days)">
                  <TextField size="small" type="number" value={passwordExpiry} onChange={e => setPasswordExpiry(Number(e.target.value))}
                    sx={{ width: 140 }} InputProps={{ inputProps: { min: 30 } }} />
                </Row>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card }}>
              <Typography fontWeight={700} fontSize="0.88rem" mb={1.5}>Change Admin Password</Typography>
              <Box display="flex" flexDirection="column" gap={1.5} maxWidth={320}>
                <TextField label="Current Password" type="password" size="small" fullWidth />
                <TextField label="New Password" type="password" size="small" fullWidth />
                <TextField label="Confirm New Password" type="password" size="small" fullWidth />
                <Button variant="outlined" color="error" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, alignSelf: 'flex-start' }}>
                  Update Password
                </Button>
              </Box>
            </Paper>
          </Box>
        );

      /* ── BACKUP ── */
      case 'backup':
        return (
          <Box>
            <SectionTitle sub="Database backup and restore">Backup</SectionTitle>
            <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} mb={3}>
              {[
                { label: 'Last Backup', value: 'Aug 7, 2026 · 03:00 AM', color: '#16a34a' },
                { label: 'Backup Size', value: '24.6 MB', color: '#3b82f6' },
                { label: 'Total Backups', value: '31 files', color: '#7c3aed' },
                { label: 'Auto-Backup', value: 'Daily at 03:00', color: '#d97706' },
              ].map(s => (
                <Paper key={s.label} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing="0.06em">
                    {s.label}
                  </Typography>
                  <Typography fontWeight={800} fontSize="1.2rem" sx={{ color: s.color, mt: 0.5 }}>{s.value}</Typography>
                </Paper>
              ))}
            </Box>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, mb: 2 }}>
              <Typography fontWeight={700} fontSize="0.88rem" mb={2}>Manual Backup</Typography>
              <Box display="flex" gap={1.5} flexWrap="wrap">
                <Button variant="contained" color="error" startIcon={<Backup />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                  Backup Now
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<Refresh />}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}>
                  Restore from Backup
                </Button>
              </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card }}>
              <Typography fontWeight={700} fontSize="0.88rem" mb={0.5}>Auto-Backup Schedule</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Configure when automatic backups run
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap">
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Frequency</InputLabel>
                  <Select defaultValue="daily" label="Frequency">
                    <MenuItem value="hourly">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
                <TextField label="Time (24h)" size="small" defaultValue="03:00" sx={{ width: 120 }} />
                <TextField label="Retain (days)" size="small" type="number" defaultValue={30} sx={{ width: 120 }} />
              </Box>
            </Paper>
          </Box>
        );

      /* ── AUDIT LOGS ── */
      case 'audit':
        return (
          <Box>
            <SectionTitle sub="System activity and admin action history">Audit Logs</SectionTitle>
            <Paper elevation={0} sx={{ borderRadius: 3, border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: isDark ? '#1a1a1a' : '#fbe9e7' }}>
                  <TableRow>
                    {['Time', 'User', 'Action', 'Level'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', py: 1.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {AUDIT_LOGS.map((log, i) => (
                    <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{log.time}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{log.user}</TableCell>
                      <TableCell sx={{ fontSize: '0.82rem' }}>{log.action}</TableCell>
                      <TableCell>
                        <Chip label={log.level} size="small"
                          sx={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'capitalize',
                            bgcolor: levelBg(log.level, isDark), color: levelColor(log.level) }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        );

      /* ── API KEYS ── */
      case 'api':
        return (
          <Box>
            <SectionTitle sub="Third-party service integrations">API Keys</SectionTitle>
            <Box display="flex" flexDirection="column" gap={2}>
              {API_KEYS.map(k => (
                <Paper key={k.id} elevation={0} sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${border}`, bgcolor: card }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Box>
                      <Typography fontWeight={700} fontSize="0.9rem">{k.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Added {k.created}</Typography>
                    </Box>
                    <Chip label={k.status} size="small" icon={<CheckCircle sx={{ fontSize: '0.75rem !important', color: '#16a34a !important' }} />}
                      sx={{ bgcolor: isDark ? 'rgba(22,163,74,0.12)' : '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.72rem' }} />
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}
                    sx={{ bgcolor: subBg, borderRadius: 2, px: 1.5, py: 1, border: `1px solid ${border}` }}>
                    <Typography fontFamily="monospace" fontSize="0.8rem" flex={1} noWrap color="text.secondary">
                      {showKey[k.id] ? k.key : k.key}
                    </Typography>
                    <Tooltip title="Copy">
                      <IconButton size="small" onClick={() => navigator.clipboard?.writeText(k.key)}>
                        <ContentCopy sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box display="flex" gap={1} mt={1.5}>
                    <Button size="small" variant="outlined" color="error"
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.78rem' }}>
                      Regenerate
                    </Button>
                    <Button size="small" variant="outlined" color="inherit"
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, fontSize: '0.78rem' }}>
                      Revoke
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: '#b71c1c', width: 52, height: 52 }}>
            <Settings sx={{ fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={800}
              sx={{ background: 'linear-gradient(to right, #b71c1c, #d32f2f)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1.2 }}>
              System Settings
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure platform behaviour and integrations
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1} alignItems="center">
          {saved && (
            <Chip icon={<CheckCircle sx={{ fontSize: '0.9rem !important' }} />}
              label="Saved" size="small"
              sx={{ bgcolor: isDark ? 'rgba(22,163,74,0.15)' : '#f0fdf4', color: '#16a34a', fontWeight: 700 }} />
          )}
          <Button variant="contained" color="error" startIcon={<Save />} onClick={handleSave}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 2.5 }}>
            Save Changes
          </Button>
        </Box>
      </Box>

      <Box display="flex" gap={2.5} alignItems="flex-start">
        {/* Sidebar nav */}
        <Paper elevation={0} sx={{
          width: 220, flexShrink: 0, borderRadius: 3,
          border: `1px solid ${border}`, bgcolor: card, overflow: 'hidden',
        }}>
          <List dense disablePadding sx={{ py: 1 }}>
            {SECTIONS.map((s, i) => (
              <React.Fragment key={s.id}>
                {i > 0 && i % 5 === 0 && <Divider sx={{ borderColor: border, mx: 1.5, my: 0.5 }} />}
                <ListItemButton selected={section === s.id} onClick={() => setSection(s.id)}
                  sx={{
                    mx: 1, borderRadius: 2, mb: 0.3, py: 0.9,
                    '&.Mui-selected': {
                      bgcolor: isDark ? 'rgba(220,38,38,0.12)' : '#fff0f0',
                      color: '#dc2626',
                      '& .MuiListItemIcon-root': { color: '#dc2626' },
                    },
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa' },
                  }}>
                  <ListItemIcon sx={{ minWidth: 32, color: section === s.id ? '#dc2626' : 'text.disabled' }}>
                    {s.icon}
                  </ListItemIcon>
                  <ListItemText primary={s.label}
                    primaryTypographyProps={{ fontSize: '0.845rem', fontWeight: section === s.id ? 700 : 500 }} />
                </ListItemButton>
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Content panel */}
        <Box flex={1} minWidth={0}>
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
}
