import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, TextField, Button, Box, MenuItem, Alert, CircularProgress, Grid } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import API from '../services/api';

const AIConfiguration = () => {
  const [provider, setProvider] = useState('groq');
  const [groqKey, setGroqKey] = useState('');
  const [hfKey, setHfKey] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await API.get('/admin/settings');
      setProvider(res.data.primary_provider || 'groq');
      setGroqKey(res.data.groq_api_key || '');
      setHfKey(res.data.hf_api_key || '');
    } catch (err) {
      setError('Failed to fetch AI configuration. Verify admin access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await API.put('/admin/settings', {
        primary_provider: provider,
        groq_api_key: groqKey,
        hf_api_key: hfKey
      });
      setSuccess('AI settings saved successfully.');
    } catch (err) {
      setError('Failed to update AI settings.');
    } finally {
      setSaving(false);
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
      <Paper elevation={3} sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          AI Configuration Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Toggle the primary LLM provider and edit developer API keys.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Primary AI Provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                <MenuItem value="groq">Groq API (Primary - Llama 3)</MenuItem>
                <MenuItem value="huggingface">Hugging Face Inference API (Fallback - Falcon)</MenuItem>
                <MenuItem value="mock">Local Simulator (No keys required)</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Groq API Key"
                helperText={
                  <span>
                    Obtain a key from the{' '}
                    <a href="https://console.groq.com" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
                      Groq Console
                    </a>
                  </span>
                }
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                type="password"
                label="Hugging Face User Access Token"
                helperText={
                  <span>
                    Obtain a token from{' '}
                    <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontWeight: 'bold' }}>
                      Hugging Face Settings
                    </a>
                  </span>
                }
                value={hfKey}
                onChange={(e) => setHfKey(e.target.value)}
              />
            </Grid>
          </Grid>

          <Box display="flex" justifyContent="flex-end" sx={{ mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={<SaveIcon />}
              sx={{ borderRadius: 2.5, px: 4, textTransform: 'none', fontWeight: 'bold', bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
            >
              {saving ? 'Saving...' : 'Save Config'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIConfiguration;
