'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Search, ShieldCheck, CheckCircle2, ChevronRight, Upload, AlertCircle, Clock } from 'lucide-react';

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
  const [source, setSource] = useState('Chromepet, Chennai');
  const [destination, setDestination] = useState('Leadership Development Seminars');
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });

  // Flow control states
  const [user, setUser] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [loadingBuses, setLoadingBuses] = useState(false);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected bus and schedule states
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  // Checkout and payment states
  const [bookingStep, setBookingStep] = useState<'search' | 'seats' | 'payment' | 'success'>('search');
  const [screenshot, setScreenshot] = useState<string>('');
  const [screenshotName, setScreenshotName] = useState<string>('');
  const [submittingBooking, setSubmittingBooking] = useState(false);

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

    // Read initial params
    const sParam = searchParams.get('source');
    const dParam = searchParams.get('destination');
    const tParam = searchParams.get('date');

    if (sParam) setSource(sParam);
    if (dParam) setDestination(dParam);
    if (tParam) setDate(tParam);

    if (sParam && dParam && tParam) {
      handleSearchBuses(sParam, dParam, tParam);
    }
  }, [searchParams]);

  const handleSearchBuses = async (srcVal = source, destVal = destination, dateVal = date) => {
    if (srcVal === destVal) {
      setErrorMsg('Please choose a valid seminar location and category.');
      return;
    }
    setErrorMsg('');
    setLoadingBuses(true);
    setSearchTriggered(true);
    setSelectedBus(null);
    setSelectedSeats([]);

    try {
      const res = await fetch(`/api/buses?source=${encodeURIComponent(srcVal)}&destination=${encodeURIComponent(destVal)}&date=${encodeURIComponent(dateVal)}`);
      const data = await res.json();
      if (res.ok) {
        setBuses(data.buses || []);
      } else {
        setErrorMsg(data.error || 'Failed to fetch seminar listings');
      }
    } catch (err) {
      setErrorMsg('A connection error occurred while searching seminars.');
    } finally {
      setLoadingBuses(false);
    }
  };

  const handleBusSelect = (bus: any) => {
    setSelectedBus(bus);
    setSelectedTime(bus.times[0]); // Default to first time
    setBookedSeats(bus.bookedSeatsByTime[bus.times[0]] || []);
    setSelectedSeats([]);
    setBookingStep('seats');
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    setBookedSeats(selectedBus.bookedSeatsByTime[time] || []);
    setSelectedSeats([]);
  };

  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
    } else {
      if (selectedSeats.length >= 6) {
        alert('Maximum of 6 seats can be reserved per transaction.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  // Convert uploaded image to base64
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitBookingRequest = async () => {
    if (!screenshot) {
      alert('Please upload a screenshot of your UPI/NetBanking transfer to proceed.');
      return;
    }
    setSubmittingBooking(true);

    try {
      const payload = {
        busId: selectedBus.id,
        busName: selectedBus.name,
        source: selectedBus.source,
        destination: selectedBus.destination,
        date,
        time: selectedTime,
        seats: selectedSeats,
        totalPrice: selectedSeats.length * selectedBus.price,
        screenshot,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setBookingStep('success');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to submit booking request.');
      }
    } catch (e) {
      alert('Connection error submitting booking.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // 15 rows of 4 seats (A1, A2, corridor, A3, A4) = 60 seats
  const generateSeats = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    const layout = [];

    for (let r = 0; r < rows.length; r++) {
      const rowLetter = rows[r];
      const rowSeats = [];
      for (let s = 1; s <= 4; s++) {
        rowSeats.push(`${rowLetter}${s}`);
      }
      layout.push({ rowLetter, seats: rowSeats });
    }
    return layout;
  };

  const totalPrice = selectedSeats.length * (selectedBus?.price || 0);

  // Enforce member login
  if (!user) {
    return (
      <div className="guest-booking-container container animate-slide-up">
        <div className="guest-card glass-card">
          <AlertCircle size={48} className="guest-icon animate-bounce" />
          <h2 className="heading-md">Sign In Required</h2>
          <p>Please sign in to reserve seminar seats and complete screenshot verification.</p>
          <button onClick={() => router.push('/profile')} className="btn btn-primary">
            Sign In / Create Account
          </button>
        </div>
        <style jsx>{`
          .guest-booking-container {
            max-width: 500px;
            padding: 8rem 1.5rem;
          }
          .guest-card {
            background: white;
            padding: 3rem 2rem;
            border-radius: var(--radius-2xl);
            border: 1px solid var(--border);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.25rem;
            box-shadow: var(--shadow-xl);
          }
          .guest-icon {
            color: var(--warning);
          }
          .guest-card p {
            color: var(--muted);
            line-height: 1.6;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="booking-page container animate-fade-in">
      
      {/* Timeline Steps */}
      <div className="booking-steps-timeline animate-slide-down">
        <div className={`step-node ${bookingStep === 'search' ? 'active' : ''} ${selectedBus ? 'completed' : ''}`} onClick={() => setBookingStep('search')}>
          <span className="step-num">{selectedBus ? '✓' : '1'}</span>
          <span className="step-txt">Search Seminars</span>
        </div>
        <ChevronRight size={16} className="timeline-arrow" />
        <div className={`step-node ${bookingStep === 'seats' ? 'active' : ''} ${bookingStep === 'payment' || bookingStep === 'success' ? 'completed' : ''}`} onClick={() => { if (selectedBus) setBookingStep('seats'); }}>
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

      {/* STEP 1: ROUTE SEARCH AND BUS SELECTION */}
      {bookingStep === 'search' && (
        <div className="search-step-layout">
          <div className="search-bar-widget glass-card animate-slide-up">
            <form onSubmit={(e) => { e.preventDefault(); handleSearchBuses(); }} className="search-form-inline">
              <div className="inline-group">
                <label className="inline-label">Location</label>
                <select value={source} onChange={(e) => setSource(e.target.value)} className="form-control select-control">
                  <option value="Chromepet, Chennai">Chromepet, Chennai</option>
                  <option value="Chennai Central Region">Chennai Central Region</option>
                  <option value="South Chennai">South Chennai</option>
                  <option value="Tambaram">Tambaram</option>
                  <option value="Pallavaram">Pallavaram</option>
                  <option value="Tamil Nadu Chapter Network">Tamil Nadu Chapter Network</option>
                </select>
              </div>
              <div className="inline-group">
                <label className="inline-label">Event Category</label>
                <select value={destination} onChange={(e) => setDestination(e.target.value)} className="form-control select-control">
                  <option value="Leadership Development Seminars">Leadership Development Seminars</option>
                  <option value="Weekly Income-Generation Systems">Weekly Income-Generation Systems</option>
                  <option value="BOSS Agro Hub Chapter Meetups">BOSS Agro Hub Chapter Meetups</option>
                  <option value="Digital Marketing & Direct-Selling Workshops">Digital Marketing & Direct-Selling Workshops</option>
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
            {loadingBuses ? (
              <div className="spinner-center">
                <div className="spinner"></div>
                <p>Loading scheduled seminar sessions...</p>
              </div>
            ) : buses.length === 0 ? (
              searchTriggered ? (
                <div className="empty-results glass-card animate-scale-in">
                  <AlertCircle size={40} className="empty-icon" />
                  <h3 className="heading-sm">No Seminar Scheduled</h3>
                  <p>There are no listed {destination} sessions at {source} on {date}. Modify your location, category, or date filters.</p>
                </div>
              ) : (
                <div className="welcome-search-callout glass-card animate-scale-in">
                  <MapPin size={40} className="callout-icon" />
                  <h3 className="heading-sm">Plan Your Seminar Visit</h3>
                  <p>Select a location, seminar category, and date above to view available sessions and reserve seats.</p>
                </div>
              )
            ) : (
              <div className="buses-list animate-slide-up">
                <h3 className="heading-sm list-title">Available Seminar Sessions for {date}</h3>
                {buses.map((bus) => (
                  <div key={bus.id} className="bus-card-item hover-glow-card">
                    <div className="bus-card-main">
                      <div className="bus-company">
                        <span className="bus-name-txt">{bus.name}</span>
                        <span className="bus-type-badge">{bus.type}</span>
                      </div>
                      
                      <div className="bus-timeline">
                        <div className="timeline-node">
                          <span className="timeline-city">{bus.source}</span>
                        </div>
                        <div className="timeline-connector">
                          <span className="timeline-duration">{bus.duration}</span>
                          <hr className="connector-line" />
                        </div>
                        <div className="timeline-node">
                          <span className="timeline-city">{bus.destination}</span>
                        </div>
                      </div>

                      <div className="bus-pricing">
                        <span className="price-label">Seat Fee</span>
                        <span className="price-value">₹{bus.price} <span className="seat-label">/ seat</span></span>
                      </div>

                      <button onClick={() => handleBusSelect(bus)} className="btn btn-primary select-bus-btn">
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

      {/* STEP 2: DYNAMIC SEAT MAP AND SCHEDULE TIMING */}
      {bookingStep === 'seats' && selectedBus && (
        <div className="seats-step-layout animate-slide-up">
          <div className="seats-control-sidebar">
            <div className="sidebar-card glass-card">
              <h3 className="heading-sm sidebar-title">Seminar Selection</h3>
              <div className="summary-detail-row">
                <span className="summary-label">Session</span>
                <span className="summary-val">{selectedBus.source} &rarr; {selectedBus.destination}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-label">Program Name</span>
                <span className="summary-val">{selectedBus.name}</span>
              </div>
              <div className="summary-detail-row">
                <span className="summary-label">Seminar Date</span>
                <span className="summary-val">{date}</span>
              </div>

              <hr className="card-divider" />

              {/* Time Selection */}
              <div className="time-selection-section">
                <label className="form-label font-bold"><Clock size={12} className="inline-icon" /> Departure Timing</label>
                <div className="time-chips-grid">
                  {selectedBus.times.map((time: string) => (
                    <button 
                      key={time} 
                      onClick={() => handleTimeChange(time)} 
                      className={`time-chip ${selectedTime === time ? 'active' : ''}`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <hr className="card-divider" />

              {/* Seat Details */}
              <div className="seat-stats-detail">
                <div className="selected-seats-row">
                  <span className="summary-label">Selected Seats</span>
                  <div className="selected-seats-list">
                    {selectedSeats.length === 0 ? (
                      <span className="no-seats-placeholder">None Selected</span>
                    ) : (
                      selectedSeats.map((s) => <span key={s} className="seat-summary-tag animate-scale-in">{s}</span>)
                    )}
                  </div>
                </div>
                <div className="total-price-row">
                  <span className="summary-label">Total Fare</span>
                  <span className="total-price-val">₹{totalPrice}</span>
                </div>
              </div>

              <button 
                onClick={() => setBookingStep('payment')} 
                className="btn btn-primary checkout-btn" 
                disabled={selectedSeats.length === 0}
              >
                Proceed to UPI Payment (₹{totalPrice})
              </button>
              <button onClick={() => setBookingStep('search')} className="btn btn-secondary back-btn">
                Change Route / Date
              </button>
            </div>
          </div>

          {/* Seat Layout Graphics */}
          <div className="seats-map-display glass-card">
            <div className="map-legend">
              <div className="legend-item">
                <div className="legend-box available-box"></div>
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-box selected-box animate-pulse-green"></div>
                <span>Selected</span>
              </div>
              <div className="legend-item">
                <div className="legend-box booked-box"></div>
                <span>Booked</span>
              </div>
            </div>

            {/* Premium Bus cabin outline */}
            <div className="bus-cabin-frame animate-scale-in">
              <div className="bus-front-cabin">
                {/* Steering Wheel graphic */}
                <div className="driver-dashboard-panel">
                  <div className="steering-wheel-vector">
                    <div className="wheel-rim">
                      <div className="wheel-spoke spoke-h"></div>
                      <div className="wheel-spoke spoke-v"></div>
                      <div className="wheel-center"></div>
                    </div>
                  </div>
                  <div className="driver-suite-seat">Pilot Seat</div>
                </div>
                <span className="cabin-label">Cockpit / Front windshield</span>
              </div>

              <div className="bus-seats-container">
                {generateSeats().map(({ rowLetter, seats }) => (
                  <div key={rowLetter} className="seat-row">
                    {/* Left seats (1 and 2) */}
                    <div className="seat-pair">
                      {seats.slice(0, 2).map((seatId) => {
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        return (
                          <button 
                            key={seatId} 
                            onClick={() => handleSeatClick(seatId)}
                            className={`seat-button ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                            title={`Seat ${seatId} (${isBooked ? 'Booked' : 'Available'})`}
                            disabled={isBooked}
                          >
                            <span className="seat-number">{seatId}</span>
                            <div className="seat-cushion-leather"></div>
                            <div className="seat-armrest arm-l"></div>
                            <div className="seat-armrest arm-r"></div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Floor lights in center corridor aisle */}
                    <div className="bus-aisle">
                      <div className="aisle-floor-light"></div>
                    </div>

                    {/* Right seats (3 and 4) */}
                    <div className="seat-pair">
                      {seats.slice(2, 4).map((seatId) => {
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);
                        return (
                          <button 
                            key={seatId} 
                            onClick={() => handleSeatClick(seatId)}
                            className={`seat-button ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                            title={`Seat ${seatId} (${isBooked ? 'Booked' : 'Available'})`}
                            disabled={isBooked}
                          >
                            <span className="seat-number">{seatId}</span>
                            <div className="seat-cushion-leather"></div>
                            <div className="seat-armrest arm-l"></div>
                            <div className="seat-armrest arm-r"></div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="bus-back-cabin">
                <span className="cabin-label-back">Rear Row Limit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: UPI QR SCREEN AND RECEIPT UPLOAD */}
      {bookingStep === 'payment' && selectedBus && (
        <div className="payment-step-layout animate-slide-up">
          <div className="payment-card glass-card">
            <h2 className="heading-md payment-title">Scan & Pay via UPI</h2>
            <p className="payment-desc">
              Scan the transaction QR below with GPay, PhonePe, Paytm, or BHIM. complete the exact transfer, and upload your receipt screenshot for admin manual verification.
            </p>

            <div className="payment-split">
              {/* QR display */}
              <div className="qr-code-section animate-scale-in">
                <div className="qr-container">
                  {/* Custom SVG QR simulation */}
                  <svg width="220" height="220" viewBox="0 0 100 100" className="qr-svg">
                    <rect width="100" height="100" fill="white" />
                    {/* QR alignment markers */}
                    <rect x="5" y="5" width="20" height="20" fill="#082f61" />
                    <rect x="8" y="8" width="14" height="14" fill="white" />
                    <rect x="11" y="11" width="8" height="8" fill="#0f5fb8" />

                    <rect x="75" y="5" width="20" height="20" fill="#082f61" />
                    <rect x="78" y="8" width="14" height="14" fill="white" />
                    <rect x="81" y="11" width="8" height="8" fill="#0f5fb8" />

                    <rect x="5" y="75" width="20" height="20" fill="#082f61" />
                    <rect x="8" y="78" width="14" height="14" fill="white" />
                    <rect x="11" y="81" width="8" height="8" fill="#0f5fb8" />

                    {/* QR noise simulation */}
                    <rect x="35" y="5" width="5" height="15" fill="#0f5fb8" />
                    <rect x="45" y="15" width="15" height="5" fill="#082f61" />
                    <rect x="30" y="30" width="10" height="10" fill="#082f61" />
                    <rect x="50" y="30" width="5" height="5" fill="#0f5fb8" />
                    <rect x="65" y="35" width="10" height="15" fill="#082f61" />
                    <rect x="30" y="50" width="15" height="5" fill="#0f5fb8" />
                    <rect x="55" y="45" width="5" height="10" fill="#082f61" />
                    <rect x="40" y="60" width="10" height="5" fill="#082f61" />
                    <rect x="75" y="55" width="20" height="20" fill="#082f61" />
                    <rect x="78" y="58" width="14" height="14" fill="white" />
                    <rect x="30" y="75" width="5" height="20" fill="#0f5fb8" />
                    <rect x="45" y="80" width="15" height="15" fill="#082f61" />
                  </svg>
                  <div className="qr-price-badge">₹{totalPrice.toFixed(2)}</div>
                </div>
                <div className="payment-summary-block">
                  <span className="pay-label">Transfer Amount:</span>
                  <span className="pay-amount">₹{totalPrice}</span>
                  <span className="pay-account">Payment account: confirm with the official event desk</span>
                  <span className="pay-account-sub">Ref: SI-{selectedSeats.join('-')}-{Date.now().toString().slice(-4)}</span>
                </div>
              </div>

              {/* Uploader section */}
              <div className="screenshot-uploader-section animate-scale-in">
                <div className="booking-info-recap">
                  <h4 className="heading-sm">Seminar Details</h4>
                  <div className="recap-table">
                    <div className="recap-row"><span>Member Name:</span><strong>{user.name}</strong></div>
                    <div className="recap-row"><span>Seminar:</span><strong>{selectedBus.name} ({selectedTime})</strong></div>
                    <div className="recap-row"><span>Seminar Date:</span><strong>{date}</strong></div>
                    <div className="recap-row"><span>Allocated Seats:</span><strong>{selectedSeats.join(', ')}</strong></div>
                  </div>
                </div>

                <div className="uploader-container">
                  <label className="uploader-box">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleScreenshotChange} 
                      className="hidden-file-input" 
                    />
                    <Upload size={32} className="uploader-icon" />
                    {screenshot ? (
                      <div className="upload-preview-details">
                        <span className="file-success">UPI Screenshot Added!</span>
                        <span className="file-name">{screenshotName}</span>
                      </div>
                    ) : (
                      <div className="upload-prompt">
                        <span className="upload-title">Click to Upload Transaction Screenshot</span>
                        <span className="upload-sub">Supports PNG, JPG, or JPEG file structures</span>
                      </div>
                    )}
                  </label>
                  {screenshot && (
                    <div className="screenshot-preview-thumb">
                      <img src={screenshot} alt="Receipt Screenshot Preview" />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button onClick={() => setBookingStep('seats')} className="btn btn-secondary flex-1">
                    Back to Seat Map
                  </button>
                  <button 
                    onClick={submitBookingRequest} 
                    className="btn btn-primary flex-1 checkout-btn-submit" 
                    disabled={!screenshot || submittingBooking}
                  >
                    {submittingBooking ? 'Submitting request...' : 'Confirm Transfer Receipt'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: SUCCESS SUBMISSION PAGE */}
      {bookingStep === 'success' && selectedBus && (
        <div className="success-step-layout animate-scale-in">
          <div className="success-card glass-card">
            <CheckCircle2 size={64} className="success-check-icon animate-pulse-green" />
            <h2 className="heading-lg success-title">Booking Ticket Submitted!</h2>
            <p className="success-text">
              Your request for seats <strong>{selectedSeats.join(', ')}</strong> on the <strong>{selectedBus.name}</strong> has been forwarded to our audit desk.
            </p>
            <div className="alert-notice-box">
              <Clock size={18} className="notice-icon" />
              <div>
                <strong>Verification Status: Pending Approval</strong>
                <p>Helpline administrators evaluate UPI transaction logs continuously. Your seats will turn active and locked once verified (usually takes 10-20 minutes).</p>
              </div>
            </div>
            <button onClick={() => router.push('/profile')} className="btn btn-primary go-profile-btn">
              Go to Profile / Booking Logs
            </button>
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
          border: 3px solid rgba(15, 95, 184, 0.12);
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

        .buses-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .list-title {
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
        }

        .bus-card-item {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .bus-card-item:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .bus-card-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .bus-card-main {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .bus-company {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 200px;
        }

        .bus-name-txt {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .bus-type-badge {
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--input);
          color: var(--muted);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }

        /* Bus Timeline */
        .bus-timeline {
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

        .bus-pricing {
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

        .select-bus-btn {
          padding: 0.625rem 1.25rem;
          font-size: 0.9rem;
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
          border: 1px solid rgba(15, 95, 184, 0.18);
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

        /* Seating Display Grid */
        .seats-map-display {
          background: white;
          padding: 2.5rem 2rem;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .map-legend {
          display: flex;
          gap: 2rem;
          margin-bottom: 2.5rem;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .legend-box {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 1px solid var(--border);
        }

        .available-box { background: white; border-color: var(--muted-light); }
        .selected-box { background: var(--primary); border-color: var(--primary); }
        .booked-box { background: #cbd5e1; border-color: #cbd5e1; }

        /* Cabin frame */
        .bus-cabin-frame {
          border: 4px solid #475569;
          border-radius: 24px 24px 12px 12px;
          background: #f8fafc;
          padding: 2rem 1.25rem;
          width: 100%;
          max-width: 320px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08), inset 0 2px 8px rgba(0,0,0,0.05);
        }

        .bus-front-cabin {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px double #cbd5e1;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
          position: relative;
        }

        .driver-dashboard-panel {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          justify-content: space-between;
        }

        .steering-wheel-vector {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 3px solid #334155;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f1f5f9;
        }

        .wheel-rim {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .wheel-spoke {
          position: absolute;
          background: #334155;
        }

        .spoke-h {
          width: 100%;
          height: 3px;
          top: 50%;
          transform: translateY(-50%);
        }

        .spoke-v {
          width: 3px;
          height: 50%;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
        }

        .wheel-center {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #334155;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .driver-suite-seat {
          font-size: 0.7rem;
          font-weight: 700;
          color: #64748b;
          padding: 0.35rem 0.6rem;
          border: 2px solid #e2e8f0;
          background: #ffffff;
          border-radius: 6px;
          box-shadow: var(--shadow-sm);
        }

        .cabin-label {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.65rem;
          color: var(--muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        .bus-seats-container {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .seat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .seat-pair {
          display: flex;
          gap: 0.75rem;
        }

        .bus-aisle {
          width: 30px;
          height: 38px;
          position: relative;
        }

        .bus-aisle::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          background: repeating-linear-gradient(to bottom, #0f5fb8 0, #0f5fb8 6px, transparent 6px, transparent 12px);
          opacity: 0.3;
        }

        /* Bus Seat Button styling (leather look) */
        .seat-button {
          width: 44px;
          height: 44px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          position: relative;
          cursor: pointer;
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.03);
        }

        /* Headrest mockups */
        .seat-button::before {
          content: '';
          position: absolute;
          top: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 22px;
          height: 6px;
          background: #e2e8f0;
          border: 1px solid #cbd5e1;
          border-radius: 3px;
          transition: all var(--transition-fast);
        }

        .seat-button:hover:not(:disabled) {
          border-color: var(--primary);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(15, 95, 184, 0.16);
        }

        .seat-button.selected {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          box-shadow: 0 4px 10px rgba(15, 95, 184, 0.28);
        }

        .seat-button.selected::before {
          background: var(--primary-dark);
          border-color: var(--primary-dark);
        }

        .seat-button.booked {
          background: #cbd5e1;
          border-color: #cbd5e1;
          color: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }

        .seat-button.booked::before {
          background: #94a3b8;
          border-color: #94a3b8;
        }

        .seat-number {
          font-size: 0.8rem;
          font-weight: 700;
          z-index: 2;
        }

        .seat-cushion-leather {
          position: absolute;
          bottom: 3px;
          left: 4px;
          right: 4px;
          height: 18px;
          border-radius: 4px;
          background: rgba(0, 0, 0, 0.03);
          z-index: 1;
        }

        .seat-button.selected .seat-cushion-leather {
          background: rgba(255, 255, 255, 0.15);
        }

        .seat-armrest {
          position: absolute;
          width: 3px;
          height: 28px;
          background: rgba(0, 0, 0, 0.05);
          top: 8px;
          border-radius: 1px;
        }

        .seat-button.selected .seat-armrest {
          background: rgba(255, 255, 255, 0.2);
        }

        .arm-l { left: 2px; }
        .arm-r { right: 2px; }

        .bus-back-cabin {
          border-top: 3px double #cbd5e1;
          padding-top: 1.5rem;
          margin-top: 2rem;
          text-align: center;
          position: relative;
        }

        .cabin-label-back {
          font-size: 0.65rem;
          color: var(--muted);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 1.5px;
        }

        /* STEP 3 UPI PAYMENT STYLES */
        .payment-card {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 2.5rem;
          border-radius: var(--radius-2xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
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
