'use client';
import Link from 'next/link';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import HourglassTopRoundedIcon from '@mui/icons-material/HourglassTopRounded';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useI18n } from '@/i18n/I18nProvider';
import { ELIGIBILITY_INTERVAL_DAYS, eligibilityOf, validDate } from '@/lib/eligibility';
import { formatDate } from '@/lib/format';

const CRITERIA = ['age', 'weight', 'healthy', 'interval'];

/**
 * Answer to "Check my eligibility". The general criteria are BloodLife's published ones (the home
 * page's quick check); the only thing read from the donor's record is the last donation date,
 * checked against the platform's 56-day rule (lib/eligibility.js, same as the backend).
 * `record`: { status: 'loading' | 'found' | 'none' | 'error', lastDonation }.
 */
export default function EligibilityCard({ record }) {
  const { t, rich } = useI18n();
  const k = (key, vars) => t(`aiChat.eligibility.${key}`, { days: ELIGIBILITY_INTERVAL_DAYS, ...vars });

  const canBook = record.status === 'found' && eligibilityOf(record.lastDonation).eligible;
  let result = null;
  if (record.status === 'loading') {
    result = (
      <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.88rem' }}>
        <CircularProgress size={16} color="error" /> {k('checking')}
      </Box>
    );
  } else if (record.status === 'found') {
    const { eligible, nextDate } = eligibilityOf(record.lastDonation);
    const has = validDate(record.lastDonation);
    const text = !has ? k('eligibleNever')
      : eligible ? k('eligibleNow', { date: formatDate(record.lastDonation) })
        : k('notYet', { date: formatDate(record.lastDonation), next: formatDate(nextDate) });
    result = (
      <Box sx={(theme) => ({
        p: 1.5, borderRadius: '12px',
        bgcolor: alpha(eligible ? theme.palette.success.main : theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.14 : 0.08),
        border: '1px solid', borderColor: alpha(eligible ? theme.palette.success.main : theme.palette.warning.main, 0.3),
      })}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
          {eligible
            ? <CheckCircleRoundedIcon sx={{ fontSize: 18, color: 'success.main' }} />
            : <HourglassTopRoundedIcon sx={{ fontSize: 18, color: 'warning.main' }} />}
          {k('recordTitle')}
        </Typography>
        <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6 }}>{text}</Typography>
      </Box>
    );
  } else if (record.status === 'none') {
    result = (
      <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.6 }}>
        {rich('aiChat.eligibility.noRecord', { link: <Link href="/donate" style={{ color: 'inherit', fontWeight: 700 }}>{k('register')}</Link> })}
      </Typography>
    );
  } else if (record.status === 'error') {
    result = <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>{k('recordFailed')}</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Typography sx={{ fontSize: '0.92rem' }}>{k('general')}</Typography>
      <Box component="ul" sx={(theme) => ({
        m: 0, p: 1.25, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0.75, borderRadius: '10px',
        bgcolor: 'background.paper', border: '1px solid', borderColor: theme.palette.divider,
      })}>
        {CRITERIA.map((c) => (
          <Box component="li" key={c} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, fontSize: '0.9rem' }}>
            <CheckCircleRoundedIcon aria-hidden="true" sx={{ fontSize: 18, color: 'success.main', mt: '2px' }} />
            {k(`criteria.${c}`)}
          </Box>
        ))}
      </Box>
      {result}
      <Typography sx={{ display: 'flex', gap: 0.75, fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.5 }}>
        <InfoOutlinedIcon aria-hidden="true" sx={{ fontSize: 15, mt: '1px' }} /> {k('disclaimer')}
      </Typography>
      {canBook && (
        <Box>
          <Button component={Link} href="/appointments" size="small" variant="outlined" color="error" startIcon={<EventAvailableIcon />}
            sx={{ borderRadius: '10px', fontWeight: 700 }}>
            {k('book')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
