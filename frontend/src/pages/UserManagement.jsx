import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Select, MenuItem, Box, CircularProgress, Alert
} from '@mui/material';
import API from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch platform users. Verify admin access.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.put(`/admin/users/${userId}/role`, { role_name: newRole });
      fetchUsers(); // reload list
    } catch (err) {
      setError('Failed to update user role.');
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
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
        Platform User Management
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableRowCell sx={{ fontWeight: 'bold' }}>Full Name</TableRowCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Joined Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role Privilege</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell sx={{ fontWeight: 'medium' }}>{row.full_name}</TableCell>
                <TableCell>{row.email}</TableCell>
                <TableCell>
                  {new Date(row.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Select
                    size="small"
                    value={row.role}
                    onChange={(e) => handleRoleChange(row.id, e.target.value)}
                    sx={{ minWidth: 120, borderRadius: 2 }}
                  >
                    <MenuItem value="attendee">Attendee</MenuItem>
                    <MenuItem value="organizer">Organizer</MenuItem>
                    <MenuItem value="admin">Administrator</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

// Simple helper to avoid TableCell naming errors
const TableRowCell = ({ children, ...props }) => (
  <TableCell {...props}>{children}</TableCell>
);

export default UserManagement;
