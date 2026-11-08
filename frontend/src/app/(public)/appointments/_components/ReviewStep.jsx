'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { Box, Typography, Button, useTheme } from '@mui/material';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Panel from './Panel';
import { C, formatLongDate, formatSlot } from './booking';

// Step 4: everything that will be sent, grouped, with a way back to change each group.
export default function ReviewStep({ center, form, onEditSelection, onEditDetails }) {
  const isDark = useTheme().palette.mode === 'dark';
  const { t } = useI18n();
  const r = (k) => t(`booking.review.${k}`);
  const place = [center?.address, center?.city].filter(Boolean).join(', ');
  const groups = [
    {
      title: r('appointment'), onEdit: onEditSelection, editLabel: r('editSelection'),
      rows: [
        [r('center'), center?.name],
        [r('address'), place],
        [r('date'), form.date && formatLongDate(form.date)],
        [r('time'), form.time && formatSlot(form.time)],
      ],
    },
    {
      title: r('donor'), onEdit: onEditDetails, editLabel: r('editDetails'),
      rows: [
        [r('fullName'), form.fullName.trim()],
        [r('email'), form.email.trim()],
        [r('phone'), form.phone.trim()],
        [r('bloodType'), form.bloodType],
        [r('notes'), form.notes.trim()],
      ],
    },
  ];

  return (
    <Panel icon={<FactCheckOutlinedIcon />} title={r('title')} subtitle={r('subtitle')}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {groups.map((g) => (
          <Box key={g.title} sx={{ borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : C.border}`, overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.1, bgcolor: isDark ? 'rgba(255,255,255,0.03)' : C.bg, borderBottom: `1px solid ${isDark ? '#334155' : C.border}` }}>
              <Typography component="h3" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{g.title}</Typography>
              <Button size="small" onClick={g.onEdit} aria-label={g.editLabel} startIcon={<EditOutlinedIcon sx={{ fontSize: 15 }} />}
                sx={{ textTransform: 'none', fontWeight: 700, color: C.primary, minWidth: 0 }}>
                {r('edit')}
              </Button>
            </Box>
            <Box component="dl" sx={{ m: 0, px: 2, py: 0.5, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' } }}>
              {g.rows.filter(([, v]) => v).map(([k, v]) => (
                <Box key={k} sx={{ display: 'contents' }}>
                  <Typography component="dt" sx={{ color: 'text.secondary', fontSize: '0.82rem', pt: { xs: 1, sm: 1.1 }, pb: { sm: 1.1 } }}>{k}</Typography>
                  <Typography component="dd" sx={{ m: 0, fontWeight: 600, fontSize: '0.9rem', pb: 1.1, pt: { sm: 1.1 }, overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{v}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </Panel>
  );
}
