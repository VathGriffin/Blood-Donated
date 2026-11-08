'use client';
import { useId } from 'react';
import { Box, MenuItem, Pagination, Select, Typography } from '@mui/material';
import { useI18n } from '@/i18n/I18nProvider';

/**
 * Footer for a paged list or table: "Showing 1–10 of 24 donors", a rows-per-page select and
 * page buttons. `page` is zero-based. `noun` picks the item name (ui.pagination.items.<noun>:
 * item | donor | request | appointment | hospital | message); `compact` shortens the
 * labels and page buttons for phones.
 */
export default function ListPagination({
  total, page, rowsPerPage, onPage, onRowsPerPage, noun = 'item', rowsOptions = [10, 25, 50], compact = false, sx,
}) {
  const selectId = useId();
  const { t, formatNumber } = useI18n();
  const pages = Math.max(1, Math.ceil(total / rowsPerPage));
  const from = total === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(total, (page + 1) * rowsPerPage);
  return (
    <Box
      component="nav"
      aria-label={t('ui.pagination.pages')}
      sx={[
        {
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5,
          px: { xs: 2, md: 3 }, py: 1.75, borderTop: 1, borderColor: 'divider',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography variant="body2" color="text.secondary" aria-live="polite">
        {t('ui.pagination.showing', { from: formatNumber(from), to: formatNumber(to), total: formatNumber(total), items: t(`ui.pagination.items.${noun}`, { count: total }) })}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary" component="label" htmlFor={selectId}>
            {t(compact ? 'ui.pagination.rows' : 'ui.pagination.rowsPerPage')}
          </Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPage(Number(e.target.value))}
            inputProps={{ id: selectId }}
            sx={{ minWidth: 72, '& .MuiSelect-select': { py: 0.75 } }}
          >
            {rowsOptions.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
          </Select>
        </Box>
        <Pagination
          count={pages}
          page={page + 1}
          onChange={(_, p) => onPage(p - 1)}
          shape="rounded"
          color="primary"
          siblingCount={compact ? 0 : 1}
          boundaryCount={1}
          sx={{
            '& .MuiPaginationItem-root': { fontWeight: 600, borderRadius: '10px' },
            '& .MuiPaginationItem-previousNext': { border: 1, borderColor: 'divider' },
          }}
        />
      </Box>
    </Box>
  );
}
