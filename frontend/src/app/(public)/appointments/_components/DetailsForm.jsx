'use client';
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
  return (
    <Panel icon={<BadgeOutlinedIcon />} title="Your Details" subtitle="We'll use these to confirm your appointment">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.25, columnGap: 2.75 }}>
        <AuthField label="Full Name" name="fullName" placeholder="Enter your full name" autoComplete="name"
          icon={<PersonOutlineIcon fontSize="small" />} value={form.fullName} onChange={set('fullName')} required />
        <AuthField label="Phone Number" name="phone" type="tel" placeholder="Enter your phone number" autoComplete="tel"
          icon={<PhoneOutlinedIcon fontSize="small" />} value={form.phone} onChange={set('phone')} required />
        <AuthField label="Email Address" name="email" type="email" placeholder="Enter your email" autoComplete="email"
          icon={<MailOutlineIcon fontSize="small" />} value={form.email} onChange={set('email')} required disabled={emailLocked}
          helperText={emailLocked ? 'Using your account email so this appointment shows in your profile.' : undefined} />
        <AuthField select label="Blood Type" name="bloodType" value={form.bloodType} onChange={set('bloodType')} required
          icon={<WaterDropOutlinedIcon fontSize="small" />}
          selectProps={{ displayEmpty: true, renderValue: (v) => v || <Box component="span" sx={{ color: 'text.disabled' }}>Select your blood type</Box> }}>
          {BLOOD_TYPES.map((bt) => <MenuItem key={bt} value={bt}>{bt}</MenuItem>)}
        </AuthField>
        <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
          <AuthField label="Additional Notes (optional)" name="notes" multiline rows={3} placeholder="Anything the donation center should know?"
            value={form.notes} onChange={set('notes')} sx={{ '& .MuiOutlinedInput-root': { alignItems: 'flex-start' } }} />
        </Box>
      </Box>
    </Panel>
  );
}
