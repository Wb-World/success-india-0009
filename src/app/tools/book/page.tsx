'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AuthGuard from '../../components/AuthGuard';
import {
  ArrowLeft, ArrowRight, CheckCircle, AlertTriangle,
  User, Phone, Mail, Users, Calendar, Home, FileText,
  CreditCard, Download, Loader2, Check, Info, Clock,
  ChevronLeft, ChevronRight
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────
interface BookingForm {
  full_name: string;
  phone: string;
  email: string;
  guests: string;
  check_in_date: string;
  check_out_date: string;
  accommodation_type: 'SUREN INN BEACH RESORT' | 'SUREN VILLA' | '';
  special_notes: string;
  utr_number: string;
}

interface PricingResult {
  nights: number;
  weekdayNights: number;
  weekendNights: number;
  weekdayRate: number;
  weekendRate: number;
  total: number;
  breakdown: string;
}

// ─── Pricing Logic ───────────────────────────────────────
const PRICING = {
  'SUREN INN BEACH RESORT': { weekday: 11000, weekend: 13000 },
  'SUREN VILLA': { weekday: 10000, weekend: 12000 },
};

function calculatePrice(checkIn: string, checkOut: string, accomType: string): PricingResult | null {
  if (!checkIn || !checkOut || !accomType) return null;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (end <= start) return null;

  const rates = PRICING[accomType as keyof typeof PRICING];
  if (!rates) return null;

  let weekdayNights = 0;
  let weekendNights = 0;
  const current = new Date(start);
  while (current < end) {
    const day = current.getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 5 || day === 6) {
      weekendNights++;
    } else {
      weekdayNights++;
    }
    current.setDate(current.getDate() + 1);
  }

  const total = weekdayNights * rates.weekday + weekendNights * rates.weekend;
  const breakdown = `${weekdayNights > 0 ? `${weekdayNights} weekday night(s) × ₹${rates.weekday.toLocaleString()}` : ''}${weekdayNights > 0 && weekendNights > 0 ? ' + ' : ''}${weekendNights > 0 ? `${weekendNights} weekend night(s) × ₹${rates.weekend.toLocaleString()}` : ''}`;

  return {
    nights: weekdayNights + weekendNights,
    weekdayNights,
    weekendNights,
    weekdayRate: rates.weekday,
    weekendRate: rates.weekend,
    total,
    breakdown,
  };
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getBookingId(id: string) {
  return `RESORT-${id.slice(0, 8).toUpperCase()}`;
}

// ─── Step Indicator ──────────────────────────────────────
function StepIndicator({ currentStep }: { currentStep: number }) {
  const steps = ['Accommodation', 'Notice', 'Details', 'Payment', 'Confirmation'];
  return (
    <div className="rb-step-indicator">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isCompleted = currentStep > stepNum;
        const isActive = currentStep === stepNum;
        return (
          <div key={i} className="rb-step-item">
            <div className={`rb-step-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
              {isCompleted ? <Check size={16} /> : stepNum}
            </div>
            <div className={`rb-step-label ${isActive ? 'active' : ''}`}>{label}</div>
            {i < steps.length - 1 && <div className={`rb-step-line ${isCompleted ? 'completed' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Booking Page ───────────────────────────────────
export default function ResortBookingPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<BookingForm>({
    full_name: '', phone: '', email: '', guests: '1',
    check_in_date: '', check_out_date: '',
    accommodation_type: '', special_notes: '', utr_number: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [submitError, setSubmitError] = useState('');

  const [resortImages, setResortImages] = useState<string[]>([
    '/images/resort.jpg',
    '/images/resort front.jpeg',
    '/images/pool.jpg'
  ]);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const [villaImages, setVillaImages] = useState<string[]>([
    '/images/villa.jpg'
  ]);
  const [currentVillaImgIndex, setCurrentVillaImgIndex] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setForm(prev => ({
          ...prev,
          full_name: prev.full_name || u.name || '',
          phone: prev.phone || u.phone || '',
          email: prev.email || u.email || '',
        }));
      } catch (e) {
        console.error('Error auto-populating from local storage user:', e);
      }
    }

    const loadResortImages = async () => {
      try {
        const res = await fetch('/api/admin/resort-images');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.images) && data.images.length > 0) {
            setResortImages(data.images);
          }
        }
      } catch (err) {
        console.error('Error fetching resort images:', err);
      }
    };
    loadResortImages();

    const loadVillaImages = async () => {
      try {
        const res = await fetch('/api/admin/villa-images');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.images) && data.images.length > 0) {
            setVillaImages(data.images);
          }
        }
      } catch (err) {
        console.error('Error fetching villa images:', err);
      }
    };
    loadVillaImages();
  }, []);
  const ticketRef = useRef<HTMLDivElement>(null);
  const pricing = calculatePrice(form.check_in_date, form.check_out_date, form.accommodation_type);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let { name, value } = e.target;
    if (name === 'utr_number') {
      value = value.slice(0, 12);
    }
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!form.phone.trim() || !/^\d{10}$/.test(form.phone.trim())) newErrors.phone = 'Valid 10-digit phone required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    if (!form.guests || parseInt(form.guests) < 1) newErrors.guests = 'At least 1 guest required';
    if (!form.check_in_date) newErrors.check_in_date = 'Check-in date required';
    if (!form.check_out_date) newErrors.check_out_date = 'Check-out date required';
    if (form.check_in_date && form.check_out_date && form.check_out_date <= form.check_in_date)
      newErrors.check_out_date = 'Check-out must be after check-in';
    if (!form.accommodation_type) newErrors.accommodation_type = 'Please select accommodation in Step 1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors: Record<string, string> = {};
    const utr = form.utr_number.trim();
    if (!utr || utr.length !== 12) {
      newErrors.utr_number = 'Please enter a valid 12-digit UTR Number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep4()) return;
    setIsSubmitting(true);
    setSubmitError('');

    let userId = null;
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        userId = JSON.parse(stored).id || null;
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    }

    try {
      const res = await fetch('/api/resort-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          guests: parseInt(form.guests),
          amount: pricing?.total || 0,
          user_id: userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBookingId(data.bookingId);
      setStep(5);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(ticketRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
    });
    const link = document.createElement('a');
    link.download = `Resort-Booking-${getBookingId(bookingId)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <AuthGuard>
      <div className="rb-page">
      {/* Header */}
      <div className="rb-header">
        <div className="rb-header-inner">
          <Link href="/tools" className="rb-back-btn">
            <ArrowLeft size={18} /> Back to Resort
          </Link>
          <div className="rb-header-title">
            <h1>🏖️ Resort Booking</h1>
            <p>Suren Inn Beach Resort & Suren Villa</p>
          </div>
        </div>
      </div>

      <div className="rb-content">
        {step < 5 && <StepIndicator currentStep={step} />}

        {/* ─── STEP 1: Accommodation Selection ─── */}
        {step === 1 && (
          <div className="rb-card rb-fade-in">
            <h2 className="rb-section-title">Select Your Accommodation</h2>
            <p className="rb-section-sub">Choose the accommodation that best suits your needs.</p>
            <div className="rb-accom-grid">
              {/* Resort Card */}
              <div
                className={`rb-accom-card ${form.accommodation_type === 'SUREN INN BEACH RESORT' ? 'selected' : ''}`}
                onClick={() => setForm(p => ({ ...p, accommodation_type: 'SUREN INN BEACH RESORT' }))}
              >
                <div className="rb-accom-img-carousel-container" onClick={(e) => e.stopPropagation()}>
                  <div 
                    className="rb-accom-img" 
                    style={{ 
                      backgroundImage: `url('${resortImages[currentImgIndex]}')`,
                      transition: 'background-image 0.5s ease-in-out'
                    }}
                    onClick={() => setForm(p => ({ ...p, accommodation_type: 'SUREN INN BEACH RESORT' }))}
                  >
                    {form.accommodation_type === 'SUREN INN BEACH RESORT' && (
                      <div className="rb-selected-badge"><Check size={14}/> Selected</div>
                    )}
                  </div>
                  
                  {resortImages.length > 1 && (
                    <>
                      <button 
                        type="button"
                        className="carousel-arrow left"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImgIndex(prev => (prev === 0 ? resortImages.length - 1 : prev - 1));
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        type="button"
                        className="carousel-arrow right"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentImgIndex(prev => (prev === resortImages.length - 1 ? 0 : prev + 1));
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>
                <div className="rb-accom-info">
                  <h3>🏨 SUREN INN BEACH RESORT</h3>
                  <div className="rb-price-rows">
                    <div className="rb-price-row">
                      <span>Weekday (Mon–Thu)</span>
                      <strong>₹11,000<small>/night</small></strong>
                    </div>
                    <div className="rb-price-row weekend">
                      <span>Weekend (Fri–Sun)</span>
                      <strong>₹13,000<small>/night</small></strong>
                    </div>
                  </div>
                  <ul className="rb-feature-list">
                    <li><CheckCircle size={14}/> Beachfront Stay</li>
                    <li><CheckCircle size={14}/> Comfortable Rooms</li>
                    <li><CheckCircle size={14}/> Family Friendly</li>
                    <li><CheckCircle size={14}/> Relaxing Environment</li>
                  </ul>
                </div>
              </div>

              {/* Villa Card */}
              <div
                className={`rb-accom-card ${form.accommodation_type === 'SUREN VILLA' ? 'selected' : ''}`}
                onClick={() => setForm(p => ({ ...p, accommodation_type: 'SUREN VILLA' }))}
              >
                <div className="rb-accom-img-carousel-container" onClick={(e) => e.stopPropagation()}>
                  <div 
                    className="rb-accom-img" 
                    style={{ 
                      backgroundImage: `url('${villaImages[currentVillaImgIndex]}')`,
                      transition: 'background-image 0.5s ease-in-out'
                    }}
                    onClick={() => setForm(p => ({ ...p, accommodation_type: 'SUREN VILLA' }))}
                  >
                    {form.accommodation_type === 'SUREN VILLA' && (
                      <div className="rb-selected-badge"><Check size={14}/> Selected</div>
                    )}
                  </div>
                  
                  {villaImages.length > 1 && (
                    <>
                      <button 
                        type="button"
                        className="carousel-arrow left"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentVillaImgIndex(prev => (prev === 0 ? villaImages.length - 1 : prev - 1));
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        type="button"
                        className="carousel-arrow right"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentVillaImgIndex(prev => (prev === villaImages.length - 1 ? 0 : prev + 1));
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>
                <div className="rb-accom-info">
                  <h3>🏡 SUREN VILLA</h3>
                  <div className="rb-price-rows">
                    <div className="rb-price-row">
                      <span>Weekday (Mon–Thu)</span>
                      <strong>₹10,000<small>/night</small></strong>
                    </div>
                    <div className="rb-price-row weekend">
                      <span>Weekend (Fri–Sun)</span>
                      <strong>₹12,000<small>/night</small></strong>
                    </div>
                  </div>
                  <ul className="rb-feature-list">
                    <li><CheckCircle size={14}/> Private Villa Experience</li>
                    <li><CheckCircle size={14}/> Spacious Rooms</li>
                    <li><CheckCircle size={14}/> Peaceful Environment</li>
                    <li><CheckCircle size={14}/> Premium Comfort</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="rb-nav">
              <div />
              <button
                className="rb-btn-next"
                disabled={!form.accommodation_type}
                onClick={() => setStep(2)}
              >
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Important Information ─── */}
        {step === 2 && (
          <div className="rb-card rb-fade-in">
            <div className="rb-notice-box">
              <div className="rb-notice-header">
                <AlertTriangle size={28} className="rb-notice-icon" />
                <h2>⚠️ Important Information</h2>
              </div>
              <div className="rb-notice-body">
                <div className="rb-notice-item primary">
                  <Home size={20} />
                  <span>The above charges include <strong>RESORT STAY ONLY.</strong></span>
                </div>
                <div className="rb-notice-item warning">
                  <span style={{ fontSize: '1.4rem' }}>🍽️</span>
                  <span><strong>Food is NOT included</strong> in the package.</span>
                </div>
                <div className="rb-notice-item">
                  <Info size={20} />
                  <span>Food requires <strong>separate payment</strong> at the resort.</span>
                </div>
                <div className="rb-notice-confirm">
                  <CheckCircle size={18} />
                  Please confirm the details before proceeding.
                </div>
              </div>
            </div>

            <div className="rb-selected-summary">
              <h3>Your Selection</h3>
              <div className="rb-summary-row">
                <span>Accommodation</span>
                <strong>{form.accommodation_type}</strong>
              </div>
            </div>

            <div className="rb-nav">
              <button className="rb-btn-back" onClick={() => setStep(1)}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="rb-btn-next" onClick={() => setStep(3)}>
                I Understand, Continue <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Customer Details ─── */}
        {step === 3 && (
          <div className="rb-card rb-fade-in">
            <h2 className="rb-section-title">Your Details</h2>
            <p className="rb-section-sub">Please fill in your personal and stay information.</p>

            <div className="rb-form-grid">
              <div className="rb-field">
                <label><User size={15} /> Full Name <span className="req">*</span></label>
                <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Enter your full name" className={errors.full_name ? 'error' : ''} />
                {errors.full_name && <span className="rb-err">{errors.full_name}</span>}
              </div>
              <div className="rb-field">
                <label><Phone size={15} /> Phone Number <span className="req">*</span></label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} className={errors.phone ? 'error' : ''} />
                {errors.phone && <span className="rb-err">{errors.phone}</span>}
              </div>
              <div className="rb-field rb-field-full">
                <label><Mail size={15} /> Email Address <span className="req">*</span></label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="your@email.com" className={errors.email ? 'error' : ''} />
                {errors.email && <span className="rb-err">{errors.email}</span>}
              </div>
              <div className="rb-field">
                <label><Users size={15} /> Number of Guests <span className="req">*</span></label>
                <input name="guests" type="number" min="1" max="50" value={form.guests} onChange={handleChange} className={errors.guests ? 'error' : ''} />
                {errors.guests && <span className="rb-err">{errors.guests}</span>}
              </div>

              <div className="rb-field">
                <label><Calendar size={15} /> Check-In Date <span className="req">*</span></label>
                <input name="check_in_date" type="date" min={today} value={form.check_in_date} onChange={handleChange} className={errors.check_in_date ? 'error' : ''} />
                {errors.check_in_date && <span className="rb-err">{errors.check_in_date}</span>}
              </div>
              <div className="rb-field">
                <label><Calendar size={15} /> Check-Out Date <span className="req">*</span></label>
                <input name="check_out_date" type="date" min={form.check_in_date || today} value={form.check_out_date} onChange={handleChange} className={errors.check_out_date ? 'error' : ''} />
                {errors.check_out_date && <span className="rb-err">{errors.check_out_date}</span>}
              </div>
              <div className="rb-field rb-field-full">
                <label><FileText size={15} /> Special Notes <span className="optional">(Optional)</span></label>
                <textarea name="special_notes" value={form.special_notes} onChange={handleChange} placeholder="Any special requirements or requests..." rows={3} />
              </div>
            </div>

            {/* Live Price Summary */}
            {pricing && (
              <div className="rb-price-summary">
                <h3>💰 Price Summary</h3>
                <div className="rb-price-breakdown">{pricing.breakdown}</div>
                <div className="rb-price-total">
                  <span>Total for {pricing.nights} night{pricing.nights > 1 ? 's' : ''}</span>
                  <strong>₹{pricing.total.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            )}

            <div className="rb-nav">
              <button className="rb-btn-back" onClick={() => setStep(2)}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="rb-btn-next" onClick={() => validateStep3() && setStep(4)}>
                Continue to Payment <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Payment ─── */}
        {step === 4 && (
          <div className="rb-card rb-fade-in">
            <h2 className="rb-section-title">Complete Payment</h2>
            <p className="rb-section-sub">Scan the QR code to pay and enter your UTR number below.</p>

            <div className="rb-payment-layout">
              {/* QR Section */}
              <div className="rb-qr-section">
                <div className="rb-qr-box">
                  <div className="rb-qr-placeholder">
                    <div className="rb-qr-inner">
                      <div className="rb-qr-icon">📱</div>
                      <p><strong>UPI QR Code</strong></p>
                      <p className="rb-qr-note">QR code will be placed here by the owner</p>
                    </div>
                  </div>
                </div>
                <div className="rb-payment-steps">
                  <div className="rb-pay-step"><span className="rb-pay-num">1</span> Scan the QR code</div>
                  <div className="rb-pay-step"><span className="rb-pay-num">2</span> Pay the exact amount</div>
                  <div className="rb-pay-step"><span className="rb-pay-num">3</span> Note your UTR number</div>
                  <div className="rb-pay-step"><span className="rb-pay-num">4</span> Enter UTR below</div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="rb-payment-info">
                <div className="rb-amount-due">
                  <span>Amount Due</span>
                  <strong>₹{pricing?.total.toLocaleString('en-IN') || '0'}</strong>
                </div>
                <div className="rb-booking-mini">
                  <div className="rb-mini-row"><span>Accommodation</span><strong>{form.accommodation_type}</strong></div>
                  <div className="rb-mini-row"><span>Check-In</span><strong>{formatDate(form.check_in_date)}</strong></div>
                  <div className="rb-mini-row"><span>Check-Out</span><strong>{formatDate(form.check_out_date)}</strong></div>
                  <div className="rb-mini-row"><span>Duration</span><strong>{pricing?.nights} night{(pricing?.nights || 0) > 1 ? 's' : ''}</strong></div>
                  <div className="rb-mini-row"><span>Guests</span><strong>{form.guests}</strong></div>
                </div>

                <div className="rb-field rb-utr-field">
                  <label><CreditCard size={15} /> UTR / Transaction Number <span className="req">*</span></label>
                  <input
                    name="utr_number"
                    value={form.utr_number}
                    onChange={handleChange}
                    placeholder="Enter 12-digit UTR number"
                    maxLength={12}
                    className={errors.utr_number ? 'error' : ''}
                  />
                  {errors.utr_number && <span className="rb-err">{errors.utr_number}</span>}
                  <p className="rb-utr-hint">⚠️ Your booking will only be confirmed after UTR verification by our team.</p>
                </div>

                {submitError && <div className="rb-submit-error">{submitError}</div>}
              </div>
            </div>

            <div className="rb-nav">
              <button className="rb-btn-back" onClick={() => setStep(3)}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="rb-btn-next rb-btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 size={18} className="rb-spin" /> Submitting...</> : <>Submit Booking <CheckCircle size={18} /></>}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 5: Confirmation + Ticket ─── */}
        {step === 5 && (
          <div className="rb-confirmation rb-fade-in">
            <div className="rb-success-banner" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#b45309' }}>
              <Clock size={52} style={{ color: '#d97706', marginBottom: '0.5rem' }} />
              <h2 style={{ color: '#92400e', marginBottom: '0.5rem' }}>Booking Request Submitted! ⏳</h2>
              <p style={{ color: '#b45309', margin: 0 }}>Your resort booking request has been successfully submitted and is pending verification. Once the administrator verifies your UTR, you can download your confirmed ticket from your profile dashboard.</p>
            </div>

            {/* Downloadable Ticket */}
            <div className="rb-ticket-wrapper">
              <div ref={ticketRef} className="rb-ticket">
                {/* Ticket Header */}
                <div className="rb-ticket-header">
                  <div className="rb-ticket-logo">
                    <span className="rb-logo-icon">🏖️</span>
                    <div>
                      <div className="rb-logo-title" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>BOOKING REQUEST ACKNOWLEDGEMENT</div>
                      <div className="rb-logo-sub">Suren Inn Beach Resort & Suren Villa</div>
                    </div>
                  </div>
                  <div className="rb-ticket-status">
                    <span className="rb-status-badge" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fcd34d' }}>PENDING VERIFICATION</span>
                  </div>
                </div>

                {/* Ticket Divider */}
                <div className="rb-ticket-divider">
                  <div className="rb-ticket-cut left" />
                  <div className="rb-ticket-dashes" />
                  <div className="rb-ticket-cut right" />
                </div>

                {/* Ticket Body */}
                <div className="rb-ticket-body">
                  <div className="rb-ticket-main">
                    <div className="rb-ticket-field wide">
                      <span className="rb-tf-label">BOOKING ID</span>
                      <span className="rb-tf-value bold green">{getBookingId(bookingId)}</span>
                    </div>
                    <div className="rb-ticket-field wide">
                      <span className="rb-tf-label">ACCOMMODATION</span>
                      <span className="rb-tf-value bold">{form.accommodation_type}</span>
                    </div>
                    <div className="rb-ticket-row">
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">GUEST NAME</span>
                        <span className="rb-tf-value">{form.full_name}</span>
                      </div>
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">PHONE</span>
                        <span className="rb-tf-value">{form.phone}</span>
                      </div>
                    </div>
                    <div className="rb-ticket-row">
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">CHECK-IN</span>
                        <span className="rb-tf-value">{formatDate(form.check_in_date)}</span>
                      </div>
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">CHECK-OUT</span>
                        <span className="rb-tf-value">{formatDate(form.check_out_date)}</span>
                      </div>
                    </div>
                    <div className="rb-ticket-row">
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">GUESTS</span>
                        <span className="rb-tf-value">{form.guests} Person{parseInt(form.guests) > 1 ? 's' : ''}</span>
                      </div>
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">NIGHTS</span>
                        <span className="rb-tf-value">{pricing?.nights || '-'} Night{(pricing?.nights || 0) > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="rb-ticket-row">
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">BOOKING DATE</span>
                        <span className="rb-tf-value">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      </div>
                      <div className="rb-ticket-field">
                        <span className="rb-tf-label">UTR NUMBER</span>
                        <span className="rb-tf-value">{form.utr_number}</span>
                      </div>
                    </div>
                    <div className="rb-ticket-amount-row">
                      <span className="rb-tf-label">TOTAL AMOUNT PAID</span>
                      <span className="rb-ticket-amount">₹{pricing?.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Footer */}
                <div className="rb-ticket-footer">
                  <p>📍 Beachfront Location | 🕐 Check-in: 12:00 PM | 🍽️ Food Not Included</p>
                  <p style={{ color: '#d97706', fontWeight: 'bold' }}>⚠️ Booking is NOT confirmed. Confirmed ticket will be available on approval.</p>
                </div>
              </div>

              <div className="rb-download-actions">
                <button className="rb-btn-download" onClick={handleDownloadTicket} style={{ background: '#d97706' }}>
                  <Download size={20} /> Download Acknowledgement
                </button>
                <Link href="/tools" className="rb-btn-back-home">
                  <ArrowLeft size={18} /> Back to Resort Page
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        /* ─── Resort Booking Page Styles ─── */
        .rb-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #e8f5e9 100%);
          font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
          padding-bottom: 4rem;
        }

        .rb-header {
          background: white;
          border-bottom: 1px solid rgba(34,197,94,0.15);
          padding: 1rem 1.5rem;
          box-shadow: 0 2px 20px rgba(0,0,0,0.05);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .rb-header-inner {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .rb-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #22c55e;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid rgba(34,197,94,0.3);
          transition: all 0.2s;
          white-space: nowrap;
        }

        .rb-back-btn:hover {
          background: #f0fdf4;
        }

        .rb-header-title h1 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
        }

        .rb-header-title p {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 2px 0 0 0;
        }

        .rb-content {
          max-width: 900px;
          margin: 2rem auto;
          padding: 0 1.5rem;
        }

        /* Step Indicator */
        .rb-step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2rem;
          gap: 0;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        .rb-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
        }

        .rb-step-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
          background: #e5e7eb;
          color: #9ca3af;
          border: 2px solid #e5e7eb;
          transition: all 0.3s;
          z-index: 2;
        }

        .rb-step-circle.active {
          background: #22c55e;
          color: white;
          border-color: #22c55e;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.2);
        }

        .rb-step-circle.completed {
          background: #16a34a;
          color: white;
          border-color: #16a34a;
        }

        .rb-step-label {
          font-size: 0.72rem;
          color: #9ca3af;
          margin-top: 6px;
          text-align: center;
          font-weight: 500;
          width: 70px;
        }

        .rb-step-label.active {
          color: #22c55e;
          font-weight: 700;
        }

        .rb-step-line {
          width: 60px;
          height: 2px;
          background: #e5e7eb;
          position: absolute;
          top: 18px;
          left: calc(50% + 18px);
          transition: background 0.3s;
        }

        .rb-step-line.completed {
          background: #22c55e;
        }

        /* Card */
        .rb-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          border: 1px solid rgba(34,197,94,0.08);
        }

        .rb-fade-in {
          animation: rbFadeIn 0.4s ease-out forwards;
        }

        @keyframes rbFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .rb-section-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .rb-section-sub {
          color: #6b7280;
          margin: 0 0 2rem 0;
          font-size: 1rem;
        }

        /* Accommodation Cards */
        .rb-accom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .rb-accom-card {
          border: 2px solid #e5e7eb;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          background: white;
        }

        .rb-accom-card:hover {
          border-color: #22c55e;
          transform: translateY(-4px);
          box-shadow: 0 12px 30px rgba(34,197,94,0.15);
        }

        .rb-accom-card.selected {
          border-color: #22c55e;
          box-shadow: 0 8px 30px rgba(34,197,94,0.2);
        }

        .rb-accom-img {
          height: 180px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .rb-accom-img-carousel-container {
          position: relative;
          height: 180px;
          overflow: hidden;
          width: 100%;
        }
        
        .rb-accom-img-carousel-container .rb-accom-img {
          height: 100%;
          width: 100%;
        }
        
        .carousel-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0, 0, 0, 0.4);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
          z-index: 10;
        }
        
        .carousel-arrow:hover {
          background: rgba(0, 0, 0, 0.7);
          transform: translateY(-50%) scale(1.1);
        }
        
        .carousel-arrow:active {
          transform: translateY(-50%) scale(0.95);
        }
        
        .carousel-arrow.left {
          left: 10px;
        }
        
        .carousel-arrow.right {
          right: 10px;
        }

        .rb-selected-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: #22c55e;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .rb-accom-info {
          padding: 1.25rem;
        }

        .rb-accom-info h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 1rem 0;
          line-height: 1.3;
        }

        .rb-price-rows {
          background: #f0fdf4;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1rem;
          border-left: 3px solid #22c55e;
        }

        .rb-price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: #4b5563;
          padding-bottom: 8px;
        }

        .rb-price-row.weekend {
          padding-top: 8px;
          border-top: 1px dashed rgba(34,197,94,0.3);
          padding-bottom: 0;
        }

        .rb-price-row strong {
          font-size: 1rem;
          color: #166534;
          font-weight: 800;
        }

        .rb-price-row small {
          font-size: 0.75rem;
          font-weight: 400;
          color: #6b7280;
          margin-left: 2px;
        }

        .rb-feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rb-feature-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #4b5563;
        }

        .rb-feature-list li svg {
          color: #22c55e;
          flex-shrink: 0;
        }

        /* Notice Box */
        .rb-notice-box {
          background: linear-gradient(135deg, #fffbeb, #fff7ed);
          border: 2px solid #f59e0b;
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .rb-notice-header {
          background: #f59e0b;
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 12px;
          color: white;
        }

        .rb-notice-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 800;
          color: white;
        }

        .rb-notice-icon {
          color: white;
          flex-shrink: 0;
        }

        .rb-notice-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rb-notice-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: white;
          font-size: 1rem;
          color: #374151;
          border: 1px solid rgba(0,0,0,0.06);
        }

        .rb-notice-item.primary {
          border-color: rgba(34,197,94,0.3);
        }

        .rb-notice-item.warning {
          border-color: rgba(239,68,68,0.3);
          background: #fff5f5;
        }

        .rb-notice-item svg {
          color: #22c55e;
          flex-shrink: 0;
        }

        .rb-notice-confirm {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #166534;
          font-weight: 600;
          background: #f0fdf4;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          border: 1px solid rgba(34,197,94,0.3);
        }

        .rb-notice-confirm svg {
          color: #22c55e;
        }

        .rb-selected-summary {
          background: #f0fdf4;
          border-radius: 12px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          border: 1px solid rgba(34,197,94,0.2);
        }

        .rb-selected-summary h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #166534;
          margin: 0 0 0.5rem 0;
        }

        .rb-summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          color: #374151;
        }

        .rb-summary-row strong {
          font-weight: 700;
          color: #1f2937;
        }

        /* Form Styles */
        .rb-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .rb-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .rb-field-full {
          grid-column: 1 / -1;
        }

        .rb-field label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
        }

        .rb-field label svg {
          color: #22c55e;
        }

        .req {
          color: #ef4444;
        }

        .optional {
          color: #9ca3af;
          font-weight: 400;
        }

        .rb-field input,
        .rb-field select,
        .rb-field textarea {
          padding: 10px 14px;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.95rem;
          color: #1f2937;
          background: white;
          transition: border-color 0.2s;
          font-family: inherit;
          outline: none;
        }

        .rb-field input:focus,
        .rb-field select:focus,
        .rb-field textarea:focus {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.1);
        }

        .rb-field input.error,
        .rb-field select.error,
        .rb-field textarea.error {
          border-color: #ef4444;
        }

        .rb-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .rb-err {
          font-size: 0.8rem;
          color: #ef4444;
          font-weight: 500;
        }

        /* Price Summary */
        .rb-price-summary {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid rgba(34,197,94,0.3);
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 1.5rem;
        }

        .rb-price-summary h3 {
          font-size: 1rem;
          font-weight: 700;
          color: #166534;
          margin: 0 0 0.5rem 0;
        }

        .rb-price-breakdown {
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 0.75rem;
        }

        .rb-price-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px dashed rgba(34,197,94,0.4);
          padding-top: 0.75rem;
        }

        .rb-price-total span {
          font-size: 0.95rem;
          color: #374151;
          font-weight: 600;
        }

        .rb-price-total strong {
          font-size: 1.5rem;
          font-weight: 800;
          color: #166534;
        }

        /* Payment Layout */
        .rb-payment-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .rb-qr-section {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .rb-qr-box {
          background: white;
          border: 2px dashed rgba(34,197,94,0.4);
          border-radius: 20px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 220px;
        }

        .rb-qr-inner {
          text-align: center;
          color: #6b7280;
        }

        .rb-qr-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .rb-qr-inner p {
          margin: 4px 0;
          font-size: 0.9rem;
        }

        .rb-qr-note {
          font-size: 0.8rem !important;
          color: #9ca3af !important;
        }

        .rb-payment-steps {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .rb-pay-step {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .rb-pay-num {
          width: 24px;
          height: 24px;
          background: #22c55e;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .rb-payment-info {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .rb-amount-due {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rb-amount-due span {
          font-size: 0.9rem;
          font-weight: 600;
          opacity: 0.9;
        }

        .rb-amount-due strong {
          font-size: 1.75rem;
          font-weight: 800;
        }

        .rb-booking-mini {
          background: #f8fafc;
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .rb-mini-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .rb-mini-row span {
          color: #6b7280;
        }

        .rb-mini-row strong {
          color: #1f2937;
          font-weight: 600;
          text-align: right;
        }

        .rb-utr-field {
          width: 100%;
        }

        .rb-utr-hint {
          font-size: 0.78rem;
          color: #f59e0b;
          margin-top: 4px;
          line-height: 1.4;
        }

        .rb-submit-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Navigation Buttons */
        .rb-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          gap: 1rem;
        }

        .rb-btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #374151;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }

        .rb-btn-back:hover {
          border-color: #22c55e;
          color: #22c55e;
        }

        .rb-btn-next {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          box-shadow: 0 4px 15px rgba(34,197,94,0.3);
        }

        .rb-btn-next:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34,197,94,0.4);
        }

        .rb-btn-next:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rb-btn-submit {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }

        .rb-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Confirmation */
        .rb-confirmation {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .rb-success-banner {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border-radius: 24px;
          padding: 2.5rem;
          text-align: center;
          box-shadow: 0 8px 30px rgba(34,197,94,0.3);
        }

        .rb-success-banner svg {
          margin-bottom: 1rem;
          opacity: 0.95;
        }

        .rb-success-banner h2 {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 0.5rem 0;
        }

        .rb-success-banner p {
          font-size: 1rem;
          opacity: 0.9;
          margin: 0;
        }

        /* Ticket */
        .rb-ticket-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .rb-ticket {
          background: white;
          border-radius: 24px;
          box-shadow: 0 10px 50px rgba(0,0,0,0.1);
          overflow: hidden;
          width: 100%;
          max-width: 680px;
          border: 1px solid rgba(34,197,94,0.15);
          font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
        }

        .rb-ticket-header {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          padding: 1.5rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .rb-ticket-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .rb-logo-icon {
          font-size: 2.5rem;
        }

        .rb-logo-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: white;
          letter-spacing: 0.3px;
        }

        .rb-logo-sub {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.8);
          margin-top: 2px;
        }

        .rb-status-badge {
          background: white;
          color: #16a34a;
          padding: 6px 16px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 0.5px;
        }

        .rb-ticket-divider {
          display: flex;
          align-items: center;
          position: relative;
          height: 2px;
          background: #f0fdf4;
          margin: 0;
        }

        .rb-ticket-cut {
          width: 24px;
          height: 24px;
          background: #f0fdf4;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          border: 2px solid rgba(34,197,94,0.2);
        }

        .rb-ticket-cut.left { left: -12px; }
        .rb-ticket-cut.right { right: -12px; }

        .rb-ticket-dashes {
          flex: 1;
          border-top: 2px dashed rgba(34,197,94,0.3);
          margin: 0 20px;
        }

        .rb-ticket-body {
          padding: 1.5rem 2rem;
        }

        .rb-ticket-main {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .rb-ticket-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .rb-ticket-field.wide {
          grid-column: 1 / -1;
        }

        .rb-ticket-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .rb-tf-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #9ca3af;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .rb-tf-value {
          font-size: 0.95rem;
          color: #1f2937;
          font-weight: 500;
        }

        .rb-tf-value.bold {
          font-weight: 700;
          font-size: 1rem;
        }

        .rb-tf-value.green {
          color: #22c55e;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .rb-ticket-amount-row {
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border: 1px solid rgba(34,197,94,0.3);
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }

        .rb-tf-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #6b7280;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }

        .rb-ticket-amount {
          font-size: 1.6rem;
          font-weight: 800;
          color: #16a34a;
        }

        .rb-ticket-footer {
          background: #f0fdf4;
          padding: 1rem 2rem;
          text-align: center;
          border-top: 1px solid rgba(34,197,94,0.15);
        }

        .rb-ticket-footer p {
          font-size: 0.78rem;
          color: #6b7280;
          margin: 3px 0;
          line-height: 1.4;
        }

        /* Download */
        .rb-download-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .rb-btn-download {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 28px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          font-family: inherit;
          box-shadow: 0 4px 15px rgba(34,197,94,0.3);
        }

        .rb-btn-download:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34,197,94,0.4);
        }

        .rb-btn-back-home {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 24px;
          border: 1.5px solid #e5e7eb;
          background: white;
          color: #374151;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s;
        }

        .rb-btn-back-home:hover {
          border-color: #22c55e;
          color: #22c55e;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .rb-content { padding: 0 1rem; margin: 1rem auto; }
          .rb-card { padding: 1.5rem; border-radius: 18px; }
          .rb-accom-grid { grid-template-columns: 1fr; }
          .rb-form-grid { grid-template-columns: 1fr; }
          .rb-field-full { grid-column: 1; }
          .rb-payment-layout { grid-template-columns: 1fr; }
          .rb-ticket-row { grid-template-columns: 1fr; }
          .rb-step-indicator { justify-content: flex-start; padding: 0 0.5rem 0.5rem; }
          .rb-step-line { width: 40px; }
          .rb-section-title { font-size: 1.4rem; }
          .rb-header-title h1 { font-size: 1rem; }
          .rb-ticket-header { flex-direction: column; gap: 1rem; text-align: center; }
          .rb-ticket-body { padding: 1.25rem; }
          .rb-nav { flex-direction: column-reverse; }
          .rb-btn-next, .rb-btn-back { width: 100%; justify-content: center; }
          .rb-success-banner h2 { font-size: 1.5rem; }
          .rb-download-actions { flex-direction: column; width: 100%; }
          .rb-btn-download, .rb-btn-back-home { width: 100%; justify-content: center; }
        }

        @media (max-width: 480px) {
          .rb-step-label { width: 55px; font-size: 0.65rem; }
          .rb-step-line { width: 25px; }
        }
      `}</style>
    </div>
    </AuthGuard>
  );
}
