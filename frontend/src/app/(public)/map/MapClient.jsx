'use client';
import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import {
  Box, Typography, Tabs, Tab, Card, CardContent, Avatar, Chip, CircularProgress, Alert,
  Button, IconButton, Tooltip, useTheme, Autocomplete, TextField, InputAdornment,
} from '@mui/material';
import { LocalHospital, MyLocation, Directions, LocationOn, FiberManualRecord, PersonSearch, Search as SearchIcon, Phone as PhoneIcon } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { PROVINCES, findProvince, geocodePlace } from '@/lib/places';
import { distanceKm as getDistanceKm } from '@/lib/geo';

const DEFAULT_CENTER = [11.5564, 104.9282]; // Phnom Penh [lat, lng]

const HOSPITAL_LIMIT = 60;
const DONOR_LIMIT = 100;
const HOSPITAL_REQUEST_TIMEOUT_MS = 32000; // just above the backend's own worst case (~28 s across several OSM servers)
const CACHE_TTL_MS = 10 * 60 * 1000;

const BLOOD_COLORS = {
  'A+': '#e53935', 'A-': '#c62828', 'B+': '#8e24aa', 'B-': '#6a1b9a',
  'AB+': '#1565c0', 'AB-': '#0d47a1', 'O+': '#2e7d32', 'O-': '#1b5e20',
};

const BLOOD_TYPES = Object.keys(BLOOD_COLORS);
const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
const HOSPITAL_TYPES = [['all', 'All'], ['Hospital', 'Hospitals'], ['Clinic', 'Clinics']];

// OSM phone tags can hold several numbers ("+855 23 1; +855 12 2"): call the first one.
const telHref = (phone) => {
  const digits = String(phone || '').split(/[;,/]/)[0].replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 5 ? `tel:${digits}` : null;
};

const directionsUrl = (lat, lng) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

const openDirections = (lat, lng) => {
  window.open(directionsUrl(lat, lng), '_blank', 'noopener,noreferrer');
};

// sessionStorage cache so tab switches / revisits do not re-request hospitals.
const readCache = (key) => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    return Date.now() - t < CACHE_TTL_MS ? v : null;
  } catch { return null; }
};
const writeCache = (key, v) => {
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), v })); } catch { /* quota / private mode */ }
};

const rankByDistance = (list, center, limit) =>
  list
    .map((item) => ({ ...item, dist: getDistanceKm(center, item.base || item.pos) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit);

// Donors only have a city, so everyone in a city shares one coordinate and their
// markers stack into one unclickable pile. Spread them deterministically (~0.4-3 km)
// around the city centre; distance is still measured to the real city centre.
const spreadPos = ([lat, lng], seed) => {
  let h = 0;
  for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const angle = ((h % 360) * Math.PI) / 180;
  const r = 0.004 + (((h >>> 9) % 100) / 100) * 0.026;
  return [lat + r * Math.sin(angle), lng + r * Math.cos(angle)];
};

// Keeps ?city= in the address bar in sync with the current search so the view is shareable.
const setCityParam = (value) => {
  try {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('city', value); else url.searchParams.delete('city');
    window.history.replaceState(window.history.state, '', url);
  } catch { /* purely cosmetic */ }
};

const makeIcon = (color, symbol, size = 34, ring = '#fff') =>
  L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;background:${color};border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:17px;font-weight:900;
      border:3px solid ${ring};box-shadow:0 2px 8px rgba(0,0,0,0.35);
      line-height:1;">${symbol}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 3)],
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
// The selected place is bigger, darker and ringed so it stands out from its neighbours.
const selectedHospitalIcon = makeIcon('#7f0000', '+', 44, '#ffca28');
const selectedDonorIcon    = makeIcon('#7f0000', '🩸', 44, '#ffca28');

// Cluster bubbles: bigger for bigger groups. Cached per (count) because icons are recreated on every zoom.
const clusterIcons = new Map();
const clusterIcon = (count) => {
  if (!clusterIcons.has(count)) {
    const size = count < 10 ? 38 : count < 30 ? 46 : 54;
    clusterIcons.set(count, L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:rgba(183,28,28,0.92);border:4px solid rgba(255,255,255,0.9);
        box-shadow:0 2px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:${size > 46 ? 16 : 14}px;">${count}</div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    }));
  }
  return clusterIcons.get(count);
};

// Moves further than this are instant: an animated flight across hundreds of kilometres
// just streams tiles for the whole trip (and leaves grey gaps while they arrive).
const FAR_JUMP_M = 150000;

// Moves the map to a target and, if asked, opens that marker's popup once it arrives.
function MapFlyTo({ target, markerRefs }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return undefined;
    const zoom = Math.max(map.getZoom(), target.zoom || 14);
    let retry;
    const openPopup = (attempt = 0) => {
      const marker = markerRefs.current[target.openId];
      if (marker) marker.openPopup();
      else if (attempt < 6) retry = setTimeout(() => openPopup(attempt + 1), 120); // it may mount just after the move
    };
    const distance = map.distance(map.getCenter(), target.pos);

    if (distance < 1 && map.getZoom() === zoom) { // already there: no move, so no moveend
      if (target.openId) openPopup();
      return undefined;
    }
    // Registered before moving: a non-animated move fires moveend synchronously.
    const onMoveEnd = () => openPopup();
    if (target.openId) map.once('moveend', onMoveEnd);
    if (distance > FAR_JUMP_M) map.setView(target.pos, zoom, { animate: false });
    else map.flyTo(target.pos, zoom, { duration: 0.8 });
    return () => { map.off('moveend', onMoveEnd); clearTimeout(retry); };
  }, [target, map, markerRefs]);
  return null;
}

// Leaflet measures its container once, at mount. The page's CSS and layout can still be
// settling then (this component is loaded lazily), which leaves tiles missing for part of
// the map — so re-measure after layout settles and whenever the container is resized.
function MapSizeSync() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    };
    sync();
    const settle = setTimeout(sync, 300);
    const observer = new ResizeObserver(sync);
    observer.observe(container);
    return () => { cancelAnimationFrame(frame); clearTimeout(settle); observer.disconnect(); };
  }, [map]);
  return null;
}

// A tile that fails to load (a hiccup from the free OSM tile server) is retried a couple
// of times instead of leaving a permanent grey hole.
const retryTile = ({ tile }) => {
  const tries = Number(tile.dataset.retries || 0);
  if (tries >= 2) return;
  tile.dataset.retries = String(tries + 1);
  const src = tile.src;
  setTimeout(() => { if (tile.isConnected) tile.src = src; }, 800 * (tries + 1));
};

// Groups nearby places into numbered bubbles that split apart as you zoom in, instead of a pile
// of overlapping pins. Grouping is done on a pixel grid at the current zoom, so it's cheap and
// stable while panning. The selected place is never grouped (its popup needs a real marker),
// and at street level (NO_CLUSTER_ZOOM and closer) nothing is grouped at all.
const CLUSTER_CELL_PX = 64;
const NO_CLUSTER_ZOOM = 16;

function ClusteredMarkers({ items, isHosp, selectedId, markerRefs, onMarkerClick }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  const groups = useMemo(() => {
    if (zoom >= NO_CLUSTER_ZOOM) return items.map((item) => ({ key: item.id, items: [item] }));
    const cells = new Map();
    const singles = [];
    for (const item of items) {
      if (item.id === selectedId) { singles.push({ key: item.id, items: [item] }); continue; }
      const point = map.project(item.pos, zoom);
      const cell = `${Math.floor(point.x / CLUSTER_CELL_PX)}:${Math.floor(point.y / CLUSTER_CELL_PX)}`;
      if (!cells.has(cell)) cells.set(cell, []);
      cells.get(cell).push(item);
    }
    const grouped = [...cells.entries()].map(([cell, list]) => (
      list.length === 1 ? { key: list[0].id, items: list } : { key: `cluster-${cell}`, items: list }
    ));
    return [...singles, ...grouped];
  }, [items, zoom, selectedId, map]);

  return groups.map((group) => {
    if (group.items.length === 1) {
      const item = group.items[0];
      const isSelected = item.id === selectedId;
      return (
        <Marker
          key={item.id}
          position={item.pos}
          icon={isSelected ? (isHosp ? selectedHospitalIcon : selectedDonorIcon) : (isHosp ? hospitalIcon : donorIcon)}
          zIndexOffset={isSelected ? 1000 : 0}
          ref={(r) => { if (r) markerRefs.current[item.id] = r; else delete markerRefs.current[item.id]; }}
          eventHandlers={{ click: () => onMarkerClick(item.id) }}
        >
          <Popup>
            <PopupBody item={item} isHosp={isHosp} />
          </Popup>
        </Marker>
      );
    }
    const lat = group.items.reduce((sum, i) => sum + i.pos[0], 0) / group.items.length;
    const lng = group.items.reduce((sum, i) => sum + i.pos[1], 0) / group.items.length;
    return (
      <Marker
        key={group.key}
        position={[lat, lng]}
        icon={clusterIcon(group.items.length)}
        keyboard={false}
        eventHandlers={{
          click: () => map.fitBounds(L.latLngBounds(group.items.map((i) => i.pos)), { padding: [60, 60], maxZoom: NO_CLUSTER_ZOOM }),
        }}
      />
    );
  });
}

// Reports where the map is looking (its centre and how wide the visible area is) — but only after
// the USER dragged it. Moves the app makes itself (selecting a place, a new search) must not
// trigger "Search this area". A drag's inertia ends in a moveend, so that's when we report.
function MapCenterReporter({ onChange }) {
  const draggedByUser = useRef(false);
  const map = useMapEvents({
    dragend: () => { draggedByUser.current = true; },
    moveend: () => {
      if (!draggedByUser.current) return;
      draggedByUser.current = false;
      const c = map.getCenter();
      const b = map.getBounds();
      onChange({ pos: [c.lat, c.lng], widthKm: map.distance([c.lat, b.getWest()], [c.lat, b.getEast()]) / 1000 });
    },
  });
  return null;
}

// Plain markup on purpose: react-leaflet mounts every Popup's children up front, so
// MUI trees here would be built for every marker even though only one is ever open.
// (Popups are always white, so colours are fixed rather than theme-driven.)
function PopupBody({ item, isHosp }) {
  const muted = { fontSize: 12, color: '#666', margin: '2px 0 0' };
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{isHosp ? item.name : item.fullName}</div>
      {isHosp ? (
        <>
          {item.address && <p style={muted}>{item.address}</p>}
          <span style={{ display: 'inline-block', marginTop: 4, padding: '1px 8px', borderRadius: 9, fontSize: 11, fontWeight: 600, background: '#ffebee', color: '#b71c1c' }}>{item.type}</span>
        </>
      ) : (
        <>
          <span style={{ display: 'inline-block', marginTop: 2, padding: '1px 8px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: `${BLOOD_COLORS[item.bloodType] || '#b71c1c'}18`, color: BLOOD_COLORS[item.bloodType] || '#b71c1c' }}>{item.bloodType}</span>
          <p style={muted}>{item.location}</p>
        </>
      )}
      {item.phone && (telHref(item.phone)
        ? <p style={{ ...muted, color: '#333' }}>📞 <a href={telHref(item.phone)} style={{ color: '#333' }}>{item.phone}</a></p>
        : <p style={{ ...muted, color: '#333' }}>📞 {item.phone}</p>)}
      <a href={directionsUrl(...(item.base || item.pos))} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, color: '#b71c1c', textDecoration: 'none' }}>
        ➜ Get Directions
      </a>
    </div>
  );
}

// Memoised so selecting one card or moving the map doesn't re-render the whole list.
const ListCard = memo(function ListCard({ item, isHosp, isSelected, isDark, onSelect }) {
  const sidebarBg = isDark ? '#111111' : '#ffffff';
  const sidebarBorder = isDark ? '#1f1f1f' : '#f0f0f0';
  const bloodColor = BLOOD_COLORS[item.bloodType] || '#b71c1c';
  return (
    <Card
      id={`place-${item.id}`}
      onClick={() => onSelect(item)}
      sx={{
        mb: 1, cursor: 'pointer', borderRadius: 2.5, bgcolor: sidebarBg,
        border: isSelected ? '2px solid #b71c1c' : `1.5px solid ${sidebarBorder}`,
        boxShadow: isSelected ? '0 4px 16px rgba(183,28,28,.15)' : 'none',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        '&:hover': { borderColor: '#b71c1c44', boxShadow: '0 2px 12px rgba(0,0,0,.08)' },
      }}
    >
      <CardContent sx={{ p: '12px !important' }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar sx={{
            width: 40, height: 40, flexShrink: 0,
            bgcolor: isHosp ? (isDark ? 'rgba(183,28,28,0.18)' : '#ffebee') : `${bloodColor}18`,
            color: isHosp ? '#b71c1c' : bloodColor,
            fontSize: '0.78rem', fontWeight: 800,
            border: `1.5px solid ${isHosp ? (isDark ? 'rgba(183,28,28,0.35)' : '#ffcdd2') : bloodColor + '44'}`,
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
              <Chip label={`${item.dist.toFixed(1)} km`} size="small"
                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: isDark ? 'rgba(230,81,0,0.15)' : '#fff3e0', color: '#e65100' }} />
              {isHosp ? (
                <Chip label={item.type} size="small"
                  sx={{ height: 18, fontSize: '0.65rem', bgcolor: isDark ? 'rgba(183,28,28,0.18)' : '#ffebee', color: '#b71c1c', fontWeight: 600 }} />
              ) : (
                <Chip
                  icon={<FiberManualRecord sx={{ fontSize: '8px !important', color: item.available ? '#4caf50 !important' : '#9e9e9e !important' }} />}
                  label={item.available ? 'Available' : 'Unavailable'} size="small"
                  sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
                />
              )}
            </Box>
          </Box>
          {telHref(item.phone) && (
            <Tooltip title={`Call ${item.phone.split(/[;,/]/)[0].trim()}`}>
              <IconButton
                component="a"
                href={telHref(item.phone)}
                size="small"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Call ${item.name || item.fullName}`}
                sx={{ color: '#2e7d32', '&:hover': { bgcolor: '#e8f5e9' } }}
              >
                <PhoneIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Get directions">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); openDirections(...(item.base || item.pos)); }}
              sx={{ color: '#b71c1c', '&:hover': { bgcolor: '#ffebee' } }}
            >
              <Directions sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
});

export default function Maps() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const sidebarBg = isDark ? '#111111' : '#ffffff';
  const sidebarBorder = isDark ? '#1f1f1f' : '#f0f0f0';
  const [tab, setTab]           = useState(0);
  const [userPos, setUserPos]   = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [cityCenter, setCityCenter] = useState(null); // set by ?city= (the homepage search)
  const [cityLabel, setCityLabel] = useState('');   // what ?city= resolved to, for the banner
  const [cityMissing, setCityMissing] = useState('');
  const [flyTo, setFlyTo]       = useState(null);
  const [query, setQuery]       = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating]   = useState(false);
  const [hospType, setHospType]   = useState('all');   // all | Hospital | Clinic
  const [bloodFilter, setBloodFilter] = useState('');  // '' = any
  const [availableOnly, setAvailableOnly] = useState(false);

  const [hospRaw, setHospRaw]           = useState([]);
  const [hospStatus, setHospStatus]     = useState('loading'); // loading | ok | error
  const [hospTick, setHospTick]         = useState(0);         // bump to retry
  const [donorsRaw, setDonorsRaw]       = useState(null);      // null until first successful load
  const [donorStatus, setDonorStatus]   = useState('idle');    // idle | loading | ok | error
  const [donorTick, setDonorTick]       = useState(0);

  const [selected, setSelected] = useState(null);
  const [mapView, setMapView] = useState(null);       // { pos, widthKm }: where the map is looking right now
  const [areaCenter, setAreaCenter] = useState(null); // set by "Search this area"; overrides the search centre
  const markerRefs = useRef({});
  const mapBoxRef = useRef(null);
  const searchCtrl = useRef(null);

  const center = areaCenter || userPos || cityCenter || DEFAULT_CENTER;

  // Use the device location (a cached fix up to 5 min old is fine for "nearest hospital").
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setGeoError(true); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setUserPos(pos);
        setAreaCenter(null);
        setCityCenter(null);
        setCityLabel('');
        setGeoError(false);
        setLocating(false);
        setFlyTo({ pos, zoom: 13 });
        setCityParam(null);
      },
      () => { setGeoError(true); setLocating(false); },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  // Resolves a typed place: a known province instantly, anything else (district, town,
  // Khmer spelling) through OpenStreetMap. A newer search cancels an older one still in flight.
  const searchPlace = useCallback(async (raw, { fallbackToDevice = false } = {}) => {
    const q = raw.trim();
    if (!q) return;
    searchCtrl.current?.abort();
    const ctrl = new AbortController();
    searchCtrl.current = ctrl;
    setSearching(true);
    setCityMissing('');

    let hit = null;
    try {
      const province = findProvince(q);
      hit = province ? { pos: province.pos, label: province.name } : await geocodePlace(q, ctrl.signal);
    } catch { /* treated as "not found" below unless superseded */ }
    if (ctrl.signal.aborted) return;

    setSearching(false);
    if (hit) {
      setUserPos(null);
      setAreaCenter(null);
      setGeoError(false);
      setCityCenter(hit.pos);
      setCityLabel(hit.label);
      setFlyTo({ pos: hit.pos, zoom: 13 });
      setCityParam(q);
    } else {
      setCityMissing(q);
      if (fallbackToDevice) locateMe();
    }
  }, [locateMe]);

  // On arrival: an explicit ?city= (e.g. from the homepage search) wins; otherwise use the device location.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('city')?.trim();
    if (raw) { setQuery(raw); searchPlace(raw, { fallbackToDevice: true }); } else { locateMe(); }
    return () => searchCtrl.current?.abort();
  }, [searchPlace, locateMe]);

  // Hospitals come from our backend (/api/nearby/hospitals), which queries OpenStreetMap with
  // failover across several servers and caches results. They're also cached here per ~1 km
  // cell, and a request superseded by a tab switch or a new location is aborted so it can't
  // overwrite newer data.
  useEffect(() => {
    if (tab !== 0) return;
    const [lat, lng] = center;
    const key = `bl:hospitals:${lat.toFixed(2)},${lng.toFixed(2)}`;
    const cached = readCache(key);
    if (cached) { setHospRaw(cached); setHospStatus('ok'); return; }

    const ctrl = new AbortController();
    setHospStatus('loading');
    axios.get(`${API_BASE}/api/nearby/hospitals`, {
      params: { lat, lng },
      signal: ctrl.signal,
      timeout: HOSPITAL_REQUEST_TIMEOUT_MS,
    })
      .then(({ data }) => {
        const list = Array.isArray(data?.hospitals) ? data.hospitals : [];
        // don't pin an empty or stale (server fell back to expired data) result
        if (list.length && !data.stale) writeCache(key, list);
        setHospRaw(list);
        setHospStatus('ok');
      })
      .catch((err) => { if (!axios.isCancel(err)) setHospStatus('error'); });

    return () => ctrl.abort();
  }, [tab, center, hospTick]);

  // Donors: fetched once, then reused across tab switches and location changes.
  useEffect(() => {
    if (tab !== 1 || donorsRaw) return;
    const ctrl = new AbortController();
    setDonorStatus('loading');
    axios.get(`${API_BASE}/api/donors`, { signal: ctrl.signal })
      .then(({ data }) => { setDonorsRaw(Array.isArray(data) ? data : []); setDonorStatus('ok'); })
      .catch((err) => { if (!axios.isCancel(err)) setDonorStatus('error'); });
    return () => ctrl.abort();
  }, [tab, donorsRaw, donorTick]);

  const hospitals = useMemo(
    () => rankByDistance(hospType === 'all' ? hospRaw : hospRaw.filter((h) => h.type === hospType), center, HOSPITAL_LIMIT),
    [hospRaw, hospType, center]
  );

  const { donors, donorTotal } = useMemo(() => {
    const known = (donorsRaw || [])
      .filter((d) => (!bloodFilter || d.bloodType === bloodFilter) && (!availableOnly || d.available))
      .map((d) => ({ d, base: findProvince(d.location)?.pos }))
      .filter(({ base }) => base)
      .map(({ d, base }) => ({ ...d, id: d._id, base, pos: spreadPos(base, d._id) }));
    return { donors: rankByDistance(known, center, DONOR_LIMIT), donorTotal: known.length };
  }, [donorsRaw, bloodFilter, availableOnly, center]);

  const items   = tab === 0 ? hospitals : donors;
  const status  = tab === 0 ? hospStatus : donorStatus;
  const loading = status === 'loading';
  const failed  = status === 'error';
  const retry   = () => (tab === 0 ? setHospTick((n) => n + 1) : setDonorTick((n) => n + 1));

  // Selecting from the list flies there and opens the popup; clicking a marker just
  // marks it selected (Leaflet already opens its popup and pans to fit it).
  const handleSelectItem = useCallback((item) => {
    setSelected(item.id);
    setFlyTo({ pos: item.pos, openId: item.id });
    // On phones the map sits above the list, so bring it back into view.
    if (window.innerWidth < 900) mapBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);
  const handleMarkerClick = useCallback((id) => {
    setSelected(id);
    // Wide screens: bring the matching list card into view. (On phones the list is below the
    // map, and scrolling to it would pull the map out of sight.)
    if (window.innerWidth >= 900) document.getElementById(`place-${id}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, []);

  // The app moving the map itself (selecting a place, a new search, locate) invalidates any earlier drag.
  useEffect(() => { setMapView(null); }, [center, flyTo]);

  // Offer "Search this area" once the view has moved well away from where results are centred:
  // 4 km, or half the visible width when zoomed in far enough that 4 km would be off-screen.
  const movedAway = tab === 0 && mapView && getDistanceKm(mapView.pos, center) > Math.min(4, mapView.widthKm * 0.5);

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero — kept short so the map gets the screen */}
      <Box sx={{
        px: { xs: 3, md: 8 }, py: { xs: 2.5, md: 3 },
        background: 'linear-gradient(135deg,#1a0000 0%,#7f0000 60%,#b71c1c 100%)',
      }}>
        <Typography variant="h4" fontWeight={900} color="white" sx={{ fontSize: { xs: '1.45rem', md: '1.9rem' } }}>
          Find Nearest Help
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,.75)', fontSize: { xs: '0.88rem', md: '0.95rem' }, mt: 0.5 }}>
          Hospitals and available donors near you — every second counts.
        </Typography>
      </Box>

      {/* Main content */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { md: 'calc(100vh - 176px)' }, minHeight: { md: 520 } }}>

        {/* Sidebar */}
        <Box sx={{
          width: { xs: '100%', md: 360 }, flexShrink: 0, order: { xs: 2, md: 1 },
          display: 'flex', flexDirection: 'column',
          borderRight: { md: `1px solid ${sidebarBorder}` },
          bgcolor: sidebarBg, overflow: 'hidden',
        }}>
          {/* Place search + device location */}
          <Box
            component="form"
            role="search"
            onSubmit={(e) => { e.preventDefault(); searchPlace(query); }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.5, py: 1.25, borderBottom: `1px solid ${sidebarBorder}` }}
          >
            <Autocomplete
              freeSolo
              fullWidth
              size="small"
              options={PROVINCE_NAMES}
              inputValue={query}
              onInputChange={(_, value) => setQuery(value)}
              onChange={(_, value, reason) => { if (reason === 'selectOption' && value) searchPlace(value); }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search a city or province…"
                  slotProps={{
                    htmlInput: { ...params.inputProps, 'aria-label': 'Search a city or province' },
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18 }} /></InputAdornment>
                      ),
                      endAdornment: (
                        <>
                          {searching && <CircularProgress color="error" size={16} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
            <Tooltip title="Use my location">
              <span>
                <IconButton onClick={() => { setCityMissing(''); locateMe(); }} disabled={locating} aria-label="Use my location"
                  sx={{ color: userPos ? '#1565c0' : '#b71c1c' }}>
                  {locating ? <CircularProgress color="error" size={20} /> : <MyLocation />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Tabs
            value={tab}
            onChange={(_, v) => { setTab(v); setSelected(null); }}
            sx={{
              borderBottom: `1px solid ${sidebarBorder}`, px: 1,
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.875rem', minHeight: 52 },
              '& .Mui-selected': { color: '#b71c1c' },
              '& .MuiTabs-indicator': { bgcolor: '#b71c1c' },
            }}
          >
            <Tab icon={<LocalHospital sx={{ fontSize: 18 }} />} iconPosition="start" label="Hospitals" />
            <Tab icon={<PersonSearch sx={{ fontSize: 18 }} />} iconPosition="start" label="Donors" />
          </Tabs>

          {/* Filters */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, px: 1.5, pt: 1.25 }}>
            {tab === 0 ? (
              HOSPITAL_TYPES.map(([value, label]) => (
                <Chip key={value} label={label} size="small" clickable onClick={() => setHospType(value)}
                  color={hospType === value ? 'error' : 'default'} variant={hospType === value ? 'filled' : 'outlined'}
                  sx={{ fontWeight: 600 }} />
              ))
            ) : (
              <>
                <Chip label="Any blood" size="small" clickable onClick={() => setBloodFilter('')}
                  color={!bloodFilter ? 'error' : 'default'} variant={!bloodFilter ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
                {BLOOD_TYPES.map((bt) => (
                  <Chip key={bt} label={bt} size="small" clickable onClick={() => setBloodFilter(bloodFilter === bt ? '' : bt)}
                    color={bloodFilter === bt ? 'error' : 'default'} variant={bloodFilter === bt ? 'filled' : 'outlined'} sx={{ fontWeight: 700 }} />
                ))}
                <Chip label="Available only" size="small" clickable onClick={() => setAvailableOnly((v) => !v)}
                  icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: availableOnly ? '#fff !important' : '#4caf50 !important' }} />}
                  color={availableOnly ? 'success' : 'default'} variant={availableOnly ? 'filled' : 'outlined'} sx={{ fontWeight: 600 }} />
              </>
            )}
          </Box>

          {areaCenter && (
            <Alert severity="info" icon={<LocationOn />} sx={{ mx: 1.5, mt: 1, py: 0.5, fontSize: '0.78rem', borderRadius: 2 }}
              action={<Button color="inherit" size="small" onClick={() => setAreaCenter(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Reset</Button>}>
              Showing results around the area you moved to.
            </Alert>
          )}
          {cityLabel && !userPos && !areaCenter && (
            <Alert severity="success" icon={<LocationOn />} sx={{ mx: 1.5, mt: 1, py: 0.5, fontSize: '0.78rem', borderRadius: 2 }}>
              Showing results near <strong>{cityLabel}</strong>.
            </Alert>
          )}
          {cityMissing && (
            <Alert severity="warning" sx={{ mx: 1.5, mt: 1, py: 0.5, fontSize: '0.78rem', borderRadius: 2 }}>
              Couldn&apos;t find &ldquo;{cityMissing}&rdquo; in Cambodia — try a province or a nearby town.
            </Alert>
          )}
          {geoError && (
            <Alert severity="info" icon={<MyLocation />} sx={{ mx: 1.5, mt: 1, py: 0.5, fontSize: '0.78rem', borderRadius: 2 }}>
              Couldn&apos;t get your location — allow location access in your browser.{cityCenter ? '' : ' Showing Phnom Penh.'}
            </Alert>
          )}

          <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? '#2a2a2a' : '#e0e0e0', borderRadius: 2 },
          }}>
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress color="error" size={32} />
              </Box>
            )}

            {failed && (
              <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8rem', borderRadius: 2 }}
                action={<Button color="inherit" size="small" onClick={retry}>Retry</Button>}>
                {tab === 0 ? 'Couldn’t load nearby hospitals.' : 'Couldn’t load donors.'}
              </Alert>
            )}

            {!loading && !failed && items.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography color="text.secondary" fontSize="0.875rem">
                  {tab === 0
                    ? (hospType === 'all' ? 'No hospitals found nearby.' : 'No matches — try “All”.')
                    : (bloodFilter || availableOnly ? 'No donors match these filters.' : 'No donors found with a known city.')}
                </Typography>
              </Box>
            )}

            {!loading && !failed && tab === 0 && items.length > 0 && (
              <Typography color="text.secondary" fontSize="0.72rem" sx={{ px: 0.5, pb: 1 }}>
                {items.length} nearest {hospType === 'all' ? 'hospitals & clinics' : `${hospType.toLowerCase()}s`} · closest {items[0].dist.toFixed(1)} km away
              </Typography>
            )}

            {!loading && !failed && tab === 1 && donorTotal > items.length && (
              <Typography color="text.secondary" fontSize="0.72rem" sx={{ px: 0.5, pb: 1 }}>
                Showing the nearest {items.length} of {donorTotal} donors.
              </Typography>
            )}

            {!loading && !failed && items.map((item) => (
              <ListCard
                key={item.id}
                item={item}
                isHosp={tab === 0}
                isSelected={selected === item.id}
                isDark={isDark}
                onSelect={handleSelectItem}
              />
            ))}
          </Box>
        </Box>

        {/* Map */}
        <Box ref={mapBoxRef} sx={{ flex: 1, position: 'relative', order: { xs: 1, md: 2 }, height: { xs: 340, md: 'auto' }, minHeight: { xs: 340, md: 'auto' }, scrollMarginTop: '76px', zIndex: 0,
          // Dark theme: invert the light OSM tiles (markers and popups are unaffected).
          '& .leaflet-tile-pane': { filter: isDark ? 'invert(100%) hue-rotate(180deg) brightness(92%) contrast(88%)' : 'none' },
        }}>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={13}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
              keepBuffer={4}
              eventHandlers={{ tileerror: retryTile }}
            />

            <MapSizeSync />

            <MapFlyTo target={flyTo} markerRefs={markerRefs} />

            {/* User location */}
            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup><strong>Your Location</strong></Popup>
              </Marker>
            )}

            <MapCenterReporter onChange={setMapView} />

            {/* Items — grouped into clusters when crowded */}
            {!loading && !failed && (
              <ClusteredMarkers items={items} isHosp={tab === 0} selectedId={selected} markerRefs={markerRefs} onMarkerClick={handleMarkerClick} />
            )}
          </MapContainer>

          {/* Appears after panning away from the current results */}
          {movedAway && !loading && (
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={() => setAreaCenter(mapView.pos)}
              sx={{
                position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
                textTransform: 'none', fontWeight: 700, borderRadius: 5, px: 2.5, bgcolor: '#b71c1c',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)', '&:hover': { bgcolor: '#7f0000' },
              }}
            >
              Search this area
            </Button>
          )}

          {/* Legend */}
          <Box sx={{
            position: 'absolute', top: 12, right: 12, zIndex: 1000,
            bgcolor: isDark ? 'rgba(17,17,17,0.96)' : 'rgba(255,255,255,0.96)', backdropFilter: 'blur(6px)',
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
