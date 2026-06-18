'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Users, ArrowRight, Ticket } from 'lucide-react';
import SeatBookingModal from '../components/SeatBookingModal';

type SeminarEvent = {
  id: string;
  title: string;
  venue: string;
  eventDate?: string;
  eventTime?: string;
  price: number;
  totalSeats?: number;
  name?: string;
  bookedSeatsByTime?: Record<string, string[]>;
};

export default function EventsPage() {
  const [events, setEvents] = useState<SeminarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalEvent, setModalEvent] = useState<SeminarEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (res.ok) {
          let list = data.events || [];
          if (list.length === 0) {
            list = [
              {
                id: "seminar_mega_mass_2026",
                title: "SUCCESS TEAM MEGA MASS EDUCATIONAL TRAINING",
                name: "SUCCESS TEAM MEGA MASS EDUCATIONAL TRAINING",
                venue: "Hotel Chennai Deluxe",
                eventDate: "2026-06-28",
                eventTime: "09:00 AM",
                price: 1000,
                totalSeats: 300,
              }
            ];
          } else {
            list = list.map((ev: any, idx: number) => {
              if (idx === 0) {
                return {
                  ...ev,
                  title: "SUCCESS TEAM MEGA MASS EDUCATIONAL TRAINING",
                  name: "SUCCESS TEAM MEGA MASS EDUCATIONAL TRAINING",
                  venue: "Hotel Chennai Deluxe",
                  eventDate: "2026-06-28",
                  eventTime: "09:00 AM",
                  totalSeats: 300,
                };
              }
              return {
                ...ev,
                totalSeats: 300,
              };
            });
          }
          setEvents(list);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  return (
    <div className="events-page">
      {modalEvent && (
        <SeatBookingModal event={modalEvent} onClose={() => setModalEvent(null)} />
      )}

      {/* Hero Banner */}
      <section className="events-hero">
        <div className="events-hero-inner container">
          <span className="events-hero-kicker">
            <Calendar size={15} /> Upcoming Events
          </span>
          <h1 className="events-hero-title">
            Success Team <span className="events-hero-accent">Events</span>
          </h1>
          <p className="events-hero-subtitle">
            Browse and reserve your seat for our upcoming leadership events, chapter meetups, and growth workshops.
          </p>
        </div>
      </section>

      {/* Events Grid */}
      <section className="events-grid-section container">
        {loading ? (
          <div className="events-loading">
            <div className="events-loader" />
            <p>Loading events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="events-empty-state">
            <Calendar size={52} className="events-empty-icon" />
            <h3>No Upcoming Events</h3>
            <p>Check back soon — new events are published regularly.</p>
          </div>
        ) : (
          <div className="events-cards-grid">
            {events.map((event, index) => (
              <div
                key={event.id}
                className="event-card"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {index === 0 && (
                  <div className="event-card-image-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/img.png" alt={event.title || event.name} className="event-card-image" />
                  </div>
                )}
                <div className="event-card-badge">
                  <Ticket size={13} /> Open Registration
                </div>
                <h2 className="event-card-title">{event.title || event.name}</h2>

                <div className="event-card-meta">
                  <div className="event-meta-row">
                    <MapPin size={14} />
                    <span>{event.venue}</span>
                  </div>
                  {event.eventDate && (
                    <div className="event-meta-row">
                      <Calendar size={14} />
                      <span>{event.eventDate}</span>
                    </div>
                  )}
                  {event.eventTime && (
                    <div className="event-meta-row">
                      <Clock size={14} />
                      <span>{event.eventTime}</span>
                    </div>
                  )}
                  {event.totalSeats && (
                    <div className="event-meta-row">
                      <Users size={14} />
                      <span>{event.totalSeats} seats available</span>
                    </div>
                  )}
                </div>

                <div className="event-card-footer">
                  <div className="event-price-tag">
                    <span className="event-price-label">Amount</span>
                    <span className="event-price-amount">₹{event.price}</span>
                  </div>
                  <button
                    className="event-book-btn"
                    onClick={() => setModalEvent(event)}
                  >
                    Book Seat <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        .events-page {
          min-height: 100vh;
          background: var(--background, #f9fafb);
        }

        .events-hero {
          background: linear-gradient(135deg, #10b981 0%, #059669 60%, #047857 100%);
          color: white;
          padding: 4rem 1.5rem 5rem;
          position: relative;
          overflow: hidden;
        }

        .events-hero::after {
          content: '';
          position: absolute;
          inset: auto 0 0 0;
          height: 80px;
          background: linear-gradient(180deg, transparent, rgba(249,250,251,0.98));
          pointer-events: none;
        }

        .events-hero-inner {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .events-hero-kicker {
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

        .events-hero-title {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: clamp(2rem, 6vw, 3.25rem);
          font-weight: 800;
          line-height: 1.1;
          margin: 0 0 1rem;
          color: white;
        }

        .events-hero-accent {
          color: #bbf7d0;
        }

        .events-hero-subtitle {
          font-size: 1rem;
          color: #d1fae5;
          line-height: 1.7;
          max-width: 560px;
          margin: 0 auto;
        }

        .events-grid-section {
          padding: 3rem 1.5rem 5rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .events-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 4rem;
          color: #6b7280;
        }

        .events-loader {
          width: 40px;
          height: 40px;
          border: 3px solid #d1fae5;
          border-top-color: #10b981;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .events-empty-state {
          text-align: center;
          padding: 5rem 2rem;
          color: #6b7280;
        }

        .events-empty-icon {
          color: #d1fae5;
          margin-bottom: 1rem;
        }

        .events-empty-state h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .events-cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 600px) {
          .events-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 960px) {
          .events-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .event-card {
          background: #ffffff;
          border: 1.5px solid #d1fae5;
          border-radius: 18px;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 2px 12px rgba(16, 185, 129, 0.06);
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          animation: cardFadeUp 0.4s ease both;
        }

        @keyframes cardFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .event-card:hover {
          border-color: #10b981;
          transform: translateY(-5px);
          box-shadow: 0 12px 36px rgba(16, 185, 129, 0.15);
        }

        .event-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #ecfdf5;
          color: #059669;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 99px;
          align-self: flex-start;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .event-card-title {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          line-height: 1.4;
          margin: 0;
          flex: 1;
        }

        .event-card-meta {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .event-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.84rem;
          color: #6b7280;
          font-weight: 500;
        }

        .event-meta-row svg {
          color: #10b981;
          flex-shrink: 0;
        }

        .event-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px solid #f3f4f6;
          gap: 0.75rem;
        }

        .event-price-tag {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .event-price-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .event-price-amount {
          font-family: var(--font-heading, 'Inter', sans-serif);
          font-size: 1.5rem;
          font-weight: 800;
          color: #10b981;
        }

        .event-book-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 0.65rem 1.15rem;
          font-size: 0.88rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
          white-space: nowrap;
        }

        .event-book-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.42);
        }

        .container {
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        .event-card-image-wrap {
          width: 100%;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 0.5rem;
          border: 1px solid #e2e8f0;
        }

        .event-card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .event-card:hover .event-card-image {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
