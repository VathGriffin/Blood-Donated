'use client';
import { memo } from 'react';
import {
  Box, Typography, Chip, Avatar, CircularProgress, Alert, Button, Autocomplete, TextField, InputAdornment,
  MenuItem, Select, ButtonBase, IconButton, useTheme,
} from '@mui/material';
import {
  LocalHospital, PersonSearch, Search as SearchIcon, LocationOn, FiberManualRecord, Sort as SortIcon,
} from '@mui/icons-material';
import { PROVINCES } from '@/lib/places';
import { BLOOD_COLORS, BLOOD_TYPES, TYPE_FILTERS, TYPE_META, formatKm, isOpen247 } from './map-utils';

const PROVINCE_NAMES = PROVINCES.map((p) => p.name);
const RED = '#b71c1c';

const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: 'background.default' } };

const SectionLabel = ({ children }) => (
  <Typography sx={{ fontSize: '0.86rem', fontWeight: 700, mb: 1 }}>{children}</Typography>
);

// Memoised so selecting one card or moving the map doesn't re-render the whole list.
const PlaceCard = memo(function PlaceCard({ item, isHosp, isSelected, isDark, onSelect }) {
  const meta = TYPE_META[item.type] || TYPE_META.Hospital;
  const bloodColor = BLOOD_COLORS[item.bloodType] || RED;
  const accent = isHosp ? meta.color : bloodColor;
  return (
    <ButtonBase
      id={`place-${item.id}`}
      onClick={() => onSelect(item)}
      aria-pressed={isSelected}
      sx={{
        display: 'flex', width: '100%', alignItems: 'flex-start', gap: 1.5, p: 1.25, mb: 1, textAlign: 'left', borderRadius: '16px',
        border: '1.5px solid', borderColor: isSelected ? '#e53935' : 'transparent',
        bgcolor: isSelected ? (isDark ? 'rgba(229,57,53,0.14)' : '#fdecec') : 'transparent',
        transition: 'background-color .15s, border-color .15s',
        '&:hover': { bgcolor: isSelected ? undefined : (isDark ? 'rgba(255,255,255,0.05)' : '#faf5f5') },
      }}
    >
      <Avatar variant="rounded" src={isHosp ? item.image || undefined : undefined} alt="" imgProps={{ loading: 'lazy', referrerPolicy: 'no-referrer' }}
        sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: '12px', bgcolor: isDark ? `${accent}26` : `${accent}14`, color: accent, fontWeight: 800, fontSize: '1rem' }}>
        {isHosp ? <LocalHospital /> : item.bloodType}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {isHosp ? item.name : item.fullName}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', whiteSpace: 'nowrap', pt: '1px' }}>{formatKm(item.dist)} km</Typography>
        </Box>
        <Typography noWrap sx={{ fontSize: '0.76rem', color: 'text.secondary', mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.4 }}>
          <LocationOn sx={{ fontSize: 13, flexShrink: 0 }} />
          {isHosp ? (item.address || 'Address not mapped yet') : item.location}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.6, flexWrap: 'wrap' }}>
          {isHosp ? (
            <>
              <Chip label={item.type} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: isDark ? `${meta.color}2e` : meta.tint, color: meta.color }} />
              {isOpen247(item) && (
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <FiberManualRecord sx={{ fontSize: 9 }} /> Open 24/7
                </Typography>
              )}
              {item.emergency && !isOpen247(item) && <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.secondary' }}>Emergency care</Typography>}
            </>
          ) : (
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: item.available ? '#2e7d32' : 'text.disabled', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <FiberManualRecord sx={{ fontSize: 9 }} /> {item.available ? 'Available' : 'Unavailable'}
            </Typography>
          )}
        </Box>
      </Box>
    </ButtonBase>
  );
});

const TITLES = { all: 'Nearby Places', Hospital: 'Nearby Hospitals', Clinic: 'Nearby Clinics', 'Blood Center': 'Nearby Blood Centers' };

export default function PlaceListPanel({
  tab, onTab, query, onQuery, onSearch, searching,
  hospType, onHospType, bloodFilter, onBloodFilter, availableOnly, onAvailableOnly,
  province, onProvince, sort, onSort,
  items, donorTotal, status, onRetry, selectedId, onSelect, notices,
}) {
  const isDark = useTheme().palette.mode === 'dark';
  const isHosp = tab === 0;
  const loading = status === 'loading';
  const failed = status === 'error';

  const chip = (active, color = 'error') => ({ color: active ? color : 'default', variant: active ? 'filled' : 'outlined' });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', bgcolor: 'background.paper', border: '1px solid', borderColor: isDark ? '#262626' : '#f0e4e4', borderRadius: '20px', overflow: 'hidden', boxShadow: isDark ? 'none' : '0 6px 24px rgba(120,20,20,0.06)' }}>
      <Box sx={{ p: 2, pb: 1.5 }}>
        {/* Hospitals | Donors */}
        <Box role="tablist" aria-label="What to look for" sx={{ display: 'flex', p: 0.5, borderRadius: '14px', bgcolor: isDark ? '#1c1c1c' : '#f6efef', mb: 1.75 }}>
          {[['Hospitals', <LocalHospital key="h" sx={{ fontSize: 18 }} />], ['Donors', <PersonSearch key="d" sx={{ fontSize: 18 }} />]].map(([label, icon], i) => (
            <ButtonBase key={label} role="tab" aria-selected={tab === i} onClick={() => onTab(i)} sx={{
              flex: 1, gap: 0.75, py: 1, borderRadius: '11px', fontWeight: 700, fontSize: '0.88rem', transition: 'all .15s',
              color: tab === i ? '#fff' : 'text.secondary', bgcolor: tab === i ? '#c62828' : 'transparent', boxShadow: tab === i ? '0 4px 12px rgba(198,40,40,0.35)' : 'none',
            }}>{icon}{label}</ButtonBase>
          ))}
        </Box>

        {/* Place search */}
        <Box component="form" role="search" onSubmit={(e) => { e.preventDefault(); onSearch(query); }} sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Autocomplete
            freeSolo fullWidth size="small" options={PROVINCE_NAMES}
            inputValue={query}
            onInputChange={(_, value) => onQuery(value)}
            onChange={(_, value, reason) => { if (reason === 'selectOption' && value) onSearch(value); }}
            renderInput={(params) => (
              <TextField
                {...params} placeholder="Search a city or province…" sx={fieldSx}
                slotProps={{
                  htmlInput: { ...params.inputProps, 'aria-label': 'Search a city or province' },
                  input: {
                    ...params.InputProps,
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 19 }} /></InputAdornment>,
                    endAdornment: <>{searching && <CircularProgress color="error" size={16} />}{params.InputProps.endAdornment}</>,
                  },
                }}
              />
            )}
          />
          <IconButton type="submit" aria-label="Search" sx={{ width: 42, height: 40, borderRadius: '12px', flexShrink: 0, bgcolor: '#c62828', color: '#fff', '&:hover': { bgcolor: '#8e1111' } }}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Filters */}
        <SectionLabel>{isHosp ? 'Filter by type' : 'Filter by blood type'}</SectionLabel>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
          {isHosp ? TYPE_FILTERS.map(([value, label]) => (
            <Chip key={value} label={label} size="small" clickable onClick={() => onHospType(value)} {...chip(hospType === value)} sx={{ fontWeight: 600, borderRadius: '999px' }} />
          )) : (
            <>
              <Chip label="Any" size="small" clickable onClick={() => onBloodFilter('')} {...chip(!bloodFilter)} sx={{ fontWeight: 600 }} />
              {BLOOD_TYPES.map((bt) => (
                <Chip key={bt} label={bt} size="small" clickable onClick={() => onBloodFilter(bloodFilter === bt ? '' : bt)} {...chip(bloodFilter === bt)} sx={{ fontWeight: 700 }} />
              ))}
              <Chip label="Available only" size="small" clickable onClick={() => onAvailableOnly(!availableOnly)}
                icon={<FiberManualRecord sx={{ fontSize: '10px !important', color: availableOnly ? '#fff !important' : '#4caf50 !important' }} />}
                {...chip(availableOnly, 'success')} sx={{ fontWeight: 600 }} />
            </>
          )}
        </Box>

        <SectionLabel>Filter by province</SectionLabel>
        <Select
          value={province} displayEmpty fullWidth size="small"
          onChange={(e) => onProvince(e.target.value)}
          inputProps={{ 'aria-label': 'Filter by province' }}
          startAdornment={<InputAdornment position="start"><LocationOn sx={{ fontSize: 19 }} /></InputAdornment>}
          MenuProps={{ slotProps: { paper: { sx: { maxHeight: 320 } } } }}
          sx={{ borderRadius: '12px', bgcolor: 'background.default' }}
        >
          <MenuItem value="">All Provinces</MenuItem>
          {PROVINCE_NAMES.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
        </Select>
      </Box>

      {notices}

      {/* Results header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, pt: 1, pb: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography component="h2" sx={{ fontWeight: 800, fontSize: '0.98rem' }}>
          {isHosp ? TITLES[hospType] : 'Nearby Donors'}{!loading && !failed ? ` (${items.length})` : ''}
        </Typography>
        <Select value={sort} onChange={(e) => onSort(e.target.value)} variant="standard" disableUnderline size="small"
          inputProps={{ 'aria-label': 'Sort results' }} IconComponent={SortIcon}
          sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', '& .MuiSelect-select': { pr: '26px !important', py: 0.25 }, '& .MuiSelect-icon': { fontSize: 18 } }}>
          <MenuItem value="nearest">Nearest</MenuItem>
          <MenuItem value="name">Name A–Z</MenuItem>
        </Select>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 1.25, pb: 1,
        '&::-webkit-scrollbar': { width: 5 }, '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? '#2a2a2a' : '#e0d6d6', borderRadius: 3 } }}>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress color="error" size={32} /></Box>}

        {failed && (
          <Alert severity="warning" sx={{ mt: 1, fontSize: '0.8rem', borderRadius: 3 }}
            action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
            {isHosp ? 'Couldn’t load nearby hospitals.' : 'Couldn’t load donors.'}
          </Alert>
        )}

        {!loading && !failed && items.length === 0 && (
          <Typography color="text.secondary" fontSize="0.875rem" sx={{ textAlign: 'center', py: 6 }}>
            {isHosp
              ? (hospType === 'all' ? 'No hospitals found nearby.'
                : hospType === 'Blood Center' ? 'No blood centers are mapped in this area on OpenStreetMap yet — try “All”.'
                : 'No matches — try “All”.')
              : (bloodFilter || availableOnly ? 'No donors match these filters.' : 'No donors found with a known city.')}
          </Typography>
        )}

        {!loading && !failed && !isHosp && donorTotal > items.length && (
          <Typography color="text.secondary" fontSize="0.72rem" sx={{ px: 0.5, pb: 1 }}>Showing the nearest {items.length} of {donorTotal} donors.</Typography>
        )}

        {!loading && !failed && items.map((item) => (
          <PlaceCard key={item.id} item={item} isHosp={isHosp} isSelected={selectedId === item.id} isDark={isDark} onSelect={onSelect} />
        ))}
      </Box>
    </Box>
  );
}
