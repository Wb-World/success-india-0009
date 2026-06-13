'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Calendar, Compass, Edit2, ShieldAlert, CheckCircle, Clock, Save, Lock, Terminal, ShieldCheck } from 'lucide-react';

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

  const fetchProfileData = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(storedUser);
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
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
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
        window.dispatchEvent(new Event('auth-change'));
        
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          fetchProfileData();
        }
      } else {
        setAuthError(data.error || 'Identity authentication failed');
      }
    } catch (err) {
      setAuthError('An database network error occurred');
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
      } else {
        setAuthError(data.error || 'Operative credentials registration failed');
      }
    } catch (err) {
      setAuthError('A transmission network error occurred');
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
        setUpdateSuccess('Operative credentials updated in main grid database!');
        setIsEditing(false);
      } else {
        setUpdateError(data.error || 'Failed to update credentials');
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
        <p style={{ color: '#10b981', fontFamily: 'var(--font-mono)' }}>CONNECTING SECURE MAIN INFRASTRUCTURE...</p>
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
            border: 3px solid rgba(16, 185, 129, 0.1);
            border-left-color: var(--primary);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
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
              Register Operative
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
                    placeholder="Enter database username (e.g. user)" 
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
                    placeholder="Enter security key (e.g. password)" 
                    className="form-control" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>
                  {authLoading ? 'Decrypting credentials...' : 'Establish Session'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label className="form-label">Database Username</label>
                  <input 
                    type="text" 
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    placeholder="Select coordinate codename" 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Security Key (Password)</label>
                  <input 
                    type="password" 
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="Select cryptographic key" 
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
                    placeholder="E.g. Richard Hendricks" 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Secure Email Address</label>
                  <input 
                    type="email" 
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    placeholder="operative@protonmail.com" 
                    className="form-control" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Contact Line</label>
                  <input 
                    type="text" 
                    value={registerForm.phone}
                    onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    placeholder="E.g. +91 9988776655" 
                    className="form-control" 
                    required 
                  />
                </div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>
                  {authLoading ? 'Registering operative...' : 'Initialize Operative Node'}
                </button>
              </form>
            )}
          </div>
        </div>

        <style jsx>{`
          .auth-page {
            max-width: 480px;
            padding: 5rem 1.5rem;
          }
          .auth-card {
            background: rgba(12, 17, 29, 0.85);
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
            padding: 1.25rem;
            background: none;
            border: none;
            cursor: pointer;
            font-family: var(--font-heading);
            font-weight: 600;
            font-size: 1.05rem;
            color: var(--muted);
            transition: all var(--transition-fast);
          }
          .auth-tab-btn.active {
            background: rgba(12, 17, 29, 0.85);
            color: var(--primary);
            box-shadow: 0 -2px 0 0 var(--primary) inset;
          }
          .auth-form-content {
            padding: 2.5rem 2rem;
          }
          .auth-error {
            background: rgba(239, 68, 68, 0.1);
            color: #fca5a5;
            padding: 0.75rem 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid rgba(239, 68, 68, 0.2);
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
        <h1 className="welcome-title">Operative Control Deck // {currentUser.name.toUpperCase()}</h1>
        <p className="welcome-subtitle">Credentials verified. Accessing main-grid booking histories and security codes.</p>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Side: Profile Info Card */}
        <div className="profile-info-column">
          <div className="info-card glass-card">
            <div className="avatar-section">
              <div className="avatar-circle">
                <Terminal size={36} />
              </div>
              <h2 className="heading-md user-fullname" style={{ color: 'white' }}>{currentUser.name}</h2>
              <span className="user-role-badge">Level 5 Operative</span>
            </div>

            <hr className="card-divider" style={{ border: '0', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />

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
                <div className="form-actions" style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={updateLoading}>
                    <Save size={14} /> {updateLoading ? 'Saving...' : 'Commit Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="detail-row">
                  <Mail size={18} className="detail-icon" />
                  <div>
                    <span className="detail-label">Secure Contact Email</span>
                    <p className="detail-val">{currentUser.email}</p>
                  </div>
                </div>

                <div className="detail-row">
                  <Phone size={18} className="detail-icon" />
                  <div>
                    <span className="detail-label">Secured Phone line</span>
                    <p className="detail-val">{currentUser.phone}</p>
                  </div>
                </div>

                <button onClick={() => { setIsEditing(true); setUpdateSuccess(''); setUpdateError(''); }} className="btn btn-secondary edit-profile-btn">
                  <Edit2 size={14} /> Reconfigure Credentials
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Travel Bookings History (SHOWCASE AS PREMIUM ELITE STICKER PASSES GALLERY) */}
        <div className="bookings-history-column">
          <div className="history-card glass-card" style={{ padding: '2.5rem' }}>
            <h2 className="heading-md history-card-title" style={{ color: 'white', marginBottom: '2rem' }}>
              Reserved Access Passes
            </h2>
            
            {bookings.length === 0 ? (
              <div className="empty-bookings">
                <Calendar size={48} className="empty-icon" />
                <h4 className="heading-sm" style={{ color: '#94a3b8' }}>NO ACTIVE COORDINATES</h4>
                <p>Ready to deploy? Choose your track modules and lock down target seats.</p>
                <button onClick={() => router.push('/book')} className="btn btn-primary">
                  Reserve Access Passes
                </button>
              </div>
            ) : (
              <div className="passes-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '2rem' }}>
                {bookings.map((booking) => (
                  <div key={booking.id} className="elite-pass-sticker-wrapper">
                    <div className={`elite-pass-sticker ${booking.status}`} style={{ padding: '1.75rem 1.25rem' }}>
                      <div className="hologram-shimmer"></div>
                      <div className="pass-watermark-stamp">{booking.status.toUpperCase()}</div>
                      
                      {/* Header */}
                      <div className="pass-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div className="pass-branding" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: '900', color: '#fff' }}>
                          <Terminal size={14} className="pass-logo-icon" style={{ color: booking.status === 'approved' ? '#10b981' : booking.status === 'pending' ? '#f59e0b' : '#ef4444' }} />
                          <span>CYBER<span style={{ color: '#10b981' }}>_STRIKE</span></span>
                        </div>
                        <div className="pass-tier" style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: '800', 
                          border: `1px solid ${booking.status === 'approved' ? 'rgba(16, 185, 129, 0.4)' : booking.status === 'pending' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`, 
                          padding: '0.1rem 0.4rem', 
                          borderRadius: '4px', 
                          background: booking.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : booking.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: booking.status === 'approved' ? '#34d399' : booking.status === 'pending' ? '#fbbf24' : '#fca5a5'
                        }}>
                          ELITE PASS
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="pass-body ticket-cutout" style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', borderBottom: '1px dashed rgba(255,255,255,0.08)', padding: '1rem 0', margin: '0 0 1rem 0' }}>
                        <div className="pass-qr-row" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem' }}>
                          <div className="pass-profile-image" style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto' }}>
                              <path d="M18 21a6 6 0 0 0-12 0" />
                              <circle cx="12" cy="10" r="4" />
                            </svg>
                          </div>
                          <div className="pass-main-details" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1, minWidth: 0 }}>
                            <span className="pass-label" style={{ fontSize: '0.55rem', color: 'var(--muted)', fontWeight: '700' }}>OPERATIVE</span>
                            <span className="pass-value highlight-cyan" style={{ fontSize: '0.85rem', fontWeight: '800', color: '#06b6d4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentUser.name.toUpperCase()}</span>
                            <span className="pass-value highlight-green" style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{booking.busName}</span>
                          </div>
                        </div>

                        <div className="pass-meta-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                          <div className="pass-meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="pass-label" style={{ fontSize: '0.5rem', color: 'var(--muted)', fontWeight: '700' }}>SECTOR AREA</span>
                            <span className="pass-value" style={{ fontSize: '0.7rem', fontWeight: '600', color: '#cbd5e1' }}>{booking.source}</span>
                          </div>
                          <div className="pass-meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="pass-label" style={{ fontSize: '0.5rem', color: 'var(--muted)', fontWeight: '700' }}>ARENA VENUE</span>
                            <span className="pass-value" style={{ fontSize: '0.7rem', fontWeight: '600', color: '#cbd5e1' }}>{booking.destination}</span>
                          </div>
                          <div className="pass-meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="pass-label" style={{ fontSize: '0.5rem', color: 'var(--muted)', fontWeight: '700' }}>ACCESS DATE</span>
                            <span className="pass-value" style={{ fontSize: '0.7rem', fontWeight: '600', color: '#cbd5e1' }}>{booking.date}</span>
                          </div>
                          <div className="pass-meta-item" style={{ display: 'flex', flexDirection: 'column' }}>
                            <span className="pass-label" style={{ fontSize: '0.5rem', color: 'var(--muted)', fontWeight: '700' }}>DESK NODES</span>
                            <span className="pass-value highlight-green" style={{ fontSize: '0.7rem', fontWeight: '800', color: '#10b981' }}>{booking.seats.join(', ')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pass-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div className="pass-status-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                          <span className="pass-label" style={{ fontSize: '0.5rem', color: 'var(--muted)', fontWeight: '700' }}>STATUS CODE</span>
                          <span className={`pass-status-badge ${booking.status}`} style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '900', 
                            color: booking.status === 'approved' ? '#10b981' : booking.status === 'pending' ? '#fbbf24' : '#ef4444'
                          }}>
                            {booking.status === 'approved' ? 'ACCESS GRANTED' : booking.status === 'pending' ? 'PENDING AUDIT' : 'ACCESS DENIED'}
                          </span>
                        </div>
                        
                        <div className="barcode-container" style={{ margin: '0' }}>
                          <div className="barcode-lines" style={{ height: '18px', width: '70px', padding: '1px' }}>
                            <span style={{ width: '1px', background: '#475569' }}></span>
                            <span style={{ width: '2px', background: '#475569' }}></span>
                            <span style={{ width: '1px', background: '#475569' }}></span>
                            <span style={{ width: '3px', background: '#475569' }}></span>
                            <span style={{ width: '1px', background: '#475569' }}></span>
                            <span style={{ width: '4px', background: '#475569' }}></span>
                            <span style={{ width: '1px', background: '#475569' }}></span>
                          </div>
                          <span style={{ fontSize: '0.5rem', color: 'var(--muted-light)', fontFamily: 'var(--font-mono)' }}>#{booking.id.substring(3, 9).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
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
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 2rem 2.5rem;
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-sm);
        }
        .welcome-title {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 900;
          color: var(--primary);
          margin-bottom: 0.5rem;
          line-height: 1.2;
          text-shadow: 0 0 10px var(--primary-glow);
        }
        .welcome-subtitle {
          color: #94a3b8;
          font-size: 1rem;
          font-weight: 500;
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
          background: rgba(8, 12, 22, 0.85);
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
          border: 1px solid rgba(16, 185, 129, 0.25);
          box-shadow: 0 0 15px var(--primary-glow);
        }

        .user-fullname {
          font-weight: 700;
          color: white;
        }

        .user-role-badge {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--primary);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
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
          color: var(--primary);
          margin-top: 0.125rem;
        }

        .detail-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .detail-val {
          font-weight: 600;
          color: white;
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

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .update-success-alert {
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          border: 1px solid rgba(16, 185, 129, 0.25);
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
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.25);
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
          background: rgba(8, 12, 22, 0.85);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
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
      `}</style>
    </div>
  );
}
