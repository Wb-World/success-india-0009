'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, ChevronDown, Terminal } from 'lucide-react';

const FAQS = [
  {
    q: 'How does the pass manual verification work?',
    a: 'Once you select your session track, timing, and terminal desk numbers, the system displays our reservation QR code. You can make the transfer for the exact amount using any UPI app (like GPay, PhonePe, Paytm, or BHIM) or net banking. Capture a screenshot of the transaction receipt showing the UTR/Reference number, and upload it. Our operations desk reviews approvals continuously, usually confirming your passes within 10-20 minutes.'
  },
  {
    q: 'How long does decryption verification take?',
    a: 'Helpline administrators process receipts 24/7. Approvals are typically completed within 15 minutes. During peak hours, it might take up to 45 minutes. You can check the real-time status of your ticket under the "Control Deck" on your Profile page.'
  },
  {
    q: 'Can I cancel or reconfigure my terminal pass?',
    a: 'Yes. Passes can be reconfigured or cancelled up to 24 hours before the summit commencement. To request a reschedule or credit refund, please email ops@cyberstrike.io with your pass reference ID.'
  },
  {
    q: 'What happens if my receipt upload is denied?',
    a: 'If your payment booking is marked as "Denied" by administration, check your transaction receipt. Common reasons include incorrect transfer amounts or uploaded corrupted image file structures. Contact support to clarify and re-submit your receipt if necessary.'
  }
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 600);
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="contact-page animate-fade-in scanlines">
      {/* Mini Hero */}
      <section className="contact-hero">
        <div className="container">
          <h1 className="heading-xl hero-title glow-text">OPERATIONS HELP DESK</h1>
          <p className="hero-subtitle">
            Have questions about session tracks, terminal allocations, or manual receipt decryption? Submit your packet transmission.
          </p>
        </div>
      </section>

      {/* Main Support Grid */}
      <section className="container contact-main-grid">
        {/* Info Cards & Form */}
        <div className="contact-form-section">
          {submitted ? (
            <div className="success-card glass-card animate-scale-in">
              <CheckCircle2 size={56} className="success-icon" />
              <h3 className="heading-md">Packet Received!</h3>
              <p>
                Thank you for contacting CyberStrike operations. A support representative has been assigned to your ticket and will reply via email within the next 2 hours.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn btn-primary">
                Send Another Packet
              </button>
            </div>
          ) : (
            <div className="form-card glass-card animate-slide-up">
              <h3 className="heading-sm form-card-title" style={{ color: 'white' }}>TRANSMIT SECURITY ENQUIRY</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Richard Hendricks" 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Secure Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="richard@hooli.xyz" 
                      className="form-control" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input 
                    type="text" 
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="E.g., Ticket verification, desk allocation assistance..." 
                    className="form-control" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Packet Details</label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write the details of your inquiry here..." 
                    rows={5} 
                    className="form-control textarea-field" 
                    required 
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary submit-btn">
                  <Send size={16} /> Send Packet
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Contact Info Sidebar */}
        <div className="contact-info-sidebar animate-slide-up">
          <div className="info-card info-card-hover">
            <Phone size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Secure Voice Helpline</h4>
              <p className="info-card-detail">+1 (800) 555-INIT</p>
              <p className="info-card-sub">Mon-Sun, 24 Hours Active</p>
            </div>
          </div>

          <div className="info-card info-card-hover">
            <Mail size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Ops Email</h4>
              <p className="info-card-detail">ops@cyberstrike.io</p>
              <p className="info-card-sub">Response within 2 hours</p>
            </div>
          </div>

          <div className="info-card info-card-hover">
            <MapPin size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Mainframe Headquarters</h4>
              <p className="info-card-detail">Grid Node 404, Sandbox Plaza</p>
              <p className="info-card-sub">Cyber City, Sandbox Grid</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ section */}
      <section className="faq-section bg-light">
        <div className="container faq-container">
          <div className="faq-header animate-slide-up">
            <HelpCircle size={32} className="faq-header-icon" />
            <h2 className="heading-lg glow-text">Frequently Asked Questions</h2>
            <p className="section-subtitle">Quick answers regarding bookings, refunds, and UPI screenshot validation</p>
          </div>

          <div className="faq-accordion-list">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className={`accordion-item ${isOpen ? 'open' : ''} animate-slide-up`}>
                  <button className="accordion-trigger" onClick={() => toggleFaq(idx)}>
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className="arrow-icon" />
                  </button>
                  <div className="accordion-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <style jsx>{`
        .contact-page {
          background-color: var(--background);
          padding-bottom: 5rem;
        }

        /* Hero */
        .contact-hero {
          background: linear-gradient(135deg, #040914 0%, #0c1831 100%);
          color: white;
          padding: 6rem 0;
          text-align: center;
          border-bottom: 1px solid var(--border);
        }

        .hero-title {
          color: white;
          margin-bottom: 1.25rem;
          font-weight: 900;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #94a3b8;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.65;
        }

        /* Support Grid */
        .contact-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
          padding: 5rem 1.5rem;
        }

        @media (min-width: 992px) {
          .contact-main-grid {
            grid-template-columns: 1.3fr 0.7fr;
          }
        }

        .form-card {
          padding: 2.5rem;
          border-radius: var(--radius-2xl);
          background: rgba(12, 17, 29, 0.75);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .form-card-title {
          font-weight: 700;
          color: white;
          margin-bottom: 1.75rem;
          font-size: 1.25rem;
        }

        .form-row {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        @media (min-width: 768px) {
          .form-row {
            flex-direction: row;
          }
        }

        .flex-1 {
          flex: 1;
        }

        .textarea-field {
          resize: none;
        }

        .submit-btn {
          width: 100%;
          padding: 0.9rem;
          font-size: 1.05rem;
          margin-top: 0.75rem;
          box-shadow: var(--shadow-primary);
        }

        /* Success Card */
        .success-card {
          padding: 3.5rem 2.25rem;
          text-align: center;
          background: rgba(8, 12, 22, 0.85);
          border: 1px solid var(--border);
          border-radius: var(--radius-2xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          max-width: 500px;
          margin: 0 auto;
          box-shadow: var(--shadow-xl);
        }

        .success-icon {
          color: var(--primary);
        }

        .success-card p {
          color: var(--muted);
          line-height: 1.65;
        }

        /* Sidebar Contacts */
        .contact-info-sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .info-card {
          background: rgba(12, 17, 29, 0.65);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.75rem;
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }
        
        .info-card-hover:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--primary);
        }

        .info-card-icon {
          color: var(--primary);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.6rem;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
          border-radius: var(--radius-xl);
          box-sizing: content-box;
        }

        .info-card-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.35rem;
        }

        .info-card-detail {
          font-weight: 700;
          color: white;
          font-size: 1.05rem;
        }

        .info-card-sub {
          font-size: 0.85rem;
          color: var(--muted);
          margin-top: 0.125rem;
        }

        /* FAQ Section */
        .faq-section {
          padding: 6rem 1.5rem;
          border-top: 1px solid var(--border);
        }

        .bg-light {
          background-color: rgba(8, 12, 22, 0.3);
        }

        .faq-container {
          max-width: 800px;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 3.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .faq-header-icon {
          color: var(--primary);
          margin-bottom: 0.875rem;
          filter: drop-shadow(0 0 5px var(--primary-glow));
        }

        .faq-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .accordion-item {
          background: rgba(12, 17, 29, 0.7);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          transition: all var(--transition-normal);
        }

        .accordion-item.open {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
        }

        .accordion-trigger {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: var(--font-sans);
          font-weight: 600;
          font-size: 1.05rem;
          color: white;
          text-align: left;
        }

        .accordion-trigger:hover {
          color: var(--primary);
        }

        .arrow-icon {
          color: var(--muted-light);
          transition: transform var(--transition-normal);
        }

        .accordion-item.open .arrow-icon {
          transform: rotate(180deg);
          color: var(--primary);
        }

        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height var(--transition-normal) ease-out;
          background-color: rgba(3, 7, 18, 0.3);
        }

        .accordion-item.open .accordion-content {
          max-height: 250px;
        }

        .accordion-content p {
          padding: 1.5rem;
          color: var(--muted);
          line-height: 1.65;
          font-size: 0.975rem;
        }
      `}</style>
    </div>
  );
}
