'use client';
import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Avatar, Box, Breadcrumbs, Button, Chip, CircularProgress, IconButton, Snackbar, Tab, Tabs,
  TextField, Tooltip, Typography, useTheme,
} from '@mui/material';
import { keyframes } from '@mui/system';
import {
  ArticleOutlined, Visibility, Save, Undo, CloudUpload, DeleteOutline, Favorite, VolunteerActivism,
  Groups, BarChart, Campaign, DesktopWindows, TabletMac, PhoneIphone, AutoAwesome, Info,
} from '@mui/icons-material';
import API_BASE from '@/lib/config';
import { mergeSections, overridesOnly, aboutImageUrl } from '@/lib/aboutContent';
import { initialsOf } from '@/lib/format';
import { PHOTO_TYPES, photoFileError } from '@/lib/validation';
import AboutPreview from './AboutPreview';
import RichTextEditor from './RichTextEditor';

const RED = '#c62828';
const IMAGE_FIELD = { hero: 'heroImage', purpose: 'purposeImage', creator: 'creatorPhoto' };

const TABS = [
  { id: 'general', label: 'General', icon: <ArticleOutlined /> },
  { id: 'mission', label: 'Our Mission', icon: <Favorite /> },
  { id: 'values', label: 'Our Values', icon: <AutoAwesome /> },
  { id: 'team', label: 'Our Team', icon: <Groups /> },
  { id: 'stats', label: 'Stats', icon: <BarChart /> },
  { id: 'cta', label: 'Call to Action', icon: <Campaign /> },
];

const DEVICES = [
  { id: 'desktop', label: 'Desktop', icon: <DesktopWindows fontSize="small" />, width: 820 },
  { id: 'tablet', label: 'Tablet', icon: <TabletMac fontSize="small" />, width: 600 },
  { id: 'mobile', label: 'Mobile', icon: <PhoneIphone fontSize="small" />, width: 375 },
];

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`;
const enter = (delay = 0) => ({
  animation: `${fadeUp} 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s both`,
  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
});
const calm = { '@media (prefers-reduced-motion: reduce)': { transition: 'none', transform: 'none !important' } };

const two = { display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } };

function SectionBlock({ title, sub, children, first }) {
  return (
    <Box sx={{ pt: first ? 0 : 3, mt: first ? 0 : 3, borderTop: first ? 'none' : 1, borderColor: 'divider' }}>
      <Typography component="h3" sx={{ fontWeight: 800, fontSize: '1rem' }}>{title}</Typography>
      {sub && <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem', mt: 0.25, mb: 2 }}>{sub}</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: sub ? 0 : 2 }}>{children}</Box>
    </Box>
  );
}

// Labelled text field with a live character counter. Memoised (with stable onChange handlers
// from the editor) so typing in one field doesn't re-render every other field.
const Field = memo(function Field({ id, label, value, onChange, max, multiline, rows = 3, placeholder }) {
  const near = value.length > max * 0.9;
  return (
    <Box>
      <Typography component="label" htmlFor={id} sx={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', mb: 0.75 }}>{label}</Typography>
      <TextField
        id={id} fullWidth value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        multiline={multiline} minRows={multiline ? rows : undefined}
        slotProps={{ htmlInput: { maxLength: max } }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px', fontSize: '0.92rem', transition: 'box-shadow 0.2s ease',
            '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(198,40,40,0.12)' },
            '&.Mui-focused fieldset': { borderColor: RED, borderWidth: 1.5 },
            ...calm,
          },
        }}
      />
      <Typography aria-live="polite" sx={{ textAlign: 'right', fontSize: '0.72rem', mt: 0.5, color: near ? RED : 'text.disabled' }}>
        {value.length}/{max}
      </Typography>
    </Box>
  );
});

// Current image + a drop zone that uploads straight away (images are saved independently of the text).
function ImageSlot({ label, hint, src, custom, busy, round, fallback, onFile, onRemove }) {
  const isDark = useTheme().palette.mode === 'dark';
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const drop = (e) => {
    e.preventDefault();
    setOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };
  return (
    <Box>
      <Typography sx={{ fontWeight: 600, fontSize: '0.86rem' }}>{label}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem', mb: 1.25 }}>{hint}</Typography>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: round ? 'auto 1fr' : '1fr 1fr' }, alignItems: 'stretch' }}>
        <Box sx={{ position: 'relative', justifySelf: round ? 'center' : 'stretch' }}>
          {round ? (
            <Avatar src={src || undefined} alt="" sx={{ width: 132, height: 132, fontSize: 36, fontWeight: 800, bgcolor: RED, boxShadow: '0 10px 26px rgba(183,28,28,0.25)', opacity: busy ? 0.5 : 1 }}>{fallback}</Avatar>
          ) : (
            <Box component="img" src={src} alt="" sx={{ width: '100%', height: { xs: 170, sm: '100%' }, minHeight: 150, maxHeight: 190, objectFit: 'cover', borderRadius: '14px', display: 'block', opacity: busy ? 0.5 : 1, transition: 'opacity 0.2s' }} />
          )}
          {busy && <CircularProgress size={28} color="error" sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-14px', ml: '-14px' }} />}
          {!busy && (
            <Chip size="small" label={custom ? 'Custom' : 'Default'}
              sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 700, fontSize: '0.68rem', bgcolor: custom ? RED : 'rgba(0,0,0,0.55)', color: '#fff' }} />
          )}
        </Box>
        <Box
          role="button" tabIndex={0} aria-label={`Upload ${label.toLowerCase()}`} aria-disabled={busy}
          onClick={() => !busy && input.current?.click()}
          onKeyDown={(e) => { if (!busy && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); input.current?.click(); } }}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={busy ? (e) => e.preventDefault() : drop}
          sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            gap: 0.5, p: 2.5, minHeight: 150, borderRadius: '14px', cursor: busy ? 'wait' : 'pointer',
            border: `1.5px dashed ${over ? RED : isDark ? '#3a3a3a' : '#e3d6d6'}`,
            bgcolor: over ? (isDark ? 'rgba(198,40,40,0.12)' : '#fff3f3') : (isDark ? 'rgba(255,255,255,0.02)' : '#fcfafa'),
            transition: 'border-color 0.2s, background-color 0.2s, transform 0.2s',
            '&:hover, &:focus-visible': { borderColor: RED, bgcolor: isDark ? 'rgba(198,40,40,0.08)' : '#fff6f6', outline: 'none' },
            '&:hover .up-icon': { transform: 'translateY(-3px)' },
            ...calm,
          }}
        >
          <CloudUpload className="up-icon" sx={{ fontSize: 32, color: RED, transition: 'transform 0.2s', ...calm }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>{custom ? 'Change Image' : 'Upload Image'}</Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.78rem' }}>Click to upload or drag and drop</Typography>
          <Typography sx={{ color: 'text.disabled', fontSize: '0.72rem' }}>JPG, PNG, WebP or GIF · max 10 MB</Typography>
          {custom && (
            <Button size="small" color="inherit" startIcon={<DeleteOutline sx={{ fontSize: 16 }} />} disabled={busy}
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              sx={{ mt: 0.5, textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}>
              {round ? 'Remove photo' : 'Restore default'}
            </Button>
          )}
          <input ref={input} type="file" hidden accept={PHOTO_TYPES.join(',')}
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f); }} />
        </Box>
      </Box>
    </Box>
  );
}

// Renders children at a real device width and scales them down to fit the panel, so each
// device shows its true layout. The outer box takes the scaled height.
function ScaledFrame({ width, children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [box, setBox] = useState({ avail: width, height: 0 });
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      setBox({ avail: outer.current?.clientWidth || width, height: inner.current?.offsetHeight || 0 });
    });
    ro.observe(outer.current);
    ro.observe(inner.current);
    return () => ro.disconnect();
  }, [width]);
  const scale = Math.min(1, box.avail / width);
  const shown = Math.min(width, box.avail);
  return (
    <Box ref={outer} sx={{ width: '100%' }}>
      <Box sx={{ width: shown, height: box.height * scale, mx: 'auto', overflow: 'hidden', transition: 'width 0.35s cubic-bezier(0.22, 1, 0.36, 1)', ...calm }}>
        <Box ref={inner} sx={{ width, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default function AboutEditor({ token }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const authHeader = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saved, setSaved] = useState(() => mergeSections());
  const [draft, setDraft] = useState(() => mergeSections());
  const [images, setImages] = useState({ heroImage: null, purposeImage: null, creatorPhoto: null });
  const [imageBusy, setImageBusy] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type, text }
  const [tab, setTab] = useState('general');
  const [device, setDevice] = useState('desktop');
  const [stats, setStats] = useState(null);
  const [limits, setLimits] = useState(null); // per-field caps, from the API

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetch(`${API_BASE}/api/about`)
      .then((res) => { if (!res.ok) throw new Error(`Server returned ${res.status}`); return res.json(); })
      .then((data) => {
        const merged = mergeSections(data.sections);
        setSaved(merged);
        setDraft(merged);
        setImages({ heroImage: data.heroImage, purposeImage: data.purposeImage, creatorPhoto: data.creatorPhoto });
        setLimits(data.limits);
      })
      .catch((err) => setLoadError(err.message || 'Failed to load the About page content.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    fetch(`${API_BASE}/api/stats/public`).then((r) => (r.ok ? r.json() : null)).then(setStats).catch(() => {});
  }, [load]);

  // Warn before leaving the page with unsaved text.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // One stable change handler per field, so memoised fields and editors skip unrelated re-renders.
  const handlers = useRef({});
  const setField = (section, field, index) => {
    const key = `${section}.${field}.${index ?? ''}`;
    handlers.current[key] ??= (value) => setDraft((d) => {
      if (index === undefined) return { ...d, [section]: { ...d[section], [field]: value } };
      const list = d[section].map((item, i) => (i === index ? { ...item, [field]: value } : item));
      return { ...d, [section]: list };
    });
    return handlers.current[key];
  };

  const save = useCallback(async () => {
    if (!dirty || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/about`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ sections: overridesOnly(draft) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not save the About page.');
      const merged = mergeSections(data.sections);
      setSaved(merged);
      setDraft(merged);
      setToast({ type: 'success', text: 'Saved. The public About page now shows your changes.' });
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }, [dirty, saving, authHeader, draft]);

  // Cmd/Ctrl+S saves. The listener is added once and always calls the latest save().
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Uploads (POST, with a file) or removes (DELETE) a slot's image. Images go live immediately.
  const changeImage = async (slot, file) => {
    if (file) {
      const invalid = photoFileError(file);
      if (invalid) { setToast({ type: 'error', text: invalid }); return; }
    } else if (!window.confirm(slot === 'creator'
      ? 'Remove the creator photo? The page will show initials instead.'
      : 'Remove this image and go back to the built-in one?')) {
      return;
    }
    setImageBusy((b) => ({ ...b, [slot]: true }));
    try {
      let body;
      if (file) { body = new FormData(); body.append('photo', file); }
      const res = await fetch(`${API_BASE}/api/about/images/${slot}`, { method: file ? 'POST' : 'DELETE', headers: authHeader, body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || (file ? 'Image upload failed.' : 'Could not remove the image.'));
      setImages((im) => ({ ...im, ...data }));
      setToast({ type: 'success', text: file ? 'Image uploaded. It is live on the About page.' : 'Image removed.' });
    } catch (err) {
      setToast({ type: 'error', text: err.message });
    } finally {
      setImageBusy((b) => ({ ...b, [slot]: false }));
    }
  };

  const previewImages = useMemo(() => Object.fromEntries(
    Object.values(IMAGE_FIELD).map((field) => [field, aboutImageUrl(images[field], field)]),
  ), [images]);

  const imageSlot = (slot, label, hint, round) => (
    <ImageSlot label={label} hint={hint} round={round}
      fallback={round ? initialsOf(draft.team.name) : undefined}
      src={previewImages[IMAGE_FIELD[slot]]}
      custom={!!images[IMAGE_FIELD[slot]]} busy={!!imageBusy[slot]}
      onFile={(file) => changeImage(slot, file)} onRemove={() => changeImage(slot)} />
  );

  const L = limits;
  const f = (section, field, label, opts = {}) => (
    <Field id={`about-${section}-${field}${opts.index ?? ''}`} label={label} max={L[section][field]}
      value={opts.index === undefined ? draft[section][field] : draft[section][opts.index][field]}
      onChange={setField(section, field, opts.index)} multiline={opts.multiline} rows={opts.rows} />
  );

  // Built once the field limits have arrived with the content.
  const panels = L && {
    general: (
      <>
        <SectionBlock first title="Hero Section" sub="The banner and introduction at the top of the About page.">
          {f('hero', 'eyebrow', 'Eyebrow text')}
          <Box sx={two}>
            {f('hero', 'title', 'Page title')}
            {f('hero', 'titleAccent', 'Title highlight (red)')}
          </Box>
          {f('hero', 'headline', 'Subtitle')}
          <RichTextEditor id="about-hero-intro" label="Introduction" helper="Introduce your platform to visitors."
            value={draft.hero.intro} onChange={setField('hero', 'intro')} max={L.hero.intro}
            placeholder="Tell visitors what BloodLife AI is and why it matters…" />
        </SectionBlock>
        <SectionBlock title="Hero Image" sub="Recommended size: 1200 × 1000 or larger. Uploads go live immediately.">
          {imageSlot('hero', 'Hero image', 'Shown beside the introduction.')}
        </SectionBlock>
      </>
    ),
    mission: (
      <>
        <SectionBlock first title="Our Purpose" sub="The story section below the stats.">
          {f('purpose', 'eyebrow', 'Eyebrow text')}
          {f('purpose', 'title', 'Heading')}
          {f('purpose', 'text', 'Body text', { multiline: true, rows: 4 })}
          {f('purpose', 'quote', 'Quote card')}
        </SectionBlock>
        <SectionBlock title="Mission, Vision & Impact" sub="The three cards under the purpose text.">
          {draft.pillars.map((_, i) => (
            <Box key={i} sx={{ p: 2, borderRadius: '14px', border: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {f('pillars', 'title', `Card ${i + 1} title`, { index: i })}
              {f('pillars', 'desc', `Card ${i + 1} description`, { index: i, multiline: true, rows: 2 })}
            </Box>
          ))}
        </SectionBlock>
        <SectionBlock title="Purpose Image">
          {imageSlot('purpose', 'Purpose image', 'Shown beside the purpose text, with the quote card on top.')}
        </SectionBlock>
      </>
    ),
    values: (
      <SectionBlock first title="Our Values" sub="The three highlights under the hero buttons.">
        {draft.values.map((_, i) => (
          <Box key={i} sx={{ ...two, p: 2, borderRadius: '14px', border: 1, borderColor: 'divider' }}>
            {f('values', 'title', `Value ${i + 1}`, { index: i })}
            {f('values', 'subtitle', 'Short description', { index: i })}
          </Box>
        ))}
      </SectionBlock>
    ),
    team: (
      <>
        <SectionBlock first title="Creator Profile" sub="The card in “The Builders Behind It”.">
          <Box sx={two}>
            {f('team', 'name', 'Name')}
            {f('team', 'position', 'Role')}
          </Box>
          <RichTextEditor id="about-team-bio" label="Bio" helper="Tell visitors about the person behind BloodLife AI."
            value={draft.team.bio} onChange={setField('team', 'bio')} max={L.team.bio}
            placeholder="Background, role in the project, what drives the work…" />
        </SectionBlock>
        <SectionBlock title="Creator Photo">
          {imageSlot('creator', 'Portrait', 'A square photo works best. Without one, the page shows initials.', true)}
        </SectionBlock>
      </>
    ),
    stats: (
      <SectionBlock first title="Impact Stats" sub="The numbers are counted live from the database; you can rename what they mean.">
        <Alert icon={<Info fontSize="small" />} severity="info" sx={{ borderRadius: '12px', fontSize: '0.82rem' }}>
          Stat values (donors, donations, hospitals, fulfilled requests) can&apos;t be typed in, so the page never shows made-up numbers.
        </Alert>
        {draft.stats.map((_, i) => (
          <Box key={i} sx={{ ...two, p: 2, borderRadius: '14px', border: 1, borderColor: 'divider' }}>
            {f('stats', 'label', `Stat ${i + 1} label`, { index: i })}
            {f('stats', 'caption', 'Caption', { index: i })}
          </Box>
        ))}
      </SectionBlock>
    ),
    cta: (
      <SectionBlock first title="Call to Action" sub="The strip at the bottom of the page. The button links to the donate page.">
        {f('cta', 'title', 'Heading')}
        {f('cta', 'text', 'Text', { multiline: true, rows: 2 })}
        {f('cta', 'button', 'Button label')}
      </SectionBlock>
    ),
  };

  const cardSx = {
    bgcolor: 'background.paper', borderRadius: '20px',
    border: `1px solid ${isDark ? '#242424' : '#f0e8e8'}`,
    boxShadow: isDark ? 'none' : '0 10px 34px rgba(120,20,20,0.06)',
  };
  // Typing stays responsive: the preview catches up with the draft when React has time.
  const previewSections = useDeferredValue(draft);
  const frameWidth = DEVICES.find((d) => d.id === device).width;

  return (
    <Box sx={{ containerType: 'inline-size', containerName: 'about-editor' }}>
      {/* Header */}
      <Box sx={enter(0)}>
        <Breadcrumbs sx={{ fontSize: '0.85rem', mb: 1.5 }}>
          <Typography sx={{ fontSize: 'inherit', color: 'text.secondary' }}>Settings</Typography>
          <Typography sx={{ fontSize: 'inherit', color: 'text.primary', fontWeight: 600 }}>About Page</Typography>
        </Breadcrumbs>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap', mb: 3 }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '14px', flexShrink: 0, display: 'grid', placeItems: 'center', color: '#fff',
            background: 'linear-gradient(135deg, #b71c1c, #e53935)', boxShadow: '0 8px 20px rgba(198,40,40,0.3)',
          }}>
            <ArticleOutlined />
          </Box>
          <Box sx={{ flex: '1 1 280px', minWidth: 0 }}>
            <Typography component="h2" sx={{ fontWeight: 800, fontSize: { xs: '1.35rem', sm: '1.6rem' }, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              About Page Editor
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mt: 0.5, maxWidth: 560 }}>
              Update your organization&apos;s story, mission and information. Saved changes appear on the public About page.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
            {dirty && (
              <>
                <Chip size="small" label="Unsaved changes" sx={{ fontWeight: 700, bgcolor: isDark ? 'rgba(245,158,11,0.15)' : '#fff7e6', color: '#b45309', ...enter(0) }} />
                <Button onClick={() => setDraft(saved)} startIcon={<Undo />} disabled={saving}
                  sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
                  Discard
                </Button>
              </>
            )}
            <Button component="a" href="/about" target="_blank" rel="noopener" variant="outlined" startIcon={<Visibility />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 2, py: 1, color: RED, borderColor: isDark ? '#5a2a2a' : '#f0caca',
                transition: 'transform 0.2s, background-color 0.2s', '&:hover': { borderColor: RED, bgcolor: isDark ? 'rgba(198,40,40,0.08)' : '#fff5f5', transform: 'translateY(-1px)' }, ...calm,
              }}>
              Preview Page
            </Button>
            <Button onClick={save} variant="contained" disabled={!dirty || saving || loading}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
              sx={{
                textTransform: 'none', fontWeight: 700, borderRadius: '12px', px: 2.5, py: 1, color: '#fff',
                background: 'linear-gradient(120deg, #a3111a, #e53935)', boxShadow: '0 8px 20px rgba(198,40,40,0.3)',
                transition: 'transform 0.2s, box-shadow 0.25s, filter 0.2s',
                '&:hover': { transform: 'translateY(-1px) scale(1.02)', boxShadow: '0 12px 30px rgba(220,40,40,0.45)', filter: 'brightness(1.05)' },
                '&.Mui-disabled': { color: '#fff', opacity: 0.55, background: 'linear-gradient(120deg, #a3111a, #e53935)' },
                ...calm,
              }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </Box>
      </Box>

      {loadError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}
          action={<Button color="error" size="small" onClick={load} sx={{ fontWeight: 700, textTransform: 'none' }}>Retry</Button>}>
          {loadError}
        </Alert>
      )}

      <Box sx={{
        display: 'grid', gap: 2.5, alignItems: 'start',
        '@container about-editor (min-width: 1040px)': { gridTemplateColumns: 'minmax(0, 1.08fr) minmax(0, 1fr)' },
      }}>
        {/* Editor */}
        <Box sx={{ ...cardSx, overflow: 'hidden', ...enter(0.08) }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
            aria-label="About page sections"
            sx={{
              px: 1.5, borderBottom: 1, borderColor: 'divider', minHeight: 56,
              '& .MuiTabs-indicator': { bgcolor: RED, height: 3, borderRadius: '3px 3px 0 0' },
              '& .MuiTab-root': {
                textTransform: 'none', fontWeight: 600, fontSize: '0.86rem', minHeight: 56, px: 1.75, color: 'text.secondary',
                transition: 'color 0.2s', '& svg': { fontSize: 18, transition: 'transform 0.2s', ...calm },
                '&:hover': { color: RED, '& svg': { transform: 'scale(1.15)' } },
              },
              '& .MuiTab-root.Mui-selected': { color: RED, fontWeight: 700 },
            }}>
            {TABS.map((t) => <Tab key={t.id} value={t.id} label={t.label} icon={t.icon} iconPosition="start" id={`about-tab-${t.id}`} aria-controls="about-tabpanel" />)}
          </Tabs>
          <Box id="about-tabpanel" role="tabpanel" aria-labelledby={`about-tab-${tab}`} sx={{ p: { xs: 2.25, sm: 3 } }}>
            {loading || !limits ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 6, justifyContent: 'center' }}>
                {!loadError && <CircularProgress size={22} color="error" />}
                <Typography color="text.secondary">{loadError ? 'Content could not be loaded.' : 'Loading content…'}</Typography>
              </Box>
            ) : (
              <Box key={tab} sx={enter(0)}>{panels[tab]}</Box>
            )}
          </Box>
        </Box>

        {/* Live preview */}
        <Box sx={{
          ...cardSx, overflow: 'hidden', ...enter(0.16),
          '@container about-editor (min-width: 1040px)': { position: 'sticky', top: 88 },
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.75, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', display: 'grid', placeItems: 'center', bgcolor: isDark ? 'rgba(198,40,40,0.16)' : '#fdeaea', color: RED }}>
              <Visibility fontSize="small" />
            </Box>
            <Box sx={{ mr: 'auto', minWidth: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem' }}>Live Preview</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.76rem' }}>
                {dirty ? 'Showing unsaved changes' : 'This is how your About page looks'}
              </Typography>
            </Box>
            <Box role="group" aria-label="Preview size" sx={{ display: 'flex', gap: 0.5, p: 0.5, borderRadius: '10px', bgcolor: isDark ? '#1a1a1a' : '#f6f1f1' }}>
              {DEVICES.map((d) => (
                <Tooltip key={d.id} title={d.label}>
                  <IconButton size="small" aria-label={`${d.label} preview`} aria-pressed={device === d.id} onClick={() => setDevice(d.id)}
                    sx={{
                      borderRadius: '8px', color: device === d.id ? RED : 'text.secondary',
                      bgcolor: device === d.id ? 'background.paper' : 'transparent',
                      boxShadow: device === d.id ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s', ...calm,
                    }}>
                    {d.icon}
                  </IconButton>
                </Tooltip>
              ))}
            </Box>
          </Box>
          <Box sx={{ p: 2, bgcolor: isDark ? '#0c0c0c' : '#faf7f7', maxHeight: { lg: 'calc(100vh - 210px)' }, overflowY: 'auto' }}>
            <ScaledFrame width={frameWidth}>
              <Box sx={{ borderRadius: '14px', overflow: 'hidden', border: `1px solid ${isDark ? '#262626' : '#eee3e3'}` }}>
                <AboutPreview sections={previewSections} images={previewImages} stats={stats} />
              </Box>
            </ScaledFrame>
          </Box>
        </Box>
      </Box>

      {toast && (
        <Snackbar open key={toast.text} autoHideDuration={4500} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={toast.type} variant="filled" onClose={() => setToast(null)} sx={{ borderRadius: '12px', fontWeight: 600 }}
            iconMapping={{ success: <VolunteerActivism fontSize="inherit" /> }}>
            {toast.text}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
