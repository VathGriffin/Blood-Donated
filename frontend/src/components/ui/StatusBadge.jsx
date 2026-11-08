'use client';
import { Box } from '@mui/material';
import { useT } from '@/i18n/I18nProvider';

// "CheckedIn" -> "Checked in", "adequate" -> "Adequate"
const humanize = (s) => {
  const spaced = String(s).replace(/([a-z])([A-Z])/g, '$1 $2');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
};

/** A status in the selected language (status.<value> in i18n/messages/status.js); unknown ones humanized. */
export const statusLabel = (t, status) => {
  if (status == null || status === '') return '';
  const key = `status.${status}`;
  const text = t(key);
  return text === key ? humanize(status) : text;
};

/**
 * Pill badge for any domain status. The colour comes from `statusTone` in
 * lib/design-tokens.js, so "Pending" (etc.) is the same colour on every screen.
 * Override with `tone` for one-offs, or `label` to change the text.
 */
export default function StatusBadge({ status, label, tone, dot = true, size = 'medium', sx }) {
  const t = useT();
  return (
    <Box
      component="span"
      sx={[
        (theme) => {
          const c = theme.custom.tones[tone || theme.custom.statusTone[status] || 'neutral'] || theme.custom.tones.neutral;
          return {
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            px: size === 'small' ? 1 : 1.25,
            height: size === 'small' ? 22 : 26,
            borderRadius: `${theme.custom.radius.pill}px`,
            bgcolor: c.bg,
            color: c.fg,
            fontSize: size === 'small' ? '0.72rem' : '0.78rem',
            fontWeight: 600,
            lineHeight: 1,
            whiteSpace: 'nowrap',
            '&::before': dot
              ? { content: '""', width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot, flexShrink: 0 }
              : undefined,
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label ?? statusLabel(t, status)}
    </Box>
  );
}
