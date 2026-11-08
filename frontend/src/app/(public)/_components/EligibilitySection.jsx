'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Container, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useT } from '@/i18n/I18nProvider';

// Basic criteria shown before donating. The donation gap matches the backend's eligibility rule
// (Backend/src/common/eligibility.js: 56 days); staff make the final check on the day.
// Texts under home.eligibility in i18n/messages/home.js.
const CRITERIA = ['age', 'weight', 'interval', 'healthy'];

const EXPECT = [
  { icon: <BadgeOutlinedIcon />, key: 'id' },
  { icon: <AccessTimeIcon />, key: 'time' },
  { icon: <LocalCafeOutlinedIcon />, key: 'rest' },
];

/** "Can I donate?" — a quick, private self-check (nothing is stored or sent). */
export default function EligibilitySection() {
  const t = useT();
  const [checked, setChecked] = useState(() => CRITERIA.map(() => false));
  const done = checked.filter(Boolean).length;
  const all = done === CRITERIA.length;
  const toggle = (i) => setChecked((c) => c.map((v, j) => (j === i ? !v : v)));

  return (
    <Box component="section" aria-labelledby="eligibility-title" sx={{ py: { xs: 7, md: 9 } }}>
      <Container maxWidth="lg" sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 1fr' }, gap: { xs: 3, md: 6 }, alignItems: 'start' }}>
        <Box sx={{ pt: { md: 2 } }}>
          <Typography variant="overline" color="primary" sx={{ display: 'block', mb: 1 }}>{t('home.eligibility.eyebrow')}</Typography>
          <Typography id="eligibility-title" component="h2" sx={{ fontSize: { xs: '1.7rem', md: '2.2rem' }, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.15 }}>
            {t('home.eligibility.title')}
          </Typography>
          <Typography sx={{ mt: 1, color: 'text.secondary', lineHeight: 1.65, maxWidth: 520 }}>
            {t('home.eligibility.lead')}
          </Typography>

          <Box sx={{ mt: 3, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr' }, gap: 1.5 }}>
            {EXPECT.map((e) => (
              <Box key={e.key} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <Box aria-hidden="true" sx={{
                  width: 40, height: 40, borderRadius: '12px', flexShrink: 0, display: 'grid', placeItems: 'center',
                  bgcolor: (t) => t.custom.tones.primary.bg, color: 'primary.main', '& svg': { fontSize: 21 },
                }}>{e.icon}</Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{t(`home.eligibility.expect.${e.key}.title`)}</Typography>
                  <Typography sx={{ fontSize: '0.84rem', color: 'text.secondary' }}>{t(`home.eligibility.expect.${e.key}.text`)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        <Box sx={{
          borderRadius: '20px', p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
          boxShadow: (t) => t.custom.shadow.lg,
        }}>
          <Box component="ul" role="group" aria-label={t('home.eligibility.criteriaLabel')} sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {CRITERIA.map((c, i) => (
              <Box component="li" key={c}>
                <Box component="button" type="button" role="checkbox" aria-checked={checked[i]} onClick={() => toggle(i)}
                  sx={{
                    all: 'unset', boxSizing: 'border-box', width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                    p: 1.5, borderRadius: '12px', border: '1.5px solid',
                    borderColor: checked[i] ? 'success.main' : 'divider',
                    bgcolor: checked[i] ? (t) => t.custom.tones.success.bg : 'transparent',
                    transition: 'background-color .15s, border-color .15s',
                    '&:hover': { borderColor: checked[i] ? 'success.main' : 'text.secondary' },
                    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
                  }}>
                  {checked[i]
                    ? <CheckCircleIcon aria-hidden="true" sx={{ color: 'success.main' }} />
                    : <RadioButtonUncheckedIcon aria-hidden="true" sx={{ color: 'text.disabled' }} />}
                  <Typography component="span" sx={{ fontSize: '0.9rem', fontWeight: checked[i] ? 600 : 500 }}>{t(`home.eligibility.criteria.${c}`)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Box aria-live="polite" sx={{
            mt: 2, p: 2, borderRadius: '14px',
            bgcolor: (t) => t.custom.tones[all ? 'success' : 'neutral'].bg,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {all && <HowToRegIcon aria-hidden="true" sx={{ color: (t) => t.custom.tones.success.fg }} />}
              <Typography sx={{ fontWeight: 800, color: all ? (t) => t.custom.tones.success.fg : 'text.primary' }}>
                {all ? t('home.eligibility.allTitle') : t('home.eligibility.progress', { done, total: CRITERIA.length })}
              </Typography>
            </Box>
            <Typography sx={{ mt: 0.5, fontSize: '0.84rem', color: 'text.secondary' }}>
              {t(all ? 'home.eligibility.allText' : 'home.eligibility.unsureText')}
            </Typography>
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {all ? (
                <Button component={Link} href="/appointments" variant="contained" startIcon={<CalendarMonthIcon />} sx={{ fontWeight: 700 }}>
                  {t('home.eligibility.book')}
                </Button>
              ) : (
                <Button component={Link} href="/assistant" variant="outlined" startIcon={<SmartToyOutlinedIcon />}
                  sx={{ fontWeight: 700, borderWidth: 1.5, bgcolor: 'background.paper', '&:hover': { borderWidth: 1.5 } }}>
                  {t('home.eligibility.ask')}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
