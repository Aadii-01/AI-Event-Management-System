import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Paper, Box, CircularProgress, Card, CardContent, Divider, Button } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import StatCard from '../components/StatCard';
import API from '../services/api';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Link } from 'react-router-dom';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await API.get('/analytics/dashboard');
        setData(res.data);
      } catch (err) {
        console.error("Failed fetching dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!data) return <Typography>No data available.</Typography>;

  const { metrics, registrations_by_day, ticket_type_distribution, top_selling_events } = data;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          Organizer Dashboard
        </Typography>
        <Button
          component={Link}
          to="/organizer/events/new"
          variant="contained"
          startIcon={<EventIcon />}
          sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold' }}
        >
          Create Event
        </Button>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Events"
            value={metrics.total_events}
            icon={<EventIcon />}
            color="#4f46e5"
            subtitle={`Active: ${metrics.active_events} | Upcoming: ${metrics.upcoming_events}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Registrations"
            value={metrics.total_registrations}
            icon={<PeopleIcon />}
            color="#10b981"
            subtitle={`Avg. Conversion Rate: ${metrics.conversion_rate}%`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Ticket Revenue"
            value={`$${metrics.total_revenue.toFixed(2)}`}
            icon={<AttachMoneyIcon />}
            color="#f59e0b"
            subtitle="Gross sales generated"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="AI Schedules Generated"
            value={metrics.schedule_generations}
            icon={<AutoAwesomeIcon />}
            color="#8b5cf6"
            subtitle={`Forecast Accuracy: ${metrics.forecast_accuracy}%`}
          />
        </Grid>
      </Grid>

      {/* Charts Grid */}
      <Grid container spacing={4} sx={{ mb: 4 }}>
        {/* Registrations Area Chart */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Registrations Over Time (Last 7 Days)
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={registrations_by_day}>
                  <defs>
                    <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" name="Registrations" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRegs)" />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Ticket Type Distribution (Pie Chart) */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Ticket Types Sold
            </Typography>
            <Box sx={{ height: 300, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
              {ticket_type_distribution.length === 0 ? (
                <Typography variant="body2" color="text.secondary">No tickets sold yet</Typography>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={ticket_type_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {ticket_type_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend labels */}
                  <Box display="flex" flexWrap="wrap" gap={1.5} justifyContent="center" sx={{ mt: 1 }}>
                    {ticket_type_distribution.map((entry, index) => (
                      <Box key={index} display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: COLORS[index % COLORS.length] }} />
                        <Typography variant="caption" color="text.secondary">
                          {entry.name} ({entry.value})
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Top Selling Events (Bar Chart) */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Top Selling Events
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              {top_selling_events.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={8}>No sales data available</Typography>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top_selling_events}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tickets" name="Tickets Issued" fill="#4f46e5" />
                    <Bar dataKey="revenue" name="Revenue ($)" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
