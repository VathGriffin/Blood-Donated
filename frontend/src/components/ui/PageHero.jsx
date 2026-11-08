'use client';
import { useT } from '@/i18n/I18nProvider';
import Link from 'next/link';
import { Box, Breadcrumbs, Typography, alpha } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';

/**
 * Page heading on a soft red wash: breadcrumb, tinted icon tile, title and subtitle, an optional
 * decorative `art` element (hide it on small screens yourself) and right-aligned `actions`.
 * `crumbs` is [{ label, href }]; the last one is the current page and needs no href.
 */
export default function PageHero({ crumbs = [], icon, title, subtitle, art, actions, titleId, sx }) {
  const t = useT();
  return (
    <Box
      component="section"
      aria-labelledby={titleId}
      sx={[
        (theme) => ({
          position: 'relative', overflow: 'hidden', borderRadius: '20px', mb: { xs: 2.5, md: 3 },
          px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 },
          background: `radial-gradient(120% 150% at 72% 0%, ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.09)} 0%, transparent 62%)`,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {crumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          aria-label={t('ui.breadcrumb')}
          sx={{ mb: 1.5, fontSize: '0.85rem', '& a': { color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main', textDecoration: 'underline' } } }}
        >
          {crumbs.map((c, i) => (i < crumbs.length - 1 && c.href
            ? <Link key={c.label} href={c.href}>{c.label}</Link>
            : (
              <Typography key={c.label} component="span" aria-current="page" sx={{ fontSize: 'inherit', fontWeight: 600, color: 'text.primary' }}>
                {c.label}
              </Typography>
            )))}
        </Breadcrumbs>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, minWidth: 0, flex: '1 1 340px' }}>
          {icon && (
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: { xs: 52, md: 62 }, height: { xs: 52, md: 62 }, borderRadius: '18px', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.09),
                '& svg': { fontSize: { xs: 28, md: 32 } },
              })}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography id={titleId} variant="h4" component="h1"
              sx={{ fontWeight: 800, fontSize: { xs: '1.6rem', md: '2.15rem' }, letterSpacing: '-0.025em' }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontSize: { md: '0.96rem' }, maxWidth: 580 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        {art}

        {actions && (
          <Box sx={{
            display: 'flex', gap: 1.25, flexShrink: 0, width: { xs: '100%', md: 'auto' },
            '& > *': { flex: { xs: 1, md: 'none' }, whiteSpace: 'nowrap' },
          }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
}
