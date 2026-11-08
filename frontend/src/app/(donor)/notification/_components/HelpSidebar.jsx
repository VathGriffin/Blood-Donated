'use client';
import { useT } from '@/i18n/I18nProvider';
import { useState } from 'react';
import Link from 'next/link';
import { Box, Button, Collapse, Paper, Typography } from '@mui/material';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { cardSx } from '@/components/donor/ui';
import { CONTACT } from '@/lib/contact';

// Short answers describing how the existing pages work, each with a link to that page.
// Text: donor.help.faq.<key>.{q,a,link}
const FAQ = [
  { key: 'book', href: '/appointments' },
  { key: 'request', href: '/requests' },
  { key: 'profile', href: '/profile' },
  { key: 'qr', href: '/qr-card' },
  { key: 'contact', href: '/my-requests' },
];

function FaqItem({ item, open, onToggle, id }) {
  const t = useT();
  const text = (field) => t(`donor.help.faq.${item.key}.${field}`);
  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <Box component="button" type="button" onClick={onToggle} aria-expanded={open} aria-controls={`${id}-panel`} id={`${id}-btn`}
        sx={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 1.25, px: 0,
          border: 0, bgcolor: 'transparent', color: 'text.primary', font: 'inherit', fontSize: '0.9rem', textAlign: 'left', cursor: 'pointer',
          '&:hover': { color: 'primary.main' },
          '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2, borderRadius: '6px' },
        }}>
        {text('q')}
        <ExpandMoreIcon aria-hidden="true" sx={{ fontSize: 20, color: 'text.secondary', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </Box>
      <Collapse in={open} id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`}>
        <Typography variant="body2" color="text.secondary" sx={{ pb: 1 }}>{text('a')}</Typography>
        <Button component={Link} href={item.href} size="small" endIcon={<ArrowForwardIcon />} sx={{ mb: 1.25, px: 0, minWidth: 0 }}>
          {text('link')}
        </Button>
      </Collapse>
    </Box>
  );
}

function ContactLine({ icon, href, value, caption }) {
  const Inner = (
    <>
      <Box aria-hidden="true" sx={{ display: 'flex', color: 'primary.main', mt: '2px', '& svg': { fontSize: 21 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', overflowWrap: 'anywhere', color: 'text.primary' }}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{caption}</Typography>
      </Box>
    </>
  );
  const sx = { display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1, textDecoration: 'none', borderRadius: '8px',
    '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 } };
  return href ? <Box component="a" href={href} sx={{ ...sx, '&:hover p:first-of-type': { color: 'primary.main' } }}>{Inner}</Box> : <Box sx={sx}>{Inner}</Box>;
}

/** Right-hand help column: support info, common questions and contact methods (from lib/contact). */
export default function HelpSidebar() {
  const t = useT();
  const [openIdx, setOpenIdx] = useState(null);
  return (
    <Box component="aside" aria-label={t('donor.help.aria')} sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
      <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <HeadsetMicOutlinedIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 30 }} />
          <Box>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>{t('donor.help.needHelp')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {t('donor.help.needHelpText')}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 2, p: 1.5, borderRadius: '12px', display: 'flex', gap: 1.25, bgcolor: (t) => t.custom.tones.primary.bg }}>
          <AccessTimeIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 22, mt: '1px' }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: 'primary.main' }}>{t('donor.help.hours')}</Typography>
            <Typography variant="body2" color="text.secondary">{t('contact.hours')}</Typography>
          </Box>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
          <MenuBookOutlinedIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>{t('donor.help.questions')}</Typography>
        </Box>
        {FAQ.map((item, i) => (
          <FaqItem key={item.key} item={item} id={`faq-${i}`} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} />
        ))}
        <Button component={Link} href="/assistant" endIcon={<ArrowForwardIcon />} sx={{ mt: 1, px: 0, fontWeight: 700 }}>
          {t('donor.help.askAi')}
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ ...cardSx, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.75 }}>
          <MailOutlineIcon aria-hidden="true" sx={{ color: 'primary.main', fontSize: 26 }} />
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.02rem' }}>{t('donor.help.other')}</Typography>
        </Box>
        <ContactLine icon={<MailOutlineIcon />} href={`mailto:${CONTACT.email}`} value={CONTACT.email} caption={t('donor.help.email')} />
        <ContactLine icon={<PhoneOutlinedIcon />} href={CONTACT.phoneHref} value={CONTACT.phoneDisplay} caption={t('donor.help.phone', { hours: t('contact.hours') })} />
        <ContactLine icon={<PlaceOutlinedIcon />} value={CONTACT.address} caption={t('donor.help.office')} />
      </Paper>
    </Box>
  );
}
