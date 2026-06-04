import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Typography, Button, Box, Grid, CircularProgress } from '@mui/material';
import API from '../services/api';
import EventCard from '../components/EventCard';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ShieldIcon from '@mui/icons-material/Shield';

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events?status=published');
        setEvents(res.data.slice(0, 3)); // show top 3 published events
      } catch (err) {
        console.error("Failed fetching events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
          color: '#ffffff',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="md">
          <Box display="inline-flex" alignItems="center" gap={1} sx={{ bgcolor: 'rgba(255,255,255,0.08)', px: 2, py: 0.5, borderRadius: 5, mb: 3 }}>
            <AutoAwesomeIcon sx={{ color: '#a5b4fc', fontSize: '0.95rem' }} />
            <Typography variant="caption" sx={{ color: '#c7d2fe', fontWeight: 'bold', letterSpacing: 1 }}>
              AI SCHEDULING GENERATOR & ANALYTICS
            </Typography>
          </Box>
          <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '2.5rem', md: '4rem' } }}>
            AI-Powered Event Management
          </Typography>
          <Typography variant="h5" sx={{ color: '#94a3b8', mb: 4, fontWeight: 'normal', lineHeight: 1.6 }}>
            Create events, sell tickets, manage registries, and instantly generate complete schedules and insight metrics using Groq & Hugging Face.
          </Typography>
          <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap">
            <Button
              component={Link}
              to="/events"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#4f46e5',
                '&:hover': { bgcolor: '#4338ca' },
                borderRadius: 3,
                px: 4,
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Browse Events
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#6366f1',
                color: '#c7d2fe',
                '&:hover': { borderColor: '#4f46e5', bgcolor: 'rgba(99,102,241,0.08)' },
                borderRadius: 3,
                px: 4,
                textTransform: 'none',
                fontWeight: 'bold',
              }}
            >
              Create Account
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Highlights Grid */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" component="h2" fontWeight="bold" textAlign="center" gutterBottom sx={{ mb: 6 }}>
          Platform Highlights
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" sx={{ px: 2 }}>
              <AutoAwesomeIcon sx={{ fontSize: 48, color: '#4f46e5', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                AI Schedule Generator
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Input event type, speaker numbers, and preferences. Get detailed multi-day schedules in seconds.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" sx={{ px: 2 }}>
              <RocketLaunchIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Smart Event Insights
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Receive attendance forecasts, category tags suggestions, and target audience recommendations.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box textAlign="center" sx={{ px: 2 }}>
              <ShieldIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Secure JWT & QR Tickets
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Securely claim free/paid ticket types. Instant email delivery, downloadable receipts, and verification barcodes.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Featured Events */}
      <Box sx={{ bgcolor: '#f8fafc', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom sx={{ mb: 4 }}>
            Featured Upcoming Events
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress color="primary" />
            </Box>
          ) : events.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No events found. Stay tuned for updates!
            </Typography>
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
      </Box>
    </Box>
  );
};

export default Home;
