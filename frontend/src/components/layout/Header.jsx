'use client';
import { useContext, useState, useEffect } from "react";
import Link from "next/link";
import BrandLogo from "@/components/dashboard/BrandLogo";
import { BRAND } from "@/lib/brand";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Box, useMediaQuery, useTheme, Tooltip, Divider, Button, Avatar, Menu, MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon, Close as CloseIcon, Favorite, LocalHospital, Group, ContactMail,
  Info, SmartToy, Brightness4, Brightness7, Logout, QrCode2, Person,
  KeyboardArrowDown,
} from "@mui/icons-material";
import DonorNotifications from "./DonorNotifications";
import SiteSearch from "./SiteSearch";
import { ColorModeContext } from "@/lib/ThemeContext";
import { useUserAuth } from "@/store/UserAuthContext";
import { uploadUrl } from "@/lib/config";
import { navy } from "@/lib/design-tokens";

const sections = [
  { label: "Home",      path: "/" },
  { label: "About",     path: "/about" },
  { label: "Donate",    path: "/donate" },
  { label: "Find a Hospital", path: "/map" },
  { label: "Donors",    path: "/donors" },
  { label: "Assistant", path: "/assistant" },
  { label: "Contact",   path: "/contact" },
];

const mobileIcons = {
  Home: <Favorite sx={{ color: "#C91D32", fontSize: 20 }} />,
  About: <Info sx={{ color: "#C91D32", fontSize: 20 }} />,
  Donate: <Favorite sx={{ color: "#C91D32", fontSize: 20 }} />,
  "Find a Hospital": <LocalHospital sx={{ color: "#C91D32", fontSize: 20 }} />,
  Donors: <Group sx={{ color: "#C91D32", fontSize: 20 }} />,
  Assistant: <SmartToy sx={{ color: "#C91D32", fontSize: 20 }} />,
  Contact: <ContactMail sx={{ color: "#C91D32", fontSize: 20 }} />,
};

const Header = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);
  const { isAuth, user, logout } = useUserAuth();
  const isMobileQuery = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });
  const [mounted, setMounted] = useState(false);
  const isMobile = mounted && isMobileQuery;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  // White header in light mode (navy in dark mode), with a thin slate rule underneath.
  const bgColor = isDark ? "rgba(11,18,32,0.96)" : "#FFFFFF";
  const border = isDark ? "rgba(255,255,255,0.07)" : "#E2E8F0";
  const navText = isDark ? "#E2E8F0" : navy.dark;

  return (
    <>
      <AppBar position="fixed" elevation={0} sx={{
        top: 0,
        backgroundColor: bgColor,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
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
        <Toolbar sx={{ justifyContent: "space-between", height: "100%", px: { xs: 2, md: 3 } }}>

          {/* ── Brand ── */}
          <BrandLogo href="/" caption={BRAND.tagline} onDark={false} />

          {/* ── Desktop Nav ── */}
          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", flex: 1, ml: 4 }}>
              <Box sx={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: 0.25 }}>
              {sections.map(({ label, path }) => {
                const active = isActive(path);
                return (
                  <Box key={label} component={Link} href={path} aria-current={active ? "page" : undefined} sx={{
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
                    {label}
                  </Box>
                );
              })}
              </Box>

              {/* Right section */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1.5 }}>
                <SiteSearch />
                {isAuth ? (
                  <>
                    <DonorNotifications />
                    <Box component="button" type="button" onClick={handleUserMenuOpen}
                      aria-haspopup="menu" aria-expanded={Boolean(anchorEl)} aria-label={`Account menu for ${user?.fullName || "your account"}`}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1, ml: 0.5, pl: 0.5, pr: 0.75, py: 0.5, border: 0, borderRadius: "999px",
                        bgcolor: "transparent", color: "text.primary", font: "inherit", cursor: "pointer", textAlign: "left",
                        "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9" },
                        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 },
                      }}>
                      <Avatar
                        src={uploadUrl(user?.photo)}
                        sx={{ width: 34, height: 34, bgcolor: "#C91D32", fontSize: "0.82rem", fontWeight: 700 }}
                      >
                        {!user?.photo && user?.fullName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ display: { md: "none", lg: "block" }, maxWidth: 140 }}>
                        <Typography noWrap sx={{ fontWeight: 700, fontSize: "0.85rem", lineHeight: 1.2, color: isDark ? "#F8FAFC" : "#172B4D" }}>{user?.fullName}</Typography>
                        <Typography sx={{ color: isDark ? "rgba(245,245,245,0.6)" : "#64748B", fontSize: "0.72rem", lineHeight: 1.2 }}>Donor</Typography>
                      </Box>
                      <KeyboardArrowDown sx={{ fontSize: 20, color: isDark ? "rgba(245,245,245,0.6)" : "#64748B" }} />
                    </Box>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}
                      slotProps={{ paper: { sx: {
                        borderRadius: "14px", minWidth: 190, mt: 1.2,
                        boxShadow: "0 12px 32px rgba(16,24,40,0.12)",
                        border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                        bgcolor: isDark ? "#17263D" : "#ffffff",
                      }}}}>
                      <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${isDark ? "#334155" : "#E2E8F0"}` }}>
                        <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                      </Box>
                      <MenuItem onClick={() => { router.push("/profile"); handleUserMenuClose(); }}
                        sx={{ fontSize: "0.875rem", py: 1.2 }}>
                        <Person fontSize="small" sx={{ mr: 1.5, color: "#C91D32" }} /> My Profile
                      </MenuItem>
                      <MenuItem onClick={() => { router.push("/qr-card"); handleUserMenuClose(); }}
                        sx={{ fontSize: "0.875rem", py: 1.2 }}>
                        <QrCode2 fontSize="small" sx={{ mr: 1.5, color: "#C91D32" }} /> My QR Card
                      </MenuItem>
                      <Divider sx={{ borderColor: isDark ? "#334155" : "#E2E8F0" }} />
                      <MenuItem onClick={handleLogout} sx={{ color: "error.main", fontSize: "0.875rem", py: 1.2 }}>
                        <Logout fontSize="small" sx={{ mr: 1.5 }} /> Log Out
                      </MenuItem>
                    </Menu>
                  </>
                ) : (
                  <>
                    <Button component={Link} href="/login" variant="outlined" color="primary"
                      sx={{ px: 2.75, py: 0.8, fontSize: "0.875rem", borderColor: "primary.main", borderWidth: 1.5, "&:hover": { borderWidth: 1.5, bgcolor: "action.hover" } }}>
                      Login
                    </Button>
                    <Button component={Link} href="/register" variant="contained" color="primary"
                      sx={{ px: 2.75, py: 0.8, fontSize: "0.875rem" }}>
                      Register
                    </Button>
                  </>
                )}

                <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                  <IconButton onClick={toggleColorMode} size="small"
                    sx={{
                      color: isDark ? "#94A3B8" : "#64748B",
                      borderRadius: "8px", width: 34, height: 34,
                      "&:hover": { color: "primary.main", bgcolor: isDark ? "rgba(255,255,255,0.08)" : "#FFF1F2" },
                    }}>
                    {isDark ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            /* ── Mobile right section ── */
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <SiteSearch size={36} />
              {isAuth && <DonorNotifications size={36} />}
              {isAuth && (
                <Tooltip title={user?.fullName}>
                  <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.4 }}>
                    <Avatar
                      src={uploadUrl(user?.photo)}
                      sx={{ width: 30, height: 30, bgcolor: "#C91D32", fontSize: "0.78rem", fontWeight: 700 }}
                    >
                      {!user?.photo && user?.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              )}
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}
                slotProps={{ paper: { sx: { borderRadius: "14px", minWidth: 190, mt: 1.2,
                  boxShadow: "0 12px 32px rgba(16,24,40,0.12)",
                  bgcolor: isDark ? "#17263D" : "#ffffff",
                }}}}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${isDark ? "#334155" : "#E2E8F0"}` }}>
                  <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
                <MenuItem onClick={() => { router.push("/profile"); handleUserMenuClose(); setDrawerOpen(false); }}
                  sx={{ fontSize: "0.875rem", py: 1.2 }}>
                  <Person fontSize="small" sx={{ mr: 1.5, color: "#C91D32" }} /> My Profile
                </MenuItem>
                <MenuItem onClick={() => { router.push("/qr-card"); handleUserMenuClose(); setDrawerOpen(false); }}
                  sx={{ fontSize: "0.875rem", py: 1.2 }}>
                  <QrCode2 fontSize="small" sx={{ mr: 1.5, color: "#C91D32" }} /> My QR Card
                </MenuItem>
                <Divider sx={{ borderColor: isDark ? "#334155" : "#E2E8F0" }} />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main", fontSize: "0.875rem", py: 1.2 }}>
                  <Logout fontSize="small" sx={{ mr: 1.5 }} /> Log Out
                </MenuItem>
              </Menu>
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <IconButton onClick={toggleColorMode} size="small"
                  sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
                  {isDark ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setDrawerOpen(true)} aria-label="Open menu"
                sx={{ color: navText }}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* ── Mobile Drawer ── */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: {
          width: 288,
          backgroundColor: isDark ? "#0B1220" : "#ffffff",
          borderLeft: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
        }}}}>

        {/* Drawer header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2.5 }}>
          <BrandLogo href="/" caption={BRAND.tagline} onDark={false} onClick={() => setDrawerOpen(false)} />
          <IconButton onClick={() => setDrawerOpen(false)} size="small" aria-label="Close menu"
            sx={{ color: isDark ? "#94A3B8" : "#64748B" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: isDark ? "#334155" : "#E2E8F0" }} />

        <List sx={{ pt: 1.5, px: 1.5 }}>
          {sections.map(({ label, path }) => {
            const active = isActive(path);
            return (
              <Link key={label} href={path} style={{ textDecoration: "none", color: "inherit" }}
                onClick={() => setDrawerOpen(false)}>
                <ListItem sx={{
                  backgroundColor: active ? "rgba(201,29,50,0.08)" : "transparent",
                  borderRadius: "10px", mb: 0.5, py: 1, px: 1.5,
                  transition: "all 0.15s ease",
                  "&:hover": { backgroundColor: active ? "rgba(201,29,50,0.08)" : isDark ? "rgba(255,255,255,0.04)" : "#FFF1F2" },
                }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{mobileIcons[label]}</ListItemIcon>
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
                Log Out
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button fullWidth variant="contained" component={Link} href="/register" onClick={() => setDrawerOpen(false)}>
                Register
              </Button>
              <Button fullWidth variant="outlined" component={Link} href="/login" onClick={() => setDrawerOpen(false)}
                sx={{ borderWidth: 1.5, "&:hover": { borderWidth: 1.5 } }}>
                Login
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
