'use client';
import Link from "next/link";
import { Box, Typography, IconButton, useTheme, Grid } from "@mui/material";
import { Facebook, Telegram, Favorite, Email, Phone, LocationOn, AccessTime } from "@mui/icons-material";
import BrandLogo from "@/components/dashboard/BrandLogo";
import { BRAND } from "@/lib/brand";
import { CONTACT } from "@/lib/contact";
import { navy } from "@/lib/design-tokens";

const quickLinks = [
  { label: "Home",            path: "/" },
  { label: "Donate Blood",    path: "/donate" },
  { label: "Request Blood",   path: "/requests" },
  { label: "Find a Hospital", path: "/map" },
  { label: "Find Donors",     path: "/donors" },
  { label: "About Us",        path: "/about" },
  { label: "Contact",         path: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy",   path: "/privacy" },
  { label: "Terms of Service", path: "/terms" },
  { label: "Cookie Policy",    path: "/privacy#collect" },
];

const bloodTypes = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

const socials = [
  { label: "Facebook", href: "https://www.facebook.com/vith.vath.2025/", icon: <Facebook fontSize="small" /> },
  { label: "Telegram", href: "https://t.me/blooddonatedkh", icon: <Telegram fontSize="small" /> },
];

// Footer palette: white headings, light-grey text, soft-red accents on navy.
const TEXT = "rgba(255,255,255,0.72)";
const MUTED = "rgba(255,255,255,0.56)";
const ACCENT = "#F28B95";
const RULE = "rgba(255,255,255,0.12)";

const headingSx = {
  color: "#FFFFFF", fontWeight: 700, mb: 2.25, textTransform: "uppercase",
  fontSize: "0.8rem", letterSpacing: "0.1em",
};

const linkSx = {
  color: TEXT, textDecoration: "none", fontSize: "0.9rem", transition: "color 0.18s ease",
  "&:hover": { color: ACCENT },
  "&:focus-visible": { outline: `2px solid ${ACCENT}`, outlineOffset: 2, borderRadius: 0.5 },
};

function ContactRow({ icon, children }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, color: TEXT, fontSize: "0.9rem", lineHeight: 1.55 }}>
      <Box sx={{ color: ACCENT, display: "flex", mt: "2px", "& svg": { fontSize: 18 } }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  );
}

function Footer() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box component="footer" sx={{
      bgcolor: isDark ? "#0F2038" : navy.dark,
      borderTop: isDark ? `1px solid ${RULE}` : "none",
      color: "#FFFFFF", pt: { xs: 6, md: 8 }, pb: 3, px: { xs: 2, sm: 3 },
    }}>
      <Box sx={{ maxWidth: 1200, mx: "auto" }}>
        <Grid container columnSpacing={{ xs: 3, md: 5 }} rowSpacing={{ xs: 4.5, md: 5 }}>
          {/* Brand */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box sx={{ mb: 2.25 }}>
              <BrandLogo href="/" caption={BRAND.tagline} onDark />
            </Box>
            <Typography sx={{ color: TEXT, fontSize: "0.9rem", lineHeight: 1.8, mb: 2.5, maxWidth: 380 }}>
              A voluntary blood donation platform connecting compassionate donors with patients in need,
              so no life is lost for lack of blood.
            </Typography>
            <Box sx={{ display: "flex", gap: 1.25 }}>
              {socials.map((s) => (
                <IconButton key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} size="small"
                  sx={{
                    color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.08)", border: `1px solid ${RULE}`,
                    transition: "background-color 0.2s ease, transform 0.2s ease",
                    "&:hover": { bgcolor: "#C91D32", borderColor: "#C91D32", transform: "translateY(-2px)" },
                  }}>
                  {s.icon}
                </IconButton>
              ))}
            </Box>
          </Grid>

          {/* Quick links */}
          <Grid size={{ xs: 6, sm: 6, md: 2.25 }}>
            <Typography component="h2" sx={headingSx}>Quick Links</Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.1 }}>
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Box component={Link} href={link.path} sx={linkSx}>{link.label}</Box>
                </li>
              ))}
            </Box>
          </Grid>

          {/* Blood types */}
          <Grid size={{ xs: 6, sm: 6, md: 2.25 }}>
            <Typography component="h2" sx={headingSx}>Blood Types</Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 44px))", gap: 1 }}>
              {bloodTypes.map((bt) => (
                <Box key={bt} sx={{
                  textAlign: "center", py: 0.6, borderRadius: 1.5, fontSize: "0.8rem", fontWeight: 700,
                  color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.06)", border: `1px solid ${RULE}`,
                }}>
                  {bt}
                </Box>
              ))}
            </Box>
            <Box component={Link} href="/donate" sx={{ ...linkSx, display: "inline-block", mt: 2, fontSize: "0.85rem", fontWeight: 600, color: ACCENT, "&:hover": { color: "#FFFFFF" } }}>
              Am I eligible? →
            </Box>
          </Grid>

          {/* Contact */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <Typography component="h2" sx={headingSx}>Contact Us</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <ContactRow icon={<Email />}>
                <Box component="a" href={`mailto:${CONTACT.email}`} sx={linkSx}>{CONTACT.email}</Box>
              </ContactRow>
              <ContactRow icon={<Phone />}>
                <Box component="a" href={CONTACT.phoneHref} sx={linkSx}>{CONTACT.phoneDisplay}</Box>
              </ContactRow>
              <ContactRow icon={<LocationOn />}>{CONTACT.address}</ContactRow>
              <ContactRow icon={<AccessTime />}>{CONTACT.hours}</ContactRow>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: `1px solid ${RULE}`, mt: { xs: 5, md: 6 }, pt: 3,
          display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Typography sx={{ color: MUTED, fontSize: "0.8rem", textAlign: "center" }} suppressHydrationWarning>
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </Typography>
          <Box component="nav" aria-label="Legal" sx={{ display: "flex", gap: { xs: 2, sm: 3 }, flexWrap: "wrap", justifyContent: "center" }}>
            {legalLinks.map((l) => (
              <Box key={l.path} component={Link} href={l.path} sx={{ ...linkSx, color: MUTED, fontSize: "0.8rem" }}>{l.label}</Box>
            ))}
          </Box>
          <Typography sx={{ color: MUTED, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 0.5, textAlign: "center" }}>
            Made with <Favorite sx={{ fontSize: 14, color: ACCENT }} /> by Data Science Students — HUST
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Footer;
