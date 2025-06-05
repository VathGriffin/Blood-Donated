import React, { useContext } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Box, Toolbar, useTheme } from "@mui/material";
import { ColorModeContext } from "../ThemeContext";

const MainLayout = () => {
  const theme = useTheme();
  const { toggleColorMode, mode } = useContext(ColorModeContext);

  return (
    <Box sx={{ bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Header toggleColorMode={toggleColorMode} mode={mode} />
      {/* Add spacing to prevent content being hidden behind AppBar */}
      <Toolbar />
      <Box component="main" sx={{ minHeight: "calc(100vh - 200px)", px: 2 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default MainLayout;
