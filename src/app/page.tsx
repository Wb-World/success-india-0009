'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Search, ShieldCheck, Ticket, Film, Mic, Music, Sparkles, Star, ArrowRight } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Movies');
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
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="container hero-container">
          <div className="hero-text-col animate-slide-up">
            <span className="hero-tagline">Live Experiences</span>
            <h1 className="hero-title">
              Discover The Best <span className="text-highlight">Events & Movies</span> Happening Near You
            </h1>
            <p className="hero-subtitle">
              Book tickets for the latest movies, live concerts, stand-up comedy, sports, and theatrical performances in your city instantly.
            </p>
            <div className="hero-cta-buttons">
              <Link href="/book" className="btn btn-primary btn-lg-premium">
                <Ticket size={18} /> Explore Events
              </Link>
              <Link href="/book?destination=Movies" className="btn btn-secondary btn-lg-premium">
                Trending Movies
              </Link>
            </div>
          </div>

          <div className="hero-search-col animate-scale-in">
            <div className="search-card glass-card">
              <h3 className="search-card-title">Find Your Next Plan</h3>
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={14} className="input-label-icon" /> Select City
                  </label>
                  <select 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                    className="form-control select-field"
                  >
                    <option value="Bangalore">Bengaluru (Bangalore)</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi">Delhi (NCR)</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Jaipur">Jaipur</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Film size={14} className="input-label-icon text-primary" /> Event Category
                  </label>
                  <select 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    className="form-control select-field"
                  >
                    <option value="Movies">Movies</option>
                    <option value="Concerts">Concerts</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={14} className="input-label-icon" /> Select Date
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
                  <Search size={18} /> Search Events
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="features-section container">
        <div className="section-header">
          <h2 className="heading-lg">The Ultimate Entertainment Booking Experience</h2>
          <p className="section-subtitle">Enjoy instant confirmations, interactive seating layout selection, and verified premium tickets.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card card-hover-rotate hover-lift hover-glow">
            <div className="feature-icon-wrapper">
              <Ticket size={28} className="feature-icon animate-pulse" />
            </div>
            <h4 className="heading-sm feature-title">Instant QR Tickets</h4>
            <p className="feature-desc">
              Get your tickets delivered instantly as secure QR codes. Every ticket is manually and securely verified to eliminate duplicate entries and booking issues completely.
            </p>
          </div>

          <div className="feature-card card-hover-rotate">
            <div className="feature-icon-wrapper">
              <Film size={28} className="feature-icon animate-pulse" />
            </div>
            <h4 className="heading-sm feature-title">Premium Seat Selection</h4>
            <p className="feature-desc">
              Interactive seating layout maps let you select your exact seats (recliners, premium, balcony) for all theaters, sports arenas, and live concert venues across cities.
            </p>
          </div>

          <div className="feature-card card-hover-rotate">
            <div className="feature-icon-wrapper">
              <Mic size={28} className="feature-icon animate-pulse" />
            </div>
            <h4 className="heading-sm feature-title">Exclusive Shows & Events</h4>
            <p className="feature-desc">
              Access early bird discounts, exclusive pre-sales, and front-row tickets for the most anticipated music concerts, stand-up comedy tours, local sports leagues, and movies.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Block */}
      <section className="stats-section">
        <div className="container stats-container">
          <div className="stat-item hover-bounce">
            <div className="stat-num">1M+</div>
            <div className="stat-label">Tickets Booked Monthly</div>
          </div>
          <div className="stat-item hover-bounce">
            <div className="stat-num">5,000+</div>
            <div className="stat-label">Events & Shows Listed</div>
          </div>
          <div className="stat-item hover-bounce">
            <div className="stat-num">150+</div>
            <div className="stat-label">Venues Across Cities</div>
          </div>
        </div>
      </section>

      {/* Popular Routes -> Trending Events */}
      <section className="routes-section container">
        <div className="section-header">
          <h2 className="heading-lg">Trending Events & Shows</h2>
          <p className="section-subtitle">Book tickets for the most popular shows near you</p>
        </div>

        <div className="routes-grid">
          <div className="route-card route-card-interactive hover-lift" onClick={() => router.push(`/book?source=Chennai&destination=Concerts`)}>
            <div className="route-info">
              <div className="route-cities">A.R. Rahman Live <ArrowRight size={14} className="cities-arrow" /> Concert</div>
              <div className="route-details">Musical Concert &bull; Chennai Venue</div>
            </div>
            <div className="route-price-tag">
              <span>From</span>
              <span className="price-num">₹1500</span>
            </div>
          </div>

          <div className="route-card route-card-interactive hover-lift" onClick={() => router.push(`/book?source=Bangalore&destination=Movies`)}>
            <div className="route-info">
              <div className="route-cities">Kalki 2898 AD <ArrowRight size={14} className="cities-arrow" /> IMAX 3D</div>
              <div className="route-details">Action / Sci-Fi Movie &bull; Bengaluru</div>
            </div>
            <div className="route-price-tag">
              <span>From</span>
              <span className="price-num">₹350</span>
            </div>
          </div>

          <div className="route-card route-card-interactive hover-lift" onClick={() => router.push(`/book?source=Bangalore&destination=Comedy`)}>
            <div className="route-info">
              <div className="route-cities">Zakir Khan Live <ArrowRight size={14} className="cities-arrow" /> Tathastu</div>
              <div className="route-details">Stand-Up Comedy &bull; Bengaluru Special</div>
            </div>
            <div className="route-price-tag">
              <span>From</span>
              <span className="price-num">₹799</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials section (Humanoid value) */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">What Our Fans & Moviegoers Say</h2>
            <p className="section-subtitle">Real feedback from daily entertainment lovers and film critics</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="star-rating">
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
              </div>
              <p className="testimonial-text">
                &quot;The booking flow for concerts is incredibly smooth. I chose my premium seats, uploaded my UPI payment receipt, and got my ticket confirmed in minutes! Excellent experience booking the AR Rahman concert.&quot;
              </p>
              <h5 className="testimonial-author">- Raghav Sundaram, Tech Lead & Concert Fan</h5>
            </div>
            
            <div className="testimonial-card">
              <div className="star-rating">
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
                <Star size={16} fill="#f59e0b" color="#f59e0b" />
              </div>
              <p className="testimonial-text">
                &quot;I book all my weekend movies and stand-up shows here. The ticket confirmation is blazing fast, and the seating selection is spot on. Truly a premium and reliable platform for live entertainment!&quot;
              </p>
              <h5 className="testimonial-author">- Meera Deshmukh, Film & Comedy Critic</h5>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-page {
          background-color: var(--background);
        }

        /* Hero */
        .hero-section {
          position: relative;
          padding: 6rem 0 8rem 0;
          background-color: #121214;
          color: white;
          overflow: hidden;
          min-height: 600px;
          display: flex;
          align-items: center;
        }

        .hero-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #09090b 0%, #121214 60%, #f84464 100%);
          z-index: 1;
        }

        .hero-container {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: 1fr;
          gap: 3.5rem;
          align-items: center;
          width: 100%;
        }

        @media (min-width: 992px) {
          .hero-container {
            grid-template-columns: 1.15fr 0.85fr;
            gap: 4rem;
          }
        }

        .hero-text-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .hero-tagline {
          font-family: var(--font-heading);
          font-size: 0.875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--primary);
          background: rgba(248, 68, 100, 0.15);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          align-self: flex-start;
          border: 1px solid rgba(248, 68, 100, 0.25);
          transition: all 0.3s ease;
        }
        
        .hero-tagline:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(248, 68, 100, 0.15);
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: 3rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1px;
          margin: 0;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 3.75rem;
          }
        }

        .text-highlight {
          color: var(--primary);
          text-shadow: 0 4px 15px rgba(248, 68, 100, 0.3);
        }

        .hero-subtitle {
          font-size: 1.1rem;
          line-height: 1.7;
          color: #ffe4e6;
          max-width: 560px;
          margin: 0;
        }

        .hero-cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.25rem;
          align-items: center;
        }

        .btn-lg-premium {
          padding: 0.9rem 1.875rem;
          font-size: 1rem;
          border-radius: var(--radius-lg);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        /* Search Card */
        .hero-search-col {
          display: flex;
          align-items: stretch;
        }

        .search-card {
          width: 100%;
          padding: 2rem 2.25rem 2.25rem;
          background: rgba(255, 255, 255, 0.98);
          color: var(--foreground);
          border-radius: var(--radius-2xl);
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.8);
          transition: transform 0.3s ease;
        }

        .search-card:hover {
          transform: translateY(-3px);
        }

        .search-card-title {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 700;
          color: #f84464;
          margin-bottom: 1.5rem;
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #ffe4e6;
        }

        .input-label-icon {
          vertical-align: middle;
          margin-top: -3px;
          margin-right: 4px;
          color: var(--primary);
        }

        .select-field, .date-field {
          background-color: var(--input);
          border-color: var(--border);
          font-weight: 600;
          cursor: pointer;
          height: 46px;
        }

        .search-btn {
          width: 100%;
          padding: 0.875rem;
          font-size: 1.05rem;
          margin-top: 0.5rem;
          box-shadow: var(--shadow-primary);
          letter-spacing: 0.01em;
        }

        /* Features Section */
        .features-section {
          padding: 7rem 2rem;
        }

        .section-header {
          text-align: center;
          margin-bottom: 3.5rem;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }

        .section-subtitle {
          color: var(--muted);
          font-size: 1.05rem;
          margin-top: 0.75rem;
          line-height: 1.65;
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          align-items: stretch;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 2rem;
          }
        }

        .feature-card {
          background: white;
          padding: 2.75rem 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          box-shadow: var(--shadow-sm);
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .feature-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary);
        }

        .feature-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 68px;
          height: 68px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          margin-bottom: 1.5rem;
          box-shadow: 0 6px 15px rgba(248, 68, 100, 0.12);
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 1.2rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: var(--primary-dark);
        }

        .feature-desc {
          font-size: 0.92rem;
          color: var(--muted);
          line-height: 1.7;
        }

        /* Stats Section */
        .stats-section {
          background: #fff1f2;
          border-top: 1px solid #ffe4e6;
          border-bottom: 1px solid #ffe4e6;
          padding: 5rem 2rem;
        }

        .stats-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          text-align: center;
        }

        @media (min-width: 768px) {
          .stats-container {
            grid-template-columns: repeat(3, 1fr);
            gap: 0;
          }
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.375rem;
          transition: transform 0.3s ease;
          padding: 1rem 2rem;
        }

        @media (min-width: 768px) {
          .stat-item:not(:last-child) {
            border-right: 1px solid #fecdd3;
          }
        }

        .stat-item:hover {
          transform: translateY(-3px);
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -1px;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.975rem;
          font-weight: 600;
          color: #be123c;
          margin-top: 0.25rem;
        }

        /* Routes Section */
        .routes-section {
          padding: 7rem 2rem;
        }

        .routes-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        @media (min-width: 768px) {
          .routes-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
          }
        }

        .route-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.625rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: var(--shadow-sm);
          gap: 1rem;
        }

        .route-card:hover {
          border-color: var(--primary);
          transform: scale(1.02) translateY(-2px);
          box-shadow: var(--shadow-md);
        }

        .route-info {
          flex: 1;
          min-width: 0;
        }

        .route-cities {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }

        .cities-arrow {
          color: var(--primary);
          flex-shrink: 0;
        }

        .route-details {
          font-size: 0.85rem;
          color: var(--muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
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
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .price-num {
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.5px;
        }

        /* Testimonials Section */
        .testimonials-section {
          background: white;
          padding: 7rem 2rem;
          border-top: 1px solid var(--border);
        }

        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-top: 0;
          align-items: stretch;
        }

        @media (min-width: 768px) {
          .testimonials-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
          }
        }

        .testimonial-card {
          background: var(--background);
          padding: 2.25rem 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1rem;
          height: 100%;
        }

        .star-rating {
          display: flex;
          gap: 0.2rem;
          align-items: center;
        }

        .testimonial-text {
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--muted);
          font-style: italic;
          flex: 1;
        }

        .testimonial-author {
          font-weight: 700;
          color: var(--foreground);
          font-size: 0.875rem;
          padding-top: 0.5rem;
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}
