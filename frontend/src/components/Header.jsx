'use client';
import React, { useContext, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Box, useMediaQuery, useTheme, Tooltip,
  Divider, Button, Avatar, Menu, MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon, Close as CloseIcon, Favorite,
  LocalHospital, Group, PeopleAlt, ContactMail, Info,
  Chat, Brightness4, Brightness7, Logout, QrCode2, Person,
} from "@mui/icons-material";
import { ColorModeContext } from "@/lib/ThemeContext";
import { useUserAuth } from "@/store/UserAuthContext";
import API_BASE from "@/lib/config";

// Height of the urgent-needs strip (px). Used to offset the AppBar and the
// layout spacer so the two fixed bars never overlap page content.
export const URGENT_STRIP_HEIGHT = 30;

const urgentNeeds = [
  "O- blood urgently needed · Phnom Penh",
  "A+ donors needed · Siem Reap",
  "B- critical shortage · Battambang",
  "O+ needed for surgery · Kampong Cham",
  "AB- rare type needed · Kandal",
];

const sections = [
  { label: "Home",      path: "/" },
  { label: "About",     path: "/about" },
  { label: "Donors",    path: "/donors" },
  { label: "Hospitals", path: "/map" },
  { label: "Blog",      path: "/team" },
  { label: "Contact",   path: "/contact" },
];

const mobileIcons = {
  Home: <Favorite sx={{ color: "#dc2626", fontSize: 20 }} />,
  About: <Info sx={{ color: "#64b5f6", fontSize: 20 }} />,
  Donors: <Group sx={{ color: "#8e24aa", fontSize: 20 }} />,
  Hospitals: <LocalHospital sx={{ color: "#d81b60", fontSize: 20 }} />,
  Blog: <PeopleAlt sx={{ color: "#4db6ac", fontSize: 20 }} />,
  Contact: <ContactMail sx={{ color: "#fbc02d", fontSize: 20 }} />,
};

const Header = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);
  const { isAuth, user, logout } = useUserAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [marquee, setMarquee] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setMarquee((m) => (m + 1) % urgentNeeds.length), 3500);
    return () => clearInterval(id);
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

  const bgColor = isDark
    ? scrolled ? "rgba(10,10,10,0.92)" : "rgba(10,10,10,0.75)"
    : scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.75)";

  const border = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)";

  return (
    <>
      <style>{`
        @keyframes urgentFade { 0%{opacity:0;transform:translateY(4px);} 12%,88%{opacity:1;transform:translateY(0);} 100%{opacity:0;transform:translateY(-4px);} }
        @keyframes urgentPulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      `}</style>

      {/* ── Urgent Needs Strip (fixed, sits above the AppBar) ── */}
      <Box sx={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1201,
        height: URGENT_STRIP_HEIGHT,
        bgcolor: "#dc2626", px: 2,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5,
      }}>
        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "white", animation: "urgentPulse 1.2s ease infinite", flexShrink: 0 }} />
        <Typography key={marquee} noWrap sx={{
          fontSize: "0.72rem", fontWeight: 600, color: "white", letterSpacing: "0.03em",
          animation: "urgentFade 3.5s ease both", maxWidth: { xs: "70%", sm: "none" },
        }}>
          URGENT · {urgentNeeds[marquee]}
        </Typography>
        <Box component={Link} href="/requests" sx={{
          fontSize: "0.7rem", fontWeight: 700, color: "rgba(255,255,255,0.9)",
          textDecoration: "underline", letterSpacing: "0.02em", cursor: "pointer",
          whiteSpace: "nowrap", display: { xs: "none", sm: "inline" },
        }}>
          Respond now →
        </Box>
      </Box>

      <AppBar position="fixed" elevation={0} sx={{
        top: `${URGENT_STRIP_HEIGHT}px`,
        backgroundColor: bgColor,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: `1px solid ${scrolled ? border : "transparent"}`,
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
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none", gap: 9 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: "10px",
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 10px rgba(220,38,38,0.4)",
            }}>
              <Favorite sx={{ fontSize: 17, color: "white" }} />
            </Box>
            <Typography sx={{
              fontWeight: 800, fontSize: "1.15rem", letterSpacing: "-0.03em", lineHeight: 1,
            }}>
              <Box component="span" sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>Blood</Box>
              <Box component="span" sx={{ color: "#dc2626" }}>Life</Box>
            </Typography>
          </Link>

          {/* ── Desktop Nav ── */}
          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {sections.map(({ label, path }) => {
                const active = isActive(path);
                return (
                  <Link key={label} href={path} style={{ textDecoration: "none" }}>
                    <Box sx={{
                      px: 1.5, py: 0.7, borderRadius: "8px",
                      fontSize: "0.875rem", fontWeight: active ? 700 : 500,
                      letterSpacing: "-0.01em",
                      color: active ? "#dc2626" : isDark ? "rgba(245,245,245,0.7)" : "#555555",
                      backgroundColor: active ? "rgba(220,38,38,0.08)" : "transparent",
                      transition: "all 0.18s ease",
                      "&:hover": {
                        color: "#dc2626",
                        backgroundColor: "rgba(220,38,38,0.06)",
                      },
                    }}>
                      {label}
                    </Box>
                  </Link>
                );
              })}

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
                      <MenuItem onClick={() => { router.push("/notification"); handleUserMenuClose(); }}
                        sx={{ fontSize: "0.875rem", py: 1.2 }}>
                        <Chat fontSize="small" sx={{ mr: 1.5, color: "#dc2626" }} /> My Messages
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
                  <Button component={Link} href="/login" size="small" variant="outlined"
                    sx={{
                      color: isDark ? "rgba(245,245,245,0.8)" : "#555555",
                      borderColor: isDark ? "rgba(255,255,255,0.15)" : "#e0e0e0",
                      borderRadius: "8px", textTransform: "none", fontWeight: 600,
                      px: 2, py: 0.6, fontSize: "0.875rem",
                      "&:hover": { borderColor: "#dc2626", color: "#dc2626", bgcolor: "rgba(220,38,38,0.04)" },
                    }}>
                    Log In
                  </Button>
                )}

                <Button component={Link} href="/donate" variant="contained" size="small"
                  sx={{
                    bgcolor: "#dc2626", color: "white", borderRadius: "100px",
                    textTransform: "none", fontWeight: 700, px: 2.5, py: 0.9,
                    fontSize: "0.875rem", letterSpacing: "-0.01em",
                    boxShadow: "0 2px 12px rgba(220,38,38,0.4)",
                    "&:hover": { bgcolor: "#b91c1c", boxShadow: "0 4px 20px rgba(220,38,38,0.5)", transform: "translateY(-1px)" },
                    transition: "all 0.2s ease",
                  }}>
                  Donate Now
                </Button>

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
                <MenuItem onClick={() => { router.push("/notification"); handleUserMenuClose(); setDrawerOpen(false); }}
                  sx={{ fontSize: "0.875rem", py: 1.2 }}>
                  <Chat fontSize="small" sx={{ mr: 1.5, color: "#dc2626" }} /> My Messages
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: "8px",
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Favorite sx={{ fontSize: 15, color: "white" }} />
            </Box>
            <Typography fontWeight={800} sx={{ fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
              <Box component="span" sx={{ color: isDark ? "#f5f5f5" : "#111111" }}>Blood</Box>
              <Box component="span" sx={{ color: "#dc2626" }}>Life</Box>
            </Typography>
          </Box>
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
              <Button fullWidth variant="contained"
                sx={{
                  bgcolor: "#dc2626", borderRadius: "100px", textTransform: "none", fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
                  "&:hover": { bgcolor: "#b91c1c" },
                }}
                component={Link} href="/donate" onClick={() => setDrawerOpen(false)}>
                Donate Now
              </Button>
              <Button fullWidth variant="outlined" color="error" component={Link} href="/login"
                onClick={() => setDrawerOpen(false)} sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 600 }}>
                Log In
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
