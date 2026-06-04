import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Avatar, Menu, MenuItem, Tooltip } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import EventIcon from '@mui/icons-material/Event';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
    navigate('/login');
  };

  const handleDashboardRedirect = () => {
    handleMenuClose();
    if (user.role === 'admin') {
      navigate('/admin/users');
    } else if (user.role === 'organizer') {
      navigate('/organizer/dashboard');
    } else {
      navigate('/attendee/registrations');
    }
  };

  return (
    <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', boxShadow: 3 }}>
      <Toolbar>
        <IconButton component={Link} to="/" edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }}>
          <EventIcon sx={{ fontSize: 30, color: '#a5b4fc' }} />
        </IconButton>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 'bold',
            letterSpacing: 1,
            background: 'linear-gradient(to right, #ffffff, #c7d2fe)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          EventAI Platform
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <Button component={Link} to="/events" color="inherit" sx={{ fontWeight: 'medium' }}>
            Browse Events
          </Button>

          {isAuthenticated ? (
            <>
              <Tooltip title="Profile Account">
                <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
                  <Avatar sx={{ bgcolor: '#4f46e5', fontWeight: 'bold' }}>
                    {user.full_name.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    boxShadow: '0px 5px 15px rgba(0,0,0,0.1)',
                    borderRadius: 2,
                    minWidth: 160,
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem disabled sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
                  Role: <b>{user.role.toUpperCase()}</b>
                </MenuItem>
                <MenuItem onClick={handleDashboardRedirect}>My Dashboard</MenuItem>
                <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
