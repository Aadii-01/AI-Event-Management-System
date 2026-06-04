import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Paper, TextField, Button, Box, Grid, CircularProgress, Alert,
  Divider, Card, CardContent, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import API from '../services/api';

const AIScheduleGenerator = () => {
  const { event_id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // AI Inputs
  const [eventType, setEventType] = useState('Technical Conference');
  const [numSessions, setNumSessions] = useState(6);
  const [numSpeakers, setNumSpeakers] = useState(3);
  const [durationDays, setDurationDays] = useState(2);
  const [breakPreferences, setBreakPreferences] = useState('1 hour lunch, 15 min coffee breaks');
  const [audienceType, setAudienceType] = useState('developers and architects');

  // Generated Schedule Timeline
  const [timeline, setTimeline] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Day1');

  // Manual Editing States
  const [openEditModal, setOpenEditModal] = useState(false);
  const [editingSessionIdx, setEditingSessionIdx] = useState(null);
  const [editSessionTime, setEditSessionTime] = useState('');
  const [editSessionTitle, setEditSessionTitle] = useState('');
  const [editSessionSpeaker, setEditSessionSpeaker] = useState('');
  const [editSessionVenue, setEditSessionVenue] = useState('');
  const [editSessionDesc, setEditSessionDesc] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await API.get(`/events/${event_id}`);
        setEvent(res.data);
        
        // Check if schedule already exists in DB
        try {
          const schedRes = await API.get(`/ai/schedule/${event_id}`);
          setTimeline(schedRes.data.timeline);
        } catch (sErr) {
          // No schedule generated yet
        }
      } catch (err) {
        setError('Failed to load event details.');
      } finally {
        setLoadingEvent(false);
      }
    };
    fetchEvent();
  }, [event_id]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    setGenerating(true);
    try {
      const res = await API.post(`/ai/generate-schedule/${event_id}`, {
        event_type: eventType,
        num_sessions: Number(numSessions),
        num_speakers: Number(numSpeakers),
        duration_days: Number(durationDays),
        break_preferences: breakPreferences,
        audience_type: audienceType
      });
      setTimeline(res.data.timeline);
      
      // Select first day by default
      const days = Object.keys(res.data.timeline).filter(k => k !== 'Recommendations');
      if (days.length > 0) {
        setSelectedDay(days[0]);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate schedule from AI provider.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditSessionClick = (index) => {
    const session = timeline[selectedDay][index];
    setEditingSessionIdx(index);
    setEditSessionTime(session.time || '');
    setEditSessionTitle(session.title || '');
    setEditSessionSpeaker(session.speaker || '');
    setEditSessionVenue(session.venue || '');
    setEditSessionDesc(session.description || '');
    setOpenEditModal(true);
  };

  const handleSaveEditedSession = () => {
    const updatedSessions = [...timeline[selectedDay]];
    updatedSessions[editingSessionIdx] = {
      time: editSessionTime,
      title: editSessionTitle,
      speaker: editSessionSpeaker,
      venue: editSessionVenue,
      description: editSessionDesc
    };

    setTimeline({
      ...timeline,
      [selectedDay]: updatedSessions
    });
    setOpenEditModal(false);
  };

  const handlePublishSchedule = async () => {
    setError('');
    setSuccessMsg('');
    setSaving(true);
    try {
      await API.put(`/ai/schedule/${event_id}`, {
        timeline: timeline
      });
      setSuccessMsg('Schedule saved, registered attendees have been notified via email!');
      setTimeout(() => {
        navigate('/organizer/events');
      }, 2500);
    } catch (err) {
      setError('Failed to save and publish schedule.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingEvent) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 64px)">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const daysList = timeline ? Object.keys(timeline).filter(key => key !== 'Recommendations') : [];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4, mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon color="primary" /> AI Schedule Generator: {event?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Generate a conference outline based on sessions, speakers, and timing constraints.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}

        {/* Generate Prompt Form */}
        {!timeline && (
          <Box component="form" onSubmit={handleGenerate}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Event Format / Type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  placeholder="e.g. Technical Conference, Creative Arts Workshop"
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Sessions"
                  value={numSessions}
                  onChange={(e) => setNumSessions(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Number of Speakers"
                  value={numSpeakers}
                  onChange={(e) => setNumSpeakers(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (Days)"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={9}>
                <TextField
                  fullWidth
                  label="Audience Type"
                  value={audienceType}
                  onChange={(e) => setAudienceType(e.target.value)}
                  placeholder="e.g. corporate executives, software students"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Break Preferences"
                  value={breakPreferences}
                  onChange={(e) => setBreakPreferences(e.target.value)}
                  placeholder="e.g. 1 hour lunch, 15 min coffee breaks"
                />
              </Grid>
            </Grid>

            <Box display="flex" justifyContent="flex-end" sx={{ mt: 4 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={generating}
                startIcon={generating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesomeIcon />}
                sx={{ borderRadius: 2.5, px: 4, textTransform: 'none', fontWeight: 'bold', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
              >
                {generating ? 'Generating Schedule...' : 'Generate Schedule'}
              </Button>
            </Box>
          </Box>
        )}

        {/* Display generated timeline and edits */}
        {timeline && (
          <Box>
            {/* Days Tabs Selection */}
            <Box display="flex" gap={2} sx={{ mb: 4, overflowX: 'auto', pb: 1 }}>
              {daysList.map((day) => (
                <Button
                  key={day}
                  variant={selectedDay === day ? 'contained' : 'outlined'}
                  onClick={() => setSelectedDay(day)}
                  sx={{ borderRadius: 3, textTransform: 'none', fontWeight: 'bold' }}
                >
                  {day.replace('Day', 'Day ')}
                </Button>
              ))}
            </Box>

            {/* List of Sessions for Selected Day */}
            <Box display="flex" flexDirection="column" gap={3}>
              {timeline[selectedDay]?.map((session, index) => (
                <Card key={index} variant="outlined" sx={{ borderRadius: 3, borderLeft: '4px solid #4f46e5' }}>
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
                      <Grid item xs={12} sm={7}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {session.title}
                        </Typography>
                        {session.speaker && session.speaker !== 'N/A' && (
                          <Typography variant="body2" sx={{ fontStyle: 'italic', mb: 1 }}>
                            Speaker: {session.speaker}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                          {session.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={2} display="flex" justifyContent="flex-end" alignItems="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditSessionClick(index)}
                          sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                          Edit
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>

            {/* Recommendations log */}
            {timeline.Recommendations && (
              <Box sx={{ mt: 4, bgcolor: '#f5f3ff', p: 3, borderRadius: 3, border: '1px solid #c084fc' }}>
                <Typography variant="subtitle2" fontWeight="bold" color="secondary.main" gutterBottom>
                  AI Recommendations:
                </Typography>
                <ul>
                  {timeline.Recommendations.map((rec, i) => (
                    <li key={i}>
                      <Typography variant="body2" color="text.secondary">{rec}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            <Box display="flex" justifyContent="space-between">
              <Button
                variant="outlined"
                onClick={() => setTimeline(null)}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold' }}
              >
                Regenerate AI Plan
              </Button>

              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handlePublishSchedule}
                disabled={saving}
                sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 'bold', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}
              >
                {saving ? 'Saving...' : 'Save & Publish Schedule'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Edit Session Modal */}
      <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Session Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            fullWidth
            label="Time Slot"
            value={editSessionTime}
            onChange={(e) => setEditSessionTime(e.target.value)}
          />
          <TextField
            fullWidth
            label="Session Title"
            value={editSessionTitle}
            onChange={(e) => setEditSessionTitle(e.target.value)}
          />
          <TextField
            fullWidth
            label="Speaker Name"
            value={editSessionSpeaker}
            onChange={(e) => setEditSessionSpeaker(e.target.value)}
          />
          <TextField
            fullWidth
            label="Room / Venue"
            value={editSessionVenue}
            onChange={(e) => setEditSessionVenue(e.target.value)}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Session Description"
            value={editSessionDesc}
            onChange={(e) => setEditSessionDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenEditModal(false)} color="secondary" sx={{ fontWeight: 'bold' }}>Cancel</Button>
          <Button onClick={handleSaveEditedSession} variant="contained" color="primary" sx={{ borderRadius: 2.5, px: 3, fontWeight: 'bold' }}>
            Save Session
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AIScheduleGenerator;
