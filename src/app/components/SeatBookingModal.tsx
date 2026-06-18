'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X, Calendar, MapPin, CheckCircle2,
  Download, Printer, Ticket, Clock, AlertCircle, Hash
} from 'lucide-react';
import html2canvas from 'html2canvas';

// ─── Seat Configuration ───────────────────────────────────────────────────────
const ROWS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'BB', 'CC', 'DD'
];
const SEATS_PER_ROW = 20;
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
  const [quantity, setQuantity] = useState(2);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [alreadyBookedSeats, setAlreadyBookedSeats] = useState<string[]>([]);
  const [step, setStep] = useState<'booker_info' | 'quantity_select' | 'select' | 'attendee_details' | 'payment' | 'success'>('booker_info');
  const [bookingStatus, setBookingStatus] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [bookingTimestamp, setBookingTimestamp] = useState('');
  const [confirmedData, setConfirmedData] = useState<any>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [attendeeDetails, setAttendeeDetails] = useState<Record<string, { name: string; whatsapp: string }>>({});
  const [currentAttendeeIndex, setCurrentAttendeeIndex] = useState(0);

  // Card ref for scroll reset on step transition
  const cardRef = useRef<HTMLDivElement>(null);

  // Booker identity states (replaces login/register)
  const [bookerName, setBookerName] = useState('');
  const [bookerMemberId, setBookerMemberId] = useState('');
  const [bookerPhone, setBookerPhone] = useState('');
  const [bookerError, setBookerError] = useState('');

  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const checkScroll = () => {
    if (step === 'booker_info' && cardRef.current) {
      const target = cardRef.current;
      const canScrollMore = target.scrollHeight - target.scrollTop - target.clientHeight > 30;
      setShowScrollBtn(canScrollMore);
    } else {
      setShowScrollBtn(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(checkScroll, 100);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [step]);

  // Member ID starts empty — user must enter their own 8-9 char ID

  // Scroll card back to top on every step change (removes visual layout jumping/scrolling issues)
  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.scrollTop = 0;
    }
  }, [step]);

  const handleBookerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookerError('');
    const trimmedName = bookerName.trim();
    const trimmedId = bookerMemberId.trim().toUpperCase();
    const trimmedPhone = bookerPhone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setBookerError('Please enter your full name (at least 2 characters).');
      return;
    }
    // 8-9 char: 2-3 letters at start, rest digits
    const memberIdRegex = /^[A-Z]{2,3}[0-9]{5,7}$/;
    if (!memberIdRegex.test(trimmedId) || trimmedId.length < 8 || trimmedId.length > 9) {
      setBookerError('Member ID must be 8-9 characters: 2-3 letters followed by digits (e.g., AB123456).');
      return;
    }
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      setBookerError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setBookerMemberId(trimmedId);
    setBookerPhone(trimmedPhone);
    setStep('quantity_select');
  };


  // Payment configuration and UTR states
  const [upiConfig, setUpiConfig] = useState({ upiId: 'shesh.dav07-1@okaxis', upiName: 'david', upiQrUrl: '/upi-qr-code.jpg?v=2' });
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [utrError, setUtrError] = useState<string | null>(null);

  // Approval notification state
  const [approvalNotification, setApprovalNotification] = useState<{ show: boolean; status: 'approved' | 'denied' | null; bookingRef: string }>({ show: false, status: null, bookingRef: '' });
  const [pollingIntervalRef, setPollingIntervalRef] = useState<NodeJS.Timeout | null>(null);

  const eventName = event.title || event.name || 'Success Team Seminar';
  const pricePerSeat = 1000;
  const basePrice = selectedSeats.length * pricePerSeat;
  const gstAmount = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gstAmount;
  // Dynamic QR scanner image based on seat count (1 seat=1000.png, 2=2000.png, …10=10000.png)
  const scannerImage = selectedSeats.length > 0 ? `/UPIs/${selectedSeats.length * pricePerSeat}.png` : '/UPIs/1000.png';

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
  const qrCodeUrl = `/UPIs/${(selectedSeats.length || quantity) * 1000}.png`;

  // QR code data for ticket validation
  const qrPayload = confirmedData
    ? `BOOKING:${confirmedData.id}|EVENT:${eventName}|SEATS:${confirmedData.seats.join(',')}|ATTENDEES:${confirmedData.seats.map((s: string) => `${s}=${confirmedData.attendees?.[s]?.name || 'N/A'}`).join(',')}|VENUE:${event.venue}|DATE:${event.eventDate || 'TBD'}|AMOUNT:INR${confirmedData.totalPrice}|STATUS:${bookingStatus.toUpperCase()}`
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

  // UTR validation: must be exactly 12 digits
  const validateUTR = (val: string) => /^[0-9]{12}$/.test(val);

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

    const attendeesObj = selectedSeats.reduce((acc, seat) => {
      acc[seat] = {
        name: attendeeDetails[seat]?.name || '',
        whatsapp: attendeeDetails[seat]?.whatsapp || '',
      };
      return acc;
    }, {} as Record<string, { name: string; whatsapp: string }>);

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
      screenshot: `UTR:${utrNumber}|` + JSON.stringify(attendeesObj),
      attendeeDetails: attendeesObj,
      bookerName,
      bookerMemberId,
      bookerPhone,
      utrNumber,
    };

    const headers: any = { 'Content-Type': 'application/json' };

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
      setConfirmedData({ id: newBookingId, seats: selectedSeats, totalPrice, timestamp: ts, attendees: attendeesObj });
      setBookingStatus('pending');
      setIsSubmitting(false);
      setStep('success');

      // Start polling for admin approval notification
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/bookings/status?bookingId=${encodeURIComponent(newBookingId)}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.status === 'approved' || statusData.status === 'denied') {
              clearInterval(pollInterval);
              setBookingStatus(statusData.status);
              setApprovalNotification({ show: true, status: statusData.status, bookingRef: newBookingId });
            }
          }
        } catch (e) {
          // silent poll failure
        }
      }, 8000); // poll every 8 seconds
      setPollingIntervalRef(pollInterval);
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

    const seatsHtml = seatsToRender.map((s: string) => `<span style="background:#dcfce7;color:#047857;padding:3px 10px;border-radius:6px;font-size:13px;font-weight:700;margin:2px">${s}</span>`).join('');
    const currentAttendees = confirmedData?.attendees || attendeeDetails;
    const attendeesHtml = seatsToRender.map((s: string) => {
      const info = currentAttendees[s];
      const nameText = typeof info === 'object' && info !== null ? info.name : (info || 'N/A');
      const phoneText = typeof info === 'object' && info !== null ? (info.whatsapp || info.phone || '') : '';
      return `<div style="display:flex;justify-content:space-between;font-size:12px;color:#374151;padding:2px 0;"><strong>Seat ${s}:</strong><span>${nameText}${phoneText ? ` (${phoneText})` : ''}</span></div>`;
    }).join('');

    const statusLabel = bookingStatus === 'approved' ? '✓ CONFIRMED & VERIFIED' : bookingStatus === 'denied' ? '✗ PAYMENT REJECTED' : '✓ PENDING VERIFICATION';
    const statusBg = bookingStatus === 'approved' ? '#dcfce7' : bookingStatus === 'denied' ? '#fee2e2' : '#fef3c7';
    const statusColor = bookingStatus === 'approved' ? '#047857' : bookingStatus === 'denied' ? '#b91c1c' : '#d97706';
    const explanationText = bookingStatus === 'approved' 
      ? 'This is a confirmed and verified ticket. Welcome to the Success Team Event!' 
      : bookingStatus === 'denied' 
        ? 'This ticket booking payment verification has been rejected by administration. Please check UTR or contact support.' 
        : 'This is a ticket receipt showing status as Pending Verification. Once approved by administration, it compiles as Confirmed.';

    wrapper.innerHTML = `
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.15);">
        <div style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:white;padding:32px;text-align:center;">
          <h1 style="font-size:28px;font-weight:800;letter-spacing:2px;margin:0 0 4px;">SUCCESS TEAM</h1>
          <p style="font-size:13px;opacity:0.85;margin:0;">Official Event Booking Confirmation</p>
          <div style="font-size:26px;font-weight:900;letter-spacing:4px;background:rgba(255,255,255,0.15);padding:12px 24px;border-radius:8px;margin:16px auto;display:inline-block;">${bookingId}</div>
        </div>
        <div style="padding:32px;">
          <div style="text-align:center;margin-bottom:20px;"><span style="display:inline-flex;align-items:center;gap:6px;background:${statusBg};color:${statusColor};padding:6px 16px;border-radius:999px;font-weight:700;font-size:14px;">${statusLabel}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Event</span><span style="font-weight:600;">${eventName}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Venue</span><span style="font-weight:600;">${event.venue}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Date</span><span style="font-weight:600;">${event.eventDate || 'To Be Confirmed'}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Time</span><span style="font-weight:600;">${event.eventTime || '10:00 AM'}</span></div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:12px 0;border-bottom:1px solid #f3f4f6;gap:16px;"><span style="color:#6b7280;font-size:13px;flex-shrink:0;">Seats (${seatsLength})</span><div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;">${seatsHtml}</div></div>
          <div style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <span style="color:#6b7280;font-size:13px;display:block;margin-bottom:6px;">Attendee Details:</span>
            <div style="background:#f9fafb;border-radius:8px;padding:8px 12px;">
              ${attendeesHtml}
            </div>
          </div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Price per Seat</span><span style="font-weight:600;">₹${pricePerSeat}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Base Amount</span><span style="font-weight:600;">₹${seatsLength * pricePerSeat}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">GST (18%)</span><span style="font-weight:600;">₹${Math.round(seatsLength * pricePerSeat * 0.18)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f3f4f6;"><span style="color:#6b7280;font-size:13px;">Booked At</span><span style="font-weight:600;">${timestampToRender}</span></div>
          <div style="background:#ecfdf5;border-radius:8px;padding:16px;margin-top:16px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:15px;font-weight:600;color:#374151;">Grand Total (with GST)</span><span style="font-size:24px;font-weight:800;color:#10b981;">₹${priceToRender}</span></div>
        </div>
        ${qrImageUrl ? `<div style="text-align:center;padding:24px;border-top:2px dashed #a7f3d0;"><img src="${qrImageUrl}" alt="QR Code" width="160" height="160" crossorigin="anonymous" /><p style="font-size:12px;color:#9ca3af;margin-top:8px;">Scan QR code for verification</p></div>` : ''}
        <div style="text-align:center;font-size:12px;color:#9ca3af;padding:16px 32px;background:#f9fafb;">${explanationText}</div>
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
    return () => {
      document.body.style.overflow = '';
      // Clean up polling interval when modal closes
      if (pollingIntervalRef) clearInterval(pollingIntervalRef);
    };
  }, []);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="sbm-overlay"
      onClick={(e) => { /* Only close when X is clicked */ }}
      role="dialog"
      aria-modal="true"
      aria-label="Seat Booking Modal"
    >
      <div 
        ref={cardRef} 
        className={`sbm-card sbm-card-${step}`} 
        onClick={(e) => e.stopPropagation()}
        onScroll={checkScroll}
      >
        {/* Close button */}
        <button className="sbm-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* ── Approval Notification Toast ── */}
        {approvalNotification.show && (
          <div className={`approval-notification-toast ${approvalNotification.status === 'approved' ? 'toast-approved' : 'toast-denied'}`}>
            <div className="toast-icon">
              {approvalNotification.status === 'approved' ? '✅' : '❌'}
            </div>
            <div className="toast-body">
              <strong className="toast-title">
                {approvalNotification.status === 'approved' ? 'Booking Approved!' : 'Booking Rejected'}
              </strong>
              <span className="toast-msg">
                {approvalNotification.status === 'approved'
                  ? `Your booking ${approvalNotification.bookingRef} has been confirmed by admin. Welcome aboard! 🎉`
                  : `Your booking ${approvalNotification.bookingRef} was rejected. Please contact support.`
                }
              </span>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => setApprovalNotification(prev => ({ ...prev, show: false }))}
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )}



        {/* ── STEP 0: Booker Identity Registration ────── */}
        {step === 'booker_info' && (
          <div className="booker-info-container">
            {/* Image header */}
            <div className="booker-img-header">
              <img src="/img.png" alt="Register to Book" className="booker-header-img" />
            </div>

            {/* Form body */}
            <div className="booker-form-body">
              <h2 className="booker-title-under">Register to Book</h2>
              {bookerError && (
                <div className="booker-error-alert animate-shake-x">
                  <AlertCircle size={15} />
                  <span>{bookerError}</span>
                </div>
              )}

              <form onSubmit={handleBookerSubmit} className="booker-form">
                {/* Full Name */}
                <div className="form-input-group">
                  <label className="input-field-label">
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-field-wrap">
                    <span className="input-field-icon">👤</span>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={bookerName}
                      onChange={(e) => { setBookerName(e.target.value); setBookerError(''); }}
                      required
                      autoFocus
                      className="text-input-field"
                    />
                  </div>
                </div>

                {/* Mobile Number */}
                <div className="form-input-group">
                  <label className="input-field-label">
                    Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-field-wrap">
                    <span className="input-field-icon">📞</span>
                    <input
                      type="tel"
                      placeholder="Enter your 10-digit mobile number"
                      value={bookerPhone}
                      onChange={(e) => {
                        let val = e.target.value.trim();
                        if (val.startsWith('+91')) {
                          val = val.substring(3);
                        } else if (val.startsWith('91') && val.length > 10) {
                          val = val.substring(2);
                        }
                        val = val.replace(/[^0-9]/g, '').slice(0, 10);
                        setBookerPhone(val);
                        setBookerError('');
                      }}
                      required
                      className="text-input-field"
                    />
                  </div>
                </div>

                {/* Member ID */}
                <div className="form-input-group">
                  <label className="input-field-label">
                    Member ID <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-field-wrap member-id-wrap">
                    <span className="input-field-icon">🪪</span>
                    <input
                      type="text"
                      placeholder="e.g. AB123456"
                      value={bookerMemberId}
                      onChange={(e) => {
                        const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9);
                        setBookerMemberId(raw);
                        setBookerError('');
                      }}
                      maxLength={9}
                      required
                      className="text-input-field member-id-input"
                    />
                  </div>
                  {/* Character pip indicators */}
                  <div className="member-id-pips">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <span
                        key={i}
                        className={`char-pip ${i < bookerMemberId.length ? 'char-pip-filled' : ''}`}
                      />
                    ))}
                    <span className="pips-count">{bookerMemberId.length}/9</span>
                  </div>
                </div>

                <button type="submit" className="sbm-proceed-btn booker-submit-btn">
                  Continue to Seat Selection →
                </button>
              </form>

              <div className="booker-info-note">
                <span>🔒 Your identity is linked to your booking receipt only.</span>
              </div>
            </div>
          </div>
        )}

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
                  <div className="summary-row">
                    <span>Base Amount</span>
                    <span className="summary-val">₹{basePrice}</span>
                  </div>
                  <div className="summary-row">
                    <span>GST (18%)</span>
                    <span className="summary-val">₹{gstAmount}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-total-row">
                    <span>Grand Total</span>
                    <span className="summary-total-val">₹{totalPrice}</span>
                  </div>
                </div>

                <button
                  className="sbm-proceed-btn"
                  onClick={() => {
                    setCurrentAttendeeIndex(0);
                    setStep('attendee_details');
                  }}
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

        {/* ── STEP 2.5: Attendee Details (Sequential Forms) ────── */}
        {step === 'attendee_details' && (
          <div key={currentAttendeeIndex} className="attendee-container animate-slide-in-form">
            <h2 className="payment-title" style={{ marginBottom: '0.25rem' }}>Attendee Registration</h2>
            <p className="payment-subtitle" style={{ marginBottom: '1.5rem' }}>
              Enter details for seat <strong style={{ color: '#10b981' }}>{selectedSeats[currentAttendeeIndex]}</strong>.
            </p>

            <div className="attendee-progress-box">
              <div className="progress-info">
                <span>Seat Assignment Progress</span>
                <span className="progress-fraction">{currentAttendeeIndex + 1} of {selectedSeats.length}</span>
              </div>
              <div className="progress-track-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${((currentAttendeeIndex + 1) / selectedSeats.length) * 100}%` }}
                />
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const currentName = attendeeDetails[selectedSeats[currentAttendeeIndex]]?.name || '';
              const currentPhone = attendeeDetails[selectedSeats[currentAttendeeIndex]]?.whatsapp || '';
              if (!currentName.trim()) {
                alert('Please enter the name of the attendee.');
                return;
              }
              const phoneRegex = /^[0-9]{10}$/;
              if (!phoneRegex.test(currentPhone)) {
                alert('Please enter a valid 10-digit WhatsApp mobile number.');
                return;
              }
              if (currentAttendeeIndex < selectedSeats.length - 1) {
                setCurrentAttendeeIndex(prev => prev + 1);
              } else {
                setStep('payment');
              }
            }} className="attendee-fields-form">
              <div className="form-input-group">
                <label className="input-field-label">Selected Event</label>
                <div className="input-readonly-wrap">
                  <span className="input-field-icon">📅</span>
                  <input type="text" value={eventName} readOnly disabled className="readonly-input" />
                </div>
              </div>

              <div className="form-input-group">
                <label className="input-field-label">Assigned Seat ID</label>
                <div className="input-readonly-wrap">
                  <span className="input-field-icon">🎟️</span>
                  <input type="text" value={selectedSeats[currentAttendeeIndex]} readOnly disabled className="readonly-input" style={{ fontWeight: 'bold', color: '#10b981' }} />
                </div>
              </div>

              <div className="form-input-group">
                <label className="input-field-label">Attendee Name <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-field-wrap">
                  <span className="input-field-icon">👤</span>
                  <input 
                    type="text" 
                    placeholder="Enter full name of the attendee" 
                    value={attendeeDetails[selectedSeats[currentAttendeeIndex]]?.name || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAttendeeDetails(prev => ({
                        ...prev,
                        [selectedSeats[currentAttendeeIndex]]: {
                          name: val,
                          whatsapp: prev[selectedSeats[currentAttendeeIndex]]?.whatsapp || ''
                        }
                      }));
                    }}
                    required
                    autoFocus
                    className="text-input-field"
                  />
                </div>
              </div>

              <div className="form-input-group">
                <label className="input-field-label">WhatsApp Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                <div className="input-field-wrap">
                  <span className="input-field-icon">📞</span>
                  <input 
                    type="tel" 
                    placeholder="Enter 10-digit mobile number" 
                    value={attendeeDetails[selectedSeats[currentAttendeeIndex]]?.whatsapp || ''}
                    onChange={(e) => {
                      let val = e.target.value.trim();
                      if (val.startsWith('+91')) {
                        val = val.substring(3);
                      } else if (val.startsWith('91') && val.length > 10) {
                        val = val.substring(2);
                      }
                      val = val.replace(/[^0-9]/g, '').slice(0, 10);
                      setAttendeeDetails(prev => ({
                        ...prev,
                        [selectedSeats[currentAttendeeIndex]]: {
                          name: prev[selectedSeats[currentAttendeeIndex]]?.name || '',
                          whatsapp: val
                        }
                      }));
                    }}
                    required
                    className="text-input-field"
                  />
                </div>
              </div>

              <div className="attendee-form-buttons">
                <button 
                  type="button" 
                  onClick={() => {
                    if (currentAttendeeIndex > 0) {
                      setCurrentAttendeeIndex(prev => prev - 1);
                    } else {
                      setStep('select');
                    }
                  }}
                  className="sbm-back-btn"
                  style={{ maxWidth: '140px', margin: 0 }}
                >
                  ← Back
                </button>
                <button 
                  type="submit" 
                  className="sbm-proceed-btn"
                  style={{ maxWidth: '240px', margin: 0 }}
                >
                  {currentAttendeeIndex < selectedSeats.length - 1 ? 'Next Attendee' : 'Proceed to Payment'}
                </button>
              </div>
            </form>
          </div>
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
                    <span>Venue:</span>
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
                  <div className="summary-row">
                    <span>Base Amount:</span>
                    <span className="summary-val">₹{basePrice}</span>
                  </div>
                  <div className="summary-row">
                    <span>GST (18%):</span>
                    <span className="summary-val">₹{gstAmount}</span>
                  </div>
                  <div className="summary-divider" />
                  <div className="summary-total-row">
                    <span>Grand Total (with GST):</span>
                    <span className="summary-total-val" style={{ color: '#10b981' }}>₹{totalPrice}</span>
                  </div>
                </div>

                {/* UTR Input Section */}
                <div className="utr-section">
                  <label className="utr-header">
                    {/* <Hash size={16} /> */}
                    <span>UPI Transaction Reference (UTR) <span className="upload-required-badge">Required</span></span>
                  </label>
                  <p className="utr-desc">
                    After completing payment via GPay or any UPI app, enter the <strong>12-digit UTR / Transaction ID</strong> shown in your payment receipt.
                  </p>
                  <div className="utr-input-wrap">
                    <span className="utr-input-icon">🔢</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 12-digit UTR (e.g. 412345678901)"
                      value={utrNumber}
                      maxLength={12}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                        setUtrNumber(val);
                        setUtrError(null);
                      }}
                      className="utr-input-field"
                    />
                  </div>
                  {/* UTR pip indicators */}
                  <div className="utr-pips">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span
                        key={i}
                        className={`char-pip ${i < utrNumber.length ? 'char-pip-filled' : ''}`}
                      />
                    ))}
                    <span className="pips-count">{utrNumber.length}/12</span>
                  </div>
                  {utrError && <span className="utr-error-text">⚠️ {utrError}</span>}
                  {validateUTR(utrNumber) && (
                    <div className="utr-valid-badge animate-fade-in">
                      ✓ UTR entered — your booking will go to admin for approval
                    </div>
                  )}
                </div>
              </div>

              {/* Right: QR Code and Account Info */}
              <div className="payment-right-panel">
                {/* Professional event image placement */}
                {/* <div className="payment-event-img-wrap">
                  <img src="/image.png" alt="Event" className="payment-event-img" />
                </div> */}

                <div className="qr-container-box">
                  <div className="qr-image-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={scannerImage} alt={`UPI QR Code for ₹${basePrice}`} className="payment-qr-img" />
                  </div>
                  <div className="qr-pay-caption">Scan the QR code and complete the payment.</div>
                </div>

                <div className="upi-details-card">
                  <h4 className="upi-details-title">Beneficiary Details</h4>
                  <div className="upi-detail-row">
                    <span className="upi-label">Merchant Name</span>
                    <strong className="upi-value">{upiConfig.upiName}</strong>
                  </div>
                  <div className="upi-detail-row">
                    <span className="upi-label">Payee UPI ID</span>
                    <strong className="upi-value upi-id-value">{upiConfig.upiId}</strong>
                  </div>
                  <div className="upi-divider" style={{ borderTop: '1px dashed #e5e7eb', margin: '0.65rem 0' }} />
                  <div className="upi-detail-row">
                    <span className="upi-label">Base Amount</span>
                    <strong className="upi-value">₹{basePrice}</strong>
                  </div>
                  <div className="upi-detail-row">
                    <span className="upi-label">GST (18%)</span>
                    <strong className="upi-value">₹{gstAmount}</strong>
                  </div>
                  <div className="upi-detail-row">
                    <span className="upi-label">Payable Amount</span>
                    <strong className="upi-value" style={{ color: '#10b981', fontSize: '1.05rem' }}>₹{totalPrice}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-actions" style={{ marginTop: '2.5rem', width: '100%', maxWidth: 'none', justifyContent: 'center', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                <button className="sbm-back-btn" onClick={() => setStep('attendee_details')} style={{ maxWidth: '180px' }}>
                  ← Back
                </button>
                <button 
                  className="sbm-confirm-btn" 
                  onClick={() => {
                    if (!validateUTR(utrNumber)) {
                      setUtrError('Please enter a valid 12-digit UTR number from your UPI payment receipt.');
                      return;
                    }
                    handleConfirmBooking();
                  }}
                  disabled={isSubmitting}
                  style={{ maxWidth: '300px' }}
                >
                  {isSubmitting ? 'Submitting for Approval...' : 'Submit for Approval →'}
                </button>
              </div>
              {!validateUTR(utrNumber) && (
                <div className="proof-required-notice">
                  <span>🔢 Please enter your 12-digit UTR number above to proceed.</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Booking Registered — Awaiting Admin Approval ── */}
        {step === 'success' && confirmedData && (
          <div className="success-step">

            {/* ── Animated Hero Banner based on bookingStatus ── */}
            {bookingStatus === 'pending' && (
              <div className="success-hero-banner status-pending-banner">
                <div className="success-anim-container">
                  <div className="success-ring ring-outer" />
                  <div className="success-ring ring-mid" />
                  <div className="success-ring ring-inner" />
                  <div className="success-check-wrap">
                    <CheckCircle2 size={52} strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="success-title">Booking Registered Successfully!</h2>
                <p className="success-sub">Your seats have been reserved and sent to the admin for verification.</p>
                <div className="booking-id-display">{bookingId}</div>
                <div className="approval-waiting-badge">
                  <span className="waiting-pulse-dot" />
                  <span>Awaiting Admin Approval</span>
                </div>
                
                {/* Sleek Dynamic Active Connection Loader */}
                {/* <div className="live-verification-loader">
                  <div className="loader-line-track">
                    <div className="loader-line-fill" />
                  </div>
                </div> */}
                
                <div className="admin-sent-notice" style={{ marginTop: '1rem' }}>
                  📋 All booking information has been sent to the admin panel for review.
                </div>
              </div>
            )}

            {bookingStatus === 'approved' && (
              <div className="success-hero-banner status-approved-banner animate-pop-in">
                <div className="success-anim-container approved-celebration">
                  <div className="success-ring ring-outer-green" />
                  <div className="success-ring ring-mid-green" />
                  <div className="success-ring ring-inner-green" />
                  <div className="success-check-wrap approved-check">
                    <CheckCircle2 size={52} strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="success-title" style={{ color: '#047857' }}>Booking Confirmed & Verified!</h2>
                <p className="success-sub" style={{ color: '#065f46' }}>Your payment was verified. Welcome to the event! 🎉</p>
                <div className="booking-id-display" style={{ borderColor: '#34d399', color: '#047857' }}>{bookingId}</div>
                <div className="approval-success-badge animate-bounce-subtle">
                  <span>✅ Confirmed & Verified Ticket</span>
                </div>
              </div>
            )}

            {bookingStatus === 'denied' && (
              <div className="success-hero-banner status-denied-banner animate-pop-in">
                <div className="success-anim-container denied-error">
                  <div className="error-circle-wrap">
                    <X size={52} strokeWidth={2.5} />
                  </div>
                </div>
                <h2 className="success-title" style={{ color: '#b91c1c' }}>Payment Verification Failed</h2>
                <p className="success-sub" style={{ color: '#991b1b' }}>The payment transaction UTR could not be verified by the admin.</p>
                <div className="booking-id-display" style={{ borderColor: '#fca5a5', color: '#b91c1c' }}>{bookingId}</div>
                <div className="approval-failed-badge">
                  <span>❌ Rejected / Action Required</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: '0.85rem', fontWeight: 600 }}>
                  Please double-check the UTR Number: <code style={{ background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>{utrNumber}</code> or contact our support team.
                </p>
              </div>
            )}

            {/* ── Full Booking Summary Card (Only shown when approved) ── */}
            {bookingStatus === 'approved' && (
              <div className="bsc-card" id="printable-ticket">
                
                <div className="bsc-header-bar" style={{
                  background: 'linear-gradient(90deg, #065f46 0%, #10b981 100%)'
                }}>
                  <span className="bsc-title">Event E-Ticket</span>
                  <span className="bsc-status-pill">CONFIRMED</span>
                </div>

                {/* Top Grid: QR + Identity + Event */}
                <div className="bsc-top-grid">
                  {/* QR Code */}
                  <div className="bsc-qr-block" style={{
                    background: 'linear-gradient(150deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRightColor: '#a7f3d0'
                  }}>
                    {qrImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={qrImageUrl} alt="Booking QR Code" className="bsc-qr-img" style={{
                        borderColor: '#10b981'
                      }} loading="lazy" />
                    ) : (
                      <div className="bsc-qr-placeholder">Generating QR…</div>
                    )}
                    <span className="bsc-qr-caption" style={{
                      color: '#047857'
                    }}>Booking Audit QR Code</span>
                  </div>

                  <div className="bsc-right-block">
                    {/* Booker Identity */}
                    <div className="bsc-group-label">👤 Booker Identity</div>
                    <div className="bsc-info-row"><span>Booker Name</span><strong>{bookerName}</strong></div>
                    <div className="bsc-info-row"><span>Member ID</span><strong style={{ fontFamily: 'monospace', letterSpacing: '0.06em' }}>{bookerMemberId}</strong></div>
                    <div className="bsc-info-row"><span>Mobile Number</span><strong>{bookerPhone}</strong></div>

                    {/* Event Details */}
                    <div className="bsc-group-label" style={{ marginTop: '1.1rem' }}>🎫 Event Information</div>
                    <div className="bsc-info-row"><span>Event Program</span><strong>{eventName}</strong></div>
                    <div className="bsc-info-row"><span>Venue</span><strong>{event.venue}</strong></div>
                    {event.eventDate && <div className="bsc-info-row"><span>Event Date</span><strong>{event.eventDate}</strong></div>}
                    {event.eventTime && <div className="bsc-info-row"><span>Event Time</span><strong>{event.eventTime}</strong></div>}
                    <div className="bsc-info-row">
                      <span>Seats ({confirmedData?.seats?.length || quantity})</span>
                      <div className="bsc-seat-tags">
                        {(confirmedData?.seats || selectedSeats).map((s: string) => (
                          <span key={s} className="bsc-seat-chip">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendees */}
                <div className="bsc-section">
                  <div className="bsc-group-label">🧑‍🤝‍🧑 Registered Attendees</div>
                  <div className="bsc-attendees-grid">
                    {(confirmedData?.seats || selectedSeats).map((s: string) => {
                      const info = (confirmedData?.attendees || attendeeDetails)[s];
                      const nameText = typeof info === 'object' && info !== null ? info.name : (info || 'N/A');
                      const phoneText = typeof info === 'object' && info !== null ? (info.whatsapp || info.phone || '') : '';
                      return (
                        <div key={s} className="bsc-attendee-card">
                          <span className="bsc-attendee-seat">{s}</span>
                          <div className="bsc-attendee-details">
                            <strong>{nameText}</strong>
                            {phoneText && <span className="bsc-attendee-phone">📞 {phoneText}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bsc-section">
                  <div className="bsc-group-label">💳 Payment Details</div>
                  <div className="bsc-info-row"><span>Price / Seat</span><strong>₹{pricePerSeat}</strong></div>
                  <div className="bsc-info-row"><span>No. of Seats</span><strong>{confirmedData?.seats?.length || quantity}</strong></div>
                  <div className="bsc-info-row"><span>Base Amount</span><strong>₹{(confirmedData?.seats?.length || quantity) * pricePerSeat}</strong></div>
                  <div className="bsc-info-row"><span>GST (18%)</span><strong>₹{Math.round((confirmedData?.seats?.length || quantity) * pricePerSeat * 0.18)}</strong></div>
                  <div className="bsc-divider" />
                  <div className="bsc-info-row bsc-total-row">
                    <span>Grand Total (incl. GST)</span>
                    <strong className="bsc-total-amount">₹{confirmedData?.totalPrice !== undefined ? confirmedData.totalPrice : totalPrice}</strong>
                  </div>
                  <div className="bsc-info-row" style={{ marginTop: '0.85rem' }}>
                    <span>UPI Transaction ID (UTR)</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#059669' }}>{utrNumber}</strong>
                  </div>
                  <div className="bsc-info-row">
                    <span>Booking Registered At</span>
                    <strong style={{ fontSize: '0.8rem' }}>{confirmedData?.timestamp || bookingTimestamp}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons (Only shown when approved) ── */}
            {bookingStatus === 'approved' && (
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
            )}

            <button className="sbm-done-btn" onClick={onClose}>
              Done
            </button>
          </div>
        )}

        {showScrollBtn && (
          <div className="booker-scroll-btn-wrap">
            {/* <button 
              type="button" 
              className="booker-scroll-btn animate-bounce"
              onClick={() => {
                if (cardRef.current) {
                  cardRef.current.scrollTo({
                    top: cardRef.current.scrollHeight,
                    behavior: 'smooth'
                  });
                }
              }}
              aria-label="Scroll to bottom"
            >
              Scroll Down ↓
            </button> */}
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

        .sbm-card-booker_info { max-width: 480px; overflow-y: auto !important; }
        .sbm-card-quantity_select { max-width: 480px; overflow: hidden !important; }
        .sbm-card-select {
          max-width: 1320px;
          width: 96vw;
          max-height: 96vh !important;
          height: 96vh;
          display: flex;
          flex-direction: column;
          overflow: hidden !important;
        }
        .sbm-card-select .sbm-header { flex-shrink: 0; }
        .sbm-card-select .sbm-warning-toast { flex-shrink: 0; }
        .sbm-card-select .sbm-body {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .sbm-card-select .sbm-left {
          overflow-y: auto;
          min-height: 0;
        }
        .sbm-card-select .sbm-right {
          overflow-y: auto;
          min-height: 0;
        }
        .sbm-card-attendee_details { max-width: 520px; }
        .sbm-card-payment { max-width: 860px; }
        .sbm-card-success { max-width: 760px; }

        /* ── Booker Info Step ─────────────────────────────────────── */
        .booker-info-container {
          overflow: hidden;
          border-radius: 20px;
        }

        .booker-img-header {
          position: relative;
          width: 100%;
          height: auto;
          overflow: hidden;
          background: #f3f4f6;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
        }

        .booker-header-img {
          width: 100%;
          height: auto;
          object-fit: contain;
          display: block;
        }

        .booker-title-under {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          color: #111827;
          text-align: center;
          margin-bottom: 1.25rem;
          margin-top: 0.25rem;
        }

        .booker-form-body {
          padding: 1.25rem 1.5rem 1.25rem;
        }

        .booker-scroll-btn-wrap {
          position: sticky;
          bottom: 1rem;
          left: 0;
          right: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          pointer-events: none;
          z-index: 50;
        }

        .booker-scroll-btn {
          pointer-events: auto;
          background: rgba(16, 185, 129, 0.95);
          color: white;
          padding: 8px 16px;
          border-radius: 999px;
          border: none;
          font-size: 0.8rem;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          backdrop-filter: blur(4px);
        }

        .booker-scroll-btn:hover {
          background: rgba(5, 150, 105, 1);
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(5, 150, 105, 0.45);
        }

        .animate-bounce {
          animation: bounce 2s infinite;
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        .booker-error-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 10px;
          margin-bottom: 1.25rem;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .animate-shake-x {
          animation: shakeX 0.4s ease;
        }

        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-7px); }
          40%, 80% { transform: translateX(7px); }
        }

        .booker-form {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
        }

        .member-id-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          color: white;
          background: #10b981;
          border-radius: 999px;
          padding: 1px 8px;
          margin-left: 0.5rem;
          letter-spacing: 0.02em;
          vertical-align: middle;
        }

        .member-id-wrap .input-field-icon {
          font-size: 1.1rem;
        }

        .member-id-input {
          font-family: 'Courier New', 'Consolas', monospace !important;
          letter-spacing: 0.22em !important;
          font-weight: 800 !important;
          font-size: 1.15rem !important;
          text-transform: uppercase !important;
          color: #065f46 !important;
        }

        .member-id-pips {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
          padding-left: 2px;
        }

        .char-pip {
          width: 30px;
          height: 5px;
          border-radius: 999px;
          background: #e5e7eb;
          transition: background 0.18s ease, transform 0.18s ease;
          flex-shrink: 0;
        }

        .char-pip-filled {
          background: linear-gradient(90deg, #10b981, #34d399);
          transform: scaleY(1.3);
        }

        .pips-count {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--muted);
          margin-left: 4px;
          font-family: 'Courier New', monospace;
        }

        .booker-submit-btn {
          background: linear-gradient(135deg, #059669, #10b981) !important;
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.45) !important;
          animation: bookerBtnPulse 2.5s ease-in-out infinite;
          border: none !important;
        }

        .booker-submit-btn:hover {
          background: linear-gradient(135deg, #047857, #059669) !important;
          box-shadow: 0 8px 32px rgba(5, 150, 105, 0.6) !important;
          animation: none;
        }

        @keyframes bookerBtnPulse {
          0%, 100% { box-shadow: 0 6px 24px rgba(16, 185, 129, 0.45); }
          50% { box-shadow: 0 8px 36px rgba(16, 185, 129, 0.7); }
        }

        .booker-info-note {
          text-align: center;
          font-size: 0.78rem;
          color: var(--muted);
          margin-top: 1.35rem;
          padding-top: 1rem;
          border-top: 1px solid #f3f4f6;
          line-height: 1.5;
        }

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
            grid-template-columns: 1.35fr 1fr;
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
          gap: 10px;
          overflow-x: auto;
          overflow-y: auto;
          max-height: min(520px, calc(90vh - 280px));
          padding: 1.25rem 0.75rem;
          background: #f8fafc;
          border-radius: 14px;
          border: 1px dashed #cbd5e1;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .seat-map-wrapper::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .seat-map-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 99px;
        }
        .seat-map-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }

        .seat-row-group {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: max-content;
        }

        .row-label {
          width: 24px;
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          text-align: center;
          flex-shrink: 0;
        }

        .seat-row {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
        }

        /* ─── Professional Theater Seat Styling ────────────────────────── */
        .sbm-seat {
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 6px 6px 2px 2px;
          border: 1.5px solid;
          font-size: 0.62rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1.5px 3px rgba(0,0,0,0.06);
        }

        /* Cushion / back support effect */
        .sbm-seat::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 4px;
          right: 4px;
          height: 6px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.25);
          pointer-events: none;
        }
        
        /* Seat armrest effects */
        .sbm-seat::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 2px;
          right: 2px;
          height: 4px;
          border-radius: 1px;
          background: rgba(0, 0, 0, 0.08);
          pointer-events: none;
        }

        @media (max-width: 480px) {
          .sbm-seat { width: 25px; height: 25px; font-size: 0.55rem; border-width: 1px; }
          .sbm-seat::before { top: 1.5px; left: 3px; right: 3px; height: 5px; }
          .sbm-seat::after { bottom: 1.5px; left: 1.5px; right: 1.5px; height: 3px; }
          .seat-row { gap: 6px; }
        }

        .seat-available {
          background: linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%);
          border-color: #10b981;
          color: #047857;
        }
        .seat-available::before {
          background: rgba(16, 185, 129, 0.08);
        }
        .seat-available:hover:not(:disabled) {
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-color: #047857;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25);
        }
        .seat-available:hover:not(:disabled)::before {
          background: rgba(255, 255, 255, 0.3);
        }

        .seat-selected {
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-color: #047857;
          color: white;
          transform: scale(1.06);
          box-shadow: 0 3px 8px rgba(16, 185, 129, 0.4);
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
          box-sizing: border-box;
          min-height: 48px;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          display: block;
          text-align: center;
          line-height: 1.4;
          overflow: visible;
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

        /* Back Button */
        .sbm-back-btn {
          width: 100%;
          min-height: 44px;
          padding: 0.75rem 1rem;
          background: #f8fafc;
          color: #475569;
          border: 1.5px solid #cbd5e1;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sbm-back-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
          border-color: #94a3b8;
        }

        /* Confirm Button */
        .sbm-confirm-btn {
          width: 100%;
          min-height: 48px;
          padding: 0.875rem 1rem;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sbm-confirm-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        .sbm-confirm-btn:disabled {
          background: #cbd5db;
          color: #94a3b8;
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

        /* UTR Input Section */
        .utr-section {
          background: #ffffff;
          border: 1.5px solid #a7f3d0;
          border-radius: 14px;
          padding: 1.35rem;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06);
        }

        .utr-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #047857;
          margin-bottom: 0.55rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .upload-required-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid #fde68a;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-left: 6px;
          vertical-align: middle;
        }

        .utr-desc {
          font-size: 0.82rem;
          color: #6b7280;
          margin-bottom: 1rem;
          line-height: 1.55;
        }

        .utr-desc strong {
          color: #111827;
        }

        .utr-input-wrap {
          display: flex;
          align-items: center;
          border: 2px solid #d1d5db;
          border-radius: 10px;
          padding: 0 0.85rem;
          background: #f9fafb;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .utr-input-wrap:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
          background: #fff;
        }

        .utr-input-icon {
          font-size: 1.2rem;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }

        .utr-input-field {
          width: 100%;
          height: 48px;
          border: none;
          background: transparent;
          font-size: 1.05rem;
          font-weight: 700;
          color: #111827;
          outline: none;
          letter-spacing: 0.08em;
          font-family: 'Courier New', Courier, monospace;
        }

        .utr-input-field::placeholder {
          font-family: inherit;
          letter-spacing: normal;
          font-weight: 400;
          color: #9ca3af;
          font-size: 0.85rem;
        }

        .utr-pips {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 0.6rem;
        }

        .utr-error-text {
          display: block;
          margin-top: 0.6rem;
          font-size: 0.78rem;
          color: #b91c1c;
          font-weight: 600;
        }

        .utr-valid-badge {
          margin-top: 0.6rem;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #047857;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 6px 12px;
          border-radius: 8px;
          text-align: center;
        }

        .payment-right-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Professional event image in payment panel */
        .payment-event-img-wrap {
          width: 100%;
          border-radius: 14px;
          overflow: hidden;
          background: #f0fdf4;
          border: 1.5px solid #a7f3d0;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.1);
          flex-shrink: 0;
          aspect-ratio: 16 / 9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payment-event-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 12px;
        }

        .qr-container-box {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          border-radius: 16px;
          padding: 1.75rem 1.25rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
          box-sizing: border-box;
        }

        .qr-image-wrap {
          background: white;
          padding: 14px;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.15);
          border: 2px solid #6ee7b7;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 320px;
          aspect-ratio: 1 / 1;
          margin: 0 auto;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .payment-qr-img {
          width: 100% !important;
          height: 100% !important;
          max-width: 290px;
          max-height: 290px;
          object-fit: contain !important;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
          display: block;
          margin: 0 auto;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .payment-qr-img:hover {
          transform: scale(1.05);
        }

        .qr-pay-caption {
          font-size: 0.85rem;
          font-weight: 700;
          color: #047857;
          text-align: center;
        }

        .upi-details-card {
          background: #ffffff;
          border: 1px solid #a7f3d0;
          border-radius: 14px;
          padding: 1.25rem;
          font-size: 0.88rem;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.04);
        }

        .upi-details-title {
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #065f46;
          letter-spacing: 0.05em;
          border-bottom: 1.5px solid #ecfdf5;
          padding-bottom: 0.6rem;
          margin-bottom: 0.85rem;
        }

        .upi-detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 0;
          color: #374151;
          gap: 1rem;
        }

        .upi-label {
          color: #6b7280;
          font-weight: 500;
          flex-shrink: 0;
        }

        .upi-value {
          color: #111827;
          font-weight: 700;
          text-align: right;
        }

        .upi-id-value {
          word-break: break-all;
          font-family: monospace;
          font-size: 0.85rem;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          color: #1f2937;
        }

        /* ── Success / Confirmation Step ───────────────────────── */
        .success-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem 1.75rem 2rem;
          gap: 0;
          width: 100%;
          box-sizing: border-box;
          animation: successSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        @keyframes successSlideIn {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }

        /* Hero banner */
        .success-hero-banner {
          width: 100%;
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 60%, #d1fae5 100%);
          border: 2px solid #a7f3d0;
          border-radius: 18px;
          padding: 2rem 1.5rem 1.75rem;
          text-align: center;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        /* Animated rings around check */
        .success-anim-container {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 1.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success-ring {
          position: absolute;
          border-radius: 50%;
          border: 2.5px solid #10b981;
          animation: ringPulse 2.4s ease-out infinite;
        }
        .success-ring.ring-outer { width: 100px; height: 100px; opacity: 0.15; animation-delay: 0s; }
        .success-ring.ring-mid   { width: 80px;  height: 80px;  opacity: 0.25; animation-delay: 0.4s; }
        .success-ring.ring-inner { width: 64px;  height: 64px;  opacity: 0.4;  animation-delay: 0.8s; }

        @keyframes ringPulse {
          0%   { transform: scale(0.85); opacity: 0.4; }
          50%  { transform: scale(1);    opacity: 0.15; }
          100% { transform: scale(0.85); opacity: 0.4; }
        }

        .success-check-wrap {
          width: 64px;
          height: 64px;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
          z-index: 1;
          animation: checkBounceIn 0.65s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.45);
        }

        @keyframes checkBounceIn {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        .success-title {
          font-size: 1.55rem;
          font-weight: 900;
          color: #065f46;
          margin: 0 0 0.4rem;
          letter-spacing: -0.01em;
        }

        .success-sub {
          font-size: 0.9rem;
          color: #374151;
          margin: 0 0 1rem;
          line-height: 1.5;
        }

        .booking-id-display {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: 2.5px;
          color: #10b981;
          background: #ffffff;
          border: 2px solid #a7f3d0;
          padding: 0.5rem 1.5rem;
          border-radius: 10px;
          display: inline-block;
          margin-bottom: 0.55rem;
          margin-top: 0.25rem;
          font-family: 'Courier New', monospace;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.15);
        }

        /* Pulsing Awaiting badge */
        .approval-waiting-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #fff7ed;
          border: 1.5px solid #fed7aa;
          color: #92400e;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          margin-top: 0.25rem;
          margin-bottom: 0.85rem;
          letter-spacing: 0.02em;
          animation: badgePop 0.5s 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes badgePop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        .waiting-pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #f97316;
          animation: dotPulse 1.2s ease-in-out infinite;
          flex-shrink: 0;
        }

        @keyframes dotPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.7); }
        }

        .admin-sent-notice {
          font-size: 0.82rem;
          color: #047857;
          background: #d1fae5;
          border: 1px solid #a7f3d0;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          display: inline-block;
          font-weight: 600;
        }

        /* ── Booking Summary Card (bsc) ── */
        .bsc-card {
          width: 100%;
          background: #ffffff;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 1.25rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.07);
          animation: successSlideIn 0.7s 0.15s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .bsc-header-bar {
          background: linear-gradient(90deg, #065f46 0%, #047857 100%);
          color: white;
          padding: 0.85rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .bsc-title {
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        .bsc-status-pill {
          font-size: 0.78rem;
          font-weight: 700;
          background: rgba(255,255,255,0.18);
          border: 1.5px solid rgba(255,255,255,0.35);
          padding: 3px 12px;
          border-radius: 999px;
          letter-spacing: 0.03em;
        }

        /* Top grid: QR left, info right */
        .bsc-top-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        @media (min-width: 580px) {
          .bsc-top-grid {
            flex-direction: row;
            align-items: flex-start;
          }
        }

        .bsc-qr-block {
          background: linear-gradient(150deg, #f0fdf4 0%, #dcfce7 100%);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
          border-right: 2px dashed #a7f3d0;
          min-width: 160px;
        }

        .bsc-qr-img {
          width: 140px;
          height: 140px;
          border-radius: 10px;
          border: 3px solid #10b981;
          box-shadow: 0 4px 12px rgba(16,185,129,0.2);
        }

        .bsc-qr-placeholder {
          width: 140px;
          height: 140px;
          background: #f3f4f6;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #9ca3af;
        }

        .bsc-qr-caption {
          font-size: 0.7rem;
          color: #047857;
          font-weight: 600;
          text-align: center;
        }

        .bsc-right-block {
          flex: 1;
          padding: 1.25rem 1.5rem;
        }

        .bsc-group-label {
          font-size: 0.7rem;
          color: #6b7280;
          text-align: left;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 0.2rem 0;
          border-bottom: 1px solid #f3f4f6;
          margin-bottom: 0.5rem;
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

        /* Attendee Details Step styles */
        .attendee-container {
          padding: 2.25rem 2rem;
        }

        .attendee-progress-box {
          margin-bottom: 1.5rem;
          background: #f0fdf4;
          padding: 0.85rem;
          border-radius: 10px;
          border: 1px solid #bbf7d0;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }

        .progress-fraction {
          color: #059669;
          font-weight: 700;
        }

        .progress-track-bar {
          background: #e2e8f0;
          height: 8px;
          border-radius: 999px;
          overflow: hidden;
        }

        .progress-fill {
          background: #10b981;
          height: 100%;
          border-radius: 999px;
          transition: width 0.35s ease;
        }

        .attendee-fields-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-input-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .input-field-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: #475569;
        }

        .input-readonly-wrap,
        .input-field-wrap {
          display: flex;
          align-items: center;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 0.75rem;
          background: #ffffff;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .input-readonly-wrap {
          background: #f8fafc;
        }

        .input-field-wrap:focus-within {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .input-field-icon {
          font-size: 1.1rem;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }

        .readonly-input,
        .text-input-field {
          width: 100%;
          height: 42px;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          color: #1e293b;
          outline: none;
        }

        .readonly-input {
          cursor: not-allowed;
          font-weight: 500;
        }

        .text-input-field {
          font-weight: 600;
        }

        .attendee-form-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        @keyframes slideInForm {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-in-form {
          animation: slideInForm 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* ── Approval Notification Toast ──────────────────────────── */
        .approval-notification-toast {
          position: sticky;
          top: 0.75rem;
          left: 0;
          right: 0;
          z-index: 200;
          margin: 0.75rem 1rem 0;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
          padding: 1rem 1.15rem;
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          animation: toastSlideIn 0.4s cubic-bezier(0.16,1,0.3,1);
        }

        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .toast-approved {
          background: linear-gradient(135deg, #ecfdf5, #d1fae5);
          border: 1.5px solid #6ee7b7;
        }

        .toast-denied {
          background: linear-gradient(135deg, #fff1f2, #ffe4e6);
          border: 1.5px solid #fca5a5;
        }

        .toast-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          line-height: 1;
        }

        .toast-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .toast-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: #111827;
        }

        .toast-approved .toast-title { color: #065f46; }
        .toast-denied  .toast-title { color: #991b1b; }

        .toast-msg {
          font-size: 0.82rem;
          color: #374151;
          line-height: 1.5;
        }

        .toast-close-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
        }
        .toast-close-btn:hover { background: rgba(0,0,0,0.06); }

        /* proof-required-notice (second definition — kept for specificity) */

        /* Live verification loader inside success banner */
        .live-verification-loader {
          margin-top: 1.25rem;
          width: 100%;
          max-width: 320px;
          margin-left: auto;
          margin-right: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .loader-line-track {
          height: 5px;
          background: rgba(0, 0, 0, 0.06);
          border-radius: 99px;
          overflow: hidden;
          position: relative;
        }

        .loader-line-fill {
          height: 100%;
          width: 40%;
          background: #f97316;
          border-radius: 99px;
          position: absolute;
          animation: slideLoaderFill 1.8s infinite ease-in-out;
        }

        @keyframes slideLoaderFill {
          0% { left: -40%; }
          100% { left: 100%; }
        }

        .loader-status-text {
          font-size: 0.78rem;
          font-weight: 700;
          color: #d97706;
          text-align: center;
        }

        .blink-text {
          animation: blinkTextAnim 1.4s infinite alternate;
        }

        @keyframes blinkTextAnim {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }

        /* Approved celebration elements */
        .ring-outer-green { border-color: #10b981 !important; }
        .ring-mid-green { border-color: #34d399 !important; }
        .ring-inner-green { border-color: #6ee7b7 !important; }
        
        .approved-check {
          background: #10b981 !important;
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.45) !important;
        }

        .status-approved-banner {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
          border-color: #34d399 !important;
        }

        .approval-success-badge {
          display: inline-flex;
          align-items: center;
          background: #dcfce7;
          border: 1.5px solid #86efac;
          color: #14532d;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          margin-bottom: 0.85rem;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
        }

        /* Denied error elements */
        .denied-error {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .error-circle-wrap {
          width: 64px;
          height: 64px;
          background: #ef4444;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 6px 24px rgba(239, 68, 68, 0.4);
          animation: errorShake 0.6s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes errorShake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .status-denied-banner {
          background: linear-gradient(135deg, #fff5f5 0%, #fee2e2 100%) !important;
          border-color: #fca5a5 !important;
        }

        .approval-failed-badge {
          display: inline-flex;
          align-items: center;
          background: #fee2e2;
          border: 1.5px solid #fecaca;
          color: #7f1d1d;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 0.45rem 1.1rem;
          border-radius: 999px;
          margin-bottom: 0.85rem;
          letter-spacing: 0.02em;
        }

        .animate-pop-in {
          animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }

        @keyframes popIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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
