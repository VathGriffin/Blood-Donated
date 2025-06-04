import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './admin/AdminLayout';

// Public Pages
import Home from './pages/Home';
import DonateBlood from './pages/DonateBlood';
import Contact from './pages/Contact';
import ThankYou from './pages/ThankYou';
import Appointment from './pages/Appointment';
import AppointmentConfirmed from './pages/AppointmentConfirmed';
import RequestBlood from './pages/RequestBlood';
import DonorList from './pages/DonorList';
import Team from './pages/Team';
import RequestThankYou from './pages/RequestThankYou';
import ThankYouContact from './pages/ThankYouContact';
import About from './pages/About';

// Admin Pages
import Dashboard from './admin/Dashboard';
import ManageDonors from './admin/ManageDonors';
import ManageRequests from './admin/ManageRequests';
import Inventory from './admin/Inventory';
import ManageContact from './admin/ManageContact';

function App() {
    return (
        <Router>
            <Routes>
                {/* Public Routes */}
                <Route element={<MainLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/donate" element={<DonateBlood />} />
                    <Route path="/donate/thank-you" element={<ThankYou />} />
                    <Route path="/appointment" element={<Appointment />} />
                    <Route path="/appointment/confirmed" element={<AppointmentConfirmed />} />
                    <Route path="/request" element={<RequestBlood />} />
                    <Route path="/donors" element={<DonorList />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/request/thank-you" element={<RequestThankYou />} />
                    <Route path="/contact/thank-you" element={<ThankYouContact />} />
                    <Route path="/about" element={<About />} />
                </Route>

                {/* Admin Routes */}
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<Dashboard />} />
                    <Route path="/admin/dashboard" element={<Dashboard />} />
                    <Route path="/admin/donors" element={<ManageDonors />} />
                    <Route path="/admin/requests" element={<ManageRequests />} />
                    <Route path="/admin/inventory" element={<Inventory />} />
                    <Route path="/admin/contacts" element={<ManageContact />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;
