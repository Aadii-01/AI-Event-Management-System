import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          console.error("Session restoration failed:", err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login/json', { email, password });
      localStorage.setItem('token', res.data.access_token);
      
      const userRes = await API.get('/auth/me');
      setUser(userRes.data);
      setLoading(false);
      return userRes.data;
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const register = async (fullName, email, password, roleName) => {
    setLoading(true);
    try {
      await API.post('/auth/register', {
        full_name: fullName,
        email: email,
        password: password,
        role_name: roleName
      });
      // Immediately log in user
      return await login(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
