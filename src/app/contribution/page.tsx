'use client';

import { useState, useEffect } from 'react';
import { 
  Heart, Users, Star, ArrowRight, Gift, HandHeart, Sparkles, 
  CheckCircle2, ChevronRight, Upload, Loader2, ShieldCheck, Check 
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '../components/AuthGuard';

export default function ContributionPage() {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');

  // Form Field States
  const [supporterName, setSupporterName] = useState('');
  const [vpName, setVpName] = useState('');
  const [vpImage, setVpImage] = useState<File | null>(null);
  const [vpImageUrl, setVpImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [designation, setDesignation] = useState('Chief Executive Director');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Payment States
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState('');
  const [upiConfig, setUpiConfig] = useState({ 
    upiId: '8637684229-3@ybl', 
    upiName: 'david', 
    upiQrUrl: '/upi-qr-code.jpg?v=2' 
  });

  // Fetch Live UPI configurations on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch('/api/admin/configs');
        if (res.ok) {
          const data = await res.json();
          const upiId = data.configs.find((c: any) => c.key === 'upi_id')?.value || '8637684229-3@ybl';
          const upiName = data.configs.find((c: any) => c.key === 'upi_name')?.value || 'david';
          const upiQrUrl = data.configs.find((c: any) => c.key === 'upi_qr_url')?.value || '/upi-qr-code.jpg?v=2';
          setUpiConfig({ upiId, upiName, upiQrUrl });
        }
      } catch (err) {
        console.error('Failed to load UPI configurations:', err);
      }
    };
    fetchConfigs();
  }, []);

  // Handle live image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (under 3MB)
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFormErrors((prev) => ({
        ...prev,
        vpImage: 'Image size must be under 3MB.',
      }));
      return;
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormErrors((prev) => ({
        ...prev,
        vpImage: 'Only JPG, JPEG, PNG, and WEBP image uploads are allowed.',
      }));
      return;
    }

    setVpImage(file);
    const localUrl = URL.createObjectURL(file);
    setVpImageUrl(localUrl); // Temporarily set local preview URL

    setIsUploadingImage(true);
    setFormErrors((prev) => {
      const copy = { ...prev };
      delete copy.vpImage;
      return copy;
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/bookings/upload-proof', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to upload image to server');
      }

      const data = await res.json();
      setVpImageUrl(data.url); // Set public uploaded URL
      console.log('Your Image uploaded successfully. URL:', data.url);
    } catch (err: any) {
      console.error('Error uploading Your Image:', err);
      setFormErrors((prev) => ({
        ...prev,
        vpImage: err.message || 'Failed to upload image. Please try again.',
      }));
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Continue action & validations
  const handleContinue = () => {
    const errors: Record<string, string> = {};
    if (!supporterName.trim()) {
      errors.supporterName = 'Supporter Name is required.';
    }
    if (!vpName.trim()) {
      errors.vpName = 'VP Name is required.';
    }
    if (!vpImageUrl) {
      errors.vpImage = 'Your Image is required.';
    } else if (isUploadingImage) {
      errors.vpImage = 'Your Image is still uploading. Please wait.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Price calculations
  // Chief Executive Director: Base ₹1000
  // Executive Director: Base ₹500
  const basePrice = designation === 'Chief Executive Director' ? 1000 : 500;
  const gstAmount = 0;
  const totalPrice = basePrice;

  // QR Code
  const qrImageUrl = '/UPIs/contribution-qr.jpg';

  const validateUTR = (val: string) => {
    return /^[0-9]{12}$/.test(val);
  };

  // Submit payment confirmation
  const handleConfirmContribution = async () => {
    if (!validateUTR(utrNumber)) {
      setUtrError('Please enter a valid 12-digit UTR reference ID.');
      return;
    }

    setIsSubmitting(true);
    const randSuffix = Math.floor(100000 + Math.random() * 900000);
    const newBookingId = `SUP-${new Date().getFullYear()}-${randSuffix}`;
    const formattedDate = new Date().toISOString().split('T')[0];
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let userId = null;
    let userEmail = null;
    let username = null;
    let userPhone = '';
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          userId = parsed.id || null;
          userEmail = parsed.email || null;
          username = parsed.username || null;
          userPhone = parsed.phone || '';
        } catch (e) {
          console.error('Failed to parse user in contribution page:', e);
        }
      }
    }

    const attendeesObj = {
      "SUPPORTER": {
        name: supporterName,
        whatsapp: userPhone,
        vpName: vpName,
        vpImage: vpImageUrl,
        designation: designation
      }
    };

    const payload = {
      bookingId: newBookingId,
      eventId: `contribution_${designation.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      eventName: `Success Team System Supporter - ${designation}`,
      seminarId: `contribution_${designation.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      seminarName: `Success Team System Supporter - ${designation}`,
      venue: 'Contribution Page',
      seminar: 'System Supporter',
      date: formattedDate,
      time: formattedTime,
      seats: ['SUPPORTER'],
      totalPrice,
      screenshot: `UTR:${utrNumber}`,
      attendeeDetails: attendeesObj,
      bookerName: supporterName,
      bookerMemberId: 'SUPPORTER',
      bookerPhone: userPhone,
      bookerVpName: vpName,
      utrNumber,
      userId,
      userEmail,
      username,
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server rejected the contribution request');
      }

      setBookingId(newBookingId);
      setStep('success');
      setIsSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Contribution submission failed:', err);
      alert(`Submission Failed: ${err.message || String(err)}`);
      setIsSubmitting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="contribution-page">
      {/* ── STEP 2: Payment Page ── */}
      {step === 'payment' && (
        <section className="supporter-payment-section container animate-fade-in">
          <div className="payment-container glass-card" style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #d1fae5' }}>
            <h2 className="payment-title">Complete Supporter Payment</h2>
            <p className="payment-subtitle">Verify your supporter summary, scan the UPI QR code and submit your payment receipt UTR.</p>

            <div className="payment-split">
              {/* Left Panel: Summary & UTR input */}
              <div className="payment-left-panel">
                <div className="summary-card" style={{ background: '#ffffff', borderColor: '#a7f3d0' }}>
                  <div className="summary-head" style={{ color: '#047857', borderBottomColor: '#ecfdf5' }}>Supporter Receipt Details</div>
                  
                  <div className="summary-row">
                    <span>Supporter Program:</span>
                    <span className="summary-val">Success Team System Supporter</span>
                  </div>
                  <div className="summary-row">
                    <span>Designation Tier:</span>
                    <span className="summary-val" style={{ fontWeight: 800, color: '#047857' }}>{designation}</span>
                  </div>
                  <div className="summary-row">
                    <span>Supporter Name:</span>
                    <span className="summary-val">{supporterName}</span>
                  </div>
                  <div className="summary-row">
                    <span>VP Name:</span>
                    <span className="summary-val">{vpName}</span>
                  </div>

                  <div className="summary-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginTop: '4px' }}>
                    <span style={{ color: '#6b7280' }}>Your image:</span>
                    <img 
                      src={vpImageUrl} 
                      alt="Uploaded VP" 
                      style={{ 
                        width: '90px', 
                        height: '90px', 
                        borderRadius: '12px', 
                        objectFit: 'cover', 
                        border: '2px solid #10b981',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.1)'
                      }} 
                    />
                  </div>

                  <div className="summary-divider" style={{ margin: '1rem 0' }} />

                  <div className="summary-row">
                    <span>Contribution Amount:</span>
                    <span className="summary-val">₹{basePrice}</span>
                  </div>
                  <div className="summary-divider" style={{ margin: '1rem 0' }} />
                  <div className="summary-total-row">
                    <span>Payable Grand Total:</span>
                    <span className="summary-total-val" style={{ color: '#10b981', fontSize: '1.4rem' }}>₹{totalPrice}</span>
                  </div>
                </div>

                {/* UTR Input Section */}
                <div className="utr-section">
                  <label className="utr-header">
                    <span>UPI Transaction Reference (UTR) <span className="upload-required-badge">Required</span></span>
                  </label>
                  <p className="utr-desc">
                    After completing payment via GPay, PhonePe, or any UPI app, enter the <strong>12-digit UTR / Transaction ID</strong> shown in your payment receipt.
                  </p>
                  <div className="utr-input-wrap">
                    <span className="utr-input-icon">🔢</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Enter 12-digit UTR"
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
                  
                  {/* UTR character pip indicators */}
                  <div className="utr-pips">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span
                        key={i}
                        className={`char-pip ${i < utrNumber.length ? 'char-pip-filled' : ''}`}
                      />
                    ))}
                    <span className="pips-count" style={{ fontSize: '0.75rem', marginLeft: 'auto', fontWeight: 'bold', color: '#6b7280' }}>
                      {utrNumber.length}/12
                    </span>
                  </div>
                  {utrError && <span className="utr-error-text">⚠️ {utrError}</span>}
                  {validateUTR(utrNumber) && (
                    <div className="utr-valid-badge animate-fade-in">
                      ✓ UTR entered — ready to submit for verification
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel: QR Code and Payee Details */}
              <div className="payment-right-panel">
                <div className="qr-container-box">
                  <div className="qr-image-wrap">
                    <img src={qrImageUrl} alt={`UPI QR Code for ₹${totalPrice}`} className="payment-qr-img" />
                  </div>
                  <div className="qr-pay-caption">Scan this UPI QR code to transfer ₹{totalPrice}</div>
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
                    <span className="upi-label">Amount Payable</span>
                    <strong className="upi-value" style={{ color: '#10b981', fontSize: '1.1rem' }}>₹{totalPrice}</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="confirm-actions" style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', justifyContent: 'center', width: '100%' }}>
              <button 
                className="contrib-cta-btn-outline" 
                onClick={() => setStep('form')} 
                style={{ borderRadius: '10px', padding: '0.75rem 2rem', fontWeight: 'bold' }}
              >
                ← Back
              </button>
              <button
                className="contrib-cta-btn"
                onClick={handleConfirmContribution}
                disabled={isSubmitting}
                style={{ borderRadius: '10px', padding: '0.75rem 2.5rem', fontWeight: 'bold' }}
              >
                {isSubmitting ? 'Submitting Registration...' : 'Submit for Approval →'}
              </button>
            </div>
            
            {!validateUTR(utrNumber) && (
              <div className="proof-required-notice" style={{ textAlign: 'center', marginTop: '1rem', color: '#b45309', fontSize: '0.82rem', fontWeight: 'bold' }}>
                ⚠️ Please complete payment and enter the 12-digit UTR above to enable submission.
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── STEP 3: Success Confirmation Screen ── */}
      {step === 'success' && (
        <section className="supporter-success-section container animate-fade-in">
          <div className="success-step glass-card" style={{ background: '#ffffff', borderRadius: '24px', border: '1.5px solid #d1fae5', padding: '3rem 2rem' }}>
            <div className="success-hero-banner" style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: '1.5rem' }}>
              <div className="success-anim-container">
                <div className="success-ring ring-outer" />
                <div className="success-ring ring-mid" />
                <div className="success-ring ring-inner" />
                <div className="success-check-wrap">
                  <CheckCircle2 size={52} strokeWidth={2.5} />
                </div>
              </div>
              
              <h2 className="success-title" style={{ fontSize: '1.8rem', fontWeight: '800', color: '#111827', marginTop: '1rem' }}>
                Supporter Registration Registered!
              </h2>
              <p className="success-sub" style={{ color: '#6b7280', fontSize: '0.92rem', marginTop: '0.5rem', maxWidth: '460px' }}>
                Thank you for contributing to the Success Team mission. Your registration has been received and sent to the admin.
              </p>
              
              <div className="booking-id-display" style={{ background: '#ecfdf5', color: '#047857', border: '1.5px solid #10b981', padding: '8px 24px', borderRadius: '12px', fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: '800', marginTop: '1.5rem' }}>
                {bookingId}
              </div>
              
              <div className="approval-waiting-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '6px 16px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '1.25rem' }}>
                <span className="waiting-pulse-dot" style={{ width: '8px', height: '8px', background: '#d97706', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                <span>Awaiting Admin Verification</span>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ── LEGACY LANDING CONTENT (Only displayed during Form Registration) ── */}
      {step === 'form' && (
        <>
          {/* Hero */}
          <section className="contrib-hero">
            <div className="container contrib-hero-inner">
              <span className="contrib-kicker">
                <Heart size={14} /> Community First
              </span>
              <h1 className="contrib-hero-title">
                Make a <span className="contrib-accent">Contribution</span>
              </h1>
              <p className="contrib-hero-subtitle">
                Your contribution powers our leadership programs, chapter meetups, and community growth initiatives across Tamil Nadu and beyond.
              </p>
              <div className="contrib-hero-actions">
                <a href="#register-supporter" className="contrib-cta-btn">
                  <Sparkles size={17} /> Register as System Supporter
                </a>
              </div>
            </div>
          </section>

          {/* Why Contribute */}
          <section className="contrib-why container">
            <div className="contrib-section-header">
              <span className="contrib-eyebrow">Why It Matters</span>
              <h2 className="contrib-section-title">Your support drives real change</h2>
              <p className="contrib-section-sub">
                Every contribution goes directly toward enabling more members to attend seminars, access leadership resources, and grow their businesses.
              </p>
            </div>

            <div className="contrib-cards-grid">
              <div className="contrib-card">
                <div className="contrib-card-icon">
                  <Users size={28} />
                </div>
                <h3>Member Growth</h3>
                <p>Help fund subsidized seats for members who cannot afford full registration — growing the community together.</p>
              </div>

              <div className="contrib-card">
                <div className="contrib-card-icon">
                  <Star size={28} />
                </div>
                <h3>Quality Programs</h3>
                <p>Contributions enable higher-quality speakers, venues, and resources for all Success Team leadership events.</p>
              </div>

              <div className="contrib-card">
                <div className="contrib-card-icon">
                  <Gift size={28} />
                </div>
                <h3>Recognition &amp; Rewards</h3>
                <p>Top contributors receive special recognition, priority seat access, and exclusive community benefits.</p>
              </div>

              <div className="contrib-card">
                <div className="contrib-card-icon">
                  <HandHeart size={28} />
                </div>
                <h3>Community Impact</h3>
                <p>Be part of the mission to build India&apos;s strongest entrepreneurial leadership network, chapter by chapter.</p>
              </div>
            </div>
          </section>

          {/* How to Contribute */}
          <section className="contrib-how">
            <div className="container contrib-how-inner">
              <div className="contrib-section-header" style={{ color: 'white' }}>
                <span className="contrib-eyebrow" style={{ color: '#bbf7d0' }}>How to Contribute</span>
                <h2 className="contrib-section-title" style={{ color: 'white' }}>Simple steps to make an impact</h2>
              </div>
              <div className="contrib-steps">
                <div className="contrib-step">
                  <div className="step-num">1</div>
                  <div>
                    <h4>Choose Your Amount</h4>
                    <p>Any amount makes a difference. Start with as little as ₹100.</p>
                  </div>
                </div>
                <div className="contrib-step-arrow"><ArrowRight size={20} /></div>
                <div className="contrib-step">
                  <div className="step-num">2</div>
                  <div>
                    <h4>Pay via UPI</h4>
                    <p>Scan our UPI QR code or transfer directly to our verified account.</p>
                  </div>
                </div>
                <div className="contrib-step-arrow"><ArrowRight size={20} /></div>
                <div className="contrib-step">
                  <div className="step-num">3</div>
                  <div>
                    <h4>Share Your UTR</h4>
                    <p>Send your 12-digit UTR transaction ID to our team via WhatsApp for confirmation.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Supporter Registration Form placed at last */}
          <section className="supporter-form-section container" id="register-supporter" style={{ marginTop: '2.5rem' }}>
            <div className="supporter-card glass-card" style={{ border: '2.5px solid #10b981', boxShadow: '0 20px 40px rgba(16, 185, 129, 0.08)' }}>
              <span className="contrib-kicker" style={{ color: '#10b981', border: '1px solid #10b981', background: '#ecfdf5', marginBottom: '0.75rem' }}>
                <Heart size={13} style={{ fill: '#10b981' }} /> Ready to Contribute?
              </span>
              <h2 className="supporter-section-title">Success Team Supporter Registration</h2>
              <p className="supporter-section-desc">
                Fill in your details below to register as an official system supporter. Select your designation tier to continue to payment.
              </p>

              <div className="supporter-form-grid">
                {/* Supporter Name */}
                <div className="form-group form-group-name">
                  <label className="form-label">Supporter Name <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter supporter name"
                    value={supporterName}
                    onChange={(e) => {
                      setSupporterName(e.target.value);
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.supporterName;
                          return copy;
                        });
                      }
                    }}
                    className={`form-control ${formErrors.supporterName ? 'is-invalid' : ''}`}
                  />
                  {formErrors.supporterName && <span className="error-text">⚠️ {formErrors.supporterName}</span>}
                </div>

                {/* VP Name */}
                <div className="form-group form-group-vp">
                  <label className="form-label">VP Name <span className="req">*</span></label>
                  <input
                    type="text"
                    placeholder="Enter VP name"
                    value={vpName}
                    onChange={(e) => {
                      setVpName(e.target.value);
                      if (e.target.value.trim()) {
                        setFormErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.vpName;
                          return copy;
                        });
                      }
                    }}
                    className={`form-control ${formErrors.vpName ? 'is-invalid' : ''}`}
                  />
                  {formErrors.vpName && <span className="error-text">⚠️ {formErrors.vpName}</span>}
                </div>

                {/* Designation */}
                <div className="form-group form-group-designation">
                  <label className="form-label">Designation <span className="req">*</span></label>
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="form-control select-control"
                  >
                    <option value="Chief Executive Director">Star / Chief Executive Director (₹1000)</option>
                    <option value="Executive Director">Star / Executive Director (₹500)</option>
                  </select>
                </div>

                {/* VP Image Upload */}
                <div className="form-group form-group-image">
                  <label className="form-label">Your Image <span className="req">*</span></label>
                  <div className="file-uploader-box">
                    {vpImageUrl ? (
                      <div className="image-preview-container">
                        <img src={vpImageUrl} alt="VP Preview" className="uploaded-vp-img" />
                        <div className="image-preview-overlay">
                          {isUploadingImage ? (
                            <div className="upload-loader">
                              <Loader2 className="spinner-icon" />
                              <span>Uploading to storage...</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setVpImageUrl('');
                                setVpImage(null);
                              }}
                              className="change-img-btn"
                            >
                              Change Image
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <label className="drag-drop-label">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden-file-input"
                        />
                        <div className="uploader-icon-wrap">
                          <Upload size={24} />
                        </div>
                        <span className="uploader-title">Upload Your Image</span>
                        <span className="uploader-sub">JPG, PNG, JPEG or WEBP (Max 3MB)</span>
                      </label>
                    )}
                  </div>
                  {formErrors.vpImage && <span className="error-text">⚠️ {formErrors.vpImage}</span>}
                </div>
              </div>

              <div className="form-actions-wrap">
                <button
                  type="button"
                  onClick={handleContinue}
                  className="form-continue-btn"
                  disabled={isUploadingImage}
                >
                  {isUploadingImage ? 'Uploading Image...' : 'Continue to Payment →'}
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Styled JSX Stylesheet */}
      <style>{`
        .contribution-page {
          min-height: 100vh;
          background: var(--background, #f9fafb);
          padding-bottom: 3rem;
        }

        /* Supporter registration form block */
        .supporter-form-section {
          padding: 2rem 1.5rem 1rem;
          max-width: 760px;
          margin: 0 auto;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1.5px solid #d1fae5;
          border-radius: 24px;
          padding: 2.5rem;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.06);
        }

        .supporter-section-title {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: 1.6rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.5rem;
        }

        .supporter-section-desc {
          font-size: 0.88rem;
          color: #6b7280;
          line-height: 1.55;
          margin: 0 0 2rem;
        }

        .supporter-form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 600px) {
          .supporter-form-grid {
            grid-template-columns: 1.2fr 1fr;
            grid-template-rows: auto auto auto;
            gap: 1.5rem;
          }
          .form-group-name {
            grid-row: 1;
            grid-column: 1;
          }
          .form-group-vp {
            grid-row: 2;
            grid-column: 1;
          }
          .form-group-designation {
            grid-row: 3;
            grid-column: 1;
          }
          .form-group-image {
            grid-row: 1 / span 3;
            grid-column: 2;
            display: flex;
            flex-direction: column;
            height: 100%;
          }
          .form-group-image .file-uploader-box {
            flex-grow: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .form-group-image .drag-drop-label {
            flex-grow: 1;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
          }
          .form-group-image .image-preview-container {
            height: 100%;
            min-height: 220px;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .form-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
          display: inline-flex;
          align-items: center;
        }

        .req {
          color: #ef4444;
          margin-left: 2px;
        }

        .form-control {
          height: 46px;
          padding: 0 1rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 10px;
          font-size: 0.92rem;
          color: #1f2937;
          background: #ffffff;
          outline: none;
          transition: all 0.2s;
        }

        .form-control:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
        }

        .form-control.is-invalid {
          border-color: #ef4444;
        }

        .select-control {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 1rem center;
          background-size: 1.15rem;
          padding-right: 2.5rem;
        }

        /* Uploader Box */
        .file-uploader-box {
          border: 2px dashed #a7f3d0;
          background: #f0fdf4;
          border-radius: 14px;
          min-height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          transition: all 0.2s;
        }

        .file-uploader-box:hover {
          border-color: #10b981;
          background: #ecfdf5;
        }

        .hidden-file-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: pointer;
          z-index: 5;
        }

        .drag-drop-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem;
          cursor: pointer;
        }

        .uploader-icon-wrap {
          color: #10b981;
          margin-bottom: 0.5rem;
        }

        .uploader-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #065f46;
        }

        .uploader-sub {
          font-size: 0.75rem;
          color: #6b7280;
          margin-top: 2px;
        }

        /* Image Preview Overlay */
        .image-preview-container {
          position: relative;
          width: 100%;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
        }

        .uploaded-vp-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-preview-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s;
          z-index: 10;
        }

        .image-preview-container:hover .image-preview-overlay {
          opacity: 1;
        }

        .change-img-btn {
          background: white;
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #1f2937;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 0.15s;
        }

        .change-img-btn:hover {
          transform: scale(1.05);
        }

        .upload-loader {
          color: white;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .form-actions-wrap {
          margin-top: 2rem;
          display: flex;
          justify-content: flex-end;
        }

        .form-continue-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.85rem 2.25rem;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .form-continue-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(16, 185, 129, 0.42);
        }

        .error-text {
          font-size: 0.78rem;
          color: #b91c1c;
          font-weight: 600;
          margin-top: 2px;
        }

        /* ── STEP 2 & 3 Payment container styles ── */
        .supporter-payment-section,
        .supporter-success-section {
          padding: 2.25rem 1.5rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .payment-container {
          padding: 2.5rem;
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
          line-height: 1.45;
        }

        .payment-split {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.75rem;
        }

        @media (min-width: 768px) {
          .payment-split {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }

        .payment-left-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Summary Card */
        .summary-card {
          background: white;
          border: 1.5px solid #a7f3d0;
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.04);
        }

        .summary-head {
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          color: #047857;
          border-bottom: 1.5px solid #ecfdf5;
          padding-bottom: 0.65rem;
          margin-bottom: 0.85rem;
          letter-spacing: 0.05em;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 7px 0;
          font-size: 0.88rem;
          color: #4b5563;
        }

        .summary-row span {
          color: #6b7280;
          font-weight: 500;
        }

        .summary-val {
          color: #111827;
          font-weight: 700;
          text-align: right;
        }

        .summary-divider {
          border-top: 1px dashed #e5e7eb;
        }

        .summary-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          font-weight: 800;
          color: #111827;
        }

        /* UTR Input Section */
        .utr-section {
          background: #ffffff;
          border: 1.5px solid #a7f3d0;
          border-radius: 16px;
          padding: 1.35rem;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06);
        }

        .utr-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 800;
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
          font-size: 1.1rem;
          margin-right: 0.5rem;
          flex-shrink: 0;
        }

        .utr-input-field {
          width: 100%;
          height: 46px;
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

        .char-pip {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e5e7eb;
          transition: background-color 0.15s;
        }

        .char-pip-filled {
          background: #10b981;
        }

        .utr-error-text {
          display: block;
          margin-top: 0.6rem;
          font-size: 0.78rem;
          color: #b91c1c;
          font-weight: 600;
        }

        .utr-valid-badge {
          margin-top: 0.65rem;
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
          padding: 12px;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.12);
          border: 2px solid #6ee7b7;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 280px;
          margin: 0 auto;
          box-sizing: border-box;
        }

        .payment-qr-img {
          width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 8px;
          transition: transform 0.25s ease;
        }

        .payment-qr-img:hover {
          transform: scale(1.04);
        }

        .qr-pay-caption {
          font-size: 0.82rem;
          font-weight: 700;
          color: #047857;
          text-align: center;
        }

        .upi-details-card {
          background: #ffffff;
          border: 1px solid #a7f3d0;
          border-radius: 16px;
          padding: 1.25rem;
          font-size: 0.85rem;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.04);
        }

        .upi-details-title {
          font-size: 0.78rem;
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
        }

        .upi-label {
          color: #6b7280;
          font-weight: 500;
        }

        .upi-value {
          color: #111827;
          font-weight: 700;
          text-align: right;
        }

        .upi-id-value {
          font-family: monospace;
          font-size: 0.82rem;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          color: #1f2937;
        }

        /* ── STEP 3: Success Confirmation Screen styles ── */
        .success-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .success-hero-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }

        .success-anim-container {
          position: relative;
          width: 100px;
          height: 100px;
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

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* ── Hero & Legacy styles ── */
        .contrib-hero {
          background: linear-gradient(135deg, #10b981 0%, #059669 55%, #065f46 100%);
          padding: 4.5rem 1.5rem 5.5rem;
          position: relative;
          overflow: hidden;
          color: white;
        }

        .contrib-hero::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 80px;
          background: linear-gradient(180deg, transparent, rgba(249,250,251,0.98));
          pointer-events: none;
        }

        .contrib-hero-inner {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .contrib-kicker {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          border: 1px solid rgba(255,255,255,0.3);
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #d1fae5;
          margin-bottom: 1.25rem;
        }

        .contrib-hero-title {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 1.1rem;
          color: white;
        }

        .contrib-accent {
          color: #bbf7d0;
        }

        .contrib-hero-subtitle {
          font-size: 1.02rem;
          color: #d1fae5;
          line-height: 1.7;
          margin: 0 0 2rem;
        }

        .contrib-hero-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* Why Section */
        .contrib-why {
          padding: 4rem 1.5rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .contrib-section-header {
          text-align: center;
          margin-bottom: 3rem;
          max-width: 640px;
          margin-left: auto;
          margin-right: auto;
        }

        .contrib-eyebrow {
          display: inline-block;
          color: #10b981;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.65rem;
        }

        .contrib-section-title {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: clamp(1.5rem, 4vw, 2.25rem);
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.75rem;
        }

        .contrib-section-sub {
          font-size: 0.95rem;
          color: #6b7280;
          line-height: 1.7;
        }

        .contrib-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 600px) {
          .contrib-cards-grid { grid-template-columns: repeat(2, 1fr); }
        }

        @media (min-width: 960px) {
          .contrib-cards-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .contrib-card {
          background: white;
          border: 1.5px solid #d1fae5;
          border-radius: 18px;
          padding: 1.75rem 1.5rem;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.05);
        }

        .contrib-card:hover {
          border-color: #10b981;
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(16, 185, 129, 0.14);
        }

        .contrib-card-icon {
          width: 54px;
          height: 54px;
          background: #ecfdf5;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #10b981;
          margin-bottom: 1.25rem;
        }

        .contrib-card h3 {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: 1rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.6rem;
        }

        .contrib-card p {
          font-size: 0.87rem;
          color: #6b7280;
          line-height: 1.65;
          margin: 0;
        }

        /* How Section */
        .contrib-how {
          background: linear-gradient(135deg, #10b981, #047857);
          padding: 4.5rem 1.5rem;
          color: white;
        }

        .contrib-how-inner {
          max-width: 1000px;
          margin: 0 auto;
        }

        .contrib-steps {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          align-items: stretch;
          margin-top: 2.5rem;
        }

        @media (min-width: 768px) {
          .contrib-steps {
            flex-direction: row;
            align-items: center;
          }
        }

        .contrib-step {
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 16px;
          padding: 1.5rem;
          flex: 1;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
        }

        .step-num {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.2);
          border: 2px solid rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1.1rem;
          flex-shrink: 0;
          color: white;
        }

        .contrib-step h4 {
          font-size: 0.97rem;
          font-weight: 800;
          color: white;
          margin: 0 0 0.35rem;
        }

        .contrib-step p {
          font-size: 0.84rem;
          color: rgba(255,255,255,0.82);
          line-height: 1.55;
          margin: 0;
        }

        .contrib-step-arrow {
          color: rgba(255,255,255,0.5);
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }

        @media (max-width: 767px) {
          .contrib-step-arrow { display: none; }
        }

        /* CTA Section */
        .contrib-cta-section {
          padding: 4rem 1.5rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .contrib-cta-card {
          background: white;
          border: 1.5px solid #d1fae5;
          border-radius: 24px;
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.08);
        }

        .contrib-cta-icon {
          color: #10b981;
          margin-bottom: 1.25rem;
        }

        .contrib-cta-card h2 {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: clamp(1.5rem, 4vw, 2rem);
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.85rem;
        }

        .contrib-cta-card p {
          font-size: 0.97rem;
          color: #6b7280;
          line-height: 1.7;
          max-width: 520px;
          margin: 0 auto 2rem;
        }

        .contrib-cta-btns {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        /* Shared button styles */
        .contrib-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          font-size: 0.92rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
        }

        .contrib-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.42);
        }

        .contrib-cta-btn-outline {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background: transparent;
          color: #10b981;
          border: 2px solid #10b981;
          border-radius: 10px;
          padding: 0.75rem 1.5rem;
          font-size: 0.92rem;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
        }

        .contrib-cta-btn-outline:hover {
          background: #ecfdf5;
          transform: translateY(-1px);
        }

        .container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }
      `}</style>
    </div>
    </AuthGuard>
  );
}
