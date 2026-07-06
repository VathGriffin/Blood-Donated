import React, { useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, Link, useTheme, Chip,
} from "@mui/material";
import { Visibility, VisibilityOff, Login, Bloodtype } from "@mui/icons-material";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FavoriteIcon from "@mui/icons-material/Favorite";
import axios from "axios";
import { useUserAuth } from "../context/UserAuthContext";
import API_BASE from "../config";
import SocialButtons from "../components/SocialButtons";

const SIDE_IMG =
  "https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1200&q=80";

const features = [
  "Connect with 2,400+ verified blood donors",
  "Request blood with real-time matching",
  "Book donation appointments online",
  "Chat directly with our support team",
];

const UserLogin = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { login, isAuth } = useUserAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuth) return <Navigate to="/messages" replace />;

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/login`, form);
      login(data.token, data.user);
      navigate("/messages");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", backgroundColor: isDark ? "#121212" : "#f4f4f4" }}>

      {/* ── Left Photo Panel ─────────────────────────────────────────────── */}
      <Box sx={{
        display: { xs: "none", md: "flex" },
        flex: "0 0 45%",
        position: "relative",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        px: 7,
        backgroundImage: `url('${SIDE_IMG}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        "&::before": {
          content: '""', position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(70,0,0,0.93) 0%, rgba(183,28,28,0.85) 100%)",
        },
      }}>
        <Box sx={{ position: "relative", zIndex: 1 }}>
          {/* Brand */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
            <FavoriteIcon sx={{ color: "#ffcdd2", fontSize: 32 }} />
            <Typography variant="h5" fontWeight={900} color="white" letterSpacing="-0.02em">
              Blood Donated
            </Typography>
          </Box>

          <Chip label="Welcome Back" size="small"
            sx={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white", fontWeight: 700, mb: 3, backdropFilter: "blur(4px)" }} />

          <Typography variant="h3" fontWeight={800} color="white" sx={{ lineHeight: 1.15, mb: 2, fontSize: "2.2rem" }}>
            Saving Lives,<br />One Drop at a Time
          </Typography>
          <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.8)", mb: 5, lineHeight: 1.8, maxWidth: 340 }}>
            Log in to access your donor profile, track requests, and connect with our blood donation network across Cambodia.
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}>
            {features.map((f, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <CheckCircleIcon sx={{ color: "#ffcdd2", fontSize: 18, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>{f}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 6, pt: 4, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
              A capstone project by ITC Cambodia · Data Science 4th Year
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Right Form Panel ─────────────────────────────────────────────── */}
      <Box sx={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        px: { xs: 2, sm: 4, md: 6 }, py: 6,
      }}>
        <Box sx={{ width: "100%", maxWidth: 420 }}>
          {/* Mobile brand */}
          <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 1, mb: 4, justifyContent: "center" }}>
            <FavoriteIcon sx={{ color: "#b71c1c", fontSize: 26 }} />
            <Typography variant="h6" fontWeight={900} color="error.main">Blood Donated</Typography>
          </Box>

          <Paper elevation={0} sx={{
            borderRadius: 4, overflow: "hidden",
            border: `1px solid ${isDark ? "#2a2a2a" : "#efefef"}`,
            boxShadow: isDark ? "none" : "0 8px 40px rgba(0,0,0,0.10)",
          }}>
            {/* Card header */}
            <Box sx={{
              px: 4, py: 3.5,
              background: "linear-gradient(135deg, #7f0000 0%, #b71c1c 100%)",
              display: "flex", alignItems: "center", gap: 1.5,
            }}>
              <Bloodtype sx={{ color: "white", fontSize: 28 }} />
              <Box>
                <Typography variant="h6" fontWeight={800} color="white" sx={{ lineHeight: 1.2 }}>Welcome Back</Typography>
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>Log in to your account</Typography>
              </Box>
            </Box>

            <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, sm: 4 } }}>
              {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

              <TextField
                fullWidth label="Email Address" name="email" type="email"
                value={form.email} onChange={handleChange} required
                sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />
              <TextField
                fullWidth label="Password" name="password"
                type={showPassword ? "text" : "password"}
                value={form.password} onChange={handleChange} required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3, "& .MuiOutlinedInput-root": { borderRadius: 2.5 } }}
              />

              <Button
                type="submit" fullWidth variant="contained" color="error"
                size="large" disabled={loading} startIcon={<Login />}
                sx={{
                  py: 1.5, fontWeight: 700, fontSize: "1rem", borderRadius: 3,
                  background: "linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%)",
                  boxShadow: "0 6px 20px rgba(183,28,28,0.4)",
                  "&:hover": { boxShadow: "0 8px 28px rgba(183,28,28,0.55)", transform: "translateY(-1px)" },
                  "&.Mui-disabled": { background: isDark ? "#2a2a2a" : "#e0e0e0" },
                  transition: "all 0.25s",
                }}
              >
                {loading ? "Logging in…" : "Log In"}
              </Button>

              <Typography variant="body2" textAlign="center" mt={2.5} color="text.secondary">
                Don't have an account?{" "}
                <Link component={RouterLink} to="/signup" color="error" fontWeight={700}>Sign up</Link>
              </Typography>

              <SocialButtons onError={(msg) => setError(msg)} />
            </Box>
          </Paper>
        </Box>
      </Box>

    </Box>
  );
};

export default UserLogin;
