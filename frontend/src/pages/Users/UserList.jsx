import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Edit2,
  KeyRound,
  Trash2,
  CheckCircle2,
  XCircle,
  Shield,
  ShieldAlert,
  Building,
  Phone,
  Mail,
  UserCheck,
  UserX,
  X,
  Save,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';
import { userManagementAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, RoleBadge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './users.css';

// Date Formatter
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const UserList = () => {
  const { user: currentAuthUser } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalOwners: 0,
    totalAccountants: 0,
    totalCustomers: 0,
    totalActive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });

  // Add / Edit Modal State
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Business Owner',
    companyName: '',
    phone: '',
    isActive: true,
  });

  // Password Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Delete Confirmation Modal State
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);

  // Fetch Users from Backend API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userManagementAPI.getAll({
        search: search.trim() || undefined,
        role: roleFilter !== 'All' ? roleFilter : undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        page,
        limit: 10,
      });

      if (res.success) {
        setUsers(res.users || []);
        if (res.pagination) setPagination(res.pagination);
        if (res.metrics) setMetrics(res.metrics);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Business Owner',
      companyName: '',
      phone: '',
      isActive: true,
    });
    setShowAddEditModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u) => {
    setEditingUserId(u._id);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
      companyName: u.companyName || '',
      phone: u.phone || '',
      isActive: u.isActive !== false,
    });
    setShowAddEditModal(true);
  };

  // Submit Add or Edit User
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (editingUserId) {
        // Update user
        const res = await userManagementAPI.update(editingUserId, {
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
          companyName: formData.companyName,
          isActive: formData.isActive,
        });
        if (res.success) {
          setSuccessMessage(res.message || 'User details updated successfully');
          setShowAddEditModal(false);
          fetchUsers();
        }
      } else {
        // Create new user
        if (!formData.password || formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        const res = await userManagementAPI.create(formData);
        if (res.success) {
          setSuccessMessage(res.message || 'New user created successfully');
          setShowAddEditModal(false);
          fetchUsers();
        }
      }
    } catch (err) {
      console.error('Save user error:', err);
      setError(err.message || 'Failed to save user');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle User Active / Inactive Status
  const handleToggleStatus = async (targetUser) => {
    setError('');
    setSuccessMessage('');
    try {
      const res = await userManagementAPI.toggleStatus(targetUser._id);
      if (res.success) {
        setSuccessMessage(res.message);
        fetchUsers();
      }
    } catch (err) {
      console.error('Toggle status error:', err);
      setError(err.message || 'Failed to update account status');
    }
  };

  // Open Password Reset Modal
  const handleOpenResetModal = (u) => {
    setResetTargetUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordText(false);
    setShowResetModal(true);
  };

  // Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await userManagementAPI.resetPassword(resetTargetUser._id, newPassword);
      if (res.success) {
        setSuccessMessage(res.message || `Password reset successfully for ${resetTargetUser.name}`);
        setShowResetModal(false);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete
  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setActionLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await userManagementAPI.delete(deleteTargetUser._id);
      if (res.success) {
        setSuccessMessage(res.message || 'User deleted successfully');
        setDeleteTargetUser(null);
        fetchUsers();
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="users-page-content">
      {/* Header Row */}
      <div className="users-header-row">
        <div>
          <h1 className="users-main-title">Staff & User Management</h1>
          <p className="users-sub-title">
            Oversee administrative accounts, assign operational roles, and enforce security policies.
          </p>
        </div>
        <div className="users-header-actions">
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={loading}
            onClick={fetchUsers}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={handleOpenAddModal}
          >
            Add New User
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage('')}
        />
      )}
      {error && (
        <Alert
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {/* Metric Summary Chips */}
      <div className="users-summary-chips-row">
        <div className="user-stat-card card-total">
          <div className="u-stat-top">
            <span className="u-stat-lbl">Total Registered Users</span>
            <div className="u-icon-box bg-blue">
              <Users size={18} />
            </div>
          </div>
          <div className="u-stat-val">{metrics.totalUsers}</div>
          <div className="u-stat-sub text-muted">All system accounts</div>
        </div>

        <div className="user-stat-card card-admins">
          <div className="u-stat-top">
            <span className="u-stat-lbl">Platform Admins</span>
            <div className="u-icon-box bg-purple">
              <Shield size={18} />
            </div>
          </div>
          <div className="u-stat-val text-purple">{metrics.totalAdmins}</div>
          <div className="u-stat-sub text-purple">Full governance access</div>
        </div>

        <div className="user-stat-card card-owners">
          <div className="u-stat-top">
            <span className="u-stat-lbl">Business Owners & Staff</span>
            <div className="u-icon-box bg-teal">
              <Building size={18} />
            </div>
          </div>
          <div className="u-stat-val text-teal">
            {metrics.totalOwners + metrics.totalAccountants}
          </div>
          <div className="u-stat-sub text-teal">Invoicing & financial operators</div>
        </div>

        <div className="user-stat-card card-customers">
          <div className="u-stat-top">
            <span className="u-stat-lbl">Client Portal Accounts</span>
            <div className="u-icon-box bg-green">
              <UserCheck size={18} />
            </div>
          </div>
          <div className="u-stat-val text-success">{metrics.totalCustomers}</div>
          <div className="u-stat-sub text-success">Active client logins</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="normal" className="users-filters-card">
        <div className="users-filters-grid">
          <div className="user-search-box">
            <Search size={16} className="u-search-icon" />
            <input
              type="text"
              placeholder="Search by name, email, or company..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="u-search-field"
            />
          </div>

          <div className="u-filter-select-group">
            <span className="u-filter-label">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="u-filter-select"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Business Owner">Business Owner</option>
              <option value="Accountant">Accountant</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          <div className="u-filter-select-group">
            <span className="u-filter-label">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="u-filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users Master Table */}
      <Card padding="none" className="users-table-card">
        <div className="table-responsive">
          <table className="users-master-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name & Identity</th>
                <th>Role</th>
                <th>Business / Company</th>
                <th>Phone</th>
                <th style={{ textAlign: 'center' }}>Account Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    Loading user directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-5 text-muted">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrentLoggedUser = String(u._id) === String(currentAuthUser?._id);
                  const shortId = `USR-${u._id.slice(-6).toUpperCase()}`;

                  return (
                    <tr key={u._id} className={!u.isActive ? 'user-row-inactive' : ''}>
                      <td className="font-mono font-bold text-xs text-muted">
                        {shortId}
                      </td>
                      <td>
                        <div className="user-identity-cell">
                          <div className="user-avatar-initials">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="user-name-title font-semibold">
                              {u.name}
                              {isCurrentLoggedUser && (
                                <span className="current-user-tag">(You)</span>
                              )}
                            </div>
                            <div className="user-email-subtitle text-xs text-muted">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <RoleBadge role={u.role} size="sm" />
                      </td>
                      <td className="font-medium text-sm">
                        {u.companyName ? (
                          <div className="flex items-center gap-1">
                            <Building size={14} className="text-muted" />
                            <span>{u.companyName}</span>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="text-sm text-muted font-mono">
                        {u.phone || '—'}
                      </td>
                      <td className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          disabled={isCurrentLoggedUser}
                          title={
                            isCurrentLoggedUser
                              ? 'Cannot deactivate yourself'
                              : `Click to ${u.isActive ? 'deactivate' : 'activate'}`
                          }
                          className="status-toggle-btn"
                        >
                          <Badge
                            variant={u.isActive ? 'success' : 'default'}
                            size="sm"
                            dot
                          >
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </button>
                      </td>
                      <td className="text-xs text-muted">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="text-center">
                        <div className="user-action-buttons">
                          <button
                            type="button"
                            className="action-icon-btn edit-btn"
                            title="Edit User Details"
                            onClick={() => handleOpenEditModal(u)}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="action-icon-btn reset-btn"
                            title="Reset Password"
                            onClick={() => handleOpenResetModal(u)}
                          >
                            <KeyRound size={15} />
                          </button>
                          {!isCurrentLoggedUser && (
                            <button
                              type="button"
                              className="action-icon-btn delete-btn"
                              title="Delete User"
                              onClick={() => setDeleteTargetUser(u)}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="users-pagination-bar">
            <span className="text-sm text-muted">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total users)
            </span>
            <div className="pagination-buttons">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT USER                                  */}
      {/* ========================================================= */}
      {showAddEditModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingUserId ? 'Edit User Details' : 'Add New User'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddEditModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group-grid">
                  <Input
                    label="Full Name *"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    required
                  />

                  <Input
                    label="Email Address (Login ID) *"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. john@apexenterprises.com"
                    disabled={Boolean(editingUserId)}
                    helperText={editingUserId ? 'Email login ID cannot be changed' : undefined}
                    required
                  />

                  {!editingUserId && (
                    <Input
                      label="Initial Password *"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  )}

                  <div className="custom-input-wrap">
                    <label className="input-label">Role Assignment *</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="Business Owner">Business Owner</option>
                      <option value="Admin">Admin</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Customer">Customer</option>
                    </select>
                  </div>

                  <Input
                    label="Company / Business Name"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Apex Enterprises Pvt Ltd"
                  />

                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="status-checkbox-row mt-3">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>Account Active (permits login)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={Save}
                  loading={actionLoading}
                >
                  {editingUserId ? 'Save Changes' : 'Create User'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ADMIN SECURE PASSWORD RESET                      */}
      {/* ========================================================= */}
      {showResetModal && resetTargetUser && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-sm">
            <div className="modal-header">
              <h3 className="modal-title">Reset User Password</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowResetModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="modal-body">
                <div className="reset-user-strip">
                  <div className="r-avatar">
                    {resetTargetUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{resetTargetUser.name}</div>
                    <div className="text-xs text-muted">{resetTargetUser.email}</div>
                  </div>
                </div>

                <div className="password-input-relative mt-3">
                  <Input
                    label="New Password *"
                    type={showPasswordText ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <button
                    type="button"
                    className="pwd-toggle-btn"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    title={showPasswordText ? 'Hide password' : 'Show password'}
                  >
                    {showPasswordText ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="mt-3">
                  <Input
                    label="Confirm New Password *"
                    type={showPasswordText ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  icon={KeyRound}
                  loading={actionLoading}
                >
                  Set New Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION                              */}
      {/* ========================================================= */}
      {deleteTargetUser && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-sm">
            <div className="modal-header">
              <h3 className="modal-title text-danger">Delete User Account</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setDeleteTargetUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="text-sm">
                Are you sure you want to permanently delete user{' '}
                <strong>{deleteTargetUser.name}</strong> ({deleteTargetUser.email})?
              </p>
              <p className="text-xs text-muted mt-2">
                This action cannot be undone. User records and direct login credentials will be removed.
              </p>
            </div>

            <div className="modal-footer">
              <Button
                variant="outline"
                onClick={() => setDeleteTargetUser(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                loading={actionLoading}
                onClick={handleDeleteUser}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
