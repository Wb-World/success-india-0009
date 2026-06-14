'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Search, ShieldCheck, Clock, Award, Compass, ArrowRight, Star } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [source, setSource] = useState('Bangalore');
  const [destination, setDestination] = useState('Chennai');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (source === destination) {
      alert('Departure and Destination locations cannot be the same!');
      return;
    }
    router.push(`/book?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="container hero-container">
          <div className="hero-text-col animate-slide-up">
            <span className="hero-tagline">Premium Intercity Travel</span>
            <h1 className="hero-title">
              India&apos;s Next-Generation <span className="text-highlight">Eco-Transit Network</span>
            </h1>
            <p className="hero-subtitle">
              Enjoy premium reclining seats, high-speed onboard WiFi, and punctual departures. Book tickets securely with local QR transfers and verified manual approvals.
            </p>
            <div className="hero-cta-buttons">
              <Link href="/book" className="btn btn-primary btn-lg-premium">
                <Compass size={18} /> Reserve Seat Now
              </Link>
              <Link href="/about" className="btn btn-secondary btn-lg-premium">
                Explore Fleet
              </Link>
            </div>
          </div>

          <div className="hero-search-col animate-scale-in">
            <div className="search-card glass-card">
              <h3 className="search-card-title">Plan Your Next Journey</h3>
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={14} className="input-label-icon" /> Departure Terminal
                  </label>
                  <select 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                    className="form-control select-field"
                  >
                    <option value="Bangalore">Bengaluru (Bangalore)</option>
                    <option value="Chennai">Chennai (Madras)</option>
                    <option value="Mumbai">Mumbai (Bombay)</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi">Delhi (NCR)</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Jaipur">Jaipur (Pink City)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MapPin size={14} className="input-label-icon text-primary" /> Destination Terminal
                  </label>
                  <select 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    className="form-control select-field"
                  >
                    <option value="Chennai">Chennai (Madras)</option>
                    <option value="Bangalore">Bengaluru (Bangalore)</option>
                    <option value="Mumbai">Mumbai (Bombay)</option>
                    <option value="Pune">Pune</option>
                    <option value="Delhi">Delhi (NCR)</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Jaipur">Jaipur (Pink City)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={14} className="input-label-icon" /> Date of Travel
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
                  <Search size={18} /> Search Buses
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="features-section container">
        <div className="section-header">
          <h2 className="heading-lg">Why Intelligent Commuters Choose Us</h2>
          <p className="section-subtitle">A seamless travel ecosystem engineered around speed, accountability, and luxurious comfort.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card card-hover-rotate hover-lift hover-glow">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={28} className="feature-icon animate-pulse" />
            </div>
            <h4 className="heading-sm feature-title">Secured Vector Booking</h4>
            <p className="feature-desc">
              Every passenger chooses their preferred seat on an interactive 60-seat vector cabin map. Each transaction is manually validated using screenshot verification, eliminating duplicate seat allocations completely.
            </p>
          </div>

          <div className="feature-card card-hover-rotate">
            <div className="feature-icon-wrapper">
              <Clock size={28} className="feature-icon animate-pulse" />
            </div>
            <h4 className="heading-sm feature-title">Unmatched Punctuality</h4>
            <p className="feature-desc">
              We monitor highway traffic grids dynamically using intelligent GPS analytics. This translates to an exceptional 99.8% on-time departure and arrival index across all highway routes.
            </p>
          </div>

          <div className="feature-card card-hover-rotate">
            <div className="feature-icon-wrapper">
              <Award size={28} className="feature-icon animate-pulse" />
            </div>
            <h4 className="heading-sm feature-title">Executive Fleet Cabin</h4>
            <p className="feature-desc">
              Travel in state-of-the-art multi-axle coaches. Features include ergonomic calf-support recliners, personal reading brackets, Type-C charging slots, and temperature-controlled air purification.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Block */}
      <section className="stats-section">
        <div className="container stats-container">
          <div className="stat-item hover-bounce">
            <div className="stat-num">99.8%</div>
            <div className="stat-label">On-Time Departure Rate</div>
          </div>
          <div className="stat-item hover-bounce">
            <div className="stat-num">25,000+</div>
            <div className="stat-label">Satisfied Indian Commuters Monthly</div>
          </div>
          <div className="stat-item hover-bounce">
            <div className="stat-num">40+</div>
            <div className="stat-label">Intercity Connect Lanes Daily</div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="routes-section container">
        <div className="section-header">
          <h2 className="heading-lg">Popular Direct Routes</h2>
          <p className="section-subtitle">Quick reservation on our top-rated regional lines</p>
        </div>

        <div className="routes-grid">
          <div className="route-card route-card-interactive hover-lift" onClick={() => router.push(`/book?source=Bangalore&destination=Chennai`)}>
            <div className="route-info">
              <div className="route-cities">Bengaluru <ArrowRight size={14} className="cities-arrow" /> Chennai</div>
              <div className="route-details">AC Sleeper (2+2) &bull; 6h 30m</div>
            </div>
            <div className="route-price-tag">
              <span>From</span>
              <span className="price-num">₹950</span>
            </div>
          </div>

          <div className="route-card route-card-interactive hover-lift" onClick={() => router.push(`/book?source=Mumbai&destination=Pune`)}>
            <div className="route-info">
              <div className="route-cities">Mumbai <ArrowRight size={14} className="cities-arrow" /> Pune</div>
              <div className="route-details">Executive Sleeper (2+1) &bull; 3h 45m</div>
            </div>
            <div className="route-price-tag">
              <span>From</span>
              <span className="price-num">₹650</span>
            </div>
          </div>

          <div className="route-card route-card-interactive hover-lift" onClick={() => router.push(`/book?source=Delhi&destination=Jaipur`)}>
            <div className="route-info">
              <div className="route-cities">Delhi <ArrowRight size={14} className="cities-arrow" /> Jaipur</div>
              <div className="route-details">AC Multi-Axle &bull; 5h 30m</div>
            </div>
            <div className="route-price-tag">
              <span>From</span>
              <span className="price-num">₹1250</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials section (Humanoid value) */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg">What Our Travelers Say</h2>
            <p className="section-subtitle">Real feedback from daily professionals and tourists</p>
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
                &quot;The ticket booking flow is extremely transparent. I chose seat A3, uploaded my UPI payment screenshot, and within 10 minutes, the admin approved my seat. Excellent service between Bangalore and Chennai.&quot;
              </p>
              <h5 className="testimonial-author">- Raghav Sundaram, Senior Systems Engineer</h5>
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
                &quot;I travel between Pune and Mumbai twice a week for client consults. GreenWheels&apos; coaches are consistently spotless, and the seats feel like business-class flight suites. Truly professional operations.&quot;
              </p>
              <h5 className="testimonial-author">- Meera Deshmukh, Corporate Consultant</h5>
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
          background-color: #064e3b;
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
          background: linear-gradient(135deg, #022c22 0%, #064e3b 60%, #10b981 100%);
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
          background: rgba(16, 185, 129, 0.15);
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          align-self: flex-start;
          border: 1px solid rgba(16, 185, 129, 0.25);
          transition: all 0.3s ease;
        }
        
        .hero-tagline:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
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
          text-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .hero-subtitle {
          font-size: 1.1rem;
          line-height: 1.7;
          color: #d1fae5;
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
          color: #064e3b;
          margin-bottom: 1.5rem;
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid #d1fae5;
        }

        .input-label-icon {
          vertical-align: middle;
          margin-top: -3px;
          margin-right: 4px;
          color: var(--primary-dark);
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
          box-shadow: 0 6px 15px rgba(16, 185, 129, 0.12);
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
          background: #ecfdf5;
          border-top: 1px solid #d1fae5;
          border-bottom: 1px solid #d1fae5;
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
            border-right: 1px solid #a7f3d0;
          }
        }

        .stat-item:hover {
          transform: translateY(-3px);
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--primary-dark);
          letter-spacing: -1px;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.975rem;
          font-weight: 600;
          color: #047857;
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
