'use client';
import Link from "next/link";
import { Box, Typography, IconButton, useTheme, Grid } from "@mui/material";
import { Facebook, Telegram, Favorite, Email, Phone, LocationOn, AccessTime } from "@mui/icons-material";
import BrandLogo from "@/components/dashboard/BrandLogo";
import { BRAND } from "@/lib/brand";
import { useI18n } from "@/i18n/I18nProvider";
import { CONTACT } from "@/lib/contact";
import { navy } from "@/lib/design-tokens";

// `key`: the link's name in i18n/messages/nav.js.
const quickLinks = [
  { key: "home",         path: "/" },
  { key: "donateBlood",  path: "/donate" },
  { key: "requestBlood", path: "/requests" },
  { key: "findHospital", path: "/map" },
  { key: "findDonors",   path: "/donors" },
  { key: "aboutUs",      path: "/about" },
  { key: "contact",      path: "/contact" },
];

const legalLinks = [
  { key: "privacyPolicy",  path: "/privacy" },
  { key: "termsOfService", path: "/terms" },
  { key: "cookiePolicy",   path: "/privacy#collect" },
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
  const { t, rich } = useI18n();

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
              <BrandLogo href="/" caption={t("common.brandTagline")} onDark />
            </Box>
            <Typography sx={{ color: TEXT, fontSize: "0.9rem", lineHeight: 1.8, mb: 2.5, maxWidth: 380 }}>
              {t("layout.footer.about")}
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
            <Typography component="h2" sx={headingSx}>{t("layout.footer.quickLinks")}</Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0, m: 0, display: "grid", gap: 1.1 }}>
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Box component={Link} href={link.path} sx={linkSx}>{t(`nav.${link.key}`)}</Box>
                </li>
              ))}
            </Box>
          </Grid>

          {/* Blood types */}
          <Grid size={{ xs: 6, sm: 6, md: 2.25 }}>
            <Typography component="h2" sx={headingSx}>{t("layout.footer.bloodTypes")}</Typography>
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
              {t("layout.footer.eligible")}
            </Box>
          </Grid>

          {/* Contact */}
          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <Typography component="h2" sx={headingSx}>{t("layout.footer.contactUs")}</Typography>
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <ContactRow icon={<Email />}>
                <Box component="a" href={`mailto:${CONTACT.email}`} sx={linkSx}>{CONTACT.email}</Box>
              </ContactRow>
              <ContactRow icon={<Phone />}>
                <Box component="a" href={CONTACT.phoneHref} sx={linkSx}>{CONTACT.phoneDisplay}</Box>
              </ContactRow>
              <ContactRow icon={<LocationOn />}>{CONTACT.address}</ContactRow>
              <ContactRow icon={<AccessTime />}>{t("layout.footer.hours")}</ContactRow>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ borderTop: `1px solid ${RULE}`, mt: { xs: 5, md: 6 }, pt: 3,
          display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
          <Typography sx={{ color: MUTED, fontSize: "0.8rem", textAlign: "center" }} suppressHydrationWarning>
            {t("layout.footer.rights", { year: new Date().getFullYear(), brand: BRAND.name })}
          </Typography>
          <Box component="nav" aria-label={t("layout.footer.legal")} sx={{ display: "flex", gap: { xs: 2, sm: 3 }, flexWrap: "wrap", justifyContent: "center" }}>
            {legalLinks.map((l) => (
              <Box key={l.path} component={Link} href={l.path} sx={{ ...linkSx, color: MUTED, fontSize: "0.8rem" }}>{t(`nav.${l.key}`)}</Box>
            ))}
          </Box>
          <Typography sx={{ color: MUTED, fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 0.5, textAlign: "center" }}>
            {rich("layout.footer.madeBy", { heart: <Favorite aria-hidden="true" sx={{ fontSize: 14, color: ACCENT }} /> })}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default Footer;
