'use client';
import Link from 'next/link';
import {
  Alert, Avatar, Box, Button, Checkbox, Chip, CircularProgress, FormControlLabel, IconButton, MenuItem, OutlinedInput,
  Select, Skeleton, Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { hospitalImageUrl, HOSPITAL_FALLBACK_IMAGE } from '@/app/(public)/appointments/_components/booking';
import {
  BLOOD_TYPES, COMPONENTS, MAX_AGE, MAX_REASON, MAX_UNITS, QUICK_REASONS, URGENCY, maxRequiredBy, minRequiredBy, urgencyOf,
} from './formModel';

const URGENCY_ICON = {
  Critical: <ReportProblemIcon />, High: <WarningAmberIcon />, Medium: <InfoOutlinedIcon />, Low: <CheckCircleOutlineIcon />,
};

const inputSx = {
  borderRadius: '10px', bgcolor: 'background.paper', fontSize: '0.92rem',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
  '& input::placeholder, & textarea::placeholder': { color: 'text.secondary', opacity: 0.8 },
};
const adornSx = { color: 'text.secondary', fontSize: 20, mr: 1, flexShrink: 0 };

// Label above the control, a required star, and the error / hint underneath. The error text
// is tied to the control through aria-describedby (ids `${id}-error` / `${id}-hint`).
function Field({ id, label, required, error, hint, children, sx }) {
  return (
    <Box id={`field-${id}`} sx={{ minWidth: 0, ...sx }}>
      <Typography component="label" htmlFor={id} id={`${id}-label`}
        sx={{ display: 'block', fontWeight: 700, fontSize: '0.88rem', mb: 0.75, color: 'text.primary' }}>
        {label}
        {required && <Box component="span" aria-hidden="true" sx={{ color: 'primary.main', ml: 0.4 }}>*</Box>}
        {!required && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 500, ml: 0.5, fontSize: '0.8rem' }}>(optional)</Box>}
      </Typography>
      {children}
      {error ? (
        <Typography id={`${id}-error`} role="alert" sx={{ mt: 0.6, color: 'error.main', fontSize: '0.8rem', fontWeight: 600 }}>{error}</Typography>
      ) : hint ? (
        <Typography id={`${id}-hint`} sx={{ mt: 0.6, color: 'text.secondary', fontSize: '0.78rem' }}>{hint}</Typography>
      ) : null}
    </Box>
  );
}

const describedBy = (id, error, hint) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

function HospitalOption({ hospital, compact }) {
  const place = [hospital.address, hospital.city].filter(Boolean).join(', ');
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, width: '100%' }}>
      <Avatar variant="rounded" src={hospitalImageUrl(hospital.image) || HOSPITAL_FALLBACK_IMAGE} alt=""
        sx={{ width: compact ? 40 : 52, height: compact ? 40 : 52, borderRadius: '8px', bgcolor: '#EEF2F7' }}>
        <LocalHospitalOutlinedIcon />
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{hospital.name}</Typography>
        {place && (
          <Typography noWrap sx={{ fontSize: '0.78rem', color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <PlaceOutlinedIcon aria-hidden="true" sx={{ fontSize: 14 }} />{place}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/**
 * The Request Blood form. State lives in the page (the side panels read the chosen hospital);
 * this component renders it and reports changes. `errors` holds only the errors to show now.
 */
export default function RequestForm({
  form, set, errors, hospitals, hospitalsState, onRetryHospitals, accountEmail, submitting, onSubmit, banner,
}) {
  const urgency = urgencyOf(form.urgency);
  const err = (key) => errors[key] || '';

  const addReason = (label) => {
    const current = form.reason.trim();
    if (current.toLowerCase().includes(label.toLowerCase())) return;
    set('reason', (current ? `${current}, ${label}` : label).slice(0, MAX_REASON));
  };

  const step = (delta) => set('unitsNeeded', Math.min(MAX_UNITS, Math.max(1, form.unitsNeeded + delta)));

  return (
    <Box component="section" aria-labelledby="request-form-title" sx={{
      bgcolor: 'background.paper', borderRadius: '16px', border: '1px solid', borderColor: 'divider',
      boxShadow: (t) => t.custom.shadow.sm, p: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
        <Box aria-hidden="true" sx={{
          width: 40, height: 40, borderRadius: '10px', display: 'grid', placeItems: 'center',
          bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main',
        }}>
          <AssignmentOutlinedIcon />
        </Box>
        <Typography id="request-form-title" component="h2" sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.01em' }}>
          Request Information
        </Typography>
      </Box>

      {banner}

      <Box component="form" noValidate onSubmit={onSubmit} aria-describedby="required-note"
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, columnGap: 2, rowGap: 2.25 }}>
        <Typography id="required-note" sx={{ gridColumn: '1 / -1', fontSize: '0.8rem', color: 'text.secondary', mt: -0.5 }}>
          Fields marked <Box component="span" sx={{ color: 'primary.main', fontWeight: 700 }}>*</Box> are required.
        </Typography>

        {/* Hospital */}
        <Field id="hospitalId" label="Hospital" required error={err('hospitalId')} sx={{ gridColumn: '1 / -1' }}
          hint={hospitalsState === 'ready' && !hospitals.length ? 'No hospitals are registered on BloodLife yet.' : undefined}>
          {hospitalsState === 'loading' ? (
            <Skeleton variant="rounded" height={68} sx={{ borderRadius: '10px' }} />
          ) : hospitalsState === 'error' ? (
            <Alert severity="error" sx={{ borderRadius: '10px' }}
              action={<Button color="inherit" size="small" onClick={onRetryHospitals}>Retry</Button>}>
              Couldn&apos;t load the hospital list.
            </Alert>
          ) : (
            <Select id="hospitalId" labelId="hospitalId-label" value={form.hospitalId} displayEmpty fullWidth
              onChange={(e) => set('hospitalId', e.target.value)} error={!!err('hospitalId')}
              disabled={!hospitals.length}
              SelectDisplayProps={{ 'aria-required': true, 'aria-invalid': !!err('hospitalId'), 'aria-describedby': describedBy('hospitalId', err('hospitalId')) }}
              renderValue={(value) => {
                const h = hospitals.find((x) => x._id === value);
                return h ? <HospitalOption hospital={h} />
                  : <Typography sx={{ color: 'text.secondary', fontSize: '0.92rem', py: 1.4 }}>Select a hospital</Typography>;
              }}
              MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360, borderRadius: '12px' } } } }}
              sx={{ ...inputSx, '& .MuiSelect-select': { py: 1, display: 'flex' } }}>
              {hospitals.map((h) => (
                <MenuItem key={h._id} value={h._id} sx={{ py: 1 }}><HospitalOption hospital={h} compact /></MenuItem>
              ))}
            </Select>
          )}
        </Field>

        {/* Patient */}
        <Field id="patientName" label="Patient Name" required error={err('patientName')}>
          <OutlinedInput id="patientName" fullWidth value={form.patientName} placeholder="Full name"
            onChange={(e) => set('patientName', e.target.value)} error={!!err('patientName')} autoComplete="off"
            startAdornment={<PersonOutlineIcon aria-hidden="true" sx={adornSx} />}
            inputProps={{ maxLength: 100, 'aria-required': true, 'aria-invalid': !!err('patientName'), 'aria-describedby': describedBy('patientName', err('patientName')) }}
            sx={inputSx} />
        </Field>
        <Field id="patientAge" label="Patient Age" error={err('patientAge')}>
          <OutlinedInput id="patientAge" fullWidth value={form.patientAge} placeholder="Years"
            onChange={(e) => set('patientAge', e.target.value.replace(/\D/g, '').slice(0, 3))} error={!!err('patientAge')}
            startAdornment={<CakeOutlinedIcon aria-hidden="true" sx={adornSx} />}
            inputProps={{ inputMode: 'numeric', 'aria-invalid': !!err('patientAge'), 'aria-describedby': describedBy('patientAge', err('patientAge')), min: 0, max: MAX_AGE }}
            sx={inputSx} />
        </Field>

        {/* Blood */}
        <Field id="bloodType" label="Blood Type" required error={err('bloodType')}>
          <Select id="bloodType" labelId="bloodType-label" value={form.bloodType} displayEmpty fullWidth
            onChange={(e) => set('bloodType', e.target.value)} error={!!err('bloodType')}
            SelectDisplayProps={{ 'aria-required': true, 'aria-invalid': !!err('bloodType'), 'aria-describedby': describedBy('bloodType', err('bloodType')) }}
            startAdornment={<WaterDropIcon aria-hidden="true" sx={{ ...adornSx, color: 'primary.main' }} />}
            renderValue={(v) => v || <Box component="span" sx={{ color: 'text.secondary' }}>Select</Box>}
            sx={{ ...inputSx, fontWeight: 700 }}>
            {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t} sx={{ fontWeight: 700 }}>{t}</MenuItem>)}
          </Select>
        </Field>
        <Field id="component" label="Blood Component" required error={err('component')}>
          <Select id="component" labelId="component-label" value={form.component} fullWidth
            onChange={(e) => set('component', e.target.value)} error={!!err('component')}
            SelectDisplayProps={{ 'aria-required': true, 'aria-describedby': describedBy('component', err('component')) }}
            startAdornment={<ScienceOutlinedIcon aria-hidden="true" sx={adornSx} />}
            sx={inputSx}>
            {COMPONENTS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </Field>

        {/* Quantity + urgency */}
        <Field id="unitsNeeded" label="Quantity (units)" required error={err('unitsNeeded')} hint={`1 to ${MAX_UNITS} units per request`}>
          <Box sx={{
            display: 'flex', alignItems: 'stretch', height: 44, borderRadius: '10px', border: '1px solid', overflow: 'hidden',
            borderColor: err('unitsNeeded') ? 'error.main' : 'divider', bgcolor: 'background.paper',
            '&:focus-within': { borderColor: 'primary.main', boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.14)}` },
          }}>
            <IconButton aria-label="One unit fewer" onClick={() => step(-1)} disabled={form.unitsNeeded <= 1}
              sx={{ borderRadius: 0, width: 44, borderRight: '1px solid', borderColor: 'divider' }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <Box component="input" id="unitsNeeded" type="text" inputMode="numeric" value={form.unitsNeeded}
              aria-required="true" aria-describedby={describedBy('unitsNeeded', err('unitsNeeded'), 'hint')}
              onChange={(e) => {
                const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
                set('unitsNeeded', Number.isNaN(n) ? 1 : Math.min(MAX_UNITS, Math.max(1, n)));
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp') { e.preventDefault(); step(1); }
                if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
              }}
              sx={{
                flex: 1, minWidth: 0, border: 0, outline: 0, textAlign: 'center', fontWeight: 700, fontSize: '0.95rem',
                bgcolor: 'transparent', color: 'text.primary', fontFamily: 'inherit',
              }} />
            <IconButton aria-label="One unit more" onClick={() => step(1)} disabled={form.unitsNeeded >= MAX_UNITS}
              sx={{ borderRadius: 0, width: 44, borderLeft: '1px solid', borderColor: 'divider' }}>
              <AddIcon fontSize="small" />
            </IconButton>
            <Box aria-hidden="true" sx={{
              px: 1.5, display: 'flex', alignItems: 'center', borderLeft: '1px solid', borderColor: 'divider',
              color: 'text.secondary', fontSize: '0.85rem', bgcolor: (t) => t.custom.surface.subtle,
            }}>
              units
            </Box>
          </Box>
        </Field>
        <Field id="urgency" label="Urgency Level" required error={err('urgency')} hint={urgency?.hint}>
          <Select id="urgency" labelId="urgency-label" value={form.urgency} displayEmpty fullWidth
            onChange={(e) => set('urgency', e.target.value)} error={!!err('urgency')}
            SelectDisplayProps={{ 'aria-required': true, 'aria-invalid': !!err('urgency'), 'aria-describedby': describedBy('urgency', err('urgency'), urgency?.hint) }}
            renderValue={(v) => {
              const u = urgencyOf(v);
              if (!u) return <Box component="span" sx={{ color: 'text.secondary' }}>Select</Box>;
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 700, color: (t) => t.custom.tones[u.tone].fg, '& svg': { fontSize: 20 } }}>
                  {URGENCY_ICON[u.value]}{u.value}
                </Box>
              );
            }}
            sx={inputSx}>
            {URGENCY.map((u) => (
              <MenuItem key={u.value} value={u.value} sx={{ gap: 1.25, alignItems: 'flex-start', py: 1 }}>
                <Box aria-hidden="true" sx={{ color: (t) => t.custom.tones[u.tone].fg, display: 'flex', mt: '1px', '& svg': { fontSize: 20 } }}>{URGENCY_ICON[u.value]}</Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{u.value}</Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary' }}>{u.hint}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </Field>

        {/* When + contact */}
        <Field id="requiredBy" label="Required By" error={err('requiredBy')} hint="Date and time the patient needs the blood">
          <OutlinedInput id="requiredBy" type="datetime-local" fullWidth value={form.requiredBy}
            onChange={(e) => set('requiredBy', e.target.value)} error={!!err('requiredBy')}
            startAdornment={<EventOutlinedIcon aria-hidden="true" sx={adornSx} />}
            inputProps={{ min: minRequiredBy(), max: maxRequiredBy(), 'aria-invalid': !!err('requiredBy'), 'aria-describedby': describedBy('requiredBy', err('requiredBy'), 'hint') }}
            sx={{ ...inputSx, '& input': { colorScheme: 'inherit' } }} />
        </Field>
        <Field id="contact" label="Contact Number" required error={err('contact')}>
          <OutlinedInput id="contact" type="tel" fullWidth value={form.contact} placeholder="e.g. 012 345 678"
            onChange={(e) => set('contact', e.target.value.slice(0, 20))} error={!!err('contact')} autoComplete="tel"
            startAdornment={<PhoneOutlinedIcon aria-hidden="true" sx={adornSx} />}
            inputProps={{ 'aria-required': true, 'aria-invalid': !!err('contact'), 'aria-describedby': describedBy('contact', err('contact')) }}
            sx={inputSx} />
        </Field>

        <Field id="contactEmail" label="Contact Email" sx={{ gridColumn: '1 / -1' }}
          hint="Your account email. Updates about this request are sent here and to your notifications.">
          <OutlinedInput id="contactEmail" fullWidth value={accountEmail || ''} readOnly
            startAdornment={<MailOutlineIcon aria-hidden="true" sx={adornSx} />}
            inputProps={{ 'aria-readonly': true, 'aria-describedby': 'contactEmail-hint' }}
            sx={{ ...inputSx, bgcolor: (t) => t.custom.surface.subtle, color: 'text.secondary' }} />
        </Field>

        {/* Reason */}
        <Field id="reason" label="Reason / Medical Information" required error={err('reason')} sx={{ gridColumn: '1 / -1' }}>
          <Box sx={{ position: 'relative' }}>
            <OutlinedInput id="reason" fullWidth multiline minRows={4} value={form.reason}
              placeholder="E.g. Patient needs emergency surgery. Diagnosis, ward or doctor's name if known."
              onChange={(e) => set('reason', e.target.value.slice(0, MAX_REASON))} error={!!err('reason')}
              inputProps={{ maxLength: MAX_REASON, 'aria-required': true, 'aria-invalid': !!err('reason'), 'aria-describedby': `reason-count ${describedBy('reason', err('reason')) || ''}`.trim() }}
              sx={{ ...inputSx, pb: 3.5, alignItems: 'flex-start', fontSize: '0.88rem' }} />
            <Typography id="reason-count" aria-live="polite" sx={{
              position: 'absolute', right: 12, bottom: 8, fontSize: '0.75rem',
              color: form.reason.length >= MAX_REASON ? 'error.main' : 'text.secondary',
            }}>
              {form.reason.length}/{MAX_REASON}
            </Typography>
          </Box>
          <Box role="group" aria-label="Add a common reason" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
            {QUICK_REASONS.map((r) => (
              <Chip key={r} label={`+ ${r}`} size="small" variant="outlined" onClick={() => addReason(r)}
                sx={{ fontWeight: 600, fontSize: '0.75rem', borderColor: 'divider', color: 'text.secondary' }} />
            ))}
          </Box>
        </Field>

        {/* Confirmation + actions */}
        <Box id="field-confirmed" sx={{ gridColumn: '1 / -1' }}>
          <FormControlLabel
            control={(
              <Checkbox checked={form.confirmed} onChange={(e) => set('confirmed', e.target.checked)}
                inputProps={{ 'aria-required': true, 'aria-invalid': !!err('confirmed'), 'aria-describedby': err('confirmed') ? 'confirmed-error' : undefined }}
                sx={{ color: err('confirmed') ? 'error.main' : undefined }} />
            )}
            label={<Typography sx={{ fontSize: '0.86rem' }}>I confirm that the information provided is accurate.<Box component="span" aria-hidden="true" sx={{ color: 'primary.main', ml: 0.4 }}>*</Box></Typography>}
            sx={{ mr: 0, alignItems: 'center' }} />
          {err('confirmed') && (
            <Typography id="confirmed-error" role="alert" sx={{ color: 'error.main', fontSize: '0.8rem', fontWeight: 600, ml: 4 }}>{err('confirmed')}</Typography>
          )}
        </Box>

        <Box sx={{ gridColumn: '1 / -1', display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexDirection: { xs: 'column-reverse', sm: 'row' } }}>
          <Button component={Link} href="/my-requests" variant="outlined" color="inherit" size="large" disabled={submitting}
            sx={{ minWidth: 130, borderColor: 'divider', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" size="large" disabled={submitting} aria-busy={submitting}
            startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon sx={{ transform: 'rotate(-30deg)' }} />}
            sx={{ minWidth: 210, fontWeight: 700, boxShadow: 'none' }}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
