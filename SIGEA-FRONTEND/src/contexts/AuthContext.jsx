import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../api/authService';

const AuthContext = createContext();

// Decodificar payload JWT
function decodeJWT(token) {
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Verificar expiración
function isTokenExpired(token) {
  const decoded = decodeJWT(token);
  return !decoded || !decoded.exp || decoded.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
  
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const payload = await authService.login(credentials);
      const u = payload.user;
      const token = payload.token;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(u));
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  // Al montar, limpia sesiones expiradas
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isTokenExpired(token)) {
      logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);