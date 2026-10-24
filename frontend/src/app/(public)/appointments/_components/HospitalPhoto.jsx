'use client';
import { useCallback, useState } from 'react';
import { Box, CardMedia, Skeleton } from '@mui/material';
import { HOSPITAL_FALLBACK_IMAGE } from './booking';

// The hospital's own photo (from the hospital record), cropped to fill the box. Shows a skeleton
// while it loads and swaps to the neutral fallback when there is no photo or the URL is broken.
// Load/fail state is remembered per src (not reset in an effect): a cached photo can fire onLoad
// before an effect runs, and resetting afterwards left it hidden behind the skeleton for good.
export default function HospitalPhoto({ src, name, height = 130, radius = 10 }) {
  const [loadedSrc, setLoadedSrc] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);

  const hasPhoto = !!src && failedSrc !== src;
  const loaded = !hasPhoto || loadedSrc === src;

  // An image that finished before React attached onLoad never fires it — check on mount.
  const imgRef = useCallback((img) => {
    if (img && hasPhoto && img.complete && img.naturalWidth > 0) setLoadedSrc(src);
  }, [hasPhoto, src]);

  return (
    <Box sx={{ position: 'relative', height, borderRadius: `${radius}px`, overflow: 'hidden', bgcolor: '#EEF2F7' }}>
      {!loaded && <Skeleton variant="rectangular" animation="wave" sx={{ position: 'absolute', inset: 0, height: '100%' }} />}
      <CardMedia
        key={hasPhoto ? src : 'fallback'}
        ref={imgRef}
        component="img"
        image={hasPhoto ? src : HOSPITAL_FALLBACK_IMAGE}
        alt={hasPhoto ? `Photo of ${name}` : ''}
        loading="lazy"
        onLoad={() => { if (hasPhoto) setLoadedSrc(src); }}
        onError={() => { if (hasPhoto) setFailedSrc(src); }}
        sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity .25s ease' }}
      />
    </Box>
  );
}
