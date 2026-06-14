'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'How does the booking manual approval work?',
    a: 'Once you select your bus route and seat numbers, the system displays our reservation QR code. You can make the transfer for the exact amount using any UPI app (like GPay, PhonePe, Paytm, or BHIM) or net banking. Capture a screenshot of the transaction receipt showing the UTR/Reference number, and upload it. Our audit team reviews approvals continuously, usually confirming your seats within 10-30 minutes.'
  },
  {
    q: 'How long does payment approval take?',
    a: 'Helpline administrators process receipts 24/7. Approvals are typically completed within 15 minutes. During late-night hours or heavy travel seasons, it might take up to 1 hour. You can check the real-time status of your ticket under the "Travel Bookings" table on your Profile page.'
  },
  {
    q: 'Can I cancel or reschedule my ticket?',
    a: 'Yes. Tickets can be cancelled or rescheduled up to 12 hours before departure. To request a reschedule or refund, please dial our toll-free customer helpline (+91 80 4567 8900) or email support@greenwheels.in with your Booking reference number.'
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
    <div className="contact-page animate-fade-in">
      {/* Mini Hero */}
      <section className="contact-hero">
        <div className="container">
          <h1 className="heading-xl hero-title">Customer Care & Support</h1>
          <p className="hero-subtitle">
            Have questions about your bus ticket, route departure times, or manual receipt validation? We are here to help.
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
              <h3 className="heading-md">Inquiry Received!</h3>
              <p>
                Thank you for contacting GreenWheels support. A passenger relations representative has been assigned to your ticket and will reply via email within the next 2 hours.
              </p>
              <button onClick={() => setSubmitted(false)} className="btn btn-primary">
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="form-card glass-card animate-slide-up">
              <h3 className="heading-sm form-card-title">Send Us a Message</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label className="form-label">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe" 
                      className="form-control" 
                      required 
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com" 
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
                    placeholder="E.g., Booking assistance, Refund status, Route enquiry..." 
                    className="form-control" 
                    required 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message Details</label>
                  <textarea 
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write the details of your enquiry here..." 
                    rows={5} 
                    className="form-control textarea-field" 
                    required 
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary submit-btn">
                  <Send size={16} /> Send Message
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
              <h4 className="info-card-title">Call Helpline</h4>
              <p className="info-card-detail">+91 80 4567 8900</p>
              <p className="info-card-sub">Mon-Sun, 24 Hours Active</p>
            </div>
          </div>

          <div className="info-card info-card-hover">
            <Mail size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Email Desk</h4>
              <p className="info-card-detail">support@greenwheels.in</p>
              <p className="info-card-sub">Response within 2 hours</p>
            </div>
          </div>

          <div className="info-card info-card-hover">
            <MapPin size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Main Terminal Head Office</h4>
              <p className="info-card-detail">100, Green City Plaza</p>
              <p className="info-card-sub">MG Road, Bangalore, KA - 560001</p>
            </div>
          </div>
        </div>
      </section>

      {/* Accordion FAQ section */}
      <section className="faq-section bg-light">
        <div className="container faq-container">
          <div className="faq-header animate-slide-up">
            <HelpCircle size={32} className="faq-header-icon animate-bounce" />
            <h2 className="heading-lg">Frequently Asked Questions</h2>
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
        }

        /* Hero */
        .contact-hero {
          background: linear-gradient(135deg, #022c22 0%, #064e3b 100%);
          color: white;
          padding: 6rem 0;
          text-align: center;
        }

        .hero-title {
          color: white;
          margin-bottom: 1.25rem;
          font-weight: 800;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #a7f3d0;
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
          background: white;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
        }

        .form-card-title {
          font-weight: 700;
          color: var(--primary-dark);
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
          background: white;
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
          background: white;
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
          border-color: var(--primary-light);
        }

        .info-card-icon {
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.6rem;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.15);
          border-radius: var(--radius-xl);
          box-sizing: content-box;
        }

        .info-card-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 0.35rem;
        }

        .info-card-detail {
          font-weight: 700;
          color: var(--foreground);
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
          background-color: #f8fafc;
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
        }

        .faq-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .accordion-item {
          background: white;
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
          color: var(--foreground);
          text-align: left;
        }

        .accordion-trigger:hover {
          color: var(--primary-dark);
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
          background-color: var(--background);
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
