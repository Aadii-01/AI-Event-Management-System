import React from 'react';
import { NavLink } from 'react-router-dom';
import { List, ListItemButton, ListItemIcon, ListItemText, Paper, Typography, Divider, Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const renderOrganizerLinks = () => (
    <>
      <Typography variant="caption" sx={{ px: 3, py: 1.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
        ORGANIZER DASHBOARD
      </Typography>
      <List component="nav" sx={{ px: 2 }}>
        <ListItemButton component={NavLink} to="/organizer/dashboard" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><DashboardIcon /></ListItemIcon>
          <ListItemText primary="Overview" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/organizer/events/new" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><AddCircleIcon /></ListItemIcon>
          <ListItemText primary="Create Event" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/organizer/events" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><ListAltIcon /></ListItemIcon>
          <ListItemText primary="Manage Events" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/organizer/registrations" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><PeopleIcon /></ListItemIcon>
          <ListItemText primary="Registrations" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/organizer/analytics" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><AssessmentIcon /></ListItemIcon>
          <ListItemText primary="Reports & Charts" />
        </ListItemButton>
      </List>
    </>
  );

  const renderAdminLinks = () => (
    <>
      <Typography variant="caption" sx={{ px: 3, py: 1.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
        ADMIN PORTAL
      </Typography>
      <List component="nav" sx={{ px: 2 }}>
        <ListItemButton component={NavLink} to="/admin/users" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><PeopleIcon /></ListItemIcon>
          <ListItemText primary="User Management" />
        </ListItemButton>

        <ListItemButton component={NavLink} to="/admin/config" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><SettingsSuggestIcon /></ListItemIcon>
          <ListItemText primary="AI Configuration" />
        </ListItemButton>
      </List>
    </>
  );

  const renderAttendeeLinks = () => (
    <>
      <Typography variant="caption" sx={{ px: 3, py: 1.5, display: 'block', color: 'text.secondary', fontWeight: 'bold' }}>
        ATTENDEE PORTAL
      </Typography>
      <List component="nav" sx={{ px: 2 }}>
        <ListItemButton component={NavLink} to="/attendee/registrations" style={({ isActive }) => ({
          backgroundColor: isActive ? 'rgba(79, 70, 229, 0.08)' : 'transparent',
          color: isActive ? '#4f46e5' : 'inherit',
          borderRadius: 8,
          marginBottom: 4
        })}>
          <ListItemIcon sx={{ color: 'inherit' }}><ConfirmationNumberIcon /></ListItemIcon>
          <ListItemText primary="My Tickets" />
        </ListItemButton>
      </List>
    </>
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: 260,
        minHeight: 'calc(100vh - 64px)',
        borderRight: '1px solid',
        borderColor: 'divider',
        borderRadius: 0,
        bgcolor: '#fafafa',
        py: 2
      }}
    >
      <Box sx={{ px: 3, pb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {user.full_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {user.email}
        </Typography>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {user.role === 'organizer' && renderOrganizerLinks()}
      {user.role === 'admin' && renderAdminLinks()}
      {user.role === 'attendee' && renderAttendeeLinks()}
    </Paper>
  );
};

export default Sidebar;
