'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, DollarSign, Ticket, Clock, Check, X, LogOut, ArrowRight, Eye, EyeOff, RefreshCw, AlertCircle, CreditCard, Coins, PlusCircle, Settings, User, Copy, MapPin, Calendar, TrendingUp, UserCheck, Activity, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const u = JSON.parse(stored);
          if (u.role === 'admin') {
            return u;
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return null;
  });
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [contribActiveTab, setContribActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [selectedContributionDetail, setSelectedContributionDetail] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState<'registrations' | 'events' | 'configs' | 'contributions'>('registrations');
  const [events, setEvents] = useState<any[]>([]);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventMessage, setEventMessage] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: 'success team Leadership Development Event',
    venue: 'Chromepet, Chennai',
    eventDateTime: '',
    price: '1000',
    totalSeats: '60',
  });

  // Payment configuration settings
  const [upiSettings, setUpiSettings] = useState({ upiId: '', upiName: '', upiQrUrl: '' });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [isUploadingQr, setIsUploadingQr] = useState(false);

  // Statistic counters
  const [stats, setStats] = useState({
    totalRevenue: 0,
    approvedCount: 0,
    pendingCount: 0,
    deniedCount: 0,
  });

  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    verifyAdminAuth();
  }, []);

  const verifyAdminAuth = () => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/admin/login');
      return;
    }

    try {
      const u = JSON.parse(stored);
      if (u.role !== 'admin') {
        router.push('/admin/login');
        return;
      }
      setAdminUser(u);
      fetchAdminBookings(u.id);
      fetchAdminEvents();
      fetchAdminConfigs();
    } catch (e) {
      router.push('/admin/login');
    }
  };

  const fetchAdminBookings = async (adminId: string) => {
    try {
      const res = await fetch('/api/admin/bookings', {
        headers: {
          'x-admin-id': adminId,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const bookingsList = data.bookings || [];
        setBookings(bookingsList);
        calculateStats(bookingsList);
        if (bookingsList.length === 0) {
          setToastMessage({ type: 'error', text: 'Database fetch returned an empty bookings list.' });
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setToastMessage({ type: 'error', text: data.error || 'Failed to fetch bookings from server' });
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('user');
          router.push('/admin/login');
        }
      }
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setToastMessage({ type: 'error', text: `Network error fetching bookings: ${err.message || String(err)}` });
    }
  };

  const calculateStats = (list: any[]) => {
    let rev = 0;
    let app = 0;
    let pend = 0;
    let den = 0;

    list.forEach((b) => {
      if (b.status === 'approved') {
        rev += b.totalPrice;
        app++;
      } else if (b.status === 'pending') {
        pend++;
      } else if (b.status === 'denied') {
        den++;
      }
    });

    setStats({
      totalRevenue: rev,
      approvedCount: app,
      pendingCount: pend,
      deniedCount: den,
    });
  };

  const fetchAdminEvents = async () => {
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching seminar events:', err);
    }
  };

  const fetchAdminConfigs = async () => {
    try {
      const res = await fetch('/api/admin/configs');
      if (res.ok) {
        const data = await res.json();
        const upiId = data.configs.find((c: any) => c.key === 'upi_id')?.value || '';
        const upiName = data.configs.find((c: any) => c.key === 'upi_name')?.value || '';
        const upiQrUrl = data.configs.find((c: any) => c.key === 'upi_qr_url')?.value || '';
        setUpiSettings({ upiId, upiName, upiQrUrl });
      }
    } catch (err) {
      console.error('Error fetching configurations:', err);
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQr(true);
    setSettingsMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/bookings/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setUpiSettings((prev) => ({ ...prev, upiQrUrl: data.url }));
        setSettingsMessage('QR image uploaded successfully. Click Save Settings to persist.');
      } else {
        setSettingsMessage(data.error || 'Failed to upload QR image');
      }
    } catch (err) {
      setSettingsMessage('Error uploading QR image');
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser?.id) return;

    setSettingsLoading(true);
    setSettingsMessage('');

    try {
      const res = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser.id,
        },
        body: JSON.stringify({
          upiId: upiSettings.upiId,
          upiName: upiSettings.upiName,
          upiQrUrl: upiSettings.upiQrUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSettingsMessage('Payment gateway settings saved successfully.');
      } else {
        setSettingsMessage(data.error || 'Failed to save settings');
      }
    } catch (err) {
      setSettingsMessage('Network error saving settings');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handlePublishEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser?.id) return;

    setEventSaving(true);
    setEventMessage('');

    const isEdit = !!editingEventId;
    const url = '/api/events';
    const method = isEdit ? 'PATCH' : 'POST';
    const bodyPayload = {
      title: eventForm.title,
      venue: eventForm.venue,
      eventDateTime: eventForm.eventDateTime,
      price: Number(eventForm.price),
      totalSeats: Number(eventForm.totalSeats || 60),
      ...(isEdit && { eventId: editingEventId }),
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser.id,
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        setEventMessage(data.error || `Failed to ${isEdit ? 'update' : 'publish'} seminar event`);
        return;
      }

      setEventMessage(`Event event ${isEdit ? 'updated' : 'published'} successfully`);
      setEventForm({
        title: 'Success Team Leadership Development Event',
        venue: 'Chromepet, Chennai',
        eventDateTime: '',
        price: '1000',
        totalSeats: '60',
      });
      setEditingEventId(null);
      fetchAdminEvents();
    } catch (err) {
      setEventMessage(`Network error while ${isEdit ? 'updating' : 'publishing'} seminar event`);
    } finally {
      setEventSaving(false);
    }
  };

  const handleEditClick = (event: any) => {
    setEditingEventId(event.id);
    setEventMessage('');

    // Format the eventDateTime for datetime-local input (YYYY-MM-DDThh:mm)
    let formattedDateTime = '';
    if (event.eventDateTime) {
      const d = new Date(event.eventDateTime);
      const offset = d.getTimezoneOffset();
      const localTime = new Date(d.getTime() - offset * 60 * 1000);
      formattedDateTime = localTime.toISOString().slice(0, 16);
    }

    setEventForm({
      title: event.title || event.name,
      venue: event.venue,
      eventDateTime: formattedDateTime,
      price: String(event.price),
      totalSeats: String(event.totalSeats || 60),
    });
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEventMessage('');
    setEventForm({
      title: 'Success Team Leadership Development Event',
      venue: 'Chromepet, Chennai',
      eventDateTime: '',
      price: '1000',
      totalSeats: '60',
    });
  };

  const handleConfirmDelete = async () => {
    if (!selectedEventId || !adminUser?.id) return;

    try {
      const res = await fetch(`/api/events?eventId=${selectedEventId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-id': adminUser.id,
        },
      });

      if (res.ok) {
        fetchAdminEvents();
        if (editingEventId === selectedEventId) {
          handleCancelEdit();
        }
        setDeleteModalOpen(false);
        setSelectedEventId(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete event');
      }
    } catch (err) {
      alert('Network error deleting event');
    }
  };

  const handleStatusUpdate = async (bookingId: string, actionStatus: 'approved' | 'denied') => {
    if (!confirm(`Are you sure you want to mark this booking request as ${actionStatus.toUpperCase()}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser.id,
        },
        body: JSON.stringify({ status: actionStatus }),
      });

      if (res.ok) {
        // Optimistically update status in state
        const updatedList = bookings.map((b) => {
          if (b.id === bookingId) {
            return { ...b, status: actionStatus };
          }
          return b;
        });
        setBookings(updatedList);
        calculateStats(updatedList);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update booking status');
      }
    } catch (err) {
      alert('Network error updating status');
    }
  };

  const handleHomepageVisibilityToggle = async (bookingId: string, currentVisible: boolean) => {
    const nextVisible = !currentVisible;
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser.id,
        },
        body: JSON.stringify({ homepage_visible: nextVisible }),
      });

      if (res.ok) {
        // Optimistically update visibility in state
        const updatedList = bookings.map((b) => {
          if (b.id === bookingId) {
            return { ...b, homepageVisible: nextVisible };
          }
          return b;
        });
        setBookings(updatedList);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update visibility');
      }
    } catch (err) {
      alert('Network error updating visibility');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/admin/login');
  };

  if (!mounted || !adminUser) return null;

  // Separate regular event bookings and supporter contributions
  const eventBookings = bookings.filter((b) => !b.id.startsWith('SUP-') && !(b.seats && b.seats.includes('SUPPORTER')));
  const contributionBookings = bookings.filter((b) => b.id.startsWith('SUP-') || (b.seats && b.seats.includes('SUPPORTER')));

  // Helper to compute stats for a given list of bookings
  const getStatsForList = (list: any[]) => {
    let rev = 0;
    let app = 0;
    let pend = 0;
    let den = 0;

    list.forEach((b) => {
      if (b.status === 'approved') {
        rev += b.totalPrice || 0;
        app++;
      } else if (b.status === 'pending') {
        pend++;
      } else if (b.status === 'denied') {
        den++;
      }
    });

    return {
      totalRevenue: rev,
      approvedCount: app,
      pendingCount: pend,
      deniedCount: den,
    };
  };

  const regStats = getStatsForList(eventBookings);
  const contribStats = getStatsForList(contributionBookings);
  const currentStats = adminSection === 'contributions' ? contribStats : regStats;

  // Filter bookings strictly by active status tab
  const filteredBookings = eventBookings.filter((b) => b.status === activeTab);
  const filteredContributions = contributionBookings.filter((b) => b.status === contribActiveTab);

  return (
    <div className="admin-dashboard-page animate-fade-in">
      {/* Header bar */}
      <div className="admin-header-bar animate-slide-down">
        <div className="container header-flex">
          <div className="admin-title-logo">
            <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="brand-logo-img animate-pulse-subtle" />
            <div>
              <h1 className="admin-workspace-title">
                Success<span className="text-primary-green"> Team</span>
                <span className="workspace-suffix">Operations Console</span>
              </h1>
              <p className="admin-subtitle-desc">Premium Administration & Operations Portal</p>
            </div>
          </div>
          <div className="header-right-actions">
            <span className="live-status-indicator">
              <span className="status-dot"></span>
              Live Sync Active
            </span>
            <button onClick={handleLogout} className="btn-admin-logout">
              <LogOut size={15} /> Close Console
            </button>
          </div>
        </div>
      </div>

      <div className="container dashboard-content">

        {/* Metric Cards Row */}
        <div className="metrics-cards-grid animate-slide-up">
          <div className="metric-card rev-card">
            <div className="metric-card-accent"></div>
            <div className="metric-card-content">
              <div className="metric-info">
                <span className="metric-label">{adminSection === 'contributions' ? 'Total Contribution Revenue' : 'Approved Revenue'}</span>
                <h3 className="metric-value">₹{currentStats.totalRevenue.toLocaleString('en-IN')}</h3>
              </div>
              <div className="metric-icon-box rev">
                <DollarSign size={28} />
              </div>
            </div>
            <div className="metric-card-footer-info">
              <span className="trend-text text-emerald">Live verified streams</span>
            </div>
          </div>

          <div className="metric-card pend-card">
            <div className="metric-card-accent"></div>
            <div className="metric-card-content">
              <div className="metric-info">
                <span className="metric-label">{adminSection === 'contributions' ? 'Pending Contributions' : 'Pending Registrations'}</span>
                <h3 className="metric-value text-amber">{currentStats.pendingCount}</h3>
              </div>
              <div className="metric-icon-box pend">
                <Clock size={28} />
              </div>
            </div>
            <div className="metric-card-footer-info">
              <span className="trend-text text-amber">Awaiting confirmation</span>
            </div>
          </div>

          <div className="metric-card app-card">
            <div className="metric-card-accent"></div>
            <div className="metric-card-content">
              <div className="metric-info">
                <span className="metric-label">{adminSection === 'contributions' ? 'Approved Contributions' : 'Confirmed Seats'}</span>
                <h3 className="metric-value text-emerald">{currentStats.approvedCount}</h3>
              </div>
              <div className="metric-icon-box app">
                <UserCheck size={28} />
              </div>
            </div>
            <div className="metric-card-footer-info">
              <span className="trend-text text-emerald">Active registrations</span>
            </div>
          </div>

          <div className="metric-card den-card">
            <div className="metric-card-accent"></div>
            <div className="metric-card-content">
              <div className="metric-info">
                <span className="metric-label">{adminSection === 'contributions' ? 'Rejected Contributions' : 'Rejected Registrations'}</span>
                <h3 className="metric-value text-red">{currentStats.deniedCount}</h3>
              </div>
              <div className="metric-icon-box den">
                <X size={28} />
              </div>
            </div>
            <div className="metric-card-footer-info">
              <span className="trend-text text-red">Declined requests</span>
            </div>
          </div>
        </div>

        <div className="admin-section-tabs-container animate-slide-up">
          <div className="admin-section-tabs">
            <button
              onClick={() => setAdminSection('registrations')}
              className={`section-tab ${adminSection === 'registrations' ? 'active' : ''}`}
            >
              <CreditCard size={16} />
              <span>Payment Verification</span>
            </button>
            <button
              onClick={() => setAdminSection('contributions')}
              className={`section-tab ${adminSection === 'contributions' ? 'active' : ''}`}
            >
              <Coins size={16} />
              <span>Contribution Requests</span>
            </button>
            <button
              onClick={() => setAdminSection('events')}
              className={`section-tab ${adminSection === 'events' ? 'active' : ''}`}
            >
              <PlusCircle size={16} />
              <span>Add New Event</span>
            </button>
            <button
              onClick={() => setAdminSection('configs')}
              className={`section-tab ${adminSection === 'configs' ? 'active' : ''}`}
            >
              <Settings size={16} />
              <span>Payment Settings</span>
            </button>
          </div>
        </div>

        {/* List Controls */}
        {adminSection === 'registrations' ? (
          <div className="dashboard-main-area animate-slide-up">
            <div className="list-controls-bar">
              <div className="tab-buttons">
                <button
                  onClick={() => setActiveTab('pending')}
                  className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                >
                  <span className="tab-btn-dot pending"></span>
                  <span>Pending Verification</span>
                  <span className="tab-badge">{regStats.pendingCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                >
                  <span className="tab-btn-dot approved"></span>
                  <span>Confirmed Bookings</span>
                  <span className="tab-badge">{regStats.approvedCount}</span>
                </button>
                <button
                  onClick={() => setActiveTab('denied')}
                  className={`tab-btn ${activeTab === 'denied' ? 'active' : ''}`}
                >
                  <span className="tab-btn-dot denied"></span>
                  <span>Payment Failed Logs</span>
                  <span className="tab-badge">{regStats.deniedCount}</span>
                </button>
              </div>
              <button onClick={() => fetchAdminBookings(adminUser.id)} className="btn btn-refresh hover-spin-icon">
                <RefreshCw size={14} className="refresh-icon-spin" /> <span>Sync Live Logs</span>
              </button>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="empty-stream-card glass-card">
                <Ticket size={48} className="empty-icon" />
                <h3 className="heading-sm">No Records Found</h3>
                <p>There are no booking entries matching the &quot;{activeTab}&quot; filter currently registered in the database.</p>
              </div>
            ) : (
              <div className="bookings-stream-list">
                {filteredBookings.map((b) => (
                  <div key={b.id} className={`stream-item-card glass-card ${b.status} hover-glow-card`}>

                    {/* Item top header info */}
                    <div className="item-card-header">
                      <div className="header-left">
                        <span className="item-booking-id">ORDER ID: {b.id.toUpperCase()}</span>
                        <span className="item-created-at">{new Date(b.createdAt).toLocaleString()}</span>
                      </div>
                      <span className={`badge badge-${b.status}`}>
                        {b.status === 'pending' ? 'Pending Verification' : b.status === 'approved' ? 'Confirmed' : 'Payment Failed'}
                      </span>
                    </div>

                    {/* Redesigned Premium Body Grid */}
                    <div className="item-card-body-grid">
                      {/* Pane 1: Profile & Identity */}
                      <div className="card-pane profile-pane">
                        <div className="pane-header">
                          <div className="avatar-circle">
                            {(b.bookerName || b.user.name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <h4 className="pane-title">{b.bookerName || (b.user.name !== 'Unknown User' ? b.user.name : 'Guest')}</h4>
                            <span className="member-id-badge">ID: {b.bookerMemberId || 'GUEST'}</span>
                          </div>
                        </div>
                        <div className="pane-details">
                          <div className="info-table-row">
                            <span className="info-label">Mobile Number</span>
                            <span className="info-value">{b.bookerPhone || (b.user.phone !== 'N/A' ? b.user.phone : 'N/A')}</span>
                          </div>
                          <div className="info-table-row">
                            <span className="info-label">Booking Created</span>
                            <span className="info-value">{new Date(b.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Pane 2: Event Details */}
                      <div className="card-pane event-pane">
                        <h4 className="pane-section-title">
                          <Ticket size={14} /> Event Program & Seats
                        </h4>
                        <div className="pane-details">
                          <div className="info-table-row">
                            <span className="info-label">Program Name</span>
                            <span className="info-value highlight-green">{b.seminarName || b.eventName}</span>
                          </div>
                          <div className="info-table-row">
                            <span className="info-label">Venue Location</span>
                            <span className="info-value">{b.venue}</span>
                          </div>
                          <div className="info-table-row">
                            <span className="info-label">Date & Time</span>
                            <span className="info-value">{b.date} &bull; {b.time}</span>
                          </div>
                          <div className="info-table-row">
                            <span className="info-label">Seats Allocated</span>
                            <div className="seats-badge-list">
                              {b.seats.map((seat: string) => (
                                <span key={seat} className="seat-capsule">{seat}</span>
                              ))}
                            </div>
                          </div>
                          {b.attendees && Object.keys(b.attendees).length > 0 && (
                            <div className="attendees-sub-section">
                              <span className="info-label">Seat Attendees</span>
                              <div className="attendee-pills-list">
                                {Object.entries(b.attendees).map(([seat, val]: any) => {
                                  const nameText = typeof val === 'object' && val !== null ? val.name : val;
                                  const phoneText = typeof val === 'object' && val !== null ? (val.whatsapp || val.phone || '') : '';
                                  return (
                                    <span key={seat} className="attendee-pill-item">
                                      {seat}: {nameText} {phoneText ? `(${phoneText})` : ''}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pane 3: Payment Verification & Invoice */}
                      <div className="card-pane payment-pane">
                        <h4 className="pane-section-title">
                          <CreditCard size={14} /> Verification Details
                        </h4>
                        
                        <div className="utr-display-box">
                          {b.screenshot && b.screenshot.startsWith('UTR:') ? (
                            <div className="utr-content-wrapper">
                              <span className="utr-label-admin">UPI Transaction ID (UTR)</span>
                              <span className="utr-value-admin">
                                {b.screenshot.split('|')[0].replace('UTR:', '')}
                              </span>
                            </div>
                          ) : (
                            <div className="utr-missing-badge">
                              <span>⚠️ UTR ID Missing</span>
                            </div>
                          )}
                        </div>

                        <div className="invoice-receipt-block">
                          <div className="invoice-receipt-row">
                            <span>Base ({b.seats.length} Seat{b.seats.length === 1 ? '' : 's'})</span>
                            <span>₹{b.seats.length * 1000}</span>
                          </div>
                          <div className="invoice-receipt-row">
                            <span>GST (18%)</span>
                            <span>₹{Math.round(b.seats.length * 1000 * 0.18)}</span>
                          </div>
                          <div className="invoice-receipt-total">
                            <span>Total Amount Paid</span>
                            <span>₹{b.totalPrice}</span>
                          </div>
                        </div>

                        <div className="audit-qr-preview-row">
                          <span className="info-label">Audit QR Code</span>
                          <div className="qr-box-wrap">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(b.qrCodePayload || `BOOKING:${b.id}|EVENT:${b.seminarName || b.eventName}|SEATS:${b.seats.join(',')}|VENUE:${b.venue}|DATE:${b.date}|AMOUNT:INR${b.totalPrice}|STATUS:${b.status.toUpperCase()}`)}&qzone=1&format=png&color=16a34a`} 
                              alt="Audit QR Code" 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action footer for pending bookings */}
                    {b.status === 'pending' && (
                      <div className="item-card-footer animate-fade-in">
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'denied')}
                          className="btn btn-deny-action"
                        >
                          <X size={16} /> Reject
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'approved')}
                          className="btn btn-approve-action"
                        >
                          <Check size={16} /> Approve
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        ) : adminSection === 'events' ? (
          <div className="event-manager-area animate-slide-up">
            <div className="event-form-card glass-card">
              <div className="event-manager-header">
                <div>
                  <span className="manager-kicker">Event Management</span>
                  <h2 className="heading-md">
                    {editingEventId ? 'Edit / Modify Event Event' : 'Add New Event'}
                  </h2>
                </div>
                <button onClick={fetchAdminEvents} className="btn btn-secondary btn-refresh">
                  <RefreshCw size={14} /> Refresh Events
                </button>
              </div>

              <form onSubmit={handlePublishEvent} className="event-form-grid">
                <div className="event-form-group span-2">
                  <label className="form-label">Event Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="form-control"
                    placeholder="Success Team Leadership Development Event"
                    required
                  />
                </div>

                <div className="event-form-group">
                  <label className="form-label">Venue / City Location</label>
                  <input
                    type="text"
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    className="form-control"
                    placeholder="Chromepet, Chennai"
                    required
                  />
                </div>

                <div className="event-form-group">
                  <label className="form-label">Event Date & Time</label>
                  <input
                    type="datetime-local"
                    value={eventForm.eventDateTime}
                    onChange={(e) => setEventForm({ ...eventForm, eventDateTime: e.target.value })}
                    className="form-control"
                    required
                  />
                </div>

                <div className="event-form-group">
                  <label className="form-label">Registration Price / Fee</label>
                  <input
                    type="number"
                    min="0"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({ ...eventForm, price: e.target.value })}
                    className="form-control"
                    placeholder="250"
                    required
                  />
                </div>

                <div className="event-form-group">
                  <label className="form-label">Total Available Seats</label>
                  <input
                    type="number"
                    min="1"
                    value={eventForm.totalSeats}
                    onChange={(e) => setEventForm({ ...eventForm, totalSeats: e.target.value })}
                    className="form-control"
                    placeholder="60"
                    required
                  />
                </div>

                <div className="event-form-actions span-2">
                  {eventMessage && <span className="event-message">{eventMessage}</span>}
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {editingEventId && (
                      <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ height: '44px' }}>
                        Cancel Edit
                      </button>
                    )}
                    <button type="submit" disabled={eventSaving} className="btn btn-primary publish-event-btn" style={{ height: '44px' }}>
                      {eventSaving ? 'Saving Event...' : editingEventId ? 'Update Event Event' : 'Publish Event Event'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="events-list-card glass-card">
              <h3 className="heading-sm">Published Active Events</h3>
              {events.length === 0 ? (
                <p className="events-empty">No active seminar events are currently published.</p>
              ) : (
                <div className="events-table-list">
                  {events.map((event) => (
                    <div key={event.id} className="event-row">
                      <div>
                        <strong>{event.title || event.name}</strong>
                        <span>{event.venue}</span>
                        <div className="event-row-actions">
                          <button onClick={() => handleEditClick(event)} className="btn-edit-event">
                            Edit
                          </button>
                          <button onClick={() => { setSelectedEventId(event.id); setDeleteModalOpen(true); }} className="btn-delete-event">
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="event-row-meta">
                        <span>{event.eventDate || 'Scheduled'}</span>
                        <span>{event.eventTime || ''}</span>
                        <strong>₹{event.price}</strong>
                        <span>{event.totalSeats || 60} seats</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : adminSection === 'contributions' ? (
          <div className="dashboard-main-area animate-slide-up">
            <div className="list-controls-bar">
              <div className="tab-buttons">
                <button
                  onClick={() => setContribActiveTab('pending')}
                  className={`tab-btn ${contribActiveTab === 'pending' ? 'active' : ''}`}
                >
                  <span className="tab-btn-dot pending"></span>
                  <span>Pending</span>
                  <span className="tab-badge">{contribStats.pendingCount}</span>
                </button>
                <button
                  onClick={() => setContribActiveTab('approved')}
                  className={`tab-btn ${contribActiveTab === 'approved' ? 'active' : ''}`}
                >
                  <span className="tab-btn-dot approved"></span>
                  <span>Confirmed</span>
                  <span className="tab-badge">{contribStats.approvedCount}</span>
                </button>
                <button
                  onClick={() => setContribActiveTab('denied')}
                  className={`tab-btn ${contribActiveTab === 'denied' ? 'active' : ''}`}
                >
                  <span className="tab-btn-dot denied"></span>
                  <span>Rejected</span>
                  <span className="tab-badge">{contribStats.deniedCount}</span>
                </button>
              </div>
              <button onClick={() => fetchAdminBookings(adminUser.id)} className="btn btn-refresh hover-spin-icon">
                <RefreshCw size={14} className="refresh-icon-spin" /> <span>Sync Live Logs</span>
              </button>
            </div>

            {filteredContributions.length === 0 ? (
              <div className="empty-stream-card glass-card">
                <Ticket size={48} className="empty-icon" />
                <h3 className="heading-sm">No Records Found</h3>
                <p>There are no contribution entries matching the &quot;{contribActiveTab}&quot; filter currently registered in the database.</p>
              </div>
            ) : (
              <div className="bookings-stream-list">
                {filteredContributions.map((b) => {
                  const supporter = b.attendees?.SUPPORTER || {};
                  const supporterName = supporter.name || b.bookerName || 'Unknown';
                  const vpName = supporter.vpName || b.bookerVpName || 'N/A';
                  const vpImage = supporter.vpImage || '';
                  const designation = supporter.designation || 'System Supporter';

                  const baseAmount = designation === 'Chief Executive Director' ? 1000 : 500;
                  const totalAmount = b.totalPrice;
                  const gstAmount = totalAmount > baseAmount ? (designation === 'Chief Executive Director' ? 180 : 90) : 0;

                  const utrNumber = b.screenshot && b.screenshot.startsWith('UTR:') 
                    ? b.screenshot.split('|')[0].replace('UTR:', '') 
                    : b.utrNumber || 'N/A';

                  return (
                    <div key={b.id} className={`stream-item-card glass-card ${b.status} hover-glow-card`}>
                      <div className="item-card-header">
                        <div className="header-left">
                          <span className="item-booking-id">CONTRIBUTION ID: {b.id.toUpperCase()}</span>
                          <span className="item-created-at">{new Date(b.createdAt).toLocaleString()}</span>
                        </div>
                        <span className={`badge badge-${b.status}`}>
                          {b.status === 'pending' ? 'Pending Verification' : b.status === 'approved' ? 'Confirmed' : 'Rejected'}
                        </span>
                      </div>
                      {/* Redesigned Premium Body Grid */}
                      <div className="item-card-body-grid">
                        {/* Pane 1: Profile & Identity */}
                        <div className="card-pane profile-pane">
                          <div className="pane-header">
                            <div className="avatar-circle contribution">
                              {supporterName[0].toUpperCase()}
                            </div>
                            <div>
                              <h4 className="pane-title">{supporterName}</h4>
                              <span className="designation-badge">{designation}</span>
                            </div>
                          </div>
                          <div className="pane-details" style={{ marginTop: '1rem' }}>
                            <div className="info-table-row">
                              <span className="info-label">VP Name</span>
                              <span className="info-value">{vpName}</span>
                            </div>
                            {vpImage && (
                              <div className="info-table-row image-preview-row">
                                <span className="info-label">VP Upload</span>
                                <div className="vp-preview-box" onClick={() => setZoomedImage(vpImage)}>
                                  <img src={vpImage} alt="VP Upload" />
                                  <div className="vp-preview-overlay">
                                    <Eye size={12} />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pane 2: Financial Details */}
                        <div className="card-pane financial-pane">
                          <h4 className="pane-section-title">
                            <Coins size={14} /> Contribution Summary
                          </h4>
                          <div className="pane-details">
                            <div className="info-table-row">
                              <span className="info-label">{gstAmount > 0 ? "Base Contribution" : "Contribution Amount"}</span>
                              <span className="info-value">₹{baseAmount}</span>
                            </div>
                            {gstAmount > 0 && (
                              <div className="info-table-row">
                                <span className="info-label">GST (18%)</span>
                                <span className="info-value">₹{gstAmount}</span>
                              </div>
                            )}
                            
                            <div className="invoice-receipt-block" style={{ marginTop: '1.5rem' }}>
                              <div className="invoice-receipt-total">
                                <span>Total Amount Paid</span>
                                <span>₹{totalAmount}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pane 3: UTR Verification */}
                        <div className="card-pane payment-pane">
                          <h4 className="pane-section-title">
                            <CreditCard size={14} /> Verification Details
                          </h4>
                          
                          <div className="utr-display-box" style={{ marginBottom: '1rem' }}>
                            <div className="utr-content-wrapper">
                              <span className="utr-label-admin">UPI Transaction ID (UTR)</span>
                              <span className="utr-value-admin">{utrNumber}</span>
                            </div>
                          </div>
                          
                          <p className="utr-admin-hint">
                            Ensure the UTR matches the bank statements before approving contribution credentials.
                          </p>
                        </div>
                      </div>

                      <div className="item-card-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
                        <button
                          onClick={() => setSelectedContributionDetail(b)}
                          className="btn btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                        >
                          View Full Details
                        </button>
                        {b.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(b.id, 'denied')}
                              className="btn btn-deny-action"
                            >
                              <X size={14} /> Reject
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b.id, 'approved')}
                              className="btn btn-approve-action"
                            >
                              <Check size={14} /> Approve
                            </button>
                          </>
                        )}
                        {b.status === 'approved' && (
                          <button
                            onClick={() => handleHomepageVisibilityToggle(b.id, b.homepageVisible)}
                            className={`btn ${b.homepageVisible ? 'btn-hide-homepage' : 'btn-show-homepage'}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                          >
                            {b.homepageVisible ? (
                              <>
                                <EyeOff size={14} /> Hide from Homepage
                              </>
                            ) : (
                              <>
                                <Eye size={14} /> Show on Homepage
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="payment-settings-area animate-slide-up">
            <div className="event-form-card glass-card">
              <div className="event-manager-header">
                <div>
                  <span className="manager-kicker">Payment Configuration</span>
                  <h2 className="heading-md">Payment Gateway Settings</h2>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="event-form-grid">
                <div className="event-form-group">
                  <label className="form-label">UPI ID Address</label>
                  <input
                    type="text"
                    value={upiSettings.upiId}
                    onChange={(e) => setUpiSettings({ ...upiSettings, upiId: e.target.value })}
                    className="form-control"
                    placeholder="successteam@upi"
                    required
                  />
                </div>

                <div className="event-form-group">
                  <label className="form-label">Account Beneficiary Name</label>
                  <input
                    type="text"
                    value={upiSettings.upiName}
                    onChange={(e) => setUpiSettings({ ...upiSettings, upiName: e.target.value })}
                    className="form-control"
                    placeholder="david"
                    required
                  />
                </div>

                <div className="event-form-group span-2">
                  <label className="form-label">Custom QR Code Image (Optional)</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleQrUpload}
                      style={{ display: 'none' }}
                      id="admin-qr-file"
                    />
                    <label htmlFor="admin-qr-file" className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                      {isUploadingQr ? 'Uploading Image...' : 'Choose QR Image file'}
                    </label>
                    {upiSettings.upiQrUrl && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={upiSettings.upiQrUrl}
                          alt="Configured QR Code"
                          style={{ width: '50px', height: '50px', borderRadius: '6px', border: '1px solid #d1d5db', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => setUpiSettings(prev => ({ ...prev, upiQrUrl: '' }))}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', color: '#dc2626', border: '1px solid #fca5a5' }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  <p style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '0.5rem', lineHeight: '1.4' }}>
                    If no custom QR code image is uploaded, the booking portal will automatically generate a dynamic UPI scan-and-pay QR code for the customer&apos;s total fee amount!
                  </p>
                </div>

                <div className="event-form-actions span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                  {settingsMessage && <span className="event-message">{settingsMessage}</span>}
                  <button type="submit" className="btn btn-primary" disabled={settingsLoading} style={{ height: '44px' }}>
                    {settingsLoading ? 'Saving Settings...' : 'Save Payment Settings'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Screenshot Lightbox Modal */}
      {zoomedImage && (
        <div className="lightbox-overlay" onClick={() => setZoomedImage(null)}>
          <div className="lightbox-content animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setZoomedImage(null)}>&times;</button>
            <img src={zoomedImage} alt="Receipt Full Size" className="lightbox-image" />
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="confirm-modal-overlay" onClick={() => { setDeleteModalOpen(false); setSelectedEventId(null); }}>
          <div className="confirm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <div className="confirm-modal-icon-box">
                <svg className="confirm-modal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h2 className="confirm-modal-title">Permanently Delete Event?</h2>
              <p className="confirm-modal-desc">
                Are you sure you want to permanently delete this seminar event? This action cannot be undone.
              </p>
            </div>
            <div className="confirm-modal-actions">
              <button
                type="button"
                onClick={() => { setDeleteModalOpen(false); setSelectedEventId(null); }}
                className="btn-modal-cancel"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn-modal-delete"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Details Modal */}
      {selectedContributionDetail && (
        <div className="confirm-modal-overlay" onClick={() => setSelectedContributionDetail(null)}>
          <div className="confirm-modal-card" style={{ maxWidth: '600px', width: '100%', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
              <h2 className="confirm-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>Contribution Request Details</h2>
              <button 
                onClick={() => setSelectedContributionDetail(null)} 
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Supporter Profile</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
                    <div><span style={{ color: '#6b7280' }}>Supporter Name: </span><strong>{selectedContributionDetail.attendees?.SUPPORTER?.name || selectedContributionDetail.bookerName || 'Unknown'}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>Designation: </span><strong>{selectedContributionDetail.attendees?.SUPPORTER?.designation || 'System Supporter'}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>VP Name: </span><strong>{selectedContributionDetail.attendees?.SUPPORTER?.vpName || 'N/A'}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>Submitted Date & Time: </span><strong>{new Date(selectedContributionDetail.createdAt).toLocaleString()}</strong></div>
                    <div><span style={{ color: '#6b7280' }}>Status: </span>
                      <strong style={{ 
                        color: selectedContributionDetail.status === 'approved' ? '#047857' : selectedContributionDetail.status === 'denied' ? '#b91c1c' : '#d97706' 
                      }}>
                        {selectedContributionDetail.status === 'approved' ? 'Confirmed' : selectedContributionDetail.status === 'denied' ? 'Rejected' : 'Pending'}
                      </strong>
                    </div>
                  </div>
                </div>
                {selectedContributionDetail.attendees?.SUPPORTER?.vpImage && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                    <div 
                      style={{ width: '90px', height: '90px', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden', cursor: 'pointer' }}
                      onClick={() => setZoomedImage(selectedContributionDetail.attendees.SUPPORTER.vpImage)}
                    >
                      <img src={selectedContributionDetail.attendees.SUPPORTER.vpImage} alt="VP Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: '500' }}>VP Image</span>
                  </div>
                )}
              </div>

              {/* Financial Breakdown */}
              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Financial Breakdown</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>
                      {selectedContributionDetail.totalPrice > (selectedContributionDetail.attendees?.SUPPORTER?.designation === 'Chief Executive Director' ? 1000 : 500) 
                        ? 'Base Contribution Amount:' 
                        : 'Contribution Amount:'}
                    </span>
                    <strong>₹{selectedContributionDetail.attendees?.SUPPORTER?.designation === 'Chief Executive Director' ? 1000 : 500}</strong>
                  </div>
                  {selectedContributionDetail.totalPrice > (selectedContributionDetail.attendees?.SUPPORTER?.designation === 'Chief Executive Director' ? 1000 : 500) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6b7280' }}>GST Amount (18%):</span>
                      <strong>₹{selectedContributionDetail.attendees?.SUPPORTER?.designation === 'Chief Executive Director' ? 180 : 90}</strong>
                    </div>
                  )}
                  <hr style={{ border: 0, borderTop: '1px dashed #e5e7eb', margin: '0.4rem 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>Total Payable Amount:</span>
                    <strong style={{ color: '#10b981', fontSize: '1.05rem' }}>₹{selectedContributionDetail.totalPrice}</strong>
                  </div>
                </div>
              </div>

              {/* Payment Verification */}
              <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Verification</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>UTR Number: </span>
                    <strong style={{ 
                      fontSize: '0.95rem', 
                      color: '#047857', 
                      background: '#ecfdf5', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      border: '1px solid #a7f3d0' 
                    }}>
                      {selectedContributionDetail.screenshot?.replace('UTR:', '') || selectedContributionDetail.utrNumber || 'N/A'}
                    </strong>
                  </div>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>Payment Screenshot:</span>
                    {selectedContributionDetail.screenshot && !selectedContributionDetail.screenshot.startsWith('UTR:') ? (
                      <div 
                        style={{ width: '120px', height: '160px', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden', cursor: 'pointer' }}
                        onClick={() => setZoomedImage(selectedContributionDetail.screenshot)}
                      >
                        <img src={selectedContributionDetail.screenshot} alt="Payment Screenshot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Verified via UTR reference ID (No screenshot uploaded)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #f3f4f6', paddingTop: '0.75rem' }}>
              <button 
                type="button"
                onClick={() => setSelectedContributionDetail(null)} 
                className="btn-modal-cancel"
                style={{ margin: 0 }}
              >
                Close
              </button>
              {selectedContributionDetail.status === 'pending' && (
                <>
                  <button 
                    type="button"
                    onClick={() => { handleStatusUpdate(selectedContributionDetail.id, 'denied'); setSelectedContributionDetail(null); }} 
                    className="btn-modal-delete"
                    style={{ background: '#dc2626', color: 'white', border: '1px solid #dc2626', margin: 0 }}
                  >
                    Reject
                  </button>
                  <button 
                    type="button"
                    onClick={() => { handleStatusUpdate(selectedContributionDetail.id, 'approved'); setSelectedContributionDetail(null); }} 
                    className="btn btn-primary"
                    style={{ height: '40px', padding: '0 1.25rem', margin: 0, fontSize: '0.88rem' }}
                  >
                    Approve
                  </button>
                </>
              )}
              {selectedContributionDetail.status === 'approved' && (
                <button
                  type="button"
                  onClick={() => {
                    handleHomepageVisibilityToggle(selectedContributionDetail.id, selectedContributionDetail.homepageVisible);
                    setSelectedContributionDetail({
                      ...selectedContributionDetail,
                      homepageVisible: !selectedContributionDetail.homepageVisible
                    });
                  }}
                  className={`btn ${selectedContributionDetail.homepageVisible ? 'btn-hide-homepage' : 'btn-show-homepage'}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}
                >
                  {selectedContributionDetail.homepageVisible ? (
                    <>
                      <EyeOff size={14} /> Hide from Homepage
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Show on Homepage
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className={`admin-toast admin-toast-${toastMessage.type} animate-slide-up`}>
          <AlertCircle size={18} />
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="toast-close-btn">&times;</button>
        </div>
      )}

      <style>{`
        .admin-dashboard-page {
          background-color: #f8fafc;
          background-image: radial-gradient(rgba(22, 163, 74, 0.02) 1.5px, transparent 0), radial-gradient(rgba(22, 163, 74, 0.02) 1.5px, transparent 0);
          background-size: 32px 32px;
          background-position: 0 0, 16px 16px;
          min-height: 100vh;
          padding-bottom: 6rem;
          font-family: var(--font-sans);
        }

        .admin-header-bar {
          background: linear-gradient(135deg, #022c22 0%, #14532d 50%, #064e3b 100%);
          color: #ffffff;
          padding: 1.5rem 0;
          box-shadow: 0 10px 30px rgba(2, 44, 34, 0.15);
          position: relative;
          overflow: hidden;
        }

        .admin-header-bar::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 80% 50%, rgba(22, 197, 94, 0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-title-logo {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-logo-img {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .brand-logo-img.animate-pulse-subtle {
          animation: pulseSubtle 3s infinite ease-in-out;
        }

        @keyframes pulseSubtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        .text-primary-green {
          color: #22c55e;
        }

        .workspace-suffix {
          font-weight: 400;
          color: rgba(255, 255, 255, 0.7);
          margin-left: 0.5rem;
          font-size: 1.15rem;
          letter-spacing: -0.2px;
        }

        .admin-workspace-title {
          font-family: var(--font-heading);
          font-size: 1.65rem;
          font-weight: 800;
          line-height: 1.1;
          color: #ffffff;
          margin: 0;
          display: inline-flex;
          align-items: center;
          letter-spacing: -0.5px;
        }

        .admin-subtitle-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.6);
          margin-top: 0.25rem;
          font-weight: 500;
        }

        .header-right-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .live-status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(22, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(22, 197, 94, 0.2);
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 99px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
          animation: statusGlow 1.5s infinite ease-in-out;
        }

        @keyframes statusGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .btn-admin-logout {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 0.55rem 1.1rem;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-admin-logout:hover {
          background: #ef4444;
          color: #ffffff;
          border-color: #ef4444;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
          transform: translateY(-1px);
        }

        .dashboard-content {
          margin-top: 3rem;
          max-width: 1200px;
          padding: 0 1.5rem;
          margin-left: auto;
          margin-right: auto;
        }

        /* Metrics Grid Redesign */
        .metrics-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 640px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .metric-card {
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.08);
          border-radius: 24px;
          padding: 1.75rem;
          box-shadow: 0 4px 20px -2px rgba(22, 163, 74, 0.02), 0 2px 6px -1px rgba(0,0,0,0.02);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          min-height: 140px;
        }

        .metric-card-accent {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          opacity: 0.85;
        }
        .rev-card .metric-card-accent { background: linear-gradient(90deg, #16a34a, #22c55e); }
        .pend-card .metric-card-accent { background: linear-gradient(90deg, #d97706, #f59e0b); }
        .app-card .metric-card-accent { background: linear-gradient(90deg, #059669, #10b981); }
        .den-card .metric-card-accent { background: linear-gradient(90deg, #dc2626, #ef4444); }

        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(22, 163, 74, 0.05), 0 8px 10px -6px rgba(22, 163, 74, 0.03);
          border-color: rgba(22, 163, 74, 0.15);
        }

        .metric-card-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          width: 100%;
        }

        .metric-info {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .metric-label {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .metric-value {
          font-family: var(--font-heading);
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a;
          line-height: 1;
        }

        .metric-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 16px;
          flex-shrink: 0;
          box-shadow: 0 8px 16px -4px rgba(0,0,0,0.03);
        }

        .metric-icon-box.rev { background: rgba(22, 163, 74, 0.08); color: #16a34a; }
        .metric-icon-box.pend { background: rgba(217, 119, 6, 0.08); color: #d97706; }
        .metric-icon-box.app { background: rgba(5, 150, 105, 0.08); color: #059669; }
        .metric-icon-box.den { background: rgba(220, 38, 38, 0.08); color: #dc2626; }

        .metric-card-footer-info {
          margin-top: 1rem;
          border-top: 1px solid rgba(0,0,0,0.04);
          padding-top: 0.75rem;
          display: flex;
          align-items: center;
        }

        .trend-text {
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Navigation Tabs Segmented Redesign */
        .admin-section-tabs-container {
          background: #f1f5f9;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 18px;
          padding: 0.4rem;
          margin-bottom: 3rem;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
        }

        .admin-section-tabs {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.25rem;
        }

        @media (min-width: 640px) {
          .admin-section-tabs {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .admin-section-tabs {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .section-tab {
          border: none;
          background: transparent;
          color: #64748b;
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 0.88rem;
          padding: 0.85rem 1rem;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .section-tab:hover {
          color: #0f172a;
          background: rgba(0,0,0,0.02);
        }

        .section-tab.active {
          background: #ffffff;
          color: #16a34a;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02);
        }

        /* Controls Bar & Filter Buttons */
        .list-controls-bar {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 3rem;
          padding-bottom: 0.75rem;
        }

        @media (min-width: 768px) {
          .list-controls-bar {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0;
          }
        }

        .tab-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .tab-btn {
          background: transparent;
          border: 1px solid transparent;
          padding: 0.6rem 1.1rem;
          font-family: var(--font-sans);
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .tab-btn.active {
          background: #ffffff;
          color: #0f172a;
          border-color: rgba(22, 163, 74, 0.15);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.03);
        }

        .tab-btn-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }
        .tab-btn-dot.pending { background: #f59e0b; }
        .tab-btn-dot.approved { background: #10b981; }
        .tab-btn-dot.denied { background: #ef4444; }

        .tab-badge {
          background: #f1f5f9;
          color: #475569;
          font-size: 0.75rem;
          padding: 0.1rem 0.5rem;
          border-radius: 6px;
          font-weight: 700;
          margin-left: 0.25rem;
          border: 1px solid rgba(0,0,0,0.03);
        }

        .tab-btn.active .tab-badge {
          background: rgba(22, 163, 74, 0.08);
          color: #16a34a;
          border-color: rgba(22, 163, 74, 0.1);
        }

        .btn-refresh {
          background: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
        }

        .btn-refresh:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        /* Stream Cards Redesign */
        .bookings-stream-list {
          display: flex;
          flex-direction: column;
          gap: 2.5rem;
        }

        .stream-item-card {
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.06);
          border-radius: 28px;
          box-shadow: 0 4px 30px rgba(22, 163, 74, 0.015), 0 1px 3px rgba(0,0,0,0.01);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .stream-item-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px rgba(22, 163, 74, 0.04), 0 1px 10px rgba(0,0,0,0.02);
          border-color: rgba(22, 163, 74, 0.15);
        }

        .item-card-header {
          background: #fafdfb;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid rgba(22, 163, 74, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-booking-id {
          font-family: var(--font-sans);
          font-weight: 700;
          font-size: 0.85rem;
          color: #475569;
          letter-spacing: 0.5px;
        }

        .item-created-at {
          font-size: 0.78rem;
          color: #94a3b8;
          margin-left: 1rem;
        }

        .badge {
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: 99px;
          border: 1px solid transparent;
        }
        .badge-pending {
          background: #fffbeb;
          color: #d97706;
          border-color: #fde68a;
        }
        .badge-approved {
          background: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .badge-denied {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        /* 3-Pane Body Grid */
        .item-card-body-grid {
          padding: 2.25rem 2rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          background: #ffffff;
        }

        @media (min-width: 768px) {
          .item-card-body-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .item-card-body-grid {
            grid-template-columns: 1fr 1.25fr 1fr;
          }
        }

        .card-pane {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .profile-pane {
          border-right: none;
          padding-right: 0;
        }

        .event-pane {
          border-right: none;
          border-left: none;
          padding-right: 0;
          padding-left: 0;
        }

        @media (min-width: 1024px) {
          .profile-pane {
            border-right: 1px solid #f1f5f9;
            padding-right: 1.75rem;
          }

          .event-pane {
            border-right: 1px solid #f1f5f9;
            padding-right: 1.75rem;
            padding-left: 0.5rem;
          }
        }

        .pane-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .avatar-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(22, 163, 74, 0.08);
          color: #16a34a;
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(22,163,74,0.05);
        }

        .avatar-circle.contribution {
          background: rgba(22, 197, 94, 0.08);
          color: #22c55e;
        }

        .pane-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }

        .member-id-badge {
          font-size: 0.72rem;
          font-weight: 700;
          background: #f1f5f9;
          color: #64748b;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          display: inline-block;
          margin-top: 0.2rem;
          border: 1px solid rgba(0,0,0,0.02);
        }

        .designation-badge {
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(22, 163, 74, 0.08);
          color: #16a34a;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          display: inline-block;
          margin-top: 0.2rem;
        }

        .pane-section-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #1e3a1e;
          text-transform: uppercase;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .pane-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .info-table-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          padding: 0.25rem 0;
        }

        .info-label {
          color: #64748b;
          font-weight: 500;
        }

        .info-value {
          color: #0f172a;
          font-weight: 600;
        }

        .info-value.highlight-green {
          color: #15803d;
          font-weight: 700;
        }

        .seats-badge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        .seat-capsule {
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(22, 163, 74, 0.08);
          color: #15803d;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          border: 1px solid rgba(22, 163, 74, 0.1);
        }

        .attendees-sub-section {
          margin-top: 0.5rem;
          border-top: 1px dashed #f1f5f9;
          padding-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .attendee-pills-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          margin-top: 0.25rem;
        }

        .attendee-pill-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 0.15rem 0.55rem;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
        }

        /* UTR Box */
        .utr-display-box {
          background: #f0fdf4;
          border: 1px solid rgba(22, 163, 74, 0.18);
          border-radius: 16px;
          padding: 1rem;
        }

        .utr-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .utr-label-admin {
          font-size: 0.68rem;
          font-weight: 700;
          color: #166534;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .utr-value-admin {
          font-family: monospace;
          font-size: 0.95rem;
          font-weight: 700;
          color: #14532d;
          letter-spacing: 0.5px;
        }

        .utr-missing-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff1f2;
          border: 1px solid #fecdd3;
          color: #be123c;
          padding: 0.5rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .utr-admin-hint {
          font-size: 0.75rem;
          color: #94a3b8;
          line-height: 1.4;
          margin: 0;
        }

        /* Invoice styling */
        .invoice-receipt-block {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .invoice-receipt-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          color: #64748b;
          font-weight: 500;
        }

        .invoice-receipt-total {
          display: flex;
          justify-content: space-between;
          border-top: 1px dashed #cbd5e1;
          padding-top: 0.6rem;
          margin-top: 0.25rem;
          font-weight: 700;
          color: #0f172a;
          font-size: 0.92rem;
        }

        .audit-qr-preview-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.25rem;
        }

        .qr-box-wrap {
          padding: 0.35rem;
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .qr-box-wrap img {
          width: 60px;
          height: 60px;
          display: block;
        }

        /* VP Image Preview styling */
        .image-preview-row {
          align-items: center;
        }

        .vp-preview-box {
          width: 52px;
          height: 52px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .vp-preview-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.2s ease;
        }
        .vp-preview-box:hover img {
          transform: scale(1.1);
        }
        .vp-preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .vp-preview-box:hover .vp-preview-overlay {
          opacity: 1;
        }

        /* Card Footer Action Buttons */
        .item-card-footer {
          border-top: 1px solid rgba(22, 163, 74, 0.06);
          padding: 1.25rem 2rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          background: #fafdfb;
        }

        .btn-view-details {
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 0.55rem 1.1rem;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .btn-view-details:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #94a3b8;
        }

        .btn-approve-action {
          background: #16a34a;
          color: #ffffff;
          border: none;
          font-weight: 600;
          padding: 0.6rem 1.35rem;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
        }

        .btn-approve-action:hover {
          background: #15803d;
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.25);
          transform: translateY(-1px);
        }

        .btn-deny-action {
          background: #ffffff;
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
          font-weight: 600;
          padding: 0.6rem 1.35rem;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .btn-deny-action:hover {
          background: #fef2f2;
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        .btn-show-homepage {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .btn-show-homepage:hover {
          background: #dcfce7;
          border-color: #86efac;
          transform: translateY(-1px);
        }

        .btn-hide-homepage {
          background: #fff7ed;
          color: #ea580c;
          border: 1px solid #fed7aa;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border-radius: 12px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          transition: all 0.2s ease;
        }

        .btn-hide-homepage:hover {
          background: #ffedd5;
          border-color: #fdba74;
          transform: translateY(-1px);
        }

        /* Lightbox modal styling */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          animation: modalFadeIn 0.25s ease-out;
        }

        .lightbox-content {
          background: #ffffff;
          padding: 0.75rem;
          border-radius: 24px;
          max-width: 90%;
          max-height: 90%;
          position: relative;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.3);
          animation: modalZoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .lightbox-close {
          position: absolute;
          top: -15px;
          right: -15px;
          background: #ef4444;
          color: #ffffff;
          border: none;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
          z-index: 10;
          transition: transform 0.15s ease;
        }
        .lightbox-close:hover {
          transform: scale(1.1);
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 75vh;
          object-fit: contain;
          border-radius: 16px;
        }

        /* Toast notifications */
        .admin-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          z-index: 9999;
          font-weight: 600;
          font-size: 0.9rem;
          max-width: 400px;
          border-left: 4px solid #10b981;
          color: #1e293b;
        }

        .admin-toast-error {
          border-left-color: #ef4444;
          background: #fef2f2;
          color: #991b1b;
        }

        .toast-close-btn {
          background: none;
          border: none;
          color: inherit;
          font-size: 1.2rem;
          cursor: pointer;
          margin-left: auto;
          padding-left: 0.5rem;
          line-height: 1;
        }

        /* Event Manager & Configurations Styling */
        .event-manager-area, .payment-settings-area {
          margin-top: 1rem;
        }

        .event-form-card, .events-list-card {
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.06);
          border-radius: 28px;
          box-shadow: 0 4px 30px rgba(22, 163, 74, 0.015);
          padding: 2.25rem 2rem;
          margin-bottom: 2.5rem;
        }

        .event-manager-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 2rem;
        }

        .heading-md {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .form-control {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          color: #0f172a;
          transition: all 0.2s ease;
          width: 100%;
        }

        .form-control:focus {
          border-color: #16a34a;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
        }

        .form-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .btn-primary {
          background: #16a34a;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
        }

        .btn-primary:hover:not(:disabled) {
          background: #15803d;
          box-shadow: 0 8px 20px rgba(22, 163, 74, 0.25);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #ffffff;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
        }

        .events-empty {
          color: #64748b;
          padding: 2rem 0;
          text-align: center;
          font-style: italic;
        }

        .event-row {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1.5rem;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          background: #ffffff;
          transition: all 0.2s ease;
        }

        .event-row:hover {
          border-color: rgba(22, 163, 74, 0.15);
          box-shadow: 0 10px 20px rgba(22,163,74,0.02);
        }

        @media (min-width: 640px) {
          .event-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }

        .event-row strong {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: #0f172a;
        }

        .event-row span {
          color: #64748b;
          font-size: 0.85rem;
        }

        .event-row-meta {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        @media (min-width: 640px) {
          .event-row-meta {
            text-align: right;
            align-items: flex-end;
          }
        }

        .event-row-meta strong {
          color: #16a34a;
          font-size: 1.15rem;
        }

        /* Empty State */
        .empty-stream-card {
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.06);
          border-radius: 28px;
          padding: 6rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.01);
        }

        .empty-icon {
          color: #cbd5e1;
          animation: pulseIcon 2s infinite ease-in-out;
        }

        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }

        .empty-stream-card h3 {
          font-family: var(--font-heading);
          font-size: 1.2rem;
          font-weight: 700;
          color: #334155;
          margin: 0;
        }

        .empty-stream-card p {
          color: #64748b;
          font-size: 0.9rem;
          max-width: 320px;
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
