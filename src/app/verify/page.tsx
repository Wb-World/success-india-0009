'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, Ticket, User, Phone, CreditCard, Hash, Loader2, AlertTriangle } from 'lucide-react';

// ─── Status helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = {
    approved: { label: 'Verified Ticket', color: '#059669', bg: '#d1fae5', border: '#6ee7b7', Icon: CheckCircle },
    pending:  { label: 'Pending Approval', color: '#d97706', bg: '#fef3c7', border: '#fcd34d', Icon: Clock },
    denied:   { label: 'Rejected', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', Icon: XCircle },
  }[status] ?? { label: 'Unknown', color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', Icon: AlertTriangle };

  const { label, color, bg, border, Icon } = cfg;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: bg, border: `1.5px solid ${border}`, color, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.02em' }}>
      <Icon size={15} />
      {label}
    </span>
  );
}

// ─── Single info row ───────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="vp-info-row">
      <div className="vp-info-icon"><Icon size={16} /></div>
      <div className="vp-info-text">
        <span className="vp-info-label">{label}</span>
        <span className="vp-info-value">{value}</span>
      </div>
    </div>
  );
}

// ─── Main verification component ───────────────────────────────────────────────
function VerifyContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<{ valid: boolean; ticket?: any; error?: string; reason?: string } | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setResult({ valid: false, reason: 'not_found', error: 'No booking ID supplied in the URL.' });
      setLoading(false);
      return;
    }

    fetch(`/api/verify?id=${encodeURIComponent(bookingId)}`)
      .then(r => r.json())
      .then(data => { setResult(data); setLoading(false); })
      .catch(() => { setResult({ valid: false, reason: 'server_error', error: 'Verification service temporarily unavailable. Network error.' }); setLoading(false); });
  }, [bookingId]);

  return (
    <div className="vp-root">
      {/* Header */}
      <div className="vp-header">
        <div className="vp-logo-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/success-india-logo.jpeg" alt="Success Team" className="vp-logo" />
          <div>
            <p className="vp-org">SUCCESS TEAM</p>
            <p className="vp-tagline">Official Ticket Verification Portal</p>
          </div>
        </div>
      </div>

      <div className="vp-body">
        {/* ── Loading ── */}
        {loading && (
          <div className="vp-state-card">
            <div className="vp-spinner-wrap">
              <Loader2 size={44} className="vp-spin" />
            </div>
            <h2 className="vp-state-title">Verifying Ticket…</h2>
            <p className="vp-state-sub">Checking booking <strong>{bookingId}</strong> against our records…</p>
          </div>
        )}

        {/* ── Server/Database Error ── */}
        {!loading && result && !result.valid && result.reason === 'server_error' && (
          <div className="vp-state-card vp-server-error">
            <div className="vp-icon-wrap server-error">
              <AlertTriangle size={56} />
            </div>
            <h2 className="vp-state-title">⚠️ Service Unavailable</h2>
            <p className="vp-state-sub">{result.error || 'Verification service temporarily unavailable. Please try again later.'}</p>
            {bookingId && (
              <p className="vp-state-ref">Booking ID: <code>{bookingId.toUpperCase()}</code></p>
            )}
          </div>
        )}

        {/* ── Invalid / Not found ── */}
        {!loading && result && !result.valid && result.reason !== 'server_error' && (
          <div className="vp-state-card vp-invalid">
            <div className="vp-icon-wrap invalid">
              <XCircle size={56} />
            </div>
            <h2 className="vp-state-title">❌ Invalid Ticket</h2>
            <p className="vp-state-sub">{result.error || 'This ticket could not be verified. It may be invalid, expired, or cancelled.'}</p>
            {bookingId && (
              <p className="vp-state-ref">Booking ID checked: <code>{bookingId.toUpperCase()}</code></p>
            )}
            <div className="vp-invalid-note">
              <AlertTriangle size={16} />
              <span>If you believe this is an error, please contact the event organizer with your booking confirmation.</span>
            </div>
          </div>
        )}

        {/* ── Valid ticket ── */}
        {!loading && result?.valid && result.ticket && (
          <div className="vp-ticket-wrap">
            {/* Verified banner */}
            <div className={`vp-verified-banner ${result.ticket.status === 'pending' ? 'pending' : 'approved'}`}>
              {result.ticket.status === 'pending' ? <Clock size={28} /> : <CheckCircle size={28} />}
              <div>
                <p className="vp-verified-title">
                  {result.ticket.status === 'pending' ? '✓ Valid Ticket — Pending Approval' : '✓ Valid Ticket — Verified'}
                </p>
                <p className="vp-verified-sub">
                  {result.ticket.status === 'pending'
                    ? 'This ticket is valid but is currently pending organizer approval.'
                    : 'This ticket has been successfully verified by the Success Team system.'}
                </p>
              </div>
            </div>

            {/* Ticket card */}
            <div className="vp-ticket-card">
              {/* Ticket top accent */}
              <div className="vp-ticket-top-bar" />

              {/* Event title */}
              <div className="vp-ticket-head">
                <div>
                  <p className="vp-event-label">EVENT</p>
                  <h1 className="vp-event-name">{result.ticket.eventName}</h1>
                  {result.ticket.session && result.ticket.session !== result.ticket.eventName && (
                    <p className="vp-session-name">{result.ticket.session}</p>
                  )}
                </div>
                <StatusBadge status={result.ticket.status} />
              </div>

              {/* Divider with holes */}
              <div className="vp-perforation">
                <div className="vp-hole left" />
                <div className="vp-dash-line" />
                <div className="vp-hole right" />
              </div>

              {/* Ticket body */}
              <div className="vp-ticket-body">
                <div className="vp-info-grid">
                  <InfoRow icon={Hash}      label="Booking ID"     value={result.ticket.bookingId} />
                  <InfoRow icon={MapPin}    label="Venue"          value={result.ticket.venue} />
                  <InfoRow icon={Calendar}  label="Date"           value={result.ticket.date} />
                  <InfoRow icon={Clock}     label="Time"           value={result.ticket.time} />
                  <InfoRow icon={Ticket}    label="Seat(s)"        value={result.ticket.seats.join(', ')} />
                  <InfoRow icon={CreditCard} label="Amount Paid"   value={result.ticket.amountPaid} />
                  <InfoRow icon={User}      label="Attendee Name"  value={result.ticket.attendeeName} />
                  <InfoRow icon={Phone}     label="Phone"          value={result.ticket.bookerPhone} />
                  <InfoRow icon={Calendar}  label="Booked On"      value={result.ticket.bookedOn} />
                </div>

                {/* Payment status */}
                <div className="vp-payment-row">
                  <CreditCard size={14} />
                  <span>Payment Status:</span>
                  <strong className={`vp-payment-val ${result.ticket.status}`}>{result.ticket.paymentStatus}</strong>
                </div>

                {/* Attendees */}
                {Object.keys(result.ticket.attendees).length > 0 && (
                  <div className="vp-attendees">
                    <p className="vp-attendees-title">Registered Attendees</p>
                    <div className="vp-attendees-list">
                      {Object.entries(result.ticket.attendees).map(([seat, val]: any) => {
                        const name = typeof val === 'object' && val !== null ? val.name : val;
                        const phone = typeof val === 'object' && val !== null ? val.phone : '';
                        return (
                          <div key={seat} className="vp-attendee-row">
                            <span className="vp-attendee-seat">{seat}</span>
                            <span className="vp-attendee-name">{name}</span>
                            {phone && <span className="vp-attendee-phone">{phone}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="vp-ticket-footer">
                <p>Issued by <strong>Success Team</strong> · Do not share this page</p>
              </div>
            </div>

            <p className="vp-disclaimer">
              This verification page is generated from the Success Team booking system. For any discrepancies, contact the event organizer.
            </p>
          </div>
        )}
      </div>

      <style>{`
        /* ── Root ───────────────────────────────────────────────── */
        .vp-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 40%, #f8fafc 100%);
          font-family: var(--font-body, system-ui, sans-serif);
        }

        /* ── Header ─────────────────────────────────────────────── */
        .vp-header {
          background: linear-gradient(135deg, #064e3b 0%, #059669 100%);
          padding: 1.25rem 1.5rem;
          box-shadow: 0 4px 20px rgba(5, 150, 105, 0.3);
        }
        .vp-logo-row {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .vp-logo {
          width: 52px;
          height: 52px;
          object-fit: cover;
          border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.3);
        }
        .vp-org {
          font-weight: 900;
          font-size: 1.15rem;
          color: white;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .vp-tagline {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.75);
          margin: 0;
        }

        /* ── Body ───────────────────────────────────────────────── */
        .vp-body {
          max-width: 680px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem 4rem;
        }
        @media (min-width: 640px) { .vp-body { padding: 3rem 1.5rem 5rem; } }

        /* ── State card (loading / invalid) ────────────────────── */
        .vp-state-card {
          background: white;
          border-radius: 20px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          border: 1.5px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .vp-state-card.vp-invalid { border-color: #fca5a5; }
        .vp-state-card.vp-server-error { border-color: #fcd34d; }
        .vp-icon-wrap.server-error { background: #fef3c7; color: #d97706; }

        .vp-spinner-wrap { color: #059669; animation: spin 1s linear infinite; display: flex; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .vp-spin { animation: spin 1s linear infinite; }

        .vp-icon-wrap { display: flex; align-items: center; justify-content: center; width: 90px; height: 90px; border-radius: 50%; }
        .vp-icon-wrap.invalid { background: #fee2e2; color: #dc2626; }

        .vp-state-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
        .vp-state-sub { color: #64748b; font-size: 1rem; line-height: 1.55; margin: 0; max-width: 380px; }
        .vp-state-ref { font-size: 0.85rem; color: #94a3b8; margin: 0; }
        .vp-state-ref code { background: #f1f5f9; padding: 2px 8px; border-radius: 6px; font-family: monospace; color: #475569; }

        .vp-invalid-note {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;
          padding: 0.75rem 1rem; text-align: left; color: #92400e;
          font-size: 0.85rem; line-height: 1.45; max-width: 400px;
        }

        /* ── Verified banner ────────────────────────────────────── */
        .vp-verified-banner {
          display: flex; align-items: flex-start; gap: 1rem;
          border-radius: 14px; padding: 1.125rem 1.25rem;
          margin-bottom: 1.5rem;
        }
        .vp-verified-banner.approved {
          background: #d1fae5; border: 1.5px solid #6ee7b7; color: #064e3b;
        }
        .vp-verified-banner.pending {
          background: #fef3c7; border: 1.5px solid #fcd34d; color: #92400e;
        }
        .vp-verified-title { font-weight: 800; font-size: 1.05rem; margin: 0 0 2px; }
        .vp-verified-sub { font-size: 0.85rem; margin: 0; line-height: 1.4; }
        .vp-verified-banner.approved .vp-verified-sub { color: #065f46; }
        .vp-verified-banner.pending .vp-verified-sub { color: #b45309; }

        /* ── Ticket card ─────────────────────────────────────────── */
        .vp-ticket-wrap { display: flex; flex-direction: column; }
        .vp-ticket-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
          border: 1.5px solid #e2e8f0;
        }

        .vp-ticket-top-bar { height: 6px; background: linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%); }

        .vp-ticket-head {
          padding: 1.5rem 1.75rem 1.25rem;
          display: flex; align-items: flex-start;
          justify-content: space-between; gap: 1rem; flex-wrap: wrap;
        }
        .vp-event-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin: 0 0 4px; }
        .vp-event-name { font-size: clamp(1.1rem, 3vw, 1.45rem); font-weight: 900; color: #1e293b; margin: 0 0 4px; line-height: 1.25; }
        .vp-session-name { font-size: 0.9rem; color: #64748b; margin: 0; }

        /* ── Perforated divider ──────────────────────────────────── */
        .vp-perforation {
          display: flex; align-items: center; position: relative;
          padding: 0; margin: 0;
        }
        .vp-hole {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1.5px solid #e2e8f0; flex-shrink: 0;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.08);
        }
        .vp-hole.left { margin-left: -11px; }
        .vp-hole.right { margin-right: -11px; }
        .vp-dash-line { flex: 1; height: 0; border-top: 2px dashed #e2e8f0; margin: 0 4px; }

        /* ── Ticket body ─────────────────────────────────────────── */
        .vp-ticket-body { padding: 1.5rem 1.75rem; }

        .vp-info-grid { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
        .vp-info-row {
          display: flex; align-items: flex-start; gap: 0.75rem;
          padding-bottom: 0.6rem; border-bottom: 1px solid #f1f5f9;
        }
        .vp-info-row:last-child { border-bottom: none; }
        .vp-info-icon { color: #059669; flex-shrink: 0; margin-top: 2px; }
        .vp-info-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .vp-info-label { font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
        .vp-info-value { font-size: 0.92rem; font-weight: 600; color: #1e293b; word-break: break-word; }

        /* Payment row */
        .vp-payment-row {
          display: flex; align-items: center; gap: 6px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 0.65rem 1rem;
          font-size: 0.85rem; color: #475569; flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .vp-payment-val { font-weight: 700; }
        .vp-payment-val.approved { color: #059669; }
        .vp-payment-val.pending  { color: #d97706; }
        .vp-payment-val.denied   { color: #dc2626; }

        /* Attendees */
        .vp-attendees { background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 1rem 1.125rem; }
        .vp-attendees-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #059669; margin: 0 0 0.75rem; }
        .vp-attendees-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .vp-attendee-row { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
        .vp-attendee-seat { background: #059669; color: white; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
        .vp-attendee-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
        .vp-attendee-phone { font-size: 0.8rem; color: #64748b; }

        /* Footer */
        .vp-ticket-footer {
          border-top: 1px solid #f1f5f9;
          background: #fafafa;
          padding: 0.875rem 1.75rem;
          text-align: center;
          font-size: 0.78rem;
          color: #94a3b8;
        }

        /* Disclaimer */
        .vp-disclaimer {
          margin-top: 1.25rem;
          text-align: center;
          font-size: 0.78rem;
          color: #94a3b8;
          line-height: 1.5;
          padding: 0 0.5rem;
        }
      `}</style>
    </div>
  );
}

// ─── Export with Suspense (required for useSearchParams) ──────────────────────
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div style={{ textAlign: 'center', color: '#059669' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p style={{ fontWeight: 600 }}>Loading verification…</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
