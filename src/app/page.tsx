'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  Globe2,
  Handshake,
  MapPin,
  Search,
  ShieldCheck,
  Target,
  Users,
} from 'lucide-react';

const locations = [
  'Chromepet, Chennai',
  'Chennai Central Region',
  'South Chennai',
  'Tambaram',
  'Pallavaram',
  'Tamil Nadu Chapter Network',
];

const eventCategories = [
  'Leadership Development Seminars',
  'Weekly Income-Generation Systems',
  'BOSS Agro Hub Chapter Meetups',
  'Digital Marketing & Direct-Selling Workshops',
];

export default function Home() {
  const router = useRouter();
  const [source, setSource] = useState(locations[0]);
  const [destination, setDestination] = useState(eventCategories[0]);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/book?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
  };

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="container hero-container">
          <div className="hero-text-col animate-slide-up">
            <span className="hero-tagline">
              <ShieldCheck size={16} />
              Official Networking & Leadership Portal
            </span>
            <h1 className="hero-title">
              Empowering Your Growth: Book Your Next <span className="text-highlight">Success Seminar</span> & Chapter Meetup
            </h1>
            <p className="hero-subtitle">
              Reserve your seats for official leadership development programs, recruitment training, and weekly income-generation strategy sessions hosted across Tamil Nadu.
            </p>
            <div className="hero-proof-row">
              <div className="proof-item">
                <MapPin size={18} />
                <span>Chromepet, Chennai based operations</span>
              </div>
              <div className="proof-item">
                <Globe2 size={18} />
                <span>Online portal and mobile app ecosystem</span>
              </div>
            </div>
            <div className="hero-cta-buttons">
              <Link href="/book" className="btn btn-primary btn-lg-premium">
                <Calendar size={18} /> Reserve a Seat
              </Link>
              <Link href="/about" className="btn btn-secondary btn-lg-premium">
                View Portal Context
              </Link>
            </div>
          </div>

          <div className="hero-search-col animate-scale-in">
            <div className="registration-card">
              <div className="card-kicker">Seminar Registration Hub</div>
              <h3 className="search-card-title">Find a chapter session near you</h3>
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={14} className="input-label-icon" /> Location Selection
                  </label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="form-control select-field"
                  >
                    {locations.map((location) => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <BriefcaseBusiness size={14} className="input-label-icon" /> Event Category
                  </label>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="form-control select-field"
                  >
                    {eventCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={14} className="input-label-icon" /> Select Seminar Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)}
                    className="form-control date-field"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary search-btn">
                  <Search size={18} /> Find Available Seminars
                </button>
              </form>
              <p className="registration-note">
                Program details are based on the Success Team operations described in the provided source text.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section container">
        <div className="section-header">
          <span className="section-eyebrow">Operational Focus</span>
          <h2 className="heading-lg">Built for leadership briefings and local chapter growth</h2>
          <p className="section-subtitle">
            Success India organizes the key training themes from the provided Accsys India Success Team context into a clean booking experience for prospective members and local teams.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Users size={28} className="feature-icon" />
            </div>
            <h4 className="heading-sm feature-title">Leadership Development</h4>
            <p className="feature-desc">
              Seat reservations for leadership programs, team updates, recruitment training, and business-volume focused briefings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <BarChart3 size={28} className="feature-icon" />
            </div>
            <h4 className="heading-sm feature-title">Weekly Strategy Systems</h4>
            <p className="feature-desc">
              Weekly income-generation sessions centered on referrals, payouts, market connections, and practical member routines.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <Handshake size={28} className="feature-icon" />
            </div>
            <h4 className="heading-sm feature-title">Chapter Networking</h4>
            <p className="feature-desc">
              Local meetup access for chapter networks, including BOSS Agro Hub style chapter gatherings noted in the source material.
            </p>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="container trust-container">
          <div className="trust-copy">
            <span className="section-eyebrow">Trust & Due Diligence</span>
            <h2 className="heading-lg">Clear information before every registration</h2>
            <p>
              The source text notes mixed consumer reviews and recommends careful due diligence. This portal presents seminar categories, locations, dates, and official resources plainly so attendees can review details before reserving seats.
            </p>
          </div>
          <div className="trust-list">
            <div className="trust-item">
              <CheckCircle2 size={20} />
              <span>Official resource links and company-detail context</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={20} />
              <span>Local Tamil Nadu chapter and briefing filters</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={20} />
              <span>Transparent session categories before seat selection</span>
            </div>
          </div>
        </div>
      </section>

      <section className="routes-section container">
        <div className="section-header">
          <span className="section-eyebrow">Popular Seminar Tracks</span>
          <h2 className="heading-lg">Reserve seats for the next Success India session</h2>
          <p className="section-subtitle">Quick access to the most relevant registration paths from the source business profile.</p>
        </div>

        <div className="routes-grid">
          {eventCategories.slice(0, 3).map((category, index) => (
            <div
              key={category}
              className="route-card"
              onClick={() => router.push(`/book?source=${encodeURIComponent(locations[index])}&destination=${encodeURIComponent(category)}`)}
            >
              <div className="route-info">
                <div className="route-cities">{category}</div>
                <div className="route-details">{locations[index]} <ArrowRight size={13} /> Seat registration</div>
              </div>
              <div className="route-price-tag">
                <span>Track</span>
                <span className="price-num">0{index + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="office-section">
        <div className="container office-container">
          <div className="office-card">
            <Target size={26} />
            <div>
              <span className="office-label">Head Office Reference</span>
              <p>No 303, 2nd floor, Grand Southern Trunk Rd, Chromepet, Chennai, Tamil Nadu 600044.</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-page {
          background: var(--background);
        }

        .hero-section {
          position: relative;
          padding: 6rem 0 7rem;
          background:
            linear-gradient(135deg, rgba(5, 25, 55, 0.98) 0%, rgba(7, 47, 104, 0.96) 58%, rgba(234, 88, 12, 0.92) 100%),
            radial-gradient(circle at top right, rgba(245, 158, 11, 0.24), transparent 34%);
          color: white;
          overflow: hidden;
          min-height: 640px;
          display: flex;
          align-items: center;
        }

        .hero-section::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 96px;
          background: linear-gradient(180deg, transparent, rgba(248, 250, 252, 0.98));
          pointer-events: none;
        }

        .hero-container {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
          width: 100%;
        }

        @media (min-width: 992px) {
          .hero-container {
            grid-template-columns: 1.1fr 0.9fr;
            gap: 4rem;
          }
        }

        .hero-text-col {
          display: flex;
          flex-direction: column;
          gap: 1.45rem;
        }

        .hero-tagline {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-heading);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #fde68a;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.55rem 0.85rem;
          border-radius: 999px;
          align-self: flex-start;
          border: 1px solid rgba(253, 230, 138, 0.32);
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: 2.75rem;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: 0;
          margin: 0;
          max-width: 820px;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 4rem;
          }
        }

        .text-highlight {
          color: #fbbf24;
        }

        .hero-subtitle {
          font-size: 1.08rem;
          line-height: 1.75;
          color: #dbeafe;
          max-width: 680px;
          margin: 0;
        }

        .hero-proof-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem;
        }

        .proof-item {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0.65rem 0.85rem;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.08);
          color: #eff6ff;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .hero-cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.25rem;
          align-items: center;
        }

        .btn-lg-premium {
          padding: 0.9rem 1.5rem;
          font-size: 0.96rem;
          border-radius: var(--radius-md);
        }

        .hero-search-col {
          display: flex;
          align-items: stretch;
        }

        .registration-card {
          width: 100%;
          padding: 2rem 2rem 1.5rem;
          background: rgba(255, 255, 255, 0.98);
          color: var(--foreground);
          border-radius: var(--radius-xl);
          box-shadow: 0 28px 70px rgba(2, 8, 23, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.72);
        }

        .card-kicker {
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          text-align: center;
          margin-bottom: 0.55rem;
        }

        .search-card-title {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--primary-dark);
          margin-bottom: 1.5rem;
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #dbeafe;
        }

        .input-label-icon {
          vertical-align: middle;
          margin-top: -3px;
          margin-right: 4px;
          color: var(--primary);
        }

        .select-field,
        .date-field {
          background-color: white;
          border-color: #cbd5e1;
          font-weight: 650;
          cursor: pointer;
          height: 48px;
        }

        .search-btn {
          width: 100%;
          padding: 0.9rem;
          font-size: 1rem;
          margin-top: 0.35rem;
          box-shadow: var(--shadow-primary);
        }

        .registration-note {
          color: var(--muted);
          font-size: 0.78rem;
          line-height: 1.5;
          margin-top: 1rem;
          text-align: center;
        }

        .features-section,
        .routes-section {
          padding: 6.5rem 2rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3.25rem;
          max-width: 760px;
          margin-left: auto;
          margin-right: auto;
        }

        .section-eyebrow {
          display: inline-block;
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 0.75rem;
        }

        .section-subtitle {
          color: var(--muted);
          font-size: 1.02rem;
          margin-top: 0.75rem;
          line-height: 1.7;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          background: white;
          padding: 2.25rem 1.75rem;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          border-color: rgba(8, 68, 153, 0.28);
        }

        .feature-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: var(--radius-md);
          margin-bottom: 1.35rem;
        }

        .feature-title {
          font-size: 1.13rem;
          font-weight: 800;
          margin-bottom: 0.65rem;
          color: var(--primary-dark);
        }

        .feature-desc {
          font-size: 0.92rem;
          color: var(--muted);
          line-height: 1.72;
        }

        .stats-section {
          background: #082f61;
          color: white;
          padding: 5rem 2rem;
        }

        .trust-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: center;
        }

        @media (min-width: 900px) {
          .trust-container {
            grid-template-columns: 1fr 0.9fr;
          }
        }

        .trust-copy .heading-lg {
          color: white;
        }

        .trust-copy p {
          color: #dbeafe;
          line-height: 1.75;
          max-width: 690px;
        }

        .trust-list {
          display: grid;
          gap: 0.85rem;
        }

        .trust-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 1rem;
          border-radius: var(--radius-md);
          font-weight: 650;
          color: #eff6ff;
        }

        .trust-item svg {
          color: #fbbf24;
          flex-shrink: 0;
        }

        .routes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 768px) {
          .routes-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .route-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all var(--transition-normal);
          box-shadow: var(--shadow-sm);
          gap: 1rem;
        }

        .route-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }

        .route-info {
          flex: 1;
          min-width: 0;
        }

        .route-cities {
          font-family: var(--font-heading);
          font-size: 1.03rem;
          font-weight: 800;
          color: var(--foreground);
          margin-bottom: 0.55rem;
        }

        .route-details {
          font-size: 0.85rem;
          color: var(--muted);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .route-price-tag {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.1;
          flex-shrink: 0;
        }

        .route-price-tag span:first-child {
          font-size: 0.7rem;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .price-num {
          font-family: var(--font-heading);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--primary);
        }

        .office-section {
          padding: 0 2rem 6rem;
        }

        .office-container {
          display: flex;
          justify-content: center;
        }

        .office-card {
          width: 100%;
          max-width: 860px;
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1.25rem 1.5rem;
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: var(--radius-lg);
          color: #7c2d12;
        }

        .office-card svg {
          color: var(--primary);
          flex-shrink: 0;
        }

        .office-label {
          display: block;
          font-weight: 800;
          margin-bottom: 0.25rem;
          color: #9a3412;
        }

        .office-card p {
          line-height: 1.6;
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 4.25rem 0 5.5rem;
          }

          .hero-title {
            font-size: 2.35rem;
          }

          .registration-card {
            padding: 1.5rem 1.25rem;
          }

          .features-section,
          .routes-section {
            padding: 4.5rem 1.25rem;
          }

          .stats-section {
            padding: 4rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
}
