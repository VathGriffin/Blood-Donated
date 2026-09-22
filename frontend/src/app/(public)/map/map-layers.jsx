'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import L from 'leaflet';
import { Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { MyLocation, Add, Remove } from '@mui/icons-material';
import { BLOOD_COLORS, TYPE_META, directionsUrl, firstPhone, formatKm, telHref } from './map-utils';

// ── Pins ────────────────────────────────────────────────────────────────────────────────────────
const SHAPES = {
  cross: '<svg viewBox="0 0 24 24" width="56%" height="56%" fill="#fff"><path d="M9.5 3h5v6.5H21v5h-6.5V21h-5v-6.5H3v-5h6.5z"/></svg>',
  drop:  '<svg viewBox="0 0 24 24" width="56%" height="56%" fill="#fff"><path d="M12 2.5c-3.7 4.5-6.2 7.7-6.2 11.1a6.2 6.2 0 0 0 12.4 0c0-3.4-2.5-6.6-6.2-11.1z"/></svg>',
};

const iconCache = new Map();
const pinIcon = (color, shape, size = 34, ring = '#fff') => {
  const key = `${color}|${shape}|${size}|${ring}`;
  if (!iconCache.has(key)) {
    iconCache.set(key, L.divIcon({
      html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid ${ring};box-shadow:0 2px 8px rgba(0,0,0,0.35);">${SHAPES[shape]}</div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 3)],
    }));
  }
  return iconCache.get(key);
};

const userIcon = L.divIcon({
  html: `<div style="width:18px;height:18px;background:#1565c0;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 3px rgba(21,101,192,0.35),0 2px 8px rgba(0,0,0,0.3);"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

// The selected place is bigger, ringed in gold, and drawn on top so it stands out from its neighbours.
const iconFor = (item, isHosp, selected) => {
  const color = isHosp ? (TYPE_META[item.type] || TYPE_META.Hospital).color : '#c62828';
  const shape = isHosp && item.type !== 'Blood Center' ? 'cross' : 'drop';
  return selected ? pinIcon(color, shape, 44, '#ffca28') : pinIcon(color, shape);
};

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

// ── Map behaviour ───────────────────────────────────────────────────────────────────────────────
// Moves further than this are instant: an animated flight across hundreds of kilometres
// just streams tiles for the whole trip (and leaves grey gaps while they arrive).
const FAR_JUMP_M = 150000;

// Moves the map to a target and, if asked, opens that marker's popup once it arrives.
export function MapFlyTo({ target, markerRefs }) {
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
export function MapSizeSync() {
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

// A tile that fails to load (a hiccup from a free tile server) is retried a couple
// of times instead of leaving a permanent grey hole.
export const retryTile = ({ tile }) => {
  const tries = Number(tile.dataset.retries || 0);
  if (tries >= 2) return;
  tile.dataset.retries = String(tries + 1);
  const src = tile.src;
  setTimeout(() => { if (tile.isConnected) tile.src = src; }, 800 * (tries + 1));
};

// Reports where the map is looking (its centre and how wide the visible area is) — but only after
// the USER dragged it. Moves the app makes itself (selecting a place, a new search) must not
// trigger "Search this area". A drag's inertia ends in a moveend, so that's when we report.
export function MapCenterReporter({ onChange }) {
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

// Locate-me and zoom buttons, stacked at the top-right like a native maps app.
export function MapControls({ onLocate, locating, located }) {
  const map = useMap();
  const shield = useCallback((el) => {
    if (!el) return;
    L.DomEvent.disableClickPropagation(el);
    L.DomEvent.disableScrollPropagation(el);
  }, []);
  const button = {
    width: 40, height: 40, borderRadius: '12px', bgcolor: 'background.paper', color: 'text.primary',
    boxShadow: '0 2px 10px rgba(0,0,0,0.22)', '&:hover': { bgcolor: 'background.paper', color: '#b71c1c' },
  };
  return (
    <Box ref={shield} sx={{ position: 'absolute', top: 12, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Tooltip title="Use my location" placement="left">
        <span>
          <IconButton onClick={onLocate} disabled={locating} aria-label="Use my location" sx={{ ...button, color: located ? '#1565c0' : '#b71c1c' }}>
            {locating ? <CircularProgress color="error" size={20} /> : <MyLocation fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
      <Box sx={{ display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', bgcolor: 'background.paper', boxShadow: '0 2px 10px rgba(0,0,0,0.22)' }}>
        <IconButton aria-label="Zoom in" onClick={() => map.zoomIn()} sx={{ ...button, boxShadow: 'none', borderRadius: 0 }}><Add fontSize="small" /></IconButton>
        <Box sx={{ height: '1px', bgcolor: 'divider' }} />
        <IconButton aria-label="Zoom out" onClick={() => map.zoomOut()} sx={{ ...button, boxShadow: 'none', borderRadius: 0 }}><Remove fontSize="small" /></IconButton>
      </Box>
    </Box>
  );
}

// ── Markers ─────────────────────────────────────────────────────────────────────────────────────
// Plain markup on purpose: react-leaflet mounts every Popup's children up front, so
// MUI trees here would be built for every marker even though only one is ever open.
// (Popups are always white, so colours are fixed rather than theme-driven.)
function PopupBody({ item, isHosp }) {
  const muted = { fontSize: 12, color: '#666', margin: '2px 0 0' };
  const meta = TYPE_META[item.type];
  return (
    <div style={{ minWidth: 170 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{isHosp ? item.name : item.fullName}</div>
      {isHosp ? (
        <>
          <span style={{ display: 'inline-block', marginTop: 2, padding: '1px 8px', borderRadius: 9, fontSize: 11, fontWeight: 600, background: meta?.tint, color: meta?.color }}>{item.type}</span>
          {item.address && <p style={muted}>{item.address}</p>}
        </>
      ) : (
        <>
          <span style={{ display: 'inline-block', marginTop: 2, padding: '1px 8px', borderRadius: 9, fontSize: 12, fontWeight: 700, background: `${BLOOD_COLORS[item.bloodType] || '#b71c1c'}18`, color: BLOOD_COLORS[item.bloodType] || '#b71c1c' }}>{item.bloodType}</span>
          <p style={muted}>{item.location}</p>
        </>
      )}
      <p style={muted}>{formatKm(item.dist)} km away</p>
      {item.phone && (telHref(item.phone)
        ? <p style={{ ...muted, color: '#333' }}>📞 <a href={telHref(item.phone)} style={{ color: '#333' }}>{firstPhone(item.phone)}</a></p>
        : <p style={{ ...muted, color: '#333' }}>📞 {item.phone}</p>)}
      <a href={directionsUrl(...(item.base || item.pos))} target="_blank" rel="noopener noreferrer"
        style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 700, color: '#b71c1c', textDecoration: 'none' }}>
        ➜ Get Directions
      </a>
    </div>
  );
}

// Groups nearby places into numbered bubbles that split apart as you zoom in, instead of a pile
// of overlapping pins. Grouping is done on a pixel grid at the current zoom, so it's cheap and
// stable while panning. The selected place is never grouped (its popup needs a real marker),
// and at street level (NO_CLUSTER_ZOOM and closer) nothing is grouped at all.
const CLUSTER_CELL_PX = 64;
const NO_CLUSTER_ZOOM = 16;

export function ClusteredMarkers({ items, isHosp, selectedId, markerRefs, onMarkerClick }) {
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
          icon={iconFor(item, isHosp, isSelected)}
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

export { userIcon };
