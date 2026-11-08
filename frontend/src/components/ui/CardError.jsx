'use client';
import { useT } from '@/i18n/I18nProvider';
import { Alert, Button } from '@mui/material';

/** Error inside a card, with a retry button. */
export default function CardError({ message, onRetry }) {
  const t = useT();
  return (
    <Alert severity="error" variant="outlined" sx={{ mx: { xs: 2, md: 3 }, mb: 2.5 }}
      action={onRetry && <Button color="inherit" size="small" onClick={onRetry}>{t('common.retry')}</Button>}>
      {message}
    </Alert>
  );
}
