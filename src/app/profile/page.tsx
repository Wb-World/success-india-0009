'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Calendar, ShieldAlert, CheckCircle, Clock, Save, Bell, X, Download, QrCode } from 'lucide-react';
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

// ─── Single Booking Card ──────────────────────────────────────────────────────
function BookingCard({ booking, onViewMore }: { booking: any; onViewMore: (b: any) => void }) {
  const status = booking.status || 'pending';
  return (
    <div className={`bk-card bk-card-${status}`}>
      <div className="bk-card-top">
        <div className="bk-card-left">
          <span className="bk-ref-label">Booking Ref</span>
          <span className="bk-ref-id">#{booking.id?.slice(0, 8).toUpperCase()}</span>
          <span className="bk-date-created">{new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>
        <div className="bk-card-right">
          <span className={`bk-status-badge ${getStatusClass(status)}`}>
            {status === 'approved' && <CheckCircle size={12} />}
            {(status === 'pending' || !status) && <Clock size={12} />}
            {status === 'denied' && <ShieldAlert size={12} />}
            {getStatusLabel(status)}
          </span>
        </div>
      </div>
      <div className="bk-card-body">
        <p className="bk-event-name">{booking.seminarName || booking.eventName || '—'}</p>
        <div className="bk-meta-row">
          <span className="bk-meta-item"><Calendar size={12} /> {booking.date}</span>
          <span className="bk-meta-item">₹{booking.totalPrice}</span>
          <span className="bk-meta-item">{booking.seats?.length} Seat{booking.seats?.length > 1 ? 's' : ''}</span>
        </div>
      </div>
      <div className="bk-card-footer">
        <button className="bk-view-more-btn" onClick={() => onViewMore(booking)}>
          <QrCode size={14} /> View Details &amp; Ticket
        </button>
      </div>
    </div>
  );
}

// ─── Booking Detail Modal ─────────────────────────────────────────────────────
function BookingModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  const [qrUrl, setQrUrl] = useState('');
  const [downloading, setDownloading] = useState(false);
  const status = booking.status || 'pending';

  useEffect(() => {
    // QR code encodes the secure verification URL — not raw booking data
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const verifyUrl = `${origin}/verify?id=${encodeURIComponent(booking.id)}`;
    generateQRDataURL(verifyUrl).then(setQrUrl);
  }, [booking]);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadTicket(booking, qrUrl);
    setDownloading(false);
  };

  // Attendee extraction helpers
  const attendeeEntries = booking.attendees ? Object.entries(booking.attendees) : [];

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="modal-sheet animate-slide-up" role="dialog" aria-modal="true">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>

        <div className="modal-inner">
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">🎫 Booking Details</h2>
            <span className={`bk-status-badge ${getStatusClass(status)}`}>
              {status === 'approved' && <CheckCircle size={13} />}
              {(status === 'pending' || !status) && <Clock size={13} />}
              {status === 'denied' && <ShieldAlert size={13} />}
              {getStatusLabel(status)}
            </span>
          </div>

          <div className="modal-body">
            {/* Left: Details */}
            <div className="modal-details-col">
              <div className="detail-grid">
                <DetailRow label="Booking Reference" value={`#${booking.id?.toUpperCase()}`} mono />
                <DetailRow label="Event Name" value={booking.seminarName || booking.eventName || '—'} />
                <DetailRow label="Venue" value={booking.venue || '—'} />
                <DetailRow label="Session" value={booking.seminar || '—'} />
                <DetailRow label="Date" value={booking.date || '—'} />
                <DetailRow label="Time" value={booking.time || '—'} />
                <DetailRow label="Seats" value={booking.seats?.join(', ') || '—'} />
                <DetailRow label="Amount Paid" value={`₹${booking.totalPrice}`} highlight />
                <DetailRow label="Booked On" value={new Date(booking.createdAt).toLocaleString('en-IN')} />
              </div>

              {attendeeEntries.length > 0 && (
                <div className="attendee-section">
                  <h4 className="attendee-title">Attendee Details</h4>
                  {attendeeEntries.map(([seat, val]: any) => {
                    const name = typeof val === 'object' && val !== null ? val.name : val;
                    const phone = typeof val === 'object' && val !== null ? val.phone : '';
                    return (
                      <div key={seat} className="attendee-item">
                        <span className="attendee-seat">{seat}</span>
                        <span className="attendee-name">{name}</span>
                        {phone && <span className="attendee-phone">📞 {phone}</span>}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                className="btn-download-ticket"
                onClick={handleDownload}
                disabled={downloading || !qrUrl}
              >
                <Download size={16} />
                {downloading ? 'Preparing...' : 'Download Ticket'}
              </button>
            </div>

            {/* Right: QR Code */}
            <div className="modal-qr-col">
              <div className="qr-card">
                <p className="qr-label">Scan for Verification</p>
                {qrUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrUrl} alt="QR Code" className="qr-img" />
                ) : (
                  <div className="qr-placeholder"><QrCode size={64} /></div>
                )}
                <p className="qr-booking-id">#{booking.id?.slice(0, 8).toUpperCase()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Ticket Render (for html2canvas) */}
      <TicketRender booking={booking} qrUrl={qrUrl} />
    </>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="detail-row-item">
      <span className="detail-row-label">{label}</span>
      <span className={`detail-row-value${mono ? ' mono' : ''}${highlight ? ' highlight' : ''}`}>{value}</span>
    </div>
  );
}

// ─── Hidden ticket for download ───────────────────────────────────────────────
function TicketRender({ booking, qrUrl }: { booking: any; qrUrl: string }) {
  const status = booking.status || 'pending';
  const statusColor = status === 'approved' ? '#059669' : status === 'denied' ? '#dc2626' : '#d97706';
  return (
    <div
      id={`ticket-render-${booking.id}`}
      style={{
        display: 'none',
        position: 'fixed',
        top: '-9999px',
        left: '-9999px',
        width: '620px',
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 0 0 2px #e2e8f0',
      }}
    >
      {/* Ticket Header */}
      <div style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: 'white', fontWeight: 800, fontSize: '20px', letterSpacing: '-0.5px' }}>SUCCESS TEAM</div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginTop: '2px' }}>Event Booking Ticket</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(255,255,255,0.3)', color: statusColor === '#059669' ? '#ecfdf5' : statusColor === '#dc2626' ? '#fee2e2' : '#fef3c7' }}>
          {getStatusLabel(status)}
        </div>
      </div>

      {/* Ticket Body */}
      <div style={{ padding: '28px 32px', display: 'flex', gap: '24px' }}>
        {/* Details */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b', marginBottom: '16px', lineHeight: 1.3 }}>
            {booking.seminarName || booking.eventName}
          </div>
          {[
            ['Booking ID', `#${booking.id?.slice(0, 8).toUpperCase()}`],
            ['Venue', booking.venue],
            ['Session', booking.seminar],
            ['Date', booking.date],
            ['Time', booking.time],
            ['Seats', booking.seats?.join(', ')],
            ['Amount Paid', `₹${booking.totalPrice}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>{v || '—'}</span>
            </div>
          ))}
          {/* Attendees */}
          {booking.attendees && Object.keys(booking.attendees).length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Attendees</div>
              {Object.entries(booking.attendees).map(([seat, val]: any) => {
                const name = typeof val === 'object' && val !== null ? val.name : val;
                const phone = typeof val === 'object' && val !== null ? val.phone : '';
                return (
                  <div key={seat} style={{ fontSize: '12px', color: '#047857', marginBottom: '3px' }}>
                    <strong>{seat}:</strong> {name} {phone ? `(${phone})` : ''}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingLeft: '24px', borderLeft: '2px dashed #e2e8f0' }}>
          {qrUrl && <img src={qrUrl} alt="QR" style={{ width: '140px', height: '140px' }} />}
          <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>Scan to verify</div>
        </div>
      </div>

      {/* Ticket Footer */}
      <div style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Booked on {new Date(booking.createdAt).toLocaleDateString('en-IN')}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: statusColor }}>{getStatusLabel(status).toUpperCase()}</span>
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
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', name: '', email: '', phone: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile edit states
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'bookings' | 'notifications' | 'settings'>('bookings');
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    if (tabParam === 'notifications' || tabParam === 'settings' || tabParam === 'bookings') {
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
        setEditForm({ name: data.user.name, email: data.user.email, phone: data.user.phone });
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
        localStorage.setItem('user', JSON.stringify(data.user));
        setCurrentUser(data.user);
        window.dispatchEvent(new Event('auth-change'));
        if (data.user.role === 'admin') { router.push('/admin/dashboard'); }
        else { fetchProfileData(); const cb = getSafeCallbackUrl(); if (cb) router.push(cb); }
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

  const handleTabChange = (tabName: 'bookings' | 'notifications' | 'settings') => {
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
        <style jsx>{`
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
                <div className="form-group"><label className="form-label">Email Address</label><input type="email" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="john@example.com" className="form-control" required /></div>
                <div className="form-group"><label className="form-label">Phone Number</label><input type="text" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="+91 98765 43210" className="form-control" required /></div>
                <button type="submit" className="btn btn-primary auth-submit-btn" disabled={authLoading}>{authLoading ? 'Creating Account...' : 'Register Profile'}</button>
              </form>
            )}
          </div>
        </div>
        <style jsx>{`
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
                <Mail size={18} className="detail-icon" />
                <div><span className="detail-label">Email ID</span><p className="detail-val">{currentUser.email}</p></div>
              </div>
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
              <button type="button" className={`sidebar-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabChange('settings')}><span>⚙️ Account Settings</span></button>
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
            <button type="button" className={`mobile-tab-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => handleTabChange('settings')}>⚙️ Settings</button>
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
                        {currentBookings.map(b => <BookingCard key={b.id} booking={b} onViewMore={setSelectedBooking} />)}
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
                        {previousBookings.map(b => <BookingCard key={b.id} booking={b} onViewMore={setSelectedBooking} />)}
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

          {/* TAB 3: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="history-card glass-card">
              <h2 className="heading-md history-card-title">⚙️ Account Settings</h2>
              {updateSuccess && (<div className="update-success-alert animate-slide-up" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}><CheckCircle size={16} /> <span>{updateSuccess}</span></div>)}
              {updateError && (<div className="update-error-alert animate-slide-up" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}><ShieldAlert size={16} /> <span>{updateError}</span></div>)}
              <form onSubmit={handleProfileUpdate} className="profile-edit-form settings-edit-form" style={{ marginTop: '1.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}><label className="form-label"><User size={14} style={{ marginRight: '4px' }} /> Full Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="form-control" required /></div>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}><label className="form-label"><Mail size={14} style={{ marginRight: '4px' }} /> Email Address</label><input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="form-control" required /></div>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}><label className="form-label"><Phone size={14} style={{ marginRight: '4px' }} /> Phone Number</label><input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="form-control" required /></div>
                <div className="form-actions" style={{ maxWidth: '200px' }}>
                  <button type="submit" className="btn btn-primary" disabled={updateLoading}><Save size={14} style={{ marginRight: '4px' }} /> {updateLoading ? 'Saving...' : 'Save Changes'}</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {selectedBooking && <BookingModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />}

      <style jsx>{`
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
        .profile-sidebar-tabs { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
        .sidebar-tab-btn { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0.8rem 1rem; border-radius: var(--radius-lg); font-weight: 600; font-size: 0.95rem; color: var(--muted); background: transparent; border: 1px solid transparent; text-align: left; cursor: pointer; transition: all 0.15s; }
        .sidebar-tab-btn:hover { background-color: var(--input); color: var(--foreground); }
        .sidebar-tab-btn.active { background-color: var(--primary-light); color: var(--primary-dark); border-color: rgba(16,185,129,0.2); }
        .tab-unread-count { background-color: #10b981; color: white; font-size: 0.75rem; font-weight: 700; padding: 0.15rem 0.5rem; border-radius: 9999px; line-height: 1; }

        /* ── Mobile Tabs ───────────────────────────────────────────── */
        .mobile-tabs-bar { display: none; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; }
        .mobile-tab-item { display: flex; align-items: center; justify-content: center; gap: 0.25rem; padding: 0.75rem 0.5rem; font-size: 0.85rem; font-weight: 600; border-radius: var(--radius-lg); color: var(--muted); background: white; border: 1px solid var(--border); cursor: pointer; transition: all 0.15s; }
        .mobile-tab-item.active { background-color: var(--primary-light); color: var(--primary-dark); border-color: rgba(16,185,129,0.2); }
        .mobile-tab-item .mobile-unread-badge { background-color: #10b981; color: white; font-size: 0.7rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 9999px; margin-left: 0.25rem; }
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

        /* ── Booking Cards ──────────────────────────────────────────── */
        .booking-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 1rem; }
        @media (max-width: 640px) { .booking-cards-grid { grid-template-columns: 1fr; } }

        .bk-card { background: white; border: 1.5px solid #e2e8f0; border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .bk-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .bk-card-approved { border-left: 4px solid #10b981; }
        .bk-card-pending { border-left: 4px solid #f59e0b; }
        .bk-card-denied { border-left: 4px solid #ef4444; }

        .bk-card-top { display: flex; align-items: flex-start; justify-content: space-between; padding: 1rem 1.125rem 0.75rem; gap: 0.5rem; }
        .bk-card-left { display: flex; flex-direction: column; gap: 2px; }
        .bk-ref-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
        .bk-ref-id { font-family: var(--font-heading), monospace; font-size: 0.95rem; font-weight: 800; color: #1e293b; }
        .bk-date-created { font-size: 0.72rem; color: #94a3b8; }

        .bk-card-body { padding: 0 1.125rem 0.875rem; flex: 1; }
        .bk-event-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; line-height: 1.35; }
        .bk-meta-row { display: flex; gap: 1rem; flex-wrap: wrap; }
        .bk-meta-item { font-size: 0.76rem; color: #64748b; display: flex; align-items: center; gap: 3px; font-weight: 500; }

        .bk-card-footer { padding: 0.75rem 1.125rem; border-top: 1px solid #f1f5f9; background: #fafafa; }
        .bk-view-more-btn { display: flex; align-items: center; gap: 6px; width: 100%; justify-content: center; padding: 0.55rem 1rem; background: linear-gradient(135deg, #059669, #10b981); color: white; border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s ease, transform 0.15s ease; letter-spacing: 0.01em; }
        .bk-view-more-btn:hover { opacity: 0.9; transform: scale(0.98); }

        /* Status badges */
        .bk-status-badge { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; }
        .badge-approved { background: #d1fae5; color: #065f46; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-denied { background: #fee2e2; color: #991b1b; }

        /* ── Modal ──────────────────────────────────────────────────── */
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.55); backdrop-filter: blur(4px); z-index: 1000; }
        .modal-sheet { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: min(96vw, 860px); max-height: 90vh; overflow-y: auto; background: white; border-radius: 20px; box-shadow: 0 24px 64px rgba(0,0,0,0.25); z-index: 1001; }
        @media (max-width: 640px) { .modal-sheet { top: auto; left: 0; right: 0; bottom: 0; transform: none; width: 100%; max-height: 92vh; border-radius: 20px 20px 0 0; } }

        .modal-close-btn { position: absolute; top: 14px; right: 14px; background: #f1f5f9; border: none; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: background 0.15s; z-index: 2; }
        .modal-close-btn:hover { background: #e2e8f0; color: #1e293b; }

        .modal-inner { padding: 2rem; }
        @media (max-width: 640px) { .modal-inner { padding: 1.5rem 1.125rem; } }

        .modal-header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 1.75rem; flex-wrap: wrap; }
        .modal-title { font-family: var(--font-heading); font-size: 1.3rem; font-weight: 800; color: #1e293b; margin: 0; }

        .modal-body { display: grid; grid-template-columns: 1fr 200px; gap: 2rem; }
        @media (max-width: 640px) { .modal-body { grid-template-columns: 1fr; } }

        /* Detail rows */
        .detail-grid { display: flex; flex-direction: column; gap: 0.75rem; }
        .detail-row-item { display: flex; justify-content: space-between; gap: 1rem; align-items: baseline; padding-bottom: 0.6rem; border-bottom: 1px solid #f1f5f9; }
        .detail-row-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; flex-shrink: 0; }
        .detail-row-value { font-size: 0.9rem; font-weight: 600; color: #1e293b; text-align: right; }
        .detail-row-value.mono { font-family: monospace; font-size: 0.82rem; }
        .detail-row-value.highlight { color: #059669; font-size: 1.05rem; font-weight: 800; }

        /* Attendees */
        .attendee-section { margin-top: 1.25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; }
        .attendee-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 0.75rem; }
        .attendee-item { display: flex; gap: 0.75rem; align-items: baseline; padding: 0.4rem 0; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
        .attendee-item:last-child { border-bottom: none; }
        .attendee-seat { background: #d1fae5; color: #065f46; font-size: 0.72rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
        .attendee-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
        .attendee-phone { font-size: 0.8rem; color: #64748b; }

        /* Download button */
        .btn-download-ticket { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 1.5rem; padding: 0.75rem 1rem; background: linear-gradient(135deg, #1e293b, #334155); color: white; border: none; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s, transform 0.15s; }
        .btn-download-ticket:hover { opacity: 0.88; transform: scale(0.98); }
        .btn-download-ticket:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

        /* QR code column */
        .modal-qr-col { display: flex; align-items: flex-start; justify-content: center; }
        .qr-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 1.25rem; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; width: 100%; }
        .qr-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; text-align: center; }
        .qr-img { width: 150px; height: 150px; border-radius: 10px; }
        .qr-placeholder { width: 150px; height: 150px; display: flex; align-items: center; justify-content: center; background: #e2e8f0; border-radius: 10px; color: #94a3b8; }
        .qr-booking-id { font-family: monospace; font-size: 0.75rem; font-weight: 700; color: #475569; }

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
        <style jsx>{`
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
