import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Button } from '../common/Button';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, role, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          backgroundColor: 'var(--bg-color)',
        }}
      >
        <Loader2 size={36} className="btn-spinner" style={{ color: 'var(--primary-blue)' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
          Verifying security session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger-red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
          }}
        >
          <ShieldAlert size={32} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: 450, marginBottom: '1.5rem', fontSize: '0.925rem' }}>
          Your current account role (<strong>{role}</strong>) does not have authorization to view this section of the platform.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => logout()}>
            Sign In with Different Account
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
