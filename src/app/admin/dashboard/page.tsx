'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, DollarSign, Ticket, Clock, Check, X, LogOut, ArrowRight, Eye, RefreshCw } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [mounted, setMounted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [adminSection, setAdminSection] = useState<'registrations' | 'events'>('registrations');
  const [events, setEvents] = useState<any[]>([]);
  const [eventSaving, setEventSaving] = useState(false);
  const [eventMessage, setEventMessage] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: 'Success India Leadership Development Seminar',
    venue: 'Chromepet, Chennai',
    eventDateTime: '',
    price: '250',
    totalSeats: '60',
  });

  // Statistic counters
  const [stats, setStats] = useState({
    totalRevenue: 0,
    approvedCount: 0,
    pendingCount: 0,
    deniedCount: 0,
  });

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
    } catch (e) {
      router.push('/admin/login');
    }
  };

  const fetchAdminBookings = async (adminId: string) => {
    setLoading(true);
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
      } else {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('user');
          router.push('/admin/login');
        }
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
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

      setEventMessage(`Seminar event ${isEdit ? 'updated' : 'published'} successfully`);
      setEventForm({
        title: 'Success India Leadership Development Seminar',
        venue: 'Chromepet, Chennai',
        eventDateTime: '',
        price: '250',
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
      title: 'Success India Leadership Development Seminar',
      venue: 'Chromepet, Chennai',
      eventDateTime: '',
      price: '250',
      totalSeats: '60',
    });
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to permanently delete this seminar event? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/events?eventId=${eventId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-id': adminUser.id,
        },
      });

      if (res.ok) {
        alert('Event deleted successfully');
        fetchAdminEvents();
        if (editingEventId === eventId) {
          handleCancelEdit();
        }
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

  if (!mounted) return null;

  if (loading && !adminUser) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading administrator workspace...</p>
        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10rem 0;
            gap: 1rem;
            color: var(--muted);
          }
          .spinner {
            border: 3px solid rgba(16, 185, 129, 0.1);
            border-left-color: var(--primary);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Filter bookings strictly by active status tab
  const filteredBookings = bookings.filter((b) => b.status === activeTab);

  return (
    <div className="admin-dashboard-page animate-fade-in">
      {/* Header bar */}
      <div className="admin-header-bar animate-slide-down">
        <div className="container header-flex">
          <div className="admin-title-logo">
            <img src="/success-india-logo.jpeg" alt="Success India logo" className="brand-logo-img" />
            <div>
              <h1 className="admin-workspace-title">
                Success<span className="text-primary-green"> India</span>
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
          <div className="metric-card hover-lift">
            <div className="metric-icon-box rev">
              <DollarSign size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Approved Revenue</span>
              <h3 className="metric-value">₹{stats.totalRevenue}</h3>
            </div>
          </div>

          <div className="metric-card hover-lift">
            <div className="metric-icon-box pend">
              <Clock size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Pending Registrations</span>
              <h3 className="metric-value text-amber">{stats.pendingCount}</h3>
            </div>
          </div>

          <div className="metric-card hover-lift">
            <div className="metric-icon-box app">
              <Ticket size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Confirmed Seats</span>
              <h3 className="metric-value text-emerald">{stats.approvedCount}</h3>
            </div>
          </div>

          <div className="metric-card hover-lift">
            <div className="metric-icon-box den">
              <X size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Rejected Registrations</span>
              <h3 className="metric-value text-red">{stats.deniedCount}</h3>
            </div>
          </div>
        </div>

        <div className="admin-section-tabs animate-slide-up">
          <button
            onClick={() => setAdminSection('registrations')}
            className={`section-tab ${adminSection === 'registrations' ? 'active' : ''}`}
          >
            Registration Approvals
          </button>
          <button
            onClick={() => setAdminSection('events')}
            className={`section-tab ${adminSection === 'events' ? 'active' : ''}`}
          >
            Manage Seminars / Add New Event
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
                Pending Registrations ({stats.pendingCount})
              </button>
              <button 
                onClick={() => setActiveTab('approved')} 
                className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              >
                Approved History ({stats.approvedCount})
              </button>
              <button 
                onClick={() => setActiveTab('denied')} 
                className={`tab-btn ${activeTab === 'denied' ? 'active' : ''}`}
              >
                Rejected Log ({stats.deniedCount})
              </button>
            </div>
            <button onClick={() => fetchAdminBookings(adminUser.id)} className="btn btn-secondary btn-refresh hover-spin-icon">
              <RefreshCw size={14} className="refresh-icon-spin" /> <span>Sync Live Logs</span>
            </button>
          </div>

          {/* Bookings stream */}
          {loading ? (
            <div className="list-loading-spinner">
              <div className="spinner"></div>
              <p>Fetching database logs...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
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
                    <span className={`badge badge-${b.status}`}>{b.status === 'pending' ? 'Pending Audit' : b.status}</span>
                  </div>

                  {/* Main Grid: Details vs Screenshot */}
                  <div className="item-card-body">
                    
                    {/* Member and seminar booking info */}
                    <div className="details-col">
                      <div className="details-group">
                        <h4 className="group-title">Member / Attendee Profile</h4>
                        <div className="info-grid">
                          <div className="info-row"><span>Attendee Name:</span><strong>{b.user.name}</strong></div>
                          <div className="info-row"><span>Email Contact:</span><strong>{b.user.email}</strong></div>
                          <div className="info-row"><span>Helpline Mobile:</span><strong>{b.user.phone}</strong></div>
                        </div>
                      </div>

                      <div className="details-group">
                        <h4 className="group-title">Seminar Details & Seat Allocation</h4>
                        <div className="info-grid">
                          <div className="info-row"><span>Seminar Program:</span><strong>{b.seminarName || b.eventName}</strong></div>
                          <div className="info-row"><span>Venue / Seminar:</span><strong>{b.venue} <ArrowRight size={12} className="inline-arrow" /> {b.seminar}</strong></div>
                          <div className="info-row"><span>Seminar Date & Time:</span><strong>{b.date} &bull; {b.time}</strong></div>
                          <div className="info-row"><span>Allocated Seats:</span><span className="seats-span">{b.seats.join(', ')}</span></div>
                        </div>
                      </div>

                      <div className="details-group price-group">
                        <div className="price-display">
                          <span>Verified Total Paid:</span>
                          <span className="price-amount">₹{b.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Preview */}
                    <div className="screenshot-col">
                      <h4 className="group-title">Payment Screenshot Verification</h4>
                      <div className="receipt-image-container">
                        <img src={b.screenshot} alt="Payment Receipt" />
                        <button className="btn-zoom-receipt" onClick={() => setZoomedImage(b.screenshot)} title="Zoom Receipt">
                          <Eye size={16} /> View Fullscreen Receipt
                        </button>
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
                        <X size={16} /> Deny Booking
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(b.id, 'approved')} 
                        className="btn btn-approve-action"
                      >
                        <Check size={16} /> Approve Booking
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
        ) : (
          <div className="event-manager-area animate-slide-up">
            <div className="event-form-card glass-card">
              <div className="event-manager-header">
                <div>
                  <span className="manager-kicker">Event Management</span>
                  <h2 className="heading-md">
                    {editingEventId ? 'Edit / Modify Seminar Event' : 'Manage Seminars / Add New Event'}
                  </h2>
                </div>
                <button onClick={fetchAdminEvents} className="btn btn-secondary btn-refresh">
                  <RefreshCw size={14} /> Refresh Events
                </button>
              </div>

              <form onSubmit={handlePublishEvent} className="event-form-grid">
                <div className="event-form-group span-2">
                  <label className="form-label">Seminar Title</label>
                  <input
                    type="text"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    className="form-control"
                    placeholder="Success India Leadership Development Seminar"
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
                    <button type="submit" disabled={eventSaving} className="btn btn-primary publish-event-btn">
                      {eventSaving ? 'Saving Seminar...' : editingEventId ? 'Update Seminar Event' : 'Publish Seminar Event'}
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
                           <button onClick={() => handleDeleteEvent(event.id)} className="btn-delete-event">
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

      <style jsx>{`
        .admin-dashboard-page {
          background: linear-gradient(to bottom, #f0fdf4 0%, #ffffff 100%);
          min-height: 100vh;
          padding-bottom: 5rem;
        }

        .admin-header-bar {
          background: #ffffff;
          color: #000000;
          padding: 1rem 0;
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
          border-bottom: 1px solid var(--border);
        }

        .header-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .admin-title-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .brand-logo-img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(22, 163, 74, 0.22);
          filter: drop-shadow(0 2px 6px rgba(22, 163, 74, 0.25));
          flex-shrink: 0;
        }

        .text-primary-green {
          color: var(--primary);
        }

        .workspace-suffix {
          font-weight: 500;
          color: var(--muted);
          margin-left: 0.35rem;
          font-size: 1.15rem;
        }

        @media (max-width: 640px) {
          .workspace-suffix {
            display: none;
          }
        }

        .admin-workspace-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          line-height: 1.2;
          color: #000000;
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
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .btn-admin-logout:hover {
          background: #fee2e2;
          border-color: #fca5a5;
          transform: translateY(-1px);
          color: #ef4444;
        }

        .dashboard-content {
          margin-top: 2.5rem;
        }

        .event-row-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.625rem;
        }

        .btn-edit-event {
          background: var(--primary-light);
          color: var(--primary-dark);
          border: 1px solid var(--border);
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
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
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .btn-delete-event:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        .admin-section-tabs {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 2rem;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 0.75rem;
          box-shadow: var(--shadow-sm);
        }

        .section-tab {
          border: none;
          background: transparent;
          color: var(--muted);
          font-family: var(--font-heading);
          font-weight: 700;
          padding: 0.85rem 1.1rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .section-tab:hover {
          color: var(--primary-dark);
          background: var(--primary-light);
        }

        .section-tab.active {
          background: var(--primary);
          color: white;
          box-shadow: var(--shadow-primary);
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
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        }
        
        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
        }

        .metric-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: var(--radius-lg);
        }

        .metric-icon-box.rev { background: var(--primary-light); color: var(--primary-dark); }
        .metric-icon-box.pend { background: #fef3c7; color: #d97706; }
        .metric-icon-box.app { background: #d1fae5; color: var(--primary-dark); }
        .metric-icon-box.den { background: #fee2e2; color: #b91c1c; }

        .metric-info {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--foreground);
          line-height: 1.1;
        }

        .text-amber { color: #d97706; }
        .text-emerald { color: var(--primary-hover); }
        .text-red { color: #ef4444; }

        /* Dashboard controls */
        .list-controls-bar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: stretch;
          border-bottom: 2px solid var(--border);
          margin-bottom: 2rem;
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
            gap: 1.5rem;
          }
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 1rem 0;
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--muted);
          cursor: pointer;
          position: relative;
          transition: color var(--transition-fast);
        }

        .tab-btn:hover {
          color: var(--foreground);
        }

        .tab-btn.active {
          color: var(--primary-dark);
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
          gap: 0.35rem;
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
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 5rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-icon {
          color: var(--muted-light);
        }

        .empty-stream-card p {
          color: var(--muted);
          max-width: 350px;
          line-height: 1.5;
        }

        .event-manager-area {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        .event-form-card,
        .events-list-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-md);
          padding: 2rem;
        }

        .event-manager-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--border);
          margin-bottom: 1.5rem;
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
          gap: 1.25rem;
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
          gap: 0.45rem;
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
          margin-bottom: 1rem;
        }

        .events-empty {
          color: var(--muted);
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
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: var(--background);
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
          color: var(--muted);
          font-size: 0.9rem;
          margin-top: 0.2rem;
        }

        .event-row-meta {
          text-align: left;
          min-width: auto;
          border-top: 1px dashed var(--border);
          padding-top: 0.75rem;
          margin-top: 0.25rem;
        }

        @media (min-width: 640px) {
          .event-row-meta {
            text-align: right;
            min-width: 170px;
            border-top: none;
            padding-top: 0;
            margin-top: 0;
          }
        }

        /* Stream cards layout */
        .bookings-stream-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .stream-item-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          transition: all var(--transition-normal);
        }
        
        .hover-glow-card:hover {
          border-color: rgba(16, 185, 129, 0.25);
          box-shadow: 0 10px 20px -5px rgba(0,0,0,0.08);
        }

        .stream-item-card.pending {
          border-left: 5px solid var(--warning);
        }

        .stream-item-card.approved {
          border-left: 5px solid var(--success);
        }

        .stream-item-card.denied {
          border-left: 5px solid var(--danger);
        }

        .item-card-header {
          background: var(--background);
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .item-booking-id {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--foreground);
        }

        .item-created-at {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .item-card-body {
          padding: 1.75rem 1.5rem;
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
          gap: 1.5rem;
        }

        .details-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .group-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary-dark);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px dashed var(--border);
          padding-bottom: 0.25rem;
        }

        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          font-size: 0.9rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
        }

        .info-row span {
          color: var(--muted);
        }

        .info-row strong {
          color: var(--foreground);
        }

        .seats-span {
          font-weight: 700;
          background: var(--primary-light);
          color: var(--primary-dark);
          padding: 0 0.5rem;
          border-radius: var(--radius-sm);
        }

        .inline-arrow {
          vertical-align: middle;
          margin: 0 0.25rem;
          color: var(--muted-light);
        }

        .price-group {
          margin-top: auto;
          background: var(--input);
          padding: 1rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
        }

        .price-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-display span:first-child {
          font-weight: 600;
          color: var(--muted);
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
          gap: 0.75rem;
        }

        .receipt-image-container {
          position: relative;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          background: #f8fafc;
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
        }

        .receipt-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transition: transform 0.3s;
        }

        .receipt-image-container:hover img {
          transform: scale(1.02);
        }

        .btn-zoom-receipt {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border: none;
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          box-shadow: var(--shadow-sm);
        }

        .btn-zoom-receipt:hover {
          background: rgba(15, 23, 42, 0.9);
        }

        /* Action footer */
        .item-card-footer {
          border-top: 1px solid var(--border);
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          background: var(--background);
        }

        .btn-approve-action {
          background: var(--primary);
          color: white;
          border: none;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-primary);
        }

        .btn-approve-action:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .btn-deny-action {
          background: white;
          color: #b91c1c;
          border: 1px solid #fca5a5;
          font-weight: 600;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
        }

        .btn-deny-action:hover {
          background: #fee2e2;
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
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .lightbox-content {
          background: white;
          padding: 0.5rem;
          border-radius: var(--radius-xl);
          max-width: 90%;
          max-height: 90%;
          position: relative;
          box-shadow: var(--shadow-xl);
        }

        .lightbox-close {
          position: absolute;
          top: -15px;
          right: -15px;
          background: var(--danger);
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
          box-shadow: var(--shadow-md);
        }

        .lightbox-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: var(--radius-lg);
        }
      `}</style>
    </div>
  );
}
