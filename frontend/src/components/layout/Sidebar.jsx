import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Package,
  FileText,
  FilePlus,
  Receipt,
  CreditCard,
  FileMinus,
  BarChart3,
  Globe,
  UserCog,
  Settings,
  User,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import '../../styles/layout.css';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout, isCustomer } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 16 Main Application Pages mapped with roles
  const navigationGroups = [
    {
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
      ],
    },
    {
      title: 'Sales & Invoicing',
      items: [
        {
          name: 'Customers',
          path: '/customers',
          icon: Users,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
        {
          name: 'Customer Details',
          path: '/customers/details',
          icon: UserCheck,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
        {
          name: 'Products & Services',
          path: '/products',
          icon: Package,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
        {
          name: 'Invoices',
          path: '/invoices',
          icon: FileText,
          roles: ['Admin', 'Business Owner', 'Accountant', 'Customer'],
        },
        {
          name: 'Create Invoice',
          path: '/invoices/create',
          icon: FilePlus,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
        {
          name: 'Invoice Details',
          path: '/invoices/details',
          icon: Receipt,
          roles: ['Admin', 'Business Owner', 'Accountant', 'Customer'],
        },
      ],
    },
    {
      title: 'Finance & Payments',
      items: [
        {
          name: 'Payments',
          path: '/payments',
          icon: CreditCard,
          roles: ['Admin', 'Business Owner', 'Accountant', 'Customer'],
        },
        {
          name: 'Credit Notes',
          path: '/credit-notes',
          icon: FileMinus,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
        {
          name: 'Reports & Analytics',
          path: '/reports',
          icon: BarChart3,
          roles: ['Admin', 'Business Owner', 'Accountant'],
        },
      ],
    },
    {
      title: 'Management & Portal',
      items: [
        {
          name: 'Customer Portal',
          path: '/portal',
          icon: Globe,
          roles: ['Admin', 'Business Owner', 'Customer'],
        },
        {
          name: 'User Management',
          path: '/users',
          icon: UserCog,
          roles: ['Admin'],
        },
        {
          name: 'Business Settings',
          path: '/settings',
          icon: Settings,
          roles: ['Admin', 'Business Owner'],
        },
        {
          name: 'User Profile',
          path: '/profile',
          icon: User,
          roles: ['Admin', 'Business Owner', 'Accountant', 'Customer'],
        },
      ],
    },
  ];

  return (
    <>
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon-wrapper">
              <Building2 size={22} />
            </div>
            <div>
              <div style={{ lineHeight: 1.2 }}>BillFlow</div>
              <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 500 }}>
                Enterprise Billing
              </div>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="sidebar-nav-container">
          {navigationGroups.map((group) => {
            const visibleItems = group.items.filter(
              (item) => !item.roles || item.roles.includes(role || 'Business Owner')
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={group.title} className="nav-group">
                <div className="nav-group-title">{group.title}</div>
                <ul className="nav-list">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `nav-link ${isActive ? 'active' : ''}`
                          }
                        >
                          <Icon className="nav-icon" />
                          <span>{item.name}</span>
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom User Section */}
        <div className="sidebar-footer">
          <div className="user-badge-card">
            <div className="user-avatar-circle">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info-text">
              <div className="user-name-label">{user?.name || 'Authorized User'}</div>
              <div style={{ marginTop: '2px' }}>
                <RoleBadge role={role} size="sm" />
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost"
              style={{ color: '#94A3B8', padding: '6px' }}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
    </>
  );
};

export default Sidebar;
