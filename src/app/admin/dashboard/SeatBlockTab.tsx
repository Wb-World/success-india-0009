'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Save, Lock, Unlock, ChevronDown, ChevronUp, AlertCircle, CheckCircle } from 'lucide-react';

import { ROWS, SEATS_PER_ROW, ALL_SEATS, TOTAL_SEATS, parseBulkSeats } from '@/lib/seat-config';

type EventData = {
  id: string;
  title?: string;
  name?: string;
  venue: string;
  eventDate?: string;
  eventTime?: string;
  price: number;
  totalSeats?: number;
};

type Props = {
  event: EventData;
  adminUser: { id: string; username: string; role: string };
};

export default function SeatBlockTab({ event, adminUser }: Props) {
  const resolvedEventId = event.id === 'seminar_101' ? 'seminar_mega_mass_2026' : event.id;

  const [expanded, setExpanded] = useState(false);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);
  const [blockedSeats, setBlockedSeats] = useState<string[]>([]);
  const [localBlockedSeats, setLocalBlockedSeats] = useState<string[]>([]);
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [bulkInput, setBulkInput] = useState('');

  // Fetch booked and blocked seats for this event
  const fetchSeatsData = async () => {
    setLoadingSeats(true);
    setMessage(null);
    try {
      // 1. Fetch blocked seats list first
      const blockedRes = await fetch(`/api/admin/blocked-seats?eventId=${encodeURIComponent(resolvedEventId)}&t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'x-admin-id': adminUser.id,
        },
      });
      let blockedList: string[] = [];
      if (blockedRes.ok) {
        const blockedData = await blockedRes.json();
        blockedList = blockedData.blockedSeats || [];
      } else {
        console.error('Failed to fetch blocked seats');
      }

      // 2. Fetch merged bookings (the exact same call as the customer booking modal)
      const bookedRes = await fetch(`/api/bookings?eventId=${encodeURIComponent(resolvedEventId)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      let mergedSeatsList: string[] = [];
      if (bookedRes.ok) {
        const bookedData = await bookedRes.json();
        mergedSeatsList = bookedData.seats || [];
      } else {
        console.error('Failed to fetch booked seats');
      }

      // 3. Compute confirmed/pending bookings by filtering out blocked seats
      const actualBooked = mergedSeatsList.filter((s) => !blockedList.includes(s));
      
      // Temporary debug logs
      console.log("Customer booking response", { seats: mergedSeatsList });
      console.log("Merged seats", mergedSeatsList);
      console.log("Blocked seats", blockedList);
      console.log("Final booked seats", actualBooked);

      setBookedSeats(actualBooked);
      setBlockedSeats(blockedList);
      setLocalBlockedSeats(blockedList);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to retrieve seat mapping details.' });
    } finally {
      setLoadingSeats(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      fetchSeatsData();
    } else {
      setBookedSeats([]);
      setBlockedSeats([]);
      setLocalBlockedSeats([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded]);

  // Click individual seat
  const handleSeatClick = (seatId: string) => {
    if (bookedSeats.includes(seatId)) return; // Booked cannot be modified

    setLocalBlockedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((s) => s !== seatId); // Unblock
      } else {
        return [...prev, seatId]; // Block
      }
    });
  };

  // Bulk block
  const handleBulkBlock = () => {
    if (!bulkInput.trim()) return;
    const { seats, errors } = parseBulkSeats(bulkInput);

    if (errors.length > 0) {
      alert(`The following validation errors were encountered and skipped:\n${errors.join('\n')}`);
    }

    const validSeats = seats.filter((s) => !bookedSeats.includes(s));

    if (validSeats.length === 0) {
      if (errors.length === 0) {
        alert('No valid, non-booked seats were entered.');
      }
      return;
    }

    setLocalBlockedSeats((prev) => {
      const updated = [...prev];
      validSeats.forEach((code) => {
        if (!updated.includes(code)) {
          updated.push(code);
        }
      });
      return updated;
    });
    setBulkInput('');
  };

  // Bulk unblock
  const handleBulkUnblock = () => {
    if (!bulkInput.trim()) return;
    const { seats, errors } = parseBulkSeats(bulkInput);

    if (errors.length > 0) {
      alert(`The following validation errors were encountered and skipped:\n${errors.join('\n')}`);
    }

    if (seats.length === 0) {
      if (errors.length === 0) {
        alert('No valid seats were entered.');
      }
      return;
    }

    setLocalBlockedSeats((prev) => prev.filter((s) => !seats.includes(s)));
    setBulkInput('');
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/blocked-seats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser.id,
        },
        body: JSON.stringify({
          eventId: resolvedEventId,
          blockedSeats: localBlockedSeats,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBlockedSeats(localBlockedSeats);
        setMessage({ type: 'success', text: 'Blocked seats saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save blocked seats' });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'An error occurred saving changes' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="event-seatblock-card glass-card" style={{ marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', background: '#ffffff', transition: 'box-shadow 0.2s ease' }}>
      <style>{`
        .stage-bar {
          text-align: center;
          padding: 0.6rem 1rem;
          background: linear-gradient(90deg, #6b7280, #4b5563);
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border-radius: 8px;
          margin-bottom: 1.25rem;
        }

        .seat-map-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-x: auto;
          overflow-y: auto;
          max-height: min(520px, calc(90vh - 280px));
          padding: 1.25rem 0.75rem;
          background: #f8fafc;
          border-radius: 14px;
          border: 1px dashed #cbd5e1;
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
        
        .seat-map-wrapper::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .seat-map-wrapper::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 99px;
        }
        .seat-map-wrapper::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 99px;
        }

        .seat-row-group {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: max-content;
        }

        .row-label {
          width: 24px;
          font-size: 0.8rem;
          font-weight: 800;
          color: #64748b;
          text-align: center;
          flex-shrink: 0;
        }

        .seat-row {
          display: flex;
          gap: 8px;
          flex-wrap: nowrap;
        }

        /* ─── Professional Theater Seat Styling ────────────────────────── */
        .sbm-seat {
          position: relative;
          width: 28px;
          height: 28px;
          border-radius: 6px 6px 2px 2px;
          border: 1.5px solid;
          font-size: 0.62rem;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 1.5px 3px rgba(0,0,0,0.06);
        }

        /* Cushion / back support effect */
        .sbm-seat::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 4px;
          right: 4px;
          height: 6px;
          border-radius: 2px;
          background: rgba(255, 255, 255, 0.25);
          pointer-events: none;
        }
        
        /* Seat armrest effects */
        .sbm-seat::after {
          content: '';
          position: absolute;
          bottom: 2px;
          left: 2px;
          right: 2px;
          height: 4px;
          border-radius: 1px;
          background: rgba(0, 0, 0, 0.08);
          pointer-events: none;
        }

        @media (max-width: 480px) {
          .sbm-seat { width: 25px; height: 25px; font-size: 0.55rem; border-width: 1px; }
          .sbm-seat::before { top: 1.5px; left: 3px; right: 3px; height: 5px; }
          .sbm-seat::after { bottom: 1.5px; left: 1.5px; right: 1.5px; height: 3px; }
          .seat-row { gap: 6px; }
        }

        /* Green = Available */
        .seat-available {
          background: linear-gradient(180deg, #ffffff 0%, #ecfdf5 100%);
          border-color: #10b981;
          color: #047857;
        }
        .seat-available::before {
          background: rgba(16, 185, 129, 0.08);
        }
        .seat-available:hover:not(:disabled) {
          background: linear-gradient(180deg, #10b981 0%, #059669 100%);
          border-color: #047857;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(16, 185, 129, 0.25);
        }
        .seat-available:hover:not(:disabled)::before {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Orange = Blocked by Admin */
        .seat-blocked {
          background: linear-gradient(180deg, #ffedd5 0%, #fed7aa 100%);
          border-color: #f97316;
          color: #c2410c;
          transform: scale(1.06);
          box-shadow: 0 3px 8px rgba(249, 115, 22, 0.4);
        }
        .seat-blocked::before {
          background: rgba(249, 115, 22, 0.15);
        }
        .seat-blocked:hover:not(:disabled) {
          background: linear-gradient(180deg, #f97316 0%, #ea580c 100%);
          border-color: #c2410c;
          color: #ffffff;
          transform: translateY(-2px) scale(1.06);
          box-shadow: 0 4px 8px rgba(249, 115, 22, 0.5);
        }
        .seat-blocked:hover:not(:disabled)::before {
          background: rgba(255, 255, 255, 0.3);
        }

        /* Red = Already booked by users */
        .seat-booked {
          background: linear-gradient(180deg, #fee2e2 0%, #fca5a5 100%);
          border-color: #ef4444;
          color: #991b1b;
          cursor: not-allowed;
        }
        .seat-booked::before {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Grey = Disabled / unavailable */
        .seat-disabled {
          background: #e5e7eb;
          border-color: #9ca3af;
          color: #4b5563;
          cursor: not-allowed;
        }
        .seat-disabled::before {
          background: rgba(0, 0, 0, 0.05);
        }

        .pointer-events-none {
          pointer-events: none;
        }

        .seat-legend {
          display: flex;
          gap: 1.5rem;
          margin-top: 1.25rem;
          flex-wrap: wrap;
          padding: 1rem;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }

        .seat-legend span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          color: #4b5563;
          font-weight: 600;
        }

        .legend-dot {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1.5px solid;
        }

        .ld-available { background: #ffffff; border-color: #10b981; }
        .ld-blocked { background: #ffedd5; border-color: #f97316; }
        .ld-booked { background: #fee2e2; border-color: #ef4444; }
        .ld-disabled { background: #e5e7eb; border-color: #9ca3af; }
      `}</style>
      <div className="event-seatblock-row-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: 'bold' }}>{event.title || event.name}</h4>
          <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>{event.venue}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#475569' }}>
            <div>{event.eventDate || 'Scheduled'} &bull; {event.eventTime || ''}</div>
            <div style={{ marginTop: '0.25rem' }}><strong>₹{event.price}</strong> &bull; {event.totalSeats || 60} seats</div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', height: '38px', padding: '0 1rem', fontSize: '0.85rem' }}
          >
            {expanded ? (
              <>Close Seat Block <ChevronUp size={14} /></>
            ) : (
              <>Open Seat Block <ChevronDown size={14} /></>
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="event-seatblock-expanded-content animate-slide-up" style={{ marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h5 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Seat Block (Hype Mode)
            </h5>
            <button
              onClick={fetchSeatsData}
              className="btn btn-secondary btn-refresh"
              disabled={loadingSeats}
              style={{ padding: '4px 8px', fontSize: '0.75rem', height: '28px' }}
            >
              <RefreshCw size={12} className={loadingSeats ? 'animate-spin' : ''} /> Refresh Layout
            </button>
          </div>

          {/* Bulk Controls */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1, minWidth: '240px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Bulk Action (Enter comma-separated seats, e.g. A1, A2, B10)</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="A1, A2, B10"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  className="form-control"
                  style={{ height: '36px', fontSize: '0.85rem' }}
                />
                <button
                  type="button"
                  onClick={handleBulkBlock}
                  className="btn btn-secondary btn-bulk-block"
                  style={{ height: '36px', fontSize: '0.82rem', padding: '0 0.75rem' }}
                >
                  <Lock size={12} /> Block
                </button>
                <button
                  type="button"
                  onClick={handleBulkUnblock}
                  className="btn btn-secondary btn-bulk-unblock"
                  style={{ height: '36px', fontSize: '0.82rem', padding: '0 0.75rem' }}
                >
                  <Unlock size={12} /> Unblock
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className={`message-banner ${message.type === 'success' ? 'success' : 'error'}`} style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {message.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
              <span>{message.text}</span>
            </div>
          )}

          {loadingSeats ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 0', gap: '0.5rem', color: '#64748b' }}>
              <RefreshCw size={24} className="animate-spin text-primary-green" />
              <span style={{ fontSize: '0.85rem' }}>Loading layout...</span>
            </div>
          ) : (
            <>
              <div className="stage-bar">
                <span>▶ STAGE / PODIUM ◀</span>
              </div>

              <div className="seat-map-outer-scroll">
                <div className="seat-map-wrapper">
                  {ROWS.map((row) => (
                    <div key={row} className="seat-row-group">
                      <span className="row-label">{row}</span>
                      <div className="seat-row">
                        {Array.from({ length: SEATS_PER_ROW }, (_, i) => {
                          const seatId = `${row}${i + 1}`;
                          const isBooked = bookedSeats.includes(seatId);
                          const isBlocked = localBlockedSeats.includes(seatId);
                          
                          let seatClass = 'seat-available';
                          let titleStatus = 'Available';
                          if (isBooked) {
                            seatClass = 'seat-booked pointer-events-none';
                            titleStatus = 'Booked by User';
                          } else if (isBlocked) {
                            seatClass = 'seat-blocked';
                            titleStatus = 'Blocked by Admin';
                          }

                          return (
                            <button
                              key={seatId}
                              onClick={() => handleSeatClick(seatId)}
                              className={`sbm-seat ${seatClass}`}
                              disabled={isBooked}
                              title={`${seatId} – ${titleStatus}`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Legend */}
              <div className="seat-legend">
                <span><i className="legend-dot ld-available" /> Available</span>
                <span><i className="legend-dot ld-blocked" /> Blocked by Admin</span>
                <span><i className="legend-dot ld-booked" /> Booked by Users</span>
              </div>

              <div className="seat-block-save-row" style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <div className="seat-counts-summary" style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <span>Total Seats: <strong>{TOTAL_SEATS}</strong></span>
                  <span>Booked: <strong style={{ color: '#ef4444' }}>{bookedSeats.length}</strong></span>
                  <span>Blocked: <strong style={{ color: '#f97316' }}>{localBlockedSeats.length}</strong></span>
                  <span>Available: <strong style={{ color: '#10b981' }}>{TOTAL_SEATS - bookedSeats.length - localBlockedSeats.length}</strong></span>
                  {localBlockedSeats.length !== blockedSeats.length && (
                    <span className="pending-changes-badge" style={{ marginLeft: '0.5rem', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>Unsaved changes</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="btn btn-primary btn-save-blocked"
                  style={{ height: '38px', padding: '0 1.25rem', fontSize: '0.85rem' }}
                >
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Blocked Seats'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
