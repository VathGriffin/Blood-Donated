'use client';
import Link from 'next/link';
import { Box, Typography, Chip, Avatar, Button, IconButton, useTheme } from '@mui/material';
import {
  LocalHospital, Close, LocationOn, Phone, Language, AccessTime, Directions, Emergency, Accessible, WaterDrop,
  EventAvailable, VolunteerActivism, ChevronRight, OpenInNew, FiberManualRecord, Apartment,
} from '@mui/icons-material';
import {
  BLOOD_COLORS, TYPE_META, firstPhone, formatKm, isOpen247, openDirections, osmUrl, telHref, websiteHost,
} from './map-utils';

const RED = '#c62828';

function InfoRow({ icon, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, py: 0.6 }}>
      <Box aria-hidden="true" sx={{ color: RED, display: 'flex', pt: '2px', '& svg': { fontSize: 19 } }}>{icon}</Box>
      <Typography component="div" sx={{ fontSize: '0.88rem', lineHeight: 1.5, minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Typography>
    </Box>
  );
}

function ActionLink({ href, icon, title, hint }) {
  const isDark = useTheme().palette.mode === 'dark';
  return (
    <Box component={Link} href={href} sx={{
      display: 'flex', alignItems: 'center', gap: 1.25, p: 1.1, borderRadius: '12px', textDecoration: 'none', color: 'inherit',
      bgcolor: isDark ? '#1a1a1a' : '#fff', border: '1px solid', borderColor: isDark ? '#2c2c2c' : '#f1dede', transition: 'border-color .15s',
      '&:hover': { borderColor: RED }, '&:focus-visible': { outline: `2px solid ${RED}`, outlineOffset: 2 },
    }}>
      <Box aria-hidden="true" sx={{ width: 34, height: 34, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: isDark ? 'rgba(198,40,40,0.2)' : '#ffebee', color: RED, '& svg': { fontSize: 19 } }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', lineHeight: 1.25 }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{hint}</Typography>
      </Box>
      <ChevronRight sx={{ color: 'text.disabled' }} />
    </Box>
  );
}

// Everything here comes from OpenStreetMap or our own database. A field nobody has filled in is left
// out (never invented), and the panel links to the place's OSM page so anyone can add it.
export default function PlaceDetails({ item, isHosp, onClose }) {
  const isDark = useTheme().palette.mode === 'dark';
  const meta = TYPE_META[item.type] || TYPE_META.Hospital;
  const accent = isHosp ? meta.color : BLOOD_COLORS[item.bloodType] || RED;
  const name = isHosp ? item.name : item.fullName;
  const phoneHref = telHref(item.phone);
  const open24 = isHosp && isOpen247(item);
  const facilities = isHosp ? [item.emergency && ['Emergency care', <Emergency key="e" />], item.wheelchair && ['Wheelchair accessible', <Accessible key="w" />]].filter(Boolean) : [];
  const osm = isHosp ? osmUrl(item.id) : null;
  const hasContact = Boolean(phoneHref || item.website);

  return (
    <Box component="aside" aria-label={`${name} details`} sx={{ height: '100%', overflowY: 'auto', bgcolor: 'background.paper', border: '1px solid', borderColor: isDark ? '#262626' : '#f0e4e4', borderRadius: '20px', boxShadow: isDark ? 'none' : '0 6px 24px rgba(120,20,20,0.06)' }}>
      <Box sx={{ position: 'relative' }}>
        <Avatar variant="square" src={isHosp ? item.image || undefined : undefined} alt="" imgProps={{ referrerPolicy: 'no-referrer' }}
          sx={{ width: '100%', height: 150, borderRadius: 0, color: 'rgba(255,255,255,0.9)', background: `linear-gradient(135deg, ${accent} 0%, ${accent}b8 100%)`, '& img': { objectFit: 'cover' } }}>
          {isHosp ? <LocalHospital sx={{ fontSize: 64 }} /> : <Typography sx={{ fontSize: '3rem', fontWeight: 900 }}>{item.bloodType}</Typography>}
        </Avatar>
        <IconButton onClick={onClose} aria-label="Close details" size="small" sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'background.paper', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', '&:hover': { bgcolor: 'background.paper' } }}>
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ p: 2.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: '1.3rem', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{name}</Typography>
          {open24 && <Chip label="Open 24/7" size="small" sx={{ fontWeight: 700, bgcolor: isDark ? 'rgba(46,125,50,0.25)' : '#e8f5e9', color: '#2e7d32' }} />}
        </Box>

        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1, mb: 1.25 }}>
          {isHosp ? (
            <>
              <Chip label={item.type} size="small" sx={{ fontWeight: 700, bgcolor: isDark ? `${meta.color}2e` : meta.tint, color: meta.color }} />
              {item.ownership && <Chip label={`${item.ownership} facility`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />}
            </>
          ) : (
            <Chip icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: item.available ? '#4caf50 !important' : '#9e9e9e !important' }} />}
              label={item.available ? 'Available to donate' : 'Not available right now'} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          )}
          <Chip label={`${formatKm(item.dist)} km away`} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
        </Box>

        {isHosp && item.description && (
          <Typography sx={{ fontSize: '0.86rem', lineHeight: 1.55, color: 'text.secondary', mb: 1 }}>{item.description}</Typography>
        )}

        {isHosp ? (
          <>
            <InfoRow icon={<LocationOn />}>{item.address || <Box component="span" sx={{ color: 'text.secondary' }}>Address not mapped yet</Box>}</InfoRow>
            {item.phone && <InfoRow icon={<Phone />}>{phoneHref ? <Box component="a" href={phoneHref} sx={{ color: 'inherit' }}>{firstPhone(item.phone)}</Box> : item.phone}</InfoRow>}
            {item.website && <InfoRow icon={<Language />}><Box component="a" href={item.website} target="_blank" rel="noopener noreferrer" sx={{ color: RED }}>{websiteHost(item.website)}</Box></InfoRow>}
            {item.hours && !open24 && <InfoRow icon={<AccessTime />}>{item.hours}</InfoRow>}
            {item.operator && <InfoRow icon={<Apartment />}>Operated by {item.operator}</InfoRow>}
            {facilities.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1 }}>
                {facilities.map(([label, icon]) => <Chip key={label} icon={icon} label={label} size="small" variant="outlined" sx={{ fontWeight: 600, '& svg': { fontSize: 16 } }} />)}
              </Box>
            )}
          </>
        ) : (
          <>
            <InfoRow icon={<LocationOn />}>{item.location}</InfoRow>
            {item.phone && <InfoRow icon={<Phone />}>{telHref(item.phone) ? <Box component="a" href={telHref(item.phone)} sx={{ color: 'inherit' }}>{firstPhone(item.phone)}</Box> : item.phone}</InfoRow>}
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 0.75 }}>Donors are shown by city, so the pin is approximate.</Typography>
          </>
        )}

        {/* Blood services: real actions on this platform, not claims about what the place offers */}
        <Box sx={{ mt: 2, p: 1.5, borderRadius: '16px', bgcolor: isDark ? 'rgba(198,40,40,0.1)' : '#fbf1f1' }}>
          <Typography sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontWeight: 800, fontSize: '0.95rem', mb: 1, color: RED }}>
            <WaterDrop sx={{ fontSize: 20 }} /> Blood Services
          </Typography>
          <Box sx={{ display: 'grid', gap: 1 }}>
            <ActionLink href="/appointments" icon={<EventAvailable />} title="Book a blood donation" hint="Pick a date and time that suits you" />
            <ActionLink href="/requests" icon={<VolunteerActivism />} title="Request blood" hint="Ask the community for the type you need" />
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25, mt: 2 }}>
          <Button variant="contained" disableElevation startIcon={<Directions />} onClick={() => openDirections(...(item.base || item.pos))}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', py: 1.15, bgcolor: RED, '&:hover': { bgcolor: '#8e1111' } }}>
            Get Directions
          </Button>
          {phoneHref ? (
            <Button variant="outlined" component="a" href={phoneHref} startIcon={<Phone />} color="error" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', py: 1.15, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}>Contact</Button>
          ) : item.website ? (
            <Button variant="outlined" component="a" href={item.website} target="_blank" rel="noopener noreferrer" startIcon={<Language />} color="error" sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', py: 1.15, borderWidth: 1.5, '&:hover': { borderWidth: 1.5 } }}>Website</Button>
          ) : (
            <Button variant="outlined" disabled startIcon={<Phone />} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '12px', py: 1.15 }}>Contact</Button>
          )}
        </Box>
        {!hasContact && isHosp && (
          <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', mt: 1 }}>No phone or website is mapped for this place yet.</Typography>
        )}

        {osm && (
          <Typography component="a" href={osm} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1.5, fontSize: '0.75rem', color: 'text.secondary', textDecoration: 'none', '&:hover': { color: RED } }}>
            Details from OpenStreetMap — view or add info <OpenInNew sx={{ fontSize: 13 }} />
          </Typography>
        )}
      </Box>
    </Box>
  );
}
