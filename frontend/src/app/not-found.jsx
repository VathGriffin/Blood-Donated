'use client';
import { useT } from '@/i18n/I18nProvider';
import Link from 'next/link';
import { Box, Typography, Button, useTheme } from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";

const NotFound = () => {
  const theme = useTheme();
  const t = useT();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      sx={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        backgroundColor: isDark ? "#0B1220" : "#F6F8FC",
      }}
    >
      <BloodtypeIcon sx={{ fontSize: 72, color: "#A91529", mb: 2, opacity: 0.7 }} />
      <Typography variant="h1" fontWeight={900} sx={{ color: "#A91529", fontSize: { xs: "5rem", md: "8rem" }, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mt: 1 }}>
        {t('common.notFound.title')}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
        {t('common.notFound.text')}
      </Typography>
      <Button
        variant="contained"
        color="error"
        size="large"
        component={Link}
        href="/"
        sx={{ borderRadius: 3, px: 5, fontWeight: 700 }}
      >
        {t('common.notFound.home')}
      </Button>
    </Box>
  );
};

export default NotFound;
