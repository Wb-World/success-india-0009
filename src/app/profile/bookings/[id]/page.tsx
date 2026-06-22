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
  const cfg: Record<string, { label: string; color: string; bg: string; border: string; iconChar: string }> = {
    approved: { label: 'Confirmed',        color: '#059669', bg: '#d1fae5', border: '#6ee7b7', iconChar: '✓' },
    pending:  { label: 'Pending Approval', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', iconChar: '⏳' },
    denied:   { label: 'Rejected',         color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', iconChar: '✗' },
  };
  const { label, color, bg, border, iconChar } = cfg[status] ?? { label: 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', iconChar: '?' };

  return (
    <div className="t-status-badge" style={{
      background: bg,
      border: `1.5px solid ${border}`,
      color,
      padding: '2px 14px 6px',
      borderRadius: '9999px',
      display: 'inline-block',
      verticalAlign: 'middle',
      boxSizing: 'border-box',
      whiteSpace: 'nowrap',
      lineHeight: '1',
      textAlign: 'center'
    }}>
      <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', verticalAlign: 'middle' }}>
        <span style={{ marginRight: '6px', fontSize: '0.85rem', verticalAlign: 'middle' }}>{iconChar}</span>
        {label}
      </span>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="t-info-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.55rem', marginBottom: '0.85rem', boxSizing: 'border-box' }}>
      <div className="t-info-icon" style={{ color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} style={{ display: 'block' }} />
      </div>
      <div className="t-info-text" style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0, textAlign: 'left' }}>
        <span className="t-info-label" style={{ fontSize: '0.67rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', lineHeight: '1.2' }}>{label}</span>
        <span className="t-info-value" style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.3', wordBreak: 'break-word' }}>{value}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   QR Generator
───────────────────────────────────────────────────────── */
async function generateQR(text: string): Promise<string> {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&color=0f172a&bgcolor=ffffff&qzone=1&margin=1&format=png`;
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
            // Use structured key-value QR payload from server (includes SIGNATURE)
            const qrPayload = data.ticket.qrCodePayload;
            if (qrPayload) {
              generateQR(qrPayload).then(setQrUrl);
            }
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

      const isSupp = el.classList.contains('tp-supporter-ticket') ||
                     ticket.seats?.includes('SUPPORTER') ||
                     ticket.eventName?.toLowerCase().includes('supporter');

      const clone = el.cloneNode(true) as HTMLElement;
      clone.classList.add('tp-desktop');
      clone.style.cssText = `
        position:absolute;left:-9999px;top:-9999px;
        width:${isSupp ? '600px' : '780px'};border-radius:20px;
        background:#ffffff;
      `;
      document.body.appendChild(clone);

      // Pre-load all image assets inside the cloned node
      const images = Array.from(clone.getElementsByTagName('img'));
      
      // Apply cache-busting to image URLs to ensure freshest render
      images.forEach(img => {
        if (img.src && !img.src.startsWith('data:')) {
          const sep = img.src.includes('?') ? '&' : '?';
          img.src = `${img.src}${sep}cb=${Date.now()}`;
          img.crossOrigin = 'anonymous';
        }
      });

      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            const timer = setTimeout(resolve, 1500); // safety timeout
            img.onload = () => { clearTimeout(timer); resolve(null); };
            img.onerror = () => { clearTimeout(timer); resolve(null); };
          });
        })
      );
      await new Promise(r => setTimeout(r, 150));

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

  const attendeeEntries: [string, any][] =
    ticket.attendees ? Object.entries(ticket.attendees) : [];

  const supporterInfo = attendeeEntries[0]?.[1];
  const vpImageUrl = supporterInfo?.vpImage || '';
  const vpNameVal = supporterInfo?.vpName || ticket.bookerVpName || '—';
  const designationVal = supporterInfo?.designation || ticket.eventName.replace("Success Team System Supporter - ", "") || 'System Supporter';

  return (
    <div className="tp-page">
      {/* Back */}
      <button className="tp-back-link" onClick={() => router.push('/profile')}>
        <ArrowLeft size={15} /> Back to Dashboard
      </button>

      {/* Printable Ticket */}
      <div id="printable-ticket" className={`tp-ticket status-${ticket.status} ${isSupporter ? 'tp-supporter-ticket' : ''}`}>

        {/* Top accent */}
        <div className="tp-accent" />

        {isSupporter ? (
          /* Redesigned Supporter / Contribution Ticket */
          <div className="tp-supporter-body">
            <div className="tp-supporter-header">
              <div className="tp-brand-center">
                <img src="/success-india-logo.jpeg" alt="Success Team" className="tp-logo-center" />
                <h1 className="tp-supporter-brand-title">SUCCESS TEAM</h1>
                <p className="tp-supporter-brand-sub">System Supporter Delegate Pass</p>
              </div>
            </div>

            <div className="tp-supporter-content">
              <div className="tp-supporter-badge-wrap">
                <StatusBadge status={ticket.status} />
              </div>

              {vpImageUrl && (
                <div className="tp-supporter-avatar-wrap">
                  <img src={vpImageUrl} alt={ticket.attendeeName} className="tp-supporter-avatar" />
                </div>
              )}

              <h2 className="tp-supporter-name">{ticket.attendeeName}</h2>
              <p className="tp-supporter-designation">{designationVal}</p>

              <div className="tp-supporter-divider" />

              <div className="tp-supporter-details-table">
                <div className="tp-supporter-row">
                  <span className="tp-supporter-cell-label">Contribution Ref</span>
                  <strong className="tp-supporter-cell-value font-mono">#{ticket.bookingId?.toUpperCase()}</strong>
                </div>
                <div className="tp-supporter-row">
                  <span className="tp-supporter-cell-label">VP Name</span>
                  <strong className="tp-supporter-cell-value">{vpNameVal}</strong>
                </div>
                <div className="tp-supporter-row">
                  <span className="tp-supporter-cell-label">Date &amp; Time</span>
                  <strong className="tp-supporter-cell-value">{ticket.date} at {ticket.time}</strong>
                </div>
                <div className="tp-supporter-row">
                  <span className="tp-supporter-cell-label">Contribution Amount</span>
                  <strong className="tp-supporter-cell-value tp-sup-amount">{ticket.amountPaid}</strong>
                </div>
              </div>
            </div>

            <div className="tp-supporter-footer">
              <span>Thank you for supporting the Success Team mission</span>
            </div>
          </div>
        ) : (
          /* Regular Event Ticket (Same redesigned container) */
          <>
            {/* Header */}
            <div className="tp-header">
              <div className="tp-header-left">
                <img src="/success-india-logo.jpeg" alt="Success Team" className="tp-logo" />
                <div className="tp-brand-text">
                  <p className="tp-brand-name">SUCCESS TEAM</p>
                  <p className="tp-brand-sub">Official Event Delegate Pass</p>
                </div>
              </div>
              <div className="tp-status-cell">
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            {/* Perforation */}
            <div className="tp-perf">
              <div className="tp-hole tp-hole-l" />
              <div className="tp-dash" />
              <div className="tp-hole tp-hole-r" />
            </div>

            {/* Body */}
            <div className="tp-body">
              {/* Left — event details */}
              <div className="tp-details">
                <h1 className="tp-event-name">{ticket.eventName}</h1>
                {ticket.session && ticket.session !== ticket.eventName && (
                  <p className="tp-session">{ticket.session}</p>
                )}

                <div className="tp-details-grid">
                  <div className="tp-details-grid-item">
                    <InfoRow icon={Hash} label="Booking ID" value={`#${ticket.bookingId?.toUpperCase()}`} />
                  </div>
                  <div className="tp-details-grid-item">
                    <InfoRow icon={Calendar} label="Date" value={ticket.date} />
                  </div>
                  <div className="tp-details-grid-item">
                    <InfoRow icon={Clock} label="Time" value={ticket.time} />
                  </div>
                  <div className="tp-details-grid-item">
                    <InfoRow icon={MapPin} label="Venue" value={ticket.venue} />
                  </div>
                  <div className="tp-details-grid-item">
                    <InfoRow icon={Ticket} label="Seats" value={ticket.seats?.join(', ') || '—'} />
                  </div>
                  <div className="tp-details-grid-item">
                    <InfoRow icon={User} label="Booked By" value={ticket.attendeeName} />
                  </div>
                  {ticket.bookerPhone && ticket.bookerPhone !== '—' && (
                    <div className="tp-details-grid-item">
                      <InfoRow icon={Phone} label="Phone Number" value={ticket.bookerPhone} />
                    </div>
                  )}
                </div>

                {/* Attendees Section */}
                {attendeeEntries.length > 0 && (
                  <div className="tp-attendees">
                    <div className="tp-attendees-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} style={{ flexShrink: 0, display: 'block' }} />
                        <span style={{ lineHeight: '1' }}>Attendees ({attendeeEntries.length})</span>
                      </div>
                    </div>
                    <div className="tp-att-list">
                      <div className="tp-att-header-row">
                        <div className="tp-att-col tp-col-seat">Seat</div>
                        <div className="tp-att-col tp-col-name">Name</div>
                        <div className="tp-att-col tp-col-phone">Phone</div>
                      </div>
                      <div className="tp-att-body">
                        {attendeeEntries.map(([seat, info], i) => (
                          <div key={seat} className={`tp-att-item-row ${i % 2 === 0 ? 'tp-att-even' : ''}`}>
                            <div className="tp-att-col tp-col-seat">
                              <span className="tp-att-seat-badge">{seat}</span>
                            </div>
                            <div className="tp-att-col tp-col-name tp-att-name">{info.name || '—'}</div>
                            <div className="tp-att-col tp-col-phone tp-att-phone">
                              <span style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                                <Phone size={11} />
                              </span>
                              <span style={{ display: 'inline-block', verticalAlign: 'middle', lineHeight: '1' }}>
                                {info.phone || (ticket.bookerPhone && ticket.bookerPhone !== '—' ? ticket.bookerPhone : '') || '—'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Perks */}
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px dashed #bbf7d0', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: '900', color: '#166534', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '0.5px' }}>COMPLETELY FREE EDUCATION</div>
                  <div style={{ color: '#065f46', marginBottom: '0.4rem', fontWeight: 700 }}>₹1000 REGISTRATION FEE COVERS:</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#064e3b', display: 'flex', flexDirection: 'column', gap: '0.3rem', fontWeight: 500 }}>
                    <li>✅ LUNCH</li>
                    <li>✅ 2 TIMES SNACKS</li>
                    <li>✅ MEETING HALL AND ARRANGEMENTS</li>
                  </ul>
                </div>
              </div>

              {/* Right — QR Code */}
              <div className="tp-qr-col">
                <div className="tp-qr-wrap">
                  <p className="tp-qr-label">Verification Pass</p>
                  {qrUrl ? (
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
            </div>

            {/* Footer bar */}
            <div className="tp-footer-bar">
              <span>This ticket is non-transferable - Valid for one-time entry</span>
            </div>
          </>
        )}
      </div>

      {/* Download */}
      {!isSupporter && (
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
      )}

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
          box-sizing: border-box;
          width: 100%;
          max-width: 780px;
          margin: 0 auto;
        }
        .tp-supporter-ticket {
          max-width: 600px !important;
        }

        /* Accent bar */
        .tp-accent {
          height: 5px;
          background: linear-gradient(90deg, #047857 0%, #10b981 55%, #34d399 100%);
        }

        /* Header */
        .tp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
          padding: 1.5rem 2rem;
          box-sizing: border-box;
          width: 100%;
        }
        .tp-header-left {
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
          display: block;
        }
        .tp-brand-text {
          text-align: left;
        }
        .tp-brand-name {
          font-weight: 900;
          font-size: 1rem;
          color: #0f172a;
          margin: 0 0 1px;
          letter-spacing: 0.05em;
          line-height: 1.2;
        }
        .tp-brand-sub {
          font-size: 0.73rem;
          color: #64748b;
          margin: 0;
          line-height: 1.2;
        }
        .tp-status-cell {
          display: flex;
          align-items: center;
          justify-content: flex-end;
        }

        /* Status badge */
        .t-status-badge {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          white-space: nowrap;
          border-radius: 9999px;
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
          display: flex;
          width: 100%;
          padding: 2rem;
          box-sizing: border-box;
          gap: 2rem;
        }

        /* Event name */
        .tp-event-name {
          font-size: 1.55rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.2rem;
          line-height: 1.2;
          font-family: var(--font-heading, system-ui);
          text-align: left;
        }
        .tp-session {
          font-size: 0.88rem;
          color: #64748b;
          margin: 0 0 1.5rem;
          font-weight: 500;
          text-align: left;
        }

        /* Details Grid */
        .tp-details-grid {
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          width: calc(100% + 1rem);
          margin-left: -0.5rem;
          margin-right: -0.5rem;
        }
        .tp-details-grid-item {
          width: 50%;
          box-sizing: border-box;
          padding: 0 0.5rem;
        }

        .tp-details {
          flex: 1;
          min-width: 0;
        }

        /* Attendees section */
        .tp-attendees {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
          box-sizing: border-box;
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
        .tp-att-list {
          width: 100%;
          display: flex;
          flex-direction: column;
        }
        .tp-att-header-row {
          display: flex;
          padding: 8px 12px;
          border-bottom: 2px solid #e2e8f0;
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tp-att-item-row {
          display: flex;
          padding: 8px 12px;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }
        .tp-att-item-row:last-child {
          border-bottom: none;
        }
        .tp-att-even {
          background-color: #f8fafc;
        }
        .tp-col-seat {
          width: 70px;
          flex-shrink: 0;
        }
        .tp-col-name {
          flex: 1;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          padding-bottom: 2px;
        }
        .tp-col-phone {
          width: 110px;
          flex-shrink: 0;
          text-align: right;
          white-space: nowrap;
        }
        .tp-att-seat-badge {
          display: inline-block;
          vertical-align: middle;
          background: #10b981;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          border-radius: 999px;
          min-width: 48px;
          padding: 2px 8px 6px;
          box-sizing: border-box;
          white-space: pre !important;
          word-break: keep-all !important;
          line-height: 1;
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
        }

        /* QR column */
        .tp-qr-col {
          flex-shrink: 0;
          width: 200px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          padding-left: 2rem;
          text-align: center;
          box-sizing: border-box;
          position: relative;
        }
        .tp-qr-col::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 0;
          border-left: 2px dashed #e2e8f0;
        }
        .tp-qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          width: 100%;
          text-align: center;
        }
        .tp-qr-label {
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          margin: 0 !important;
          padding: 0 !important;
          display: block;
          width: 100%;
          text-align: center;
          line-height: 1.2 !important;
        }
        .tp-qr-img {
          width: 130px;
          height: 130px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          display: block;
          margin: 0 auto;
        }
        .tp-qr-placeholder {
          width: 130px;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin: 0 auto;
        }
        .tp-qr-ref {
          font-family: monospace;
          font-size: 0.78rem;
          font-weight: 700;
          color: #334155;
          margin: 0;
          display: block;
          width: 100%;
          text-align: center;
        }
        .tp-qr-hint {
          font-size: 0.67rem;
          font-weight: 600;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          display: block;
          width: 100%;
          text-align: center;
        }

        /* Footer bar */
        .tp-footer-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 2rem;
          background: #0f172a;
          color: rgba(255,255,255,0.6);
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.02em;
          text-align: center;
          width: 100%;
          box-sizing: border-box;
        }
        .tp-footer-bar span {
          display: block;
          width: 100%;
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

        /* ── SUPPORTER TICKET ── */
        .tp-supporter-ticket {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 16px 48px rgba(15,23,42,0.09);
          max-width: 600px;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .tp-supporter-body {
          padding: 2.5rem 2.5rem 2.5rem;
          background: #ffffff;
        }
        .tp-supporter-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .tp-logo-center {
          width: 65px;
          height: 65px;
          border-radius: 50%;
          border: 2px solid #10b981;
          object-fit: cover;
          margin: 0 auto 0.75rem;
          display: block;
        }
        .tp-supporter-brand-title {
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .tp-supporter-brand-sub {
          font-size: 0.75rem;
          color: #10b981;
          font-weight: 800;
          margin: 0.2rem 0 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tp-supporter-content {
          text-align: center;
        }
        .tp-supporter-badge-wrap {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }
        .tp-supporter-avatar-wrap {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 1.25rem;
          border: 4px solid #10b981;
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.16);
          background: #f8fafc;
        }
        .tp-supporter-avatar {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .tp-supporter-name {
          font-size: 1.65rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.25rem;
        }
        .tp-supporter-designation {
          font-size: 0.85rem;
          font-weight: 800;
          color: #4b5563;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .tp-supporter-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #cbd5e1 50%, transparent);
          margin: 2rem 0;
        }
        .tp-supporter-details-table {
          display: table;
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 2rem;
        }
        .tp-supporter-row {
          display: table-row;
        }
        .tp-supporter-cell-label {
          display: table-cell;
          padding: 0.75rem 0;
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          text-align: left;
          border-bottom: 1px solid #f1f5f9;
        }
        .tp-supporter-cell-value {
          display: table-cell;
          padding: 0.75rem 0;
          font-size: 0.95rem;
          color: #1e293b;
          font-weight: 700;
          text-align: right;
          border-bottom: 1px solid #f1f5f9;
        }
        .tp-supporter-row:last-child .tp-supporter-cell-label,
        .tp-supporter-row:last-child .tp-supporter-cell-value {
          border-bottom: none;
        }
        .tp-sup-amount {
          color: #10b981 !important;
          font-size: 1.15rem !important;
          font-weight: 800 !important;
        }
        .tp-supporter-footer {
          background: #0f172a;
          padding: 1.15rem 2rem;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        /* Responsive */
        @media (max-width: 720px) {
          .tp-ticket:not(.tp-desktop) .tp-header {
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            padding: 1.25rem 1.5rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-header-left {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-brand-text {
            text-align: center;
          }
          .tp-ticket:not(.tp-desktop) .tp-status-cell {
            justify-content: center;
            width: 100%;
          }
          .tp-ticket:not(.tp-desktop) .tp-body {
            flex-direction: column;
            padding: 1.5rem;
            gap: 1.5rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-details {
            padding-right: 0;
          }
          .tp-ticket:not(.tp-desktop) .tp-qr-col {
            border-left: none;
            border-top: 2px dashed #e2e8f0;
            padding-left: 0;
            padding-top: 1.5rem;
            width: 100%;
          }
          .tp-ticket:not(.tp-desktop) .tp-details-grid-item {
            width: 100%;
            padding: 0;
          }
          .tp-ticket:not(.tp-desktop) .tp-footer-bar {
            padding: 0.65rem 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .tp-ticket:not(.tp-desktop) .tp-event-name {
            font-size: 1.25rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-table {
            display: block;
            width: 100%;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-table thead {
            display: none;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-table tbody,
          .tp-ticket:not(.tp-desktop) .tp-att-table tr,
          .tp-ticket:not(.tp-desktop) .tp-att-table td {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-row {
            padding: 0.5rem 0;
            border-bottom: 1px solid #d1fae5;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-row td {
            padding: 0.25rem 0.5rem;
            border: none;
          }
          .tp-ticket:not(.tp-desktop) .tp-att-col-seat {
            display: flex;
            justify-content: flex-start;
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
