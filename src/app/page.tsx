'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Shield, Search, ShieldCheck, Cpu, Terminal, Compass, ArrowRight, Star, AlertCircle } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [source, setSource] = useState('Offensive AI');
  const [destination, setDestination] = useState('Nexus Room (Hall A)');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Interactive Particle Canvas (Mass Effect Particle Field)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      baseColor: string;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        // Direction vector from center to create a warp/mass effect outflow
        const angle = Math.atan2(this.y - height / 2, this.x - width / 2);
        const speed = 0.5 + Math.random() * 1.5;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.radius = 1 + Math.random() * 2;
        this.alpha = 0.1 + Math.random() * 0.8;
        this.baseColor = Math.random() > 0.4 ? '16, 185, 129' : '6, 182, 212'; // Emerald or Cyan
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.baseColor}, ${this.alpha})`;
        ctx.fill();
      }

      update() {
        // Warp outwards
        this.x += this.vx;
        this.y += this.vy;

        // Reset if out of bounds
        if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
          this.x = width / 2 + (Math.random() * 40 - 20);
          this.y = height / 2 + (Math.random() * 40 - 20);
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 1.5;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.radius = 1 + Math.random() * 2;
          this.alpha = 0.1 + Math.random() * 0.8;
        }

        // Interactive gravity warp towards/away from mouse cursor
        if (mouse.active) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180) {
            const force = (180 - dist) / 180;
            // Warp push effect
            this.x -= (dx / dist) * force * 4;
            this.y -= (dy / dist) * force * 4;
          }
        }
      }
    }

    const particles: Particle[] = [];
    const maxParticles = 90;
    const connectionDistance = 120;
    const mouse = { x: -1000, y: -1000, active: false };

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      ctx.fillStyle = 'rgba(3, 7, 18, 0.25)'; // trail opacity
      ctx.fillRect(0, 0, width, height);

      // Draw grid overlay lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.005)';
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw and connect particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.update();
        p1.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (canvas) {
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/book?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${encodeURIComponent(date)}`);
  };

  return (
    <div className="landing-page scanlines">
      {/* Background Interactive Canvas */}
      <canvas ref={canvasRef} className="mass-effect-canvas" />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-gradient"></div>
        <div className="container hero-container">
          <div className="hero-text-col animate-slide-up">
            <span className="hero-tagline">GLOBAL CYBER EXPLOITATION & DEFENSE SUMMIT</span>
            <h1 className="hero-title">
              CYBERSTRIKE 2026 <br/>
              <span className="text-highlight">GRID CONTEXT INITIATED</span>
            </h1>
            <p className="hero-subtitle">
              Secure your access coordinates. Select specialized session tracks, lock down hardware hacking terminals, and join the elite CTF cyber defense networks. UPI-screenshot decryption active.
            </p>
            <div className="hero-cta-buttons">
              <Link href="/book" className="btn btn-primary btn-lg-premium">
                <Terminal size={16} /> Reserve Access Pass
              </Link>
              <Link href="/about" className="btn btn-secondary btn-lg-premium">
                Explore Arenas
              </Link>
            </div>
          </div>

          <div className="hero-search-col animate-scale-in">
            <div className="search-card glass-card">
              <h3 className="search-card-title">DECRYPT TICKETS & ACCESS CODES</h3>
              <form onSubmit={handleSearch}>
                <div className="form-group">
                  <label className="form-label">
                    <Terminal size={12} className="input-label-icon" /> Access Sector (Track)
                  </label>
                  <select 
                    value={source} 
                    onChange={(e) => setSource(e.target.value)}
                    className="form-control select-field"
                  >
                    <option value="Offensive AI">Offensive AI & ML Fuzzing</option>
                    <option value="Reverse Engineering">Reverse Engineering & Kernel Exploits</option>
                    <option value="Web3 & Cryptography">Web3, Cryptography & Blockchain</option>
                    <option value="Hardware & IoT">Hardware, IoT & Firmware Fuzzing</option>
                    <option value="Defensive AI">Defensive AI & Threat Intel</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Compass size={12} className="input-label-icon" /> Arena Room (Venue)
                  </label>
                  <select 
                    value={destination} 
                    onChange={(e) => setDestination(e.target.value)}
                    className="form-control select-field"
                  >
                    <option value="Nexus Room (Hall A)">Nexus Stage (Hall A)</option>
                    <option value="Sandbox Lab (Suite 404)">Sandbox Lab (Suite 404)</option>
                    <option value="Black Box Room (Hall B)">Black Box (Hall B)</option>
                    <option value="Silicon Sandbox (Lab C)">Silicon Sandbox (Lab C)</option>
                    <option value="War Room (Room 101)">Operations War Room (101)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <Calendar size={12} className="input-label-icon" /> Access Date
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
                  <Search size={16} /> Search Active Sessions
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="features-section container">
        <div className="section-header">
          <h2 className="heading-lg glow-text">SUMMIT PROTOCOLS & REINFORCEMENTS</h2>
          <p className="section-subtitle">Engineered for real-time security coordination and elite knowledge transfer.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card hover-lift">
            <div className="feature-icon-wrapper">
              <Terminal size={28} className="feature-icon" />
            </div>
            <h4 className="heading-sm feature-title">Interactive Terminal Mapping</h4>
            <p className="feature-desc">
              Every operative reserves their physical desk interface on our interactive 60-slot cyber node map. Instantly lock down your coordinates to claim exclusive session terminals.
            </p>
          </div>

          <div className="feature-card hover-lift">
            <div className="feature-icon-wrapper">
              <Cpu size={28} className="feature-icon" />
            </div>
            <h4 className="heading-sm feature-title">Live Exploitation Demos</h4>
            <p className="feature-desc">
              Our hardware labs provide physical chipsets, oscilloscopes, and software suites. Experience live zero-day disclosure briefs and automated shell injection streams.
            </p>
          </div>

          <div className="feature-card hover-lift">
            <div className="feature-icon-wrapper">
              <ShieldCheck size={28} className="feature-icon" />
            </div>
            <h4 className="heading-sm feature-title">Elite Holographic Passes</h4>
            <p className="feature-desc">
              Complete your reservation using screenshot-backed UPI credentials. Once validated by the operations desk, download a premium "Elite Pass" holographic ticket with full security clearance metadata.
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Block */}
      <section className="stats-section">
        <div className="container stats-container">
          <div className="stat-item">
            <div className="stat-num glow-text">99.9%</div>
            <div className="stat-label">Exploit Success Rate</div>
          </div>
          <div className="stat-item">
            <div className="stat-num glow-text-cyan">5,000+</div>
            <div className="stat-label">Registered Elite Operatives</div>
          </div>
          <div className="stat-item">
            <div className="stat-num glow-text">25+</div>
            <div className="stat-label">Specialized Workshop Labs</div>
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="routes-section container">
        <div className="section-header">
          <h2 className="heading-lg glow-text">POPULAR SESSION CHANNELS</h2>
          <p className="section-subtitle">Quick reservation on our top-rated regional lines</p>
        </div>

        <div className="routes-grid">
          <div className="route-card hover-lift" onClick={() => router.push(`/book?source=Offensive+AI&destination=Nexus+Room+(Hall+A)`)}>
            <div className="route-info">
              <div className="route-cities">Offensive AI <ArrowRight size={14} className="cities-arrow" /> Nexus Stage</div>
              <div className="route-details">Advanced Keynote &bull; 2h 30m</div>
            </div>
            <div className="route-price-tag">
              <span>Pass Fare</span>
              <span className="price-num">₹1500</span>
            </div>
          </div>

          <div className="route-card hover-lift" onClick={() => router.push(`/book?source=Reverse+Engineering&destination=Sandbox+Lab+(Suite+404)`)}>
            <div className="route-info">
              <div className="route-cities">Rev Engineering <ArrowRight size={14} className="cities-arrow" /> Sandbox Lab</div>
              <div className="route-details">Expert Workshop (Red Team) &bull; 4h 00m</div>
            </div>
            <div className="route-price-tag">
              <span>Pass Fare</span>
              <span className="price-num">₹2500</span>
            </div>
          </div>

          <div className="route-card hover-lift" onClick={() => router.push(`/book?source=Web3+%26+Cryptography&destination=Black+Box+Room+(Hall+B)`)}>
            <div className="route-info">
              <div className="route-cities">Web3 Cryptography <ArrowRight size={14} className="cities-arrow" /> Black Box</div>
              <div className="route-details">Smart Contract Breakout &bull; 3h 15m</div>
            </div>
            <div className="route-price-tag">
              <span>Pass Fare</span>
              <span className="price-num">₹1800</span>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-lg glow-text">OPERATIVE TRANSMISSIONS</h2>
            <p className="section-subtitle">Real feedback from daily professionals and security researchers</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="star-rating">
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
              </div>
              <p className="testimonial-text">
                &quot;The terminal mapping flow is incredibly detailed. I allocated desk coordinate K3, uploaded my transfer receipt, and the operator desk verified my ticket in 8 minutes. The holographic Elite Pass is absolute art.&quot;
              </p>
              <h5 className="testimonial-author">- Cipher_Vortex, Senior Security Researcher</h5>
            </div>
            
            <div className="testimonial-card">
              <div className="star-rating">
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
                <Star size={14} fill="#10b981" color="#10b981" />
              </div>
              <p className="testimonial-text">
                &quot;Attending the Hardware Fuzzing lab was the highlight of my year. Reserving terminal access side-by-side with fellow black-hats was extremely seamless. Can&apos;t wait for the CyberStrike 2026 main event.&quot;
              </p>
              <h5 className="testimonial-author">- Kernel_Panic, Red Team Lead</h5>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-page {
          background-color: var(--background);
          position: relative;
          width: 100vw;
          min-height: 100vh;
        }

        .mass-effect-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          pointer-events: none;
        }

        /* Hero */
        .hero-section {
          position: relative;
          padding: 6rem 0 8rem 0;
          color: white;
          overflow: hidden;
          min-height: 600px;
          display: flex;
          align-items: center;
          z-index: 1;
        }

        .hero-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 30%, rgba(16, 185, 129, 0.08) 0%, transparent 60%),
                      radial-gradient(circle at 10% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 50%);
          z-index: -1;
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
          font-size: 0.8rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          color: var(--primary);
          background: rgba(16, 185, 129, 0.1);
          padding: 0.5rem 1.25rem;
          border-radius: 4px;
          align-self: flex-start;
          border: 1px solid rgba(16, 185, 129, 0.25);
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.1);
        }

        .hero-title {
          font-family: var(--font-heading);
          font-size: 3rem;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -1px;
          margin: 0;
        }

        @media (min-width: 768px) {
          .hero-title {
            font-size: 4rem;
          }
        }

        .text-highlight {
          color: var(--primary);
          text-shadow: 0 0 15px var(--primary-glow);
        }

        .hero-subtitle {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #94a3b8;
          max-width: 560px;
          margin: 0;
        }

        .hero-cta-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 0.5rem;
          align-items: center;
        }

        .btn-lg-premium {
          padding: 0.95rem 2.1rem;
          font-size: 0.95rem;
          border-radius: var(--radius-md);
        }

        /* Search Card */
        .hero-search-col {
          display: flex;
          align-items: stretch;
          z-index: 5;
        }

        .search-card {
          width: 100%;
          padding: 2.25rem;
          background: rgba(8, 12, 22, 0.85);
          color: var(--foreground);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: border-color 0.3s;
        }

        .search-card:hover {
          border-color: rgba(16, 185, 129, 0.2);
        }

        .search-card-title {
          font-family: var(--font-heading);
          font-size: 1.1rem;
          font-weight: 900;
          color: white;
          margin-bottom: 1.5rem;
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
          letter-spacing: 1.5px;
        }

        .input-label-icon {
          vertical-align: middle;
          margin-top: -3px;
          margin-right: 6px;
          color: var(--primary);
        }

        .select-field, .date-field {
          background-color: var(--input);
          border-color: var(--border);
          color: white;
          font-weight: 600;
          cursor: pointer;
          height: 48px;
        }

        .select-field option {
          background-color: #0c111d;
          color: white;
        }

        .search-btn {
          width: 100%;
          padding: 0.9rem;
          font-size: 1rem;
          margin-top: 0.75rem;
          box-shadow: var(--shadow-primary);
          letter-spacing: 0.5px;
        }

        /* Features Section */
        .features-section {
          padding: 7rem 2rem;
          position: relative;
          z-index: 2;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
          max-width: 680px;
          margin-left: auto;
          margin-right: auto;
        }

        .section-subtitle {
          color: var(--muted);
          font-size: 1rem;
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
          background: rgba(12, 17, 29, 0.6);
          backdrop-filter: blur(8px);
          padding: 3rem 2.25rem;
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
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(16, 185, 129, 0.15);
          border-color: var(--primary);
        }

        .feature-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          background: rgba(16, 185, 129, 0.1);
          color: var(--primary);
          border-radius: 12px;
          margin-bottom: 1.75rem;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.25);
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin-bottom: 0.75rem;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .feature-desc {
          font-size: 0.92rem;
          color: var(--muted);
          line-height: 1.65;
        }

        /* Stats Section */
        .stats-section {
          background: rgba(12, 17, 29, 0.8);
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          padding: 5rem 2rem;
          position: relative;
          z-index: 2;
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
            border-right: 1px solid var(--border);
          }
        }

        .stat-item:hover {
          transform: translateY(-3px);
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 3.5rem;
          font-weight: 900;
          color: var(--primary);
          letter-spacing: -1px;
          line-height: 1;
        }

        .stat-label {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--muted);
          margin-top: 0.25rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Routes Section */
        .routes-section {
          padding: 7rem 2rem;
          position: relative;
          z-index: 2;
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
          background: rgba(12, 17, 29, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: 1.75rem;
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
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(16, 185, 129, 0.15);
        }

        .route-info {
          flex: 1;
          min-width: 0;
        }

        .route-cities {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: white;
          margin-bottom: 0.375rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
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
          font-size: 0.65rem;
          color: var(--muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .price-num {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 800;
          color: var(--primary);
          letter-spacing: -0.5px;
          text-shadow: 0 0 5px var(--primary-glow);
        }

        /* Testimonials Section */
        .testimonials-section {
          background: rgba(12, 17, 29, 0.4);
          border-top: 1px solid var(--border);
          padding: 7rem 2rem;
          position: relative;
          z-index: 2;
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
          background: rgba(8, 12, 22, 0.7);
          backdrop-filter: blur(8px);
          padding: 2.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          height: 100%;
        }

        .testimonial-card:hover {
          border-color: var(--primary);
        }

        .star-rating {
          display: flex;
          gap: 0.25rem;
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
          color: white;
          font-size: 0.85rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
}
