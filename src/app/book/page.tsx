'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin, Calendar, Search, AlertCircle, ChevronRight } from 'lucide-react';
import SeatBookingModal from '../components/SeatBookingModal';

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

export default function BookPage() {
  return (
    <Suspense fallback={null}>
      <BookingEngine />
    </Suspense>
  );
}

function BookingEngine() {
  const searchParams = useSearchParams();

  // Search filter states
  const [venue, setVenue] = useState('Chromepet, Chennai');
  const [seminar, setSeminar] = useState('Leadership Development Seminars');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [date, setDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  });

  // Data states
  const [events, setEvents] = useState<any[]>([]);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal state
  const [modalEvent, setModalEvent] = useState<any>(null);

  // ── Initialization ──────────────────────────────────────────────────────────
  useEffect(() => {
    initializeBookingSearch();
  }, [searchParams]);

  const initializeBookingSearch = async () => {
    const sParam = searchParams.get('venue') || searchParams.get('source');
    const dParam = searchParams.get('seminar') || searchParams.get('destination');
    const tParam = searchParams.get('date');
    const eParam = searchParams.get('eventId');

    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      const fetchedEvents = res.ok
        ? (data.events || []).map((event: any) => ({
          ...event,
          legacySource: event.venue,
          legacyDestination: event.title,
        }))
        : [];
      setEvents(fetchedEvents);

      const matchedEvent = eParam
        ? fetchedEvents.find((event: any) => event.id === eParam)
        : fetchedEvents.find(
          (event: any) =>
            (!sParam || event.venue === sParam || event.legacySource === sParam) &&
            (!dParam || event.title === dParam || event.legacyDestination === dParam)
        );

      const resolvedVenue = sParam || matchedEvent?.venue || matchedEvent?.legacySource || venue;
      const resolvedSeminar = dParam || matchedEvent?.title || matchedEvent?.legacyDestination || seminar;
      const resolvedDate = tParam || matchedEvent?.eventDate || date;
      const resolvedEventId = eParam || matchedEvent?.id || '';

      setVenue(resolvedVenue);
      setSeminar(resolvedSeminar);
      setDate(resolvedDate);
      setSelectedEventId(resolvedEventId);

      if (resolvedEventId || (sParam && dParam && resolvedDate)) {
        handleSearchSeminars(resolvedVenue, resolvedSeminar, resolvedDate, resolvedEventId);
      }
    } catch (error) {
      console.error('Unable to initialize seminar events:', error);
      if (sParam) setVenue(sParam);
      if (dParam) setSeminar(dParam);
      if (tParam) setDate(tParam);
      if (sParam && dParam && tParam) {
        handleSearchSeminars(sParam, dParam, tParam, eParam || '');
      }
    }
  };

  // ── Dropdown Handlers ───────────────────────────────────────────────────────
  const handleEventSelect = (eventIdOrTitle: string) => {
    const event = events.find((item) => item.id === eventIdOrTitle);
    if (!event) {
      setSelectedEventId('');
      setSeminar(eventIdOrTitle);
      return;
    }
    setSelectedEventId(event.id);
    setVenue(event.venue || event.legacySource || venue);
    setSeminar(event.title || event.legacyDestination || seminar);
    if (event.eventDate) setDate(event.eventDate);
  };

  const handleLocationSelect = (location: string) => {
    setVenue(location);
    const firstMatch = events.find((event) => (event.venue || event.legacySource) === location);
    if (firstMatch) {
      setSelectedEventId(firstMatch.id);
      setSeminar(firstMatch.title || firstMatch.legacyDestination || seminar);
      if (firstMatch.eventDate) setDate(firstMatch.eventDate);
    } else {
      setSelectedEventId('');
    }
  };

  const eventLocations = events.length
    ? (Array.from(new Set(events.map((event) => event.venue || event.legacySource).filter(Boolean))) as string[])
    : fallbackLocations;

  const eventOptions = events.length
    ? events.filter((event) => (event.venue || event.legacySource) === venue)
    : [];

  // ── Search Seminars ─────────────────────────────────────────────────────────
  const handleSearchSeminars = async (
    venueVal = venue,
    seminarVal = seminar,
    dateVal = date,
    eventIdVal = selectedEventId
  ) => {
    if (venueVal === seminarVal) {
      setErrorMsg('Please choose a valid seminar location and category.');
      return;
    }
    setErrorMsg('');
    setSearchTriggered(true);
    setSeminars([]);

    try {
      const eventParam = eventIdVal ? `&eventId=${encodeURIComponent(eventIdVal)}` : '';
      const res = await fetch(
        `/api/events?venue=${encodeURIComponent(venueVal)}&seminar=${encodeURIComponent(seminarVal)}&date=${encodeURIComponent(dateVal)}${eventParam}`
      );
      const data = await res.json();
      if (res.ok) {
        const fetchedSeminars = (data.events || data.seminars || []).map((event: any) => ({
          ...event,
          legacySource: event.venue,
          legacyDestination: event.title,
        }));
        setSeminars(fetchedSeminars);
      } else {
        setErrorMsg(data.error || 'Failed to fetch seminar listings');
      }
    } catch (err) {
      setErrorMsg('A connection error occurred while searching seminars.');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="booking-page container">

      {/* Seat Booking Modal */}
      {modalEvent && (
        <SeatBookingModal
          event={modalEvent}
          onClose={() => setModalEvent(null)}
        />
      )}

      {/* Page Header */}
      <div className="page-header animate-slide-up">
        <span className="page-kicker">Event Booking Portal</span>
        <h1 className="page-title">Find &amp; Reserve Your Seat</h1>
        <p className="page-subtitle">
          Search for available seminar sessions, then click <strong>Reserve Seats</strong> to instantly book with auto-assigned consecutive seats.
        </p>
      </div>

      {/* Search Bar */}
      <div className="search-bar-widget glass-card animate-slide-up">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSeminars();
          }}
          className="search-form-inline"
        >
          <div className="inline-group">
            <label className="inline-label">Location</label>
            <select
              value={venue}
              onChange={(e) => handleLocationSelect(e.target.value)}
              className="form-control select-control"
            >
              {eventLocations.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>

          <div className="inline-group">
            <label className="inline-label">Event Event</label>
            <select
              value={selectedEventId || seminar}
              onChange={(e) => handleEventSelect(e.target.value)}
              className="form-control select-control"
            >
              {eventOptions.length > 0 ? (
                eventOptions.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title || event.name} • ₹{event.price}
                  </option>
                ))
              ) : (
                fallbackEventCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))
              )}
            </select>
          </div>

          <div className="inline-group">
            <label className="inline-label">Event Date</label>
            <input
              type="date"
              value={date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
              className="form-control date-control"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary search-submit-btn">
            <Search size={16} /> Find Seminars
          </button>
        </form>
      </div>

      {/* Error */}
      {errorMsg && (
        <div className="error-alert animate-shake">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results */}
      <div className="search-results-section">
        {seminars.length === 0 ? (
          searchTriggered ? (
            <div className="empty-results glass-card animate-scale-in">
              <AlertCircle size={40} className="empty-icon" />
              <h3 className="heading-sm">No Event Scheduled</h3>
              <p>
                There are no listed {seminar} sessions at {venue} on {date}. Modify your
                location, seminar, or date filters.
              </p>
            </div>
          ) : (
            <div className="welcome-search-callout glass-card animate-scale-in">
              <MapPin size={40} className="callout-icon" />
              <h3 className="heading-sm">Plan Your Event Visit</h3>
              <p>
                Select a location, seminar category, and date above to view available sessions
                and reserve seats.
              </p>
            </div>
          )
        ) : (
          <div className="seminars-list animate-slide-up">
            <h3 className="heading-sm list-title">
              Available Event Sessions for {date}
            </h3>
            {seminars.map((seminarEvent) => (
              <div key={seminarEvent.id} className="seminar-card-item hover-glow-card">
                <div className="seminar-card-main">
                  <div className="seminar-company">
                    <span className="seminar-name-txt">{seminarEvent.name}</span>
                    <div className="seminar-badge-row">
                      <span className="seminar-type-badge">{seminarEvent.type}</span>
                      <span className="event-status-badge">
                        {seminarEvent.status || 'Available to Register'}
                      </span>
                    </div>
                  </div>

                  <div className="seminar-timeline">
                    <div className="timeline-node">
                      <span className="timeline-city">
                        {seminarEvent.venue || seminarEvent.legacySource}
                      </span>
                    </div>
                    <div className="timeline-connector">
                      <span className="timeline-duration">{seminarEvent.duration}</span>
                      <hr className="connector-line" />
                    </div>
                    <div className="timeline-node">
                      <span className="timeline-city">
                        {seminarEvent.title || seminarEvent.legacyDestination}
                      </span>
                    </div>
                  </div>

                  <div className="seminar-pricing">
                    <span className="price-label">Seat Fee</span>
                    <span className="price-value">
                      ₹{seminarEvent.price} <span className="seat-label">/ seat</span>
                    </span>
                  </div>

                  <button
                    onClick={() => setModalEvent(seminarEvent)}
                    className="btn btn-primary select-seminar-btn"
                  >
                    Reserve Seats
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Styles */}
      <style jsx>{`
        .booking-page {
          padding: 3rem 1.5rem 6rem 1.5rem;
          max-width: 1100px;
        }

        /* Page Header */
        .page-header {
          margin-bottom: 2.5rem;
        }

        .page-kicker {
          display: inline-block;
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          margin-bottom: 0.5rem;
        }

        .page-title {
          font-family: var(--font-heading);
          font-size: clamp(1.75rem, 4vw, 2.5rem);
          font-weight: 800;
          color: var(--foreground);
          margin: 0 0 0.75rem;
        }

        .page-subtitle {
          color: var(--muted);
          font-size: 1rem;
          line-height: 1.6;
          max-width: 640px;
        }

        /* Error */
        .error-alert {
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 2rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
        }

        /* Search Bar */
        .search-bar-widget {
          background: white;
          padding: 1.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          margin-bottom: 2rem;
          box-shadow: var(--shadow-sm);
        }

        .search-form-inline {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .search-form-inline {
            flex-direction: row;
            align-items: flex-end;
          }
        }

        .inline-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .inline-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .select-control, .date-control {
          background: var(--input);
          border-color: var(--border);
          font-weight: 600;
          cursor: pointer;
        }

        .search-submit-btn {
          height: 43px;
          padding: 0 1.5rem;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }

        /* Results */
        .search-results-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .empty-results, .welcome-search-callout {
          padding: 4rem 2rem;
          text-align: center;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-icon, .callout-icon {
          color: var(--muted-light);
        }

        .empty-results p, .welcome-search-callout p {
          color: var(--muted);
          max-width: 450px;
          line-height: 1.6;
        }

        .seminars-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .list-title {
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
        }

        .seminar-card-item {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-normal);
        }

        .seminar-card-item:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
        }

        .seminar-card-main {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .seminar-card-main {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .seminar-company {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 200px;
        }

        .seminar-name-txt {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .seminar-badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }

        .seminar-type-badge {
          font-size: 0.75rem;
          font-weight: 600;
          background: var(--input);
          color: var(--muted);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }

        .event-status-badge {
          font-size: 0.72rem;
          font-weight: 800;
          color: #9a3412;
          background: #ffedd5;
          border: 1px solid #fed7aa;
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-sm);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .seminar-timeline {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .timeline-city {
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--foreground);
        }

        .timeline-connector {
          flex: 1;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .timeline-duration {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 600;
          background: white;
          padding: 0 0.5rem;
          position: relative;
          z-index: 2;
        }

        .connector-line {
          border: 0;
          border-top: 2px dashed var(--border);
          width: 100%;
          position: absolute;
          top: 50%;
          left: 0;
          z-index: 1;
        }

        .seminar-pricing {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          min-width: 110px;
        }

        .price-label {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 500;
        }

        .price-value {
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--primary);
        }

        .seat-label {
          font-size: 0.8rem;
          font-weight: 500;
          color: var(--muted);
        }

        .select-seminar-btn {
          padding: 0.7rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 700;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
