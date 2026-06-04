import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Grid, Card, CardContent, Button, Chip, Box, CircularProgress, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import API from '../services/api';

const RegistrationsHistory = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await API.get('/tickets/my');
      setTickets(res.data);
    } catch (err) {
      setError('Failed to fetch ticket history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleDownloadPDF = (ticketId) => {
    // Open the PDF download link directly in a new tab or trigger a download
    // Axios request with responseType 'blob' is safest, or window.open
    const token = localStorage.getItem('token');
    const downloadUrl = `http://localhost:8000/api/tickets/${ticketId}/pdf`;
    
    // We can fetch via Axios and trigger save to verify authorization headers
    API.get(`/tickets/${ticketId}/pdf`, { responseType: 'blob' })
      .then((response) => {
        const file = new Blob([response.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = fileURL;
        link.setAttribute('download', `ticket_${ticketId.slice(0, 8)}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => {
        console.error("PDF Download failed:", err);
      });
  };

  const handleCancelRegistration = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel this registration? You will lose access to your ticket.')) return;
    try {
      await API.put(`/registrations/${regId}/cancel`);
      fetchTickets(); // reload
    } catch (err) {
      console.error("Cancellation failed:", err);
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        My Registered Tickets
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {tickets.length === 0 ? (
        <Paper elevation={1} sx={{ p: 6, textAlign: 'center', borderRadius: 4 }}>
          <Typography variant="h6" color="text.secondary">
            You haven't registered for any events yet.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {tickets.map((ticket) => (
            <Grid item xs={12} key={ticket.id}>
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', position: 'relative' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {ticket.event_title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        Date: {new Date(ticket.event_start_date).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Venue: {ticket.event_venue}
                      </Typography>
                      <Box display="flex" gap={2} sx={{ mt: 1.5 }}>
                        <Typography variant="body2">
                          Type: <b>{ticket.ticket_type.toUpperCase()}</b>
                        </Typography>
                        <Typography variant="body2">
                          Price: <b>{Number(ticket.price) === 0 ? 'Free' : `$${Number(ticket.price).toFixed(2)}`}</b>
                        </Typography>
                      </Box>
                    </Box>

                    <Box display="flex" flexDirection="column" alignItems="flex-end" gap={1.5}>
                      <Chip
                        label={ticket.status.toUpperCase()}
                        color={ticket.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                      
                      {ticket.status === 'active' && (
                        <Box display="flex" gap={1}>
                          <Button
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={() => handleDownloadPDF(ticket.id)}
                            sx={{ textTransform: 'none', borderRadius: 2 }}
                          >
                            PDF
                          </Button>
                          <Button
                            variant="text"
                            color="error"
                            startIcon={<CancelIcon />}
                            onClick={() => handleCancelRegistration(ticket.registration_id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default RegistrationsHistory;
