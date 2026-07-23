import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await api.get('/api/auth/me');
      setUser(user);
    } catch {
      clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const login = async (email, password) => {
    const { token, user } = await api.post('/api/auth/login', { email, password }, { auth: false });
    setToken(token);
    setUser(user);
  };

  const register = async (payload) => {
    const { token, user } = await api.post('/api/auth/register', payload, { auth: false });
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
