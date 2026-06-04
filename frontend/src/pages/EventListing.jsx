import React, { useState, useEffect } from 'react';
import { Container, Typography, TextField, Grid, MenuItem, Box, CircularProgress, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import API from '../services/api';
import EventCard from '../components/EventCard';

const EventListing = () => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get('/events/categories');
        setCategories(res.data);
      } catch (err) {
        console.error("Failed fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        let url = '/events?status=published';
        if (categoryFilter) {
          url += `&category_id=${categoryFilter}`;
        }
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        const res = await API.get(url);
        setEvents(res.data);
      } catch (err) {
        console.error("Failed fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search, categoryFilter]);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Browse Upcoming Events
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find meetups, conferences, workshops, and panels matching your interests.
        </Typography>
      </Box>

      {/* Filter Section */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            placeholder="Search by event title or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            fullWidth
            label="Category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>
                {cat.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      </Grid>

      {/* Events Grid */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : events.length === 0 ? (
        <Box textAlign="center" py={8} sx={{ bgcolor: '#f8fafc', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">
            No events match your criteria.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={4}>
          {events.map((event) => (
            <Grid item xs={12} sm={6} md={4} key={event.id}>
              <EventCard event={event} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default EventListing;
