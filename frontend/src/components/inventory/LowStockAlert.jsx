'use client';
import Link from 'next/link';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { SectionCard } from '@/components/ui';
import { STOCK, lowStockItems } from '@/lib/inventory';

/**
 * "Low Stock Alert" list: blood types that are out of stock, critical or low, worst
 * first. `items` is the inventory list from /api/inventory (rows carry a `status`);
 * pass `null` while it is still loading.
 */
export default function LowStockAlert({ items = [], href, limit = 5, sx }) {
  const low = lowStockItems(items || []).slice(0, limit);
  return (
    <SectionCard
      title="Low Stock Alert"
      action={href && <Button component={Link} href={href} size="small" sx={{ fontWeight: 600 }}>View All</Button>}
      sx={sx}
    >
      {items === null ? (
        <Skeleton variant="rounded" height={150} />
      ) : low.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 30, color: items.length ? 'success.main' : 'text.disabled', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {items.length ? 'Every blood type is adequately stocked.' : 'No stock has been recorded yet.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {low.map((i) => {
            const meta = STOCK[i.status];
            const urgent = i.status !== 'low';
            return (
              <Box key={i.bloodType} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.25, '&:not(:last-child)': { borderBottom: 1, borderColor: 'divider' } }}>
                <WaterDropIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography sx={{ fontWeight: 700, width: 44 }}>{i.bloodType}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                  {i.units} unit{i.units === 1 ? '' : 's'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: urgent ? 'error.main' : 'warning.dark' }}>{meta.alert}</Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </SectionCard>
  );
}
