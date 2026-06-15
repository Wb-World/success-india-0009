'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Search, ShieldCheck, CheckCircle2, ChevronRight, Upload, AlertCircle, Clock, Lock } from 'lucide-react';

const fallbackLocations = [
  'Chromepet, Chennai',
  'Chennai Central Region',
  'South Chennai',
  'Tambaram',
  'Pallavaram',
  'Tamil Nadu Chapter Network',
];

const fallbackEventCategories = [
  'Leadership Development Seminars',
  'Weekly Income-Generation Systems',
  'BOSS Agro Hub Chapter Meetups',
  'Digital Marketing & Direct-Selling Workshops',
];

export default function BookPage() {
  return (
    <Suspense fallback={<div className="loading-fallback">Loading booking engine...</div>}>
      <BookingEngine />
    </Suspense>
  );
}

function BookingEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search parameters states
  const [venue, setVenue] = useState('Chromepet, Chennai');
  const [seminar, setSeminar] = useState('Leadership Development Seminars');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });

  // Flow control states
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [loadingSeminars, setLoadingSeminars] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected seminar and schedule states
  const [selectedSeminar, setSelectedSeminar] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Checkout and payment states
  const [bookingStep, setBookingStep] = useState<'search' | 'seats' | 'payment' | 'success'>('search');
  const [screenshot, setScreenshot] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }

    initializeBookingSearch();
  }, [searchParams]);

  const initializeBookingSearch = async () => {
    const sParam = searchParams.get('venue') || searchParams.get('source');
    const dParam = searchParams.get('seminar') || searchParams.get('destination');
    const tParam = searchParams.get('date');
    const eParam = searchParams.get('eventId');

    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      const fetchedEvents = res.ok ? (data.events || []).map((event: any) => ({
        ...event,
        legacySource: event.venue,
        legacyDestination: event.title,
      })) : [];
      setEvents(fetchedEvents);

      const matchedEvent = eParam
        ? fetchedEvents.find((event: any) => event.id === eParam)
        : fetchedEvents.find((event: any) =>
            (!sParam || event.venue === sParam || event.legacySource === sParam) &&
            (!dParam || event.title === dParam || event.legacyDestination === dParam)
          );

      const resolvedVenue = sParam || matchedEvent?.venue || matchedEvent?.legacySource || venue;
      const resolvedSeminar = dParam || matchedEvent?.title || matchedEvent?.legacyDestination || seminar;
      const resolvedDate = tParam || matchedEvent?.eventDate || date;
      const resolvedEventId = eParam || matchedEvent?.id || '';

      setVenue(resolvedVenue);
      setSeminar(resolvedSeminar);
      setDate(resolvedDate);
      setSelectedEventId(resolvedEventId);

      if (resolvedEventId || (sParam && dParam && resolvedDate)) {
        handleSearchSeminars(resolvedVenue, resolvedSeminar, resolvedDate, resolvedEventId);
      }
    } catch (error) {
      console.error('Unable to initialize seminar events:', error);
      if (sParam) setVenue(sParam);
      if (dParam) setSeminar(dParam);
      if (tParam) setDate(tParam);
      if (sParam && dParam && tParam) {
        handleSearchSeminars(sParam, dParam, tParam, eParam || '');
      }
    }
  };

  const handleEventSelect = (eventIdOrTitle: string) => {
    const event = events.find((item) => item.id === eventIdOrTitle);
    if (!event) {
      setSelectedEventId('');
      setSeminar(eventIdOrTitle);
      return;
    }

    setSelectedEventId(event.id);
    setVenue(event.venue || event.legacySource || venue);
    setSeminar(event.title || event.legacyDestination || seminar);
    if (event.eventDate) setDate(event.eventDate);
  };

  const handleLocationSelect = (location: string) => {
    setVenue(location);
    const firstMatchingEvent = events.find((event) => (event.venue || event.legacySource) === location);
    if (firstMatchingEvent) {
      setSelectedEventId(firstMatchingEvent.id);
      setSeminar(firstMatchingEvent.title || firstMatchingEvent.legacyDestination || seminar);
      if (firstMatchingEvent.eventDate) setDate(firstMatchingEvent.eventDate);
    } else {
      setSelectedEventId('');
    }
  };

  const eventLocations = events.length
    ? Array.from(new Set(events.map((event) => event.venue || event.legacySource).filter(Boolean))) as string[]
    : fallbackLocations;

  const eventOptions = events.length
    ? events.filter((event) => (event.venue || event.legacySource) === venue)
    : [];

  const handleSearchSeminars = async (venueVal = venue, seminarVal = seminar, dateVal = date, eventIdVal = selectedEventId) => {
    if (venueVal === seminarVal) {
      setErrorMsg('Please choose a valid seminar location and category.');
      return;
    }
    setErrorMsg('');
    setLoadingSeminars(true);
    setSearchTriggered(true);
    setSelectedSeminar(null);
    setSelectedSeats([]);

    try {
      const eventParam = eventIdVal ? `&eventId=${encodeURIComponent(eventIdVal)}` : '';
      const res = await fetch(`/api/events?venue=${encodeURIComponent(venueVal)}&seminar=${encodeURIComponent(seminarVal)}&date=${encodeURIComponent(dateVal)}${eventParam}`);
      const data = await res.json();
      if (res.ok) {
        const fetchedSeminars = (data.events || data.seminars || []).map((event: any) => ({
          ...event,
          legacySource: event.venue,
          legacyDestination: event.title,
        }));
        setSeminars(fetchedSeminars);
      } else {
        setErrorMsg(data.error || 'Failed to fetch seminar listings');
      }
    } catch (err) {
      setErrorMsg('A connection error occurred while searching seminars.');
    } finally {
      setLoadingSeminars(false);
    }
  };

  const handleSeminarSelect = (seminarEvent: any) => {
    setSelectedSeminar(seminarEvent);
    const firstTime = seminarEvent.times?.[0] || seminarEvent.eventTime || '10:00 AM';
    setSelectedTime(firstTime);
    setBookedSeats(seminarEvent.bookedSeatsByTime?.[firstTime] || []);
    setSelectedSeats([]);
    setBookingStep('seats');
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    setBookedSeats(selectedSeminar.bookedSeatsByTime[time] || []);
    setSelectedSeats([]);
  };

  const getActiveSessionUser = () => {
    if (user?.id) return user;

    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;

    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) {
        setUser(parsed);
        return parsed;
      }
    } catch (e) {
      localStorage.removeItem('user');
    }

    return null;
  };

  const requireBookingAuth = () => {
    if (getActiveSessionUser()) return true;

    setPaymentError('Authentication Required: Please login to your Success India account to book seminar seats.');
    setAuthModalOpen(true);
    return false;
  };

  const redirectToLoginWithCallback = () => {
    const callbackUrl = `${window.location.pathname}${window.location.search}`;
    setAuthModalOpen(false);
    router.push(`/profile?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  const handleSeatClick = (seatId: string) => {
    if (!requireBookingAuth()) return;
    if (bookedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 6) {
        setPaymentError('Maximum of 6 seats can be reserved per transaction.');
        return;
      }
      setPaymentError('');
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Convert uploaded image to base64
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentError('');
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitBookingRequest = async () => {
    const sessionUser = getActiveSessionUser();
    if (!sessionUser) {
      setPaymentError('Authentication Required: Please login to your Success India account to book seminar seats.');
      setAuthModalOpen(true);
      return;
    }

    if (!screenshot) {
      setPaymentError('Please upload your UPI payment receipt screenshot before verification.');
      return;
    }
    setPaymentError('');
    setSubmittingBooking(true);

    try {
      const payload = {
        eventId: selectedSeminar.id,
        eventName: selectedSeminar.name,
        seminarId: selectedSeminar.id,
        seminarName: selectedSeminar.name,
        venue: selectedSeminar.venue || selectedSeminar.legacySource,
        seminar: selectedSeminar.title || selectedSeminar.legacyDestination,
        date,
        time: selectedTime,
        seats: selectedSeats,
        totalPrice: selectedSeats.length * selectedSeminar.price,
        screenshot,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': sessionUser.id,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBookedSeats((prev) => Array.from(new Set([...prev, ...selectedSeats])));
        setBookingStep('success');
      } else {
        const data = await res.json();
        setPaymentError(data.error || 'We could not confirm your booking yet. Please try again in a moment.');
      }
    } catch (e) {
      setPaymentError('Connection error while submitting your booking. Please check your network and try again.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const eventSeats = Array.from({ length: 60 }, (_, index) => `S${index + 1}`);

  const totalPrice = selectedSeats.length * (selectedSeminar?.price || 0);

  return (
    <div className="booking-page container animate-fade-in">
      
      {/* Timeline Steps */}
      <div className="booking-steps-timeline animate-slide-down">
        <div className={`step-node ${bookingStep === 'search' ? 'active' : ''} ${selectedSeminar ? 'completed' : ''}`} onClick={() => setBookingStep('search')}>
          <span className="step-num">{selectedSeminar ? '✓' : '1'}</span>
          <span className="step-txt">Search Seminars</span>
        </div>
        <ChevronRight size={16} className="timeline-arrow" />
        <div className={`step-node ${bookingStep === 'seats' ? 'active' : ''} ${bookingStep === 'payment' || bookingStep === 'success' ? 'completed' : ''}`} onClick={() => { if (selectedSeminar) setBookingStep('seats'); }}>
          <span className="step-num">{bookingStep === 'payment' || bookingStep === 'success' ? '✓' : '2'}</span>
          <span className="step-txt">Select Seats</span>
        </div>
        <ChevronRight size={16} className="timeline-arrow" />
        <div className={`step-node ${bookingStep === 'payment' ? 'active' : ''} ${bookingStep === 'success' ? 'completed' : ''}`}>
          <span className="step-num">{bookingStep === 'success' ? '✓' : '3'}</span>
          <span className="step-txt">Upload UPI Receipt</span>
        </div>
      </div>

      {errorMsg && (
        <div className="error-alert animate-shake">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* STEP 1: SEMINAR SEARCH AND EVENT SELECTION */}
      {bookingStep === 'search' && (
        <div className="search-step-layout">
          <div className="search-bar-widget glass-card animate-slide-up">
            <form onSubmit={(e) => { e.preventDefault(); handleSearchSeminars(); }} className="search-form-inline">
              <div className="inline-group">
                <label className="inline-label">Location</label>
                <select value={venue} onChange={(e) => handleLocationSelect(e.target.value)} className="form-control select-control">
                  {eventLocations.map((location) => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
              <div className="inline-group">
                <label className="inline-label">Seminar Event</label>
                <select value={selectedEventId || seminar} onChange={(e) => handleEventSelect(e.target.value)} className="form-control select-control">
                  {eventOptions.length > 0 ? (
                    eventOptions.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title || event.name} • ₹{event.price}
                      </option>
                    ))
                  ) : (
                    fallbackEventCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="inline-group">
                <label className="inline-label">Seminar Date</label>
                <input 
                  type="date" 
                  value={date} 
                  min={new Date().toISOString().split('T')[0]} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="form-control date-control"
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary search-submit-btn">
                <Search size={16} /> Find Seminars
              </button>
            </form>
          </div>

          <div className="search-results-section">
            {loadingSeminars ? (
              <div className="spinner-center">
                <div className="spinner"></div>
                <p>Loading scheduled seminar sessions...</p>
              </div>
            ) : seminars.length === 0 ? (
              searchTriggered ? (
                <div className="empty-results glass-card animate-scale-in">
                  <AlertCircle size={40} className="empty-icon" />
                  <h3 className="heading-sm">No Seminar Scheduled</h3>
                  <p>There are no listed {seminar} sessions at {venue} on {date}. Modify your location, seminar, or date filters.</p>
                </div>
              ) : (
                <div className="welcome-search-callout glass-card animate-scale-in">
                  <MapPin size={40} className="callout-icon" />
                  <h3 className="heading-sm">Plan Your Seminar Visit</h3>
                  <p>Select a location, seminar category, and date above to view available sessions and reserve seats.</p>
                </div>
              )
            ) : (
              <div className="seminars-list animate-slide-up">
                <h3 className="heading-sm list-title">Available Seminar Sessions for {date}</h3>
                {seminars.map((seminarEvent) => (
                  <div key={seminarEvent.id} className="seminar-card-item hover-glow-card">
                    <div className="seminar-card-main">
                      <div className="seminar-company">
                        <span className="seminar-name-txt">{seminarEvent.name}</span>
                        <div className="seminar-badge-row">
                          <span className="seminar-type-badge">{seminarEvent.type}</span>
                          <span className="event-status-badge">{seminarEvent.status || 'Available to Register'}</span>
                        </div>
                      </div>
                      
                      <div className="seminar-timeline">
                        <div className="timeline-node">
                          <span className="timeline-city">{seminarEvent.venue || seminarEvent.legacySource}</span>
                        </div>
                        <div className="timeline-connector">
                          <span className="timeline-duration">{seminarEvent.duration}</span>
                          <hr className="connector-line" />
                        </div>
                        <div className="timeline-node">
                          <span className="timeline-city">{seminarEvent.title || seminarEvent.legacyDestination}</span>
                        </div>
                      </div>

                      <div className="seminar-pricing">
                        <span className="price-label">Seat Fee</span>
                        <span className="price-value">₹{seminarEvent.price} <span className="seat-label">/ seat</span></span>
                      </div>

                      <button onClick={() => handleSeminarSelect(seminarEvent)} className="btn btn-primary select-seminar-btn">
                        Reserve Seats
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2-4: EVENT SEAT GRID WITH DYNAMIC PAYMENT BOX */}
      {(bookingStep === 'seats' || bookingStep === 'payment' || bookingStep === 'success') && selectedSeminar && (
        <div className="reservation-workspace animate-slide-up">
          <section className="event-seat-panel glass-card">
            <div className="seat-panel-header">
              <div>
                <span className="panel-kicker">Interactive Seat Grid</span>
                <h2 className="heading-md">Select Event Seats</h2>
              </div>
              <div className="seat-legend">
                <span><i className="legend-dot available-dot"></i>Available</span>
                <span><i className="legend-dot selected-dot"></i>Selected</span>
                <span><i className="legend-dot booked-dot"></i>Booked</span>
              </div>
            </div>

            <div className="session-strip">
              <div>
                <span className="strip-label">Program</span>
                <strong>{selectedSeminar.name}</strong>
              </div>
              <div>
                <span className="strip-label">Date</span>
                <strong>{date}</strong>
              </div>
              <div>
                <span className="strip-label">Session Time</span>
                <div className="compact-time-chips">
                  {selectedSeminar.times.map((time: string) => (
                    <button
                      key={time}
                      onClick={() => handleTimeChange(time)}
                      className={`compact-time-chip ${selectedTime === time ? 'active' : ''}`}
                      disabled={bookingStep === 'success'}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="event-seat-grid" aria-label="60 event seat selection grid">
              {eventSeats.map((seatId) => {
                const isBooked = bookedSeats.includes(seatId);
                const isSelected = selectedSeats.includes(seatId);
                return (
                  <button
                    key={seatId}
                    type="button"
                    onClick={() => handleSeatClick(seatId)}
                    className={`event-seat ${isSelected ? 'selected' : ''} ${isBooked ? 'booked' : ''}`}
                    title={`Seat ${seatId} (${isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'})`}
                    disabled={isBooked || bookingStep === 'success'}
                  >
                    {seatId}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className={`reservation-state-card glass-card ${bookingStep === 'success' ? 'success-state' : ''}`}>
            {bookingStep === 'seats' && selectedSeats.length === 0 && (
              <div className="state-content greeting-state animate-fade-in">
                <div className="state-icon-wrap">
                  <CheckCircle2 size={28} />
                </div>
                <span className="panel-kicker">Welcome</span>
                <h2 className="heading-md">Welcome to Success India!</h2>
                <p>Please select your preferred seats from the layout to proceed with your registration.</p>
                <button onClick={() => setBookingStep('search')} className="btn btn-secondary state-secondary-btn">
                  Change Seminar
                </button>
              </div>
            )}

            {bookingStep === 'seats' && selectedSeats.length > 0 && (
              <div className="state-content summary-state animate-fade-in">
                <span className="panel-kicker">Seat Summary</span>
                <h2 className="heading-md">Review Your Reservation</h2>
                {!user && (
                  <div className="auth-hint-badge">
                    <Lock size={14} />
                    <span>Log in to reserve your seat</span>
                  </div>
                )}
                <div className="summary-box">
                  <span className="summary-label">Selected Seats</span>
                  <div className="selected-seats-list">
                    {selectedSeats.map((seat) => (
                      <span key={seat} className="seat-summary-tag">{seat}</span>
                    ))}
                  </div>
                </div>
                <div className="summary-total-row">
                  <span>Total Registration Fee</span>
                  <strong>₹{totalPrice}</strong>
                </div>
                <button
                  onClick={() => {
                    if (requireBookingAuth()) setBookingStep('payment');
                  }}
                  className="btn btn-primary state-primary-btn"
                >
                  {!user && <Lock size={16} />} Proceed to UPI Payment
                </button>
              </div>
            )}

            {bookingStep === 'payment' && (
              <div className="state-content payment-state animate-fade-in">
                <span className="panel-kicker">UPI Payment</span>
                <h2 className="heading-md">Scan to Pay</h2>
                <div className="dummy-qr-box">
                  <div className="qr-grid-mark">
                    <span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span>
                    <span></span><span></span><span></span><span></span>
                  </div>
                  <strong>Scan to Pay</strong>
                  <small>Amount: ₹{totalPrice}</small>
                </div>
                <label className="receipt-upload-box">
                  <Upload size={24} />
                  <span>Upload UPI Payment Receipt / Screenshot</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="hidden-file-input"
                  />
                </label>
                {screenshotName && <span className="file-name-inline">{screenshotName}</span>}
                {paymentError && (
                  <div className="payment-inline-error">
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                  </div>
                )}
                <button
                  onClick={submitBookingRequest}
                  className="btn btn-primary state-primary-btn"
                  disabled={!screenshot || submittingBooking}
                >
                  {submittingBooking ? 'Verifying Receipt...' : 'Verify Receipt & Confirm Booking'}
                </button>
                <button onClick={() => setBookingStep('seats')} className="btn btn-secondary state-secondary-btn">
                  Back to Seat Summary
                </button>
              </div>
            )}

            {bookingStep === 'success' && (
              <div className="state-content success-message-state animate-scale-in">
                <CheckCircle2 size={58} className="success-check-icon" />
                <h2 className="heading-md">Congratulations!</h2>
                <p>Your booking is successful. We look forward to seeing you at the event!</p>
                <div className="success-seat-list">
                  {selectedSeats.map((seat) => (
                    <span key={seat}>{seat}</span>
                  ))}
                </div>
                <button onClick={() => router.push('/profile')} className="btn btn-primary state-primary-btn">
                  View My Seminar Bookings
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {authModalOpen && (
        <div className="auth-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <div className="auth-modal-card animate-scale-in">
            <div className="auth-modal-icon">
              <Lock size={28} />
            </div>
            <h2 id="auth-modal-title" className="heading-md">Authentication Required</h2>
            <p>Please login to your Success India account to book seminar seats.</p>
            <div className="auth-modal-actions">
              <button onClick={redirectToLoginWithCallback} className="btn btn-secondary">
                Close
              </button>
              <button onClick={redirectToLoginWithCallback} className="btn btn-primary">
                Login to Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Styled JSX Styles */}
      <style jsx>{`
        .booking-page {
          padding: 3rem 1.5rem 6rem 1.5rem;
          max-width: 1100px;
        }

        .loading-fallback {
          padding: 10rem 0;
          text-align: center;
          font-weight: 500;
          color: var(--muted);
        }

        /* Timeline */
        .booking-steps-timeline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .step-node {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--muted-light);
          cursor: not-allowed;
          user-select: none;
        }

        .step-node.active, .step-node.completed {
          color: var(--primary-dark);
          cursor: pointer;
        }

        .step-node.active {
          font-weight: 700;
        }

        .step-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--input);
          border: 1px solid var(--border);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--muted);
          transition: all var(--transition-fast);
        }

        .step-node.active .step-num {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .step-node.completed .step-num {
          background: var(--primary-light);
          color: var(--primary-dark);
          border-color: var(--primary-dark);
        }

        .timeline-arrow {
          color: var(--muted-light);
        }

        @media (max-width: 500px) {
          .booking-steps-timeline {
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          .step-node {
            gap: 0.25rem;
          }
          .step-node :global(.step-txt) {
            font-size: 0.75rem;
          }
          .step-num {
            width: 22px;
            height: 22px;
            font-size: 0.7rem;
          }
          .timeline-arrow {
            display: none;
          }
        }

        .error-alert {
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Search Layout */
        .search-bar-widget {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          margin-bottom: 2rem;
        }

        .search-form-inline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .search-form-inline {
            flex-direction: row;
            align-items: flex-end;
          }
        }

        .inline-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .inline-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .select-control, .date-control {
          background: var(--input);
          border-color: var(--border);
          font-weight: 600;
          cursor: pointer;
        }

        .search-submit-btn {
          height: 43px;
          padding: 0 1.5rem;
          font-size: 0.95rem;
        }

        .spinner-center {
          text-align: center;
          padding: 4rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          border: 3px solid rgba(22, 163, 74, 0.12);
          border-left-color: var(--primary);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .empty-results, .welcome-search-callout {
          padding: 4rem 2rem;
          text-align: center;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-icon, .callout-icon {
          color: var(--muted-light);
        }

        .empty-results p, .welcome-search-callout p {
          color: var(--muted);
          max-width: 450px;
          line-height: 1.6;
        }

        .seminars-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .list-title {
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
        }

        .seminar-card-item {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .seminar-card-item:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .seminar-card-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .seminar-card-main {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .seminar-company {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 200px;
        }

        .seminar-name-txt {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .seminar-type-badge {
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--input);
          color: var(--muted);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }

        .seminar-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }

        .event-status-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: #9a3412;
          background: #ffedd5;
          border: 1px solid #fed7aa;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Seminar Timeline */
        .seminar-timeline {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .timeline-city {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--foreground);
        }

        .timeline-connector {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .timeline-duration {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
          background: white;
          padding: 0 0.5rem;
          position: relative;
          z-index: 2;
        }

        .connector-line {
          border: 0;
          border-top: 2px dashed var(--border);
          width: 100%;
          position: absolute;
          top: 50%;
          left: 0;
          z-index: 1;
        }

        .seminar-pricing {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 110px;
        }

        .price-label {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 500;
        }

        .price-value {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary);
        }

        .seat-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--muted);
        }

        .select-seminar-btn {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
        }

        /* EVENT RESERVATION WORKSPACE */
        .reservation-workspace {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
          align-items: start;
        }

        @media (min-width: 1024px) {
          .booking-page {
            max-width: 1280px;
          }

          .reservation-workspace {
            grid-template-columns: minmax(0, 1.3fr) minmax(340px, 0.7fr);
          }
        }

        .event-seat-panel,
        .reservation-state-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-md);
        }

        .event-seat-panel {
          padding: 1.75rem;
        }

        .seat-panel-header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1.25rem;
        }

        .panel-kicker {
          display: inline-block;
          color: var(--primary);
          font-size: 0.74rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }

        .seat-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: flex-end;
          gap: 0.75rem;
          color: var(--muted);
          font-size: 0.82rem;
          font-weight: 700;
        }

        .seat-legend span {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .legend-dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          display: inline-block;
          border: 1px solid #9fb1c8;
        }

        .available-dot { background: rgba(255, 255, 255, 0.7); }
        .selected-dot { background: var(--primary); border-color: var(--primary); }
        .booked-dot { background: #cbd5e1; border-color: #cbd5e1; filter: blur(1px); }

        .session-strip {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
          padding: 1rem;
          margin-bottom: 1.5rem;
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
        }

        @media (min-width: 768px) {
          .session-strip {
            grid-template-columns: 1.3fr 0.55fr 1fr;
            align-items: center;
          }
        }

        .strip-label {
          display: block;
          color: var(--muted);
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 0.25rem;
        }

        .compact-time-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        .compact-time-chip {
          border: 1px solid var(--border);
          background: white;
          color: var(--foreground);
          border-radius: 999px;
          padding: 0.35rem 0.7rem;
          font-size: 0.78rem;
          font-weight: 800;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .compact-time-chip.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .event-seat-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(42px, 1fr));
          gap: 0.75rem;
          justify-items: center;
          padding: 1.25rem;
          border-radius: var(--radius-xl);
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
        }

        @media (min-width: 700px) {
          .event-seat-grid {
            grid-template-columns: repeat(10, minmax(44px, 1fr));
            gap: 0.85rem;
          }
        }

        @media (max-width: 375px) {
          .event-seat-grid {
            grid-template-columns: repeat(6, minmax(32px, 1fr)) !important;
            gap: 0.4rem !important;
            padding: 0.75rem 0.5rem !important;
          }
        }

        .event-seat {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1.5px solid #9fb1c8;
          background: rgba(255, 255, 255, 0.82);
          color: var(--primary-dark);
          font-size: 0.74rem;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform var(--transition-fast), box-shadow var(--transition-fast), background var(--transition-fast), color var(--transition-fast);
        }

        @media (max-width: 375px) {
          .event-seat {
            width: 34px !important;
            height: 34px !important;
            font-size: 0.65rem !important;
          }
        }

        .event-seat:hover:not(:disabled) {
          transform: translateY(-2px) scale(1.06);
          border-color: var(--primary);
          box-shadow: 0 8px 18px rgba(22, 163, 74, 0.18);
        }

        .event-seat.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 10px 20px rgba(22, 163, 74, 0.28);
        }

        .event-seat.booked {
          background: rgba(203, 213, 225, 0.7);
          border-color: rgba(148, 163, 184, 0.7);
          color: rgba(71, 85, 105, 0.75);
          cursor: not-allowed;
          filter: blur(2px);
          opacity: 0.72;
          box-shadow: none;
        }

        .reservation-state-card {
          padding: 1.75rem;
          min-height: 440px;
          position: sticky;
          top: 92px;
        }

        .reservation-state-card.success-state {
          border-color: rgba(22, 163, 74, 0.28);
          background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
        }

        .state-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          min-height: 390px;
        }

        .state-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          background: var(--primary-light);
        }

        .state-content p {
          color: var(--muted);
          line-height: 1.65;
        }

        .summary-box {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1rem;
        }

        .auth-hint-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          align-self: flex-start;
          color: #92400e;
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 999px;
          padding: 0.35rem 0.7rem;
          font-size: 0.82rem;
          font-weight: 800;
        }

        .summary-total-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          color: var(--muted);
          font-weight: 800;
        }

        .summary-total-row strong {
          color: var(--primary);
          font-size: 2rem;
          font-family: var(--font-heading);
        }

        .state-primary-btn,
        .state-secondary-btn {
          width: 100%;
          padding: 0.85rem 1rem;
        }

        .dummy-qr-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.7rem;
          padding: 1.25rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          background: #f8fafc;
          text-align: center;
        }

        .qr-grid-mark {
          width: 130px;
          height: 130px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          padding: 12px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-md);
        }

        .qr-grid-mark span {
          background: var(--primary-dark);
          border-radius: 3px;
        }

        .qr-grid-mark span:nth-child(2n) {
          background: var(--primary);
        }

        .receipt-upload-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          min-height: 118px;
          border: 2px dashed #9fb1c8;
          border-radius: var(--radius-lg);
          background: white;
          color: var(--primary-dark);
          font-weight: 800;
          text-align: center;
          cursor: pointer;
          padding: 1rem;
          transition: all var(--transition-fast);
        }

        .receipt-upload-box:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .file-name-inline {
          color: var(--primary-dark);
          background: var(--primary-light);
          border: 1px solid rgba(22, 163, 74, 0.18);
          border-radius: var(--radius-md);
          padding: 0.55rem 0.75rem;
          font-size: 0.85rem;
          font-weight: 800;
          word-break: break-word;
        }

        .payment-inline-error {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          color: #991b1b;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: var(--radius-md);
          padding: 0.75rem;
          font-size: 0.88rem;
          font-weight: 700;
          line-height: 1.45;
        }

        .payment-inline-error svg {
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .success-message-state {
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .success-message-state .success-check-icon {
          color: var(--primary);
        }

        .success-seat-list {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.35rem;
        }

        .success-seat-list span {
          background: white;
          color: var(--primary-dark);
          border: 1px solid rgba(22, 163, 74, 0.2);
          border-radius: 999px;
          padding: 0.35rem 0.65rem;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .auth-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.25rem;
          background: rgba(15, 23, 42, 0.58);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }

        .auth-modal-card {
          width: 100%;
          max-width: 430px;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          text-align: center;
        }

        .auth-modal-icon {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #fef3c7;
          color: #92400e;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .auth-modal-card p {
          color: var(--muted);
          line-height: 1.6;
        }

        .auth-modal-actions {
          display: flex;
          gap: 0.75rem;
          width: 100%;
          margin-top: 0.25rem;
        }

        .auth-modal-actions .btn {
          flex: 1;
        }

        /* STEP 2 STYLES */
        .seats-step-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          align-items: start;
        }

        @media (min-width: 992px) {
          .seats-step-layout {
            grid-template-columns: 0.8fr 1.2fr;
          }
        }

        .sidebar-card {
          padding: 2rem;
          background: white;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
        }

        .sidebar-title {
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 1.5rem;
        }

        .summary-detail-row {
          display: flex;
          justify-content: space-between;
          padding: 0.625rem 0;
          border-bottom: 1px dashed var(--border);
          font-size: 0.9rem;
        }

        .summary-label {
          color: var(--muted);
          font-weight: 500;
        }

        .summary-val {
          font-weight: 600;
          color: var(--foreground);
        }

        .time-chips-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .time-chip {
          padding: 0.5rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border);
          background: var(--input);
          color: var(--foreground);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .time-chip:hover {
          background: #e2e8f0;
        }

        .time-chip.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }

        .seat-stats-detail {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin: 1.5rem 0;
        }

        .selected-seats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .selected-seats-list {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .no-seats-placeholder {
          font-style: italic;
          color: var(--muted-light);
          font-size: 0.9rem;
        }

        .seat-summary-tag {
          font-size: 0.75rem;
          font-weight: 700;
          background: var(--primary-light);
          color: var(--primary-dark);
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(22, 163, 74, 0.18);
        }

        .total-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .total-price-val {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary);
        }

        .checkout-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 1.05rem;
          margin-bottom: 0.75rem;
        }

        .back-btn {
          width: 100%;
          padding: 0.625rem;
          font-size: 0.9rem;
        }

        /* STEP 3 UPI PAYMENT STYLES */
        .payment-card {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }

        @media (min-width: 640px) {
          .payment-card {
            padding: 2.5rem;
          }
        }

        .payment-title {
          font-weight: 700;
          color: var(--primary-dark);
          text-align: center;
          margin-bottom: 0.5rem;
        }

        .payment-desc {
          text-align: center;
          color: var(--muted);
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto 2.5rem auto;
          font-size: 0.95rem;
        }

        .payment-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: start;
        }

        @media (min-width: 768px) {
          .payment-split {
            grid-template-columns: 0.9fr 1.1fr;
          }
        }

        .qr-code-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          text-align: center;
        }

        .qr-container {
          background: white;
          padding: 1.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-md);
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
        }

        .qr-svg {
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.05));
        }

        .qr-price-badge {
          margin-top: -12px;
          background: var(--primary);
          color: white;
          font-weight: 800;
          font-size: 0.95rem;
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          border: 2px solid white;
          box-shadow: var(--shadow-sm);
        }

        .payment-summary-block {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .pay-label {
          font-size: 0.8rem;
          color: var(--muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .pay-amount {
          font-family: var(--font-heading);
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--primary-dark);
          line-height: 1.1;
        }

        .pay-account {
          font-size: 0.85rem;
          color: var(--foreground);
          font-weight: 700;
          margin-top: 0.25rem;
        }

        .pay-account-sub {
          font-size: 0.8rem;
          color: var(--muted);
          background: var(--input);
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius-sm);
          font-weight: 500;
          margin-top: 0.25rem;
          word-break: break-all;
        }

        .booking-info-recap {
          background: var(--background);
          padding: 1.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          margin-bottom: 1.5rem;
        }

        .booking-info-recap h4 {
          color: var(--primary-dark);
          font-weight: 700;
          margin-bottom: 0.75rem;
        }

        .recap-table {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
        }

        .recap-row {
          display: flex;
          justify-content: space-between;
        }

        .recap-row span {
          color: var(--muted);
        }

        .recap-row strong {
          color: var(--foreground);
        }

        .uploader-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .uploader-box {
          border: 2px dashed var(--muted-light);
          border-radius: var(--radius-xl);
          padding: 2rem 1rem;
          text-align: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          background: var(--background);
        }

        .uploader-box:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .hidden-file-input {
          display: none;
        }

        .uploader-icon {
          color: var(--muted-light);
          transition: color var(--transition-fast);
        }

        .uploader-box:hover .uploader-icon {
          color: var(--primary);
        }

        .upload-prompt {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .upload-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--foreground);
        }

        .upload-sub {
          font-size: 0.75rem;
          color: var(--muted);
        }

        .file-success {
          font-weight: 700;
          color: var(--primary-dark);
          font-size: 0.95rem;
        }

        .file-name {
          font-size: 0.8rem;
          color: var(--muted);
          word-break: break-all;
          max-width: 250px;
        }

        .screenshot-preview-thumb {
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          max-height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
        }

        .screenshot-preview-thumb img {
          max-width: 100%;
          max-height: 150px;
          object-fit: contain;
        }

        .checkout-btn-submit {
          flex: 1.2;
        }

        /* SUCCESS VIEW */
        .success-step-layout {
          max-width: 600px;
          margin: 4rem auto;
        }

        .success-card {
          background: white;
          padding: 4rem 2rem;
          text-align: center;
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          box-shadow: var(--shadow-xl);
        }

        .success-check-icon {
          color: var(--primary);
        }

        .success-title {
          font-weight: 800;
          color: var(--primary-dark);
        }

        .success-text {
          color: var(--foreground);
          line-height: 1.6;
          font-size: 1.05rem;
          max-width: 450px;
        }

        .alert-notice-box {
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #92400e;
          padding: 1.25rem;
          border-radius: var(--radius-xl);
          font-size: 0.875rem;
          text-align: left;
          display: flex;
          gap: 0.75rem;
          line-height: 1.5;
        }

        .notice-icon {
          flex-shrink: 0;
          margin-top: 0.125rem;
        }

        .go-profile-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 1.05rem;
          margin-top: 1rem;
          box-shadow: var(--shadow-primary);
        }
      `}</style>
    </div>
  );
}
