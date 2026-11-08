'use client';
import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/dashboard/BrandLogo";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Box, useTheme, Tooltip, Divider, Button, Avatar,
} from "@mui/material";
import {
  Menu as MenuIcon, Close as CloseIcon, Favorite, LocalHospital, Group, ContactMail,
  Info, SmartToy, Brightness4, Brightness7, Logout, KeyboardArrowDown,
} from "@mui/icons-material";
import DonorNotifications from "./DonorNotifications";
import SiteSearch from "./SiteSearch";
import { ColorModeContext } from "@/lib/ThemeContext";
import { useUserAuth } from "@/store/UserAuthContext";
import { uploadUrl } from "@/lib/config";
import { navy } from "@/lib/design-tokens";
import { ROLE_CONFIG, ROLES } from "@/lib/navigation";
import AccountMenu from "@/components/account/AccountMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import { useT } from "@/i18n/I18nProvider";

const ACCOUNT_MENU_ID = "account-menu";
const ACCOUNT_BUTTON_ID = "account-menu-button";

// `key` is the menu name's translation key in i18n/messages/nav.js.
const sections = [
  { key: "home",         path: "/" },
  { key: "about",        path: "/about" },
  { key: "donate",       path: "/donate" },
  { key: "findHospital", path: "/map" },
  { key: "donors",       path: "/donors" },
  { key: "assistant",    path: "/assistant" },
  { key: "contact",      path: "/contact" },
];

const mobileIcons = {
  home: <Favorite sx={{ color: "#C91D32", fontSize: 20 }} />,
  about: <Info sx={{ color: "#C91D32", fontSize: 20 }} />,
  donate: <Favorite sx={{ color: "#C91D32", fontSize: 20 }} />,
  findHospital: <LocalHospital sx={{ color: "#C91D32", fontSize: 20 }} />,
  donors: <Group sx={{ color: "#C91D32", fontSize: 20 }} />,
  assistant: <SmartToy sx={{ color: "#C91D32", fontSize: 20 }} />,
  contact: <ContactMail sx={{ color: "#C91D32", fontSize: 20 }} />,
};

const Header = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);
  const { isAuth, user, logout } = useUserAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isDark = theme.palette.mode === "dark";
  const t = useT();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Booking an appointment is part of donating, so "Donate" stays highlighted there.
  const isActive = (path) =>
    path === "/" ? pathname === "/"
      : pathname.startsWith(path) || (path === "/donate" && pathname.startsWith("/appointments"));

  const handleUserMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    router.push("/");
  };

  // White header in light mode (navy in dark mode), with a thin slate rule underneath. The
  // background is opaque, so there is no backdrop blur: it would be invisible but costs a GPU
  // blur of everything under the header on every scroll frame.
  const bgColor = isDark ? "#0B1220" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0";
  const navText = isDark ? "#E2E8F0" : navy.dark;
  const muted = isDark ? "rgba(245,245,245,0.6)" : "#64748B";

  // One layout for every screen size: CSS shows the nav links from `md` up and the menu button
  // below it. (Choosing the layout in JavaScript instead made phones paint the desktop header
  // first and then jump to the mobile one once the page had loaded.)
  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        top: 0,
        backgroundColor: bgColor,
        borderBottom: `1px solid ${border}`,
        height: { xs: 64, md: 68 },
        justifyContent: "center",
        zIndex: 1200,
        transition: "background-color 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        boxShadow: scrolled
          ? isDark
            ? "0 1px 24px rgba(0,0,0,0.4)"
            : "0 1px 3px rgba(16,24,40,0.05), 0 6px 18px rgba(16,24,40,0.06)"
          : "none",
      }}>
        <Toolbar sx={{ justifyContent: "space-between", height: "100%", px: { xs: 2, md: 3 }, gap: 1 }}>

          {/* ── Brand ── */}
          <BrandLogo href="/" caption={t("common.brandTagline")} onDark={false} />

          {/* ── Nav links (from 1200px; narrower screens use the menu drawer, as there is no room for
              the links, the sign-in buttons and the language picker together in every language) ── */}
          <Box component="nav" aria-label={t("nav.navigation", { panel: "BloodLife AI" })}
            sx={{ flex: 1, ml: 4, display: { xs: "none", lg: "flex" }, justifyContent: "center", alignItems: "center", gap: 0.25 }}>
            {sections.map(({ key, path }) => {
              const active = isActive(path);
              return (
                <Box key={key} component={Link} href={path} aria-current={active ? "page" : undefined} sx={{
                  position: "relative", px: { md: 1.1, lg: 1.6 }, py: 1, borderRadius: "8px", textDecoration: "none",
                  fontSize: "0.875rem", fontWeight: active ? 700 : 600,
                  letterSpacing: "-0.005em", whiteSpace: "nowrap",
                  // Active page: red text with a thin red underline; others turn red on hover.
                  color: active ? "primary.main" : navText,
                  transition: "color 0.18s ease",
                  "&::after": {
                    content: '""', position: "absolute", left: { md: 9, lg: 13 }, right: { md: 9, lg: 13 }, bottom: 3,
                    height: 2, borderRadius: 2, bgcolor: "primary.main",
                    transform: active ? "scaleX(1)" : "scaleX(0)", opacity: active ? 1 : 0.55,
                    transition: "transform 0.2s ease",
                  },
                  "&:hover": { color: "primary.main", "&::after": { transform: "scaleX(1)" } },
                  "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                  "@media (prefers-reduced-motion: reduce)": { transition: "none", "&::after": { transition: "none" } },
                }}>
                  {t(`nav.${key}`)}
                </Box>
              );
            })}
          </Box>

          {/* ── Right section ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 1 }, ml: { md: 1.5 } }}>
            <SiteSearch size={36} />
            {isAuth ? (
              <>
                <DonorNotifications size={38} />
                <Box component="button" type="button" onClick={handleUserMenuOpen} id={ACCOUNT_BUTTON_ID}
                  aria-haspopup="menu" aria-expanded={Boolean(anchorEl)} aria-controls={anchorEl ? ACCOUNT_MENU_ID : undefined}
                  aria-label={t("layout.account.menuFor", { name: user?.fullName || "" })}
                  sx={{
                    display: "flex", alignItems: "center", gap: 1, ml: { md: 0.5 }, p: { xs: 0.4, md: 0.5 }, pr: { md: 0.75 }, border: 0, borderRadius: "999px",
                    bgcolor: "transparent", color: "text.primary", font: "inherit", cursor: "pointer", textAlign: "left",
                    "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9" },
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                  }}>
                  <Avatar
                    src={uploadUrl(user?.photo)}
                    sx={{ width: { xs: 30, md: 34 }, height: { xs: 30, md: 34 }, bgcolor: "#C91D32", fontSize: "0.82rem", fontWeight: 700 }}
                  >
                    {!user?.photo && user?.fullName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ display: { xs: "none", lg: "block" }, maxWidth: 140 }}>
                    <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2, color: isDark ? "#F8FAFC" : "#172B4D" }}>{user?.fullName}</Typography>
                    <Typography sx={{ color: muted, fontSize: "0.72rem", lineHeight: 1.2 }}>{t("common.roles.donor")}</Typography>
                  </Box>
                  <KeyboardArrowDown aria-hidden="true" sx={{
                    display: { xs: "none", md: "block" }, fontSize: 20, color: muted,
                    transform: anchorEl ? "rotate(180deg)" : "none", transition: "transform .2s ease",
                  }} />
                </Box>
              </>
            ) : (
              // Below 1200px these two are in the drawer.
              // Kept on one line: Khmer and Vietnamese labels are longer than English.
              <Box sx={{ display: { xs: "none", lg: "flex" }, gap: 1, flexShrink: 0 }}>
                <Button component={Link} href="/login" variant="outlined" color="primary"
                  sx={{ px: { lg: 1.75, xl: 2.75 }, py: 0.8, fontSize: "0.875rem", whiteSpace: "nowrap", flexShrink: 0, borderColor: "primary.main", borderWidth: 1.5, "&:hover": { borderWidth: 1.5, bgcolor: "action.hover" } }}>
                  {t("common.login")}
                </Button>
                <Button component={Link} href="/register" variant="contained" color="primary"
                  sx={{ px: { lg: 1.75, xl: 2.75 }, py: 0.8, fontSize: "0.875rem", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {t("common.register")}
                </Button>
              </Box>
            )}

            {/* Phones pick the language in the drawer; from 600px it fits in the bar (code shown from md). */}
            <Box sx={{ display: { xs: "none", sm: "flex" } }}><LanguageSwitcher labelDisplay={{ xs: "none", md: "inline" }} /></Box>

            <Tooltip title={t(isDark ? "common.lightMode" : "common.darkMode")}>
              <IconButton onClick={toggleColorMode} size="small" aria-label={t("common.toggleColorMode")}
                sx={{
                  color: isDark ? "#94A3B8" : "#64748B",
                  borderRadius: "8px", width: 34, height: 34,
                  "&:hover": { color: "primary.main", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#FFF1F2" },
                }}>
                {isDark ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            <IconButton onClick={() => setDrawerOpen(true)} aria-label={t("common.openMenu")}
              sx={{ display: { xs: "inline-flex", lg: "none" }, color: navText }}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* One account menu for both the desktop and the mobile header. */}
      {isAuth && user && (
        <AccountMenu
          id={ACCOUNT_MENU_ID}
          labelledBy={ACCOUNT_BUTTON_ID}
          anchorEl={anchorEl}
          onClose={handleUserMenuClose}
          account={{ name: user.fullName, email: user.email, photo: user.photo, role: "donor" }}
          items={ROLE_CONFIG[ROLES.DONOR].profileLinks}
          onLogout={handleLogout}
        />
      )}

      {/* ── Menu drawer (below 1200px) ── */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: {
          width: 288,
          backgroundColor: isDark ? "#0B1220" : "#ffffff",
          borderLeft: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        }}}}>

        {/* Drawer header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2.5 }}>
          <BrandLogo href="/" caption={t("common.brandTagline")} onDark={false} onClick={() => setDrawerOpen(false)} />
          <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label={t("common.closeMenu")}
            sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: isDark ? "#334155" : "#E2E8F0" }} />

        <List sx={{ pt: 1.5, px: 1.5 }}>
          {sections.map(({ key, path }) => {
            const active = isActive(path);
            const label = t(`nav.${key}`);
            return (
              <Link key={label} href={path} style={{ textDecoration: "none", color: "inherit" }}
                onClick={() => setDrawerOpen(false)}>
                <ListItem sx={{
                  backgroundColor: active ? "rgba(201,29,50,0.08)" : "transparent",
                  borderRadius: "10px", mb: 0.5, py: 1, px: 1.5,
                  transition: "all 0.15s ease",
                  "&:hover": { backgroundColor: active ? "rgba(201,29,50,0.08)" : isDark ? "rgba(255,255,255,0.04)" : "#FFF1F2" },
                }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{mobileIcons[key]}</ListItemIcon>
                  <ListItemText primary={label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: "0.9rem",
                      color: active ? "#C91D32" : navText,
                    }} />
                  {active && (
                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#C91D32" }} />
                  )}
                </ListItem>
              </Link>
            );
          })}
        </List>

        {/* Language picker for phones (the bar shows it from 600px up). */}
        <Box sx={{ px: 2.5, pt: 1, display: "flex" }}><LanguageSwitcher /></Box>

        <Divider sx={{ mx: 2, my: 1.5, borderColor: isDark ? "#334155" : "#E2E8F0" }} />

        <Box sx={{ px: 2, pb: 3 }}>
          {isAuth ? (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5,
                p: 1.5, borderRadius: "10px", bgcolor: isDark ? "#17263D" : "#F8FAFC",
                border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
              }}>
                <Avatar
                  src={uploadUrl(user?.photo)}
                  sx={{ width: 36, height: 36, bgcolor: "#C91D32", fontSize: "0.85rem", fontWeight: 700 }}
                >
                  {!user?.photo && user?.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
              </Box>
              <Button fullWidth variant="outlined" color="error" size="small" startIcon={<Logout fontSize="small" />}
                onClick={() => { handleLogout(); setDrawerOpen(false); }}
                sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}>
                {t("common.logout")}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button fullWidth variant="contained" component={Link} href="/register" onClick={() => setDrawerOpen(false)}>
                {t("common.register")}
              </Button>
              <Button fullWidth variant="outlined" component={Link} href="/login" onClick={() => setDrawerOpen(false)}
                sx={{ borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } }}>
                {t("common.login")}
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
