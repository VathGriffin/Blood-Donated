'use client';
import { useI18n } from '@/i18n/I18nProvider';
import Link from 'next/link';
import { Box, Button, alpha, useTheme } from '@mui/material';
import { PeopleAlt, VolunteerActivismOutlined, WaterDrop } from '@mui/icons-material';
import { PageHero } from '@/components/ui';

// A blood drop with a cross, its heartbeat line running into a heart. Decoration only.
function DropArt() {
  const { palette } = useTheme();
  const red = palette.primary.main;
  return (
    <Box component="svg" viewBox="0 0 240 120" aria-hidden="true" focusable="false"
      sx={{ width: 240, height: 120, flexShrink: 0, display: { xs: 'none', lg: 'block' } }}>
      <defs>
        <linearGradient id="dd-drop" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={palette.primary.light} />
          <stop offset="1" stopColor={palette.primary.dark} />
        </linearGradient>
      </defs>
      <ellipse cx="62" cy="112" rx="30" ry="5" fill={alpha(red, 0.12)} />
      <path d="M62 8 C 62 8, 26 52, 26 76 A 36 36 0 0 0 98 76 C 98 52, 62 8, 62 8 Z" fill="url(#dd-drop)" />
      <path d="M44 56 C 46 46, 52 38, 56 33" stroke="#fff" strokeOpacity="0.45" strokeWidth="5" strokeLinecap="round" fill="none" />
      <rect x="56" y="60" width="12" height="34" rx="2.5" fill="#fff" />
      <rect x="45" y="71" width="34" height="12" rx="2.5" fill="#fff" />
      <path d="M98 80 L 124 80 L 132 64 L 142 96 L 150 78 L 168 78 Q 186 78 196 62"
        fill="none" stroke={red} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M196 62 C 174 46, 178 20, 196 32 C 214 20, 218 46, 196 62 Z"
        fill={alpha(red, 0.08)} stroke={red} strokeWidth="2.6" strokeLinejoin="round" />
    </Box>
  );
}

/** Breadcrumb, title, short description and the main calls to action. */
export default function DonorsHero({ inDashboard, signedIn }) {
  const { t } = useI18n();
  return (
    <PageHero
      titleId="donors-title"
      crumbs={[{ label: 'BloodLife AI', href: inDashboard ? '/profile' : '/' }, { label: t('directory.title') }]}
      icon={<PeopleAlt />}
      title={t('directory.title')}
      subtitle={t('directory.subtitle')}
      art={<DropArt />}
      actions={
        <>
          <Button component={Link} href="/requests" variant="contained" startIcon={<WaterDrop />}>{t('directory.requestBlood')}</Button>
          {!signedIn && (
            <Button component={Link} href="/donate" variant="outlined" startIcon={<VolunteerActivismOutlined />} sx={{ bgcolor: 'background.paper' }}>
              {t('directory.becomeDonor')}
            </Button>
          )}
        </>
      }
    />
  );
}
