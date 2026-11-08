'use client';
import { statusLabel } from '@/components/ui/StatusBadge';
import { useT } from '@/i18n/I18nProvider';
import { Box, Button, IconButton, InputAdornment, MenuItem, Tab, Tabs, TextField, alpha } from '@mui/material';
import { Apartment, Close, FilterAltOff, Flag, Layers, Search, WaterDrop } from '@mui/icons-material';
import { BLOOD_TYPES, STATUSES, STATUS_TABS, URGENCY_LEVELS } from './requests';

/** Pill tabs, one per status, each with its live count. */
export function StatusTabs({ value, onChange, countFor, loading }) {
  const t = useT();
  return (
    <Tabs
      value={value}
      onChange={(_, v) => onChange(v)}
      variant="scrollable"
      scrollButtons="auto"
      allowScrollButtonsMobile
      aria-label={t('adm.reqFilters.filterRequestsByStatus')}
      sx={{
        minHeight: 40,
        '& .MuiTabs-indicator': { display: 'none' },
        '& .MuiTabs-flexContainer': { gap: 0.75 },
      }}
    >
      {STATUS_TABS.map((st) => {
        const selected = value === st;
        return (
          <Tab
            key={st}
            value={st}
            disableRipple
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                {statusLabel(t, st)}
                <Box
                  component="span"
                  sx={(th) => ({
                    px: 0.8, minWidth: 22, height: 20, borderRadius: 10, fontSize: '0.72rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: selected ? '#fff' : th.palette.action.hover,
                    color: selected ? 'primary.main' : 'text.secondary',
                  })}
                >
                  {loading ? '·' : countFor(t)}
                </Box>
              </Box>
            }
            sx={(th) => ({
              minHeight: 38, minWidth: 0, px: 2, py: 0.75, borderRadius: '10px',
              textTransform: 'none', fontWeight: 600, fontSize: '0.9rem', color: 'text.secondary',
              transition: 'background-color .15s ease, color .15s ease',
              '&:hover': { bgcolor: selected ? undefined : th.palette.action.hover, color: 'text.primary' },
              '&.Mui-selected': {
                color: '#fff', bgcolor: 'primary.main',
                boxShadow: `0 6px 14px ${alpha(th.palette.primary.main, 0.28)}`,
              },
              '&.Mui-focusVisible': { outline: `2px solid ${th.palette.primary.main}`, outlineOffset: 2 },
            })}
          />
        );
      })}
    </Tabs>
  );
}

// A compact select whose label sits inside it as a placeholder, with a leading icon.
function FilterSelect({ label, icon, value, onChange, options, allLabel, translateOption = false }) {
  const t = useT();
  return (
    <TextField
      select
      size="small"
      fullWidth
      value={value}
      onChange={onChange}
      slotProps={{
        select: {
          displayEmpty: true,
          renderValue: (v) => (v ? (translateOption ? statusLabel(t, v) : v) : <Box component="span" sx={{ color: 'text.secondary' }}>{label}</Box>),
          SelectDisplayProps: { 'aria-label': t('adm.reqFilters.filterAria', { label }) },
          MenuProps: { slotProps: { paper: { sx: { maxHeight: 320 } } } },
        },
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ color: value ? 'primary.main' : 'text.secondary', '& svg': { fontSize: 18 } }}>
              {icon}
            </InputAdornment>
          ),
        },
      }}
      sx={(t) => value ? { '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha(t.palette.primary.main, 0.5) } } : undefined}
    >
      <MenuItem value="">{allLabel}</MenuItem>
      {options.map((o) => <MenuItem key={o} value={o}>{translateOption ? statusLabel(t, o) : o}</MenuItem>)}
    </TextField>
  );
}

/** Search box plus blood type / hospital / urgency / status filters and a Clear button. */
export function FilterBar({ search, onSearch, filters, onFilter, hospitalOptions, active, onClear }) {
  const t = useT();
  const selects = [
    { key: 'bloodType', label: t('adm.reqFilters.bloodType'), icon: <WaterDrop />, options: BLOOD_TYPES, allLabel: t('adm.reqFilters.allTypes') },
    { key: 'hospital', label: t('adm.reqFilters.hospital'), icon: <Apartment />, options: hospitalOptions, allLabel: t('adm.reqFilters.allHospitals') },
    { key: 'urgency', label: t('adm.reqFilters.urgency'), icon: <Flag />, options: URGENCY_LEVELS, allLabel: t('adm.reqFilters.anyUrgency'), translateOption: true },
    { key: 'status', label: t('adm.reqFilters.status'), icon: <Layers />, options: STATUSES, allLabel: t('adm.reqFilters.anyStatus'), translateOption: true },
  ];
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 1.5,
        gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr) auto', xl: 'minmax(240px, 2fr) repeat(4, minmax(130px, 1fr)) auto' },
      }}
    >
      <TextField
        size="small"
        placeholder={t('adm.reqFilters.searchPatientHospitalReason')}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        sx={{ gridColumn: { xs: '1 / -1', xl: 'auto' } }}
        slotProps={{
          htmlInput: { 'aria-label': 'Search requests' },
          input: {
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            endAdornment: search && (
              <InputAdornment position="end">
                <IconButton size="small" aria-label={t('adm.reqFilters.clearSearch')} onClick={() => onSearch('')}><Close fontSize="small" /></IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
      {selects.map((f) => (
        <FilterSelect
          key={f.key}
          label={f.label}
          icon={f.icon}
          value={filters[f.key]}
          onChange={(e) => onFilter(f.key, e.target.value)}
          options={f.options}
          allLabel={f.allLabel}
          translateOption={f.translateOption}
        />
      ))}
      <Button
        variant="outlined"
        color="inherit"
        startIcon={<FilterAltOff />}
        onClick={onClear}
        disabled={!active}
        sx={{ color: 'text.secondary', borderColor: 'divider', whiteSpace: 'nowrap', gridColumn: { xs: '1 / -1', sm: 'auto' }, justifySelf: { sm: 'start', md: 'stretch' } }}
      >
        {t('adm.reqFilters.clear')}
      </Button>
    </Box>
  );
}
