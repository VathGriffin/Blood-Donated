import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
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

import logo from "../assets/blood-drop.png"; // ✅ Ensure this exists

const Header = ({ darkMode, setDarkMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(!menuOpen);
  };

  const handleClose = () => {
    setMenuOpen(false);
  };

  const sections = [
    { label: "Home", path: "/", icon: <Favorite sx={{ color: "#ff5252" }} /> },
    {
      label: "Donate",
      path: "/donate",
      icon: <VolunteerActivism sx={{ color: "#e53935" }} />,
    },
    {
      label: "Request",
      path: "/request",
      icon: <LocalHospital sx={{ color: "#d81b60" }} />,
    },
    {
      label: "Donors",
      path: "/donors",
      icon: <Group sx={{ color: "#8e24aa" }} />,
    },
    {
      label: "Team",
      path: "/team",
      icon: <PeopleAlt sx={{ color: "#4db6ac" }} />,
    },
    {
      label: "About Us",
      path: "/about",
      icon: <Info sx={{ color: "#64b5f6" }} />,
    },
    {
      label: "Contact",
      path: "/contact",
      icon: <ContactMail sx={{ color: "#fbc02d" }} />,
    },
  ];

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "#b71c1c",
        height: { xs: 80, md: 100 },
        justifyContent: "center",
        boxShadow: 3,
        zIndex: 999,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", height: "100%" }}>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <img
            src={logo}
            alt="Blood Logo"
            style={{
              width: 65,
              height: 65,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
          <Typography
            variant="h4"
            sx={{
              ml: 2,
              color: "white",
              fontWeight: "bold",
              fontSize: { xs: "1.8rem", md: "2.2rem" },
            }}
          >
            Blood Donated
          </Typography>
        </Link>

        {!isMobile ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {sections.map(({ label, path, icon }) => (
              <Link
                key={label}
                to={path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "white",
                  textDecoration: "none",
                  padding: "12px 18px",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: "1.05rem",
                  transition: "0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.15)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {icon}
                <span>{label}</span>
              </Link>
            ))}
            <Tooltip title="Toggle dark mode">
              <IconButton
                onClick={() => setDarkMode(!darkMode)}
                sx={{ color: "white" }}
              >
                {darkMode ? <Brightness7 /> : <Brightness4 />}
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Tooltip title="Toggle dark mode">
                <IconButton
                  onClick={() => setDarkMode(!darkMode)}
                  sx={{ color: "white" }}
                >
                  {darkMode ? <Brightness7 /> : <Brightness4 />}
                </IconButton>
              </Tooltip>
              <IconButton onClick={toggleMenu} sx={{ color: "white" }}>
                <MenuIcon fontSize="large" />
              </IconButton>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={handleClose}
              PaperProps={{ sx: { mt: 1 } }}
            >
              {sections.map(({ label, path, icon }) => (
                <MenuItem
                  key={label}
                  component={Link}
                  to={path}
                  onClick={handleClose}
                  sx={{ gap: 1, px: 2, py: 1 }}
                >
                  {icon}
                  {label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
