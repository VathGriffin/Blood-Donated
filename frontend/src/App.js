import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CustomThemeProvider } from "./ThemeContext";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./context/AuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./admin/AdminLayout";

// Public Pages
import Home from "./pages/Home";
import DonateBlood from "./pages/DonateBlood";
import Contact from "./pages/Contact";
import ThankYou from "./pages/ThankYou";
import RequestBlood from "./pages/RequestBlood";
import DonorList from "./pages/DonorList";
import Team from "./pages/Team";
import RequestThankYou from "./pages/RequestThankYou";
import ThankYouContact from "./pages/ThankYouContact";
import About from "./pages/About";
import Appointment from "./pages/Appointment";
import AppointmentConfirmed from "./pages/AppointmentConfirmed";
import UserLogin from "./pages/UserLogin";
import UserSignUp from "./pages/UserSignUp";
import UserMessages from "./pages/UserMessages";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./admin/AdminLogin";
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute";
import Dashboard from "./admin/Dashboard";
import ManageDonors from "./admin/ManageDonors";
import ManageRequests from "./admin/ManageRequests";
import Inventory from "./admin/Inventory";
import ManageContact from "./admin/ManageContact";
import ManageAppointments from "./admin/ManageAppointments";
import AdminMessages from "./admin/AdminMessages";

function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <UserAuthProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/donate" element={<DonateBlood />} />
                <Route path="/donate/thank-you" element={<ThankYou />} />
                <Route path="/request" element={<RequestBlood />} />
                <Route path="/donors" element={<DonorList />} />
                <Route path="/team" element={<Team />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/request/thank-you" element={<RequestThankYou />} />
                <Route path="/contact/thank-you" element={<ThankYouContact />} />
                <Route path="/about" element={<About />} />
                <Route path="/appointment" element={<Appointment />} />
                <Route path="/appointment/confirmed" element={<AppointmentConfirmed />} />
                <Route path="/messages" element={<UserMessages />} />
                <Route path="/login" element={<UserLogin />} />
                <Route path="/signup" element={<UserSignUp />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />

              {/* Admin Login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Protected Admin Routes */}
              <Route element={<ProtectedAdminRoute />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Dashboard />} />
                  <Route path="/admin/dashboard" element={<Dashboard />} />
                  <Route path="/admin/donors" element={<ManageDonors />} />
                  <Route path="/admin/requests" element={<ManageRequests />} />
                  <Route path="/admin/inventory" element={<Inventory />} />
                  <Route path="/admin/contacts" element={<ManageContact />} />
                  <Route path="/admin/appointments" element={<ManageAppointments />} />
                  <Route path="/admin/messages" element={<AdminMessages />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </UserAuthProvider>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
