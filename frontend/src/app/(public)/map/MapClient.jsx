'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Avatar,
  Chip, CircularProgress, Alert, Button, IconButton, Tooltip,
} from '@mui/material';
import {
  LocalHospital, MyLocation, Directions,
  Phone, LocationOn, FiberManualRecord, PersonSearch,
} from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';

// Prevent Leaflet from trying to resolve icon URLs through webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HERO_IMG =
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1920&q=80';
const DEFAULT_CENTER = [11.5564, 104.9282]; // Phnom Penh [lat, lng]

const BLOOD_COLORS = {
  'A+': '#e53935', 'A-': '#c62828', 'B+': '#8e24aa', 'B-': '#6a1b9a',
  'AB+': '#1565c0', 'AB-': '#0d47a1', 'O+': '#2e7d32', 'O-': '#1b5e20',
};

const CITY_COORDS = {
  'phnom penh':   [11.5564, 104.9282],
  'siem reap':    [13.3671, 103.8448],
  'battambang':   [13.0957, 103.2022],
  'sihanoukville':[10.6238, 103.5228],
  'kampong cham': [11.9936, 105.4635],
  'kandal':       [11.2168, 104.9478],
  'takeo':        [10.9801, 104.7995],
  'kampot':       [10.5939, 104.1625],
  'kratie':       [12.4887, 106.0187],
  'pursat':       [12.5388, 103.9191],
  'prey veng':    [11.4833, 105.3250],
  'svay rieng':   [11.0878, 105.7998],
  'koh kong':     [11.6153, 102.9830],
  'stung treng':  [13.5239, 105.9674],
  'mondulkiri':   [12.4577, 107.1887],
  'ratanakiri':   [13.7298, 106.9873],
};

const getDistanceKm = ([lat1, lng1], [lat2, lng2]) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const openDirections = (lat, lng) => {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
};

const makeIcon = (color, symbol) =>
  L.divIcon({
    html: `<div style="
      width:34px;height:34px;background:${color};border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:17px;font-weight:900;
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);
      line-height:1;">${symbol}</div>`,
    className: '',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

const userIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;background:#1565c0;border-radius:50%;
    border:3px solid #fff;box-shadow:0 0 0 3px rgba(21,101,192,0.35),0 2px 8px rgba(0,0,0,0.3);">
  </div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const hospitalIcon = makeIcon('#b71c1c', '+');
const donorIcon    = makeIcon('#c62828', '🩸');

// Inner component: responds to center prop and flies map there
function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { duration: 0.8 });
  }, [center, zoom, map]);
  return null;
}

export default function Maps() {
  const [tab, setTab]           = useState(0);
  const [userPos, setUserPos]   = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [flyTo, setFlyTo]       = useState(null);

  const [hospitals, setHospitals]         = useState([]);
  const [hospLoading, setHospLoading]     = useState(false);
  const [donors, setDonors]               = useState([]);
  const [donorLoading, setDonorLoading]   = useState(false);

  const [selected, setSelected] = useState(null);
  const popupRefs = useRef({});

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPos([coords.latitude, coords.longitude]),
      () => setGeoError(true),
      { timeout: 8000 }
    );
  }, []);

  // Fetch hospitals from Overpass API
  const fetchHospitals = useCallback(async () => {
    setHospLoading(true);
    setSelected(null);
    const center = userPos || DEFAULT_CENTER;
    const [lat, lng] = center;
    const query = `[out:json][timeout:25];(node["amenity"="hospital"](around:15000,${lat},${lng});node["amenity"="clinic"](around:10000,${lat},${lng}););out;`;
    try {
      const res = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      const parsed = (data.elements || [])
        .filter((el) => el.lat && el.lon && el.tags?.name)
        .map((el) => ({
          id: el.id,
          name: el.tags.name,
          pos: [el.lat, el.lon],
          address: [el.tags['addr:street'], el.tags['addr:city']].filter(Boolean).join(', ') || el.tags['addr:full'] || '',
          phone: el.tags.phone || el.tags['contact:phone'] || '',
          type: el.tags.amenity === 'hospital' ? 'Hospital' : 'Clinic',
        }))
        .sort((a, b) => getDistanceKm(center, a.pos) - getDistanceKm(center, b.pos));
      setHospitals(parsed);
    } catch {
      setHospitals([]);
    } finally {
      setHospLoading(false);
    }
  }, [userPos]);

  // Fetch donors
  const fetchDonors = useCallback(async () => {
    setDonorLoading(true);
    setSelected(null);
    const center = userPos || DEFAULT_CENTER;
    try {
      const { data } = await axios.get(`${API_BASE}/api/donors`);
      const mapped = data
        .filter((d) => CITY_COORDS[d.location?.toLowerCase().trim()])
        .map((d) => ({ ...d, pos: CITY_COORDS[d.location.toLowerCase().trim()] }))
        .sort((a, b) => getDistanceKm(center, a.pos) - getDistanceKm(center, b.pos));
      setDonors(mapped);
    } catch {
      setDonors([]);
    } finally {
      setDonorLoading(false);
    }
  }, [userPos]);

  // Load data when tab or location changes
  useEffect(() => {
    if (tab === 0) fetchHospitals();
    else fetchDonors();
  }, [tab, fetchHospitals, fetchDonors]);

  const center = userPos || DEFAULT_CENTER;
  const items  = tab === 0 ? hospitals : donors;
  const loading = tab === 0 ? hospLoading : donorLoading;

  const handleSelectItem = (item) => {
    setSelected(item.id || item._id);
    setFlyTo({ pos: item.pos, t: Date.now() });
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero */}
      <Box sx={{
        position: 'relative', height: { xs: 220, md: 280 },
        backgroundImage: `url('${HERO_IMG}')`,
        backgroundSize: 'cover', backgroundPosition: 'center top',
        backgroundAttachment: { xs: 'scroll', md: 'fixed' },
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        '&::before': {
          content: '""', position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg,rgba(26,0,0,.88) 0%,rgba(127,0,0,.78) 60%,rgba(183,28,28,.65) 100%)',
        },
      }}>
        <Box sx={{ position: 'relative', zIndex: 1, px: { xs: 3, md: 8 } }}>
          <Chip
            icon={<LocationOn sx={{ fontSize: '0.8rem !important', color: '#ffcdd2 !important' }} />}
            label="LIVE MAP"
            size="small"
            sx={{ bgcolor: 'rgba(255,255,255,.12)', color: 'rgba(255,255,255,.8)', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.1em', mb: 1.5, backdropFilter: 'blur(4px)' }}
          />
          <Typography variant="h3" fontWeight={900} color="white" sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 1 }}>
            Find Nearest Help
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,.7)', fontSize: '1rem', maxWidth: 500 }}>
            Locate hospitals and available donors near you — every second counts.
          </Typography>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { md: 'calc(100vh - 280px)' }, minHeight: { xs: 600, md: 500 } }}>

        {/* Sidebar */}
        <Box sx={{
          width: { xs: '100%', md: 360 }, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          borderRight: { md: '1px solid #f0f0f0' },
          bgcolor: '#fff', overflow: 'hidden',
        }}>
          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setSelected(null); }}
            sx={{
              borderBottom: '1px solid #f0f0f0', px: 1,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.875rem', minHeight: 52 },
              '& .Mui-selected': { color: '#b71c1c' },
              '& .MuiTabs-indicator': { bgcolor: '#b71c1c' },
            }}
          >
            <Tab icon={<LocalHospital sx={{ fontSize: 18 }} />} iconPosition="start" label="Hospitals" />
            <Tab icon={<PersonSearch sx={{ fontSize: 18 }} />} iconPosition="start" label="Donors" />
          </Tabs>

          {geoError && (
            <Alert severity="info" icon={<MyLocation />} sx={{ mx: 1.5, mt: 1, py: 0.5, fontSize: '0.78rem', borderRadius: 2 }}>
              Showing Phnom Penh — allow location for accurate results.
            </Alert>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#e0e0e0', borderRadius: 2 },
          }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress color="error" size={32} />
              </Box>
            )}

            {!loading && items.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary" fontSize="0.875rem">
                  {tab === 0 ? 'No hospitals found nearby.' : 'No donors found with a known city.'}
                </Typography>
              </Box>
            )}

            {!loading && items.map((item) => {
              const id = item.id || item._id;
              const isHosp = tab === 0;
              const isSelected = selected === id;
              const dist = getDistanceKm(center, item.pos);

              return (
                <Card
                  key={id}
                  onClick={() => handleSelectItem(item)}
                  sx={{
                    mb: 1, cursor: 'pointer', borderRadius: 2.5,
                    border: isSelected ? '2px solid #b71c1c' : '1.5px solid #f0f0f0',
                    boxShadow: isSelected ? '0 4px 16px rgba(183,28,28,.15)' : 'none',
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: '#b71c1c44', boxShadow: '0 2px 12px rgba(0,0,0,.08)' },
                  }}
                >
                  <CardContent sx={{ p: '12px !important' }}>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Avatar sx={{
                        width: 40, height: 40, flexShrink: 0,
                        bgcolor: isHosp ? '#ffebee' : `${BLOOD_COLORS[item.bloodType] || '#b71c1c'}18`,
                        color: isHosp ? '#b71c1c' : (BLOOD_COLORS[item.bloodType] || '#b71c1c'),
                        fontSize: '0.78rem', fontWeight: 800,
                        border: `1.5px solid ${isHosp ? '#ffcdd2' : (BLOOD_COLORS[item.bloodType] || '#b71c1c') + '44'}`,
                      }}>
                        {isHosp ? <LocalHospital sx={{ fontSize: 20 }} /> : item.bloodType}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={700} fontSize="0.82rem" noWrap>
                          {isHosp ? item.name : item.fullName}
                        </Typography>
                        <Typography fontSize="0.73rem" color="text.secondary" noWrap>
                          {isHosp ? (item.address || item.type) : item.location}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Chip label={`${dist.toFixed(1)} km`} size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#fff3e0', color: '#e65100' }} />
                          {isHosp && (
                            <Chip label={item.type} size="small"
                              sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#ffebee', color: '#b71c1c', fontWeight: 600 }} />
                          )}
                          {!isHosp && (
                            <Chip
                              icon={<FiberManualRecord sx={{ fontSize: '8px !important', color: item.available ? '#4caf50 !important' : '#9e9e9e !important' }} />}
                              label={item.available ? 'Available' : 'Unavailable'} size="small"
                              sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Tooltip title="Get directions">
                        <IconButton
                          size="small"
                          onClick={(e) => { e.stopPropagation(); openDirections(...item.pos); }}
                          sx={{ color: '#b71c1c', '&:hover': { bgcolor: '#ffebee' } }}
                        >
                          <Directions sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1, position: 'relative', minHeight: { xs: 380, md: 'auto' }, zIndex: 0 }}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {flyTo && <MapFlyTo center={flyTo.pos} />}

            {/* User location */}
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup><strong>Your Location</strong></Popup>
              </Marker>
            )}

            {/* Items */}
            {items.map((item) => {
              const id = item.id || item._id;
              const isHosp = tab === 0;
              const icon = isHosp ? hospitalIcon : donorIcon;
              return (
                <Marker
                  key={id}
                  position={item.pos}
                  icon={icon}
                  ref={(r) => { if (r) popupRefs.current[id] = r; }}
                  eventHandlers={{ click: () => handleSelectItem(item) }}
                >
                  <Popup>
                    <Box sx={{ minWidth: 160 }}>
                      <Typography fontWeight={700} fontSize="0.85rem" mb={0.3}>
                        {isHosp ? item.name : item.fullName}
                      </Typography>
                      {isHosp ? (
                        <>
                          {item.address && <Typography fontSize="0.75rem" color="text.secondary">{item.address}</Typography>}
                          <Chip label={item.type} size="small" sx={{ mt: 0.5, height: 18, fontSize: '0.65rem', bgcolor: '#ffebee', color: '#b71c1c', fontWeight: 600 }} />
                          {item.phone && <Typography fontSize="0.73rem" mt={0.5}><Phone sx={{ fontSize: 12, mr: 0.4 }} />{item.phone}</Typography>}
                        </>
                      ) : (
                        <>
                          <Chip label={item.bloodType} size="small"
                            sx={{ mt: 0.3, height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: `${BLOOD_COLORS[item.bloodType]}18`, color: BLOOD_COLORS[item.bloodType] }} />
                          <Typography fontSize="0.73rem" color="text.secondary" mt={0.4}>{item.location}</Typography>
                          {item.phone && <Typography fontSize="0.73rem" mt={0.3}><Phone sx={{ fontSize: 12, mr: 0.4 }} />{item.phone}</Typography>}
                        </>
                      )}
                      <Button
                        size="small" startIcon={<Directions sx={{ fontSize: '0.9rem !important' }} />}
                        onClick={() => openDirections(...item.pos)}
                        sx={{ mt: 1, textTransform: 'none', fontWeight: 700, color: '#b71c1c', p: 0, fontSize: '0.75rem' }}
                      >
                        Get Directions
                      </Button>
                    </Box>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Legend */}
          <Box sx={{
            position: 'absolute', top: 12, right: 12, zIndex: 1000,
            bgcolor: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)',
            borderRadius: 2, px: 1.5, py: 1,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            display: 'flex', flexDirection: 'column', gap: 0.5,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#1565c0', border: '2px solid #fff', boxShadow: '0 0 0 2px rgba(21,101,192,.4)' }} />
              <Typography fontSize="0.72rem" fontWeight={600}>Your Location</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: '#b71c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography fontSize="0.55rem" color="white" fontWeight={900} lineHeight={1}>{tab === 0 ? '+' : '🩸'}</Typography>
              </Box>
              <Typography fontSize="0.72rem" fontWeight={600}>{tab === 0 ? 'Hospital / Clinic' : 'Donor'}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
