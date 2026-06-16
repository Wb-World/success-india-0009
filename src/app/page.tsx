'use client';

import { useEffect, useState } from 'react';
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
import SeatBookingModal from './components/SeatBookingModal';

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

type SeminarEvent = {
  id: string;
  title: string;
  venue: string;
  eventDate?: string;
  eventTime?: string;
  price: number;
  totalSeats?: number;
  name?: string;
  legacySource?: string;
  legacyDestination?: string;
  bookedSeatsByTime?: Record<string, string[]>;
};

export default function Home() {
  const [events, setEvents] = useState<SeminarEvent[]>([]);
  const [venue, setVenue] = useState(fallbackLocations[0]);
  const [seminar, setSeminar] = useState(fallbackEventCategories[0]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Modal state
  const [modalEvent, setModalEvent] = useState<SeminarEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (!res.ok) return;

        const fetchedEvents: SeminarEvent[] = (data.events || []).map((event: any) => ({
          ...event,
          legacySource: event.venue,
          legacyDestination: event.title,
        }));
        setEvents(fetchedEvents);

        if (fetchedEvents.length > 0) {
          const firstEvent = fetchedEvents[0];
          setSelectedEventId(firstEvent.id);
          setVenue(firstEvent.venue || firstEvent.legacySource || fallbackLocations[0]);
          setSeminar(firstEvent.title || firstEvent.name || fallbackEventCategories[0]);
          if (firstEvent.eventDate) setDate(firstEvent.eventDate);
        }
      } catch (error) {
        console.error('Unable to fetch seminar events:', error);
      }
    };

    fetchEvents();
  }, []);

  const eventLocations = events.length
    ? (Array.from(new Set(events.map((event) => event.venue || event.legacySource).filter(Boolean))) as string[])
    : fallbackLocations;

  const visibleEvents = events.length
    ? events.filter((event) => (event.venue || event.legacySource) === venue)
    : [];

  const eventOptions = visibleEvents.length ? visibleEvents : events;

  const handleEventSelect = (eventIdOrTitle: string) => {
    const event = events.find((item) => item.id === eventIdOrTitle);
    if (!event) {
      setSelectedEventId('');
      setSeminar(eventIdOrTitle);
      return;
    }
    setSelectedEventId(event.id);
    setVenue(event.venue || event.legacySource || venue);
    setSeminar(event.title || event.name || seminar);
    if (event.eventDate) setDate(event.eventDate);
  };

  const handleLocationSelect = (location: string) => {
    setVenue(location);
    const firstMatchingEvent = events.find((event) => (event.venue || event.legacySource) === location);
    if (firstMatchingEvent) {
      setSelectedEventId(firstMatchingEvent.id);
      setSeminar(firstMatchingEvent.title || firstMatchingEvent.name || seminar);
      if (firstMatchingEvent.eventDate) setDate(firstMatchingEvent.eventDate);
    } else {
      setSelectedEventId('');
    }
  };

  // Search navigates to /book page (no auth required)
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const eventParam = selectedEventId ? `&eventId=${encodeURIComponent(selectedEventId)}` : '';
    window.location.href = `/book?venue=${encodeURIComponent(venue)}&seminar=${encodeURIComponent(seminar)}&date=${encodeURIComponent(date)}${eventParam}`;
  };

  // Open modal for an event card click
  const handleEventCardClick = (event: SeminarEvent) => {
    setModalEvent(event);
  };

  // Open modal for hero CTA — use first available event or navigate to /book
  const handleReserveClick = () => {
    if (events.length > 0) {
      setModalEvent(events[0]);
    } else {
      window.location.href = '/book';
    }
  };

  return (
    <div className="landing-page">
      {/* Seat Booking Modal */}
      {modalEvent && (
        <SeatBookingModal
          event={modalEvent}
          onClose={() => setModalEvent(null)}
        />
      )}

      <div className="landing-page-content">
        <section className="hero-section">
          <div className="container hero-container">
            <div className="hero-text-col animate-slide-up">
              <span className="hero-tagline">
                <ShieldCheck size={16} />
                Official AccessIndia Growth Platform
              </span>
              <h1 className="hero-title">
                AccessIndia: Pioneering <span className="text-highlight">Enterprise Growth &amp; Professional</span> Leadership
              </h1>
              <p className="hero-subtitle">
                Empowering India&apos;s entrepreneurial ecosystem through official chapter meetups, high-impact business strategy seminars, and curated networking forums designed for scalability and success.
              </p>
              <div className="hero-proof-row">
                <div className="proof-item">
                  <MapPin size={18} />
                  <span>Chromepet, Chennai operations hub</span>
                </div>
                <div className="proof-item">
                  <Globe2 size={18} />
                  <span>Online network portal and mobile ecosystem</span>
                </div>
              </div>
              <div className="hero-cta-buttons">
                <button
                  onClick={handleReserveClick}
                  className="btn btn-primary btn-lg-premium animate-pulse-green"
                  style={{ cursor: 'pointer' }}
                >
                  <Calendar size={18} /> Reserve a Seat
                </button>
                <Link href="/about" className="btn btn-secondary btn-lg-premium">
                  View Portal Context
                </Link>
              </div>
            </div>

            <div className="hero-image-col animate-scale-in">
              <div className="hero-image-wrapper">
                <img
<<<<<<< HEAD
                  src="/image2.png"
                  alt="AccessIndia Success Team Leader"
=======
                  src="/hero-leader.png"
                  alt="AccessIndia Success Team Leader - Professional Portrait"
>>>>>>> b5726373bfc9fe5ba35af226df62f8f8e1ea3f82
                  className="hero-image"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="features-section container">
          <div className="section-header">
            <span className="section-eyebrow">Operational Focus</span>
            <h2 className="heading-lg">Built for leadership briefings and local chapter growth</h2>
            <p className="section-subtitle">
              AccessIndia Success Team organizes core leadership briefings, networking workshops, and local chapter meetups into a premium reservation experience.
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
                Local meetup access for chapter networks, including BOSS Agro Hub style chapter gatherings noted in the business context.
              </p>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="container trust-container">
            <div className="trust-copy">
              <span className="section-eyebrow">Trust &amp; Due Diligence</span>
              <h2 className="heading-lg">Clear information before every registration</h2>
              <p>
                The provided context notes mixed consumer reviews and recommends careful due diligence. This portal presents seminar categories, locations, dates, and official resources plainly so attendees can review details before reserving seats.
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
            <span className="section-eyebrow">Popular Event Tracks</span>
            <h2 className="heading-lg">Reserve seats for the next Success Team session</h2>
            <p className="section-subtitle">Click any event card to instantly open seat booking.</p>
          </div>

          <div className="routes-grid">
            {(events.length ? events.slice(0, 3) : fallbackEventCategories.slice(0, 3)).map((item, index) => {
              const event = typeof item === 'string' ? null : item;
              const category = event ? event.title || event.name || fallbackEventCategories[index] : String(item);
              const location = event ? event.venue || event.legacySource || fallbackLocations[index] : fallbackLocations[index];
              return (
                <div
                  key={category}
                  className="seminar-track-card"
                  onClick={() => {
                    if (event) {
                      handleEventCardClick(event);
                    } else {
                      window.location.href = `/book?seminar=${encodeURIComponent(category)}`;
                    }
                  }}
                >
                  <div className="seminar-track-info">
                    <div className="seminar-track-title">{category}</div>
                    <div className="seminar-track-details">{location} <ArrowRight size={13} /> Seat registration</div>
                  </div>
                  <div className="seminar-fee-tag">
                    <span>{event ? 'Fee' : 'Track'}</span>
                    <span className="price-num">{event ? `₹${event.price}` : `0${index + 1}`}</span>
                  </div>
                </div>
              );
            })}
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
      </div>

      <style jsx>{`
        .landing-page {
          background: var(--background);
        }

        .hero-section {
          position: relative;
          padding: 6rem 0 7rem;
          background:
            linear-gradient(135deg, #1e9e48 0%, #25b454 50%, #28a745 100%);
          color: white;
          overflow: hidden;
          min-height: auto;
          display: flex;
          align-items: center;
        }

        @media (min-width: 768px) {
          .hero-section {
            min-height: 640px;
          }
        }

        .hero-section::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 96px;
          background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.98));
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
          font-size: clamp(2rem, 8vw, 4rem);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: 0;
          margin: 0;
          max-width: 820px;
        }

        .text-highlight {
          color: #bbf7d0;
        }

        .hero-subtitle {
          font-size: 1.08rem;
          line-height: 1.75;
          color: #d1fae5;
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

        .hero-image-col {
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: center;
        }

        .hero-image-wrapper {
          width: 100%;
<<<<<<< HEAD
          max-width: 420px;
=======
          max-width: 400px;
>>>>>>> b5726373bfc9fe5ba35af226df62f8f8e1ea3f82
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
<<<<<<< HEAD
          border-radius: 24px;
=======
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.18),
            0 2px 8px rgba(0, 0, 0, 0.08);
>>>>>>> b5726373bfc9fe5ba35af226df62f8f8e1ea3f82
        }

        .hero-image-wrapper:hover {
          transform: translateY(-6px) scale(1.02);
          box-shadow:
            0 16px 48px rgba(0, 0, 0, 0.22),
            0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .hero-image {
          width: 100%;
          height: auto;
          object-fit: cover;
<<<<<<< HEAD
          mix-blend-mode: screen;
          filter: brightness(1.1) contrast(1.15) drop-shadow(0 10px 30px rgba(0, 0, 0, 0.25));
          transition: filter 0.3s ease;
        }

        .hero-image-wrapper:hover .hero-image {
          filter: brightness(1.15) contrast(1.2) drop-shadow(0 15px 40px rgba(0, 0, 0, 0.3));
=======
          object-position: top;
          display: block;
          border-radius: 20px;
          transition: transform 0.4s ease;
        }

        .hero-image-wrapper:hover .hero-image {
          transform: scale(1.03);
>>>>>>> b5726373bfc9fe5ba35af226df62f8f8e1ea3f82
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

        @media (min-width: 600px) and (max-width: 767px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .feature-card {
          background: #ffffff;
          padding: 2.25rem 1.75rem;
          border-radius: var(--radius-lg);
          border: 1px solid #bbf7d0;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary);
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
          background: #16a34a;
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
          color: #d1fae5;
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
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 1rem;
          border-radius: var(--radius-md);
          font-weight: 650;
          color: #ffffff;
        }

        .trust-item svg {
          color: #bbf7d0;
          flex-shrink: 0;
        }

        .routes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 550px) and (max-width: 767px) {
          .routes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .routes-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .seminar-track-card {
          background: #ffffff;
          border: 1.5px solid #bbf7d0;
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

        .seminar-track-card:hover {
          border-color: var(--primary);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          background: #f0fdf4;
        }

        .seminar-track-info {
          flex: 1;
          min-width: 0;
        }

        .seminar-track-title {
          font-family: var(--font-heading);
          font-size: 1.03rem;
          font-weight: 800;
          color: var(--foreground);
          margin-bottom: 0.55rem;
        }

        .seminar-track-details {
          font-size: 0.85rem;
          color: var(--muted);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .seminar-fee-tag {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          line-height: 1.1;
          flex-shrink: 0;
        }

        .seminar-fee-tag span:first-child {
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
          background: #16a34a;
          border: 1px solid #15803d;
          border-radius: var(--radius-lg);
          color: #ffffff;
        }

        .office-card svg {
          color: #bbf7d0;
          flex-shrink: 0;
        }

        .office-label {
          display: block;
          font-weight: 800;
          margin-bottom: 0.25rem;
          color: #ffffff;
        }

        .office-card p {
          line-height: 1.6;
          color: rgba(255,255,255,0.9);
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

        .landing-page-content {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
