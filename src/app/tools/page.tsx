'use client';

import { useState, useEffect } from 'react';
import { 
  MapPin, CheckCircle, AlertTriangle, 
  Umbrella, Home, Users, Star, ArrowRight, ExternalLink, ZoomIn, X
} from 'lucide-react';
import Link from 'next/link';

export default function ToolsPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const images = [
    { src: '/images/pool.jpg', alt: 'Swimming Pool' },
    { src: '/images/pool2.jpeg', alt: 'Swimming Pool View' },
    { src: '/images/resort front 2.jpeg', alt: 'Resort Front View 2' },
    { src: '/images/resort front.jpeg', alt: 'Resort Front View' },
    { src: '/images/resort.jpg', alt: 'Resort Exterior View' },
    { src: '/images/rest area.jpeg', alt: 'Rest Area' },
    { src: '/images/roompic1.jpeg', alt: 'Room View 1' },
    { src: '/images/roompic2.jpeg', alt: 'Room View 2' },
    { src: '/images/roompic3.jpeg', alt: 'Room View 3' },
    { src: '/images/roompic4.jpeg', alt: 'Room View 4' },
    { src: '/images/roompic5.jpeg', alt: 'Room View 5' },
    { src: '/images/swim area.jpeg', alt: 'Swimming Area' },
    { src: '/images/villa.jpg', alt: 'Villa Building' }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Simple scroll reveal
    const handleScroll = () => {
      const reveals = document.querySelectorAll('.reveal');
      for (let i = 0; i < reveals.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = reveals[i].getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          reveals[i].classList.add('active');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger once on load
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="resort-showcase">
      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className={`hero-content ${isVisible ? 'fade-up-active' : 'fade-up'}`}>
          <div className="badge">
            <span className="badge-icon">🛠️</span>
            SUCCESS TEAM PRESENTS
          </div>
          <h1 className="main-title">TEAM ACTIVATION TOOLS</h1>
          <h2 className="sub-title">Professional Tools & Resources for Success Team Members</h2>
          <div className="hero-buttons">
            <Link href="/tools/book" className="btn-primary">
              Book Now <ArrowRight size={18} />
            </Link>
            <a href="#location" className="btn-secondary">
              <MapPin size={18} /> View Location
            </a>
          </div>
        </div>
      </section>



      {/* --- GALLERY SECTION --- */}
      <section className="gallery-section reveal">
        <div className="container">
          <div className="section-header">
            <h2>Resort Gallery</h2>
            <p>Take a glimpse into our premium accommodations and facilities.</p>
          </div>
          <div className="gallery-grid">
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className={`gallery-item ${idx === 0 ? 'featured' : ''}`}
                onClick={() => setLightboxImg(img.src)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} />
                <div className="gallery-overlay">
                  <ZoomIn size={32} color="white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- IMPORTANT NOTICE --- */}
      <section className="notice-section reveal">
        <div className="container">
          <div className="notice-card">
            <div className="notice-icon">
              <AlertTriangle size={32} />
            </div>
            <div className="notice-content">
              <h3>Important Information</h3>
              <ul className="notice-list">
                <li><span className="emoji">⚠️</span> Resort stay charges only.</li>
                <li><span className="emoji">🍽️</span> Food is NOT included in the package.</li>
                <li className="notice-highlight">Food requires separate payment.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- WHY CHOOSE US --- */}
      <section className="features-section reveal">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose Us</h2>
            <p>Experience the perfect blend of luxury and nature.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Umbrella size={28} /></div>
              <h3>Beachfront Location</h3>
              <p>Enjoy a peaceful stay near the beach.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Home size={28} /></div>
              <h3>Comfortable Accommodation</h3>
              <p>Clean and comfortable rooms for guests.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Users size={28} /></div>
              <h3>Family Friendly</h3>
              <p>Perfect destination for families and groups.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Star size={28} /></div>
              <h3>Premium Experience</h3>
              <p>Relax and enjoy a memorable resort stay.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATISTICS --- */}
      <section className="stats-section reveal">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Happy Guests</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Customer Satisfaction</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Support</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Relaxation Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LOCATION --- */}
      <section id="location" className="location-section reveal">
        <div className="container">
          <div className="location-card">
            <div className="location-info">
              <h2>📍 Resort Location</h2>
              <p>Find us easily through Google Maps. We are located at a prime beachfront spot easily accessible by road.</p>
              <a href="https://maps.app.goo.gl/yMnyvDP1d1BfpfaQ9?g_st=ac" target="_blank" rel="noopener noreferrer" className="btn-location">
                Open in Google Maps <ExternalLink size={16} />
              </a>
            </div>
            <div className="location-map">
              <div className="map-placeholder">
                <MapPin size={48} color="#22c55e" />
                <span>View on Google Maps</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- LIGHTBOX --- */}
      {lightboxImg && (
        <div className="lightbox" onClick={() => setLightboxImg(null)}>
          <button className="lightbox-close" onClick={() => setLightboxImg(null)}>
            <X size={32} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxImg} alt="Enlarged view" className="lightbox-img" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <style jsx global>{`
        /* Global CSS for the Tools Page */
        .resort-showcase {
          font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #333;
          background-color: #f8fafc;
          overflow-x: hidden;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .section-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        
        .section-header h2 {
          font-size: 2.5rem;
          color: #1f2937;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        
        .section-header p {
          color: #6b7280;
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Colors */
        .text-green {
          color: #22c55e;
        }

        /* Animations */
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        
        .fade-up-active {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 0.8s ease-out;
        }
        
        .reveal.active {
          opacity: 1;
          transform: translateY(0);
        }

        /* --- Hero Section --- */
        .hero-section {
          position: relative;
          height: 90vh;
          min-height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('/images/pool.jpg') no-repeat center center/cover;
          color: white;
          padding: 0 20px;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.2), rgba(15, 23, 42, 0.7));
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 8px 16px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 24px;
          letter-spacing: 0.5px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .main-title {
          font-family: var(--font-heading), 'Outfit', sans-serif;
          font-size: clamp(1.8rem, 4.2vw, 3.2rem);
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 16px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          letter-spacing: -0.5px;
          white-space: nowrap;
        }

        .sub-title {
          font-size: clamp(1.2rem, 3vw, 1.8rem);
          font-weight: 400;
          margin-bottom: 24px;
          color: #e2e8f0;
          text-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
        }

        .hero-desc {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #f8fafc;
          max-width: 650px;
          margin-bottom: 40px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        .hero-buttons {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #22c55e;
          color: white;
          border: none;
          padding: 14px 32px;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
        }

        .btn-primary:hover {
          background: #16a34a;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(34, 197, 94, 0.6);
        }

        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 14px 32px;
          border-radius: 50px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        /* --- Pricing Section --- */
        .pricing-section {
          padding: 6rem 0;
          background-color: #f8fafc;
        }

        .pricing-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 2.5rem;
          margin-top: 3rem;
        }

        .pricing-card {
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(34, 197, 94, 0.1);
          display: flex;
          flex-direction: column;
        }

        .pricing-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 50px rgba(34, 197, 94, 0.15);
        }

        .card-image {
          height: 240px;
          background-size: cover;
          background-position: center;
          position: relative;
        }

        .bg-resort {
          background-image: url('/images/resort.jpg');
        }

        .bg-villa {
          background-image: url('/images/villa.jpg');
        }

        .card-content {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .card-header h3 {
          font-size: 1.4rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          line-height: 1.3;
          flex: 1;
          padding-right: 10px;
        }

        .rating {
          display: flex;
          gap: 2px;
        }

        .price-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 2rem;
          background: #f0fdf4;
          padding: 1.5rem;
          border-radius: 16px;
          border-left: 4px solid #22c55e;
        }

        .price-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-item.weekend {
          padding-top: 12px;
          border-top: 1px dashed rgba(34, 197, 94, 0.3);
        }

        .price-label {
          color: #4b5563;
          font-weight: 500;
          font-size: 1rem;
        }

        .price-value {
          font-size: 1.25rem;
          font-weight: 800;
          color: #166534;
        }

        .price-period {
          font-size: 0.85rem;
          font-weight: 400;
          color: #6b7280;
          margin-left: 4px;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 2.5rem;
          flex-grow: 1;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #4b5563;
          font-size: 1rem;
        }

        .btn-book {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: #22c55e;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-book:hover {
          background: #16a34a;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
        }
        
        /* --- Gallery Section --- */
        .gallery-section {
          padding: 5rem 0;
          background-color: white;
        }
        
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-auto-rows: 250px;
          gap: 1.5rem;
        }
        
        .gallery-item {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          cursor: pointer;
          box-shadow: 0 8px 25px rgba(0,0,0,0.06);
        }
        
        .gallery-item.featured {
          grid-column: span 2;
          grid-row: span 2;
        }
        
        .gallery-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
        }
        
        .gallery-item:hover img {
          transform: scale(1.08);
        }
        
        .gallery-overlay {
          position: absolute;
          inset: 0;
          background: rgba(34, 197, 94, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .gallery-item:hover .gallery-overlay {
          opacity: 1;
        }
        
        /* Lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .lightbox-close {
          position: absolute;
          top: 30px;
          right: 30px;
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          padding: 10px;
          z-index: 1001;
          transition: transform 0.3s ease;
        }
        
        .lightbox-close:hover {
          transform: scale(1.1);
        }
        
        .lightbox-img {
          max-width: 100%;
          max-height: 90vh;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          animation: zoomIn 0.3s ease-out forwards;
        }
        
        @keyframes zoomIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* --- Notice Section --- */
        .notice-section {
          padding: 2rem 0 5rem;
          background-color: #f8fafc;
        }

        .notice-card {
          background: white;
          border-radius: 20px;
          padding: 2rem;
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
          border-left: 6px solid #22c55e;
          position: relative;
          overflow: hidden;
        }

        .notice-card::before {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 150px;
          height: 150px;
          background: radial-gradient(circle, rgba(34,197,94,0.1) 0%, rgba(255,255,255,0) 70%);
          border-radius: 50%;
          transform: translate(30%, -30%);
        }

        .notice-icon {
          background: #f0fdf4;
          color: #22c55e;
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notice-content h3 {
          font-size: 1.5rem;
          color: #1f2937;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .notice-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .notice-list li {
          font-size: 1.05rem;
          color: #4b5563;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .emoji {
          font-size: 1.2rem;
        }

        .notice-highlight {
          margin-top: 8px;
          font-weight: 600 !important;
          color: #166534 !important;
          background: #f0fdf4;
          padding: 8px 12px;
          border-radius: 8px;
          display: inline-block !important;
        }

        /* --- Features Section --- */
        .features-section {
          padding: 5rem 0;
          background: white;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
        }

        .feature-card {
          padding: 2.5rem 2rem;
          border-radius: 20px;
          background: #f8fafc;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .feature-card:hover {
          background: white;
          border-color: rgba(34, 197, 94, 0.2);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
          transform: translateY(-5px);
        }

        .feature-icon-wrapper {
          width: 70px;
          height: 70px;
          background: #f0fdf4;
          color: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          transition: all 0.3s ease;
        }

        .feature-card:hover .feature-icon-wrapper {
          background: #22c55e;
          color: white;
          transform: scale(1.1);
        }

        .feature-card h3 {
          font-size: 1.25rem;
          color: #1f2937;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .feature-card p {
          color: #6b7280;
          line-height: 1.6;
        }

        /* --- Stats Section --- */
        .stats-section {
          padding: 4rem 0;
          background: linear-gradient(135deg, #166534 0%, #22c55e 100%);
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 2rem;
          text-align: center;
        }

        .stat-item {
          padding: 1.5rem;
        }

        .stat-number {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          font-size: 1.1rem;
          font-weight: 500;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }

        /* --- Location Section --- */
        .location-section {
          padding: 6rem 0;
          background: #f8fafc;
        }

        .location-card {
          display: flex;
          background: white;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.1);
        }

        .location-info {
          flex: 1;
          padding: 4rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .location-info h2 {
          font-size: 2rem;
          color: #1f2937;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .location-info p {
          color: #6b7280;
          font-size: 1.1rem;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .btn-location {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #1f2937;
          color: white;
          padding: 14px 28px;
          border-radius: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          width: fit-content;
        }

        .btn-location:hover {
          background: #22c55e;
          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);
        }

        .location-map {
          flex: 1;
          min-height: 400px;
          background: url('/images/resort.jpg') center/cover;
          position: relative;
        }

        .map-placeholder {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(3px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 1.2rem;
          gap: 1rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .location-map:hover .map-placeholder {
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(1px);
        }

        /* --- Responsive Design --- */
        @media (max-width: 992px) {
          .location-card {
            flex-direction: column;
          }
          
          .location-info {
            padding: 3rem 2rem;
          }
          
          .location-map {
            min-height: 300px;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            min-height: 500px;
            height: auto;
            padding: 100px 20px 60px;
          }
          
          .main-title {
            font-size: clamp(1.2rem, 7.2vw, 1.8rem);
            white-space: nowrap;
          }
          
          .sub-title {
            font-size: 1.2rem;
          }
          
          .hero-buttons {
            flex-direction: column;
            width: 100%;
          }
          
          .btn-primary, .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          
          .pricing-cards {
            grid-template-columns: 1fr;
          }
          
          .notice-card {
            flex-direction: column;
            gap: 1rem;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .gallery-grid {
            grid-template-columns: 1fr;
            grid-auto-rows: 250px;
          }
          
          .gallery-item.featured {
            grid-column: span 1;
            grid-row: span 1;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
          
          .section-header h2 {
            font-size: 2rem;
          }
          
          .card-image {
            height: 200px;
          }
          
          .card-content {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
