'use client';
import dynamic from 'next/dynamic';
import { Box, CircularProgress } from '@mui/material';

const Maps = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress color="error" />
    </Box>
  ),
});

export default function MapPage() {
  return <Maps />;
}
