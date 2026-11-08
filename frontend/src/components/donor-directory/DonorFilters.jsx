'use client';
import { useI18n } from '@/i18n/I18nProvider';
import { Box, Button, IconButton, InputAdornment, MenuItem, Tab, Tabs, TextField } from '@mui/material';
import {
  BarChart, CheckCircleOutline, Close, EventAvailable, FilterAltOff, FiberManualRecord, LocationOnOutlined,
  PeopleAltOutlined, Search, Sort, WaterDropOutlined,
} from '@mui/icons-material';
import { BLOOD_TYPES } from '@/lib/inventory';
import { AVAILABILITY, SORT_OPTIONS } from './donors';

// A select with its label on top and a leading icon, e.g. "Blood Type / All types".
function LabeledSelect({ label, icon, value, onChange, emptyLabel, valueLabel = (v) => v, children, sx }) {
  return (
    <TextField
      select
      size="small"
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={sx}
      slotProps={{
        inputLabel: { shrink: true },
        select: {
          displayEmpty: true,
          renderValue: (v) => (v === '' ? emptyLabel : valueLabel(v)),
          MenuProps: { slotProps: { paper: { sx: { maxHeight: 340 } } } },
        },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: value && value !== 'all' ? 'primary.main' : 'text.secondary', '& svg': { fontSize: 20 } }}>
              {icon}
            </InputAdornment>
          ),
        },
      }}
    >
      {children}
    </TextField>
  );
}

/** Search, blood type, availability and location filters, plus Clear filters. */
export function DonorFilterBar({ filters, onChange, cities, active, onClear }) {
  const { t } = useI18n();
  const set = (key) => (value) => onChange({ [key]: value });
  return (
    <Box
      role="search"
      aria-label={t('directory.filters.label')}
      sx={{
        display: 'grid', gap: 1.5, alignItems: 'center',
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr) auto', xl: 'minmax(260px, 1.6fr) repeat(3, minmax(160px, 1fr)) auto' },
      }}
    >
      <TextField
        size="small"
        placeholder={t('directory.filters.search')}
        value={filters.search}
        onChange={(e) => set('search')(e.target.value)}
        sx={{ gridColumn: { xs: '1 / -1', xl: 'auto' } }}
        slotProps={{
          htmlInput: { 'aria-label': t('directory.filters.searchLabel'), type: 'search' },
          input: {
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            endAdornment: filters.search && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label={t('directory.filters.clearSearch')} onClick={() => set('search')('')}><Close fontSize="small" /></IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      <LabeledSelect label={t('directory.filters.bloodType')} icon={<WaterDropOutlined />} value={filters.bloodType} onChange={set('bloodType')} emptyLabel={t('directory.filters.allTypes')}>
        <MenuItem value="">{t('directory.filters.allTypes')}</MenuItem>
        {BLOOD_TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
      </LabeledSelect>
      <LabeledSelect label={t('directory.filters.availability')} icon={<CheckCircleOutline />} value={filters.availability} onChange={set('availability')}
        emptyLabel={t('directory.availability.all')} valueLabel={(v) => t(`directory.availability.${v}`)}>
        {AVAILABILITY.map((a) => <MenuItem key={a} value={a}>{t(`directory.availability.${a}`)}</MenuItem>)}
      </LabeledSelect>
      <LabeledSelect label={t('directory.filters.location')} icon={<LocationOnOutlined />} value={filters.city} onChange={set('city')} emptyLabel={t('directory.filters.allLocations')}
        sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>
        <MenuItem value="">{t('directory.filters.allLocations')}</MenuItem>
        {cities.map((c) => <MenuItem key={c.name} value={c.name}>{c.name} ({c.count})</MenuItem>)}
      </LabeledSelect>
      <Button
        variant="text"
        color="inherit"
        startIcon={<FilterAltOff />}
        onClick={onClear}
        disabled={!active}
        sx={{ color: 'text.secondary', whiteSpace: 'nowrap', justifySelf: { xs: 'start', md: 'end' } }}
      >
        {t('directory.filters.clear')}
      </Button>
    </Box>
  );
}

/**
 * All / Available / Ready tabs (they set the availability filter) and a By Blood Type tab that
 * shows the blood type summary instead of the list. Sorting sits on the right.
 */
export function DonorTabs({ value, onChange, counts, loading, sortBy, onSort, showSort }) {
  const { t, formatNumber } = useI18n();
  const label = (key, n) => (loading || n == null ? t(`directory.tabs.${key}`) : t('directory.tabs.count', { label: t(`directory.tabs.${key}`), count: formatNumber(n) }));
  const tabs = [
    { value: 'all', label: label('all', counts.all), icon: <PeopleAltOutlined /> },
    { value: 'available', label: label('available', counts.available), icon: <FiberManualRecord sx={{ color: 'success.main', fontSize: '12px !important' }} /> },
    { value: 'ready', label: label('ready', counts.ready), icon: <EventAvailable /> },
    { value: 'types', label: t('directory.tabs.types'), icon: <BarChart /> },
  ];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'space-between' }}>
      <Tabs
        value={value}
        onChange={(_, v) => onChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label={t('directory.tabs.label')}
        sx={{
          minHeight: 48, flex: '1 1 auto', minWidth: 0,
          '& .MuiTab-root': { minHeight: 48, textTransform: 'none', fontWeight: 600, fontSize: '0.92rem', px: 2, color: 'text.secondary', gap: 0.75 },
          '& .MuiTab-root svg': { fontSize: 19 },
          '& .Mui-selected': { color: 'primary.main', fontWeight: 700 },
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
        }}
      >
        {tabs.map((t) => <Tab key={t.value} value={t.value} label={t.label} icon={t.icon} iconPosition="start" />)}
      </Tabs>
      {showSort && (
        <TextField
          select
          size="small"
          value={sortBy}
          onChange={(e) => onSort(e.target.value)}
          sx={{ width: { xs: '100%', sm: 220 }, my: { xs: 1, sm: 0 } }}
          slotProps={{
            select: { SelectDisplayProps: { 'aria-label': t('directory.sort.label') } },
            input: { startAdornment: <InputAdornment position="start"><Sort fontSize="small" /></InputAdornment> },
          }}
        >
          {SORT_OPTIONS.map((o) => <MenuItem key={o} value={o}>{t(`directory.sort.${o}`)}</MenuItem>)}
        </TextField>
      )}
    </Box>
  );
}
