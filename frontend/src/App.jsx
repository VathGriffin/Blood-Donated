import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CustomThemeProvider } from "./ThemeContext";
import CssBaseline from "@mui/material/CssBaseline";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { AuthProvider } from "./context/AuthContext";
import { UserAuthProvider } from "./context/UserAuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Layouts — loaded eagerly (tiny, always needed)
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./admin/AdminLayout";
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute";

// Public Pages — lazy loaded (each becomes its own JS chunk)
const Home = lazy(() => import("./pages/Home"));
const DonateBlood = lazy(() => import("./pages/DonateBlood"));
const Contact = lazy(() => import("./pages/Contact"));
const ThankYou = lazy(() => import("./pages/ThankYou"));
const RequestBlood = lazy(() => import("./pages/RequestBlood"));
const DonorList = lazy(() => import("./pages/DonorList"));
const Team = lazy(() => import("./pages/Team"));
const RequestThankYou = lazy(() => import("./pages/RequestThankYou"));
const About = lazy(() => import("./pages/About"));
const Appointment = lazy(() => import("./pages/Appointment"));
const AppointmentConfirmed = lazy(() => import("./pages/AppointmentConfirmed"));
const UserLogin = lazy(() => import("./pages/UserLogin"));
const UserSignUp = lazy(() => import("./pages/UserSignUp"));
const UserMessages = lazy(() => import("./pages/UserMessages"));
const Maps = lazy(() => import("./pages/Maps"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin Pages — lazy loaded
const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const Dashboard = lazy(() => import("./admin/Dashboard"));
const ManageDonors = lazy(() => import("./admin/ManageDonors"));
const ManageRequests = lazy(() => import("./admin/ManageRequests"));
const Inventory = lazy(() => import("./admin/Inventory"));
const ManageContact = lazy(() => import("./admin/ManageContact"));
const ManageAppointments = lazy(() => import("./admin/ManageAppointments"));

const PageLoader = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress sx={{ color: "#b71c1c" }} />
  </Box>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID || ""}>
      <CustomThemeProvider>
        <CssBaseline />
        <AuthProvider>
          <UserAuthProvider>
            <Router>
              <Suspense fallback={<PageLoader />}>
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
                    <Route path="/about" element={<About />} />
                    <Route path="/appointment" element={<Appointment />} />
                    <Route path="/appointment/confirmed" element={<AppointmentConfirmed />} />
                    <Route path="/messages" element={<UserMessages />} />
                    <Route path="/map" element={<Maps />} />
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
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </Router>
          </UserAuthProvider>
        </AuthProvider>
      </CustomThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
