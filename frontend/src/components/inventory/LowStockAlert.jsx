'use client';
import Link from 'next/link';
import { Box, Button, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { SectionCard, StatusBadge, EmptyState, CardError, BloodPill, RowMenu, compactHeadCell, compactTableContainerSx } from '@/components/ui';
import { STOCK, lowStockItems } from '@/lib/inventory';

/**
 * "Low Stock Alert" table: blood types that are out of stock, critical or low, worst
 * first. `items` is the inventory list from /api/inventory (rows carry a `status`);
 * pass `null` while it is still loading. `error` (with `onRetry`) shows a failed load.
 */
export default function LowStockAlert({ items = [], href, limit = 5, error, onRetry, sx }) {
  const low = lowStockItems(items || []).slice(0, limit);
  // Nothing recorded (no rows, or every row at 0): one calm empty state, not a list of red zeros.
  const noStock = items !== null && !items.some((i) => i.units > 0);
  const columns = ['Blood Type', 'Current Stock', 'Status', ...(href ? [''] : [])];
  return (
    <SectionCard
      icon={<WarningRoundedIcon />}
      title="Low Stock Alert"
      action={href && <Button component={Link} href={href} size="small" sx={{ fontWeight: 700 }}>View All</Button>}
      padded={false}
      sx={sx}
    >
      {error && items === null ? (
        <CardError message={error} onRetry={onRetry} />
      ) : items === null ? (
        <Box sx={{ px: 3, pb: 3, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={30} />)}
        </Box>
      ) : noStock ? (
        <EmptyState icon={<WaterDropIcon />} title="No inventory recorded" description="Alerts appear once stock levels are entered." />
      ) : low.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 30, color: 'success.main', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">Every blood type is adequately stocked.</Typography>
        </Box>
      ) : (
        <TableContainer sx={compactTableContainerSx}>
          <Table size="small" sx={{ '& td': { borderBottom: 'none', py: 1 } }}>
            <TableHead>
              <TableRow>
                {columns.map((h, i) => <TableCell key={i} sx={compactHeadCell}>{h}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {low.map((i) => (
                <TableRow key={i.bloodType} hover>
                  <TableCell><BloodPill type={i.bloodType} /></TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{i.units}</TableCell>
                  <TableCell><StatusBadge status={i.status} label={STOCK[i.status].label} size="small" dot={false} /></TableCell>
                  {href && <TableCell align="right"><RowMenu label="Update stock" href={href} horizontal /></TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </SectionCard>
  );
}
