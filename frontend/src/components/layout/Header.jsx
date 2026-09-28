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
  Info, SmartToy, Chat, Brightness4, Brightness7, Logout, QrCode2, Person,
} from "@mui/icons-material";
import { ColorModeContext } from "@/lib/ThemeContext";
import { useUserAuth } from "@/store/UserAuthContext";
import API_BASE from "@/lib/config";

// Height of any bar stacked above the AppBar (px). The public layout uses it for the
// content spacer. The old "urgent needs" strip showed hard-coded shortage notices that
// weren't connected to any data, so it was removed; keep this at 0 unless a bar returns.
export const URGENT_STRIP_HEIGHT = 0;

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
  Home: <Favorite sx={{ color: "#dc2626", fontSize: 20 }} />,
  About: <Info sx={{ color: "#64b5f6", fontSize: 20 }} />,
  Donate: <Favorite sx={{ color: "#dc2626", fontSize: 20 }} />,
  "Find a Hospital": <LocalHospital sx={{ color: "#d81b60", fontSize: 20 }} />,
  Donors: <Group sx={{ color: "#8e24aa", fontSize: 20 }} />,
  Assistant: <SmartToy sx={{ color: "#dc2626", fontSize: 20 }} />,
  Contact: <ContactMail sx={{ color: "#fbc02d", fontSize: 20 }} />,
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

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const handleUserMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    router.push("/");
  };

  const bgColor = isDark ? "rgba(10,10,10,0.94)" : "rgba(255,255,255,0.96)";

  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

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
            : "0 1px 24px rgba(0,0,0,0.08)"
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
                  <Link key={label} href={path} style={{ textDecoration: "none" }}>
                    <Box sx={{
                      position: "relative", px: 1.6, py: 1,
                      fontSize: "0.875rem", fontWeight: active ? 700 : 500,
                      letterSpacing: "-0.005em", whiteSpace: "nowrap",
                      color: active ? "primary.main" : "text.primary",
                      transition: "color 0.18s ease",
                      "&:hover": { color: "primary.main" },
                      "&::after": {
                        content: '""', position: "absolute", left: 12, right: 12, bottom: 0, height: 2, borderRadius: 2,
                        bgcolor: "primary.main", transform: active ? "scaleX(1)" : "scaleX(0)", transition: "transform 0.18s ease",
                      },
                      "&:hover::after": { transform: "scaleX(1)" },
                    }}>
                      {label}
                    </Box>
                  </Link>
                );
              })}
              </Box>

              {/* Right section */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 1.5 }}>
                {isAuth ? (
                  <>
                    <Tooltip title="Messages">
                      <IconButton component={Link} href="/notification" size="small"
                        sx={{ color: isDark ? "rgba(245,245,245,0.6)" : "#666666" }}>
                        <Chat fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={user?.fullName}>
                      <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.4 }}>
                        <Avatar
                          src={user?.photo ? `${API_BASE}${user.photo}` : undefined}
                          sx={{
                            width: 32, height: 32, bgcolor: "#dc2626",
                            fontSize: "0.8rem", fontWeight: 700,
                            boxShadow: "0 2px 8px rgba(220,38,38,0.4)",
                          }}
                        >
                          {!user?.photo && user?.fullName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                      </IconButton>
                    </Tooltip>
                    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}
                      slotProps={{ paper: { sx: {
                        borderRadius: "14px", minWidth: 190, mt: 1.2,
                        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                        border: `1px solid ${isDark ? "#1f1f1f" : "#e5e5e5"}`,
                        bgcolor: isDark ? "#111111" : "#ffffff",
                      }}}}>
                      <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}` }}>
                        <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                      </Box>
                      <MenuItem onClick={() => { router.push("/profile"); handleUserMenuClose(); }}
                        sx={{ fontSize: "0.875rem", py: 1.2 }}>
                        <Person fontSize="small" sx={{ mr: 1.5, color: "#dc2626" }} /> My Profile
                      </MenuItem>
                      <MenuItem onClick={() => { router.push("/qr-card"); handleUserMenuClose(); }}
                        sx={{ fontSize: "0.875rem", py: 1.2 }}>
                        <QrCode2 fontSize="small" sx={{ mr: 1.5, color: "#dc2626" }} /> My QR Card
                      </MenuItem>
                      <Divider sx={{ borderColor: isDark ? "#1f1f1f" : "#f0f0f0" }} />
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
                      color: isDark ? "rgba(245,245,245,0.55)" : "#888888",
                      borderRadius: "8px", width: 34, height: 34,
                      "&:hover": { bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" },
                    }}>
                    {isDark ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            /* ── Mobile right section ── */
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {isAuth && (
                <Tooltip title={user?.fullName}>
                  <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.4 }}>
                    <Avatar
                      src={user?.photo ? `${API_BASE}${user.photo}` : undefined}
                      sx={{ width: 30, height: 30, bgcolor: "#dc2626", fontSize: "0.78rem", fontWeight: 700 }}
                    >
                      {!user?.photo && user?.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              )}
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}
                slotProps={{ paper: { sx: { borderRadius: "14px", minWidth: 190, mt: 1.2,
                  boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
                  bgcolor: isDark ? "#111111" : "#ffffff",
                }}}}>
                <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}` }}>
                  <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
                <MenuItem onClick={() => { router.push("/profile"); handleUserMenuClose(); setDrawerOpen(false); }}
                  sx={{ fontSize: "0.875rem", py: 1.2 }}>
                  <Person fontSize="small" sx={{ mr: 1.5, color: "#dc2626" }} /> My Profile
                </MenuItem>
                <MenuItem onClick={() => { router.push("/qr-card"); handleUserMenuClose(); setDrawerOpen(false); }}
                  sx={{ fontSize: "0.875rem", py: 1.2 }}>
                  <QrCode2 fontSize="small" sx={{ mr: 1.5, color: "#dc2626" }} /> My QR Card
                </MenuItem>
                <Divider sx={{ borderColor: isDark ? "#1f1f1f" : "#f0f0f0" }} />
                <MenuItem onClick={handleLogout} sx={{ color: "error.main", fontSize: "0.875rem", py: 1.2 }}>
                  <Logout fontSize="small" sx={{ mr: 1.5 }} /> Log Out
                </MenuItem>
              </Menu>
              <Tooltip title={isDark ? "Light mode" : "Dark mode"}>
                <IconButton onClick={toggleColorMode} size="small"
                  sx={{ color: isDark ? "rgba(245,245,245,0.7)" : "#555555" }}>
                  {isDark ? <Brightness7 sx={{ fontSize: 18 }} /> : <Brightness4 sx={{ fontSize: 18 }} />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setDrawerOpen(true)}
                sx={{ color: isDark ? "rgba(245,245,245,0.85)" : "#333333" }}>
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
          backgroundColor: isDark ? "#0a0a0a" : "#ffffff",
          borderLeft: `1px solid ${isDark ? "#1f1f1f" : "#f0f0f0"}`,
        }}}}>

        {/* Drawer header */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2.5 }}>
          <BrandLogo href="/" caption={BRAND.tagline} onDark={false} onClick={() => setDrawerOpen(false)} />
          <IconButton onClick={() => setDrawerOpen(false)} size="small"
            sx={{ color: isDark ? "rgba(245,245,245,0.6)" : "#666666" }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ borderColor: isDark ? "#1f1f1f" : "#f0f0f0" }} />

        <List sx={{ pt: 1.5, px: 1.5 }}>
          {sections.map(({ label, path }) => {
            const active = isActive(path);
            return (
              <Link key={label} href={path} style={{ textDecoration: "none", color: "inherit" }}
                onClick={() => setDrawerOpen(false)}>
                <ListItem sx={{
                  backgroundColor: active ? "rgba(220,38,38,0.08)" : "transparent",
                  borderRadius: "10px", mb: 0.5, py: 1, px: 1.5,
                  transition: "all 0.15s ease",
                  "&:hover": { backgroundColor: active ? "rgba(220,38,38,0.08)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)" },
                }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>{mobileIcons[label]}</ListItemIcon>
                  <ListItemText primary={label}
                    primaryTypographyProps={{
                      fontWeight: active ? 700 : 500,
                      fontSize: "0.9rem",
                      color: active ? "#dc2626" : isDark ? "rgba(245,245,245,0.85)" : "#333333",
                    }} />
                  {active && (
                    <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: "#dc2626" }} />
                  )}
                </ListItem>
              </Link>
            );
          })}
        </List>

        <Divider sx={{ mx: 2, my: 1.5, borderColor: isDark ? "#1f1f1f" : "#f0f0f0" }} />

        <Box sx={{ px: 2, pb: 3 }}>
          {isAuth ? (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5,
                p: 1.5, borderRadius: "10px", bgcolor: isDark ? "#151515" : "#fafafa",
                border: `1px solid ${isDark ? "#1f1f1f" : "#e5e5e5"}`,
              }}>
                <Avatar
                  src={user?.photo ? `${API_BASE}${user.photo}` : undefined}
                  sx={{ width: 36, height: 36, bgcolor: "#dc2626", fontSize: "0.85rem", fontWeight: 700 }}
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
