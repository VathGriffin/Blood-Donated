'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  Alert, Avatar, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  IconButton, TextField, Typography, useMediaQuery,
} from '@mui/material';
import { ChatBubbleOutline, CheckCircle, Close, LockOutlined, Login, WaterDrop } from '@mui/icons-material';
import API_BASE, { uploadUrl } from '@/lib/config';
import { apiErrorMessage } from '@/lib/api-error';
import { formatDate, initialsOf } from '@/lib/format';
import { BLOOD_TYPES } from '@/lib/inventory';
import { GIVES_TO } from '@/lib/blood-compat';
import { eligibilityOf, validDate } from '@/lib/eligibility';
import { BloodTypeChip } from '@/components/ui';
import { AvailabilityBadge, relative } from './DonorsList';

// Must match MAX_MESSAGE_LENGTH in Backend/src/notification/message.routes.js.
const MAX_MESSAGE = 2000;

const PrivacyNote = ({ children }) => (
  <Box sx={{ p: 1.5, borderRadius: '10px', display: 'flex', gap: 1.25, alignItems: 'flex-start', bgcolor: (theme) => theme.custom.surface.subtle }}>
    <LockOutlined aria-hidden="true" sx={{ fontSize: 18, color: 'text.secondary', mt: '2px' }} />
    <Typography variant="body2" color="text.secondary">{children}</Typography>
  </Box>
);

/** Public profile of one donor: only the fields the directory API returns. */
export function DonorProfileDialog({ donor, onClose, onMessage }) {
  const { t } = useI18n();
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  if (!donor) return null;
  const { eligible, nextDate } = eligibilityOf(donor.lastDonation);
  const rows = [
    { label: t('directory.profile.location'), value: donor.location || t('directory.notGiven') },
    { label: t('directory.profile.lastDonation'), value: validDate(donor.lastDonation) ? `${formatDate(donor.lastDonation)} (${relative(donor.lastDonation)})` : t('directory.noneRecorded') },
    { label: t('directory.profile.canDonate'), value: eligible ? t('directory.profile.now') : t('directory.profile.from', { date: formatDate(nextDate) }) },
    { label: t('directory.profile.recorded'), value: donor.donationCount || 0 },
    { label: t('directory.profile.registered'), value: relative(donor.createdAt) || '—' },
  ];
  const givesTo = GIVES_TO[donor.bloodType] || [];
  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} maxWidth="xs" fullWidth aria-labelledby="donor-dialog-title"
      slotProps={{ paper: { sx: { borderRadius: { xs: 0, sm: (theme) => `${theme.custom.radius.dialog}px` } } } }}>
      <Box sx={{ position: 'relative', px: 3, pt: 3, pb: 2.5, bgcolor: (theme) => theme.custom.tones.primary.bg }}>
        <IconButton onClick={onClose} aria-label={t('common.close')} size="small" sx={{ position: 'absolute', top: 10, right: 10 }}>
          <Close fontSize="small" />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pr: 3 }}>
          <Avatar src={uploadUrl(donor.photo)} alt="" sx={{
            width: 64, height: 64, fontWeight: 700, fontSize: '1.3rem',
            bgcolor: 'background.paper', color: 'text.primary', border: '3px solid', borderColor: 'background.paper',
          }}>
            {initialsOf(donor.fullName)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography id="donor-dialog-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.25 }}>
              {donor.fullName || t('directory.profile.donor')}
            </Typography>
            <Box sx={{ mt: 0.75 }}><AvailabilityBadge donor={donor} /></Box>
          </Box>
          <BloodTypeChip type={donor.bloodType} size="large" />
        </Box>
      </Box>
      <DialogContent sx={{ px: 3, py: 2 }}>
        {rows.map((r, i) => (
          <Box key={r.label}>
            {i > 0 && <Divider />}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1.25 }}>
              <Typography variant="body2" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>{r.value}</Typography>
            </Box>
          </Box>
        ))}

        {givesTo.length > 0 && (
          <Box sx={{ mt: 1.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.75 }}>
              {t('directory.profile.givesTo', { type: donor.bloodType })}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {BLOOD_TYPES.map((bt) => {
                const ok = givesTo.includes(bt);
                return (
                  <Box key={bt} component="span" aria-hidden={!ok} sx={{
                    px: 1, py: 0.25, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700,
                    bgcolor: ok ? (th) => th.custom.tones.primary.bg : 'transparent',
                    color: ok ? 'primary.main' : 'text.disabled',
                    border: '1px solid', borderColor: ok ? 'transparent' : 'divider',
                    textDecoration: ok ? 'none' : 'line-through',
                  }}>
                    {bt}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>
          <PrivacyNote>
            {t('directory.profile.privacy')}
          </PrivacyNote>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.25, mt: 2.5, flexDirection: { xs: 'column', sm: 'row' } }}>
          <Button onClick={() => onMessage(donor)} variant="outlined" fullWidth startIcon={<ChatBubbleOutline />}>{t('directory.actions.message')}</Button>
          <Button component={Link} href="/requests" variant="contained" fullWidth startIcon={<WaterDrop />}>{t('directory.actions.request')}</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Message": there is no donor-to-donor messaging and donor contact details are private, so this
 * sends a note to the BloodLife team (POST /api/messages, signed-in donors only) naming the donor.
 * The team follows up, and replies show on the sender's Notifications page. Visitors are asked to
 * log in first; the API rejects the request without a donor login anyway.
 */
export function MessageTeamDialog({ donor, token, onClose }) {
  const fullScreen = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const { t } = useI18n();
  const city = donor?.location ? `, ${donor.location}` : '';
  // Starting text in the sender's language; they can rewrite it before sending.
  const [text, setText] = useState(
    donor ? t('directory.message.prefill', { name: donor.fullName || '', type: donor.bloodType || t('directory.message.unknownType'), place: city }) : '',
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  if (!donor) return null;

  const tooLong = text.trim().length > MAX_MESSAGE;
  const send = async () => {
    if (!text.trim()) { setError(t('directory.message.empty')); return; }
    if (tooLong) { setError(t('directory.message.tooLong', { max: MAX_MESSAGE })); return; }
    setSending(true);
    setError('');
    try {
      await axios.post(`${API_BASE}/api/messages`, { content: text.trim() }, { headers: { Authorization: `Bearer ${token}` } });
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, t('directory.message.failed')));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onClose={() => !sending && onClose()} fullScreen={fullScreen} maxWidth="sm" fullWidth aria-labelledby="message-dialog-title">
      <DialogTitle id="message-dialog-title" sx={{ fontWeight: 800, pr: 6 }}>
        {t('directory.message.title', { name: donor.fullName || t('directory.message.thisDonor') })}
        <IconButton onClick={onClose} aria-label={t('common.close')} size="small" disabled={sending} sx={{ position: 'absolute', top: 14, right: 14 }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {!token ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>{t('directory.message.loginText')}</Typography>
            <PrivacyNote>{t('directory.message.loginPrivacy')}</PrivacyNote>
          </Box>
        ) : sent ? (
          <Box role="status" sx={{ textAlign: 'center', py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.25 }}>
            <CheckCircle color="success" sx={{ fontSize: 48 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{t('directory.message.sentTitle')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
              {t('directory.message.sentText')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <PrivacyNote>
              {t('directory.message.note')}
            </PrivacyNote>
            <TextField
              label={t('directory.message.label')}
              multiline
              minRows={5}
              fullWidth
              autoFocus
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              error={tooLong}
              helperText={`${text.trim().length}/${MAX_MESSAGE}`}
              slotProps={{ htmlInput: { maxLength: MAX_MESSAGE + 200 } }}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {!token ? (
          <>
            <Button color="inherit" onClick={onClose}>{t('common.cancel')}</Button>
            <Button variant="contained" component={Link} href={`/login?next=${encodeURIComponent('/donor-directory')}`} startIcon={<Login />}>{t('directory.message.login')}</Button>
          </>
        ) : sent ? (
          <>
            <Button color="inherit" onClick={onClose}>{t('common.close')}</Button>
            <Button variant="contained" component={Link} href="/notification">{t('directory.message.toNotifications')}</Button>
          </>
        ) : (
          <>
            <Button color="inherit" onClick={onClose} disabled={sending}>{t('common.cancel')}</Button>
            <Button variant="contained" onClick={send} disabled={sending || !text.trim() || tooLong}
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <ChatBubbleOutline />}>
              {t(sending ? 'directory.message.sending' : 'directory.message.send')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
