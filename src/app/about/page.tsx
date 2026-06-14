'use client';

import { Shield, Sparkles, HeartHandshake, Compass } from 'lucide-react';

export default function About() {
  return (
    <div className="about-page animate-fade-in">
      {/* Mini Hero */}
      <section className="about-hero">
        <div className="container">
          <h1 className="heading-xl hero-title">Connecting India, Comfortably</h1>
          <p className="hero-subtitle">
            Pioneering safe, ecological, and premium intercity bus networks across India&apos;s business corridors.
          </p>
        </div>
      </section>

      {/* Core Values / Pillars */}
      <section className="values-section container">
        <div className="section-header animate-slide-up">
          <h2 className="heading-lg text-green">Our Core Commits</h2>
          <p className="section-subtitle">The principles that drive every single route we manage from MG Road to Mumbai.</p>
        </div>

        <div className="values-grid">
          <div className="value-card animate-slide-up hover-lift hover-glow">
            <div className="value-icon-circle">
              <Shield size={24} />
            </div>
            <h3 className="heading-sm value-title">Rigorous Safety Protocols</h3>
            <p className="value-desc">
              Every multi-axle coach undergoes a strict 15-point check prior to dispatch. Our pilots are seasoned professionals certified in safety and night-highway operations.
            </p>
          </div>

          <div className="value-card animate-slide-up hover-lift hover-glow">
            <div className="value-icon-circle">
              <Sparkles size={24} />
            </div>
            <h3 className="heading-sm value-title">Eco-Smart Transit</h3>
            <p className="value-desc">
              We leverage modern clean-diesel engines and advanced route optimization algorithms to maximize fuel efficiency and significantly lower per-passenger carbon impact.
            </p>
          </div>

          <div className="value-card animate-slide-up hover-lift hover-glow">
            <div className="value-icon-circle">
              <HeartHandshake size={24} />
            </div>
            <h3 className="heading-sm value-title">Hospitality On-Board</h3>
            <p className="value-desc">
              From our live-updated seat reservation system to climate controls, responsive helpdesks, and customer pilots, your comfort is our priority.
            </p>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="story-section">
        <div className="container story-grid">
          <div className="story-text-col animate-slide-up">
            <h2 className="heading-lg text-green">The GreenWheels Vision</h2>
            <p className="story-para">
              Established in 2020 in Bangalore, GreenWheels was born out of a desire to modernize intercity bus transit. We observed that while short flights are expensive and train bookings are consistently waitlisted, bus transit remained unorganized—plagued by delayed schedules, double-booked seats, and lack of customer support.
            </p>
            <p className="story-para">
              We decided to build a platform that focuses on transparency and punctuality. By introducing precise 60-seat vector cabin grids and manual transaction receipt audits, we ensure that every ticket is locked and booked safely, with zero overlap.
            </p>
            <p className="story-para">
              Today, GreenWheels manages primary routes connecting Bangalore, Chennai, Mumbai, Pune, Hyderabad, Delhi, and Jaipur, serving thousands of daily commuters with reliability.
            </p>
          </div>
          <div className="story-graphics-col animate-scale-in">
            <div className="story-graphic-box">
              <div className="graphic-badge">Est. 2020</div>
              <Compass size={80} className="graphic-icon animate-pulse" />
              <div className="graphic-text">12,000+ Direct Trips Run Annually</div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Overview */}
      <section className="fleet-section container">
        <div className="section-header animate-slide-up">
          <h2 className="heading-lg text-green">Our Fleet Specifications</h2>
          <p className="section-subtitle">Select the class of cabin that suits your itinerary</p>
        </div>

        <div className="fleet-grid">
          <div className="fleet-card animate-slide-up hover-lift">
            <div className="fleet-badge">AC Luxury Sleeper</div>
            <h3 className="heading-sm fleet-title">Premium Berths</h3>
            <p className="fleet-desc">
              Spacious 2+2 or 2+1 configurations featuring full-flat berths, privacy curtains, personal reading spotlights, USB fast chargers, and noise-cancelling insulation.
            </p>
          </div>

          <div className="fleet-card animate-slide-up hover-lift">
            <div className="fleet-badge green-badge">AC Premium Seater</div>
            <h3 className="heading-sm fleet-title">Executive Recliners</h3>
            <p className="fleet-desc">
              Ergonomic high-back pushback recliners, adjustable leg-rests, free onboard Wi-Fi, food tray consoles, and individual AC vents.
            </p>
          </div>

          <div className="fleet-card animate-slide-up hover-lift">
            <div className="fleet-badge gray-badge">Economy Class</div>
            <h3 className="heading-sm fleet-title">Standard Seater</h3>
            <p className="fleet-desc">
              Highly affordable 2+2 seating, high-capacity overhead luggage racks, optimized ventilation, and standard scheduling.
            </p>
          </div>
        </div>
      </section>

      <style jsx>{`
        .about-page {
          background-color: var(--background);
          padding-bottom: 5rem;
        }

        /* Hero */
        .about-hero {
          background: linear-gradient(135deg, #022c22 0%, #064e3b 100%);
          color: white;
          padding: 6rem 0;
          text-align: center;
          position: relative;
        }

        .hero-title {
          color: white;
          margin-bottom: 1.25rem;
          font-weight: 800;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #a7f3d0;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.65;
        }

        .text-green {
          color: var(--primary-dark);
        }

        .section-header {
          text-align: center;
          margin-top: 5rem;
          margin-bottom: 3.5rem;
        }

        .section-subtitle {
          color: var(--muted);
          margin-top: 0.5rem;
          font-size: 1.05rem;
        }

        /* Values */
        .values-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2.5rem;
        }

        @media (min-width: 768px) {
          .values-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .value-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .value-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
          border-color: var(--primary);
        }

        .value-icon-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          background-color: var(--primary-light);
          color: var(--primary);
          border-radius: 50%;
          margin-bottom: 1.5rem;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1);
        }

        .value-title {
          font-weight: 700;
          margin-bottom: 0.875rem;
          color: var(--primary-dark);
          font-size: 1.2rem;
        }

        .value-desc {
          font-size: 0.925rem;
          color: var(--muted);
          line-height: 1.65;
        }

        /* Narrative */
        .story-section {
          background: white;
          padding: 6rem 0;
          margin-top: 5rem;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
        }

        .story-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        @media (min-width: 768px) {
          .story-grid {
            grid-template-columns: 1.25fr 0.75fr;
          }
        }

        .story-text-col {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .story-para {
          font-size: 1.025rem;
          line-height: 1.7;
          color: var(--foreground);
        }

        .story-graphics-col {
          display: flex;
          justify-content: center;
        }

        .story-graphic-box {
          background: linear-gradient(135deg, var(--primary-light) 0%, #d1fae5 100%);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: var(--radius-2xl);
          padding: 3.5rem 2.25rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          max-width: 320px;
          box-shadow: var(--shadow-md);
          position: relative;
          transition: transform 0.3s ease;
        }
        
        .story-graphic-box:hover {
          transform: scale(1.03);
        }

        .graphic-badge {
          position: absolute;
          top: -12px;
          background: var(--primary);
          color: white;
          font-weight: 700;
          padding: 0.35rem 1rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          box-shadow: var(--shadow-sm);
        }

        .graphic-icon {
          color: var(--primary);
          filter: drop-shadow(0 4px 8px rgba(16, 185, 129, 0.2));
        }

        .graphic-text {
          font-family: var(--font-heading);
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--primary-dark);
          line-height: 1.4;
        }

        /* Fleet */
        .fleet-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .fleet-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .fleet-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 2.25rem;
          position: relative;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .fleet-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-xl);
          transform: translateY(-3px);
        }

        .fleet-badge {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: #ecfdf5;
          color: var(--primary-dark);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .green-badge {
          background: #f0fdfa;
          color: #0f766e;
          border-color: rgba(13, 148, 136, 0.2);
        }

        .gray-badge {
          background: #f8fafc;
          color: #475569;
          border-color: var(--border);
        }

        .fleet-title {
          font-weight: 700;
          margin-bottom: 0.875rem;
          color: var(--foreground);
          margin-top: 0.75rem;
          font-size: 1.15rem;
        }

        .fleet-desc {
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.65;
        }
      `}</style>
    </div>
  );
}
