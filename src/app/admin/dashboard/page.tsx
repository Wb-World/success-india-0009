'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, DollarSign, Ticket, Clock, Check, X, LogOut, ArrowRight, Eye, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [mounted, setMounted] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

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

  const handleStatusUpdate = async (bookingId: string, actionStatus: 'approved' | 'denied') => {
    if (!confirm(`Are you sure you want to mark this credentials request as ${actionStatus.toUpperCase()}?`)) {
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
        alert(data.error || 'Failed to update access status');
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
        <p>Loading operator workspace mainframe...</p>
        <style jsx>{`
          .admin-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10rem 0;
            gap: 1rem;
            color: var(--primary);
            font-family: var(--font-mono);
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
    <div className="admin-dashboard-page animate-fade-in scanlines">
      {/* Header bar */}
      <div className="admin-header-bar animate-slide-down">
        <div className="container header-flex">
          <div className="admin-title-logo">
            <Shield className="logo-shield animate-pulse" />
            <div>
              <h1 className="admin-workspace-title glow-text">CyberStrike Control Deck</h1>
              <span className="admin-user-tag">OPERATOR DECRYPTOR NODE: {adminUser?.name}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-admin-logout">
            <LogOut size={16} /> Disconnect Mainframe
          </button>
        </div>
      </div>

      <div className="container dashboard-content">
        
        {/* Metric Cards Row */}
        <div className="metrics-cards-grid animate-slide-up">
          <div className="metric-card">
            <div className="metric-icon-box rev">
              <DollarSign size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Decrypted Credits</span>
              <h3 className="metric-value" style={{ color: '#10b981' }}>₹{stats.totalRevenue}</h3>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box pend">
              <Clock size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Unaudited Requests</span>
              <h3 className="metric-value text-amber">{stats.pendingCount}</h3>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box app">
              <Ticket size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Authorized Desks</span>
              <h3 className="metric-value text-emerald">{stats.approvedCount}</h3>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-box den">
              <X size={22} />
            </div>
            <div className="metric-info">
              <span className="metric-label">Terminated Passes</span>
              <h3 className="metric-value text-red">{stats.deniedCount}</h3>
            </div>
          </div>
        </div>

        {/* List Controls */}
        <div className="dashboard-main-area animate-slide-up">
          <div className="list-controls-bar">
            <div className="tab-buttons">
              <button 
                onClick={() => setActiveTab('pending')} 
                className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
              >
                Unaudited Requests ({stats.pendingCount})
              </button>
              <button 
                onClick={() => setActiveTab('approved')} 
                className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              >
                Authorized History ({stats.approvedCount})
              </button>
              <button 
                onClick={() => setActiveTab('denied')} 
                className={`tab-btn ${activeTab === 'denied' ? 'active' : ''}`}
              >
                Terminated Log ({stats.deniedCount})
              </button>
            </div>
            <button onClick={() => fetchAdminBookings(adminUser.id)} className="btn btn-secondary btn-refresh hover-spin-icon">
              <RefreshCw size={14} className="refresh-icon-spin" /> <span>Sync Live main logs</span>
            </button>
          </div>

          {/* Bookings stream */}
          {loading ? (
            <div className="list-loading-spinner">
              <div className="spinner"></div>
              <p style={{ color: '#94a3b8' }}>Fetching encrypted database packets...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-stream-card glass-card">
              <Terminal size={48} className="empty-icon" />
              <h3 className="heading-sm">NO ENCRYPTED PACKETS REGISTERED</h3>
              <p>There are no security credentials matching the &quot;{activeTab}&quot; audit logs registered in the database mainframe.</p>
            </div>
          ) : (
            <div className="bookings-stream-list">
              {filteredBookings.map((b) => (
                <div key={b.id} className={`stream-item-card glass-card ${b.status}`}>
                  
                  {/* Item top header info */}
                  <div className="item-card-header">
                    <div className="header-left">
                      <span className="item-booking-id" style={{ color: 'white' }}>ORDER NODE: #{b.id.toUpperCase()}</span>
                      <span className="item-created-at" style={{ color: 'var(--muted)' }}>Logged: {new Date(b.createdAt).toLocaleString()}</span>
                    </div>
                    <span className={`badge badge-${b.status}`}>{b.status === 'pending' ? 'Pending Decryption' : b.status}</span>
                  </div>

                  {/* Main Grid: Details vs Screenshot */}
                  <div className="item-card-body">
                    
                    {/* Passenger & Booking Info */}
                    <div className="details-col">
                      <div className="details-group">
                        <h4 className="group-title">Operative profile</h4>
                        <div className="info-grid">
                          <div className="info-row"><span>Codename Name:</span><strong>{b.user.name}</strong></div>
                          <div className="info-row"><span>Secure Mail:</span><strong>{b.user.email}</strong></div>
                          <div className="info-row"><span>Contact Line:</span><strong>{b.user.phone}</strong></div>
                        </div>
                      </div>

                      <div className="details-group">
                        <h4 className="group-title">Module Track & Terminal Assignment</h4>
                        <div className="info-grid">
                          <div className="info-row"><span>Session Title:</span><strong>{b.busName}</strong></div>
                          <div className="info-row"><span>Target Sector:</span><strong>{b.source} <ArrowRight size={12} className="inline-arrow" /> {b.destination}</strong></div>
                          <div className="info-row"><span>Schedule Slot:</span><strong>{b.date} &bull; {b.time}</strong></div>
                          <div className="info-row"><span>Allocated Nodes:</span><span className="seats-span">{b.seats.join(', ')}</span></div>
                        </div>
                      </div>

                      <div className="details-group price-group" style={{ background: 'var(--input)', border: '1px solid var(--border)' }}>
                        <div className="price-display">
                          <span>Verified Credits Paid:</span>
                          <span className="price-amount" style={{ color: '#10b981' }}>₹{b.totalPrice}</span>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Preview */}
                    <div className="screenshot-col">
                      <h4 className="group-title">Decryption Proof (Receipt)</h4>
                      <div className="receipt-image-container" style={{ background: '#030712', border: '1px solid var(--border)' }}>
                        <img src={b.screenshot} alt="Payment Receipt" />
                        <button className="btn-zoom-receipt" onClick={() => setZoomedImage(b.screenshot)} title="Zoom Receipt">
                          <Eye size={16} /> View Decryption Grid
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* Action footer for pending bookings */}
                  {b.status === 'pending' && (
                    <div className="item-card-footer animate-fade-in" style={{ background: '#0b111e', borderTop: '1px solid var(--border)' }}>
                      <button 
                        onClick={() => handleStatusUpdate(b.id, 'denied')} 
                        className="btn btn-deny-action"
                      >
                        <X size={16} /> Terminate Entry
                      </button>
                      <button 
                        onClick={() => handleStatusUpdate(b.id, 'approved')} 
                        className="btn btn-approve-action"
                      >
                        <Check size={16} /> Authorize Pass
                      </button>
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Lightbox Modal */}
      {zoomedImage && (
        <div className="lightbox-overlay" onClick={() => setZoomedImage(null)}>
          <div className="lightbox-content animate-scale-in" onClick={(e) => e.stopPropagation()} style={{ background: 'rgba(8,12,22,0.95)', border: '1px solid var(--border)' }}>
            <button className="lightbox-close" onClick={() => setZoomedImage(null)}>&times;</button>
            <img src={zoomedImage} alt="Receipt Full Size" className="lightbox-image" />
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-dashboard-page {
          background-color: var(--background);
          min-height: 100vh;
          padding-bottom: 5rem;
        }

        .admin-header-bar {
          background: #040811;
          color: white;
          padding: 1.25rem 0;
          box-shadow: 0 4px 10px rgba(0,0,0,0.5);
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

        .logo-shield {
          color: var(--primary);
          width: 32px;
          height: 32px;
          filter: drop-shadow(0 0 5px var(--primary-glow));
        }

        .admin-workspace-title {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 900;
          line-height: 1.2;
        }

        .admin-user-tag {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 500;
          font-family: var(--font-mono);
        }

        .btn-admin-logout {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.25);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          gap: 0.375rem;
          text-transform: uppercase;
        }

        .btn-admin-logout:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: translateY(-1px);
        }

        .dashboard-content {
          margin-top: 2.5rem;
        }

        /* Metrics Grid */
        .metrics-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        @media (min-width: 992px) {
          .metrics-cards-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .metric-card {
          background: rgba(8, 12, 22, 0.8);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-sm);
        }

        .metric-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: var(--radius-lg);
        }

        .metric-icon-box.rev { background: rgba(16, 185, 129, 0.1); color: var(--primary); border: 1px solid rgba(16, 185, 129, 0.2); }
        .metric-icon-box.pend { background: rgba(245, 158, 11, 0.1); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
        .metric-icon-box.app { background: rgba(6, 182, 212, 0.1); color: #22d3ee; border: 1px solid rgba(6, 182, 212, 0.2); }
        .metric-icon-box.den { background: rgba(239, 68, 68, 0.1); color: #fca5a5; border: 1px solid rgba(239, 68, 68, 0.2); }

        .metric-info {
          display: flex;
          flex-direction: column;
        }

        .metric-label {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .metric-value {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 900;
          color: white;
          line-height: 1.1;
        }

        .text-amber { color: #fbbf24; }
        .text-emerald { color: #22d3ee; }
        .text-red { color: #ef4444; }

        /* Dashboard controls */
        .list-controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid var(--border);
          margin-bottom: 2rem;
        }

        .tab-buttons {
          display: flex;
          gap: 1.5rem;
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 1rem 0;
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          position: relative;
          transition: color var(--transition-fast);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tab-btn:hover {
          color: white;
        }

        .tab-btn.active {
          color: var(--primary);
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
          box-shadow: 0 0 8px var(--primary);
        }

        .btn-refresh {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          height: 38px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          text-transform: uppercase;
          font-weight: 700;
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
          background: rgba(8, 12, 22, 0.8);
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

        /* Stream cards layout */
        .bookings-stream-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .stream-item-card {
          background: rgba(8, 12, 22, 0.8);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-md);
          overflow: hidden;
          transition: all var(--transition-normal);
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
          background: rgba(4, 8, 17, 0.8);
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
        }

        .item-created-at {
          font-size: 0.75rem;
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
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--primary);
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
          color: white;
        }

        .seats-span {
          font-weight: 700;
          background: var(--primary-light);
          color: var(--primary);
          padding: 0 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .inline-arrow {
          vertical-align: middle;
          margin: 0 0.25rem;
          color: var(--muted-light);
        }

        .price-group {
          margin-top: auto;
          padding: 1rem;
          border-radius: var(--radius-lg);
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
          font-weight: 900;
        }

        /* Screenshot Col */
        .screenshot-col {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .receipt-image-container {
          position: relative;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-xl);
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
          background: rgba(12, 17, 29, 0.85);
          border: 1px solid var(--border);
          color: white;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          box-shadow: var(--shadow-sm);
        }

        .btn-zoom-receipt:hover {
          background: var(--primary);
          color: #022c22;
          border-color: var(--primary);
        }

        /* Action footer */
        .item-card-footer {
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
        }

        .btn-approve-action {
          background: var(--primary);
          color: #022c22;
          border: none;
          font-weight: 700;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-primary);
          text-transform: uppercase;
        }

        .btn-approve-action:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
        }

        .btn-deny-action {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
          font-weight: 700;
          padding: 0.625rem 1.25rem;
          border-radius: var(--radius-lg);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.9rem;
          transition: all var(--transition-fast);
          text-transform: uppercase;
        }

        .btn-deny-action:hover {
          background: #ef4444;
          color: white;
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
          background: rgba(3, 7, 18, 0.9);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
        }

        .lightbox-content {
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
