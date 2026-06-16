'use client';

import { Shield, Sparkles, HeartHandshake, Compass } from 'lucide-react';

export default function About() {
  return (
    <div className="about-page animate-fade-in">
      {/* Mini Hero */}
      <section className="about-hero">
        <div className="container">
          <h1 className="heading-xl hero-title">AccsysIndia & Success India</h1>
          <p className="hero-subtitle">
            Empowering individuals across Tamil Nadu through structured leadership programs, community chapter meetups, income strategy sessions, and professional development events.
          </p>
        </div>
      </section>

      {/* Core Values / Pillars */}
      <section className="values-section container">
        <div className="section-header animate-slide-up">
          <h2 className="heading-lg text-green">Our Core Commitments</h2>
          <p className="section-subtitle">The principles that guide every interaction, initiative, and individual journey within accsysindia and Success India.</p>
        </div>

        <div className="values-grid">
          <div className="value-card animate-slide-up hover-lift hover-glow">
            <div className="value-icon-circle">
              <Shield size={24} />
            </div>
            <h3 className="heading-sm value-title">Trust & Transparency</h3>
            <p className="value-desc">
              Every registration, payment, and seat allocation is handled with full transparency. We uphold integrity at every stage of the participant journey — from sign-up to confirmation.
            </p>
          </div>

          <div className="value-card animate-slide-up hover-lift hover-glow">
            <div className="value-icon-circle">
              <Sparkles size={24} />
            </div>
            <h3 className="heading-sm value-title">Empowering Human Potential</h3>
            <p className="value-desc">
              Success India is built on the belief that every individual carries within them the capacity for greatness. Our programs are designed to awaken that potential through structured learning and mentorship.
            </p>
          </div>

          <div className="value-card animate-slide-up hover-lift hover-glow">
            <div className="value-icon-circle">
              <HeartHandshake size={24} />
            </div>
            <h3 className="heading-sm value-title">Community-First Growth</h3>
            <p className="value-desc">
              accsysindia fosters a deeply human network one where members uplift one another, share knowledge freely, and grow together through collaboration, inclusion, and shared purpose.
            </p>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="story-section">
        <div className="container story-grid">
          <div className="story-text-col animate-slide-up">
            <h2 className="heading-lg text-green">Who We Are</h2>
            <p className="story-para">
              accsysindia is a people-driven movement committed to making personal and professional development accessible to every individual, regardless of background or circumstance. We believe growth is not a privilege it is a right.
            </p>
            <p className="story-para">
              Success India works in alignment with accsysindia to deliver on-ground programs, leadership seminars, and practical skill-building workshops that translate real-world knowledge into career and business momentum.
            </p>
            <p className="story-para">
              Together, we serve a growing community of driven individuals across Tamil Nadu empowering them through structured events, mentorship circles, income-strategy sessions, and chapter-level gatherings that transform lives from the ground up.
            </p>
          </div>
          <div className="story-graphics-col animate-scale-in">
            <div className="story-graphic-box">
              <div className="graphic-badge">accsysindia</div>
              <Compass size={80} className="graphic-icon animate-pulse" />
              <div className="graphic-text">Empowering India, One Seat at a Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Overview */}
      <section className="event-categories-section container">
        <div className="section-header animate-slide-up">
          <h2 className="heading-lg text-green">What We Offer</h2>
          <p className="section-subtitle">Programs and events crafted to build real people with real skills for a real future</p>
        </div>

        <div className="event-category-grid">
          <div className="event-category-card animate-slide-up hover-lift">
            <div className="event-category-badge">Leadership</div>
            <h3 className="heading-sm event-category-title">Leadership & Life Mastery Seminars</h3>
            <p className="event-category-desc">
              Transformative programs led by experienced mentors that develop communication, decision-making, team leadership, and the mindset required to excel in business and life.
            </p>
          </div>

          <div className="event-category-card animate-slide-up hover-lift">
            <div className="event-category-badge green-badge">Income Growth</div>
            <h3 className="heading-sm event-category-title">Success India Income Strategy Sessions</h3>
            <p className="event-category-desc">
              Practical, weekly briefings that equip members with proven income-generation strategies, referral systems, market insights, and financial independence roadmaps.
            </p>
          </div>

          <div className="event-category-card animate-slide-up hover-lift">
            <div className="event-category-badge gray-badge">Chapter Network</div>
            <h3 className="heading-sm event-category-title">accsysindia Community Meetups</h3>
            <p className="event-category-desc">
              Grassroots chapter gatherings that bring together members at a local level to share experiences, celebrate milestones, collaborate on initiatives, and strengthen community bonds.
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
          background: linear-gradient(135deg, #1e9e48 0%, #25b454 50%, #28a745 100%);
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

        /* Event Cards */
        .event-category-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 768px) {
          .event-category-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .event-category-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 2.25rem;
          position: relative;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .event-category-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-xl);
          transform: translateY(-3px);
        }

        .event-category-badge {
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

        .event-category-title {
          font-weight: 700;
          margin-bottom: 0.875rem;
          color: var(--foreground);
          margin-top: 0.75rem;
          font-size: 1.15rem;
        }

        .event-category-desc {
          font-size: 0.9rem;
          color: var(--muted);
          line-height: 1.65;
        }
      `}</style>
    </div>
  );
}
