import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, TextField, Button, Box, Paper, Grid, MenuItem, Alert, Divider, IconButton, List, ListItem, ListItemText } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import API from '../services/api';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venue, setVenue] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [bannerImage, setBannerImage] = useState('');

  // Ticket types handling
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: 0.0, capacity: 100 }
  ]);
  const [newTicketName, setNewTicketName] = useState('');
  const [newTicketPrice, setNewTicketPrice] = useState(0);
  const [newTicketCapacity, setNewTicketCapacity] = useState(50);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/events/categories');
        setCategories(res.data);
        if (res.data.length > 0) {
          setCategoryId(res.data[0].id);
        }
      } catch (err) {
        console.error("Failed fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleAddTicketType = () => {
    if (!newTicketName.trim()) return;
    setTicketTypes([
      ...ticketTypes,
      { name: newTicketName, price: Number(newTicketPrice), capacity: Number(newTicketCapacity) }
    ]);
    setNewTicketName('');
    setNewTicketPrice(0);
    setNewTicketCapacity(50);
  };

  const handleRemoveTicketType = (index) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validations
    if (new Date(startDate) >= new Date(endDate)) {
      setError('Event end date must be after the start date.');
      return;
    }

    if (ticketTypes.length === 0) {
      setError('Please add at least one ticket type.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        category_id: categoryId,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        venue,
        capacity: Number(capacity),
        banner_image: bannerImage || null,
        ticket_types: ticketTypes
      };

      const res = await API.post('/events/', payload);
      // Immediately redirect to generating schedule for this event!
      navigate(`/organizer/events/${res.data.id}/schedule`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create event. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Create New Event
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Publish your event and leverage AI scheduling capabilities.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Event Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Event Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                required
                fullWidth
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Total Capacity */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="Total Capacity"
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </Grid>

            {/* Start Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="datetime-local"
                label="Start Date & Time"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>

            {/* End Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="datetime-local"
                label="End Date & Time"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>

            {/* Venue */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Venue Address / Location"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </Grid>

            {/* Banner Image */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Banner Image URL"
                placeholder="https://example.com/banner.jpg"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          {/* Ticket types configuration */}
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Configure Ticket Types
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create free or paid registration plans. Add at least one ticket category.
          </Typography>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 3, bgcolor: '#fafafa' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  label="Ticket Category (e.g. VIP, General)"
                  value={newTicketName}
                  onChange={(e) => setNewTicketName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Price ($)"
                  value={newTicketPrice}
                  onChange={(e) => setNewTicketPrice(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={newTicketCapacity}
                  onChange={(e) => setNewTicketCapacity(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleAddTicketType}
                  sx={{ py: 1.5, textTransform: 'none', fontWeight: 'bold' }}
                >
                  Add
                </Button>
              </Grid>
            </Grid>

            {ticketTypes.length > 0 && (
              <List sx={{ mt: 2, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                {ticketTypes.map((ticket, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveTicketType(index)}>
                        <DeleteIcon color="error" />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={ticket.name}
                      secondary={`Price: $${ticket.price.toFixed(2)} | Quantity: ${ticket.capacity}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="outlined"
              onClick={() => navigate('/organizer/events')}
              sx={{ px: 4, borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ px: 4, borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
            >
              {loading ? 'Creating...' : 'Create and schedule event'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateEvent;
