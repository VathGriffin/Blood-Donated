import React, { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Favorite,
  VolunteerActivism,
  LocalHospital,
  Group,
  PeopleAlt,
  ContactMail,
  Info,
  Brightness4,
  Brightness7,
} from "@mui/icons-material";

import logo from "../assets/blood-drop.png";
import { ColorModeContext } from "../ThemeContext";

const sections = [
  { label: "Home", path: "/", icon: <Favorite sx={{ color: "#ff5252" }} /> },
  { label: "Donate", path: "/donate", icon: <VolunteerActivism sx={{ color: "#e53935" }} /> },
  { label: "Request", path: "/request", icon: <LocalHospital sx={{ color: "#d81b60" }} /> },
  { label: "Donors", path: "/donors", icon: <Group sx={{ color: "#8e24aa" }} /> },
  { label: "Team", path: "/team", icon: <PeopleAlt sx={{ color: "#4db6ac" }} /> },
  { label: "About Us", path: "/about", icon: <Info sx={{ color: "#64b5f6" }} /> },
  { label: "Contact", path: "/contact", icon: <ContactMail sx={{ color: "#fbc02d" }} /> },
];

const Header = () => {
  const theme = useTheme();
  const { toggleColorMode } = useContext(ColorModeContext);
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navLinkStyle = ({ isActive }) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "white",
    textDecoration: "none",
    padding: "10px 14px",
    borderRadius: 8,
    fontWeight: isActive ? 700 : 500,
    fontSize: "0.95rem",
    transition: "0.2s ease",
    backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "transparent",
    borderBottom: isActive ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
  });

  const mobileNavStyle = ({ isActive }) => ({
    backgroundColor: isActive
      ? theme.palette.mode === "dark"
        ? "rgba(183,28,28,0.3)"
        : "rgba(183,28,28,0.08)"
      : "transparent",
    borderRadius: 8,
    margin: "2px 8px",
  });

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(90deg, #1a0000 0%, #2d0000 100%)"
              : "linear-gradient(90deg, #b71c1c 0%, #c62828 100%)",
          height: { xs: 72, md: 80 },
          justifyContent: "center",
          boxShadow: "0 2px 20px rgba(0,0,0,0.25)",
          zIndex: 1200,
        }}
      >
        <Toolbar sx={{ justifyContent: "space-between", height: "100%", px: { xs: 2, md: 3 } }}>
          <NavLink
            to="/"
            style={{ display: "flex", alignItems: "center", textDecoration: "none" }}
          >
            <img
              src={logo}
              alt="Blood Logo"
              style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover" }}
            />
            <Typography
              variant="h5"
              sx={{
                ml: 1.5,
                color: "white",
                fontWeight: 800,
                letterSpacing: "-0.5px",
                fontSize: { xs: "1.4rem", md: "1.7rem" },
              }}
            >
              Blood Donated
            </Typography>
          </NavLink>

          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              {sections.map(({ label, path, icon }) => (
                <NavLink
                  key={label}
                  to={path}
                  end={path === "/"}
                  style={navLinkStyle}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)")
                  }
                  onMouseLeave={(e) => {
                    const isActive = e.currentTarget.getAttribute("aria-current") === "page";
                    e.currentTarget.style.backgroundColor = isActive
                      ? "rgba(255,255,255,0.2)"
                      : "transparent";
                  }}
                >
                  {icon}
                  <span>{label}</span>
                </NavLink>
              ))}
              <Tooltip title="Toggle dark mode">
                <IconButton onClick={toggleColorMode} sx={{ color: "white", ml: 1 }}>
                  {theme.palette.mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
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
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: theme.palette.mode === "dark" ? "#1a0000" : "#fff",
            pt: 2,
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, pb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img src={logo} alt="logo" style={{ width: 36, height: 36, borderRadius: "50%" }} />
            <Typography fontWeight={700} color="error.main" fontSize="1.1rem">
              Blood Donated
            </Typography>
          </Box>
          <IconButton onClick={() => setDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider />

        <List sx={{ pt: 1 }}>
          {sections.map(({ label, path, icon }) => (
            <NavLink
              key={label}
              to={path}
              end={path === "/"}
              style={{ textDecoration: "none", color: "inherit" }}
              onClick={() => setDrawerOpen(false)}
            >
              {({ isActive }) => (
                <ListItem
                  sx={{
                    ...mobileNavStyle({ isActive }),
                    py: 1.2,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
                  <ListItemText
                    primary={label}
                    primaryTypographyProps={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "error.main" : "text.primary",
                    }}
                  />
                  {isActive && (
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#b71c1c",
                        mr: 1,
                      }}
                    />
                  )}
                </ListItem>
              )}
            </NavLink>
          ))}
        </List>

        <Divider sx={{ mx: 2, mt: 1 }} />
        <Box sx={{ px: 2, pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} Blood Donated
          </Typography>
        </Box>
      </Drawer>
    </>
  );
};

export default Header;
