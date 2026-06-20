'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, MapPin, Ticket, User, Hash, Clock,
  Download, CheckCircle, XCircle, AlertTriangle, Loader2, Users, Phone
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { label: string; color: string; bg: string; border: string; Icon: any }> = {
    approved: { label: 'Confirmed',        color: '#059669', bg: '#d1fae5', border: '#6ee7b7', Icon: CheckCircle },
    pending:  { label: 'Pending Approval', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', Icon: Clock },
    denied:   { label: 'Rejected',         color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
  };
  const { label, color, bg, border, Icon } = cfg[status] ?? { label: 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', Icon: AlertTriangle };

  return (
    <span className="t-status-badge" style={{ background: bg, border: `1.5px solid ${border}`, color }}>
      <Icon size={13} />
      {label}
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="t-info-row">
      <div className="t-info-icon"><Icon size={15} /></div>
      <div className="t-info-text">
        <span className="t-info-label">{label}</span>
        <span className="t-info-value">{value}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   QR Generator
───────────────────────────────────────────────────────── */
async function generateQR(text: string): Promise<string> {
  try {
    const QRCode = (await import('qrcode')).default;
    return await QRCode.toDataURL(text, { width: 200, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } });
  } catch { return ''; }
}

/* ─────────────────────────────────────────────────────────
   Main Content
───────────────────────────────────────────────────────── */
function BookingDetailsContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [loading,     setLoading]     = useState(true);
  const [ticket,      setTicket]      = useState<any>(null);
  const [error,       setError]       = useState('');
  const [qrUrl,       setQrUrl]       = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { router.push('/profile'); return; }
    if (!bookingId)  { setError('Invalid booking reference.'); setLoading(false); return; }

    fetch(`/api/verify?id=${encodeURIComponent(bookingId)}`)
      .then(r => { if (!r.ok) throw new Error('Ticket not found.'); return r.json(); })
      .then(data => {
        if (data?.ticket) {
          setTicket(data.ticket);
          const isSupporter =
            data.ticket.seats?.includes('SUPPORTER') ||
            data.ticket.seminarName?.toLowerCase().includes('supporter') ||
            data.ticket.eventName?.toLowerCase().includes('supporter');
          if (!isSupporter) {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            generateQR(`${origin}/verify?id=${encodeURIComponent(bookingId)}`).then(setQrUrl);
          }
        } else {
          setError('Failed to load booking details.');
        }
      })
      .catch(err => setError(err.message || 'Service temporarily unavailable.'))
      .finally(() => setLoading(false));
  }, [bookingId, router]);

  /* ─── Download ─── */
  const handleDownload = async () => {
    if (!ticket) return;
    setDownloading(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('printable-ticket');
      if (!el) return;

      const clone = el.cloneNode(true) as HTMLElement;
      clone.classList.add('tp-desktop');
      clone.style.cssText = `
        position:fixed;left:-9999px;top:0;z-index:-1;
        width:780px;border-radius:20px;
        font-family:system-ui,sans-serif;background:#ffffff;
      `;
      document.body.appendChild(clone);
      await new Promise(r => setTimeout(r, 180));

      const canvas = await html2canvas(clone, {
        scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false
      });
      document.body.removeChild(clone);

      const link = document.createElement('a');
      link.download = `Ticket-${bookingId.toUpperCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  /* ─── States ─── */
  if (loading) return (
    <div className="tp-state">
      <Loader2 size={42} className="tp-spin" />
      <p>Retrieving your ticket...</p>
    </div>
  );

  if (error || !ticket) return (
    <div className="tp-state tp-error">
      <AlertTriangle size={48} />
      <h2>Ticket Not Found</h2>
      <p>{error || 'This ticket could not be found or has expired.'}</p>
      <button className="tp-back-btn" onClick={() => router.push('/profile')}>
        <ArrowLeft size={16} /> Return to Profile
      </button>
    </div>
  );

  /* ─── Computed ─── */
  const isSupporter =
    ticket.seats?.includes('SUPPORTER') ||
    ticket.eventName?.toLowerCase().includes('supporter');

  const attendeeEntries: [string, { name: string; phone: string }][] =
    ticket.attendees ? Object.entries(ticket.attendees) : [];

  return (
    <div className="tp-page">
      {/* Back */}
      <button className="tp-back-link" onClick={() => router.push('/profile')}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      {/* Printable Ticket */}
      <div id="printable-ticket" className={`tp-ticket status-${ticket.status}`}>

        {/* Top accent */}
        <div className="tp-accent" />

        {/* Header */}
        <div className="tp-header">
          <div className="tp-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/success-india-logo.jpeg" alt="Success Team" className="tp-logo" />
            <div>
              <p className="tp-brand-name">SUCCESS TEAM</p>
              <p className="tp-brand-sub">Official Event Delegate Pass</p>
            </div>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        {/* Perforation */}
        <div className="tp-perf">
          <div className="tp-hole tp-hole-l" />
          <div className="tp-dash" />
          <div className="tp-hole tp-hole-r" />
        </div>

        {/* Body */}
        <div className={`tp-body ${isSupporter ? 'tp-body-solo' : ''}`}>

          {/* Left — event details */}
          <div className="tp-details">
            <h1 className="tp-event-name">{ticket.eventName}</h1>
            {ticket.session && ticket.session !== ticket.eventName && (
              <p className="tp-session">{ticket.session}</p>
            )}

            <div className="tp-grid">
              <InfoRow icon={Hash}     label="Booking ID"  value={`#${ticket.bookingId?.toUpperCase()}`} />
              <InfoRow icon={Calendar} label="Date"        value={ticket.date} />
              <InfoRow icon={Clock}    label="Time"        value={ticket.time} />
              <InfoRow icon={MapPin}   label="Venue"       value={ticket.venue} />
              <InfoRow icon={Ticket}   label="Seats"       value={ticket.seats?.join(', ') || '—'} />
              <InfoRow icon={User}     label="Booked By"   value={ticket.attendeeName} />
            </div>

            {/* Attendees Table */}
            {attendeeEntries.length > 0 && (
              <div className="tp-attendees">
                <div className="tp-attendees-head">
                  <Users size={14} />
                  <span>Attendees ({attendeeEntries.length})</span>
                </div>
                <div className="tp-attendees-table">
                  <div className="tp-att-header">
                    <span>Seat</span>
                    <span>Name</span>
                    <span>Phone</span>
                  </div>
                  {attendeeEntries.map(([seat, info], i) => (
                    <div key={seat} className={`tp-att-row ${i % 2 === 0 ? 'tp-att-even' : ''}`}>
                      <span className="tp-att-seat">{seat}</span>
                      <span className="tp-att-name">{info.name || '—'}</span>
                      <span className="tp-att-phone">
                        <Phone size={11} />
                        {info.phone || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — QR Code (non-supporter only) */}
          {!isSupporter && (
            <div className="tp-qr-col">
              <div className="tp-qr-wrap">
                <p className="tp-qr-label">Verification Pass</p>
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="QR Code" className="tp-qr-img" />
                ) : (
                  <div className="tp-qr-placeholder">
                    <Loader2 size={28} className="tp-spin" />
                  </div>
                )}
                <p className="tp-qr-ref">#{ticket.bookingId?.toUpperCase()}</p>
                <span className="tp-qr-hint">Scan at entry</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="tp-footer-bar">
          <span>This ticket is non-transferable · Valid for one-time entry</span>
        </div>
      </div>

      {/* Download */}
      <div className="tp-dl-wrap">
        <button
          className="tp-dl-btn"
          onClick={handleDownload}
          disabled={downloading || (!isSupporter && !qrUrl)}
        >
          <Download size={17} />
          {downloading ? 'Generating...' : 'Download Ticket'}
        </button>
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* Page shell */
        .tp-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem 5rem;
          font-family: var(--font-body, system-ui, sans-serif);
        }

        /* Back link */
        .tp-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--muted, #64748b);
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          margin-bottom: 1.5rem;
          transition: color 0.15s;
        }
        .tp-back-link:hover { color: #059669; }

        /* Loading / error states */
        .tp-state {
          min-height: 52vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          text-align: center;
          padding: 3rem 1.5rem;
          color: #64748b;
        }
        .tp-error { color: #dc2626; }
        .tp-error h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
        .tp-error p  { color: #64748b; margin: 0 0 1rem; }
        .tp-spin { animation: spin 1s linear infinite; color: #10b981; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .tp-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.7rem 1.4rem;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
        }

        /* ── TICKET CARD ── */
        .tp-ticket {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 48px rgba(15,23,42,0.09), 0 4px 16px rgba(15,23,42,0.05);
          border: 1px solid #e2e8f0;
        }

        /* Accent bar */
        .tp-accent {
          height: 5px;
          background: linear-gradient(90deg, #047857 0%, #10b981 55%, #34d399 100%);
        }

        /* Header */
        .tp-header {
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
        }
        .tp-brand {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .tp-logo {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          border: 1.5px solid #e2e8f0;
        }
        .tp-brand-name {
          font-weight: 900;
          font-size: 1rem;
          color: #0f172a;
          margin: 0;
          letter-spacing: 0.05em;
        }
        .tp-brand-sub {
          font-size: 0.73rem;
          color: #64748b;
          margin: 0;
        }

        /* Status badge */
        .t-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 13px;
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
        }

        /* Perforation */
        .tp-perf {
          display: flex;
          align-items: center;
        }
        .tp-hole {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          flex-shrink: 0;
        }
        .tp-hole-l { margin-left: -11px; }
        .tp-hole-r { margin-right: -11px; }
        .tp-dash {
          flex: 1;
          border-top: 2px dashed #cbd5e1;
          margin: 0 4px;
        }

        /* Body */
        .tp-body {
          display: grid;
          grid-template-columns: 1fr 200px;
          gap: 2rem;
          padding: 2rem;
        }
        .tp-body-solo {
          grid-template-columns: 1fr;
        }

        /* Event name */
        .tp-event-name {
          font-size: 1.55rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.2rem;
          line-height: 1.2;
          font-family: var(--font-heading, system-ui);
        }
        .tp-session {
          font-size: 0.88rem;
          color: #64748b;
          margin: 0 0 1.5rem;
          font-weight: 500;
        }

        /* Info grid */
        .tp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.85rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .t-info-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 0.55rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .t-info-icon {
          color: #10b981;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .t-info-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .t-info-label {
          font-size: 0.67rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
        }
        .t-info-value {
          font-size: 0.88rem;
          font-weight: 600;
          color: #1e293b;
          word-break: break-word;
        }

        /* Attendees section */
        .tp-attendees {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          overflow: hidden;
        }
        .tp-attendees-head {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0.65rem 1rem;
          background: #dcfce7;
          border-bottom: 1px solid #bbf7d0;
          font-size: 0.73rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #047857;
        }
        .tp-attendees-table {
          display: flex;
          flex-direction: column;
        }
        .tp-att-header {
          display: grid;
          grid-template-columns: 80px 1fr 1fr;
          gap: 0.5rem;
          padding: 0.45rem 1rem;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          border-bottom: 1px solid #d1fae5;
        }
        .tp-att-row {
          display: grid;
          grid-template-columns: 80px 1fr 1fr;
          gap: 0.5rem;
          padding: 0.55rem 1rem;
          align-items: center;
          border-bottom: 1px solid #ecfdf5;
          transition: background 0.1s;
        }
        .tp-att-row:last-child { border-bottom: none; }
        .tp-att-even { background: rgba(240,253,244,0.6); }
        .tp-att-seat {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #10b981;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          width: fit-content;
          min-width: 36px;
          text-align: center;
        }
        .tp-att-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #111827;
        }
        .tp-att-phone {
          font-size: 0.78rem;
          color: #4b5563;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .tp-att-phone svg {
          display: inline-block;
          vertical-align: middle;
          flex-shrink: 0;
        }

        /* QR column */
        .tp-qr-col {
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 2px dashed #e2e8f0;
          padding-left: 2rem;
        }
        .tp-qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.55rem;
          text-align: center;
          padding-top: 0.5rem;
        }
        .tp-qr-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          margin: 0;
        }
        .tp-qr-img {
          width: 150px;
          height: 150px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }
        .tp-qr-placeholder {
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
        }
        .tp-qr-ref {
          font-family: monospace;
          font-size: 0.78rem;
          font-weight: 700;
          color: #334155;
          margin: 0;
        }
        .tp-qr-hint {
          font-size: 0.67rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }

        /* Footer bar */
        .tp-footer-bar {
          padding: 0.75rem 2rem;
          background: #0f172a;
          color: rgba(255,255,255,0.6);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-align: center;
        }

        /* Download */
        .tp-dl-wrap {
          display: flex;
          justify-content: center;
          margin-top: 1.5rem;
        }
        .tp-dl-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0.8rem 2rem;
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 0.92rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(15,23,42,0.15);
          transition: transform 0.12s ease, opacity 0.15s ease;
          font-family: inherit;
        }
        .tp-dl-btn:hover   { transform: translateY(-2px); opacity: 0.94; }
        .tp-dl-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

        /* Responsive */
        @media (max-width: 720px) {
          .tp-ticket:not(.tp-desktop) .tp-body {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 1.5rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-qr-col {
            border-left: none;
            border-top: 2px dashed #e2e8f0;
            padding-left: 0;
            padding-top: 1.5rem;
            justify-content: flex-start;
          }
          .tp-ticket:not(.tp-desktop) .tp-grid { grid-template-columns: 1fr; }
          .tp-ticket:not(.tp-desktop) .tp-header { padding: 1.25rem 1.5rem; }
          .tp-ticket:not(.tp-desktop) .tp-footer-bar { padding: 0.65rem 1.5rem; }
          .tp-ticket:not(.tp-desktop) .tp-att-header,
          .tp-ticket:not(.tp-desktop) .tp-att-row { grid-template-columns: 70px 1fr 1fr; }
        }

        @media (max-width: 480px) {
          .tp-ticket:not(.tp-desktop) .tp-event-name { font-size: 1.25rem; }
          .tp-ticket:not(.tp-desktop) .tp-att-header,
          .tp-ticket:not(.tp-desktop) .tp-att-row {
            grid-template-columns: 55px 1fr 1.1fr;
            gap: 0.35rem;
            padding: 0.5rem 0.75rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-name {
            font-size: 0.75rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-phone {
            font-size: 0.72rem;
          }
        }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Export
───────────────────────────────────────────────────────── */
export default function BookingDetailsPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#64748b' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#10b981' }} />
        <p>Loading ticket...</p>
      </div>
    }>
      <BookingDetailsContent />
    </Suspense>
  );
}
