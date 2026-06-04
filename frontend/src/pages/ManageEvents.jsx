import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, IconButton, Box, Chip, CircularProgress, Alert, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import API from '../services/api';

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvents = async () => {
    try {
      const res = await API.get('/events');
      setEvents(res.data);
    } catch (err) {
      setError('Failed to fetch events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleToggleStatus = async (event) => {
    try {
      const newStatus = event.status === 'published' ? 'draft' : 'published';
      await API.put(`/events/${event.id}`, { status: newStatus });
      fetchEvents();
    } catch (err) {
      console.error("Failed toggling status:", err);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This action is irreversible.')) return;
    try {
      await API.delete(`/events/${id}`);
      fetchEvents();
    } catch (err) {
      console.error("Failed deleting event:", err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Manage Events
        </Typography>
        <Button
          component={Link}
          to="/organizer/events/new"
          variant="contained"
          sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold' }}
        >
          Create Event
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {events.length === 0 ? (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No events created yet.
          </Typography>
          <Button
            component={Link}
            to="/organizer/events/new"
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold' }}
          >
            Create Your First Event
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Event Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Venue</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id} hover>
                  <TableCell sx={{ fontWeight: 'medium' }}>{event.title}</TableCell>
                  <TableCell>{event.venue}</TableCell>
                  <TableCell>
                    {new Date(event.start_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{event.capacity}</TableCell>
                  <TableCell>
                    <Chip
                      label={event.status.toUpperCase()}
                      size="small"
                      color={event.status === 'published' ? 'success' : 'default'}
                      onClick={() => handleToggleStatus(event)}
                      sx={{ fontWeight: 'bold', cursor: 'pointer' }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box display="flex" justifyContent="center" gap={1}>
                      <Tooltip title="View Public Page">
                        <IconButton component={Link} to={`/events/${event.id}`}>
                          <VisibilityIcon color="primary" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate AI Schedule">
                        <IconButton component={Link} to={`/organizer/events/${event.id}/schedule`}>
                          <AutoAwesomeIcon sx={{ color: '#8b5cf6' }} />
                        </IconButton>
                      </Tooltip>
                      <IconButton onClick={() => handleDeleteEvent(event.id)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default ManageEvents;
