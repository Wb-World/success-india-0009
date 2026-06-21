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
    <span className="t-status-badge" style={{ background: bg, border: `1.5px solid ${border}`, color, display: 'inline-block', padding: '4px 14px', borderRadius: '9999px' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', verticalAlign: 'middle' }}>
        <Icon size={13} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: '1' }}>{label}</span>
      </span>
    </span>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="t-info-row" style={{ display: 'table', width: '100%', borderCollapse: 'collapse' }}>
      <div style={{ display: 'table-row' }}>
        <div className="t-info-icon" style={{ display: 'table-cell', width: '25px', verticalAlign: 'middle', color: '#10b981' }}>
          <Icon size={15} style={{ display: 'block' }} />
        </div>
        <div className="t-info-text" style={{ display: 'table-cell', verticalAlign: 'middle', paddingLeft: '4px', textAlign: 'left' }}>
          <span className="t-info-label" style={{ display: 'block', fontSize: '0.67rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', lineHeight: '1.2' }}>{label}</span>
          <span className="t-info-value" style={{ display: 'block', fontSize: '0.88rem', fontWeight: '600', color: '#1e293b', lineHeight: '1.3', wordBreak: 'break-word' }}>{value}</span>
        </div>
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
            const bookingData = {
              id: data.ticket.bookingId,
              event: data.ticket.eventName,
              date: data.ticket.date,
              time: data.ticket.time,
              venue: data.ticket.venue,
              seats: data.ticket.seats,
              name: data.ticket.attendeeName,
              phone: data.ticket.bookerPhone || '',
              amount: data.ticket.amountPaid || data.ticket.totalPrice || '',
              status: data.ticket.status
            };
            const base64Data = typeof window !== 'undefined'
              ? window.btoa(unescape(encodeURIComponent(JSON.stringify(bookingData))))
              : '';
            const qrText = `${origin}/verify?id=${encodeURIComponent(bookingId)}&data=${encodeURIComponent(base64Data)}`;
            generateQR(qrText).then(setQrUrl);
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
        position:fixed;left:-9999px;top:0;z-index:-1;
        width:${isSupp ? '600px' : '780px'};border-radius:20px;
        font-family:system-ui,sans-serif;background:#ffffff;
      `;
      document.body.appendChild(clone);

      // Pre-load all image assets inside the cloned node
      const images = Array.from(clone.getElementsByTagName('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
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
              <div className="tp-header-row">
                <div className="tp-brand-logo-cell">
                  <img src="/success-india-logo.jpeg" alt="Success Team" className="tp-logo" />
                </div>
                <div className="tp-brand-text-cell">
                  <p className="tp-brand-name">SUCCESS TEAM</p>
                  <p className="tp-brand-sub">Official Event Delegate Pass</p>
                </div>
                <div className="tp-status-cell">
                  <StatusBadge status={ticket.status} />
                </div>
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

                <table className="tp-details-table">
                  <tbody>
                    <tr>
                      <td className="tp-details-cell">
                        <InfoRow icon={Hash} label="Booking ID" value={`#${ticket.bookingId?.toUpperCase()}`} />
                      </td>
                      <td className="tp-details-cell">
                        <InfoRow icon={Calendar} label="Date" value={ticket.date} />
                      </td>
                    </tr>
                    <tr>
                      <td className="tp-details-cell">
                        <InfoRow icon={Clock} label="Time" value={ticket.time} />
                      </td>
                      <td className="tp-details-cell">
                        <InfoRow icon={MapPin} label="Venue" value={ticket.venue} />
                      </td>
                    </tr>
                    <tr>
                      <td className="tp-details-cell">
                        <InfoRow icon={Ticket} label="Seats" value={ticket.seats?.join(', ') || '—'} />
                      </td>
                      <td className="tp-details-cell">
                        <InfoRow icon={User} label="Booked By" value={ticket.attendeeName} />
                      </td>
                    </tr>
                    {ticket.bookerPhone && ticket.bookerPhone !== '—' && (
                      <tr>
                        <td className="tp-details-cell" style={{ borderBottom: 'none' }}>
                          <InfoRow icon={Phone} label="Phone Number" value={ticket.bookerPhone} />
                        </td>
                        <td className="tp-details-cell" style={{ borderBottom: 'none' }}>{/* Balanced empty cell */}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Attendees Table */}
                {attendeeEntries.length > 0 && (
                  <div className="tp-attendees">
                    <div className="tp-attendees-head">
                      <Users size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle', marginTop: '-2px' }} />
                      <span style={{ verticalAlign: 'middle' }}>Attendees ({attendeeEntries.length})</span>
                    </div>
                    <table className="tp-att-table">
                      <thead>
                        <tr className="tp-att-header">
                          <th className="tp-att-col-seat">Seat</th>
                          <th className="tp-att-col-name">Name</th>
                          <th className="tp-att-col-phone">Phone</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendeeEntries.map(([seat, info], i) => (
                          <tr key={seat} className={`tp-att-row ${i % 2 === 0 ? 'tp-att-even' : ''}`}>
                            <td className="tp-att-col-seat">
                              <span className="tp-att-seat">{seat}</span>
                            </td>
                            <td className="tp-att-col-name tp-att-name">{info.name || '—'}</td>
                            <td className="tp-att-col-phone tp-att-phone">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <Phone size={11} style={{ flexShrink: 0 }} />
                                <span>
                                  {info.phone || (ticket.bookerPhone && ticket.bookerPhone !== '—' ? ticket.bookerPhone : '') || '—'}
                                </span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
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
              <span>This ticket is non-transferable · Valid for one-time entry</span>
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
        }

        /* Accent bar */
        .tp-accent {
          height: 5px;
          background: linear-gradient(90deg, #047857 0%, #10b981 55%, #34d399 100%);
        }

        /* Header */
        .tp-header {
          display: table;
          width: 100%;
          table-layout: fixed;
          background: #f8fafc;
          border-bottom: 1px solid #f1f5f9;
          padding: 1.5rem 2rem;
          box-sizing: border-box;
        }
        .tp-header-row {
          display: table-row;
        }
        .tp-brand-logo-cell {
          display: table-cell;
          vertical-align: middle;
          width: 44px;
        }
        .tp-brand-text-cell {
          display: table-cell;
          vertical-align: middle;
          padding-left: 0.8rem;
          text-align: left;
        }
        .tp-status-cell {
          display: table-cell;
          vertical-align: middle;
          text-align: right;
          width: 160px;
        }
        .tp-logo {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          object-fit: cover;
          border: 1.5px solid #e2e8f0;
          display: block;
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
          display: table;
          width: 100%;
          table-layout: fixed;
          padding: 2rem;
          box-sizing: border-box;
        }
        .tp-body-solo .tp-details {
          margin-right: 0;
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
          display: flex;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
          margin-left: -0.75rem;
          margin-right: -0.75rem;
        }
        .t-info-row {
          width: 50%;
          box-sizing: border-box;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          display: flex;
          align-items: center;
          padding-bottom: 0.55rem;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 0.85rem;
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
        .tp-att-table {
          width: 100%;
          border-collapse: collapse;
        }
        .tp-att-header th {
          padding: 0.55rem 1rem;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: #6b7280;
          border-bottom: 1px solid #d1fae5;
          text-align: left;
        }
        .tp-att-row td {
          padding: 0.55rem 1rem;
          border-bottom: 1px solid #ecfdf5;
          font-size: 0.82rem;
          color: #111827;
          text-align: left;
          vertical-align: middle;
        }
        .tp-att-row:last-child td { border-bottom: none; }
        .tp-att-even { background: rgba(240,253,244,0.6); }

        .tp-att-col-seat {
          width: 20%;
        }
        .tp-att-col-name {
          width: 40%;
        }
        .tp-att-col-phone {
          width: 40%;
        }

        .tp-att-seat {
          display: inline-block;
          background: #10b981;
          color: white;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          min-width: 36px;
          text-align: center;
          line-height: 1.2;
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

        .tp-details {
          display: table-cell;
          vertical-align: top;
          padding-right: 2rem;
        }
        .tp-details-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.5rem;
          table-layout: fixed;
        }
        .tp-details-cell {
          width: 50%;
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          box-sizing: border-box;
          text-align: left;
        }

        /* QR column */
        .tp-qr-col {
          display: table-cell;
          vertical-align: middle;
          border-left: 2px dashed #e2e8f0;
          padding-left: 2rem;
          width: 170px;
          text-align: center;
        }
        .tp-qr-wrap {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.55rem;
          text-align: center;
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
          width: 130px;
          height: 130px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          display: block;
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

        /* ── SUPPORTER TICKET ── */
        .tp-supporter-ticket {
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          box-shadow: 0 16px 48px rgba(15,23,42,0.09);
          max-width: 600px;
          margin: 0 auto;
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
          .tp-ticket:not(.tp-desktop) .tp-body {
            display: block;
            padding: 1.5rem;
          }
          .tp-ticket:not(.tp-desktop) .tp-details {
            display: block;
            padding-right: 0;
          }
          .tp-ticket:not(.tp-desktop) .tp-qr-col {
            display: block;
            width: 100%;
            border-left: none;
            border-top: 2px dashed #e2e8f0;
            padding-left: 0;
            padding-top: 1.5rem;
            text-align: center;
          }
          .tp-ticket:not(.tp-desktop) .tp-qr-wrap {
            display: flex;
            width: 100%;
            justify-content: center;
          }
          .tp-ticket:not(.tp-desktop) .t-info-row {
            width: calc(100% - 1.5rem);
          }
          .tp-ticket:not(.tp-desktop) .tp-header { padding: 1.25rem 1.5rem; }
          .tp-ticket:not(.tp-desktop) .tp-footer-bar { padding: 0.65rem 1.5rem; }
        }

        @media (max-width: 480px) {
          .tp-ticket:not(.tp-desktop) .tp-event-name { font-size: 1.25rem; }
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
