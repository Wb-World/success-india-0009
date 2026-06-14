'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Mail, Phone, MapPin, Send } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const [sessionUser, setSessionUser] = useState<{ name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAuth = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setSessionUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setSessionUser(null);
      }
    };

    checkAuth();
    window.addEventListener('auth-change', checkAuth);
    return () => window.removeEventListener('auth-change', checkAuth);
  }, [pathname]);

  if (!mounted) return null;

  // Suppress footer completely on admin pages
  if (pathname.startsWith('/admin')) {
    return null;
  }

  const isLoggedIn = !!sessionUser;
  const isAdmin = sessionUser?.role === 'admin';

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <Link href="/" className="footer-logo">
            <Ticket size={28} className="footer-logo-icon" />
            <span>Show<span className="text-primary">Time</span></span>
          </Link>
          <p className="footer-desc">
            Book tickets for the latest movies, live concerts, stand-up comedy, sports, and theatrical performances happening in your city instantly.
          </p>
          <div className="footer-contact-info">
            <div className="contact-item">
              <Phone size={16} />
              <span>+91 80 4567 8900 (Toll Free)</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>support@showtime.in</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>100, ShowTime Arcade, MG Road, Bangalore, KA, India</span>
            </div>
          </div>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Quick Links</h4>
          <ul className="footer-links">
            {!isLoggedIn ? (
              <>
                <li><Link href="/">Home Page</Link></li>
                <li><Link href="/about">About Shows</Link></li>
                <li><Link href="/contact">Contact Support</Link></li>
                <li><Link href="/book">Book Tickets</Link></li>
              </>
            ) : (
              <>
                {!isAdmin ? (
                  <>
                    <li><Link href="/profile">Dashboard</Link></li>
                    <li><Link href="/book">Book Tickets</Link></li>
                  </>
                ) : (
                  <li><Link href="/admin/dashboard">Operations Console</Link></li>
                )}
              </>
            )}
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Top Categories</h4>
          <ul className="footer-links">
            <li><Link href="/book?destination=Movies">Movies</Link></li>
            <li><Link href="/book?destination=Concerts">Live Concerts</Link></li>
            <li><Link href="/book?destination=Comedy">Stand-Up Comedy</Link></li>
            <li><Link href="/book?destination=Sports">Sports Matches</Link></li>
          </ul>
        </div>

        <div className="footer-newsletter-col">
          <h4 className="footer-title">Stay Updated</h4>
          <p className="newsletter-text">
            Subscribe to receive weekly recommendations, early access alerts, and exclusive promo codes.
          </p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="newsletter-input" 
              required 
            />
            <button type="submit" className="newsletter-btn">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <p className="copyright-text">
            &copy; {currentYear} ShowTime Entertainment Booking Inc. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <Link href="/contact">Privacy Policy</Link>
            <span className="bullet-dot"></span>
            <Link href="/contact">Terms & Conditions</Link>
            <span className="bullet-dot"></span>
            <Link href="/contact">Refund Guidelines</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background: #0b1329;
          color: #94a3b8;
          padding: 4.5rem 0 1.5rem 0;
          border-top: 4px solid var(--primary);
          font-size: 0.9rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 768px) {
          .footer-grid {
            grid-template-columns: 1.8fr 1fr 1fr 1.8fr;
            gap: 3.5rem;
          }
        }

        .footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-heading);
          font-size: 1.5rem;
          font-weight: 800;
          color: white;
        }

        .footer-logo-icon {
          color: var(--primary);
        }

        .footer-desc {
          line-height: 1.6;
        }

        .footer-contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          color: #cbd5e1;
        }

        .footer-title {
          font-family: var(--font-heading);
          color: white;
          font-size: 1rem;
          font-weight: 700;
          margin-bottom: 1.25rem;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          position: relative;
          padding-bottom: 0.625rem;
        }

        .footer-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 28px;
          height: 2px;
          background: var(--primary);
          border-radius: 999px;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .footer-links a {
          transition: all var(--transition-fast);
          display: inline-block;
        }

        .footer-links a:hover {
          color: var(--primary);
          transform: translateX(3px);
        }

        .footer-newsletter-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .newsletter-text {
          line-height: 1.5;
        }

        .newsletter-form {
          display: flex;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid #334155;
          transition: border-color var(--transition-fast);
        }

        .newsletter-form:focus-within {
          border-color: var(--primary);
        }

        .newsletter-input {
          flex: 1;
          background: #1e293b;
          border: none;
          color: white;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }

        .newsletter-btn {
          background: var(--primary);
          color: white;
          border: none;
          padding: 0 1.25rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .newsletter-btn:hover {
          background: var(--primary-hover);
        }

        .footer-bottom {
          border-top: 1px solid #1e293b;
          padding-top: 1.5rem;
          font-size: 0.8rem;
        }

        .footer-bottom-flex {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 768px) {
          .footer-bottom-flex {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            text-align: left;
          }
          .footer-legal-links {
            justify-content: flex-end;
          }
        }

        .footer-legal-links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .footer-legal-links a:hover {
          color: var(--primary);
        }

        .bullet-dot {
          width: 4px;
          height: 4px;
          background-color: #475569;
          border-radius: 50%;
        }
      `}</style>
    </footer>
  );
}
