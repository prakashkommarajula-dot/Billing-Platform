import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import '../../styles/layout.css';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, role, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title from path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard Overview';
    if (path.includes('/customers/details')) return 'Customer Profile & Ledger';
    if (path.includes('/customers')) return 'Customer Directory';
    if (path.includes('/products')) return 'Products & Services Inventory';
    if (path.includes('/invoices/create')) return 'Create Tax Invoice';
    if (path.includes('/invoices/details')) return 'Invoice Details & Preview';
    if (path.includes('/invoices')) return 'Invoice Management';
    if (path.includes('/payments')) return 'Payment Records & Gateway';
    if (path.includes('/credit-notes')) return 'Credit Notes & Adjustments';
    if (path.includes('/reports')) return 'Business Analytics & Reports';
    if (path.includes('/portal')) return 'Customer Billing Portal';
    if (path.includes('/users')) return 'Staff & Access Management';
    if (path.includes('/settings')) return 'Business & Tax Settings';
    if (path.includes('/profile')) return 'My Profile & Security';
    return 'Billing & Accounting';
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={22} />
        </button>
        <div>
          <h1 className="page-title">{getPageTitle()}</h1>
          {user?.companyName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <Building size={12} />
              <span>{user.companyName}</span>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {/* Quick Search */}
        <div style={{ position: 'relative', display: 'none', minWidth: '220px' }}>
          {/* Can be displayed on wider screens */}
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="nav-icon-btn"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={19} />
          <span className="nav-badge-dot" />
        </button>

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            className="user-profile-menu-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-expanded={dropdownOpen}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: 'var(--primary-blue)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.2 }}>
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {role || 'Staff'}
              </span>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: 4 }} />
          </button>

          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '240px',
                backgroundColor: '#ffffff',
                border: '1px solid var(--light-border)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.5rem',
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--light-border)',
                  marginBottom: '0.35rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                  {user?.email}
                </div>
                <div style={{ marginTop: '0.4rem' }}>
                  <RoleBadge role={role} size="sm" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    gap: '0.65rem',
                  }}
                >
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    gap: '0.65rem',
                  }}
                >
                  <Settings size={16} />
                  <span>Business Settings</span>
                </button>

                <div style={{ height: 1, backgroundColor: 'var(--light-border)', margin: '4px 0' }} />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    gap: '0.65rem',
                    color: 'var(--danger-red)',
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
