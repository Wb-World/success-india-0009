'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

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
            <img src="/success-india-logo.jpeg" alt="Success India logo" className="footer-logo-img" />
            <span>Success<span className="text-primary"> India</span></span>
          </Link>
          <p className="footer-desc">
            Official networking and leadership seminar booking portal for Success India chapter programs, weekly strategy sessions, and local business briefings.
          </p>
          <div className="footer-contact-info">
            <div className="contact-item">
              <Phone size={16} />
              <span>Support details available through official resources</span>
            </div>
            <div className="contact-item">
              <Mail size={16} />
              <span>accsysindia.com</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} />
              <span>No 303, 2nd floor, Grand Southern Trunk Rd, Chromepet, Chennai, Tamil Nadu 600044</span>
            </div>
          </div>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Quick Links</h4>
          <ul className="footer-links">
            {!isLoggedIn ? (
              <>
                <li><Link href="/">Home Page</Link></li>
                <li><Link href="/about">About Portal</Link></li>
                <li><Link href="/contact">Contact Support</Link></li>
                <li><Link href="/book">Book Seminars</Link></li>
              </>
            ) : (
              <>
                {!isAdmin ? (
                  <>
                    <li><Link href="/profile">Dashboard</Link></li>
                    <li><Link href="/book">Book Seminars</Link></li>
                  </>
                ) : (
                  <li><Link href="/admin/dashboard">Operations Console</Link></li>
                )}
              </>
            )}
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Seminar Categories</h4>
          <ul className="footer-links">
            <li><Link href="/book?seminar=Leadership%20Development%20Seminars">Leadership Development</Link></li>
            <li><Link href="/book?seminar=Weekly%20Income-Generation%20Systems">Weekly Income-Generation</Link></li>
            <li><Link href="/book?seminar=BOSS%20Agro%20Hub%20Chapter%20Meetups">BOSS Agro Hub Meetups</Link></li>
            <li><Link href="/book?seminar=Digital%20Marketing%20%26%20Direct-Selling%20Workshops">Digital Marketing Workshops</Link></li>
          </ul>
        </div>

        <div className="footer-newsletter-col">
          <h4 className="footer-title">Stay Updated</h4>
          <p className="newsletter-text">
            Subscribe for local chapter updates, seminar reminders, and official resource notices.
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
            &copy; {currentYear} Success India - Official Seminar & Leadership Portal. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <Link href="/contact">Privacy Policy</Link>
            <span className="bullet-dot"></span>
            <Link href="/contact">Terms & Conditions</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background: #16a34a;
          color: #ffffff;
          padding: 4.5rem 0 1.5rem 0;
          border-top: 4px solid #15803d;
          font-size: 0.9rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          margin-bottom: 3rem;
        }

        @media (min-width: 480px) and (max-width: 767px) {
          .footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 2.5rem;
          }
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
          white-space: nowrap;
        }
        .footer-logo > span {
          display: inline-flex;
          align-items: center;
          line-height: 1;
          margin-top: -2px;
        }

        .footer-logo-img {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.5);
          flex-shrink: 0;
        }

        .footer-desc {
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
        }

        .footer-contact-info {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }

        .contact-item {
          display: flex;
          align-items: flex-start;
          gap: 0.625rem;
          color: rgba(255,255,255,0.9);
          line-height: 1.45;
        }

        .contact-item :global(svg) {
          flex-shrink: 0;
          margin-top: 3px;
        }

        .footer-title {
          font-family: var(--font-heading);
          color: #ffffff;
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
          background: rgba(255,255,255,0.6);
          border-radius: 999px;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .footer-links a {
          color: rgba(255,255,255,0.85);
          transition: all var(--transition-fast);
          display: inline-block;
        }

        .footer-links a:hover {
          color: #ffffff;
          transform: translateX(3px);
        }

        .footer-newsletter-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .newsletter-text {
          line-height: 1.5;
          color: rgba(255,255,255,0.85);
        }

        .newsletter-form {
          display: flex;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.35);
          transition: border-color var(--transition-fast);
        }

        .newsletter-form:focus-within {
          border-color: #ffffff;
        }

        .newsletter-input {
          flex: 1;
          background: rgba(255,255,255,0.15);
          border: none;
          color: #ffffff;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }

        .newsletter-input::placeholder {
          color: rgba(255,255,255,0.6);
        }

        .newsletter-btn {
          background: #ffffff;
          color: #16a34a;
          border: none;
          padding: 0 1.25rem;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .newsletter-btn:hover {
          background: #dcfce7;
        }

        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.25);
          padding-top: 1.5rem;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.75);
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

        .footer-legal-links a {
          color: rgba(255,255,255,0.75);
        }

        .footer-legal-links a:hover {
          color: #ffffff;
        }

        .bullet-dot {
          width: 4px;
          height: 4px;
          background-color: rgba(255,255,255,0.5);
          border-radius: 50%;
        }
      `}</style>
    </footer>
  );
}
