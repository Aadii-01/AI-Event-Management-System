import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';

import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EventListing from './pages/EventListing';
import EventDetails from './pages/EventDetails';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import ManageEvents from './pages/ManageEvents';
import Registrations from './pages/Registrations';
import Analytics from './pages/Analytics';
import AIScheduleGenerator from './pages/AIScheduleGenerator';
import RegistrationsHistory from './pages/RegistrationsHistory';
import UserManagement from './pages/UserManagement';
import AIConfiguration from './pages/AIConfiguration';

// Premium Indigo/Teal theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#4f46e5', // Indigo
      light: '#818cf8',
      dark: '#3730a3',
    },
    secondary: {
      main: '#10b981', // Emerald
    },
    background: {
      default: '#f8fafc',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0,0,0,0.03)',
        },
      },
    },
  },
});

// Layout wrapper for dashboard views (with sidebar)
const DashboardLayout = ({ children }) => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box display="flex" flexGrow={1}>
        <Sidebar />
        <Box component="main" flexGrow={1} sx={{ bgcolor: '#f1f5f9', p: 3, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

// Layout wrapper for public views (no sidebar)
const PublicLayout = ({ children }) => {
  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <Navbar />
      <Box component="main" flexGrow={1} sx={{ bgcolor: '#ffffff' }}>
        {children}
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
            <Route path="/events" element={<PublicLayout><EventListing /></PublicLayout>} />
            <Route path="/events/:id" element={<PublicLayout><EventDetails /></PublicLayout>} />

            {/* Attendee Portal */}
            <Route
              path="/attendee/registrations"
              element={
                <PrivateRoute allowedRoles={['attendee', 'admin']}>
                  <DashboardLayout><RegistrationsHistory /></DashboardLayout>
                </PrivateRoute>
              }
            />

            {/* Organizer Portal */}
            <Route
              path="/organizer/dashboard"
              element={
                <PrivateRoute allowedRoles={['organizer', 'admin']}>
                  <DashboardLayout><Dashboard /></DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/events/new"
              element={
                <PrivateRoute allowedRoles={['organizer', 'admin']}>
                  <DashboardLayout><CreateEvent /></DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/events"
              element={
                <PrivateRoute allowedRoles={['organizer', 'admin']}>
                  <DashboardLayout><ManageEvents /></DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/events/:event_id/schedule"
              element={
                <PrivateRoute allowedRoles={['organizer', 'admin']}>
                  <DashboardLayout><AIScheduleGenerator /></DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/registrations"
              element={
                <PrivateRoute allowedRoles={['organizer', 'admin']}>
                  <DashboardLayout><Registrations /></DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/organizer/analytics"
              element={
                <PrivateRoute allowedRoles={['organizer', 'admin']}>
                  <DashboardLayout><Analytics /></DashboardLayout>
                </PrivateRoute>
              }
            />

            {/* Admin Portal */}
            <Route
              path="/admin/users"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <DashboardLayout><UserManagement /></DashboardLayout>
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <PrivateRoute allowedRoles={['admin']}>
                  <DashboardLayout><AIConfiguration /></DashboardLayout>
                </PrivateRoute>
              }
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
