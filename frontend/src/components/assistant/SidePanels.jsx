'use client';
import { Box, ButtonBase, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import FormatListBulletedRoundedIcon from '@mui/icons-material/FormatListBulletedRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useT } from '@/i18n/I18nProvider';
import BotArt from './BotArt';

export const panelSx = (theme) => ({
  p: { xs: 2, sm: 2.5 }, borderRadius: '18px', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
  boxShadow: theme.custom?.shadow?.xs,
});

// Keys of aiChat.quick; `eligible` is answered from the donor's record, the rest by the AI.
export const QUICK_QUESTIONS = [
  { key: 'eligible', icon: <WaterDropIcon /> },
  { key: 'book', icon: <CalendarMonthOutlinedIcon /> },
  { key: 'hospital', icon: <LocalHospitalOutlinedIcon /> },
  { key: 'requirements', icon: <FormatListBulletedRoundedIcon /> },
  { key: 'often', icon: <ShieldOutlinedIcon /> },
];

function PanelTitle({ id, icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.75 }}>
      <Box aria-hidden="true" sx={(theme) => ({
        width: 34, height: 34, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.1), color: 'primary.main',
        '& svg': { fontSize: 20 },
      })}>{icon}</Box>
      <Typography id={id} component="h2" sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{children}</Typography>
    </Box>
  );
}

/** Right column: questions that start a conversation in one click. */
export function QuickQuestions({ onAsk, disabled }) {
  const t = useT();
  return (
    <Paper component="section" aria-labelledby="ai-quick-title" elevation={0} sx={panelSx}>
      <PanelTitle id="ai-quick-title" icon={<BoltRoundedIcon />}>{t('aiChat.quickTitle')}</PanelTitle>
      <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {QUICK_QUESTIONS.map((q) => (
          <li key={q.key}>
            <ButtonBase onClick={() => onAsk(q.key)} disabled={disabled} focusRipple
              sx={(theme) => ({
                width: '100%', justifyContent: 'flex-start', gap: 1.5, px: 1.5, py: 1.1, borderRadius: '12px', textAlign: 'left',
                border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', fontSize: '0.88rem', fontWeight: 600,
                color: 'text.primary', transition: 'border-color .15s, background-color .15s, transform .15s',
                '&:hover': { borderColor: alpha(theme.palette.primary.main, 0.45), bgcolor: alpha(theme.palette.primary.main, 0.04) },
                '&.Mui-focusVisible': { outline: '2px solid', outlineColor: theme.palette.primary.main, outlineOffset: 1 },
                '&.Mui-disabled': { opacity: 0.6 },
                '@media (prefers-reduced-motion: no-preference)': { '&:hover': { transform: 'translateX(2px)' } },
              })}>
              <Box aria-hidden="true" sx={(theme) => ({
                width: 30, height: 30, borderRadius: '8px', display: 'grid', placeItems: 'center', flexShrink: 0,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.08), color: 'primary.main',
                '& svg': { fontSize: 17 },
              })}>{q.icon}</Box>
              <Box component="span" sx={{ flex: 1, minWidth: 0 }}>{t(`aiChat.quick.${q.key}`)}</Box>
              <ChevronRightRoundedIcon aria-hidden="true" sx={{ color: 'text.secondary', fontSize: 20 }} />
            </ButtonBase>
          </li>
        ))}
      </Box>
    </Paper>
  );
}

/** Right column: what the assistant is for, and its limits. */
export function AboutAssistant() {
  const t = useT();
  return (
    <Paper component="section" aria-labelledby="ai-about-title" elevation={0} sx={(theme) => ({ ...panelSx(theme), position: 'relative', overflow: 'hidden' })}>
      <PanelTitle id="ai-about-title" icon={<InfoRoundedIcon />}>{t('aiChat.aboutTitle')}</PanelTitle>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', lineHeight: 1.65 }}>{t('aiChat.aboutText')}</Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, mt: 2 }}>
        <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 1.1, flex: 1, minWidth: 0 }}>
          {['always', 'guidance', 'languages'].map((key) => (
            <Box component="li" key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, fontSize: '0.88rem', fontWeight: 600 }}>
              <Box aria-hidden="true" sx={(theme) => ({
                width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0,
                bgcolor: alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.22 : 0.12), color: 'success.main',
              })}><CheckRoundedIcon sx={{ fontSize: 15 }} /></Box>
              {t(`aiChat.aboutPoints.${key}`)}
            </Box>
          ))}
        </Box>
        <Box sx={{ width: 110, height: 110, flexShrink: 0, display: { xs: 'none', sm: 'block' } }}><BotArt /></Box>
      </Box>
      <Typography sx={{ mt: 1.75, fontSize: '0.75rem', color: 'text.secondary', lineHeight: 1.5 }}>{t('aiChat.aboutDisclaimer')}</Typography>
    </Paper>
  );
}
