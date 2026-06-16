'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, MapPin, CheckCircle2,
  Download, Printer, Ticket, Clock, AlertCircle, Upload
} from 'lucide-react';
import html2canvas from 'html2canvas';

// ─── Seat Configuration ───────────────────────────────────────────────────────
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F'];
const SEATS_PER_ROW = 10;
const ALL_SEATS: string[] = ROWS.flatMap((row) =>
  Array.from({ length: SEATS_PER_ROW }, (_, i) => `${row}${i + 1}`)
);

// ─── Utilities ────────────────────────────────────────────────────────────────
function generateBookingId(): string {
  const year = new Date().getFullYear();
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 8; i++) {
    random += chars[Math.floor(Math.random() * chars.length)];
  }
  return `EVT-${year}-${random}`;
}

function formatTimestamp(): string {
  return new Date().toLocaleString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}


// ─── Types ────────────────────────────────────────────────────────────────────
type EventData = {
  id: string;
  title?: string;
  name?: string;
  venue: string;
  eventDate?: string;
  eventTime?: string;
  price: number;
  bookedSeatsByTime?: Record<string, string[]>;
};

type Props = {
  event: EventData;
  onClose: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function SeatBookingModal({ event, onClose }: Props) {
  const [quantity, setQuantity] = useState(2); // Default to 2
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [alreadyBookedSeats, setAlreadyBookedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<'quantity_select' | 'select' | 'payment' | 'success'>('quantity_select');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [bookingTimestamp, setBookingTimestamp] = useState('');
  const [confirmedData, setConfirmedData] = useState<any>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Payment configuration and upload states
  const [upiConfig, setUpiConfig] = useState({ upiId: 'shesh.dav07-1@okaxis', upiName: 'david', upiQrUrl: '/upi-qr-code.jpg?v=2' });
  const [screenshotUrl, setScreenshotUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const eventName = event.title || event.name || 'Success Team Seminar';
  const pricePerSeat = event.price;
  const totalPrice = selectedSeats.length * pricePerSeat;

  // Build booked seats from event data
  useEffect(() => {
    if (event.bookedSeatsByTime) {
      const allBooked = Object.values(event.bookedSeatsByTime).flat();
      setBookedSeats(allBooked);
    }
  }, [event]);

  // Fetch taken seats on load & set up 5s polling
  useEffect(() => {
    if (!event.id) return;

    const fetchBookedSeats = async () => {
      try {
        const res = await fetch(`/api/bookings?eventId=${encodeURIComponent(event.id)}`);
        if (res.ok) {
          const data = await res.json();
          setAlreadyBookedSeats(data.seats || []);
        } else {
          console.error('Failed to fetch booked seats');
        }
      } catch (err) {
        console.error('Error fetching booked seats:', err);
      }
    };

    fetchBookedSeats();

    const interval = setInterval(fetchBookedSeats, 5000);
    return () => clearInterval(interval);
  }, [event.id]);

  // Sanitize selected seats array if a seat gets booked by someone else
  useEffect(() => {
    if (alreadyBookedSeats.length > 0) {
      setSelectedSeats((prev) => prev.filter((s) => !alreadyBookedSeats.includes(s)));
    }
  }, [alreadyBookedSeats]);

  // Fetch UPI configs
  useEffect(() => {
    fetch('/api/admin/configs')
      .then((res) => res.json())
      .then((data) => {
        if (data.configs) {
          const upiId = data.configs.find((c: any) => c.key === 'upi_id')?.value || 'shesh.dav07-1@okaxis';
          const upiName = data.configs.find((c: any) => c.key === 'upi_name')?.value || 'david';
          const upiQrUrl = data.configs.find((c: any) => c.key === 'upi_qr_url')?.value || '/upi-qr-code.jpg?v=2';
          setUpiConfig({ upiId, upiName, upiQrUrl });
        }
      })
      .catch((err) => console.error('Failed to load configs:', err));
  }, []);

  // UPI Link payload & Dynamic QR Image (emerald green color combo #10b981)
  const upiPayload = `upi://pay?pa=${upiConfig.upiId}&pn=${encodeURIComponent(upiConfig.upiName)}&am=${totalPrice}&cu=INR`;
  const qrCodeUrl = upiConfig.upiQrUrl 
    ? upiConfig.upiQrUrl 
    : `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiPayload)}&qzone=1&format=png&color=10b981`;

  // QR code data for ticket validation
  const qrPayload = confirmedData
    ? `BOOKING:${confirmedData.id}|EVENT:${eventName}|SEATS:${confirmedData.seats.join(',')}|VENUE:${event.venue}|DATE:${event.eventDate || 'TBD'}|AMOUNT:INR${confirmedData.totalPrice}|STATUS:PENDING_VERIFICATION`
    : '';
  const qrImageUrl = qrPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrPayload)}&qzone=1&format=png&color=10b981`
    : '';

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleQuantityChange = (val: number) => {
    if (val < 1 || val > 10) return;
    setQuantity(val);
    setSelectedSeats([]); // Reset seats to manual selection mode
    setWarningMessage(null);
  };

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId) || alreadyBookedSeats.includes(seatId)) return;

    const row = seatId[0];
    const col = parseInt(seatId.slice(1), 10);

    // If the clicked seat is already selected, deselect everything (toggle off)
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats([]);
      setWarningMessage(null);
      return;
    }

    // Get all seats in the same row and determine availability
    const rowSeats: { col: number; seatId: string; isAvailable: boolean }[] = [];
    for (let c = 1; c <= SEATS_PER_ROW; c++) {
      const sId = `${row}${c}`;
      rowSeats.push({
        col: c,
        seatId: sId,
        isAvailable: !bookedSeats.includes(sId) && !alreadyBookedSeats.includes(sId)
      });
    }

    let foundBlock: string[] | null = null;

    // 1. Try to find a contiguous available block containing the clicked column 'col'
    // We shift the starting column left if clicking near the end of the row
    for (let s = col; s >= col - quantity + 1; s--) {
      if (s >= 1 && s + quantity - 1 <= SEATS_PER_ROW) {
        let allAvailable = true;
        const candidateSeats: string[] = [];
        for (let offset = 0; offset < quantity; offset++) {
          const seat = rowSeats[s - 1 + offset];
          if (!seat || !seat.isAvailable) {
            allAvailable = false;
            break;
          }
          candidateSeats.push(seat.seatId);
        }
        if (allAvailable) {
          foundBlock = candidateSeats;
          break;
        }
      }
    }

    // 2. Try to find ANY contiguous available block of size 'quantity' in the same row (prioritizing proximity to 'col')
    if (!foundBlock) {
      let bestDist = Infinity;
      for (let s = 1; s <= SEATS_PER_ROW - quantity + 1; s++) {
        let allAvailable = true;
        const candidateSeats: string[] = [];
        for (let offset = 0; offset < quantity; offset++) {
          const seat = rowSeats[s - 1 + offset];
          if (!seat || !seat.isAvailable) {
            allAvailable = false;
            break;
          }
          candidateSeats.push(seat.seatId);
        }
        if (allAvailable) {
          const center = s + (quantity - 1) / 2;
          const dist = Math.abs(center - col);
          if (dist < bestDist) {
            bestDist = dist;
            foundBlock = candidateSeats;
          }
        }
      }
    }

    // 3. Fallback: Select the closest available seats in the row (even if non-contiguous, skipping booked ones)
    if (!foundBlock) {
      const availableInRow = rowSeats.filter(s => s.isAvailable);
      if (availableInRow.length >= quantity) {
        availableInRow.sort((a, b) => Math.abs(a.col - col) - Math.abs(b.col - col));
        const closestSeats = availableInRow.slice(0, quantity);
        closestSeats.sort((a, b) => a.col - b.col);
        foundBlock = closestSeats.map(s => s.seatId);
      }
    }

    if (foundBlock && foundBlock.length === quantity) {
      setSelectedSeats(foundBlock);
      setWarningMessage(null);
    } else {
      // Display warning if there are not enough available seats in the entire row
      setWarningMessage(`Not enough available seats in row ${row} to book ${quantity} seats.`);
      const timer = setTimeout(() => {
        setWarningMessage((prev) => {
          if (prev === `Not enough available seats in row ${row} to book ${quantity} seats.`) {
            return null;
          }
          return prev;
        });
      }, 4000);
    }
  };

  const handleScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Added Console Logs for debugging as requested
    console.log('--- Client Upload Debug ---');
    console.log('Selected file:', file.name);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/bookings/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log('API response status:', res.status);
      console.log('API response data:', data);

      if (res.ok && data.url) {
        console.log('Upload path / base64 URL:', data.url.substring(0, 100) + '...');
        setScreenshotUrl(data.url);
      } else {
        setUploadError(data.error || 'Failed to upload screenshot');
      }
    } catch (err: any) {
      console.error('Upload request failed:', err);
      setUploadError(`Network error: ${err.message || String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);

    // Dynamic pre-booking validation check
    try {
      const checkRes = await fetch(`/api/bookings?eventId=${encodeURIComponent(event.id)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        const latestBooked = checkData.seats || [];
        const hasConflict = selectedSeats.some((s) => latestBooked.includes(s));
        if (hasConflict) {
          alert('One or more of your selected seats have just been booked by another attendee. Please select different seats.');
          setAlreadyBookedSeats(latestBooked);
          setSelectedSeats([]);
          setStep('select');
          setIsSubmitting(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Conflict verification failed, proceeding with caution:', err);
    }

    const newBookingId = generateBookingId();
    const ts = formatTimestamp();

    const payload = {
      bookingId: newBookingId,
      eventId: event.id,
      eventName,
      seminarId: event.id,
      seminarName: eventName,
      venue: event.venue,
      seminar: eventName,
      date: event.eventDate || new Date().toISOString().split('T')[0],
      time: event.eventTime || '10:00 AM',
      seats: selectedSeats,
      totalPrice,
      screenshot: screenshotUrl || 'DIRECT_BOOKING',
    };

    // Retrieve logged-in user from localStorage to pass x-user-id header
    const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    let userId = null;
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        userId = parsed.id;
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }

    const headers: any = { 'Content-Type': 'application/json' };
    if (userId) {
      headers['x-user-id'] = userId;
    }

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected the booking request');
      }

      setBookingId(newBookingId);
      setBookingTimestamp(ts);
      setConfirmedData({ id: newBookingId, seats: selectedSeats, totalPrice, timestamp: ts });
      setIsSubmitting(false);
      setStep('success');
    } catch (err: any) {
      console.error('Booking submission failed:', err);
      alert(`Booking Failed: ${err.message || String(err)}`);
      setIsSubmitting(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrImageUrl) return;
    const a = document.createElement('a');
    a.href = qrImageUrl;
    a.download = `QR-${bookingId}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadTicket = async () => {
    const seatsToRender = confirmedData?.seats || selectedSeats;
    const seatsLength = confirmedData?.seats?.length || selectedSeats.length;
    const priceToRender = confirmedData?.totalPrice || totalPrice;
    const timestampToRender = confirmedData?.timestamp || bookingTimestamp;

    // Build a temporary off-screen ticket element
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.style.zIndex = '-1';
    wrapper.style.background = '#f0fdf4';
    wrapper.style.padding = '32px';
    wrapper.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    wrapper.style.color = '#111827';
    wrapper.style.width = '640px';

    const seatsHtml = seatsToRender.map(s => `<span style="background:#dcfce7;color:#047857;padding:3px 10px;border-radius:6px;font-size:13px;font-weight:700;margin:2px">${s}</span>`).join('');

    wrapper.innerHTML = `
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.15);">
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:32px;text-align:center;">
          <h1 style="font-size:28px;font-weight:800;letter-spacing:2px;margin:0 0 4px;">SUCCESS TEAM</h1>
          <p style="font-size:13px;opacity:0.85;margin:0;">Official Event Booking Confirmation</p>
          <div style="font-size:26px;font-weight:900;letter-spacing:4px;background:rgba(255,255,255,0.15);padding:12px 24px;border-radius:8px;margin:16px auto;display:inline-block;">${bookingId}</div>
        </div>
        <div style="padding:32px;">
          <div style="text-align:center;margin-bottom:20px;"><span style="display:inline-flex;align-items:center;gap:6px;background:#dcfce7;color:#047857;padding:6px 16px;border-radius:999px;font-weight:700;font-size:14px;">✓ PENDING VERIFICATION</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Event</span><span style="font-weight:600;">${eventName}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Venue</span><span style="font-weight:600;">${event.venue}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Date</span><span style="font-weight:600;">${event.eventDate || 'To Be Confirmed'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Time</span><span style="font-weight:600;">${event.eventTime || '10:00 AM'}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f3f4f6;gap:16px;"><span style="color:#6b7280;font-size:13px;flex-shrink:0;">Seats (${seatsLength})</span><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;">${seatsHtml}</div></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Price per Seat</span><span style="font-weight:600;">₹${pricePerSeat}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Booked At</span><span style="font-weight:600;">${timestampToRender}</span></div>
          <div style="background:#ecfdf5;border-radius:8px;padding:16px;margin-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;font-weight:600;color:#374151;">Total Amount</span><span style="font-size:24px;font-weight:800;color:#10b981;">₹${priceToRender}</span></div>
        </div>
        ${qrImageUrl ? `<div style="text-align:center;padding:24px;border-top:2px dashed #a7f3d0;"><img src="${qrImageUrl}" alt="QR Code" width="160" height="160" crossorigin="anonymous" /><p style="font-size:12px;color:#9ca3af;margin-top:8px;">Scan QR code for verification</p></div>` : ''}
        <div style="text-align:center;font-size:12px;color:#9ca3af;padding:16px 32px;background:#f9fafb;">This is a ticket receipt showing status as Pending Verification. Once approved by administration, it compiles as Confirmed.</div>
      </div>
    `;

    document.body.appendChild(wrapper);

    try {
      const canvas = await html2canvas(wrapper, {
        useCORS: true,
        backgroundColor: '#f0fdf4',
        scale: 2,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `SuccessTeam-Ticket-${bookingId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      document.body.removeChild(wrapper);
    }
  };

  const handlePrint = () => window.print();

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="sbm-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Seat Booking Modal"
    >
      <div className={`sbm-card sbm-card-${step}`}>
        {/* Close button */}
        <button className="sbm-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* ── STEP 1: Centered Quantity Selector ───────── */}
        {step === 'quantity_select' && (
          <div className="qty-select-container">
            <h2 className="qty-select-title">How many seats would you like to book?</h2>
            


            <div className="qty-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  className={`qty-number-btn ${quantity === num ? 'qty-number-btn-active' : ''}`}
                  onClick={() => handleQuantityChange(num)}
                  aria-label={`${num} seat${num === 1 ? '' : 's'}`}
                >
                  {num}
                </button>
              ))}
            </div>

            <button
              className="qty-submit-btn"
              onClick={() => setStep('select')}
            >
              Select Seats
            </button>
          </div>
        )}

        {/* ── STEP 2: Seat Selection (Seat Map) ──────────────────── */}
        {step === 'select' && (
          <>
            <div className="sbm-header">
              <div className="sbm-kicker">Seat Reservation</div>
              <h2 className="sbm-title">{eventName}</h2>
              <div className="sbm-meta">
                <span className="sbm-meta-item"><MapPin size={13} /> {event.venue}</span>
                {event.eventDate && <span className="sbm-meta-item"><Calendar size={13} /> {event.eventDate}</span>}
                {event.eventTime && <span className="sbm-meta-item"><Clock size={13} /> {event.eventTime}</span>}
              </div>
            </div>

            {/* Warning Message Toast */}
            {warningMessage && (
              <div className="sbm-warning-toast">
                <AlertCircle size={16} />
                <span>{warningMessage}</span>
              </div>
            )}

            <div className="sbm-body">
              {/* ── Left: Seat Map ── */}
              <div className="sbm-left">
                <div className="stage-bar">
                  <span>▶ STAGE / PODIUM ◀</span>
                </div>

                <div className="seat-map-wrapper">
                  {ROWS.map((row) => (
                    <div key={row} className="seat-row-group">
                      <span className="row-label">{row}</span>
                      <div className="seat-row">
                        {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                          const currentSeatId = `${row}${i + 1}`;
                          const isSeatAlreadyBooked = alreadyBookedSeats.includes(currentSeatId) || bookedSeats.includes(currentSeatId);
                          const isSelected = selectedSeats.includes(currentSeatId);
                          return (
                            <button
                              key={currentSeatId}
                              className={`sbm-seat ${isSeatAlreadyBooked ? 'seat-booked pointer-events-none' : isSelected ? 'seat-selected' : 'seat-available'}`}
                              onClick={() => handleSeatClick(currentSeatId)}
                              disabled={isSeatAlreadyBooked}
                              title={`${currentSeatId} – ${isSeatAlreadyBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="seat-legend">
                  <span><i className="legend-dot ld-available" /> Available</span>
                  <span><i className="legend-dot ld-selected" /> Selected</span>
                  <span><i className="legend-dot ld-booked" /> Booked</span>
                </div>
              </div>

              {/* ── Right: Controls & Summary ── */}
              <div className="sbm-right">
                {/* Quantity Readout & Edit Option */}
                <div className="qty-indicator-box">
                  <div className="qty-indicator-info">
                    <span className="qty-indicator-label">Ticket Quantity</span>
                    <span className="qty-indicator-value">{quantity} Seat{quantity === 1 ? '' : 's'}</span>
                  </div>
                  <button 
                    className="qty-edit-btn" 
                    onClick={() => {
                      setStep('quantity_select');
                      setSelectedSeats([]);
                    }}
                    title="Change seat count"
                  >
                    Edit
                  </button>
                </div>

                {/* Booking Summary */}
                <div className="summary-card">
                  <div className="summary-head">Booking Summary</div>
                  
                  {/* Live Counter Progress bar */}
                  <div className="live-counter-section">
                    <div className="live-counter-text">
                      <span>Selected Seats</span>
                      <span className="counter-accent">{selectedSeats.length} / {quantity}</span>
                    </div>
                    <div className="progress-track">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${(selectedSeats.length / quantity) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="summary-row">
                    <span>Event</span>
                    <span className="summary-val summary-val-sm">{eventName}</span>
                  </div>
                  {event.eventDate && (
                    <div className="summary-row">
                      <span>Date</span>
                      <span className="summary-val">{event.eventDate}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Venue</span>
                    <span className="summary-val summary-val-sm">{event.venue}</span>
                  </div>
                  <div className="summary-row summary-row-seats">
                    <span>Seats Selected</span>
                    <div className="selected-seat-tags">
                      {selectedSeats.length > 0
                        ? selectedSeats.map((s) => (
                            <span key={s} className="seat-tag">{s}</span>
                          ))
                        : <span className="no-seats-hint">Click seats in map</span>}
                    </div>
                  </div>
                  <div className="summary-row">
                    <span>Price / Seat</span>
                    <span className="summary-val">₹{pricePerSeat}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-total-row">
                    <span>Total Amount</span>
                    <span className="summary-total-val">₹{totalPrice}</span>
                  </div>
                </div>

                <button
                  className="sbm-proceed-btn"
                  onClick={() => setStep('payment')}
                  disabled={selectedSeats.length !== quantity}
                >
                  {selectedSeats.length === quantity 
                    ? 'Proceed to Confirm →' 
                    : `Select ${quantity - selectedSeats.length} more seat${quantity - selectedSeats.length === 1 ? '' : 's'}`
                  }
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 3: Payment Page (Light Green & White Theme) ────── */}
        {step === 'payment' && (
          <div className="payment-container">
            <h2 className="payment-title">Complete Your Payment</h2>
            <p className="payment-subtitle">Verify reservation summary, scan the UPI QR code below and complete payment.</p>

            <div className="payment-split">
              {/* Left: Summary and Uploader */}
              <div className="payment-left-panel">
                <div className="summary-card" style={{ background: '#ffffff', borderColor: '#a7f3d0' }}>
                  <div className="summary-head" style={{ color: '#047857', borderBottomColor: '#ecfdf5' }}>Reservation Receipt Details</div>
                  <div className="summary-row">
                    <span>Event Program:</span>
                    <span className="summary-val">{eventName}</span>
                  </div>
                  <div className="summary-row">
                    <span>Venue Venue:</span>
                    <span className="summary-val">{event.venue}</span>
                  </div>
                  {event.eventDate && (
                    <div className="summary-row">
                      <span>Seminar Date:</span>
                      <span className="summary-val">{event.eventDate}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Selected Seats ({quantity}):</span>
                    <div className="selected-seat-tags">
                      {selectedSeats.map((s) => <span key={s} className="seat-tag">{s}</span>)}
                    </div>
                  </div>
                  <div className="summary-row">
                    <span>Price Per Seat:</span>
                    <span className="summary-val">₹{pricePerSeat}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-total-row">
                    <span>Grand Total Price:</span>
                    <span className="summary-total-val" style={{ color: '#10b981' }}>₹{totalPrice}</span>
                  </div>
                </div>

                {/* File Uploader */}
                <div className="upload-section">
                  <label className="upload-header">
                    <Upload size={16} />
                    <span>Upload Payment Screenshot <span className="upload-required-badge">Required</span></span>
                  </label>
                  
                  <div className="upload-dropzone">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.webp" 
                      onChange={handleScreenshotUpload}
                      id="screenshot-file-input"
                      className="hidden-file-input"
                    />
                    
                    {!screenshotUrl ? (
                      <label htmlFor="screenshot-file-input" className="file-input-label file-input-label-required">
                        <Upload size={24} className="upload-zone-icon" />
                        <strong>{isUploading ? 'Uploading proof image...' : 'Choose Receipt Screenshot file'}</strong>
                        <span>Supports JPG, JPEG, PNG, WEBP (max 3MB)</span>
                        <span className="upload-required-hint">⚠ Upload is required to confirm booking</span>
                      </label>
                    ) : (
                      <div className="upload-preview-container animate-fade-in">
                        <img src={screenshotUrl} alt="Screenshot Preview" className="uploaded-preview-img" />
                        <div className="upload-preview-meta">
                          <span className="upload-success-badge">✓ Payment proof uploaded successfully.</span>
                          <button 
                            type="button" 
                            onClick={() => setScreenshotUrl('')}
                            className="btn-clear-upload"
                          >
                            Upload Another File
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {uploadError && <span className="upload-error-text">⚠️ {uploadError}</span>}
                </div>
              </div>

              {/* Right: QR Code and Account Info */}
              <div className="payment-right-panel">
                <div className="qr-container-box">
                  <div className="qr-image-wrap">
                    <img src={qrCodeUrl} alt="UPI Payment QR Code" className="payment-qr-img" />
                  </div>
                  <div className="qr-pay-caption">Scan the QR code and complete the payment.</div>
                </div>

                <div className="upi-details-card">
                  <h4 className="upi-details-title">Beneficiary Details</h4>
                  <div className="upi-detail-row">
                    <span>Merchant Name:</span>
                    <strong>{upiConfig.upiName}</strong>
                  </div>
                  <div className="upi-detail-row">
                    <span>Payee UPI ID:</span>
                    <strong>{upiConfig.upiId}</strong>
                  </div>
                  <div className="upi-detail-row">
                    <span>Payable Amount:</span>
                    <strong style={{ color: '#10b981' }}>₹{totalPrice}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-actions" style={{ marginTop: '2.5rem', width: '100%', maxWidth: 'none', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                <button className="sbm-back-btn" onClick={() => setStep('select')} style={{ maxWidth: '180px' }}>
                  ← Back
                </button>
                <button 
                  className="sbm-confirm-btn" 
                  onClick={handleConfirmBooking} 
                  disabled={isSubmitting || !screenshotUrl}
                  style={{ maxWidth: '300px' }}
                  title={!screenshotUrl ? 'Please upload payment proof screenshot first' : ''}
                >
                  {isSubmitting ? 'Verifying Booking...' : 'Confirm Booking'}
                </button>
              </div>
              {!screenshotUrl && (
                <div className="proof-required-notice">
                  <span>📎 Please upload your payment screenshot above to enable confirmation.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Success + Ticket + QR ─────────────────────── */}
        {step === 'success' && confirmedData && (
          <div className="success-step">
            {/* Success Header */}
            <div className="success-header">
              <div className="success-check-wrap">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="success-title">Booking Registered!</h2>
              <div className="booking-id-display">{bookingId}</div>
              <span className="status-confirmed-pill">✓ PENDING VERIFICATION</span>
            </div>

            {/* Ticket */}
            <div className="ticket-display" id="printable-ticket">
              <div className="ticket-left">
                <div className="qr-wrapper">
                  {qrImageUrl ? (
                    <img
                      src={qrImageUrl}
                      alt="Booking QR Code"
                      className="qr-img"
                      loading="lazy"
                    />
                  ) : (
                    <div className="qr-placeholder">Generating QR…</div>
                  )}
                  <span className="qr-caption">Scan to audit booking</span>
                </div>
              </div>

              <div className="ticket-right">
                <div className="ticket-detail-row">
                  <span className="td-label">Event</span>
                  <strong className="td-value">{eventName}</strong>
                </div>
                <div className="ticket-detail-row">
                  <span className="td-label">Venue</span>
                  <strong className="td-value">{event.venue}</strong>
                </div>
                {event.eventDate && (
                  <div className="ticket-detail-row">
                    <span className="td-label">Date</span>
                    <strong className="td-value">{event.eventDate}</strong>
                  </div>
                )}
                {event.eventTime && (
                  <div className="ticket-detail-row">
                    <span className="td-label">Time</span>
                    <strong className="td-value">{event.eventTime}</strong>
                  </div>
                )}
                <div className="ticket-detail-row">
                  <span className="td-label">Seats</span>
                  <div className="td-seat-tags">
                    {(confirmedData?.seats || selectedSeats).map((s) => <span key={s} className="seat-tag">{s}</span>)}
                  </div>
                </div>
                <div className="ticket-detail-row">
                  <span className="td-label">No. of Seats</span>
                  <strong className="td-value">{confirmedData?.seats?.length || quantity}</strong>
                </div>
                <div className="ticket-detail-row">
                  <span className="td-label">Price / Seat</span>
                  <strong className="td-value">₹{pricePerSeat}</strong>
                </div>
                <div className="ticket-detail-row ticket-total-row">
                  <span className="td-label">Total Amount</span>
                  <strong className="td-value td-total">₹{confirmedData?.totalPrice !== undefined ? confirmedData.totalPrice : totalPrice}</strong>
                </div>
                <div className="ticket-detail-row">
                  <span className="td-label">Booked At</span>
                  <strong className="td-value td-small">{confirmedData?.timestamp || bookingTimestamp}</strong>
                </div>
                <div className="ticket-detail-row">
                  <span className="td-label">Status</span>
                  <strong className="td-value"><span className="td-status">✓ Pending Verification</span></strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ticket-action-row">
              <button className="tkt-action-btn tkt-dl-qr" onClick={handleDownloadQR}>
                <Download size={15} /> Download QR
              </button>
              <button className="tkt-action-btn tkt-dl-ticket" onClick={handleDownloadTicket}>
                <Ticket size={15} /> Download Ticket
              </button>
              <button className="tkt-action-btn tkt-print" onClick={handlePrint}>
                <Printer size={15} /> Print Ticket
              </button>
            </div>

            <button className="sbm-done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>

      {/* ─── Styles ─────────────────────────────────────────────────────────── */}
      <style jsx>{`
        /* Overlay */
        .sbm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          animation: overlayIn 0.25s ease;
        }

        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Modal Card */
        .sbm-card {
          position: relative;
          background: #ffffff;
          border-radius: 20px;
          width: 100%;
          max-height: 92vh;
          overflow-y: auto;
          box-shadow: 0 32px 80px rgba(0, 0, 0, 0.35);
          animation: cardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          scrollbar-width: thin;
          scrollbar-color: #a7f3d0 #ecfdf5;
          transition: max-width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sbm-card-quantity_select { max-width: 480px; }
        .sbm-card-select { max-width: 960px; }
        .sbm-card-payment { max-width: 840px; }
        .sbm-card-success { max-width: 760px; }

        @keyframes cardIn {
          from { opacity: 0; transform: scale(0.94) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Close Button */
        .sbm-close-btn {
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          z-index: 10;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: #f3f4f6;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .sbm-close-btn:hover { background: #fee2e2; color: #dc2626; transform: scale(1.1); }

        /* Step 1: Centered Quantity Selection styles */
        .qty-select-container {
          padding: 3.5rem 2.25rem 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .qty-select-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #1f2937;
          margin-bottom: 1.75rem;
          line-height: 1.3;
        }

        .illustration-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 140px;
          margin-bottom: 1.75rem;
        }

        .illustration-graphic {
          color: #10b981;
          width: 100px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.25s ease-out;
        }

        .illustration-graphic :global(.vehicle-svg) {
          width: 100%;
          height: 100%;
        }

        .illustration-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: #047857;
          margin-top: 0.5rem;
          background: #ecfdf5;
          padding: 4px 14px;
          border-radius: 99px;
          letter-spacing: 0.02em;
        }

        .qty-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 8px;
          max-width: 320px;
          margin-bottom: 2rem;
        }

        .qty-number-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1.5px solid #e5e7eb;
          background: #ffffff;
          font-size: 1rem;
          font-weight: 700;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .qty-number-btn:hover {
          border-color: #10b981;
          color: #10b981;
          background: #ecfdf5;
          transform: scale(1.08);
        }

        .qty-number-btn-active {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
          transform: scale(1.08);
        }
        .qty-number-btn-active:hover {
          background: #10b981;
          color: #ffffff;
        }

        .qty-submit-btn {
          width: 100%;
          max-width: 300px;
          padding: 0.875rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        .qty-submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }

        @keyframes bounceSubtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-subtle {
          animation: bounceSubtle 2s infinite ease-in-out;
        }

        /* Header */
        .sbm-header {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 2rem 2rem 1.75rem;
          border-radius: 20px 20px 0 0;
        }

        .sbm-kicker {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #a7f3d0;
          margin-bottom: 0.5rem;
        }

        .sbm-title {
          font-size: clamp(1.25rem, 4vw, 1.75rem);
          font-weight: 800;
          color: #ffffff;
          margin: 0 0 0.75rem;
          padding-right: 2.5rem;
          line-height: 1.2;
        }

        .sbm-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        .sbm-meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: #ecfdf5;
          font-weight: 500;
        }

        /* Warning Toast overlay in seat layout */
        .sbm-warning-toast {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          color: #b91c1c;
          border-bottom: 1.5px solid #fca5a5;
          padding: 0.75rem 2rem;
          font-size: 0.88rem;
          font-weight: 600;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        /* Body layout */
        .sbm-body {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }

        @media (min-width: 720px) {
          .sbm-body {
            grid-template-columns: 1.4fr 1fr;
          }
        }

        /* Seat Map Left */
        .sbm-left {
          padding: 1.75rem;
          border-right: 1px solid #ecfdf5;
          background: #ffffff;
        }

        .stage-bar {
          text-align: center;
          padding: 0.6rem 1rem;
          background: linear-gradient(90deg, #6b7280, #4b5563);
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 8px;
          margin-bottom: 1.25rem;
        }

        .seat-map-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .seat-row-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .row-label {
          width: 18px;
          font-size: 0.75rem;
          font-weight: 800;
          color: #4b5563;
          text-align: center;
          flex-shrink: 0;
        }

        .seat-row {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
        }

        /* ─── Circular Theater Seat Styling ────────────────────────── */
        .sbm-seat {
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 1.5px solid;
          font-size: 0.65rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Top-down seat back cushion arc */
        .sbm-seat::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 5px;
          right: 5px;
          height: 5px;
          border-radius: 2px;
          background: rgba(0, 0, 0, 0.12);
          transition: background 0.2s;
        }

        @media (max-width: 480px) {
          .sbm-seat { width: 22px; height: 22px; font-size: 0.55rem; }
          .sbm-seat::before { top: 2px; left: 4px; right: 4px; height: 4px; }
          .seat-row { gap: 4px; }
        }

        .seat-available {
          background: #ffffff;
          border-color: #10b981;
          color: #047857;
        }
        .seat-available:hover:not(:disabled) {
          background: #ecfdf5;
          border-color: #059669;
          transform: scale(1.18);
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.25);
        }

        .seat-selected {
          background: #10b981;
          border-color: #059669;
          color: white;
          transform: scale(1.12);
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.45);
        }
        .seat-selected::before {
          background: rgba(255, 255, 255, 0.35);
        }

        .seat-booked {
          background: #e5e7eb;
          border-color: #9ca3af;
          color: #4b5563;
          cursor: not-allowed;
        }
        .seat-booked::before {
          background: rgba(0, 0, 0, 0.05);
        }

        .pointer-events-none {
          pointer-events: none;
        }

        .seat-legend {
          display: flex;
          gap: 1rem;
          margin-top: 1.25rem;
          flex-wrap: wrap;
        }

        .seat-legend span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: #4b5563;
          font-weight: 600;
        }

        .legend-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1.5px solid;
        }

        .ld-available { background: #ffffff; border-color: #10b981; }
        .ld-selected { background: #10b981; border-color: #059669; }
        .ld-booked { background: #e5e7eb; border-color: #9ca3af; }

        /* Right Panel */
        .sbm-right {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          background: #ffffff;
        }

        /* Quantity Display & Edit Box */
        .qty-indicator-box {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 12px;
          padding: 0.85rem 1.15rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .qty-indicator-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .qty-indicator-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .qty-indicator-value {
          font-size: 0.95rem;
          font-weight: 800;
          color: #111827;
        }

        .qty-edit-btn {
          background: #ffffff;
          border: 1.5px solid #10b981;
          color: #047857;
          padding: 4px 14px;
          border-radius: 7px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        
        .qty-edit-btn:hover {
          background: #10b981;
          color: #ffffff;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.2);
        }

        /* Live Progress Counter */
        .live-counter-section {
          margin-bottom: 1.15rem;
        }

        .live-counter-text {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          font-weight: 700;
          color: #4b5563;
          margin-bottom: 6px;
        }

        .counter-accent {
          color: #10b981;
          font-weight: 800;
          font-size: 0.9rem;
        }

        .progress-track {
          height: 6px;
          background: #f3f4f6;
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: #10b981;
          border-radius: 99px;
          transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Summary Card */
        .summary-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem 1.125rem;
          font-size: 0.85rem;
        }

        .summary-head {
          font-weight: 800;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #374151;
          padding-bottom: 0.625rem;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 0.625rem;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.35rem 0;
          color: #6b7280;
          gap: 0.5rem;
        }

        .summary-row-seats {
          flex-direction: column;
          gap: 0.35rem;
        }

        .summary-val {
          font-weight: 600;
          color: #111827;
          text-align: right;
        }

        .summary-val-sm {
          font-size: 0.8rem;
        }

        .selected-seat-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: flex-end;
        }

        .seat-tag {
          background: #ecfdf5;
          color: #047857;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 5px;
        }

        .no-seats-hint {
          font-size: 0.75rem;
          color: #9ca3af;
          font-style: italic;
        }

        .summary-divider {
          border: 0;
          border-top: 1.5px solid #f3f4f6;
          margin: 0.5rem 0;
        }

        .summary-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          color: #111827;
        }

        .summary-total-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: #10b981;
        }

        /* Proceed Button */
        .sbm-proceed-btn {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }
        .sbm-proceed-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .sbm-proceed-btn:disabled {
          background: #d1d5db;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* ── STEP 3: Payment Page styles ──────────────────────────── */
        .payment-container {
          padding: 2.25rem 2rem;
        }

        .payment-title {
          font-size: 1.45rem;
          font-weight: 800;
          color: #111827;
          text-align: center;
          margin-bottom: 0.35rem;
        }

        .payment-subtitle {
          font-size: 0.88rem;
          color: #6b7280;
          text-align: center;
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .payment-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }

        @media (min-width: 768px) {
          .payment-split {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }

        .payment-left-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .upload-section {
          background: #ffffff;
          border: 1.5px dashed #a7f3d0;
          border-radius: 14px;
          padding: 1.25rem;
        }

        .upload-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #047857;
          margin-bottom: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .upload-dropzone {
          position: relative;
          background: #fafafc;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 1.5rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .upload-dropzone:hover {
          border-color: #10b981;
        }

        .hidden-file-input {
          display: none;
        }

        .file-input-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          color: #4b5563;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .file-input-label strong {
          color: #111827;
          font-size: 0.88rem;
        }

        .upload-zone-icon {
          color: #10b981;
          margin-bottom: 4px;
        }

        .upload-preview-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .uploaded-preview-img {
          max-width: 140px;
          max-height: 140px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          object-fit: contain;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }

        .upload-preview-meta {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .upload-success-badge {
          font-size: 0.8rem;
          font-weight: 700;
          color: #047857;
          background: #ecfdf5;
          padding: 4px 12px;
          border-radius: 99px;
        }

        .btn-clear-upload {
          background: none;
          border: none;
          color: #dc2626;
          font-size: 0.75rem;
          font-weight: 700;
          text-decoration: underline;
          cursor: pointer;
        }

        .upload-error-text {
          display: block;
          margin-top: 0.5rem;
          font-size: 0.78rem;
          color: #b91c1c;
          font-weight: 600;
          text-align: center;
        }

        .payment-right-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .qr-container-box {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          border-radius: 16px;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .qr-image-wrap {
          background: white;
          padding: 10px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
        }

        .payment-qr-img {
          width: 180px;
          height: 180px;
          display: block;
        }

        .qr-pay-caption {
          font-size: 0.85rem;
          font-weight: 700;
          color: #047857;
          text-align: center;
        }

        .upi-details-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.15rem;
          font-size: 0.85rem;
        }

        .upi-details-title {
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #374151;
          letter-spacing: 0.05em;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .upi-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          color: #4b5563;
        }

        .upi-detail-row strong {
          color: #111827;
        }

        /* ── Confirm actions ───────────────────────────────────────── */
        .confirm-actions {
          display: flex;
          gap: 0.75rem;
          width: 100%;
        }

        .sbm-back-btn {
          flex: 1;
          padding: 0.875rem;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .sbm-back-btn:hover { background: #e5e7eb; }

        .sbm-confirm-btn {
          flex: 2;
          padding: 0.875rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
        }
        .sbm-confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
        }
        .sbm-confirm-btn:disabled { background: #d1d5db; box-shadow: none; cursor: not-allowed; }

        /* ── Success Step ─────────────────────────────────────────── */
        .success-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
        }

        .success-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .success-check-wrap {
          width: 84px;
          height: 84px;
          background: #ecfdf5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          margin: 0 auto 0.875rem;
          animation: checkIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes checkIn {
          from { transform: scale(0.4); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .success-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: #111827;
          margin-bottom: 0.75rem;
        }

        .booking-id-display {
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: 3px;
          color: #10b981;
          background: #ecfdf5;
          border: 2px solid #a7f3d0;
          padding: 0.5rem 1.25rem;
          border-radius: 10px;
          display: inline-block;
          margin-bottom: 0.5rem;
          font-family: monospace;
        }

        .status-confirmed-pill {
          display: inline-block;
          background: #dcfce7;
          color: #047857;
          font-weight: 700;
          font-size: 0.8rem;
          padding: 4px 14px;
          border-radius: 999px;
          letter-spacing: 0.05em;
        }

        /* Ticket Layout */
        .ticket-display {
          display: flex;
          flex-direction: column;
          gap: 0;
          width: 100%;
          max-width: 760px;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin: 1rem 0;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }

        @media (min-width: 600px) {
          .ticket-display {
            flex-direction: row;
          }
        }

        .ticket-left {
          background: linear-gradient(160deg, #ecfdf5 0%, #dcfce7 100%);
          padding: 1.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-right: 2px dashed #a7f3d0;
          min-width: 180px;
        }

        .qr-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .qr-img {
          width: 150px;
          height: 150px;
          border-radius: 8px;
          border: 3px solid #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .qr-placeholder {
          width: 150px;
          height: 150px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .qr-caption {
          font-size: 0.72rem;
          color: #6b7280;
          text-align: center;
          font-weight: 500;
        }

        .ticket-right {
          flex: 1;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .ticket-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f3f4f6;
          gap: 0.5rem;
        }
        .ticket-detail-row:last-child { border-bottom: none; }

        .td-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          flex-shrink: 0;
        }

        .td-value {
          font-size: 0.85rem;
          font-weight: 600;
          color: #111827;
          text-align: right;
        }

        .td-small { font-size: 0.75rem; }

        .td-seat-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          justify-content: flex-end;
        }

        .ticket-total-row { background: #ecfdf5; border-radius: 6px; padding: 0.5rem 0.375rem; margin: 0.25rem 0; }

        .td-total {
          font-size: 1.1rem;
          font-weight: 800;
          color: #10b981;
        }

        .td-status {
          background: #dcfce7;
          color: #047857;
          padding: 2px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
        }

        /* Ticket Action Buttons */
        .ticket-action-row {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-top: 0.5rem;
          margin-bottom: 1rem;
        }

        .tkt-action-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 9px;
          border: 1.5px solid;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .tkt-dl-qr {
          background: #ecfdf5;
          color: #10b981;
          border-color: #a7f3d0;
        }
        .tkt-dl-qr:hover { background: #dcfce7; border-color: #10b981; transform: translateY(-2px); }

        .tkt-dl-ticket {
          background: #10b981;
          color: white;
          border-color: #10b981;
          box-shadow: 0 3px 10px rgba(16, 185, 129, 0.25);
        }
        .tkt-dl-ticket:hover { background: #059669; transform: translateY(-2px); box-shadow: 0 5px 14px rgba(16, 185, 129, 0.35); }

        .tkt-print {
          background: #f8fafc;
          color: #374151;
          border-color: #d1d5db;
        }
        .tkt-print:hover { background: #f3f4f6; transform: translateY(-2px); }

        .sbm-done-btn {
          padding: 0.75rem 2.5rem;
          background: #111827;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .sbm-done-btn:hover { background: #374151; transform: translateY(-2px); }

        /* Required upload badge */
        .upload-required-badge {
          display: inline-block;
          background: #fef2f2;
          color: #dc2626;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 4px;
          border: 1px solid #fecaca;
          margin-left: 6px;
          vertical-align: middle;
        }

        /* Hint inside dropzone when no upload */
        .upload-required-hint {
          display: block;
          margin-top: 6px;
          font-size: 0.78rem;
          color: #dc2626;
          font-weight: 600;
        }

        /* Highlighted dropzone border when required and empty */
        .file-input-label-required {
          border-color: #fca5a5 !important;
          background: #fff9f9 !important;
        }

        /* Notice below confirm button */
        .proof-required-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff3cd;
          border: 1px solid #ffd57e;
          color: #92400e;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          animation: fadeIn 0.3s ease;
          text-align: center;
          gap: 0.5rem;
        }

        /* Print styles */
        @media print {
          .sbm-overlay { position: static; background: none; backdrop-filter: none; }
          .sbm-card { box-shadow: none; max-height: none; overflow: visible; border-radius: 0; }
          .sbm-close-btn, .ticket-action-row, .sbm-done-btn, .sbm-header, .success-header { display: none !important; }
          .success-step { padding: 0; }
          .ticket-display { border: 1px solid #e5e7eb; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
