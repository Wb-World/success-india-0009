'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Target,
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
            <div className="hero-logo-col animate-scale-in">
              <div className="">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/success-india-logo.jpeg"
                  alt="Success India Logo"
                  className="hero-logo-main"
                />
              </div>
            </div>

            <div className="hero-quote-col animate-slide-up">
              <h1 className="hero-dream-title">
                &ldquo;OUR BIGGEST DREAM IS TO MAKE <span className="text-highlight-dream">YOUR DREAM</span> YOUR DREAM COME TRUE&rdquo;
              </h1>
              <br /><br />
              <h1 className="hero-dream-title" style={{paddingLeft:"150px"}}>29.03.2020</h1>
            </div>
          </div>
        </section>

        <section className="owner-profile-section container">
          <div className="owner-profile-grid">
            <div className="owner-profile-left">
              <span className="profile-badge">Success Team Leadership</span>
              <h2 className="owner-title">Super Star J.Surendar</h2>
              <p className="owner-subtitle-role">Board of Vice President</p>
              <p className="owner-subtitle-role">Founder of Success Team</p>
              <div className="owner-history-card">
                <h3 className="history-heading">History</h3>
                <p className="history-text">
                  J.Surendar is a visionary leader and the Board of Vice President of Accsys India. With over a decade of dedicated experience in pioneering enterprise growth, professional leadership development, and community expansion across Tamil Nadu, he has empowered thousands of entrepreneurs to achieve financial independence and professional excellence.
                </p>
                <p className="history-text">
                  Under his strategic guidance, Success Team has established a robust network of local chapters, Weekly Strategy Systems, and leadership training programs. His relentless commitment to building India&apos;s strongest business mentorship ecosystem continues to transform dreams into reality, leading members toward lasting growth and community-driven success.
                </p>
              </div>
            </div>
            <div className="owner-profile-right">
              <div className="owner-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/image.png"
                  alt="Super Star J.Surendar - Board of Vice President"
                  className="owner-profile-img"
                />
                <div className="owner-image-overlay">
                  <span>J.Surendar</span>
                </div>
              </div>
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
          padding: 4rem 0 5rem;
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
            padding: 6rem 0 7rem;
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
          gap: 2.5rem;
          align-items: center;
          width: 100%;
          justify-items: center;
          text-align: center;
        }

        @media (min-width: 768px) {
          .hero-container {
            gap: 3.5rem;
          }
        }

        @media (min-width: 992px) {
          .hero-container {
            grid-template-columns: 0.95fr 1.05fr;
            gap: 5rem;
            text-align: left;
            justify-items: start;
          }
        }

        .hero-logo-col {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        .hero-logo-wrapper {
          position: relative;
          display: inline-block;
          border-radius: 50%;
          padding: 8px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.22),
            0 0 40px rgba(253, 230, 138, 0.15);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        }

        .hero-logo-wrapper:hover {
          transform: scale(1.04) rotate(2deg);
          box-shadow: 
            0 30px 60px rgba(0, 0, 0, 0.28),
            0 0 60px rgba(253, 230, 138, 0.35);
        }

        .hero-logo-main {
          width: clamp(190px, 42vw, 300px);
          height: clamp(190px, 42vw, 300px);
          border: 6px solid #ffffff;
          // object-fit: cover;
          // display: block;
        }

        .hero-quote-col {
          display: flex;
          flex-direction: column;
          justify-content: center;
          width: 100%;
        }

        .hero-dream-title {
          font-family: var(--font-heading), 'Inter', sans-serif;
          font-size: clamp(2.3rem, 5.8vw, 3.9rem);
          font-weight: 800;
          line-height: 1.16;
          color: #ffffff;
          margin: 0;
          font-style: italic;
          text-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }

        .text-highlight-dream {
          color: #fde68a;
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

        /* ── Hero Dream Quote Box cleaned ── */

        /* ── Owner Profile Section ────────────────────────── */
        .owner-profile-section {
          padding: 6rem 2rem;
          background: #ffffff;
        }

        .owner-profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        @media (min-width: 992px) {
          .owner-profile-grid {
            grid-template-columns: 1.2fr 0.8fr;
            gap: 5rem;
          }
        }

        .owner-profile-left {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .profile-badge {
          display: inline-block;
          align-self: flex-start;
          background: #ecfdf5;
          color: #059669;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 5px 14px;
          border-radius: 99px;
          border: 1px solid #a7f3d0;
        }

        .owner-title {
          font-family: var(--font-heading), 'Inter', sans-serif;
          font-size: clamp(1.8rem, 4.5vw, 2.75rem);
          font-weight: 800;
          color: #111827;
          line-height: 1.15;
          margin: 0;
        }

        .owner-subtitle-role {
          font-size: 1.15rem;
          font-weight: 700;
          color: #10b981;
          margin: 0 0 0.5rem;
        }

        .owner-history-card {
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 18px;
          padding: 2rem 2.25rem;
          box-shadow: 0 4px 24px rgba(0,0,0,0.025);
        }

        .history-heading {
          font-family: var(--font-heading), 'Inter', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0 0 1rem;
          border-bottom: 2px solid #ecfdf5;
          padding-bottom: 0.5rem;
        }

        .history-text {
          font-size: 0.97rem;
          line-height: 1.75;
          color: #4b5563;
          margin: 0 0 1rem;
        }

        .history-text:last-child { margin-bottom: 0; }

        .owner-profile-right {
          display: flex;
          justify-content: center;
        }

        .owner-image-wrapper {
          position: relative;
          width: 100%;
          max-width: 370px;
          border-radius: 22px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.14);
          border: 4px solid #ffffff;
          outline: 2px solid #10b981;
          line-height: 0;
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .owner-image-wrapper:hover {
          transform: translateY(-6px) scale(1.02);
        }

        .owner-profile-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: cover;
        }

        .owner-image-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(180deg, transparent, rgba(0,0,0,0.82));
          padding: 28px 16px 16px;
          text-align: center;
        }

        .owner-image-overlay span {
          color: #ffffff;
          font-weight: 800;
          font-size: 1.25rem;
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 4.25rem 0 5.5rem;
          }

          .owner-profile-section,
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
