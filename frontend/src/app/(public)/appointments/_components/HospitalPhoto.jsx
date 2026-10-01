'use client';
import { useEffect, useState } from 'react';
import { Box, CardMedia, Skeleton } from '@mui/material';
import { HOSPITAL_FALLBACK_IMAGE } from './booking';

// The hospital's own photo (from the hospital record), cropped to fill the box. Shows a skeleton
// while it loads and swaps to the neutral fallback when there is no photo or the URL is broken.
export default function HospitalPhoto({ src, name, height = 130, radius = 10 }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setFailed(false); setLoaded(false); }, [src]);

  const hasPhoto = !!src && !failed;
  return (
    <Box sx={{ position: 'relative', height, borderRadius: `${radius}px`, overflow: 'hidden', bgcolor: '#EEF2F7' }}>
      {hasPhoto && !loaded && <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0, height: '100%' }} />}
      <CardMedia
        component="img"
        image={hasPhoto ? src : HOSPITAL_FALLBACK_IMAGE}
        alt={hasPhoto ? `Photo of ${name}` : ''}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => { if (hasPhoto) setFailed(true); }}
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: hasPhoto && !loaded ? 0 : 1, transition: 'opacity .25s ease' }}
      />
    </Box>
  );
}
