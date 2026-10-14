'use client';
import { Alert, Button } from '@mui/material';

/** Error inside a card, with a retry button. */
export default function CardError({ message, onRetry }) {
  return (
    <Alert severity="error" variant="outlined" sx={{ mx: { xs: 2, md: 3 }, mb: 2.5 }}
      action={onRetry && <Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
      {message}
    </Alert>
  );
}
