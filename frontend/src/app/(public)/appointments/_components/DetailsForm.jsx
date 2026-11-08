'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { Box, MenuItem } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { AuthField } from '@/components/auth/authUi';
import Panel from './Panel';
import { BLOOD_TYPES } from './booking';

// Step 3: who is donating. A signed-in donor's email is locked to their account so the booking
// shows up in their profile (bookings are matched to profiles by exact email).
export default function DetailsForm({ form, onChange, emailLocked }) {
  const set = (name) => (e) => onChange(name, e.target.value);
  const { t } = useI18n();
  return (
    <Panel icon={<BadgeOutlinedIcon />} title={t('booking.details.title')} subtitle={t('booking.details.subtitle')}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.25, columnGap: 2.75 }}>
        <AuthField label={t('booking.details.fullName')} name="fullName" placeholder={t('booking.details.fullNamePlaceholder')} autoComplete="name"
          icon={<PersonOutlineIcon fontSize="small" />} value={form.fullName} onChange={set('fullName')} required />
        <AuthField label={t('booking.details.phone')} name="phone" type="tel" placeholder={t('booking.details.phonePlaceholder')} autoComplete="tel"
          icon={<PhoneOutlinedIcon fontSize="small" />} value={form.phone} onChange={set('phone')} required />
        <AuthField label={t('booking.details.email')} name="email" type="email" placeholder={t('booking.details.emailPlaceholder')} autoComplete="email"
          icon={<MailOutlineIcon fontSize="small" />} value={form.email} onChange={set('email')} required disabled={emailLocked}
          helperText={emailLocked ? t('booking.details.emailLocked') : undefined} />
        <AuthField select label={t('booking.details.bloodType')} name="bloodType" value={form.bloodType} onChange={set('bloodType')} required
          icon={<WaterDropOutlinedIcon fontSize="small" />}
          selectProps={{ displayEmpty: true, renderValue: (v) => v || <Box component="span" sx={{ color: 'text.disabled' }}>{t('booking.details.bloodTypePlaceholder')}</Box> }}>
          {BLOOD_TYPES.map((bt) => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
        </AuthField>
        <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
          <AuthField label={t('booking.details.notes')} name="notes" multiline rows={3} placeholder={t('booking.details.notesPlaceholder')}
            value={form.notes} onChange={set('notes')} sx={{ '& .MuiOutlinedInput-root': { alignItems: 'flex-start' } }} />
        </Box>
      </Box>
    </Panel>
  );
}
