'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Calendar, MapPin, Edit2, ShieldAlert, CheckCircle, Clock, Save, Lock, Bell, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function ProfileDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Form states for login/register
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', name: '', email: '', phone: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Form states for updating profile
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'bookings' | 'notifications' | 'settings'>('bookings');
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (tabParam === 'notifications' || tabParam === 'settings' || tabParam === 'bookings') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Real-time listener for database updates
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    const channel = supabase
      .channel(`user-bookings-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('[Realtime] Booking changed:', payload.new);
          fetchProfileData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log('[Realtime] Notification changed:', payload.new);
          fetchProfileData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    setMounted(true);
    fetchProfileData();
  }, []);

  const getSafeCallbackUrl = () => {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) {
      return callbackUrl;
    }
    return '';
  };

  const fetchProfileData = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
      // Fetch fresh profile and bookings history from API
      const res = await fetch('/api/profile', {
        headers: {
          'x-user-id': parsed.id,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setBookings(data.bookings || []);
        setNotifications(data.notifications || []);
        setEditForm({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
        });
        // Keep localStorage updated with fresh details
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        // Session might be stale, clear it
        localStorage.removeItem('user');
        setCurrentUser(null);
      }
    } catch (e) {
      console.error('Error fetching profile:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        // Dispatch custom auth event to update Navbar
        window.dispatchEvent(new Event('auth-change'));

        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          fetchProfileData();
          const callbackUrl = getSafeCallbackUrl();
          if (callbackUrl) router.push(callbackUrl);
        }
      } else {
        setAuthError(data.error || 'Login failed');
      }
    } catch (err) {
      setAuthError('An network error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        window.dispatchEvent(new Event('auth-change'));
        fetchProfileData();
        const callbackUrl = getSafeCallbackUrl();
        if (callbackUrl) router.push(callbackUrl);
      } else {
        setAuthError(data.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError('An network error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setUpdateLoading(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify(editForm),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        setUpdateSuccess('Profile details updated successfully!');
        setIsEditing(false);
      } else {
        setUpdateError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setUpdateError('A connection error occurred');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleTabChange = (tabName: 'bookings' | 'notifications' | 'settings') => {
    setActiveTab(tabName);
    router.push(`/profile?tab=${tabName}`);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        // Sync Navbar
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (err) {
      console.error('Failed to mark notifications as read:', err);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="loading-container container">
        <div className="spinner"></div>
        <p>Retrieving your account profile...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8rem 0;
            gap: 1rem;
          }
          .spinner {
            border: 4px solid rgba(16, 185, 129, 0.1);
            border-left-color: var(--primary);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Render Login/Signup screen if not logged in
  if (!currentUser) {
    return (
      <div className="auth-page container animate-slide-up">
        <div className="auth-card glass-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab-btn ${isLoginTab ? 'active' : ''}`}
              onClick={() => { setIsLoginTab(true); setAuthError(''); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${!isLoginTab ? 'active' : ''}`}
              onClick={() => { setIsLoginTab(false); setAuthError(''); }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-form-content">
            {authError && (
              <div className="auth-error animate-shake">
                <ShieldAlert size={16} /> <span>{authError}</span>
              </div>
            )}

            {isLoginTab ? (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="Enter your username"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter your password"
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>
                  {authLoading ? 'Signing In...' : 'Access My Account'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    placeholder="Select a username"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Choose a strong password"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    value={registerForm.name}
                    onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    placeholder="John Doe"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="john@example.com"
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="form-control"
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>
                  {authLoading ? 'Creating Account...' : 'Register Profile'}
                </button>
              </form>
            )}
          </div>
        </div>

        <style jsx>{`
          .auth-page {
            max-width: 480px;
            padding: 3rem 1rem;
            width: 100%;
          }
          @media (min-width: 640px) {
            .auth-page {
              padding: 5rem 1.5rem;
            }
          }
          .auth-card {
            background: white;
            border: 1px solid var(--border);
            border-radius: var(--radius-2xl);
            overflow: hidden;
            box-shadow: var(--shadow-xl);
          }
          .auth-tabs {
            display: flex;
            background: var(--input);
            border-bottom: 1px solid var(--border);
          }
          .auth-tab-btn {
            flex: 1;
            padding: 1rem;
            background: none;
            border: none;
            cursor: pointer;
            font-family: var(--font-heading);
            font-weight: 600;
            font-size: 0.95rem;
            color: var(--muted);
            transition: all var(--transition-fast);
          }
          @media (min-width: 640px) {
            .auth-tab-btn {
              padding: 1.25rem;
              font-size: 1.05rem;
            }
          }
          .auth-tab-btn.active {
            background: white;
            color: var(--primary-dark);
            box-shadow: 0 -2px 0 0 var(--primary) inset;
          }
          .auth-form-content {
            padding: 1.5rem 1.25rem;
          }
          @media (min-width: 640px) {
            .auth-form-content {
              padding: 2.5rem 2rem;
            }
          }
          .auth-error {
            background: #fee2e2;
            color: #b91c1c;
            padding: 0.75rem 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .auth-submit-btn {
            width: 100%;
            padding: 0.875rem;
            margin-top: 1rem;
            font-size: 1.05rem;
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-4px); }
            40%, 80% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.4s ease;
          }
        `}</style>
      </div>
    );
  }

  // Render Logged In user Dashboard
  return (
    <div className="profile-dashboard container animate-fade-in">
      <div className="dashboard-welcome-banner animate-slide-down">
        <h1 className="welcome-title">Welcome back, {currentUser.name}! 👋</h1>
        <p className="welcome-subtitle">Welcome to your Success Team Member Portal. Here you can track your seminar registrations, event approvals, and update your professional profile details.</p>
      </div>

      <div className="dashboard-grid">

        {/* Left Side: Profile Info Card */}
        <div className="profile-info-column">
          <div className="info-card glass-card hover-lift">
            <div className="avatar-section">
              <div className="avatar-square">
                <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="member-logo" />
              </div>
              <h2 className="heading-md user-fullname">{currentUser.name}</h2>
              <span className="user-role-badge">Official Delegate</span>
            </div>

            <hr className="card-divider" />

            <div className="profile-details">
              <div className="detail-row">
                <Mail size={18} className="detail-icon" />
                <div>
                  <span className="detail-label">Email ID</span>
                  <p className="detail-val">{currentUser.email}</p>
                </div>
              </div>

              <div className="detail-row">
                <Phone size={18} className="detail-icon" />
                <div>
                  <span className="detail-label">Phone Number</span>
                  <p className="detail-val">{currentUser.phone}</p>
                </div>
              </div>
            </div>

            <hr className="card-divider" />

            {/* Tab navigation in left panel for desktop */}
            <div className="profile-sidebar-tabs">
              <button 
                type="button" 
                className={`sidebar-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => handleTabChange('bookings')}
              >
                <span>🎫 My Bookings</span>
              </button>
              <button 
                type="button" 
                className={`sidebar-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
                onClick={() => handleTabChange('notifications')}
              >
                <span>🔔 Notifications</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="tab-unread-count">{notifications.filter(n => !n.isRead).length}</span>
                )}
              </button>
              <button 
                type="button" 
                className={`sidebar-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => handleTabChange('settings')}
              >
                <span>⚙️ Account Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Tab Contents */}
        <div className="bookings-history-column">
          
          {/* Mobile Tab bar (visible only on mobile/tablet) */}
          <div className="mobile-tabs-bar">
            <button 
              type="button" 
              className={`mobile-tab-item ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => handleTabChange('bookings')}
            >
              🎫 Bookings
            </button>
            <button 
              type="button" 
              className={`mobile-tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => handleTabChange('notifications')}
            >
              🔔 Alerts 
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="mobile-unread-badge">{notifications.filter(n => !n.isRead).length}</span>
              )}
            </button>
            <button 
              type="button" 
              className={`mobile-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => handleTabChange('settings')}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="history-card glass-card">
              <h2 className="heading-md history-card-title">My Event Bookings</h2>

              {/* Summary Stats */}
              <div className="bookings-stats-grid">
                <div className="stat-box">
                  <span className="stat-num">{bookings.length}</span>
                  <span className="stat-label">Total Reservations</span>
                </div>
                <div className="stat-box confirmed">
                  <span className="stat-num">
                    {bookings.filter(b => b.status === 'approved').length}
                  </span>
                  <span className="stat-label">Total Confirmed</span>
                </div>
                <div className="stat-box pending">
                  <span className="stat-num">
                    {bookings.filter(b => b.status === 'pending' || !b.status).length}
                  </span>
                  <span className="stat-label">Total Pending</span>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-bookings">
                  <Calendar size={48} className="empty-icon" />
                  <h4 className="heading-sm">No Seminars Reserved Yet</h4>
                  <p>Ready to scale your business? Select an upcoming leadership chapter meetup or seminar and reserve your seats now.</p>
                  <button onClick={() => router.push('/book')} className="btn btn-primary">
                    Explore Upcoming Events
                  </button>
                </div>
              ) : (
                <div className="bookings-split-sections">
                  {/* Current Bookings Section */}
                  <div className="bookings-section-group">
                    <h3 className="section-group-title">Current Bookings</h3>
                    {bookings.filter(b => b.date >= new Date().toISOString().split('T')[0]).length === 0 ? (
                      <p className="no-bookings-text">No active upcoming bookings.</p>
                    ) : (
                      renderBookingsTable(bookings.filter(b => b.date >= new Date().toISOString().split('T')[0]))
                    )}
                  </div>

                  {/* Previous Bookings Section */}
                  <div className="bookings-section-group" style={{ marginTop: '3.5rem' }}>
                    <h3 className="section-group-title">Previous Bookings</h3>
                    {bookings.filter(b => b.date < new Date().toISOString().split('T')[0]).length === 0 ? (
                      <p className="no-bookings-text">No previous bookings history.</p>
                    ) : (
                      renderBookingsTable(bookings.filter(b => b.date < new Date().toISOString().split('T')[0]))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="history-card glass-card">
              <div className="notif-header-row">
                <h2 className="heading-md history-card-title" style={{ marginBottom: 0 }}>🔔 Notifications</h2>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <button 
                    type="button" 
                    onClick={handleMarkAllRead} 
                    className="btn btn-secondary btn-sm mark-all-read-btn"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="empty-bookings">
                  <Bell size={48} className="empty-icon" />
                  <h4 className="heading-sm">No Notifications</h4>
                  <p>You have no notification alerts at this time.</p>
                </div>
              ) : (
                <div className="notif-list-container" style={{ marginTop: '1.5rem' }}>
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`notif-item-card ${!notif.isRead ? 'unread' : ''}`}>
                      {!notif.isRead && <span className="unread-dot-indicator" />}
                      <div className="notif-content-area">
                        <h4 className="notif-item-title">{notif.title}</h4>
                        <p className="notif-item-message">{notif.message}</p>
                        <span className="notif-item-time">
                          {new Date(notif.createdAt).toLocaleDateString()} at{' '}
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="history-card glass-card">
              <h2 className="heading-md history-card-title">⚙️ Account Settings</h2>

              {updateSuccess && (
                <div className="update-success-alert animate-slide-up" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                  <CheckCircle size={16} /> <span>{updateSuccess}</span>
                </div>
              )}
              {updateError && (
                <div className="update-error-alert animate-slide-up" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
                  <ShieldAlert size={16} /> <span>{updateError}</span>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="profile-edit-form settings-edit-form" style={{ marginTop: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label"><User size={14} style={{ marginRight: '4px' }} /> Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label"><Mail size={14} style={{ marginRight: '4px' }} /> Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label"><Phone size={14} style={{ marginRight: '4px' }} /> Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-actions" style={{ maxWidth: '200px' }}>
                  <button type="submit" className="btn btn-primary" disabled={updateLoading}>
                    <Save size={14} style={{ marginRight: '4px' }} /> {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

      </div>

      <style jsx>{`
        .profile-dashboard {
          padding: 4rem 1.5rem;
        }

        @media (max-width: 640px) {
          .profile-dashboard {
            padding: 2.5rem 1rem;
          }

          .dashboard-welcome-banner {
            padding: 1.25rem 1rem;
            margin-bottom: 1.75rem;
          }

          .info-card,
          .history-card {
            padding: 1.5rem 1rem;
          }

          .card-divider {
            margin: 1.5rem 0;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions button {
            width: 100%;
          }

          .empty-bookings {
            padding: 2.5rem 1rem;
          }

          .bookings-table th,
          .bookings-table td {
            padding: 0.8rem 0.65rem;
          }

          .history-card-title {
            margin-bottom: 1.25rem;
          }
        }

        .dashboard-welcome-banner {
          margin-bottom: 2.5rem;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
        }
        @media (min-width: 640px) {
          .dashboard-welcome-banner {
            padding: 2rem 2.5rem;
          }
        }
        .welcome-title {
          font-family: var(--font-heading);
          font-size: clamp(1.4rem, 5vw, 2.2rem);
          font-weight: 800;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
          line-height: 1.2;
        }
        .welcome-subtitle {
          color: #065f46;
          font-size: clamp(0.9rem, 2.5vw, 1.05rem);
          font-weight: 500;
          line-height: 1.5;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (min-width: 992px) {
          .dashboard-grid {
            grid-template-columns: 0.8fr 1.2fr;
          }
        }

        /* Profile Left Card */
        .info-card {
          padding: 2.5rem 2rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
        }

        .avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          text-align: center;
        }

        .avatar-square {
          width: 120px;
          height: 120px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(16, 185, 129, 0.2);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
        }

        .member-logo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .user-fullname {
          font-weight: 700;
          color: var(--foreground);
        }

        .user-role-badge {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--primary-dark);
          background: #d1fae5;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
        }

        .card-divider {
          border: 0;
          border-top: 1px solid var(--border);
          margin: 2rem 0;
        }

        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-row {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .detail-icon {
          color: var(--muted-light);
          margin-top: 0.125rem;
        }

        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-val {
          font-weight: 600;
          color: var(--foreground);
          font-size: 1rem;
        }

        /* Sidebar Tab Menu (Desktop) */
        .profile-sidebar-tabs {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .sidebar-tab-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--muted);
          background: transparent;
          border: 1px solid transparent;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s;
        }

        .sidebar-tab-btn:hover {
          background-color: var(--input);
          color: var(--foreground);
        }

        .sidebar-tab-btn.active {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .tab-unread-count {
          background-color: #10b981;
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          line-height: 1;
        }

        /* Mobile Tab Bar (visible on mobile/tablet) */
        .mobile-tabs-bar {
          display: none;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }

        .mobile-tab-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.75rem 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: var(--radius-lg);
          color: var(--muted);
          background: white;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.15s;
        }

        .mobile-tab-item.active {
          background-color: var(--primary-light);
          color: var(--primary-dark);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .mobile-tab-item .mobile-unread-badge {
          background-color: #10b981;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.1rem 0.35rem;
          border-radius: 9999px;
          margin-left: 0.25rem;
        }

        @media (max-width: 991px) {
          .mobile-tabs-bar {
            display: grid;
          }
          .profile-sidebar-tabs {
            display: none;
          }
        }

        /* Stats Summary Box styling */
        .bookings-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
          margin-top: 1.5rem;
        }

        .stat-box {
          background: var(--input);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--foreground);
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-box.confirmed {
          background: #ecfdf5;
          border-color: #a7f3d0;
        }
        .stat-box.confirmed .stat-num {
          color: var(--primary-dark);
        }

        .stat-box.pending {
          background: #fffbeb;
          border-color: #fde68a;
        }
        .stat-box.pending .stat-num {
          color: #b45309;
        }

        @media (max-width: 640px) {
          .bookings-stats-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .stat-box {
            padding: 1rem;
          }
        }

        /* Bookings Sections Grouping */
        .bookings-section-group {
          margin-top: 2rem;
        }

        .section-group-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 1rem;
          border-left: 4px solid var(--primary);
          padding-left: 0.5rem;
        }

        .no-bookings-text {
          font-size: 0.9rem;
          color: var(--muted);
          font-style: italic;
          padding: 0.5rem 0;
        }

        /* Notification List Center styling */
        .notif-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .mark-all-read-btn {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
        }

        .notif-list-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notif-item-card {
          position: relative;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem 1.5rem;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast);
        }

        .notif-item-card:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .notif-item-card.unread {
          background: #f0fdf4;
          border-color: #a7f3d0;
        }

        .unread-dot-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          flex-shrink: 0;
          margin-top: 0.4rem;
        }

        .notif-content-area {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          text-align: left;
        }

        .notif-item-title {
          font-weight: 700;
          font-size: 1rem;
          color: var(--foreground);
          margin: 0;
        }

        .notif-item-message {
          font-size: 0.92rem;
          color: var(--muted);
          line-height: 1.45;
          margin: 0;
        }

        .notif-item-time {
          font-size: 0.75rem;
          color: var(--muted-light);
          margin-top: 0.25rem;
        }

        /* Edit Form */
        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .profile-edit-form .form-group {
          margin-bottom: 0;
        }

        .profile-edit-form .form-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .form-actions button {
          flex: 1;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .update-success-alert {
          background: var(--primary-light);
          color: var(--primary-dark);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .update-error-alert {
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        /* Bookings Right Card */
        .history-card {
          padding: 2.5rem 2rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
        }

        .history-card-title {
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 2rem;
        }

        .empty-bookings {
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-icon {
          color: var(--muted-light);
        }

        .empty-bookings p {
          color: var(--muted);
          max-width: 320px;
          line-height: 1.5;
          margin-bottom: 0.5rem;
        }

        /* Bookings Table */
        .bookings-table-wrapper {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .bookings-table {
          width: 100%;
          min-width: 700px;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.95rem;
        }

        .bookings-table th {
          padding: 1rem;
          border-bottom: 2px solid var(--border);
          color: var(--muted);
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .bookings-table td {
          padding: 1.25rem 1rem;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
        }

        .booking-id-tag {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--foreground);
          display: block;
        }

        .booking-created-date {
          font-size: 0.75rem;
          color: var(--muted);
          display: block;
          margin-top: 0.125rem;
        }

        .seminar-cell {
          display: flex;
          flex-direction: column;
        }

        .seminar-venue-topic {
          font-weight: 600;
          color: var(--foreground);
        }

        .seminar-program-name {
          font-size: 0.75rem;
          color: var(--muted);
          margin-top: 0.125rem;
        }

        .seats-cell {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .seat-item-tag {
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--input);
          color: var(--foreground);
          padding: 0.125rem 0.375rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }

        .date-cell {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
          font-size: 0.85rem;
        }

        .inline-icon {
          vertical-align: middle;
          margin-top: -2px;
          margin-right: 2px;
        }

        .date-text {
          font-weight: 500;
          color: var(--foreground);
        }

        .time-text {
          color: var(--muted);
        }

        .price-cell {
          font-family: var(--font-heading);
          font-weight: 800;
          color: var(--primary-dark);
          font-size: 1.05rem;
        }

        .badge-icon {
          margin-right: 0.25rem;
        }
      `}</style>
    </div>
  );
}

const renderBookingsTable = (list: any[]) => (
  <div className="bookings-table-wrapper" style={{ marginTop: '0.5rem' }}>
    <table className="bookings-table">
      <thead>
        <tr>
          <th>Booking Ref</th>
          <th>Event Info</th>
          <th>Seats</th>
          <th>Session Date</th>
          <th>Total Fee</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {list.map((booking) => (
          <tr key={booking.id}>
            <td className="booking-ref-cell">
              <span className="booking-id-tag">{booking.id.toUpperCase()}</span>
              <span className="booking-created-date">
                {new Date(booking.createdAt).toLocaleDateString()}
              </span>
            </td>
            <td>
              <div className="seminar-cell">
                <span className="seminar-venue-topic">{booking.venue} &rarr; {booking.seminar}</span>
                <span className="seminar-program-name">{booking.seminarName || booking.eventName}</span>
              </div>
            </td>
            <td>
              <div className="seats-cell">
                {booking.seats.map((seat: string) => (
                  <span key={seat} className="seat-item-tag">{seat}</span>
                ))}
              </div>
              {booking.attendees && Object.keys(booking.attendees).length > 0 && (
                <div className="booking-attendees-list" style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {Object.entries(booking.attendees).map(([seat, val]: any) => {
                    const nameText = typeof val === 'object' && val !== null ? val.name : val;
                    const phoneText = typeof val === 'object' && val !== null ? val.phone : '';
                    return (
                      <span key={seat} style={{ fontSize: '11px', color: '#047857', whiteSpace: 'nowrap', display: 'block' }}>
                        <strong>{seat}:</strong> {nameText} {phoneText ? `(${phoneText})` : ''}
                      </span>
                    );
                  })}
                </div>
              )}
            </td>
            <td>
              <div className="date-cell">
                <span className="date-text"><Calendar size={12} className="inline-icon" /> {booking.date}</span>
                <span className="time-text"><Clock size={12} className="inline-icon" /> {booking.time}</span>
              </div>
            </td>
            <td className="price-cell">
              ₹{booking.totalPrice}
            </td>
            <td>
              <span className={`badge badge-${booking.status}`}>
                {(booking.status === 'pending' || !booking.status) && <Clock size={12} className="badge-icon" />}
                {booking.status === 'approved' && <CheckCircle size={12} className="badge-icon" />}
                {booking.status === 'denied' && <ShieldAlert size={12} className="badge-icon" />}
                {booking.status === 'approved' ? 'Confirmed' : booking.status === 'denied' ? 'Rejected' : 'Pending Verification'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function Profile() {
  return (
    <Suspense fallback={
      <div className="loading-container container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 8rem 0;
            gap: 1rem;
          }
          .spinner {
            border: 4px solid rgba(16, 185, 129, 0.1);
            border-left-color: #10b981;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    }>
      <ProfileDashboard />
    </Suspense>
  );
}
