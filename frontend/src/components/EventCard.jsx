import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';

const EventCard = ({ event }) => {
  const startDate = new Date(event.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const getCheapestPrice = () => {
    if (!event.ticket_types || event.ticket_types.length === 0) return 'Free';
    const prices = event.ticket_types.map((t) => t.price);
    const minPrice = Math.min(...prices);
    return minPrice === 0 ? 'Free' : `$${minPrice.toFixed(2)}+`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        },
      }}
    >
      <CardMedia
        component="img"
        height="180"
        image={event.banner_image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&auto=format&fit=crop&q=60'}
        alt={event.title}
        sx={{ filter: 'brightness(0.95)' }}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Chip
            label={event.status === 'published' ? 'Published' : 'Draft'}
            size="small"
            color={event.status === 'published' ? 'success' : 'warning'}
            variant="outlined"
            sx={{ fontWeight: 'bold' }}
          />
          <Typography variant="subtitle2" color="primary.main" fontWeight="bold">
            {getCheapestPrice()}
          </Typography>
        </Box>

        <Typography variant="h6" component="h2" fontWeight="bold" noWrap>
          {event.title}
        </Typography>

        <Box display="flex" flexDirection="column" gap={0.5} sx={{ color: 'text.secondary' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarMonthIcon fontSize="small" color="disabled" />
            <Typography variant="body2">{startDate}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationOnIcon fontSize="small" color="disabled" />
            <Typography variant="body2" noWrap>{event.venue}</Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LocalActivityIcon fontSize="small" color="disabled" />
            <Typography variant="body2">Capacity: {event.capacity}</Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mt: 0.5,
            mb: 1.5,
          }}
        >
          {event.description}
        </Typography>

        <Box sx={{ mt: 'auto' }}>
          <Button
            component={Link}
            to={`/events/${event.id}`}
            variant="outlined"
            fullWidth
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;
