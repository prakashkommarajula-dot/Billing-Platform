import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser =
      localStorage.getItem('billflow_user') ||
      sessionStorage.getItem('billflow_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => {
    return (
      localStorage.getItem('billflow_token') ||
      sessionStorage.getItem('billflow_token')
    );
  });
  const [loading, setLoading] = useState(true);

  // Validate session on mount if token exists
  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.getProfile();
          if (res.success && res.user) {
            setUser(res.user);
            if (localStorage.getItem('billflow_token')) {
              localStorage.setItem('billflow_user', JSON.stringify(res.user));
            } else {
              sessionStorage.setItem('billflow_user', JSON.stringify(res.user));
            }
          }
        } catch (error) {
          console.warn('Session verification failed:', error.message);
          // If 401 or token expired, log out
          if (error.status === 401 || error.status === 403) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, [token]);

  const login = async (credentials, rememberMe = true) => {
    const data = await authAPI.login(credentials);
    if (data.success && data.token && data.user) {
      setToken(data.token);
      setUser(data.user);

      // Secure storage selection based on Remember Me
      if (rememberMe) {
        localStorage.setItem('billflow_token', data.token);
        localStorage.setItem('billflow_user', JSON.stringify(data.user));
        localStorage.setItem('billflow_remembered_email', credentials.email);
        sessionStorage.removeItem('billflow_token');
        sessionStorage.removeItem('billflow_user');
      } else {
        sessionStorage.setItem('billflow_token', data.token);
        sessionStorage.setItem('billflow_user', JSON.stringify(data.user));
        localStorage.removeItem('billflow_token');
        localStorage.removeItem('billflow_user');
        localStorage.removeItem('billflow_remembered_email');
      }

      return data;
    }
    throw new Error(data.message || 'Login failed');
  };

  const register = async (userData) => {
    const data = await authAPI.register(userData);
    if (data.success && data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('billflow_token', data.token);
      localStorage.setItem('billflow_user', JSON.stringify(data.user));
      return data;
    }
    throw new Error(data.message || 'Registration failed');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('billflow_token');
    localStorage.removeItem('billflow_user');
    sessionStorage.removeItem('billflow_token');
    sessionStorage.removeItem('billflow_user');
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      if (localStorage.getItem('billflow_token')) {
        localStorage.setItem('billflow_user', JSON.stringify(nextUser));
      } else {
        sessionStorage.setItem('billflow_user', JSON.stringify(nextUser));
      }
      return nextUser;
    });
  };

  const role = user?.role || null;
  const isAdmin = role === 'Admin';
  const isBusinessOwner = role === 'Business Owner';
  const isAccountant = role === 'Accountant';
  const isCustomer = role === 'Customer';

  const hasRole = (allowedRoles = []) => {
    if (!role) return false;
    return allowedRoles.includes(role);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    role,
    isAdmin,
    isBusinessOwner,
    isAccountant,
    isCustomer,
    hasRole,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
