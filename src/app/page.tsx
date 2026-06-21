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

type AchieverItem = { rank: number; name: string; image?: string; tier: string };
type AchieversData = {
  pv: { ced: AchieverItem[]; ed: AchieverItem[] };
  income: { ced: AchieverItem[]; ed: AchieverItem[] };
};

const DEFAULT_ACHIEVERS: AchieversData = {
  pv: {
    ced: [
      { rank: 1, name: '', image: '', tier: 'gold' },
      { rank: 2, name: '', image: '', tier: 'silver' },
      { rank: 3, name: '', image: '', tier: 'bronze' }
    ],
    ed: [
      { rank: 1, name: '', image: '', tier: 'gold' },
      { rank: 2, name: '', image: '', tier: 'silver' },
      { rank: 3, name: '', image: '', tier: 'bronze' }
    ]
  },
  income: {
    ced: [
      { rank: 1, name: '', image: '', tier: 'gold' },
      { rank: 2, name: '', image: '', tier: 'silver' },
      { rank: 3, name: '', image: '', tier: 'bronze' }
    ],
    ed: [
      { rank: 1, name: '', image: '', tier: 'gold' },
      { rank: 2, name: '', image: '', tier: 'silver' },
      { rank: 3, name: '', image: '', tier: 'bronze' }
    ]
  }
};

const GoldBadgeIcon = () => (
  <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(218, 165, 32, 0.25))' }}>
    <path d="M22 36L16 54L27 48L32 54L26 36H22Z" fill="#B47B00" />
    <path d="M42 36L48 54L37 48L32 54L38 36H42Z" fill="#D29200" />
    <path d="M18 54L27 48L32 54L23 54Z" fill="#966400" />
    <path d="M46 54L37 48L32 54L41 54Z" fill="#B47B00" />
    <circle cx="32" cy="28" r="22" fill="url(#goldGrad)" stroke="#D4AF37" strokeWidth="2.5" />
    <circle cx="32" cy="28" r="18" stroke="#FFF" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.8" />
    <path d="M32 17L35.5 24.5L43.5 25.5L37.5 31L39.5 39L32 35L24.5 39L26.5 31L20.5 25.5L28.5 24.5L32 17Z" fill="#FFF" />
    <defs>
      <linearGradient id="goldGrad" x1="12" y1="8" x2="52" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFE066" />
        <stop offset="30%" stopColor="#F5B041" />
        <stop offset="70%" stopColor="#D4AC0D" />
        <stop offset="100%" stopColor="#9A7D0A" />
      </linearGradient>
    </defs>
  </svg>
);

const SilverBadgeIcon = () => (
  <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(148, 163, 184, 0.25))' }}>
    <path d="M22 36L16 54L27 48L32 54L26 36H22Z" fill="#64748B" />
    <path d="M42 36L48 54L37 48L32 54L38 36H42Z" fill="#94A3B8" />
    <path d="M18 54L27 48L32 54L23 54Z" fill="#475569" />
    <path d="M46 54L37 48L32 54L41 54Z" fill="#64748B" />
    <circle cx="32" cy="28" r="22" fill="url(#silverGrad)" stroke="#CBD5E1" strokeWidth="2.5" />
    <circle cx="32" cy="28" r="18" stroke="#FFF" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.8" />
    <path d="M32 17L35.5 24.5L43.5 25.5L37.5 31L39.5 39L32 35L24.5 39L26.5 31L20.5 25.5L28.5 24.5L32 17Z" fill="#FFF" />
    <defs>
      <linearGradient id="silverGrad" x1="12" y1="8" x2="52" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="40%" stopColor="#E2E8F0" />
        <stop offset="70%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
    </defs>
  </svg>
);

const BronzeBadgeIcon = () => (
  <svg width="60" height="60" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 8px rgba(180, 83, 9, 0.25))' }}>
    <path d="M22 36L16 54L27 48L32 54L26 36H22Z" fill="#7C2D12" />
    <path d="M42 36L48 54L37 48L32 54L38 36H42Z" fill="#9A3412" />
    <path d="M18 54L27 48L32 54L23 54Z" fill="#431407" />
    <path d="M46 54L37 48L32 54L41 54Z" fill="#7C2D12" />
    <circle cx="32" cy="28" r="22" fill="url(#bronzeGrad)" stroke="#F97316" strokeWidth="2.5" />
    <circle cx="32" cy="28" r="18" stroke="#FFF" strokeWidth="1" strokeDasharray="3 2" strokeOpacity="0.8" />
    <path d="M32 17L35.5 24.5L43.5 25.5L37.5 31L39.5 39L32 35L24.5 39L26.5 31L20.5 25.5L28.5 24.5L32 17Z" fill="#FFF" />
    <defs>
      <linearGradient id="bronzeGrad" x1="12" y1="8" x2="52" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFEDD5" />
        <stop offset="30%" stopColor="#F97316" />
        <stop offset="70%" stopColor="#C2410C" />
        <stop offset="100%" stopColor="#7C2D12" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Home() {
  const [events, setEvents] = useState<SeminarEvent[]>([]);
  const [supporters, setSupporters] = useState<any[]>([]);
  const [venue, setVenue] = useState(fallbackLocations[0]);
  const [seminar, setSeminar] = useState(fallbackEventCategories[0]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [achieversData, setAchieversData] = useState<AchieversData>(DEFAULT_ACHIEVERS);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Modal state
  const [modalEvent, setModalEvent] = useState<SeminarEvent | null>(null);

  const renderAchieverPanel = (
    items: AchieverItem[],
    designation: string,
    categoryLabel: string,
    categoryClass: string
  ) => {
    const hasData = items.some(item => item.image || item.name?.trim());

    return (
      <div className="achiever-panel">
        <div className="panel-header">
          <h3 className="panel-designation">{designation}</h3>
          <h4 className={`panel-category ${categoryClass}`}>{categoryLabel}</h4>
        </div>
        
        {!hasData ? (
          <div className="achiever-panel-empty-state">
            <div className="empty-badge-circle">🏆</div>
            <span className="empty-badge-text">No Record Found</span>
          </div>
        ) : (
          <div className="medals-row" style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            {items.map((item, i) => {
              const hasItemData = item.image || item.name?.trim();
              if (!hasItemData) return null;
              return (
                <div key={`${categoryClass}-${item.rank}`} className="medal-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '120px' }}>
                  {item.image && (
                    <div className={`achiever-pro-image-wrapper rank-${item.rank}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={item.name} className="achiever-pro-img" />
                    </div>
                  )}
                  {item.name?.trim() && (
                    <span className="medal-achiever-name">{item.name}</span>
                  )}
                  <div className="achiever-rank-badge-wrap" style={{ marginTop: '8px' }}>
                    {i === 0 ? <GoldBadgeIcon /> : i === 1 ? <SilverBadgeIcon /> : <BronzeBadgeIcon />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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

  useEffect(() => {
    const fetchSupporters = async () => {
      try {
        const res = await fetch('/api/contributions');
        if (res.ok) {
          const data = await res.json();
          setSupporters(data.supporters || []);
        }
      } catch (err) {
        console.error('Error fetching supporters:', err);
      }
    };
    fetchSupporters();
  }, []);

  useEffect(() => {
    const fetchAchievers = async () => {
      try {
        const res = await fetch('/api/admin/achievers', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.achievers) setAchieversData(data.achievers);
        }
      } catch (err) {
        console.error('Error fetching achievers:', err);
      }
    };
    fetchAchievers();
  }, []);

  const chiefDirectors = supporters.filter((s) => s.designation === 'Chief Executive Director');
  const executiveDirectors = supporters.filter((s) => s.designation === 'Executive Director');

  const hasAchievers = !!(
    achieversData?.pv?.ced?.some((a) => a.name?.trim() || a.image) ||
    achieversData?.pv?.ed?.some((a) => a.name?.trim() || a.image) ||
    achieversData?.income?.ced?.some((a) => a.name?.trim() || a.image) ||
    achieversData?.income?.ed?.some((a) => a.name?.trim() || a.image)
  );

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
              <div className="hero-logo-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/success-india-logo.jpeg"
                  alt="Success India Logo"
                  className="hero-logo-main"
                />
              </div>
            </div>

            <div className="hero-quote-col animate-slide-up">
  <h1
  style={{
    fontFamily: "var(--font-heading), Inter, sans-serif",
    fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
    fontWeight: 800,
    lineHeight: 1.16,
    color: "#ffffff",
    margin: 0,
    fontStyle: "italic",
    textShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
    maxWidth: "1100px", // adjust this
    width: "100%",
  }}
>
  &ldquo;OUR BIGGEST DREAM IS
  <br />
  TO MAKE <span style={{ color: "#f7c948" }}>YOUR DREAM</span>
  <br />
  YOUR DREAM COME TRUE&rdquo;
</h1>

  <div
    style={{
      textAlign: "right",
      marginTop: "12px",
    }}
  >
    <span
      style={{
        fontSize: "clamp(0.9rem, 1.5vw, 1.3rem)",
        fontWeight: 600,
        fontStyle: "italic",
        color: "#fff",
      }}
    >
      29.03.2020
    </span>
  </div>
</div>
          </div>
        </section>

        <section className="owner-profile-section container">
          <div className="owner-profile-grid">
            <div className="owner-profile-left">
              <span className="profile-badge">Success Team Leadership</span>
              <h2 className="owner-title">SUPER STAR</h2>
              <h2 className="owner-title">J.SURENDAR</h2>
              <p className="owner-subtitle-role">BOARD OF VICE PRESIDENT</p>
              <p className="owner-subtitle-role">FOUNDER OF SUCCESS TEAM</p>
              
              <div className="owner-image-wrapper mobile-only-image">
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
            <div className="owner-profile-right desktop-only-image">
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

        {/* Achievers Section */}
        <section className="achievers-section">
          <div className="container">
            <div className="section-header" style={{ marginBottom: '3.5rem' }}>
              <span className="section-eyebrow">Honoring Excellence</span>
              <h2 className="heading-lg">JUNE MONTH TOP ACHIEVERS</h2>
              <p className="section-subtitle">
                Recognizing the outstanding leadership, PV milestones, and income milestones of our Star Directors.
              </p>
            </div>

            {!hasAchievers ? (
              <div className="no-records-card animate-fade-in">
                <div className="no-records-icon">🏆</div>
                <h3 className="no-records-title">No Record Found</h3>
                <p className="no-records-desc">
                  Top achiever standings for June are currently empty. Check back later for updates!
                </p>
              </div>
            ) : (
              <div className="achievers-grid">
                {renderAchieverPanel(achieversData.pv.ced, "STAR OF CHIEF EXECUTIVE DIRECTOR", "TOP 3 PV ACHIEVERS", "pv-color")}
                {renderAchieverPanel(achieversData.income.ced, "STAR OF CHIEF EXECUTIVE DIRECTOR", "TOP 3 INCOME ACHIEVERS", "income-color")}
                {renderAchieverPanel(achieversData.pv.ed, "STAR OF EXECUTIVE DIRECTOR", "TOP 3 PV ACHIEVERS", "pv-color")}
                {renderAchieverPanel(achieversData.income.ed, "STAR OF EXECUTIVE DIRECTOR", "TOP 3 INCOME ACHIEVERS", "income-color")}
                <div className="achievers-center-badge">🏆</div>
              </div>
            )}
          </div>
        </section>

        {supporters.length > 0 && (
          <section className="contributors-carousel-section">
            <div className="container">
              <div className="section-header" style={{ marginBottom: '2.5rem' }}>
                <h2 className="heading-lg">
                  JUNE MONTH CONTRIBUTORS
                </h2>
                <p className="section-subtitle">
                  Approved Success Team System Supporters driving growth and leadership development this month.
                </p>
              </div>

              {chiefDirectors.length > 0 && (
                <div className="designation-group">
                  <h3 className="designation-title">CHIEF EXECUTIVE DIRECTOR</h3>
                  <div className="contributors-grid">
                    {chiefDirectors.map((s) => (
                      <div key={`contrib-chief-${s.id}`} className="contributor-card" title={s.name}>
                        <div className="contributor-img-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.vpImage} alt={s.name} className="contributor-img" />
                        </div>
                        <div className="contributor-info">
                          <h3 className="contributor-name">{s.name}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {executiveDirectors.length > 0 && (
                <div className="designation-group" style={{ marginTop: '3.5rem' }}>
                  <h3 className="designation-title">EXECUTIVE DIRECTOR</h3>
                  <div className="contributors-grid">
                    {executiveDirectors.map((s) => (
                      <div key={`contrib-exec-${s.id}`} className="contributor-card" title={s.name}>
                        <div className="contributor-img-wrap">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.vpImage} alt={s.name} className="contributor-img" />
                        </div>
                        <div className="contributor-info">
                          <h3 className="contributor-name">{s.name}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <style>{`
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
          border-radius: 24px;
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
          width: clamp(260px, 45vw, 420px);
          height: auto;
          max-height: clamp(260px, 45vw, 420px);
          border: 6px solid #ffffff;
          object-fit: contain;
          border-radius: 16px;
          display: block;
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

        .mobile-only-image {
          display: none;
        }

        .desktop-only-image {
          display: flex;
        }

        @media (max-width: 991px) {
          .mobile-only-image {
            display: block;
            margin: 1.5rem auto;
          }
          .desktop-only-image {
            display: none !important;
          }
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
          max-width: 440px;
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

        /* Supporters Section styling */
        .supporters-section {
          padding: 5rem 2rem;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
        }

        .supporters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .supporter-card-item {
          background: white;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.75rem 1.5rem;
          text-align: center;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .supporter-card-item:hover {
          transform: translateY(-6px);
          box-shadow: 0 15px 35px rgba(22, 163, 74, 0.08);
          border-color: #10b981;
        }

        .supporter-img-wrap {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 1.25rem;
          border: 3px solid #10b981;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
          background: #f1f5f9;
        }

        .supporter-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .supporter-card-item:hover .supporter-img {
          transform: scale(1.08);
        }

        .supporter-name-text {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 0.35rem;
        }

        .supporter-badge-wrap {
          margin-bottom: 0.65rem;
        }

        .supporter-designation-badge {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 700;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 3px 10px;
          border-radius: 99px;
          text-transform: uppercase;
        }

        .supporter-vp-text {
          font-size: 0.85rem;
          color: #6b7280;
          font-weight: 600;
        }

        @media (max-width: 640px) {
          .hero-section {
            padding: 4.25rem 0 5.5rem;
          }

          .owner-profile-section,
          .routes-section,
          .supporters-section {
            padding: 4.5rem 1.25rem;
          }

          .stats-section {
            padding: 4rem 1.25rem;
          }
        }

        .landing-page-content {
          width: 100%;
        }

        /* Contributors Carousel Section */
        .contributors-carousel-section {
          padding: 5rem 0 6rem;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          border-bottom: 1px solid #e2e8f0;
          overflow: hidden;
          position: relative;
        }

        .designation-group {
          margin-bottom: 3.5rem;
        }

        .designation-title {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 2rem;
          text-align: center;
          position: relative;
        }

        .designation-title::after {
          content: '';
          display: block;
          width: 50px;
          height: 3px;
          background: #10b981;
          margin: 0.75rem auto 0;
          border-radius: 99px;
        }

        .contributors-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: 3px 1.5px;
          justify-content: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .contributor-card {
          width: 100%;
          max-width: 64px;
          background: transparent;
          border: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: none;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          margin: 0 auto;
        }

        .contributor-card:hover {
          transform: translateY(-4px);
        }

        .contributor-img-wrap {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 0.3rem;
          border: 1.5px solid #10b981;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.1);
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .contributor-card:hover .contributor-img-wrap {
          border-color: #10b981;
          transform: scale(1.05);
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }

        .contributor-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .contributor-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          box-sizing: border-box;
          padding: 0 2px;
        }

        .contributor-name {
          font-family: var(--font-sans), sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          color: #374151;
          margin: 0;
          line-height: 1.2;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
          word-break: break-word;
        }

        @media (max-width: 640px) {
          .contributors-carousel-section {
            padding: 4.5rem 1.25rem;
          }
        }

        /* ── Achievers Grid ── */
        .achievers-section {
          padding: 6.5rem 2rem;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          position: relative;
        }
        .achievers-grid {
          display: grid;
          grid-template-columns: 1fr;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          background: #ffffff;
        }
        @media (min-width: 900px) {
          .achievers-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .achiever-panel {
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
          box-sizing: border-box;
        }

        /* Desktop Dividers */
        @media (min-width: 900px) {
          .achievers-grid::before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: 2px;
            background: linear-gradient(to bottom, transparent 5%, #cbd5e1 15%, #cbd5e1 85%, transparent 95%);
            transform: translateX(-50%);
            z-index: 2;
          }
          .achievers-grid::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            height: 2px;
            background: linear-gradient(to right, transparent 5%, #cbd5e1 15%, #cbd5e1 85%, transparent 95%);
            transform: translateY(-50%);
            z-index: 2;
          }
          .achievers-center-badge {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 46px;
            height: 46px;
            background: #ffffff;
            border: 2px solid #cbd5e1;
            border-radius: 50%;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            font-size: 1.3rem;
          }
        }
        @media (max-width: 899px) {
          .achiever-panel {
            border-bottom: 2.5px dashed #cbd5e1;
          }
          .achiever-panel:last-child {
            border-bottom: none;
          }
          .achievers-center-badge {
            display: none;
          }
        }

        .panel-header {
          margin-bottom: 2.5rem;
        }
        .panel-designation {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .panel-category {
          font-size: 0.8rem;
          font-weight: 850;
          margin: 0.4rem 0 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .pv-color {
          color: #10b981;
        }
        .income-color {
          color: #d97706;
        }

        .medals-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem 0.5rem;
          justify-content: center;
          align-items: flex-start;
        }
        .medal-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }


        @media (max-width: 640px) {
          .contributors-carousel-section {
            padding: 4.5rem 1.25rem;
          }
        }

        /* Achiever Photo Frame & Image */
        .achiever-pro-image-wrapper {
          width: 120px;
          height: 140px;
          border-radius: 12px;
          overflow: hidden;
          background: #f8fafc;
          border: 3px solid #ffffff;
          box-shadow: 0 8px 16px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
          margin-bottom: 0.75rem;
          position: relative;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease;
        }

        .achiever-pro-image-wrapper:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.08);
          border-color: #10b981;
        }

        .achiever-pro-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        /* Empty Slot Style */
        .achiever-empty-slot {
          width: 100px;
          height: 120px;
          border-radius: 12px;
          background: #f1f5f9;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          margin-bottom: 0.75rem;
        }

        .achiever-empty-slot span {
          font-family: var(--font-heading), sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          line-height: 1.2;
          padding: 8px;
        }

        /* Achiever Name - Professional Bold Style */
        .medal-achiever-name {
          display: block;
          font-family: var(--font-heading), 'Inter', sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          margin-top: 0.65rem;
          margin-bottom: 0.15rem;
          line-height: 1.25;
          max-width: 110px;
          word-break: break-word;
        }

        /* Rank Badge - Gold / Silver / Bronze emoji medal */
        .achiever-rank-badge-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 6px;
        }

        .rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          line-height: 1;
          filter: drop-shadow(0 3px 8px rgba(0,0,0,0.2));
          animation: rankBadgePop 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
          transition: transform 0.25s ease;
          cursor: default;
        }

        .rank-badge:hover {
          transform: scale(1.2) rotate(-6deg);
        }

        @keyframes rankBadgePop {
          0%   { opacity: 0; transform: scale(0.4) rotate(-20deg); }
          65%  { transform: scale(1.15) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }

        /* ── Achievers Grid ── */

        .achievers-section {
          padding: 6.5rem 2rem;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          position: relative;
        }
        .achievers-grid {
          display: grid;
          grid-template-columns: 1fr;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          background: #ffffff;
        }
        @media (min-width: 900px) {
          .achievers-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .achiever-panel {
          padding: 3rem 2rem;
          text-align: center;
          position: relative;
          box-sizing: border-box;
        }

        /* Desktop Dividers */
        @media (min-width: 900px) {
          .achievers-grid::before {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            left: 50%;
            width: 2px;
            background: linear-gradient(to bottom, transparent 5%, #cbd5e1 15%, #cbd5e1 85%, transparent 95%);
            transform: translateX(-50%);
            z-index: 2;
          }
          .achievers-grid::after {
            content: '';
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            height: 2px;
            background: linear-gradient(to right, transparent 5%, #cbd5e1 15%, #cbd5e1 85%, transparent 95%);
            transform: translateY(-50%);
            z-index: 2;
          }
          .achievers-center-badge {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 46px;
            height: 46px;
            background: #ffffff;
            border: 2px solid #cbd5e1;
            border-radius: 50%;
            z-index: 10;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
            font-size: 1.3rem;
          }
        }
        @media (max-width: 899px) {
          .achiever-panel {
            border-bottom: 2.5px dashed #cbd5e1;
          }
          .achiever-panel:last-child {
            border-bottom: none;
          }
          .achievers-center-badge {
            display: none;
          }
        }

        .panel-header {
          margin-bottom: 2.5rem;
        }
        .panel-designation {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.25rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.05em;
          margin: 0;
        }
        .panel-category {
          font-size: 0.8rem;
          font-weight: 850;
          margin: 0.4rem 0 0;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .pv-color {
          color: #10b981;
        }
        .income-color {
          color: #d97706;
        }

        .medals-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem 0.5rem;
          justify-content: center;
          align-items: flex-start;
        }



        /* ── No Records Empty State ── */
        .no-records-card {
          max-width: 480px;
          margin: 2.5rem auto 1rem;
          padding: 3rem 2rem;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          text-align: center;
          box-shadow: 
            0 12px 30px -10px rgba(0, 0, 0, 0.04),
            0 8px 20px -12px rgba(0, 0, 0, 0.03);
          transition: all 0.3s ease;
        }
        .no-records-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 16px 36px -8px rgba(0, 0, 0, 0.06),
            0 10px 24px -10px rgba(0, 0, 0, 0.04);
        }
        .no-records-icon {
          font-size: 3.25rem;
          margin-bottom: 1.25rem;
          display: inline-block;
          animation: noRecordsFloat 3s ease-in-out infinite;
        }
        .no-records-title {
          font-family: var(--font-heading), sans-serif;
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          margin: 0 0 0.5rem;
        }
        .no-records-desc {
          font-size: 0.9rem;
          color: #64748b;
          line-height: 1.55;
          margin: 0;
          font-weight: 500;
        }
        @keyframes noRecordsFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        .achiever-panel-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.25rem 1.5rem;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          border-radius: 16px;
          margin-top: 1rem;
          width: 240px;
          margin-left: auto;
          margin-right: auto;
          transition: all 0.3s ease;
        }

        .empty-badge-circle {
          font-size: 2.2rem;
          margin-bottom: 0.75rem;
          filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));
          animation: floatTrophy 3s ease-in-out infinite;
        }

        @keyframes floatTrophy {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        .empty-badge-text {
          font-family: var(--font-heading), 'Inter', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Gold, Silver, Bronze borders for images */
        .achiever-pro-image-wrapper.rank-1 {
          border: 3px solid #f59e0b !important;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.3), 0 4px 10px rgba(0,0,0,0.1);
        }
        .achiever-pro-image-wrapper.rank-2 {
          border: 3px solid #94a3b8 !important;
          box-shadow: 0 0 15px rgba(148, 163, 184, 0.25), 0 4px 10px rgba(0,0,0,0.1);
        }
        .achiever-pro-image-wrapper.rank-3 {
          border: 3px solid #b45309 !important;
          box-shadow: 0 0 15px rgba(180, 83, 9, 0.2), 0 4px 10px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
