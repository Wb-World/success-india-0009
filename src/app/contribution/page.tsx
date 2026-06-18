'use client';

import { Heart, Users, Star, ArrowRight, Gift, HandHeart, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function ContributionPage() {
  return (
    <div className="contribution-page">
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
            <Link href="/events" className="contrib-cta-btn">
              <Sparkles size={17} /> View Events &amp; Book Seats
            </Link>
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
            <p>Be part of the mission to build India's strongest entrepreneurial leadership network, chapter by chapter.</p>
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

      {/* Contact CTA */}
      <section className="contrib-cta-section container">
        <div className="contrib-cta-card">
          <Heart size={36} className="contrib-cta-icon" />
          <h2>Ready to Contribute?</h2>
          <p>
            Contact our team to learn more about contribution tiers, how your funds are used, and the recognition program for top supporters.
          </p>
          <div className="contrib-cta-btns">
            <Link href="/contact" className="contrib-cta-btn">
              Contact Us <ArrowRight size={16} />
            </Link>
            <Link href="/events" className="contrib-cta-btn-outline">
              Browse Events
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .contribution-page {
          min-height: 100vh;
          background: var(--background, #f9fafb);
        }

        /* Hero */
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
  );
}
