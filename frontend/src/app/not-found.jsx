'use client';
import Link from 'next/link';
import { Box, Typography, Button, useTheme } from "@mui/material";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";

const NotFound = () => {
  const theme = useTheme();
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
        Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400 }}>
        The page you&apos;re looking for doesn&apos;t exist. It may have been moved or the link is incorrect.
      </Typography>
      <Button
        variant="contained"
        color="error"
        size="large"
        component={Link}
        href="/"
        sx={{ borderRadius: 3, px: 5, fontWeight: 700 }}
      >
        Back to Home
      </Button>
    </Box>
  );
};

export default NotFound;
