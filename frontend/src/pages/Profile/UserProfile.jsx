import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Building,
  Shield,
  KeyRound,
  Lock,
  Camera,
  Save,
  LogOut,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  UserCheck,
} from 'lucide-react';
import { profileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, RoleBadge } from '../../components/common/Badge';
import { Alert } from '../../components/common/Alert';
import { Input } from '../../components/common/Input';
import './profile.css';

// Date Formatter
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const UserProfile = () => {
  const navigate = useNavigate();
  const { user: authUser, role, logout } = useAuth();

  // Profile Information State
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    companyName: '',
    avatar: '',
    isActive: true,
    createdAt: '',
  });

  // Edit Personal Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Password Change Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Fetch Logged-in Profile
  const fetchProfile = async () => {
    setLoading(true);
    setProfileError('');
    try {
      const res = await profileAPI.getProfile();
      if (res.success && res.user) {
        const u = res.user;
        setProfileData(u);
        setName(u.name || '');
        setPhone(u.phone || '');
        setCompanyName(u.companyName || u.businessName || '');
      }
    } catch (err) {
      console.error('Fetch profile error:', err);
      setProfileError(err.message || 'Failed to retrieve profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Update Personal Details
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await profileAPI.updateProfile({
        name,
        phone,
        companyName,
      });

      if (res.success) {
        setProfileSuccess(res.message || 'Profile details updated successfully');
        fetchProfile();
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please re-enter.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await profileAPI.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err.message || 'Failed to change password. Ensure current password is correct.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle Avatar Upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload an image file (PNG, JPG, or SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError('Avatar image size must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await profileAPI.updateAvatar(reader.result);
        if (res.success) {
          setProfileSuccess('Profile picture updated successfully!');
          fetchProfile();
        }
      } catch (err) {
        setProfileError(err.message || 'Failed to update profile picture');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Direct Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="profile-page-content">
      {/* Header Row */}
      <div className="profile-header-row">
        <div>
          <h1 className="profile-main-title">User Account & Security</h1>
          <p className="profile-sub-title">
            Manage your personal login credentials, contact profile, and password security.
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            icon={LogOut}
            onClick={handleLogout}
            className="text-danger border-danger"
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* ========================================================= */}
        {/* LEFT COLUMN: IDENTITY CARD & SUMMARY                      */}
        {/* ========================================================= */}
        <div className="profile-sidebar-col">
          <Card padding="normal" className="profile-identity-card">
            <div className="profile-avatar-container">
              <div className="profile-avatar-wrapper">
                {profileData.avatar ? (
                  <img
                    src={profileData.avatar}
                    alt={profileData.name}
                    className="avatar-full-img"
                  />
                ) : (
                  <div className="avatar-initials-circle">
                    {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <label className="avatar-upload-badge" title="Change Avatar Photo">
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <h2 className="profile-user-fullname">{profileData.name || 'User Name'}</h2>
              <p className="profile-user-email">{profileData.email}</p>

              <div className="profile-role-badge-row">
                <RoleBadge role={profileData.role || role} size="md" />
              </div>
            </div>

            <div className="profile-meta-details-list">
              <div className="meta-detail-row">
                <Building size={16} className="text-muted" />
                <div className="meta-text-box">
                  <span className="meta-lbl">Organization</span>
                  <span className="meta-val font-semibold">
                    {profileData.companyName || 'Apex Enterprises Pvt Ltd'}
                  </span>
                </div>
              </div>

              <div className="meta-detail-row">
                <Phone size={16} className="text-muted" />
                <div className="meta-text-box">
                  <span className="meta-lbl">Direct Phone</span>
                  <span className="meta-val font-mono">{profileData.phone || '—'}</span>
                </div>
              </div>

              <div className="meta-detail-row">
                <Calendar size={16} className="text-muted" />
                <div className="meta-text-box">
                  <span className="meta-lbl">Member Since</span>
                  <span className="meta-val text-xs text-muted">
                    {formatDate(profileData.createdAt)}
                  </span>
                </div>
              </div>

              <div className="meta-detail-row">
                <UserCheck size={16} className="text-success" />
                <div className="meta-text-box">
                  <span className="meta-lbl">Account Status</span>
                  <span className="meta-val font-semibold text-success">
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: EDIT DETAILS & CHANGE PASSWORD CARDS        */}
        {/* ========================================================= */}
        <div className="profile-main-col">
          {/* Card 1: Edit Personal Details */}
          <Card padding="normal" className="profile-section-card">
            <Card.Header
              title="Personal Information"
              subtitle="Update your full display name and business contact phone"
            />
            <Card.Body>
              {profileSuccess && (
                <Alert
                  type="success"
                  message={profileSuccess}
                  onClose={() => setProfileSuccess('')}
                  className="mb-4"
                />
              )}
              {profileError && (
                <Alert
                  type="error"
                  message={profileError}
                  onClose={() => setProfileError('')}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleUpdateProfile}>
                <div className="profile-inputs-grid">
                  <Input
                    label="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma"
                    required
                  />

                  <Input
                    label="Official Email (Login Identifier) *"
                    type="email"
                    value={profileData.email}
                    disabled
                    helperText="Official login email is locked. Contact an administrator to modify."
                  />

                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />

                  <Input
                    label="Company / Enterprise Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Enterprises Pvt Ltd"
                  />

                  <div className="custom-input-wrap">
                    <label className="input-label">Assigned Role</label>
                    <input
                      type="text"
                      value={profileData.role || role || 'Business Owner'}
                      disabled
                      className="form-disabled-field"
                    />
                    <span className="text-xs text-muted mt-1">
                      Role elevation is restricted to system administrators.
                    </span>
                  </div>
                </div>

                <div className="profile-save-row mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    icon={Save}
                    loading={savingProfile}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>

          {/* Card 2: Change Password & Security */}
          <Card padding="normal" className="profile-section-card mt-4">
            <Card.Header
              title="Change Account Password"
              subtitle="Protect your billing platform with a secure, confidential password"
            />
            <Card.Body>
              {passwordSuccess && (
                <Alert
                  type="success"
                  message={passwordSuccess}
                  onClose={() => setPasswordSuccess('')}
                  className="mb-4"
                />
              )}
              {passwordError && (
                <Alert
                  type="error"
                  message={passwordError}
                  onClose={() => setPasswordError('')}
                  className="mb-4"
                />
              )}

              <form onSubmit={handleChangePassword}>
                <div className="password-fields-column">
                  {/* Current Password */}
                  <div className="pwd-input-relative">
                    <Input
                      label="Current Password *"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your existing password"
                      required
                    />
                    <button
                      type="button"
                      className="pwd-eye-btn"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      title={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="pwd-input-relative mt-2">
                    <Input
                      label="New Password *"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      helperText="Must be at least 6 characters long"
                      required
                    />
                    <button
                      type="button"
                      className="pwd-eye-btn"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Confirm New Password */}
                  <div className="mt-2">
                    <Input
                      label="Confirm New Password *"
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                <div className="profile-save-row mt-4">
                  <Button
                    variant="primary"
                    type="submit"
                    icon={KeyRound}
                    loading={changingPassword}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
