'use client';
import React from "react";
import Link from "next/link";
import { Box, Typography, IconButton, Link as MuiLink, useTheme, Divider, Grid } from "@mui/material";
import { Facebook, Telegram, Favorite } from "@mui/icons-material";

const quickLinks = [
  { label: "Home",          path: "/" },
  { label: "Donate Blood",  path: "/donate" },
  { label: "Request Blood", path: "/requests" },
  { label: "Find Donors",   path: "/donors" },
  { label: "Our Team",      path: "/team" },
  { label: "About Us",      path: "/about" },
  { label: "Contact",       path: "/contact" },
];

const bloodTypes = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

function Footer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{
      background: isDark
        ? "linear-gradient(180deg, #1a0000 0%, #0d0000 100%)"
        : "linear-gradient(180deg, #b71c1c 0%, #7f0000 100%)",
      color: "#fff", pt: 7, pb: 3, px: 3,
    }}>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Grid container spacing={5}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Favorite sx={{ color: "#ffcdd2", fontSize: 28 }} />
              <Typography variant="h6" fontWeight={800} sx={{ color: "#ffeb3b", letterSpacing: "-0.5px" }}>
                Blood Donated
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.85, opacity: 0.9, textAlign: "justify", mb: 3 }}>
              A voluntary blood donation platform connecting compassionate donors with patients in need.
              Our mission is to ensure no life is lost due to a lack of blood — making donation easy, safe, and impactful.
              <br /><strong> Be a hero — donate blood today.</strong>
            </Typography>
            <Box sx={{ display: "flex", gap: 1.5 }}>
              <IconButton href="https://www.facebook.com/vith.vath.2025/" target="_blank" size="small"
                sx={{ color: "#fff", backgroundColor: "#3b5998", "&:hover": { backgroundColor: "#2d4373", transform: "translateY(-2px)" }, transition: "0.2s" }}>
                <Facebook fontSize="small" />
              </IconButton>
              <IconButton href="https://t.me/blooddonatedkh" target="_blank" size="small"
                sx={{ color: "#fff", backgroundColor: "#0088cc", "&:hover": { backgroundColor: "#006699", transform: "translateY(-2px)" }, transition: "0.2s" }}>
                <Telegram fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={6} md={2.5}>
            <Typography variant="subtitle1" sx={{ color: "#ffeb3b", fontWeight: 700, mb: 2.5, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
              Quick Links
            </Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0 }}>
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6, padding: "4px 0", fontSize: "0.9rem" }}>
                    <span style={{ color: "#ffcdd2" }}>›</span> {link.label}
                  </Link>
                </li>
              ))}
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="subtitle1" sx={{ color: "#ffeb3b", fontWeight: 700, mb: 2.5, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
              Blood Types
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {bloodTypes.map((bt) => (
                <Box key={bt} sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", px: 1.2, py: 0.4, borderRadius: 1.5, fontSize: "0.8rem", fontWeight: 700, border: "1px solid rgba(255,255,255,0.2)" }}>
                  {bt}
                </Box>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={3.5}>
            <Typography variant="subtitle1" sx={{ color: "#ffeb3b", fontWeight: 700, mb: 2.5, textTransform: "uppercase", fontSize: "0.85rem", letterSpacing: "0.08em" }}>
              Contact Us
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                📧 <MuiLink href="mailto:Vath.V211006@sis.hust.edu.vn" sx={{ color: "#fff", textDecoration: "underline dotted", "&:hover": { color: "#ffeb3b" } }}>
                  Vath.V211006@sis.hust.edu.vn
                </MuiLink>
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>📍 Institute of Technology of Cambodia, Phnom Penh</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>📞 +855 12 345 678</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>🕐 Mon–Fri: 8:00 AM – 5:00 PM</Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ backgroundColor: "rgba(255,255,255,0.15)", mt: 5, mb: 3 }} />
      <Box sx={{ maxWidth: "1200px", mx: "auto", display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" sx={{ opacity: 0.7, fontSize: "0.82rem" }}>
          © {new Date().getFullYear()} Blood Donated. All rights reserved.
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7, fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 0.5 }}>
          Made with <Favorite sx={{ fontSize: 14, color: "#ffcdd2" }} /> by Data Science Students — ITC Cambodia
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
