'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, DollarSign, Ticket, Clock, Check, X, LogOut, ArrowRight, Eye, RefreshCw, AlertCircle } from 'lucide-react';

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
            <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="brand-logo-img" />
            <div>
              <h1 className="admin-workspace-title">
                Success<span className="text-primary-green"> Team</span>
                <span className="workspace-suffix">Operations Console</span>
              </h1>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-admin-logout">
            <LogOut size={16} /> Close Console
          </button>
        </div>
      </div>

      <div className="container dashboard-content">

        {/* Metric Cards Row */}
        <div className="metrics-cards-grid animate-slide-up">
          <div className="metric-card hover-lift rev-card">
            <div className="metric-icon-box rev">
              <DollarSign size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">{adminSection === 'contributions' ? 'Total Contribution Revenue' : 'Approved Revenue'}</span>
              <h3 className="metric-value">₹{currentStats.totalRevenue}</h3>
            </div>
          </div>

          <div className="metric-card hover-lift pend-card">
            <div className="metric-icon-box pend">
              <Clock size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">{adminSection === 'contributions' ? 'Pending Contributions' : 'Pending Registrations'}</span>
              <h3 className="metric-value text-amber">{currentStats.pendingCount}</h3>
            </div>
          </div>

          <div className="metric-card hover-lift app-card">
            <div className="metric-icon-box app">
              <Ticket size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">{adminSection === 'contributions' ? 'Approved Contributions' : 'Confirmed Seats'}</span>
              <h3 className="metric-value text-emerald">{currentStats.approvedCount}</h3>
            </div>
          </div>

          <div className="metric-card hover-lift den-card">
            <div className="metric-icon-box den">
              <X size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">{adminSection === 'contributions' ? 'Rejected Contributions' : 'Rejected Registrations'}</span>
              <h3 className="metric-value text-red">{currentStats.deniedCount}</h3>
            </div>
          </div>
        </div>

        <div className="admin-section-tabs animate-slide-up">
          <button
            onClick={() => setAdminSection('registrations')}
            className={`section-tab ${adminSection === 'registrations' ? 'active' : ''}`}
          >
            Payment Verification
          </button>
          <button
            onClick={() => setAdminSection('contributions')}
            className={`section-tab ${adminSection === 'contributions' ? 'active' : ''}`}
          >
            Contribution Requests
          </button>
          <button
            onClick={() => setAdminSection('events')}
            className={`section-tab ${adminSection === 'events' ? 'active' : ''}`}
          >
            Add New Event
          </button>
          <button
            onClick={() => setAdminSection('configs')}
            className={`section-tab ${adminSection === 'configs' ? 'active' : ''}`}
          >
            Payment Gateway Settings
          </button>
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
                  Pending Verification ({regStats.pendingCount})
                </button>
                <button
                  onClick={() => setActiveTab('approved')}
                  className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
                >
                  Confirmed Bookings ({regStats.approvedCount})
                </button>
                <button
                  onClick={() => setActiveTab('denied')}
                  className={`tab-btn ${activeTab === 'denied' ? 'active' : ''}`}
                >
                  Payment Failed Logs ({regStats.deniedCount})
                </button>
              </div>
              <button onClick={() => fetchAdminBookings(adminUser.id)} className="btn btn-secondary btn-refresh hover-spin-icon">
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
                        <span className="item-created-at">Received: {new Date(b.createdAt).toLocaleString()}</span>
                      </div>
                      <span className={`badge badge-${b.status}`}>
                        {b.status === 'pending' ? 'Pending Verification' : b.status === 'approved' ? 'Confirmed' : 'Payment Failed'}
                      </span>
                    </div>

                    {/* Main Grid: Details vs Screenshot */}
                    <div className="item-card-body">

                      {/* Member and seminar booking info */}
                      <div className="details-col">
                        <div className="details-group">
                          <h4 className="group-title">Booker / Member Profile</h4>
                          <div className="info-grid">
                            <div className="info-row"><span>Booker Name:</span><strong>{b.bookerName || (b.user.name !== 'Unknown User' ? b.user.name : 'Guest')}</strong></div>
                            <div className="info-row"><span>Member ID:</span><strong>{b.bookerMemberId || 'N/A'}</strong></div>
                            <div className="info-row"><span>Mobile Number:</span><strong>{b.bookerPhone || (b.user.phone !== 'N/A' ? b.user.phone : 'N/A')}</strong></div>
                          </div>
                        </div>

                        <div className="details-group">
                          <h4 className="group-title">Event Details & Seat Allocation</h4>
                          <div className="info-grid">
                            <div className="info-row"><span>Event Program:</span><strong>{b.seminarName || b.eventName}</strong></div>
                            <div className="info-row"><span>Venue / Event:</span><strong>{b.venue} <ArrowRight size={12} className="inline-arrow" /> {b.seminar}</strong></div>
                            <div className="info-row"><span>Event Date & Time:</span><strong>{b.date} &bull; {b.time}</strong></div>
                            <div className="info-row"><span>Allocated Seats:</span><span className="seats-span">{b.seats.join(', ')}</span></div>
                            {b.attendees && Object.keys(b.attendees).length > 0 && (
                              <div className="info-row" style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                                <span>Seat Attendees:</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                  {Object.entries(b.attendees).map(([seat, val]: any) => {
                                    const nameText = typeof val === 'object' && val !== null ? val.name : val;
                                    const phoneText = typeof val === 'object' && val !== null ? (val.whatsapp || val.phone || '') : '';
                                    return (
                                      <span key={seat} style={{ background: '#ecfdf5', border: '1px solid #10b981', color: '#047857', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                                        {seat}: {nameText} {phoneText ? `(${phoneText})` : ''}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="info-row" style={{ gridColumn: 'span 2', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                              <span>Booking Audit QR:</span>
                              <div style={{ padding: '6px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', display: 'inline-block' }}>
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(b.qrCodePayload || `BOOKING:${b.id}|EVENT:${b.seminarName || b.eventName}|SEATS:${b.seats.join(',')}|VENUE:${b.venue}|DATE:${b.date}|AMOUNT:INR${b.totalPrice}|STATUS:${b.status.toUpperCase()}`)}&qzone=1&format=png&color=10b981`} 
                                  alt="Audit QR Code" 
                                  style={{ width: '80px', height: '80px', display: 'block' }} 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="details-group price-group">
                          <h4 className="group-title">Invoice & Payment Summary</h4>
                          <div className="info-grid" style={{ marginBottom: '8px', gap: '6px' }}>
                            <div className="info-row"><span>Price / Seat:</span><strong>₹1,000</strong></div>
                            <div className="info-row"><span>No. of Seats:</span><strong>{(b.seats || []).length} Seat{(b.seats || []).length === 1 ? '' : 's'}</strong></div>
                            <div className="info-row"><span>Base Amount:</span><strong>₹{(b.seats || []).length * 1000}</strong></div>
                            <div className="info-row"><span>GST (18%):</span><strong>₹{Math.round((b.seats || []).length * 1000 * 0.18)}</strong></div>
                          </div>
                          <div className="price-display" style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                            <span>Verified Total Paid (incl. GST):</span>
                            <span className="price-amount" style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '800' }}>₹{b.totalPrice}</span>
                          </div>
                        </div>
                      </div>


                      {/* UTR / Payment Reference */}
                      <div className="screenshot-col">
                        <h4 className="group-title">Payment Reference (UTR)</h4>
                        <div className="utr-display-box">
                          {b.screenshot && b.screenshot.startsWith('UTR:') ? (
                            <>
                              <div className="utr-number-display">
                                <span className="utr-label-admin">UPI Transaction ID (UTR)</span>
                                <span className="utr-value-admin">
                                  {b.screenshot.split('|')[0].replace('UTR:', '')}
                                </span>
                              </div>
                              <p className="utr-admin-hint">
                                Verify this UTR in your UPI payment dashboard before approving.
                              </p>
                            </>
                          ) : (
                            <div className="utr-not-found">
                              <span>⚠️ No UTR found for this booking.</span>
                              <span style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px', display: 'block' }}>
                                {b.screenshot && !b.screenshot.startsWith('UTR:') ? `Raw: ${b.screenshot.substring(0, 40)}...` : 'N/A'}
                              </span>
                            </div>
                          )}
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
                          <X size={16} /> Reject Payment
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(b.id, 'approved')}
                          className="btn btn-approve-action"
                        >
                          <Check size={16} /> Approve Payment
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
                  Pending Contributions ({contribStats.pendingCount})
                </button>
                <button
                  onClick={() => setContribActiveTab('approved')}
                  className={`tab-btn ${contribActiveTab === 'approved' ? 'active' : ''}`}
                >
                  Confirmed Contributions ({contribStats.approvedCount})
                </button>
                <button
                  onClick={() => setContribActiveTab('denied')}
                  className={`tab-btn ${contribActiveTab === 'denied' ? 'active' : ''}`}
                >
                  Rejected Contributions ({contribStats.deniedCount})
                </button>
              </div>
              <button onClick={() => fetchAdminBookings(adminUser.id)} className="btn btn-secondary btn-refresh hover-spin-icon">
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
                  const gstAmount = designation === 'Chief Executive Director' ? 180 : 90;
                  const totalAmount = b.totalPrice;

                  const utrNumber = b.screenshot && b.screenshot.startsWith('UTR:') 
                    ? b.screenshot.split('|')[0].replace('UTR:', '') 
                    : b.utrNumber || 'N/A';

                  return (
                    <div key={b.id} className={`stream-item-card glass-card ${b.status} hover-glow-card`}>
                      <div className="item-card-header">
                        <div className="header-left">
                          <span className="item-booking-id">CONTRIBUTION ID: {b.id.toUpperCase()}</span>
                          <span className="item-created-at">Received: {new Date(b.createdAt).toLocaleString()}</span>
                        </div>
                        <span className={`badge badge-${b.status}`} style={
                          b.status === 'approved' ? { background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' } :
                          b.status === 'denied' ? { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' } :
                          { background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }
                        }>
                          {b.status === 'pending' ? 'Pending Verification' : b.status === 'approved' ? 'Confirmed' : 'Rejected'}
                        </span>
                      </div>

                      <div className="item-card-body">
                        <div className="details-col">
                          <div className="details-group">
                            <h4 className="group-title">Supporter Profile</h4>
                            <div className="info-grid">
                              <div className="info-row"><span>Supporter Name:</span><strong>{supporterName}</strong></div>
                              <div className="info-row"><span>Designation:</span><strong>{designation}</strong></div>
                              <div className="info-row"><span>VP Name:</span><strong>{vpName}</strong></div>
                            </div>
                          </div>

                          <div className="details-group">
                            <h4 className="group-title">Financial Details</h4>
                            <div className="info-grid" style={{ marginBottom: '8px', gap: '6px' }}>
                              <div className="info-row"><span>Base Contribution:</span><strong>₹{baseAmount}</strong></div>
                              <div className="info-row"><span>GST (18%):</span><strong>₹{gstAmount}</strong></div>
                            </div>
                            <div className="price-display" style={{ borderTop: '1px dashed #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
                              <span>Total Amount (incl. GST):</span>
                              <span className="price-amount" style={{ color: '#10b981', fontSize: '1.25rem', fontWeight: '800' }}>₹{totalAmount}</span>
                            </div>
                          </div>
                        </div>

                        <div className="screenshot-col" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div>
                            <h4 className="group-title">UTR Number</h4>
                            <div className="utr-display-box">
                              <div className="utr-number-display">
                                <span className="utr-label-admin">UPI Transaction ID (UTR)</span>
                                <span className="utr-value-admin">{utrNumber}</span>
                              </div>
                            </div>
                          </div>

                          {vpImage && (
                            <div>
                              <h4 className="group-title">VP Image Preview</h4>
                              <div 
                                style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px solid #d1d5db', overflow: 'hidden', cursor: 'pointer' }}
                                onClick={() => setZoomedImage(vpImage)}
                              >
                                <img src={vpImage} alt="VP Upload" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            </div>
                          )}
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
                              <X size={14} /> Reject Contribution
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(b.id, 'approved')}
                              className="btn btn-approve-action"
                            >
                              <Check size={14} /> Approve Contribution
                            </button>
                          </>
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
                    <span style={{ color: '#6b7280' }}>Base Contribution Amount:</span>
                    <strong>₹{selectedContributionDetail.attendees?.SUPPORTER?.designation === 'Chief Executive Director' ? 1000 : 500}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#6b7280' }}>GST Amount (18%):</span>
                    <strong>₹{selectedContributionDetail.attendees?.SUPPORTER?.designation === 'Chief Executive Director' ? 180 : 90}</strong>
                  </div>
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

      <style jsx>{`
        .admin-dashboard-page {
          background: linear-gradient(to bottom, #f0fdf4 0%, #ffffff 100%);
          min-height: 100vh;
          padding-bottom: 5rem;
        }

        .admin-header-bar {
          background: #ffffff;
          color: #111827;
          padding: 1.25rem 0;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
          border-bottom: 1px solid rgba(22, 163, 74, 0.1);
        }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-title-logo {
          display: flex;
          align-items: center;
          gap: 0.85rem;
        }

        .brand-logo-img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(22, 163, 74, 0.2);
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.15);
          flex-shrink: 0;
        }

        .text-primary-green {
          color: var(--primary);
        }

        .workspace-suffix {
          font-weight: 500;
          color: var(--muted);
          margin-left: 0.4rem;
          font-size: 1.15rem;
          letter-spacing: -0.2px;
        }

        @media (max-width: 640px) {
          .workspace-suffix {
            display: none;
          }
        }

        .admin-workspace-title {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 800;
          line-height: 1.2;
          color: #111827;
          margin: 0;
          display: inline-flex;
          align-items: center;
        }

        .admin-user-tag {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 500;
        }

        .btn-admin-logout {
          background: #ffffff;
          color: #ef4444;
          border: 1px solid #fee2e2;
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
          background: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
        }

        .dashboard-content {
          margin-top: 2.5rem;
        }

        .event-row-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.75rem;
        }

        .btn-edit-event {
          background: var(--primary-light);
          color: var(--primary-dark);
          border: 1px solid rgba(22, 163, 74, 0.15);
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-edit-event:hover {
          background: var(--primary);
          color: white;
          transform: translateY(-1px);
        }

        .btn-delete-event {
          background: #fee2e2;
          color: #ef4444;
          border: 1px solid #fca5a5;
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-delete-event:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        /* Custom Deletion Confirmation Modal */
        .confirm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: modalFadeIn 0.2s ease-out forwards;
        }

        .confirm-modal-card {
          background: #ffffff;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          max-width: 440px;
          width: 100%;
          padding: 2rem;
          margin: 0 1rem;
          text-align: center;
          border: 1px solid rgba(0, 0, 0, 0.05);
          animation: modalZoomIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .confirm-modal-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .confirm-modal-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: #fee2e2;
          color: #ef4444;
          margin-bottom: 0.25rem;
        }

        .confirm-modal-icon {
          width: 26px;
          height: 26px;
        }

        .confirm-modal-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          color: #111827;
          margin: 0;
        }

        .confirm-modal-desc {
          font-size: 0.925rem;
          color: var(--muted);
          line-height: 1.5;
          margin: 0.5rem 0 1.5rem 0;
        }

        .confirm-modal-actions {
          display: flex;
          gap: 0.85rem;
          justify-content: center;
        }

        .btn-modal-cancel {
          background: #ffffff;
          color: #4b5563;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 0.625rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
        }
        .btn-modal-cancel:hover {
          background: #f9fafb;
          color: #111827;
          border-color: rgba(22, 163, 74, 0.2);
        }

        .btn-modal-delete {
          background: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 10px;
          padding: 0.625rem 1.5rem;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 1;
        }
        .btn-modal-delete:hover {
          background: #dc2626;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
          transform: translateY(-1px);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modalZoomIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .admin-section-tabs {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
          background: rgba(240, 253, 244, 0.4);
          border: 1px solid rgba(22, 163, 74, 0.12);
          border-radius: 14px;
          padding: 0.5rem;
          box-shadow: var(--shadow-sm);
        }

        .section-tab {
          border: none;
          background: transparent;
          color: #4b5563;
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 0.9rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .section-tab:hover {
          color: var(--primary-dark);
          background: rgba(22, 163, 74, 0.08);
        }

        .section-tab.active {
          background: #ffffff;
          color: var(--primary-hover);
          box-shadow: 0 4px 10px rgba(22, 163, 74, 0.08), 0 1px 3px rgba(22, 163, 74, 0.04);
          border: 1px solid rgba(22, 163, 74, 0.15);
        }

        /* Metrics Grid */
        .metrics-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        @media (min-width: 480px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 992px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .metric-card {
          background: #ffffff;
          border: 1px solid rgba(22, 163, 74, 0.15);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 4px;
          height: 100%;
          border-radius: 4px 0 0 4px;
        }
        .metric-card.rev-card::before { background: var(--primary); }
        .metric-card.pend-card::before { background: #f59e0b; }
        .metric-card.app-card::before { background: #10b981; }
        .metric-card.den-card::before { background: #ef4444; }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(22, 163, 74, 0.08);
          border-color: rgba(22, 163, 74, 0.25);
        }

        .metric-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .metric-icon-box.rev { background: var(--primary-light); color: var(--primary-dark); }
        .metric-icon-box.pend { background: #fffbeb; color: #d97706; }
        .metric-icon-box.app { background: #ecfdf5; color: #047857; }
        .metric-icon-box.den { background: #fef2f2; color: #b91c1c; }

        .metric-info {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .metric-label {
          font-size: 0.72rem;
          color: #6b7280;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.75px;
        }

        .metric-value {
          font-family: var(--font-heading);
          font-size: 1.75rem;
          font-weight: 800;
          color: #111827;
          line-height: 1.1;
        }

        .text-amber { color: #d97706; }
        .text-emerald { color: #047857; }
        .text-red { color: #ef4444; }

        /* Dashboard controls */
        .list-controls-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
          border-bottom: 2px solid rgba(22, 163, 74, 0.1);
          margin-bottom: 2.25rem;
          padding-bottom: 0.5rem;
        }

        @media (min-width: 640px) {
          .list-controls-bar {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 0;
          }
        }

        .tab-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (min-width: 640px) {
          .tab-buttons {
            gap: 1.75rem;
          }
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 1rem 0;
          font-family: var(--font-heading);
          font-size: 1.025rem;
          font-weight: 600;
          color: #6b7280;
          cursor: pointer;
          position: relative;
          transition: color 0.2s ease;
        }

        .tab-btn:hover {
          color: #111827;
        }

        .tab-btn.active {
          color: var(--primary-hover);
          font-weight: 700;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 3px;
          background: var(--primary);
          border-radius: 99px;
        }

        .btn-refresh {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          height: 38px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 8px;
        }

        .hover-spin-icon:hover .refresh-icon-spin {
          animation: spin 1s linear infinite;
        }

        .list-loading-spinner {
          text-align: center;
          padding: 6rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          border: 3px solid rgba(16, 185, 129, 0.1);
          border-left-color: var(--primary);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          animation: spin 1s linear;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-stream-card {
          background: white;
          border: 1px solid rgba(22, 163, 74, 0.15);
          border-radius: 16px;
          padding: 5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }

        .empty-icon {
          color: #cbd5e1;
        }

        .empty-stream-card p {
          color: #6b7280;
          max-width: 350px;
          line-height: 1.5;
        }

        .event-manager-area {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        .event-form-card,
        .events-list-card {
          background: white;
          border: 1px solid rgba(22, 163, 74, 0.15);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(22, 163, 74, 0.02);
          padding: 2rem;
        }

        .event-manager-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(22, 163, 74, 0.1);
          margin-bottom: 1.75rem;
        }

        .manager-kicker {
          display: block;
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }

        .event-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .event-form-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .span-2 {
            grid-column: span 2;
          }
        }

        .event-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .event-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.5rem;
        }

        .event-message {
          color: var(--primary-dark);
          font-weight: 700;
        }

        .publish-event-btn {
          min-width: 220px;
          justify-content: center;
        }

        .events-list-card h3 {
          margin-bottom: 1.25rem;
        }

        .events-empty {
          color: #6b7280;
          padding: 1rem 0;
        }

        .events-table-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .event-row {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1.25rem;
          border: 1px solid rgba(22, 163, 74, 0.15);
          border-radius: 12px;
          background: #ffffff;
          transition: border-color 0.2s;
        }
        .event-row:hover {
          border-color: rgba(22, 163, 74, 0.3);
        }

        @media (min-width: 640px) {
          .event-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            gap: 1rem;
          }
        }

        .event-row strong,
        .event-row span {
          display: block;
        }

        .event-row span {
          color: #6b7280;
          font-size: 0.9rem;
          margin-top: 0.2rem;
        }

        .event-row-meta {
          text-align: left;
          min-width: auto;
          border-top: 1px dashed rgba(22, 163, 74, 0.15);
          padding-top: 0.75rem;
          margin-top: 0.25rem;
        }

        @media (min-width: 640px) {
          .event-row-meta {
            text-align: right;
            min-width: 180px;
            border-top: none;
            padding-top: 0;
            margin-top: 0;
          }
        }

        /* Stream cards layout */
        .bookings-stream-list {
          display: flex;
          flex-direction: column;
          gap: 2.25rem;
        }

        .stream-item-card {
          background: white;
          border: 1px solid rgba(22, 163, 74, 0.12);
          border-radius: 16px;
          box-shadow: 0 4px 18px rgba(22, 163, 74, 0.02);
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hover-glow-card:hover {
          border-color: rgba(16, 185, 129, 0.28);
          box-shadow: 0 10px 25px rgba(22, 163, 74, 0.07);
          transform: translateY(-2px);
        }

        .stream-item-card.pending {
          border-left: 5px solid #f59e0b;
        }

        .stream-item-card.approved {
          border-left: 5px solid #10b981;
        }

        .stream-item-card.denied {
          border-left: 5px solid #ef4444;
        }

        .item-card-header {
          background: #fafdfb;
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid rgba(22, 163, 74, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .item-booking-id {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.9rem;
          color: #111827;
        }

        .item-created-at {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .item-card-body {
          padding: 2rem 1.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .item-card-body {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }

        .details-col {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .details-group {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .group-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--primary-hover);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          border-bottom: 1px solid rgba(22, 163, 74, 0.12);
          padding-bottom: 0.4rem;
          margin-bottom: 0.25rem;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          font-size: 0.9rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.45rem 0;
          border-bottom: 1px solid rgba(22, 163, 74, 0.04);
        }
        .info-row:last-child {
          border-bottom: none;
        }

        .info-row span {
          color: #6b7280;
          font-weight: 500;
        }

        .info-row strong {
          color: #111827;
        }

        .seats-span {
          font-weight: 700;
          background: var(--primary-light);
          color: var(--primary-dark);
          padding: 0.15rem 0.6rem;
          border-radius: 6px;
          font-size: 0.82rem;
          border: 1px solid rgba(22, 163, 74, 0.15);
        }

        .inline-arrow {
          vertical-align: middle;
          margin: 0 0.3rem;
          color: #cbd5e1;
        }

        .price-group {
          margin-top: auto;
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(22, 163, 74, 0.1);
        }

        .price-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-display span:first-child {
          font-weight: 600;
          color: #4b5563;
          font-size: 0.9rem;
        }

        .price-amount {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary-dark);
        }

        /* Screenshot Col */
        .screenshot-col {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .receipt-image-container {
          position: relative;
          border: 1px solid rgba(22, 163, 74, 0.15);
          border-radius: 12px;
          overflow: hidden;
          background: #f8fafc;
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.01);
          transition: border-color 0.2s;
        }
        .receipt-image-container:hover {
          border-color: rgba(22, 163, 74, 0.3);
        }

        .receipt-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .receipt-image-container:hover img {
          transform: scale(1.025);
        }

        .btn-zoom-receipt {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          color: white;
          padding: 0.5rem 0.85rem;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .btn-zoom-receipt:hover {
          background: rgba(15, 23, 42, 0.95);
        }

        .utr-display-box {
          background: #f0fdf4;
          border: 1px solid rgba(22, 163, 74, 0.2);
          border-radius: 12px;
          padding: 1.25rem;
        }

        /* Action footer */
        .item-card-footer {
          border-top: 1px solid rgba(22, 163, 74, 0.1);
          padding: 1.1rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.85rem;
          background: #fafdfb;
        }

        .btn-approve-action {
          background: var(--primary);
          color: white;
          border: none;
          font-weight: 600;
          padding: 0.625rem 1.35rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.88rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
        }

        .btn-approve-action:hover {
          background: var(--primary-hover);
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.25);
          transform: translateY(-1px);
        }

        .btn-deny-action {
          background: white;
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
          font-weight: 600;
          padding: 0.625rem 1.35rem;
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.88rem;
          transition: all 0.2s ease;
        }

        .btn-deny-action:hover {
          background: #fef2f2;
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        /* Lightbox modal zoom */
        .lightbox-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .lightbox-content {
          background: white;
          padding: 0.5rem;
          border-radius: 20px;
          max-width: 90%;
          max-height: 90%;
          position: relative;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .lightbox-close {
          position: absolute;
          top: -15px;
          right: -15px;
          background: #ef4444;
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          z-index: 10;
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 14px;
        }

        .admin-toast {
          position: fixed;
          bottom: 24px;
          right: 24px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.25rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
          z-index: 9999;
          font-weight: 600;
          font-size: 0.9rem;
          max-width: 380px;
          border-left: 4px solid #10b981;
          color: #1f2937;
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
      `}</style>
    </div>
  );
}
