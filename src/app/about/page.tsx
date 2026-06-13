'use client';

import { Shield, Sparkles, HeartHandshake, Compass, Terminal, Cpu, Key } from 'lucide-react';

export default function About() {
  return (
    <div className="about-page animate-fade-in scanlines">
      {/* Mini Hero */}
      <section className="about-hero">
        <div className="container">
          <h1 className="heading-xl hero-title glow-text">Conjoining Global Cyber Defense</h1>
          <p className="hero-subtitle">
            Establishing secure network clusters, hardware exploitation arenas, and cryptanalysis symposia for white-hat operatives.
          </p>
        </div>
      </section>

      {/* Core Values / Pillars */}
      <section className="values-section container">
        <div className="section-header animate-slide-up">
          <h2 className="heading-lg glow-text">OPERATIONAL CODES</h2>
          <p className="section-subtitle">The principles that govern our coordination nodes from the sandbox rooms to the keynotes.</p>
        </div>

        <div className="values-grid">
          <div className="value-card animate-slide-up hover-lift">
            <div className="value-icon-circle">
              <Shield size={24} />
            </div>
            <h3 className="heading-sm value-title">Decryption Verification</h3>
            <p className="value-desc">
              Every coordinate pass undergoes manual UPI receipt verification. Operations coordinators approve entries via database ledger within minutes, ensuring zero session overlaps.
            </p>
          </div>

          <div className="value-card animate-slide-up hover-lift">
            <div className="value-icon-circle">
              <Cpu size={24} style={{ color: '#06b6d4' }} />
            </div>
            <h3 className="heading-sm value-title" style={{ color: '#06b6d4' }}>Elite Tech Clusters</h3>
            <p className="value-desc">
              Each arena provides workstation setups, hardware fuzzer boards, and high-frequency traffic networks. Perfect for real-time exploit execution.
            </p>
          </div>

          <div className="value-card animate-slide-up hover-lift">
            <div className="value-icon-circle">
              <HeartHandshake size={24} style={{ color: '#a855f7' }} />
            </div>
            <h3 className="heading-sm value-title" style={{ color: '#a855f7' }}>Operative Conduct</h3>
            <p className="value-desc">
              We enforce a strict ethical disclosure matrix. White-hat collectives coordinate together under responsible disclosure parameters.
            </p>
          </div>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="story-section">
        <div className="container story-grid">
          <div className="story-text-col animate-slide-up">
            <h2 className="heading-lg glow-text">The CyberStrike Mainframe</h2>
            <p className="story-para">
              Established in 2020, CyberStrike was born to bridge the gap between theoretical cryptographic safety and hands-on offensive fuzzer execution. While other tech conferences are purely lecture-based, CyberStrike emphasizes terminal allocation and physical hardware exploits.
            </p>
            <p className="story-para">
              We designed a platform prioritizing coordinate allocation. By utilizing precise 60-slot interactive room nodes and transparent manual transaction decryption, we protect operative seating allocations from double-booking.
            </p>
            <p className="story-para">
              Today, CyberStrike manages five primary tracks including Offensive AI, Reverse Engineering, Web3 Security, IoT fuzzer nodes, and Threat Intelligence, coordinating credentials for thousands of white-hats globally.
            </p>
          </div>
          <div className="story-graphics-col animate-scale-in">
            <div className="story-graphic-box">
              <div className="graphic-badge">Est. 2020</div>
              <Compass size={80} className="graphic-icon animate-pulse" style={{ color: '#10b981' }} />
              <div className="graphic-text">12,000+ Exploits Managed Annually</div>
            </div>
          </div>
        </div>
      </section>

      {/* Fleet Overview */}
      <section className="fleet-section container">
        <div className="section-header animate-slide-up">
          <h2 className="heading-lg glow-text">Arena Level Specifications</h2>
          <p className="section-subtitle">Select the access tier that fits your workshop goals</p>
        </div>

        <div className="fleet-grid">
          <div className="fleet-card animate-slide-up hover-lift">
            <div className="fleet-badge">Elite Keynotes</div>
            <h3 className="heading-sm fleet-title">Nexus Stages</h3>
            <p className="fleet-desc">
              High-capacity auditorium rooms configured for global briefs, featuring 4K stream arrays, acoustic isolation, and live translation outputs.
            </p>
          </div>

          <div className="fleet-card animate-slide-up hover-lift">
            <div className="fleet-badge green-badge">Expert Labs</div>
            <h3 className="heading-sm fleet-title">Sandbox Suites</h3>
            <p className="fleet-desc">
              Ergonomic desk clusters, hardware debugging blocks, dedicated fuzzer network taps, and peer-to-peer operative coordination.
            </p>
          </div>

          <div className="fleet-card animate-slide-up hover-lift">
            <div className="fleet-badge gray-badge">Standard Rooms</div>
            <h3 className="heading-sm fleet-title">Breakout suites</h3>
            <p className="fleet-desc">
              Dynamic seating setups with personal charger slots, standard WiFi grids, and slide projection terminals.
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
          background: linear-gradient(135deg, #040914 0%, #0c1831 100%);
          color: white;
          padding: 6rem 0;
          text-align: center;
          position: relative;
          border-bottom: 1px solid var(--border);
        }

        .hero-title {
          color: white;
          margin-bottom: 1.25rem;
          font-weight: 900;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: #94a3b8;
          max-width: 650px;
          margin: 0 auto;
          line-height: 1.65;
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
          background: rgba(12, 17, 29, 0.65);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 3rem 2rem;
          text-align: center;
          box-shadow: var(--shadow-sm);
        }

        .value-card:hover {
          border-color: var(--primary);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4), 0 0 10px rgba(16, 185, 129, 0.15);
        }

        .value-icon-circle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 58px;
          height: 58px;
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          border: 1px solid rgba(16, 185, 129, 0.25);
          border-radius: 50%;
          margin-bottom: 1.5rem;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
        }

        .value-title {
          font-weight: 700;
          margin-bottom: 0.875rem;
          color: white;
          font-size: 1.2rem;
        }

        .value-desc {
          font-size: 0.925rem;
          color: var(--muted);
          line-height: 1.65;
        }

        /* Narrative */
        .story-section {
          background: rgba(8, 12, 22, 0.4);
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
          color: var(--muted);
        }

        .story-graphics-col {
          display: flex;
          justify-content: center;
        }

        .story-graphic-box {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
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
        }

        .graphic-badge {
          position: absolute;
          top: -12px;
          background: var(--primary);
          color: #022c22;
          font-weight: 800;
          padding: 0.35rem 1rem;
          border-radius: 4px;
          font-size: 0.75rem;
          box-shadow: var(--shadow-sm);
        }

        .graphic-icon {
          filter: drop-shadow(0 0 10px var(--primary-glow));
        }

        .graphic-text {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          color: white;
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
          background: rgba(8, 12, 22, 0.5);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 2.25rem;
          position: relative;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .fleet-card:hover {
          border-color: var(--primary);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
          transform: translateY(-3px);
        }

        .fleet-badge {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .green-badge {
          background: rgba(6, 182, 212, 0.1);
          color: #22d3ee;
          border-color: rgba(6, 182, 212, 0.2);
        }

        .gray-badge {
          background: rgba(255, 255, 255, 0.02);
          color: var(--muted);
          border-color: var(--border);
        }

        .fleet-title {
          font-weight: 700;
          margin-bottom: 0.875rem;
          color: white;
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
