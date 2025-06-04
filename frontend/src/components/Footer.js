import React from "react";
import {
  Box,
  Typography,
  IconButton,
  Link,
  useTheme,
  useMediaQuery,
  Divider,
} from "@mui/material";
import { Facebook, Telegram } from "@mui/icons-material";

function Footer() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ backgroundColor: "#b71c1c", color: "#fff", pt: 6, pb: 4, px: 3 }}>
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        {/* About Section */}
        <Box sx={{ flex: 2 }}>
          <Typography
            variant="h6"
            sx={{ color: "#ffeb3b", fontWeight: 700, mb: 2 }}
          >
            About Blood Donated
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.8, textAlign: "justify" }}>
            Blood Donated is a voluntary blood donation platform that connects
            compassionate donors with patients in need. Our mission is to ensure
            that no life is lost due to lack of blood by making the donation
            process easy, safe, and impactful.
            <br /><br />
            We promote awareness, educate communities, and empower individuals to
            become regular blood donors. With every drop, you give someone a
            second chance at life.
            <strong> Be a hero—donate blood today.</strong>
          </Typography>
        </Box>

        {/* Follow Us */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: "#ffeb3b", fontWeight: 700, mb: 2 }}
          >
            Follow Us
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <IconButton
              href="https://www.facebook.com/vith.vath.2025/"
              target="_blank"
              sx={{
                color: "#fff",
                backgroundColor: "#3b5998",
                "&:hover": { backgroundColor: "#2d4373" },
              }}
            >
              <Facebook />
            </IconButton>
            <IconButton
              href="https://t.me/yourchannel"
              target="_blank"
              sx={{
                color: "#fff",
                backgroundColor: "#0088cc",
                "&:hover": { backgroundColor: "#006699" },
              }}
            >
              <Telegram />
            </IconButton>
          </Box>
        </Box>

        {/* Contact */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: "#ffeb3b", fontWeight: 700, mb: 2 }}
          >
            Contact
          </Typography>
          <Typography variant="body2">
            Email:{" "}
            <Link
              href="mailto:Vath.V211006@sis.hust.edu.vn"
              sx={{ color: "#fff", textDecoration: "underline" }}
            >
              Vath.V211006@sis.hust.edu.vn
            </Link>
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ backgroundColor: "#eee", mt: 4, mb: 2 }} />

      <Box sx={{ textAlign: "center" }}>
        <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
          &copy; {new Date().getFullYear()} Blood Donated. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}

export default Footer;
