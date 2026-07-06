'use client';
import React, { useContext, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem,
  ListItemIcon, ListItemText, Box, useMediaQuery, useTheme, Tooltip,
  Divider, Button, Avatar, Menu, MenuItem,
} from "@mui/material";
import {
  Menu as MenuIcon, Close as CloseIcon, Favorite, VolunteerActivism,
  LocalHospital, Group, PeopleAlt, ContactMail, Info, CalendarMonth,
  Map, Chat, Brightness4, Brightness7, Logout, QrCode2,
} from "@mui/icons-material";
import Image from "next/image";
import logo from "@/assets/blood-drop.png";
import { ColorModeContext } from "@/lib/ThemeContext";
import { useUserAuth } from "@/store/UserAuthContext";

const sections = [
  { label: "Home",        path: "/",             icon: <Favorite sx={{ color: "#ff5252" }} /> },
  { label: "Donate",      path: "/donate",        icon: <VolunteerActivism sx={{ color: "#e53935" }} /> },
  { label: "Request",     path: "/requests",      icon: <LocalHospital sx={{ color: "#d81b60" }} /> },
  { label: "Donors",      path: "/donors",        icon: <Group sx={{ color: "#8e24aa" }} /> },
  { label: "Team",        path: "/team",          icon: <PeopleAlt sx={{ color: "#4db6ac" }} /> },
  { label: "About Us",    path: "/about",         icon: <Info sx={{ color: "#64b5f6" }} /> },
  { label: "Appointment", path: "/appointments",  icon: <CalendarMonth sx={{ color: "#26a69a" }} /> },
  { label: "Contact",     path: "/contact",       icon: <ContactMail sx={{ color: "#fbc02d" }} /> },
  { label: "Map",         path: "/map",           icon: <Map sx={{ color: "#43a047" }} /> },
];

const Header = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);
  const { isAuth, user, logout } = useUserAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const handleUserMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    router.push("/");
  };

  const navLinkStyle = (active) => ({
    display: "flex", alignItems: "center", gap: 6, color: "white",
    textDecoration: "none", padding: "8px 12px", borderRadius: 8,
    fontWeight: active ? 700 : 500, fontSize: "0.88rem", transition: "0.2s ease",
    backgroundColor: active ? "rgba(255,255,255,0.2)" : "transparent",
    borderBottom: active ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
  });

  const mobileNavBg = (active) => ({
    backgroundColor: active
      ? theme.palette.mode === "dark" ? "rgba(183,28,28,0.3)" : "rgba(183,28,28,0.08)"
      : "transparent",
    borderRadius: 8, margin: "2px 8px",
  });

  return (
    <>
      <AppBar position="fixed" sx={{
        background: theme.palette.mode === "dark"
          ? "linear-gradient(90deg, #1a0000 0%, #2d0000 100%)"
          : "linear-gradient(90deg, #b71c1c 0%, #c62828 100%)",
        height: { xs: 72, md: 80 }, justifyContent: "center",
        boxShadow: "0 2px 20px rgba(0,0,0,0.25)", zIndex: 1200,
      }}>
        <Toolbar sx={{ justifyContent: "space-between", height: "100%", px: { xs: 2, md: 3 } }}>
          {/* Logo */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Image src={logo} alt="Blood Logo" width={48} height={48} style={{ borderRadius: "50%", objectFit: "cover" }} />
            <Typography variant="h5" sx={{ ml: 1.5, color: "white", fontWeight: 800, letterSpacing: "-0.5px", fontSize: { xs: "1.3rem", md: "1.6rem" } }}>
              Blood Donated
            </Typography>
          </Link>

          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
              {sections.map(({ label, path, icon }) => (
                <Link key={label} href={path} style={navLinkStyle(isActive(path))}>
                  {icon}
                  <span>{label}</span>
                </Link>
              ))}

              <Divider orientation="vertical" flexItem sx={{ mx: 1, bgcolor: "rgba(255,255,255,0.25)", my: 1.5 }} />

              {isAuth ? (
                <>
                  <Tooltip title="Messages">
                    <IconButton component={Link} href="/notification" sx={{ color: "white" }}>
                      <Chat fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={user?.fullName}>
                    <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(255,255,255,0.25)", fontSize: "0.85rem", fontWeight: 700 }}>
                        {user?.fullName?.charAt(0)?.toUpperCase()}
                      </Avatar>
                    </IconButton>
                  </Tooltip>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}
                    slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180, mt: 1 } }}}>
                    <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid #f0f0f0" }}>
                      <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                      <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                    </Box>
                    <MenuItem onClick={() => { router.push("/notification"); handleUserMenuClose(); }}>
                      <Chat fontSize="small" sx={{ mr: 1.5 }} /> My Messages
                    </MenuItem>
                    <MenuItem onClick={() => { router.push("/qr-card"); handleUserMenuClose(); }}>
                      <QrCode2 fontSize="small" sx={{ mr: 1.5 }} /> My QR Card
                    </MenuItem>
                    <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                      <Logout fontSize="small" sx={{ mr: 1.5 }} /> Log Out
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button component={Link} href="/login" size="small" variant="outlined"
                    sx={{ color: "white", borderColor: "rgba(255,255,255,0.6)", borderRadius: 2.5, textTransform: "none", fontWeight: 600, px: 2,
                      "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" } }}>
                    Log In
                  </Button>
                  <Button component={Link} href="/register" size="small" variant="contained"
                    sx={{ bgcolor: "white", color: "#b71c1c", borderRadius: 2.5, textTransform: "none", fontWeight: 700, px: 2,
                      "&:hover": { bgcolor: "#ffcdd2" } }}>
                    Sign Up
                  </Button>
                </Box>
              )}

              <Tooltip title="Toggle dark mode">
                <IconButton onClick={toggleColorMode} sx={{ color: "white", ml: 0.5 }}>
                  {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {isAuth && (
                <Tooltip title={user?.fullName}>
                  <IconButton onClick={handleUserMenuOpen} sx={{ p: 0.5 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: "rgba(255,255,255,0.25)", fontSize: "0.8rem", fontWeight: 700 }}>
                      {user?.fullName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                  </IconButton>
                </Tooltip>
              )}
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleUserMenuClose}
                slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180, mt: 1 } }}}>
                <Box sx={{ px: 2, py: 1.2, borderBottom: "1px solid #f0f0f0" }}>
                  <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
                <MenuItem onClick={() => { router.push("/notification"); handleUserMenuClose(); setDrawerOpen(false); }}>
                  <Chat fontSize="small" sx={{ mr: 1.5 }} /> My Messages
                </MenuItem>
                <MenuItem onClick={() => { router.push("/qr-card"); handleUserMenuClose(); setDrawerOpen(false); }}>
                  <QrCode2 fontSize="small" sx={{ mr: 1.5 }} /> My QR Card
                </MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
                  <Logout fontSize="small" sx={{ mr: 1.5 }} /> Log Out
                </MenuItem>
              </Menu>
              <Tooltip title="Toggle dark mode">
                <IconButton onClick={toggleColorMode} sx={{ color: "white" }}>
                  {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "white" }}>
                <MenuIcon fontSize="large" />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { width: 280, backgroundColor: theme.palette.mode === "dark" ? "#1a0000" : "#fff", pt: 2 } }}}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Image src={logo} alt="logo" width={36} height={36} style={{ borderRadius: "50%" }} />
            <Typography fontWeight={700} color="error.main" fontSize="1.1rem">Blood Donated</Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
        </Box>
        <Divider />
        <List sx={{ pt: 1 }}>
          {sections.map(({ label, path, icon }) => {
            const active = isActive(path);
            return (
              <Link key={label} href={path} style={{ textDecoration: "none", color: "inherit" }}
                onClick={() => setDrawerOpen(false)}>
                <ListItem sx={{ ...mobileNavBg(active), py: 1.2 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                  <ListItemText primary={label}
                    primaryTypographyProps={{ fontWeight: active ? 700 : 500, color: active ? "error.main" : "text.primary" }} />
                  {active && <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#b71c1c", mr: 1 }} />}
                </ListItem>
              </Link>
            );
          })}
          {isAuth && (
            <Link href="/notification" style={{ textDecoration: "none", color: "inherit" }}
              onClick={() => setDrawerOpen(false)}>
              <ListItem sx={{ ...mobileNavBg(isActive("/notification")), py: 1.2 }}>
                <ListItemIcon sx={{ minWidth: 40 }}><Chat sx={{ color: "#26a69a" }} /></ListItemIcon>
                <ListItemText primary="Messages"
                  primaryTypographyProps={{ fontWeight: isActive("/notification") ? 700 : 500, color: isActive("/notification") ? "error.main" : "text.primary" }} />
              </ListItem>
            </Link>
          )}
        </List>
        <Divider sx={{ mx: 2, mt: 1 }} />
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          {isAuth ? (
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: "#b71c1c", fontSize: "0.85rem", fontWeight: 700 }}>
                  {user?.fullName?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography fontWeight={700} fontSize="0.88rem">{user?.fullName}</Typography>
                  <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
                </Box>
              </Box>
              <Button fullWidth variant="outlined" color="error" size="small" startIcon={<Logout />}
                onClick={() => { handleLogout(); setDrawerOpen(false); }}
                sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                Log Out
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Button fullWidth variant="contained" color="error" component={Link} href="/login"
                onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
                Log In
              </Button>
              <Button fullWidth variant="outlined" color="error" component={Link} href="/register"
                onClick={() => setDrawerOpen(false)} sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}>
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
        <Divider sx={{ mx: 2, mt: 1 }} />
        <Box sx={{ px: 2, pt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Blood Donated
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
