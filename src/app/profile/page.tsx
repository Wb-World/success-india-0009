'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, MapPin, Edit2, ShieldAlert, CheckCircle, Clock, Save, Lock } from 'lucide-react';

export default function Profile() {
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
                    placeholder="Enter your username (e.g. user)"
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
                    placeholder="Enter your password (e.g. password)"
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
              <div className="avatar-circle">
                <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="member-logo" />
              </div>
              <h2 className="heading-md user-fullname">{currentUser.name}</h2>
              <span className="user-role-badge">Official Delegate</span>
            </div>

            <hr className="card-divider" />

            {updateSuccess && (
              <div className="update-success-alert animate-slide-up">
                <CheckCircle size={16} /> <span>{updateSuccess}</span>
              </div>
            )}
            {updateError && (
              <div className="update-error-alert animate-slide-up">
                <ShieldAlert size={16} /> <span>{updateError}</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleProfileUpdate} className="profile-edit-form">
                <div className="form-group">
                  <label className="form-label"><User size={12} /> Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Mail size={12} /> Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={12} /> Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={updateLoading}>
                    <Save size={14} /> {updateLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
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

                <button onClick={() => { setIsEditing(true); setUpdateSuccess(''); setUpdateError(''); }} className="btn btn-secondary edit-profile-btn">
                  <Edit2 size={14} /> Edit Contact Profile
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Event Bookings History */}
        <div className="bookings-history-column">
          <div className="history-card glass-card hover-lift">
            <h2 className="heading-md history-card-title">My Event Bookings</h2>

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
              <div className="bookings-table-wrapper">
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
                    {bookings.map((booking) => (
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
                            {booking.status === 'pending' && <Clock size={12} className="badge-icon" />}
                            {booking.status === 'approved' && <CheckCircle size={12} className="badge-icon" />}
                            {booking.status === 'denied' && <ShieldAlert size={12} className="badge-icon" />}
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx>{`
        .profile-dashboard {
          padding: 4rem 1.5rem;
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

        .avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
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

        .edit-profile-btn {
          width: 100%;
          padding: 0.625rem;
          font-size: 0.9rem;
          margin-top: 0.5rem;
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
