'use client';
import { useT } from '@/i18n/I18nProvider';
import { Box, Button, CircularProgress, alpha, useTheme } from '@mui/material';
import { Add, Refresh, WaterDrop } from '@mui/icons-material';
import { PageHero } from '@/components/ui';

// Blood bag feeding a heartbeat line into a heart. Decoration only.
function HeroArt() {
  const { palette } = useTheme();
  const red = palette.primary.main;
  return (
    <Box component="svg" viewBox="0 0 230 130" aria-hidden="true" focusable="false"
      sx={{ width: 230, height: 130, flexShrink: 0, display: { xs: 'none', lg: 'block' }, mr: 2 }}>
      <defs>
        <linearGradient id="br-bag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.primary.light} />
          <stop offset="1" stopColor={red} />
        </linearGradient>
      </defs>
      <path d="M38 10 h28 M52 10 v9" stroke={red} strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="28" y="19" width="48" height="62" rx="11" fill="url(#br-bag)" />
      <rect x="33" y="24" width="38" height="11" rx="5" fill="#fff" opacity="0.28" />
      <rect x="47.5" y="40" width="9" height="30" rx="2" fill="#fff" />
      <rect x="37" y="50.5" width="30" height="9" rx="2" fill="#fff" />
      <rect x="47" y="81" width="10" height="9" rx="2" fill={palette.primary.dark} />
      <path d="M52 90 C 52 118, 92 118, 104 100 L 116 100 L 123 84 L 132 114 L 140 96 L 156 96 Q 176 96 188 82"
        fill="none" stroke={red} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M188 82 C 164 64, 168 36, 188 48 C 208 36, 212 64, 188 82 Z"
        fill={alpha(red, 0.08)} stroke={red} strokeWidth="2.6" strokeLinejoin="round" />
    </Box>
  );
}

/** Breadcrumb, page title and the Refresh / New Request actions. */
export default function RequestsHero({ loading, onRefresh, onCreate }) {
  const t = useT();
  return (
    <PageHero
      titleId="requests-title"
      crumbs={[{ label: 'BloodLife AI', href: '/' }, { label: t('adm.reqHero.admin'), href: '/dashboard/admin' }, { label: t('adm.reqHero.bloodRequests') }]}
      icon={<WaterDrop />}
      title={t('adm.reqHero.bloodRequests')}
      subtitle={t('adm.reqHero.reviewApproveAndManage')}
      art={<HeroArt />}
      actions={
        <>
          <Button variant="outlined" onClick={onRefresh} disabled={loading} sx={{ bgcolor: 'background.paper' }}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Refresh />}>
            {t('adm.reqHero.refresh')}
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={onCreate}>{t('adm.reqHero.newRequest')}</Button>
        </>
      }
    />
  );
}
