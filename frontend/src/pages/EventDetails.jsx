import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Grid, Paper, Button, Box, Divider, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, MenuItem, Card, CardContent
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking states
  const [openBookModal, setOpenBookModal] = useState(false);
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Mock checkout card details
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('123');

  useEffect(() => {
    const fetchEventAndSchedule = async () => {
      setLoading(true);
      try {
        const eventRes = await API.get(`/events/${id}`);
        setEvent(eventRes.data);
        
        try {
          const scheduleRes = await API.get(`/ai/schedule/${id}`);
          setSchedule(scheduleRes.data.timeline);
        } catch (sErr) {
          // Schedule might not be generated yet, which is fine
          setSchedule(null);
        }
      } catch (err) {
        setError('Failed to fetch event details.');
      } finally {
        setLoading(false);
      }
    };
    fetchEventAndSchedule();
  }, [id]);

  const handleBookClick = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (event.ticket_types && event.ticket_types.length > 0) {
      setSelectedTicketType(event.ticket_types[0].name);
    }
    setOpenBookModal(true);
  };

  const getTicketPrice = () => {
    const selected = event?.ticket_types.find(t => t.name === selectedTicketType);
    return selected ? selected.price : 0;
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    setBookingError('');
    try {
      // 1. Create Registration (which auto-issues ticket in database)
      const regRes = await API.post(`/events/${event.id}/register`, {
        ticket_type: selectedTicketType
      });
      
      const price = getTicketPrice();
      if (price > 0) {
        // 2. Perform Mock Purchase (since ticket is paid)
        // Find issued ticket from user active list or backend return
        // Fetch tickets list to identify the newly created ticket ID
        const ticketRes = await API.get('/tickets/my');
        const activeTickets = ticketRes.data;
        const newTicket = activeTickets.find(t => t.event_id === event.id && t.status === 'active');
        
        if (newTicket) {
          await API.post('/tickets/purchase', {
            ticket_id: newTicket.id,
            amount: price,
            transaction_id: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase()
          });
        }
      }

      setBookingSuccess(true);
      setTimeout(() => {
        setOpenBookModal(false);
        setBookingSuccess(false);
        navigate('/attendee/registrations');
      }, 2000);
    } catch (err) {
      setBookingError(err.response?.data?.detail || 'Booking failed. Try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">{error || 'Event not found.'}</Alert>
      </Container>
    );
  }

  const startDate = new Date(event.start_date).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const startTime = new Date(event.start_date).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Grid container spacing={5}>
        {/* Left Side: Header & description */}
        <Grid item xs={12} md={8}>
          <Box
            component="img"
            src={event.banner_image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=60'}
            alt={event.title}
            sx={{
              width: '100%',
              height: 320,
              objectFit: 'cover',
              borderRadius: 4,
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
              mb: 4
            }}
          />

          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            {event.title}
          </Typography>

          <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            About Event
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ lineHeight: 1.8 }}>
            {event.description}
          </Typography>

          {/* AI Schedule Display */}
          {schedule && (
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" fontWeight="bold" color="primary.main" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Event Schedule Timeline
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {Object.keys(schedule).map((dayKey) => {
                if (dayKey === 'Recommendations') return null;
                return (
                  <Box key={dayKey} sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="bold" color="text.primary" sx={{ mb: 2, bgcolor: '#f1f5f9', px: 2, py: 0.8, borderRadius: 2, width: 'fit-content' }}>
                      {dayKey.replace('Day', 'Day ')}
                    </Typography>
                    
                    {schedule[dayKey].map((session, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2, borderRadius: 3, borderLeft: '4px solid #4f46e5' }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={3}>
                              <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
                                {session.time}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Venue: {session.venue}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={9}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {session.title}
                              </Typography>
                              {session.speaker && session.speaker !== 'N/A' && (
                                <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', mb: 1 }}>
                                  Speaker: {session.speaker}
                                </Typography>
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {session.description}
                              </Typography>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                );
              })}
            </Box>
          )}
        </Grid>

        {/* Right Side: Sidebar details card */}
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 4, position: 'sticky', top: 96, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Typography variant="h5" fontWeight="bold">
              Event Details
            </Typography>
            <Divider />

            <Box display="flex" flexDirection="column" gap={2}>
              <Box display="flex" gap={2}>
                <CalendarMonthIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Date & Time</Typography>
                  <Typography variant="body2" color="text.secondary">{startDate}</Typography>
                  <Typography variant="body2" color="text.secondary">{startTime}</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <LocationOnIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Location</Typography>
                  <Typography variant="body2" color="text.secondary">{event.venue}</Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <PeopleIcon color="action" />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Capacity</Typography>
                  <Typography variant="body2" color="text.secondary">{event.capacity} total seats available</Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Typography variant="subtitle1" fontWeight="bold">
              Available Tickets
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              {event.ticket_types.map((type, idx) => (
                <Box key={idx} display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: '#f8fafc', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight="medium">{type.name}</Typography>
                  <Typography variant="body2" color="primary.main" fontWeight="bold">
                    {type.price === 0 ? 'Free' : `$${type.price.toFixed(2)}`}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={handleBookClick}
              fullWidth
              sx={{ py: 1.5, borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}
            >
              Get Tickets
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* Checkout Booking Modal */}
      <Dialog open={openBookModal} onClose={() => setOpenBookModal(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Register for Event</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {bookingSuccess ? (
            <Box textAlign="center" py={4} display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60 }} />
              <Typography variant="h6" fontWeight="bold">Registration Confirmed!</Typography>
              <Typography variant="body2" color="text.secondary">Your receipt and ticket have been emailed.</Typography>
            </Box>
          ) : (
            <>
              {bookingError && <Alert severity="error">{bookingError}</Alert>}

              <TextField
                select
                fullWidth
                label="Select Ticket Type"
                value={selectedTicketType}
                onChange={(e) => setSelectedTicketType(e.target.value)}
              >
                {event.ticket_types.map((type, idx) => (
                  <MenuItem key={idx} value={type.name}>
                    {type.name} - {type.price === 0 ? 'Free' : `$${type.price.toFixed(2)}`}
                  </MenuItem>
                ))}
              </TextField>

              {getTicketPrice() > 0 && (
                <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" color="text.primary">
                    Secure Payment Details (Mock Checkout)
                  </Typography>
                  <TextField
                    fullWidth
                    label="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                  <Box display="flex" gap={2}>
                    <TextField
                      label="Expiry Date"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                    />
                    <TextField
                      label="CVV"
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                    />
                  </Box>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        {!bookingSuccess && (
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setOpenBookModal(false)} color="secondary" sx={{ fontWeight: 'bold' }}>Cancel</Button>
            <Button
              onClick={handleConfirmBooking}
              variant="contained"
              disabled={bookingLoading}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2.5, px: 3, fontWeight: 'bold' }}
            >
              {bookingLoading ? <CircularProgress size={20} color="inherit" /> : 'Confirm booking'}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Container>
  );
};

export default EventDetails;
