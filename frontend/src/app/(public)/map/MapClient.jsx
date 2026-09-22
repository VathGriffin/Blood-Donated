'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, ScaleControl } from 'react-leaflet';
import { Box, Typography, Alert, Button, ButtonBase, useTheme } from '@mui/material';
import { LocationOn, MyLocation, Search as SearchIcon, TouchApp } from '@mui/icons-material';
import axios from 'axios';
import API_BASE from '@/lib/config';
import { findProvince, geocodePlace } from '@/lib/places';
import { distanceKm } from '@/lib/geo';
import MapHero, { PAGE_WIDTH } from './MapHero';
import PlaceListPanel from './PlaceListPanel';
import PlaceDetails from './PlaceDetails';
import {
  ClusteredMarkers, MapCenterReporter, MapControls, MapFlyTo, MapSizeSync, retryTile, userIcon,
} from './map-layers';
import {
  DEFAULT_CENTER, DONOR_LIMIT, HOSPITAL_LIMIT, HOSPITAL_REQUEST_TIMEOUT_MS, TYPE_META,
  cacheKey, rankPlaces, readCache, setCityParam, toDonorPlaces, writeCache,
} from './map-utils';

// The map may zoom to MAX_ZOOM, but a layer only has real tiles up to its maxNativeZoom; past that
// Leaflet enlarges the last real tile instead of requesting ones that come back blank.
const MIN_ZOOM = 5;  // country level: further out is empty world copies and thousands of tile requests
const MAX_ZOOM = 19;
const BASE_LAYERS = {
  map: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxNativeZoom: 17, // Esri imagery over Cambodia/Vietnam is often missing ("Map data not yet available") beyond this
  },
};

// Used instead of the street map when OpenStreetMap's free tile server keeps refusing us
// (it throttles or blocks some networks, which otherwise leaves the map a blank grey box).
// (Esri needs no API key, unlike CARTO's raster tiles, which now stamp "API KEY REQUIRED" over the map.)
const FALLBACK_STREET_LAYER = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  maxNativeZoom: 18,
  attribution: 'Tiles &copy; Esri &mdash; Source: Esri, HERE, Garmin, &copy; OpenStreetMap contributors',
};
// This many tiles failing in a row, with none loading in between, means the server is refusing us.
const TILE_FAILOVER_ERRORS = 6;

const PANEL_HEIGHT ='clamp(600px, calc(100vh - 200px), 780px)';

function BaseLayerToggle({ value, onChange }) {
  return (
    <Box role="group" aria-label="Map style" sx={{ position: 'absolute', top: 12, left: 12, zIndex: 1000, display: 'flex', p: '3px', borderRadius: '12px', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.22)' }}>
      {[['map', 'Map'], ['satellite', 'Satellite']].map(([key, label]) => (
        <ButtonBase key={key} onClick={() => onChange(key)} aria-pressed={value === key}
          sx={{ px: 2, py: 0.85, borderRadius: '9px', fontWeight: 700, fontSize: '0.84rem', color: value === key ? '#fff' : 'text.primary', bgcolor: value === key ? '#c62828' : 'transparent' }}>
          {label}
        </ButtonBase>
      ))}
    </Box>
  );
}

function Legend({ isHosp }) {
  const dot = (bg, ring) => <Box aria-hidden="true" sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: bg, border: `2px solid ${ring || '#fff'}`, boxShadow: '0 0 0 1px rgba(0,0,0,0.18)', flexShrink: 0 }} />;
  const entries = isHosp
    ? [['Your Location', '#1565c0'], ['Hospital', TYPE_META.Hospital.color], ['Clinic', TYPE_META.Clinic.color], ['Blood Center', TYPE_META['Blood Center'].color]]
    : [['Your Location', '#1565c0'], ['Donor', '#c62828']];
  return (
    <Box sx={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, maxWidth: 'calc(100% - 24px)', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', columnGap: 2, rowGap: 0.5, px: 2, py: 1, borderRadius: '14px', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.22)' }}>
      {entries.map(([label, color]) => (
        <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          {dot(color)}
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function Maps() {
  const isDark = useTheme().palette.mode === 'dark';
  const [tab, setTab] = useState(0);
  const [userPos, setUserPos] = useState(null);
  const [geoError, setGeoError] = useState(false);
  const [cityCenter, setCityCenter] = useState(null); // set by ?city= (the homepage search)
  const [cityLabel, setCityLabel] = useState('');   // what ?city= resolved to, for the banner
  const [cityMissing, setCityMissing] = useState('');
  const [province, setProvince] = useState('');       // the province dropdown's value ('' = all)
  const [flyTo, setFlyTo] = useState(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hospType, setHospType] = useState('all');   // all | Hospital | Clinic | Blood Center
  const [bloodFilter, setBloodFilter] = useState(''); // '' = any
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState('nearest');       // nearest | name
  const [baseLayer, setBaseLayer] = useState('map'); // map | satellite
  const [streetFallback, setStreetFallback] = useState(false); // OSM tiles kept failing: use the backup provider
  const tileErrors = useRef(0);

  const [hospRaw, setHospRaw] = useState([]);
  const [hospStatus, setHospStatus] = useState('loading'); // loading | ok | error
  const [hospTick, setHospTick] = useState(0);             // bump to retry
  const [donorsRaw, setDonorsRaw] = useState(null);        // null until first successful load
  const [donorStatus, setDonorStatus] = useState('idle');  // idle | loading | ok | error
  const [donorTick, setDonorTick] = useState(0);
  const [stats, setStats] = useState(null);                // public platform totals

  const [selected, setSelected] = useState(null);
  const [mapView, setMapView] = useState(null);       // { pos, widthKm }: where the map is looking right now
  const [areaCenter, setAreaCenter] = useState(null); // set by "Search this area"; overrides the search centre
  const markerRefs = useRef({});
  const mapBoxRef = useRef(null);
  const searchCtrl = useRef(null);
  const contentRef = useRef(null);

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
        setProvince('');
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
    let matchedProvince = null;
    try {
      matchedProvince = findProvince(q);
      hit = matchedProvince ? { pos: matchedProvince.pos, label: matchedProvince.name } : await geocodePlace(q, ctrl.signal);
    } catch { /* treated as "not found" below unless superseded */ }
    if (ctrl.signal.aborted) return;

    setSearching(false);
    if (hit) {
      setUserPos(null);
      setAreaCenter(null);
      setGeoError(false);
      setCityCenter(hit.pos);
      setCityLabel(hit.label);
      setProvince(matchedProvince?.name || '');
      setFlyTo({ pos: hit.pos, zoom: 13 });
      setCityParam(q);
    } else {
      setCityMissing(q);
      if (fallbackToDevice) locateMe();
    }
  }, [locateMe]);

  // The province dropdown is a shortcut for searching that province; "All Provinces" drops the search.
  const handleProvince = useCallback((name) => {
    if (name) { setQuery(name); searchPlace(name); return; }
    searchCtrl.current?.abort();
    setSearching(false);
    setProvince('');
    setQuery('');
    setCityCenter(null);
    setCityLabel('');
    setCityMissing('');
    setAreaCenter(null);
    setCityParam(null);
    setFlyTo({ pos: userPos || DEFAULT_CENTER, zoom: 12 });
  }, [searchPlace, userPos]);

  // On arrival: an explicit ?city= (e.g. from the homepage search) wins; otherwise use the device location.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('city')?.trim();
    if (raw) { setQuery(raw); searchPlace(raw, { fallbackToDevice: true }); } else { locateMe(); }
    return () => searchCtrl.current?.abort();
  }, [searchPlace, locateMe]);

  // Public platform totals for the stat cards; the cards show "—" if this fails.
  useEffect(() => {
    const ctrl = new AbortController();
    axios.get(`${API_BASE}/api/stats/public`, { signal: ctrl.signal }).then(({ data }) => setStats(data)).catch(() => {});
    return () => ctrl.abort();
  }, []);

  // Hospitals come from our backend (/api/nearby/hospitals), which queries OpenStreetMap with
  // failover across several servers and caches results. They're also cached here per ~1 km
  // cell, and a request superseded by a tab switch or a new location is aborted so it can't
  // overwrite newer data. (Fetched for both tabs: the "places nearby" stat needs them too.)
  useEffect(() => {
    const [lat, lng] = center;
    const key = cacheKey(lat, lng);
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
  }, [center, hospTick]);

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
    () => rankPlaces(hospType === 'all' ? hospRaw : hospRaw.filter((h) => h.type === hospType), center, HOSPITAL_LIMIT, sort),
    [hospRaw, hospType, center, sort]
  );

  const { donors, donorTotal } = useMemo(() => {
    const known = toDonorPlaces(donorsRaw, { bloodFilter, availableOnly });
    return { donors: rankPlaces(known, center, DONOR_LIMIT, sort), donorTotal: known.length };
  }, [donorsRaw, bloodFilter, availableOnly, center, sort]);

  const isHosp = tab === 0;
  const items = isHosp ? hospitals : donors;
  const status = isHosp ? hospStatus : donorStatus;
  const loading = status === 'loading';
  const failed = status === 'error';
  const retry = () => (isHosp ? setHospTick((n) => n + 1) : setDonorTick((n) => n + 1));

  // Whenever the results change, keep the current selection if it is still listed; otherwise
  // pre-select the first one so the detail panel is never empty. (Closing the panel sets null and
  // does not change the results, so it stays closed until something new loads.)
  useEffect(() => {
    setSelected((prev) => (items.some((i) => i.id === prev) ? prev : items[0]?.id ?? null));
  }, [items]);
  const selectedItem = useMemo(() => items.find((i) => i.id === selected) || null, [items, selected]);

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

  const changeTab = useCallback((next) => { setTab(next); setSelected(null); }, []);
  const showTab = useCallback((next) => {
    changeTab(next);
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [changeTab]);

  // The app moving the map itself (selecting a place, a new search, locate) invalidates any earlier drag.
  useEffect(() => { setMapView(null); }, [center, flyTo]);

  // Offer "Search this area" once the view has moved well away from where results are centred:
  // 4 km, or half the visible width when zoomed in far enough that 4 km would be off-screen.
  const movedAway = mapView && distanceKm(mapView.pos, center) > Math.min(4, mapView.widthKm * 0.5);

  const notices = (areaCenter || (cityLabel && !userPos) || cityMissing || geoError) && (
    <Box sx={{ px: 2, pb: 1, display: 'grid', gap: 0.75 }}>
      {areaCenter && (
        <Alert severity="info" icon={<LocationOn />} sx={{ py: 0.25, fontSize: '0.78rem', borderRadius: 3 }}
          action={<Button color="inherit" size="small" onClick={() => setAreaCenter(null)} sx={{ textTransform: 'none', fontWeight: 700 }}>Reset</Button>}>
          Showing results around the area you moved to.
        </Alert>
      )}
      {cityLabel && !userPos && !areaCenter && (
        <Alert severity="success" icon={<LocationOn />} sx={{ py: 0.25, fontSize: '0.78rem', borderRadius: 3 }}>
          Showing results near <strong>{cityLabel}</strong>.
        </Alert>
      )}
      {cityMissing && (
        <Alert severity="warning" sx={{ py: 0.25, fontSize: '0.78rem', borderRadius: 3 }}>
          Couldn&apos;t find &ldquo;{cityMissing}&rdquo; in Cambodia — try a province or a nearby town.
        </Alert>
      )}
      {geoError && (
        <Alert severity="info" icon={<MyLocation />} sx={{ py: 0.25, fontSize: '0.78rem', borderRadius: 3 }}>
          Couldn&apos;t get your location — allow location access in your browser.{cityCenter ? '' : ' Showing Phnom Penh.'}
        </Alert>
      )}
    </Box>
  );

  const layer = baseLayer === 'map' && streetFallback ? FALLBACK_STREET_LAYER : BASE_LAYERS[baseLayer];
  const tileHandlers = useMemo(() => ({
    tileload: () => { tileErrors.current = 0; },
    tileerror: (e) => {
      retryTile(e);
      if (baseLayer === 'map' && ++tileErrors.current >= TILE_FAILOVER_ERRORS) {
        tileErrors.current = 0;
        setStreetFallback(true);
      }
    },
  }), [baseLayer]);

  return (
    <Box sx={{ minHeight: '100vh', pb: { xs: 3, md: 5 } }}>
      <MapHero
        stats={stats}
        onShowHospitals={() => showTab(0)}
        onShowDonors={() => showTab(1)}
      />

      <Box ref={contentRef} sx={{
        ...PAGE_WIDTH, mt: 3, display: 'grid', gap: { xs: 2, md: 2.5 }, scrollMarginTop: '80px',
        // Desktop: 26% / 43% / 31% (list / map / details); tablet: list beside map + details; phone: stacked.
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '340px minmax(0, 1fr)', lg: 'minmax(0, 26fr) minmax(0, 43fr) minmax(0, 31fr)' },
        gridTemplateAreas: { xs: '"map" "details" "list"', md: '"list map" "list details"', lg: '"list map details"' },
        gridTemplateRows: { md: '600px auto', lg: PANEL_HEIGHT },
      }}>
        {/* Search, filters and results */}
        <Box sx={{ gridArea: 'list', minHeight: 0, height: { xs: 560, md: 'auto', lg: '100%' } }}>
          <PlaceListPanel
            tab={tab} onTab={changeTab} query={query} onQuery={setQuery} onSearch={searchPlace} searching={searching}
            hospType={hospType} onHospType={setHospType} bloodFilter={bloodFilter} onBloodFilter={setBloodFilter}
            availableOnly={availableOnly} onAvailableOnly={setAvailableOnly}
            province={province} onProvince={handleProvince} sort={sort} onSort={setSort}
            items={items} donorTotal={donorTotal} status={status} onRetry={retry}
            selectedId={selected} onSelect={handleSelectItem} notices={notices}
          />
        </Box>

        {/* Map */}
        <Box ref={mapBoxRef} sx={{
          gridArea: 'map', position: 'relative', height: { xs: 400, md: '100%' }, borderRadius: '20px', overflow: 'hidden', isolation: 'isolate', scrollMarginTop: '76px',
          border: '1px solid', borderColor: isDark ? '#262626' : '#f0e4e4', boxShadow: isDark ? 'none' : '0 6px 24px rgba(120,20,20,0.06)',
          // Dark theme: invert the light street tiles (satellite imagery, markers and popups are unaffected).
          '& .leaflet-tile-pane': { filter: isDark && baseLayer === 'map' ? 'invert(100%) hue-rotate(180deg) brightness(92%) contrast(88%)' : 'none' },
          '& .leaflet-control-scale-line': { bgcolor: 'rgba(255,255,255,0.85)' },
        }}>
          <MapContainer center={DEFAULT_CENTER} zoom={13} minZoom={MIN_ZOOM} maxZoom={MAX_ZOOM} zoomControl={false} style={{ width: '100%', height: '100%' }}>
            <TileLayer key={layer.url} attribution={layer.attribution} url={layer.url} subdomains={layer.subdomains || 'abc'} maxNativeZoom={layer.maxNativeZoom} maxZoom={MAX_ZOOM} keepBuffer={4} eventHandlers={tileHandlers} />
            <ScaleControl position="bottomright" imperial={false} />
            <MapSizeSync />
            <MapFlyTo target={flyTo} markerRefs={markerRefs} />
            <MapControls onLocate={() => { setCityMissing(''); locateMe(); }} locating={locating} located={Boolean(userPos)} />

            {userPos && (
              <Marker position={userPos} icon={userIcon}>
                <Popup><strong>Your Location</strong></Popup>
              </Marker>
            )}

            <MapCenterReporter onChange={setMapView} />

            {/* Items — grouped into clusters when crowded */}
            {!loading && !failed && (
              <ClusteredMarkers items={items} isHosp={isHosp} selectedId={selected} markerRefs={markerRefs} onMarkerClick={handleMarkerClick} />
            )}
          </MapContainer>

          <BaseLayerToggle value={baseLayer} onChange={setBaseLayer} />

          {/* Appears after panning away from the current results */}
          {movedAway && !loading && (
            <Button
              variant="contained" disableElevation startIcon={<SearchIcon />} onClick={() => setAreaCenter(mapView.pos)}
              sx={{
                position: 'absolute', top: { xs: 62, sm: 14 }, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
                textTransform: 'none', fontWeight: 700, borderRadius: 5, px: 2.5, bgcolor: '#b71c1c',
                boxShadow: '0 4px 14px rgba(0,0,0,0.3)', '&:hover': { bgcolor: '#7f0000' },
              }}
            >
              Search this area
            </Button>
          )}

          <Legend isHosp={isHosp} />
        </Box>

        {/* Details of the selected place */}
        <Box sx={{ gridArea: 'details', minHeight: 0, height: { xs: 'auto', lg: '100%' }, display: { xs: selectedItem ? 'block' : 'none', lg: 'block' } }}>
          {selectedItem ? (
            <PlaceDetails key={selectedItem.id} item={selectedItem} isHosp={isHosp} onClose={() => setSelected(null)} />
          ) : (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, p: 3, textAlign: 'center', color: 'text.secondary', bgcolor: 'background.paper', border: '1px dashed', borderColor: 'divider', borderRadius: '20px' }}>
              <TouchApp sx={{ fontSize: 40, color: '#c62828' }} />
              <Typography sx={{ fontWeight: 700 }}>Pick a place</Typography>
              <Typography sx={{ fontSize: '0.85rem' }}>Choose a pin on the map or a card in the list to see its address, phone and directions.</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
