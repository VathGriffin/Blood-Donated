'use client';
import { memo } from 'react';
import { Avatar, Box, Typography, useTheme } from '@mui/material';
import {
  Shield, Groups, Favorite, TrackChanges, Visibility, TrendingUp, People, Bloodtype,
  LocalHospital, TaskAlt, ArrowForward, VolunteerActivism, FormatQuote, Code,
} from '@mui/icons-material';
import RichText from '@/components/ui/RichText';
import { initialsOf } from '@/lib/format';

const RED = '#c62828';
const valueIcons = [<Shield key="s" />, <Groups key="g" />, <Favorite key="f" />];
const pillarIcons = [<TrackChanges key="t" />, <Visibility key="v" />, <TrendingUp key="u" />];
const statIcons = [<People key="p" />, <Bloodtype key="b" />, <LocalHospital key="h" />, <TaskAlt key="t" />];

// Layout switches on the preview frame's own width (container queries), so the device toggle
// shows the real stacked/side-by-side layouts without resizing the browser.
const wide = (sx) => ({ '@container about-preview (min-width: 680px)': sx });
const mid = (sx) => ({ '@container about-preview (min-width: 480px)': sx });

/**
 * Compact rendering of the public About page from unsaved editor state.
 * `sections` are complete (defaults merged), `images` are absolute URLs,
 * `stats` the live public counts (or null while loading).
 */
function AboutPreview({ sections, images, stats }) {
  const isDark = useTheme().palette.mode === 'dark';
  const { hero, purpose, team, cta } = sections;
  const heading = isDark ? '#fff' : '#161a23';
  const tile = {
    borderRadius: '12px', bgcolor: isDark ? '#1a1a1a' : '#fff',
    border: `1px solid ${isDark ? '#2a2a2a' : '#f0e6e6'}`,
    boxShadow: isDark ? 'none' : '0 4px 16px rgba(0,0,0,0.05)',
  };
  const iconDot = (size = 30) => ({
    width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center',
    bgcolor: isDark ? 'rgba(198,40,40,0.18)' : '#fdeaea', color: RED, '& svg': { fontSize: size * 0.55 },
  });
  const statValues = stats ? [stats.donors, stats.donations, stats.hospitals, stats.fulfilledRequests] : [];

  return (
    <Box sx={{ containerType: 'inline-size', containerName: 'about-preview', bgcolor: isDark ? '#121212' : '#f6f6f6', fontSize: 12 }}>
      {/* Mini site bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25, bgcolor: isDark ? '#0f0f0f' : '#fff', borderBottom: `1px solid ${isDark ? '#222' : '#f1e6e6'}` }}>
        <Favorite sx={{ color: RED, fontSize: 16 }} />
        <Typography sx={{ fontWeight: 800, fontSize: 12, color: heading, mr: 'auto' }}>BloodLife AI</Typography>
        <Box sx={{ display: 'none', gap: 1.75, ...mid({ display: 'flex' }) }}>
          {['Home', 'About', 'Donate', 'Find a Hospital', 'Contact'].map((l) => (
            <Typography key={l} sx={{ fontSize: 10, fontWeight: l === 'About' ? 700 : 500, color: l === 'About' ? RED : 'text.secondary' }}>{l}</Typography>
          ))}
        </Box>
        <Box sx={{ bgcolor: RED, color: '#fff', fontSize: 9.5, fontWeight: 700, px: 1.25, py: 0.4, borderRadius: '6px' }}>Login</Box>
      </Box>

      {/* Hero */}
      <Box sx={{
        display: 'grid', gap: 2, alignItems: 'center', p: 2.25,
        background: isDark ? 'linear-gradient(135deg, #161112, #121212)' : 'linear-gradient(135deg, #fdf3f3, #f9fafb)',
        ...wide({ gridTemplateColumns: '1.05fr 1fr', p: 3 }),
      }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED, mb: 0.75 }}>{hero.eyebrow}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 22, lineHeight: 1.1, color: heading, mb: 0.75, ...wide({ fontSize: 26 }) }}>
            {hero.title}<Box component="span" sx={{ display: 'block', color: RED }}>{hero.titleAccent}</Box>
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: 12.5, color: heading, mb: 0.75 }}>{hero.headline}</Typography>
          <RichText value={hero.intro} sx={{ fontSize: 10.5, lineHeight: 1.6, color: 'text.secondary', mb: 0.75 }} />
          <Box sx={{ display: 'flex', gap: 1, mt: 1.25, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: RED, color: '#fff', fontSize: 10, fontWeight: 700, px: 1.5, py: 0.6, borderRadius: '8px' }}>
              Become a Donor <ArrowForward sx={{ fontSize: 12 }} />
            </Box>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, border: `1px solid ${RED}`, color: RED, fontSize: 10, fontWeight: 700, px: 1.5, py: 0.6, borderRadius: '8px' }}>
              <Groups sx={{ fontSize: 12 }} /> Meet the Team
            </Box>
          </Box>
        </Box>
        <Box component="img" src={images.heroImage} alt="" sx={{ width: '100%', height: 170, objectFit: 'cover', borderRadius: '14px', boxShadow: '0 12px 28px rgba(0,0,0,0.18)', ...wide({ height: 210 }) }} />
      </Box>

      {/* Values */}
      <Box sx={{ display: 'grid', gap: 1.25, px: 2.25, pt: 2, ...mid({ gridTemplateColumns: 'repeat(3, 1fr)' }), ...wide({ px: 3 }) }}>
        {sections.values.map((v, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Box sx={iconDot(28)}>{valueIcons[i]}</Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 11, color: heading }}>{v.title}</Typography>
              <Typography sx={{ fontSize: 9.5, color: 'text.secondary', lineHeight: 1.35 }}>{v.subtitle}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, p: 2.25, ...mid({ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }), ...wide({ px: 3 }) }}>
        {sections.stats.map((s, i) => (
          <Box key={i} sx={{ ...tile, p: 1.25, textAlign: 'center' }}>
            <Box sx={{ ...iconDot(26), mx: 'auto', mb: 0.5 }}>{statIcons[i]}</Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: RED, lineHeight: 1.2 }}>{stats ? statValues[i] : '…'}</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: 9.5, color: heading, lineHeight: 1.3 }}>{s.label}</Typography>
            <Typography sx={{ fontSize: 8.5, color: 'text.secondary', lineHeight: 1.3 }}>{s.caption}</Typography>
          </Box>
        ))}
      </Box>

      {/* Purpose */}
      <Box sx={{ display: 'grid', gap: 2, alignItems: 'center', px: 2.25, pb: 2.5, ...wide({ gridTemplateColumns: '0.9fr 1.1fr', px: 3 }) }}>
        <Box sx={{ position: 'relative' }}>
          <Box component="img" src={images.purposeImage} alt="" sx={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
          <Box sx={{ ...tile, position: 'absolute', top: 10, right: 10, maxWidth: 130, p: 1 }}>
            <FormatQuote sx={{ fontSize: 14, color: RED, transform: 'scaleX(-1)' }} />
            <Typography sx={{ fontWeight: 800, fontSize: 9.5, lineHeight: 1.3, color: heading }}>{purpose.quote}</Typography>
          </Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: RED }}>{purpose.eyebrow}</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25, color: heading, my: 0.5 }}>{purpose.title}</Typography>
          <RichText value={purpose.text} sx={{ fontSize: 10.5, lineHeight: 1.6, color: 'text.secondary' }} />
        </Box>
        <Box sx={{ display: 'grid', gap: 1, ...mid({ gridTemplateColumns: 'repeat(3, 1fr)' }), ...wide({ gridColumn: '1 / -1' }) }}>
          {sections.pillars.map((c, i) => (
            <Box key={i} sx={{ ...tile, p: 1.25 }}>
              <Box sx={{ ...iconDot(26), borderRadius: '8px', mb: 0.75 }}>{pillarIcons[i]}</Box>
              <Typography sx={{ fontWeight: 700, fontSize: 11, color: heading, mb: 0.25 }}>{c.title}</Typography>
              <Typography sx={{ fontSize: 9.5, lineHeight: 1.5, color: 'text.secondary' }}>{c.desc}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Team */}
      <Box sx={{ bgcolor: isDark ? '#0f0f0f' : '#fff', px: 2.25, py: 2.5, ...wide({ px: 3 }) }}>
        <Typography sx={{ textAlign: 'center', fontWeight: 800, fontSize: 15, color: heading, mb: 1.5 }}>
          The Builders <Box component="span" sx={{ color: RED }}>Behind It</Box>
        </Typography>
        <Box sx={{
          ...tile, display: 'grid', gap: 1.5, alignItems: 'center', p: 1.75, textAlign: 'center',
          background: isDark ? 'linear-gradient(135deg, #1f1416, #161112)' : 'linear-gradient(135deg, #fff5f5, #fff)',
          ...wide({ gridTemplateColumns: 'auto 1fr', textAlign: 'left' }),
        }}>
          <Box sx={{ position: 'relative', mx: 'auto', width: 84, height: 84 }}>
            <Avatar src={images.creatorPhoto || undefined} alt="" sx={{
              width: '100%', height: '100%', fontWeight: 800, fontSize: 26, color: '#fff',
              background: `radial-gradient(circle at 35% 30%, #ef5350, ${RED} 55%, #8e0000)`,
              border: `3px solid ${isDark ? '#1f1416' : '#fff'}`, boxShadow: '0 8px 20px rgba(183,28,28,0.25)',
            }}>
              {initialsOf(team.name)}
            </Avatar>
            <Box sx={{ position: 'absolute', right: -2, bottom: 2, width: 24, height: 24, borderRadius: '50%', bgcolor: RED, color: '#fff', display: 'grid', placeItems: 'center', border: '2px solid #fff' }}>
              <Code sx={{ fontSize: 13 }} />
            </Box>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 15, color: heading }}>{team.name}</Typography>
            <Typography sx={{ fontWeight: 600, fontSize: 10.5, color: RED }}>Individual Graduation Project</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', mb: 0.5 }}>{team.position}</Typography>
            <RichText value={team.bio} sx={{ fontSize: 9.5, lineHeight: 1.55, color: 'text.secondary', '& ul, & ol': { textAlign: 'left' } }} />
          </Box>
        </Box>
      </Box>

      {/* CTA */}
      <Box sx={{ p: 2.25, ...wide({ px: 3 }) }}>
        <Box sx={{
          borderRadius: '12px', p: 1.75, bgcolor: isDark ? 'rgba(183,28,28,0.1)' : '#fdeaea',
          display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
        }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #b71c1c, #7f0000)', color: '#fff' }}>
            <VolunteerActivism sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ flex: '1 1 160px', minWidth: 0 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 12, color: heading }}>{cta.title}</Typography>
            <Typography sx={{ fontSize: 9.5, color: 'text.secondary' }}>{cta.text}</Typography>
          </Box>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, bgcolor: RED, color: '#fff', fontSize: 10, fontWeight: 700, px: 1.5, py: 0.7, borderRadius: '8px' }}>
            <Favorite sx={{ fontSize: 12 }} /> {cta.button} <ArrowForward sx={{ fontSize: 12 }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// Memoised: it only needs to re-render when the (deferred) draft, images or stats change.
export default memo(AboutPreview);
