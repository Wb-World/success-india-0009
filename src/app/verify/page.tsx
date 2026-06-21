'use client';

import { useEffect, useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, Ticket, User, Phone, CreditCard, Hash, Loader2, AlertTriangle, Camera, ZapOff, ScanLine, Wifi, WifiOff, ChevronLeft } from 'lucide-react';

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

// ─── QR Scanner Component ─────────────────────────────────────────────────────
function QRScanner({ onResult }: { onResult: (data: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [camError, setCamError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [jsQRLoaded, setJsQRLoaded] = useState(false);

  useEffect(() => {
    // Dynamically load jsQR
    if (typeof window === 'undefined') return;
    if ((window as any).jsQR) { setJsQRLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
    script.onload = () => setJsQRLoaded(true);
    script.onerror = () => setCamError('Failed to load QR decoder. Check your internet connection.');
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
      }
    } catch (err: any) {
      setCamError(err.message?.includes('denied') ? 'Camera permission denied. Please allow camera access and refresh.' : 'Camera unavailable on this device or browser.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    cancelAnimationFrame(animFrameRef.current);
    setIsScanning(false);
  }, []);

  useEffect(() => {
    if (!jsQRLoaded) return;
    startCamera();
    return () => stopCamera();
  }, [jsQRLoaded, startCamera, stopCamera]);

  useEffect(() => {
    if (!isScanning || !jsQRLoaded) return;
    const jsQR = (window as any).jsQR;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { animFrameRef.current = requestAnimationFrame(tick); return; }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      if (code && code.data) {
        cancelled = true;
        stopCamera();
        onResult(code.data);
        return;
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => { cancelled = true; cancelAnimationFrame(animFrameRef.current); };
  }, [isScanning, jsQRLoaded, onResult, stopCamera]);

  if (camError) {
    return (
      <div className="scanner-error">
        <ZapOff size={52} />
        <h3>Camera Error</h3>
        <p>{camError}</p>
        <button className="btn-scanner-retry" onClick={() => { setCamError(''); startCamera(); }}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="scanner-viewport">
      <video ref={videoRef} className="scanner-video" playsInline muted autoPlay />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      {/* Scanning overlay frame */}
      <div className="scanner-overlay">
        <div className="scanner-frame">
          <div className="corner tl" /><div className="corner tr" />
          <div className="corner bl" /><div className="corner br" />
          {isScanning && <div className="scan-beam" />}
        </div>
        <p className="scanner-hint">Align the QR code inside the frame</p>
      </div>
      {!isScanning && !camError && (
        <div className="scanner-loading">
          <Loader2 size={36} className="vp-spin" />
          <p>Starting camera…</p>
        </div>
      )}
    </div>
  );
}

// ─── Main verification component ───────────────────────────────────────────────
function VerifyContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id');
  const dataParam = searchParams.get('data');

  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState(!bookingId);
  const [scanning, setScanning] = useState(!bookingId);
  const [scannedRaw, setScannedRaw] = useState('');
  const [result, setResult] = useState<{ valid: boolean; ticket?: any; error?: string; reason?: string; offline?: boolean } | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // Auto-verify if bookingId is in URL
  useEffect(() => {
    if (bookingId) {
      setScanMode(false);
      setScanning(false);

      // Try extracting embedded data from base64
      if (dataParam) {
        try {
          const decoded = decodeURIComponent(atob(unescape(encodeURIComponent(dataParam))).replace(/\0/g, ''));
          const parsed = JSON.parse(atob(dataParam));
          // Use offline data immediately
          const offlineTicket = {
            bookingId: parsed.id || bookingId,
            eventName: parsed.event || parsed.eventName || '—',
            date: parsed.date || '—',
            time: parsed.time || '—',
            venue: parsed.venue || '—',
            seats: Array.isArray(parsed.seats) ? parsed.seats : [parsed.seats || '—'],
            attendeeName: parsed.name || parsed.attendeeName || '—',
            bookerPhone: parsed.phone || '—',
            amountPaid: parsed.amount || parsed.amountPaid || '—',
            status: parsed.status || 'pending',
            bookedOn: '—',
            attendees: {},
            paymentStatus: parsed.status === 'approved' ? 'Confirmed' : 'Pending',
          };
          setResult({ valid: true, ticket: offlineTicket, offline: true });
        } catch {
          // Continue to server verify
        }
      }

      // Always verify online
      setLoading(true);
      fetch(`/api/verify?id=${encodeURIComponent(bookingId)}`)
        .then(r => r.json())
        .then(data => { setResult({ ...data, offline: false }); })
        .catch(() => {
          if (!result) {
            setResult({ valid: false, reason: 'server_error', error: 'Verification service temporarily unavailable.' });
          }
        })
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, dataParam]);

  const handleQRResult = useCallback((rawData: string) => {
    setScanning(false);
    setScannedRaw(rawData);
    setScanMode(false);
    setLoading(true);

    // Parse URL-format QR (from our ticket QR codes)
    let id = '';
    let offlineData: any = null;

    try {
      const url = new URL(rawData);
      id = url.searchParams.get('id') || '';
      const b64 = url.searchParams.get('data');
      if (b64) {
        offlineData = JSON.parse(atob(b64));
      }
    } catch {
      // Not a URL - try plain ID
      id = rawData.trim();
    }

    if (!id) {
      setResult({ valid: false, reason: 'invalid', error: 'This QR code does not contain a valid booking reference.' });
      setLoading(false);
      return;
    }

    // Show offline data immediately
    if (offlineData) {
      const offlineTicket = {
        bookingId: offlineData.id || id,
        eventName: offlineData.event || offlineData.eventName || '—',
        date: offlineData.date || '—',
        time: offlineData.time || '—',
        venue: offlineData.venue || '—',
        seats: Array.isArray(offlineData.seats) ? offlineData.seats : [offlineData.seats || '—'],
        attendeeName: offlineData.name || '—',
        bookerPhone: offlineData.phone || '—',
        amountPaid: offlineData.amount || '—',
        status: offlineData.status || 'pending',
        bookedOn: '—',
        attendees: {},
        paymentStatus: offlineData.status === 'approved' ? 'Confirmed' : 'Pending',
      };
      setResult({ valid: true, ticket: offlineTicket, offline: true });
    }

    // Verify online
    fetch(`/api/verify?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => { setResult({ ...data, offline: false }); })
      .catch(() => {
        if (!offlineData) {
          setResult({ valid: false, reason: 'server_error', error: 'Could not reach server. Check internet connection.' });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRescan = () => {
    setResult(null);
    setScannedRaw('');
    setScanMode(true);
    setScanning(true);
    setLoading(false);
  };

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
          <div className="vp-header-status">
            {isOnline ? (
              <span className="status-pill online"><Wifi size={12} /> Online</span>
            ) : (
              <span className="status-pill offline"><WifiOff size={12} /> Offline</span>
            )}
          </div>
        </div>
      </div>

      <div className="vp-body">
        {/* ── Scanner Mode ── */}
        {scanMode && (
          <div className="scanner-section">
            <div className="scanner-header">
              <div className="scanner-pulse-ring" />
              <Camera size={32} />
              <h2>Scan Ticket QR Code</h2>
              <p>Hold your camera steady over the ticket QR code</p>
            </div>
            {scanning && <QRScanner onResult={handleQRResult} />}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="vp-state-card">
            <div className="vp-spinner-wrap">
              <Loader2 size={44} className="vp-spin" />
            </div>
            <h2 className="vp-state-title">Verifying Ticket…</h2>
            <p className="vp-state-sub">Checking booking against our records…</p>
          </div>
        )}

        {/* ── Error / Invalid ── */}
        {!loading && result && !result.valid && (
          <div className={`vp-state-card ${result.reason === 'server_error' ? 'vp-server-error' : 'vp-invalid'}`}>
            <div className={`vp-icon-wrap ${result.reason === 'server_error' ? 'server-error' : 'invalid'}`}>
              {result.reason === 'server_error' ? <AlertTriangle size={56} /> : <XCircle size={56} />}
            </div>
            <h2 className="vp-state-title">
              {result.reason === 'server_error' ? '⚠️ Service Unavailable' : '❌ Invalid Ticket'}
            </h2>
            <p className="vp-state-sub">{result.error || 'This ticket could not be verified.'}</p>
            <div className="vp-invalid-note">
              <AlertTriangle size={16} />
              <span>If you believe this is an error, contact the event organizer with your booking confirmation.</span>
            </div>
            {scanMode !== undefined && (
              <button className="btn-scanner-retry" onClick={handleRescan}>
                <ScanLine size={16} /> Scan Again
              </button>
            )}
          </div>
        )}

        {/* ── Valid ticket ── */}
        {!loading && result?.valid && result.ticket && (
          <div className="vp-ticket-wrap">
            {/* Offline notice */}
            {result.offline && (
              <div className="vp-offline-notice">
                <WifiOff size={14} />
                <span>Showing embedded ticket data — server verification in progress…</span>
              </div>
            )}

            {/* Verified banner */}
            <div className={`vp-verified-banner ${result.ticket.status === 'pending' ? 'pending' : result.ticket.status === 'denied' ? 'denied' : 'approved'}`}>
              {result.ticket.status === 'pending' ? <Clock size={28} /> : result.ticket.status === 'denied' ? <XCircle size={28} /> : <CheckCircle size={28} />}
              <div>
                <p className="vp-verified-title">
                  {result.ticket.status === 'approved' ? '✓ Valid Ticket — Verified' : result.ticket.status === 'pending' ? '✓ Valid — Pending Approval' : '✗ Ticket Rejected'}
                </p>
                <p className="vp-verified-sub">
                  {result.ticket.status === 'approved'
                    ? 'This ticket has been successfully verified by the Success Team system.'
                    : result.ticket.status === 'pending'
                    ? 'This ticket is valid but is currently pending organizer approval.'
                    : 'This booking was rejected by the admin.'}
                </p>
              </div>
            </div>

            {/* Ticket card */}
            <div className="vp-ticket-card">
              <div className="vp-ticket-top-bar" />

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

              <div className="vp-perforation">
                <div className="vp-hole left" />
                <div className="vp-dash-line" />
                <div className="vp-hole right" />
              </div>

              <div className="vp-ticket-body">
                <div className="vp-info-grid">
                  <InfoRow icon={Hash}       label="Booking ID"    value={result.ticket.bookingId} />
                  <InfoRow icon={MapPin}     label="Venue"         value={result.ticket.venue} />
                  <InfoRow icon={Calendar}   label="Date"          value={result.ticket.date} />
                  <InfoRow icon={Clock}      label="Time"          value={result.ticket.time} />
                  <InfoRow icon={Ticket}     label="Seat(s)"       value={Array.isArray(result.ticket.seats) ? result.ticket.seats.join(', ') : result.ticket.seats} />
                  <InfoRow icon={CreditCard} label="Amount Paid"   value={result.ticket.amountPaid} />
                  <InfoRow icon={User}       label="Attendee"      value={result.ticket.attendeeName} />
                  {result.ticket.bookerPhone && result.ticket.bookerPhone !== '—' && (
                    <InfoRow icon={Phone} label="Phone" value={result.ticket.bookerPhone} />
                  )}
                </div>

                {result.ticket.paymentStatus && (
                  <div className="vp-payment-row">
                    <CreditCard size={14} />
                    <span>Payment Status:</span>
                    <strong className={`vp-payment-val ${result.ticket.status}`}>{result.ticket.paymentStatus}</strong>
                  </div>
                )}

                {result.ticket.attendees && Object.keys(result.ticket.attendees).length > 0 && (
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

              <div className="vp-ticket-footer">
                <p>Issued by <strong>Success Team</strong> · Do not share this page</p>
              </div>
            </div>

            {scanMode !== undefined && (
              <button className="btn-scanner-retry vp-rescan-btn" onClick={handleRescan}>
                <ScanLine size={16} /> Scan Another Ticket
              </button>
            )}

            <p className="vp-disclaimer">
              This verification page is generated from the Success Team booking system. For any discrepancies, contact the event organizer.
            </p>
          </div>
        )}
      </div>

      <style>{`
        /* ── Root ─────────────────────────────────────────────── */
        .vp-root {
          min-height: 100vh;
          background: linear-gradient(160deg, #0f172a 0%, #1e293b 40%, #064e3b 100%);
          font-family: var(--font-body, system-ui, sans-serif);
        }

        /* ── Header ─────────────────────────────────────────── */
        .vp-header {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.12);
          padding: 1rem 1.5rem;
        }
        .vp-logo-row {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .vp-logo {
          width: 48px; height: 48px;
          object-fit: cover; border-radius: 10px;
          border: 2px solid rgba(255,255,255,0.25);
        }
        .vp-org { font-weight: 900; font-size: 1.1rem; color: white; letter-spacing: 0.05em; margin: 0; }
        .vp-tagline { font-size: 0.75rem; color: rgba(255,255,255,0.6); margin: 0; }
        .vp-header-status { margin-left: auto; }
        .status-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
        }
        .status-pill.online { background: rgba(16,185,129,0.2); color: #34d399; border: 1px solid rgba(52,211,153,0.3); }
        .status-pill.offline { background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

        /* ── Body ─────────────────────────────────────────────── */
        .vp-body {
          max-width: 720px;
          margin: 0 auto;
          padding: 2rem 1.25rem 4rem;
        }
        @media (min-width: 640px) { .vp-body { padding: 2.5rem 1.5rem 5rem; } }

        /* ── Scanner Section ─────────────────────────────────── */
        .scanner-section {
          display: flex; flex-direction: column; gap: 1.5rem;
        }
        .scanner-header {
          position: relative;
          text-align: center; color: white;
          padding: 2rem 1.5rem 1.5rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
        }
        .scanner-pulse-ring {
          position: absolute; top: 1.5rem; left: 50%; transform: translateX(-50%);
          width: 70px; height: 70px; border-radius: 50%;
          background: rgba(16,185,129,0.15);
          animation: ringPulse 2s ease-out infinite;
        }
        @keyframes ringPulse {
          0% { transform: translateX(-50%) scale(0.8); opacity: 0.8; }
          100% { transform: translateX(-50%) scale(2.2); opacity: 0; }
        }
        .scanner-header svg { position: relative; z-index: 1; color: #34d399; margin-bottom: 0.75rem; }
        .scanner-header h2 { font-size: 1.4rem; font-weight: 800; margin: 0 0 0.35rem; }
        .scanner-header p { color: rgba(255,255,255,0.55); font-size: 0.9rem; margin: 0; }

        /* Scanner viewport */
        .scanner-viewport {
          position: relative; border-radius: 20px; overflow: hidden;
          background: #000;
          aspect-ratio: 1/1;
          max-width: 520px; margin: 0 auto;
          box-shadow: 0 0 0 4px rgba(52,211,153,0.3), 0 24px 48px rgba(0,0,0,0.4);
        }
        .scanner-video {
          width: 100%; height: 100%; object-fit: cover; display: block;
        }
        .scanner-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1.5rem;
        }
        .scanner-frame {
          position: relative; width: 220px; height: 220px;
          overflow: visible;
        }
        .corner {
          position: absolute; width: 28px; height: 28px;
          border-color: #34d399; border-style: solid;
          border-width: 0;
        }
        .corner.tl { top: 0; left: 0; border-top-width: 4px; border-left-width: 4px; border-top-left-radius: 4px; }
        .corner.tr { top: 0; right: 0; border-top-width: 4px; border-right-width: 4px; border-top-right-radius: 4px; }
        .corner.bl { bottom: 0; left: 0; border-bottom-width: 4px; border-left-width: 4px; border-bottom-left-radius: 4px; }
        .corner.br { bottom: 0; right: 0; border-bottom-width: 4px; border-right-width: 4px; border-bottom-right-radius: 4px; }

        .scan-beam {
          position: absolute; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, transparent 0%, #34d399 50%, transparent 100%);
          box-shadow: 0 0 12px 3px rgba(52,211,153,0.6);
          animation: scanBeam 2s ease-in-out infinite;
          border-radius: 2px;
        }
        @keyframes scanBeam {
          0% { top: 4px; }
          50% { top: calc(100% - 7px); }
          100% { top: 4px; }
        }
        .scanner-hint {
          color: rgba(255,255,255,0.75); font-size: 0.82rem; font-weight: 600;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
          background: rgba(0,0,0,0.35); padding: 6px 14px; border-radius: 999px;
          margin: 0;
        }
        .scanner-loading {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.65);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.75rem; color: white;
        }
        .scanner-error {
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          padding: 3rem 2rem; text-align: center; color: white;
          background: rgba(239,68,68,0.12); border: 1px solid rgba(239,68,68,0.3);
          border-radius: 20px;
        }
        .scanner-error svg { color: #f87171; }
        .scanner-error h3 { font-size: 1.3rem; font-weight: 800; margin: 0; }
        .scanner-error p { color: rgba(255,255,255,0.6); margin: 0; font-size: 0.9rem; }

        /* ── State card ──────────────────────────────────────── */
        .vp-state-card {
          background: white; border-radius: 20px;
          padding: 3rem 2rem; text-align: center;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
          border: 1.5px solid #e2e8f0;
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }
        .vp-state-card.vp-invalid { border-color: #fca5a5; }
        .vp-state-card.vp-server-error { border-color: #fcd34d; }
        .vp-icon-wrap.server-error { background: #fef3c7; color: #d97706; }

        .vp-spinner-wrap { color: #059669; display: flex; }
        .vp-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .vp-icon-wrap { display: flex; align-items: center; justify-content: center; width: 90px; height: 90px; border-radius: 50%; }
        .vp-icon-wrap.invalid { background: #fee2e2; color: #dc2626; }

        .vp-state-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
        .vp-state-sub { color: #64748b; font-size: 1rem; line-height: 1.55; margin: 0; max-width: 380px; }
        .vp-invalid-note {
          display: flex; align-items: flex-start; gap: 8px;
          background: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px;
          padding: 0.75rem 1rem; text-align: left; color: #92400e;
          font-size: 0.85rem; line-height: 1.45; max-width: 400px;
        }

        /* ── Buttons ────────────────────────────────────────── */
        .btn-scanner-retry {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 0.75rem 1.5rem; border-radius: 12px;
          background: linear-gradient(135deg, #059669, #10b981);
          color: white; border: none; font-weight: 700; font-size: 0.9rem;
          cursor: pointer; transition: transform 0.15s, opacity 0.15s;
        }
        .btn-scanner-retry:hover { transform: translateY(-2px); opacity: 0.9; }
        .vp-rescan-btn { display: flex; margin: 1.5rem auto 0; }

        /* ── Offline notice ──────────────────────────────────── */
        .vp-offline-notice {
          display: flex; align-items: center; gap: 8px;
          background: rgba(245,158,11,0.15); border: 1px solid rgba(245,158,11,0.4);
          border-radius: 10px; padding: 0.6rem 1rem; margin-bottom: 1rem;
          color: #fbbf24; font-size: 0.82rem; font-weight: 600;
        }

        /* ── Verified banner ─────────────────────────────────── */
        .vp-verified-banner {
          display: flex; align-items: flex-start; gap: 1rem;
          border-radius: 14px; padding: 1.125rem 1.25rem; margin-bottom: 1.5rem;
        }
        .vp-verified-banner.approved { background: #d1fae5; border: 1.5px solid #6ee7b7; color: #064e3b; }
        .vp-verified-banner.pending { background: #fef3c7; border: 1.5px solid #fcd34d; color: #92400e; }
        .vp-verified-banner.denied { background: #fee2e2; border: 1.5px solid #fca5a5; color: #991b1b; }
        .vp-verified-title { font-weight: 800; font-size: 1.05rem; margin: 0 0 2px; }
        .vp-verified-sub { font-size: 0.85rem; margin: 0; line-height: 1.4; opacity: 0.85; }

        /* ── Ticket card ─────────────────────────────────────── */
        .vp-ticket-wrap { display: flex; flex-direction: column; }
        .vp-ticket-card {
          background: white; border-radius: 20px; overflow: hidden;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
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

        .vp-perforation {
          display: flex; align-items: center; position: relative; padding: 0; margin: 0;
        }
        .vp-hole {
          width: 22px; height: 22px; border-radius: 50%;
          background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
          border: 1.5px solid #e2e8f0; flex-shrink: 0;
        }
        .vp-hole.left { margin-left: -11px; }
        .vp-hole.right { margin-right: -11px; }
        .vp-dash-line { flex: 1; height: 0; border-top: 2px dashed #e2e8f0; margin: 0 4px; }

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

        .vp-payment-row {
          display: flex; align-items: center; gap: 6px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 0.65rem 1rem; font-size: 0.85rem; color: #475569;
          flex-wrap: wrap; margin-bottom: 1.25rem;
        }
        .vp-payment-val { font-weight: 700; }
        .vp-payment-val.approved { color: #059669; }
        .vp-payment-val.pending  { color: #d97706; }
        .vp-payment-val.denied   { color: #dc2626; }

        .vp-attendees { background: #f0fdf4; border: 1.5px solid #a7f3d0; border-radius: 12px; padding: 1rem 1.125rem; }
        .vp-attendees-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #059669; margin: 0 0 0.75rem; }
        .vp-attendees-list { display: flex; flex-direction: column; gap: 0.5rem; }
        .vp-attendee-row { display: flex; align-items: baseline; gap: 0.6rem; flex-wrap: wrap; }
        .vp-attendee-seat { background: #059669; color: white; font-size: 0.68rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; }
        .vp-attendee-name { font-size: 0.875rem; font-weight: 600; color: #1e293b; }
        .vp-attendee-phone { font-size: 0.8rem; color: #64748b; }

        .vp-ticket-footer {
          border-top: 1px solid #f1f5f9; background: #fafafa;
          padding: 0.875rem 1.75rem; text-align: center;
          font-size: 0.78rem; color: #94a3b8;
        }
        .vp-disclaimer { margin-top: 1.25rem; text-align: center; font-size: 0.78rem; color: rgba(255,255,255,0.4); line-height: 1.5; padding: 0 0.5rem; }
      `}</style>
    </div>
  );
}

// ─── Export with Suspense ──────────────────────────────────────────────────────
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(160deg, #0f172a 0%, #064e3b 100%)' }}>
        <div style={{ textAlign: 'center', color: '#34d399' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
          <p style={{ fontWeight: 600 }}>Loading verification…</p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
