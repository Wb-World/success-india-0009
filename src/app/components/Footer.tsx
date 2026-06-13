'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, Mail, Phone, MapPin, Send } from 'lucide-react';

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
            <Terminal size={26} className="footer-logo-icon" />
            <span>CYBER<span className="text-primary">_STRIKE</span></span>
          </Link>
          <p className="footer-desc">
            The premier global cyber exploitation & defense summit. Conjoining elite white-hat collectives, security researchers, and defense operatives since 2020.
          </p>
          <div className="footer-contact-info">
            <div className="contact-item">
              <Phone size={14} />
              <span>+1 (800) 555-INIT (Secure Line)</span>
            </div>
            <div className="contact-item">
              <Mail size={14} />
              <span>ops@cyberstrike.io</span>
            </div>
            <div className="contact-item">
              <MapPin size={14} />
              <span>Grid Node 404, Sandbox Plaza, Cyber City</span>
            </div>
          </div>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Console Directories</h4>
          <ul className="footer-links">
            {!isLoggedIn ? (
              <>
                <li><Link href="/">Summit Briefing</Link></li>
                <li><Link href="/about">Arenas & Tech</Link></li>
                <li><Link href="/contact">Intel Desk</Link></li>
                <li><Link href="/book">Reserve Passes</Link></li>
              </>
            ) : (
              <>
                {!isAdmin ? (
                  <>
                    <li><Link href="/profile">Control Deck</Link></li>
                    <li><Link href="/book">Reserve Passes</Link></li>
                  </>
                ) : (
                  <li><Link href="/admin/dashboard">Decryption Operations</Link></li>
                )}
              </>
            )}
          </ul>
        </div>

        <div className="footer-links-col">
          <h4 className="footer-title">Popular Tracks</h4>
          <ul className="footer-links">
            <li><Link href="/book?source=Offensive+AI&destination=Nexus+Room+(Hall+A)">Offensive AI Arena</Link></li>
            <li><Link href="/book?source=Reverse+Engineering&destination=Sandbox+Lab+(Suite+404)">Reverse Engineering Lab</Link></li>
            <li><Link href="/book?source=Web3+%26+Cryptography&destination=Black+Box+Room+(Hall+B)">Web3 & Cryptography Stage</Link></li>
            <li><Link href="/book?source=Hardware+%26+IoT&destination=Silicon+Sandbox+(Lab+C)">Hardware & IoT Lab</Link></li>
          </ul>
        </div>

        <div className="footer-newsletter-col">
          <h4 className="footer-title">Intel Dispatch</h4>
          <p className="newsletter-text">
            Subscribe to secure communication feeds for emergency patch releases, Zero-Day advisories, and elite pass updates.
          </p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="operative@domain.xyz" 
              className="newsletter-input" 
              required 
            />
            <button type="submit" className="newsletter-btn">
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-flex">
          <p className="copyright-text">
            &copy; {currentYear} CyberStrike Operations. Securing the global grid. All rights reserved.
          </p>
          <div className="footer-legal-links">
            <Link href="/contact">Encryption Protocol</Link>
            <span className="bullet-dot"></span>
            <Link href="/contact">Code of Conduct</Link>
            <span className="bullet-dot"></span>
            <Link href="/contact">Zero-Day Disclosure</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .site-footer {
          background: #040811;
          color: #94a3b8;
          padding: 4.5rem 0 1.5rem 0;
          border-top: 2px solid var(--primary);
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
          font-size: 1.4rem;
          font-weight: 900;
          color: white;
        }

        .footer-logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 0 5px var(--primary-glow));
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
          font-size: 0.95rem;
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
          font-weight: 500;
        }

        .footer-links a:hover {
          color: var(--primary);
          transform: translateX(3px);
          text-shadow: 0 0 5px var(--primary-glow);
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
          border: 1px solid var(--border);
          transition: border-color var(--transition-fast);
        }

        .newsletter-form:focus-within {
          border-color: var(--primary);
          box-shadow: 0 0 10px var(--primary-glow);
        }

        .newsletter-input {
          flex: 1;
          background: #0b111e;
          border: none;
          color: white;
          padding: 0.75rem 1rem;
          font-size: 0.85rem;
        }

        .newsletter-btn {
          background: var(--primary);
          color: #022c22;
          border: none;
          padding: 0 1.25rem;
          cursor: pointer;
          transition: background var(--transition-fast);
          display: flex;
          align-items: center;
        }

        .newsletter-btn:hover {
          background: var(--primary-hover);
        }

        .footer-bottom {
          border-top: 1px solid var(--border);
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
