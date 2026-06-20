'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2, ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: 'What is AccsysIndia?',
    a: 'AccsysIndia is the official event and leadership portal shown on this site. It is used for seminar information, seat booking, and member support.'
  },
  {
    q: 'How do I use the portal?',
    a: 'Use the Home, Book Seminars, or Profile options to view event details, register an account, and reserve seats for available AccsysIndia sessions.'
  },
  {
    q: 'Where can I find official AccsysIndia details?',
    a: 'The portal displays the official resources, contact information, and event references you should use when checking AccsysIndia details.'
  },
  {
    q: 'Who should I contact for help?',
    a: 'Use the contact form or the support details shown on the site for booking questions, profile updates, or any AccsysIndia portal issue.'
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
          <h1 className="heading-xl hero-title">Event Registration Support</h1>
          <p className="hero-subtitle">
            Have questions about seminar bookings, chapter meetup seats, payment receipt validation, or member profile updates? We are here to help.
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
              <h3 className="heading-md">Inquiry Received</h3>
              <p>
                Thank you for contacting Success Team support. A member support representative will review your event query and reply by email within the next 2 hours.
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
                    placeholder="Example, seminar booking help, payment status, event update"
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
              <h4 className="info-card-title">Event Support Desk</h4>
              <p className="info-card-detail">Support through official Success Team channels</p>
              <p className="info-card-sub">Monday to Sunday support window</p>
            </div>
          </div>

          <div className="info-card info-card-hover">
            <Mail size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Online Resource</h4>
              <p className="info-card-detail">accsysindia.com</p>
              <p className="info-card-sub">Use official resources for company details</p>
            </div>
          </div>

          <div className="info-card info-card-hover">
            <MapPin size={22} className="info-card-icon" />
            <div>
              <h4 className="info-card-title">Head Office Reference</h4>
              <p className="info-card-detail">No 303, 2nd floor, Grand Southern Trunk Rd</p>
              <p className="info-card-sub">Chromepet, Chennai, Tamil Nadu 600044</p>
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
            <p className="section-subtitle">Quick answers about AccsysIndia, portal use, and official contact details</p>
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

      <style>{`
        .contact-page {
          background-color: var(--background);
        }

        /* Hero */
        .contact-hero {
          background: linear-gradient(135deg, #1e9e48 0%, #25b454 50%, #28a745 100%);
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
