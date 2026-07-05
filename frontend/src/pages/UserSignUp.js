import React, { useState } from "react";
import {
  Box, Paper, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, Link, useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff, PersonAdd, Bloodtype } from "@mui/icons-material";
import { useNavigate, Link as RouterLink, Navigate } from "react-router-dom";
import axios from "axios";
import { useUserAuth } from "../context/UserAuthContext";
import API_BASE from "../config";

const UserSignUp = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const navigate = useNavigate();
  const { login, isAuth } = useUserAuth();

  const [form, setForm] = useState({ fullName: "", email: "", password: "", confirm: "" });
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
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE}/api/user/register`, {
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      login(data.token, data.user);
      navigate("/messages");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: isDark ? "#121212" : "#f9f9f9",
        px: 2,
        py: 6,
      }}
    >
      <Paper elevation={6} sx={{ width: "100%", maxWidth: 440, borderRadius: 4, overflow: "hidden" }}>
        {/* Top banner */}
        <Box
          sx={{
            background: isDark
              ? "linear-gradient(135deg, #1a0000 0%, #2d0505 100%)"
              : "linear-gradient(135deg, #b71c1c 0%, #7f0000 100%)",
            py: 4,
            textAlign: "center",
          }}
        >
          <Bloodtype sx={{ fontSize: 44, color: "white", mb: 1 }} />
          <Typography variant="h5" fontWeight={800} color="white">
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5 }}>
            Join Blood Donated today
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ p: { xs: 3, sm: 4 } }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth label="Full Name" name="fullName"
            value={form.fullName} onChange={handleChange}
            required sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Email Address" name="email" type="email"
            value={form.email} onChange={handleChange}
            required sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Password" name="password"
            type={showPassword ? "text" : "password"}
            value={form.password} onChange={handleChange}
            required helperText="At least 6 characters"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth label="Confirm Password" name="confirm"
            type={showPassword ? "text" : "password"}
            value={form.confirm} onChange={handleChange}
            required sx={{ mb: 3 }}
          />

          <Button
            type="submit" fullWidth variant="contained" color="error"
            size="large" disabled={loading}
            startIcon={<PersonAdd />}
            sx={{ py: 1.4, fontWeight: 700, borderRadius: 3, boxShadow: "0 4px 14px rgba(183,28,28,0.35)" }}
          >
            {loading ? "Creating account…" : "Sign Up"}
          </Button>

          <Typography variant="body2" textAlign="center" mt={2.5} color="text.secondary">
            Already have an account?{" "}
            <Link component={RouterLink} to="/login" color="error" fontWeight={700}>
              Log in
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default UserSignUp;
