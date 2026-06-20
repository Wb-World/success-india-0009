'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Phone, Calendar, ShieldAlert, CheckCircle, Clock, Save, Bell, X, Download, QrCode } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ─── QR Code generator (browser-only via qrcode lib) ─────────────────────────
async function generateQRDataURL(text: string): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
  } catch {
    return '';
  }
}

// ─── Download ticket using html2canvas ───────────────────────────────────────
async function downloadTicket(booking: any, qrDataUrl: string) {
  const html2canvas = (await import('html2canvas')).default;
  const el = document.getElementById(`ticket-render-${booking.id}`);
  if (!el) return;
  el.style.display = 'block';
  await new Promise(r => setTimeout(r, 100));
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  el.style.display = 'none';
  const link = document.createElement('a');
  link.download = `ticket-${booking.id}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function getStatusLabel(status: string) {
  if (status === 'approved') return 'Confirmed';
  if (status === 'denied') return 'Rejected';
  return 'Pending Verification';
}
function getStatusClass(status: string) {
  if (status === 'approved') return 'badge-approved';
  if (status === 'denied') return 'badge-denied';
  return 'badge-pending';
}

// ─── Single Booking Card (Redesigned Text-Only Card) ────────────────────────
function BookingCard({ booking }: { booking: any }) {
  const router = useRouter();
  const status = booking.status || 'pending';

  return (
    <div className={`bk-horizontal-card status-${status}`}>
      <div className="bk-card-info-wrap">
        <div className="bk-card-title-row">
          <h3 className="bk-card-event-name">{booking.seminarName || booking.eventName || '—'}</h3>
        </div>
        
        <div className="bk-card-details-list">
          <div className="bk-card-detail-item">
            <span className="bk-detail-lbl">Booking Ref:</span>
            <span className="bk-detail-val font-mono">{booking.id?.toUpperCase()}</span>
          </div>
          <div className="bk-card-detail-item">
            <span className="bk-detail-lbl">Date:</span>
            <span className="bk-detail-val">{booking.date || '—'}</span>
          </div>
          <div className="bk-card-detail-item">
            <span className="bk-detail-lbl">Time:</span>
            <span className="bk-detail-val">{booking.time || '—'}</span>
          </div>
          <div className="bk-card-detail-item">
            <span className="bk-detail-lbl">Seats:</span>
            <span className="bk-detail-val">{booking.seats?.join(', ') || '—'}</span>
          </div>
          <div className="bk-card-detail-item">
            <span className="bk-detail-lbl">Amount:</span>
            <span className="bk-detail-val highlight">₹{booking.totalPrice}</span>
          </div>
        </div>

        <div className="bk-card-footer">
          <div className="bk-card-status-side">
            <span className={`bk-badge-${status}`}>
              {status === 'approved' && <CheckCircle size={13} className="badge-icon" />}
              {(status === 'pending' || !status) && <Clock size={13} className="badge-icon" />}
              {status === 'denied' && <ShieldAlert size={13} className="badge-icon" />}
              {getStatusLabel(status)}
            </span>
          </div>
          <div className="bk-card-btn-side">
            <button 
              className="bk-card-details-btn" 
              onClick={() => router.push(`/profile/bookings/${booking.id}`)}
            >
              View Details →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Profile Component ───────────────────────────────────────────────────
function ProfileDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Login/Register states
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', name: '', phone: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile edit states
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'bookings' | 'notifications'>('bookings');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modal state (deprecated, redirecting to details page instead)

  useEffect(() => {
    if (tabParam === 'notifications' || tabParam === 'bookings') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Realtime subscription
  useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel(`user-bookings-${currentUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `user_id=eq.${currentUser.id}` }, () => fetchProfileData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` }, () => fetchProfileData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id]);

  useEffect(() => { setMounted(true); fetchProfileData(); }, []);

  const getSafeCallbackUrl = () => {
    const callbackUrl = new URLSearchParams(window.location.search).get('callbackUrl');
    if (callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//')) return callbackUrl;
    return '';
  };

  const fetchProfileData = async () => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { setLoading(false); return; }
    try {
      const parsed = JSON.parse(storedUser);
      const res = await fetch('/api/profile', { headers: { 'x-user-id': parsed.id } });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setBookings(data.bookings || []);
        setNotifications(data.notifications || []);
        setEditForm({ name: data.user.name, phone: data.user.phone });
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
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role === 'admin') {
          setAuthError('Admins must log in through the admin portal');
          setAuthLoading(false);
          return;
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        window.dispatchEvent(new Event('auth-change'));
        fetchProfileData();
        const cb = getSafeCallbackUrl();
        if (cb) router.push(cb);
      } else { setAuthError(data.error || 'Login failed'); }
    } catch { setAuthError('A network error occurred'); }
    finally { setAuthLoading(false); }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registerForm) });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        window.dispatchEvent(new Event('auth-change'));
        fetchProfileData();
        const cb = getSafeCallbackUrl(); if (cb) router.push(cb);
      } else { setAuthError(data.error || 'Registration failed'); }
    } catch { setAuthError('A network error occurred'); }
    finally { setAuthLoading(false); }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');
    setUpdateLoading(true);
    try {
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id }, body: JSON.stringify(editForm) });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        setUpdateSuccess('Profile updated successfully!');
      } else { setUpdateError(data.error || 'Failed to update profile'); }
    } catch { setUpdateError('A connection error occurred'); }
    finally { setUpdateLoading(false); }
  };

  const handleTabChange = (tabName: 'bookings' | 'notifications') => {
    setActiveTab(tabName);
    router.push(`/profile?tab=${tabName}`);
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id } });
      if (res.ok) { setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); window.dispatchEvent(new Event('auth-change')); }
    } catch (err) { console.error('Failed to mark notifications read:', err); }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="loading-container container">
        <div className="spinner"></div>
        <p>Retrieving your account profile...</p>
        <style>{`
          .loading-container { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8rem 0; gap:1rem; }
          .spinner { border:4px solid rgba(16,185,129,0.1); border-left-color:var(--primary); width:40px; height:40px; border-radius:50%; animation:spin 1s linear infinite; }
          @keyframes spin { to { transform:rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="auth-page container animate-slide-up">
        <div className="auth-card glass-card">
          <div className="auth-tabs">
            <button className={`auth-tab-btn ${isLoginTab ? 'active' : ''}`} onClick={() => { setIsLoginTab(true); setAuthError(''); }}>Sign In</button>
            <button className={`auth-tab-btn ${!isLoginTab ? 'active' : ''}`} onClick={() => { setIsLoginTab(false); setAuthError(''); }}>Create Account</button>
          </div>
          <div className="auth-form-content">
            {authError && (<div className="auth-error animate-shake"><ShieldAlert size={16} /> <span>{authError}</span></div>)}
            {isLoginTab ? (
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group"><label className="form-label">Username</label><input type="text" value={loginForm.username} onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} placeholder="Enter your username" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} placeholder="Enter your password" className="form-control" required /></div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>{authLoading ? 'Signing In...' : 'Access My Account'}</button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group"><label className="form-label">Username</label><input type="text" value={registerForm.username} onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })} placeholder="Select a username" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Choose a strong password" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Full Name</label><input type="text" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="John Doe" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Phone Number</label><input type="text" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="+91 98765 43210" className="form-control" required /></div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>{authLoading ? 'Creating Account...' : 'Register Profile'}</button>
              </form>
            )}
          </div>
        </div>
        <style>{`
          .auth-page { max-width:480px; padding:3rem 1rem; width:100%; }
          @media (min-width:640px) { .auth-page { padding:5rem 1.5rem; } }
          .auth-card { background:white; border:1px solid var(--border); border-radius:var(--radius-2xl); overflow:hidden; box-shadow:var(--shadow-xl); }
          .auth-tabs { display:flex; background:var(--input); border-bottom:1px solid var(--border); }
          .auth-tab-btn { flex:1; padding:1rem; background:none; border:none; cursor:pointer; font-family:var(--font-heading); font-weight:600; font-size:0.95rem; color:var(--muted); transition:all var(--transition-fast); }
          .auth-tab-btn.active { background:white; color:var(--primary-dark); box-shadow:0 -2px 0 0 var(--primary) inset; }
          .auth-form-content { padding:1.5rem 1.25rem; }
          @media (min-width:640px) { .auth-form-content { padding:2.5rem 2rem; } }
          .auth-error { background:#fee2e2; color:#b91c1c; padding:0.75rem 1rem; border-radius:var(--radius-md); margin-bottom:1.5rem; font-size:0.9rem; font-weight:500; display:flex; align-items:center; gap:0.5rem; }
          .auth-submit-btn { width:100%; padding:0.875rem; margin-top:1rem; font-size:1.05rem; }
          @keyframes shake { 0%,100% { transform:translateX(0); } 20%,60% { transform:translateX(-4px); } 40%,80% { transform:translateX(4px); } }
          .animate-shake { animation:shake 0.4s ease; }
        `}</style>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const currentBookings = bookings.filter(b => b.date >= todayStr);
  const previousBookings = bookings.filter(b => b.date < todayStr);

  return (
    <div className="profile-dashboard container animate-fade-in">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-banner animate-slide-down">
        <h1 className="welcome-title">Welcome back, {currentUser.name}! 👋</h1>
        <p className="welcome-subtitle">Welcome to your Success Team Member Portal. Track your seminar registrations, event approvals, and manage your profile.</p>
      </div>

      <div className="dashboard-grid">
        {/* Left: Profile Card */}
        <div className="profile-info-column">
          <div className="info-card glass-card hover-lift">
            <div className="avatar-section">
              <div className="avatar-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="member-logo" />
              </div>
              <h2 className="heading-md user-fullname">{currentUser.name}</h2>
              <span className="user-role-badge">Official Delegate</span>
            </div>

            <hr className="card-divider" />

            <div className="profile-details">
              <div className="detail-row">
                <Phone size={18} className="detail-icon" />
                <div><span className="detail-label">Phone Number</span><p className="detail-val">{currentUser.phone}</p></div>
              </div>
            </div>

            <hr className="card-divider" />

            <div className="profile-sidebar-tabs">
              <button type="button" className={`sidebar-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => handleTabChange('bookings')}><span>🎫 My Bookings</span></button>
              <button type="button" className={`sidebar-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
                <span>🔔 Notifications</span>
                {notifications.filter(n => !n.isRead).length > 0 && <span className="tab-unread-count">{notifications.filter(n => !n.isRead).length}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Tab Contents */}
        <div className="bookings-history-column">
          {/* Mobile Tab Bar */}
          <div className="mobile-tabs-bar">
            <button type="button" className={`mobile-tab-item ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => handleTabChange('bookings')}>🎫 Bookings</button>
            <button type="button" className={`mobile-tab-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => handleTabChange('notifications')}>
              🔔 Alerts {notifications.filter(n => !n.isRead).length > 0 && <span className="mobile-unread-badge">{notifications.filter(n => !n.isRead).length}</span>}
            </button>
          </div>

          {/* TAB 1: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="history-card glass-card">
              <h2 className="heading-md history-card-title">My Event Bookings</h2>

              {/* Stats */}
              <div className="bookings-stats-grid">
                <div className="stat-box"><span className="stat-num">{bookings.length}</span><span className="stat-label">Total</span></div>
                <div className="stat-box confirmed"><span className="stat-num">{bookings.filter(b => b.status === 'approved').length}</span><span className="stat-label">Confirmed</span></div>
                <div className="stat-box pending"><span className="stat-num">{bookings.filter(b => b.status === 'pending' || !b.status).length}</span><span className="stat-label">Pending</span></div>
              </div>

              {bookings.length === 0 ? (
                <div className="empty-bookings">
                  <Calendar size={48} className="empty-icon" />
                  <h4 className="heading-sm">No Seminars Reserved Yet</h4>
                  <p>Ready to scale your business? Reserve seats for an upcoming Success Team event now.</p>
                  <button onClick={() => router.push('/book')} className="btn btn-primary">Explore Upcoming Events</button>
                </div>
              ) : (
                <div className="bookings-split-sections">
                  {/* Current */}
                  <div className="bookings-section-group">
                    <h3 className="section-group-title">Current Bookings</h3>
                    {currentBookings.length === 0 ? (
                      <p className="no-bookings-text">No active upcoming bookings.</p>
                    ) : (
                      <div className="booking-cards-grid">
                        {currentBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                      </div>
                    )}
                  </div>

                  {/* Previous */}
                  <div className="bookings-section-group" style={{ marginTop: '3.5rem' }}>
                    <h3 className="section-group-title">Previous Bookings</h3>
                    {previousBookings.length === 0 ? (
                      <p className="no-bookings-text">No previous bookings history.</p>
                    ) : (
                      <div className="booking-cards-grid">
                        {previousBookings.map(b => <BookingCard key={b.id} booking={b} />)}
                      </div>
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
                  <button type="button" onClick={handleMarkAllRead} className="btn btn-secondary btn-sm mark-all-read-btn">Mark all as read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="empty-bookings"><Bell size={48} className="empty-icon" /><h4 className="heading-sm">No Notifications</h4><p>You have no notification alerts at this time.</p></div>
              ) : (
                <div className="notif-list-container" style={{ marginTop: '1.5rem' }}>
                  {notifications.map((notif) => (
                    <div key={notif.id} className={`notif-item-card ${!notif.isRead ? 'unread' : ''}`}>
                      {!notif.isRead && <span className="unread-dot-indicator" />}
                      <div className="notif-content-area">
                        <h4 className="notif-item-title">{notif.title}</h4>
                        <p className="notif-item-message">{notif.message}</p>
                        <span className="notif-item-time">{new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal (removed since details render in a separate route) */}

      <style>{`
        /* ── Layout ─────────────────────────────────────────────────── */
        .profile-dashboard { padding: 4rem 1.5rem; }
        @media (max-width: 640px) {
          .profile-dashboard { padding: 2.5rem 1rem; }
          .dashboard-welcome-banner { padding: 1.25rem 1rem; margin-bottom: 1.75rem; }
          .info-card, .history-card { padding: 1.5rem 1rem; }
          .card-divider { margin: 1.5rem 0; }
          .form-actions { flex-direction: column; }
          .form-actions button { width: 100%; }
          .empty-bookings { padding: 2.5rem 1rem; }
          .history-card-title { margin-bottom: 1.25rem; }
          .bookings-stats-grid { grid-template-columns: 1fr; gap: 0.75rem; }
          .stat-box { padding: 1rem; }
        }

        .dashboard-welcome-banner { margin-bottom: 2.5rem; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 1px solid rgba(16,185,129,0.25); padding: 1.25rem 1.5rem; border-radius: var(--radius-2xl); box-shadow: var(--shadow-sm); }
        @media (min-width: 640px) { .dashboard-welcome-banner { padding: 2rem 2.5rem; } }
        .welcome-title { font-family: var(--font-heading); font-size: clamp(1.4rem,5vw,2.2rem); font-weight: 800; color: var(--primary-dark); margin-bottom: 0.5rem; line-height: 1.2; }
        .welcome-subtitle { color: #065f46; font-size: clamp(0.9rem,2.5vw,1.05rem); font-weight: 500; line-height: 1.5; }

        .dashboard-grid { display: grid; grid-template-columns: 1fr; gap: 2.5rem; align-items: start; }
        @media (min-width: 992px) { .dashboard-grid { grid-template-columns: 0.8fr 1.2fr; } }

        /* ── Profile Left ──────────────────────────────────────────── */
        .info-card { padding: 2.5rem 2rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-2xl); }
        .avatar-section { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
        .avatar-square { width: 120px; height: 120px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; border: 2px solid rgba(16,185,129,0.2); box-shadow: var(--shadow-sm); overflow: hidden; }
        .member-logo { width: 100%; height: 100%; object-fit: cover; }
        .user-fullname { font-weight: 700; color: var(--foreground); }
        .user-role-badge { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--primary-dark); background: #d1fae5; padding: 0.25rem 0.625rem; border-radius: 9999px; }
        .card-divider { border: 0; border-top: 1px solid var(--border); margin: 2rem 0; }
        .profile-details { display: flex; flex-direction: column; gap: 1.5rem; }
        .detail-row { display: flex; gap: 1rem; align-items: flex-start; }
        .detail-icon { color: var(--muted-light); margin-top: 0.125rem; }
        .detail-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .detail-val { font-weight: 600; color: var(--foreground); font-size: 1rem; }

        /* ── Sidebar Tabs ──────────────────────────────────────────── */
        .profile-sidebar-tabs { display: flex; flex-direction: column; gap: 0.65rem; margin-top: 0.5rem; }
        .sidebar-tab-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.9rem 1.25rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--muted);
          background: white;
          border: 1px solid rgba(22, 163, 74, 0.1);
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }
        .sidebar-tab-btn:hover {
          background-color: #f0fdf4;
          color: var(--primary);
          border-color: rgba(22, 163, 74, 0.25);
          transform: translateX(4px);
        }
        .sidebar-tab-btn.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #059669;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }
        .tab-unread-count {
          background-color: #ef4444;
          color: white;
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          line-height: 1;
        }
        .sidebar-tab-btn.active .tab-unread-count {
          background-color: white;
          color: #ef4444;
        }

        /* ── Mobile Tabs ───────────────────────────────────────────── */
        .mobile-tabs-bar { display: none; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; }
        .mobile-tab-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 0.85rem 0.75rem;
          font-size: 0.9rem;
          font-weight: 700;
          border-radius: var(--radius-lg);
          color: var(--muted);
          background: white;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: var(--shadow-sm);
        }
        .mobile-tab-item:hover {
          color: var(--primary);
          border-color: rgba(22, 163, 74, 0.25);
        }
        .mobile-tab-item.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #059669;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }
        .mobile-tab-item .mobile-unread-badge {
          background-color: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 800;
          padding: 0.1rem 0.35rem;
          border-radius: 9999px;
          margin-left: 0.25rem;
        }
        .mobile-tab-item.active .mobile-unread-badge {
          background-color: white;
          color: #ef4444;
        }
        @media (max-width: 991px) { .mobile-tabs-bar { display: grid; } .profile-sidebar-tabs { display: none; } }

        /* ── Stats ─────────────────────────────────────────────────── */
        .bookings-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; margin-top: 1.5rem; }
        .stat-box { background: var(--input); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.25rem; text-align: center; display: flex; flex-direction: column; gap: 0.25rem; }
        .stat-num { font-family: var(--font-heading); font-size: 1.8rem; font-weight: 800; color: var(--foreground); }
        .stat-label { font-size: 0.75rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-box.confirmed { background: #ecfdf5; border-color: #a7f3d0; }
        .stat-box.confirmed .stat-num { color: var(--primary-dark); }
        .stat-box.pending { background: #fffbeb; border-color: #fde68a; }
        .stat-box.pending .stat-num { color: #b45309; }

        /* ── Booking Cards Redesign ─────────────────────────────────── */
        /* ── Booking Cards Redesign ─────────────────────────────────── */
        .booking-cards-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.25rem; }

        .bk-horizontal-card {
          display: flex;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s ease;
          position: relative;
        }
        .bk-horizontal-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .bk-horizontal-card.status-approved { border-left: 5px solid #10b981; }
        .bk-horizontal-card.status-pending { border-left: 5px solid #f59e0b; }
        .bk-horizontal-card.status-denied { border-left: 5px solid #ef4444; }
        .bk-horizontal-card.status-approved:hover { border-color: rgba(16,185,129,0.5); }
        .bk-horizontal-card.status-pending:hover { border-color: rgba(245,158,11,0.5); }
        .bk-horizontal-card.status-denied:hover { border-color: rgba(239,68,68,0.5); }

        .bk-card-info-wrap {
          flex: 1;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .bk-card-title-row {
          margin-bottom: 0.25rem;
        }
        .bk-card-event-name {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--foreground);
          margin: 0;
          line-height: 1.3;
        }

        .bk-card-details-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .bk-card-detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
        }
        .bk-detail-lbl {
          color: var(--muted);
          font-weight: 500;
          min-width: 120px;
        }
        .bk-detail-val {
          color: var(--foreground);
          font-weight: 600;
        }
        .bk-detail-val.highlight {
          color: #059669;
          font-weight: 800;
        }

        .bk-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid var(--border);
        }

        .bk-card-details-btn {
          font-size: 0.9rem;
          padding: 0.6rem 1.5rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          border: none;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
          transition: transform 0.1s ease, box-shadow 0.15s ease;
          color: white;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .bk-card-details-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
        }

        .bk-badge-approved, .bk-badge-pending, .bk-badge-denied {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          box-shadow: var(--shadow-sm);
        }
        .bk-badge-approved { background: #d1fae5; border: 1.5px solid #6ee7b7; color: #065f46; }
        .bk-badge-pending { background: #fef3c7; border: 1.5px solid #fcd34d; color: #92400e; }
        .bk-badge-denied { background: #fee2e2; border: 1.5px solid #fca5a5; color: #991b1b; }

        @media (max-width: 640px) {
          .bk-card-footer {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .bk-card-btn-side, .bk-card-details-btn {
            width: 100%;
          }
          .bk-card-details-btn {
            justify-content: center;
          }
        }

        /* ── History Card ───────────────────────────────────────────── */
        .history-card { padding: 2.5rem 2rem; background: white; border: 1px solid var(--border); border-radius: var(--radius-2xl); }
        .history-card-title { font-weight: 700; color: var(--foreground); margin-bottom: 2rem; }
        .bookings-section-group { margin-top: 2rem; }
        .section-group-title { font-family: var(--font-heading); font-size: 1.1rem; font-weight: 700; color: var(--foreground); margin-bottom: 1rem; border-left: 4px solid var(--primary); padding-left: 0.5rem; }
        .no-bookings-text { font-size: 0.9rem; color: var(--muted); font-style: italic; padding: 0.5rem 0; }

        /* ── Notifications ──────────────────────────────────────────── */
        .notif-header-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
        .mark-all-read-btn { font-size: 0.8rem; padding: 0.4rem 0.8rem; }
        .notif-list-container { display: flex; flex-direction: column; gap: 0.75rem; }
        .notif-item-card { position: relative; background: white; border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 1.25rem 1.5rem; display: flex; gap: 1rem; align-items: flex-start; transition: transform var(--transition-fast), box-shadow var(--transition-fast); }
        .notif-item-card:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .notif-item-card.unread { background: #f0fdf4; border-color: #a7f3d0; }
        .unread-dot-indicator { width: 8px; height: 8px; border-radius: 50%; background: #10b981; flex-shrink: 0; margin-top: 0.4rem; }
        .notif-content-area { display: flex; flex-direction: column; gap: 0.25rem; text-align: left; }
        .notif-item-title { font-weight: 700; font-size: 1rem; color: var(--foreground); margin: 0; }
        .notif-item-message { font-size: 0.92rem; color: var(--muted); line-height: 1.45; margin: 0; }
        .notif-item-time { font-size: 0.75rem; color: var(--muted-light); margin-top: 0.25rem; }

        /* ── Settings ───────────────────────────────────────────────── */
        .profile-edit-form { display: flex; flex-direction: column; gap: 1.25rem; }
        .profile-edit-form .form-group { margin-bottom: 0; }
        .profile-edit-form .form-label { display: flex; align-items: center; gap: 0.25rem; }
        .form-actions { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
        .form-actions button { flex: 1; }
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.85rem; }
        .update-success-alert { background: var(--primary-light); color: var(--primary-dark); padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 500; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
        .update-error-alert { background: #fee2e2; color: #b91c1c; padding: 0.75rem; border-radius: var(--radius-md); font-size: 0.85rem; font-weight: 500; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }

        /* ── Misc ───────────────────────────────────────────────────── */
        .empty-bookings { padding: 4rem 2rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .empty-icon { color: var(--muted-light); }
        .empty-bookings p { color: var(--muted); max-width: 320px; line-height: 1.5; margin-bottom: 0.5rem; }
        .badge-icon { margin-right: 0.25rem; }
      `}</style>
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={
      <div className="loading-container container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
        <style>{`
          .loading-container { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8rem 0; gap:1rem; }
          .spinner { border:4px solid rgba(16,185,129,0.1); border-left-color:#10b981; width:40px; height:40px; border-radius:50%; animation:spin 1s linear infinite; }
          @keyframes spin { to { transform:rotate(360deg); } }
        `}</style>
      </div>
    }>
      <ProfileDashboard />
    </Suspense>
  );
}
