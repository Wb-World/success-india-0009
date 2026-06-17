'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Calendar } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  // Suppress navbar completely on admin pages
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  return (
    <header className="nav-header animate-slide-down">
      <div className="nav-container">
        <Link href="/" className="nav-logo" onClick={closeMenu}>
          <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="brand-logo-img" />
          <span>Success<span className="text-primary"> Team</span></span>
        </Link>

        <nav className="nav-links-desktop" aria-label="Primary navigation">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
          {/* <Link href="/book" className={`nav-link ${pathname === '/book' ? 'active' : ''}`}>Book Seminars</Link> */}
        </nav>

        <div className="nav-actions-desktop">
          <Link href="/book" className="btn btn-primary nav-book-btn">
            <Calendar size={16} /> Book a Event
          </Link>
        </div>

        <button
          className="mobile-menu-toggle"
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-controls="mobile-nav-drawer"
          aria-expanded={menuOpen}
          aria-haspopup="dialog"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="mobile-drawer-backdrop"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />
          <div className="mobile-drawer animate-slide-down" id="mobile-nav-drawer" role="dialog" aria-modal="true" aria-label="Site navigation">
            <div className="mobile-drawer-panel">
              {/* <div className="mobile-drawer-top">
                <Link href="/" className="mobile-drawer-brand" onClick={closeMenu}>
                  <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="mobile-brand-logo" />
                  <div className="mobile-brand-copy">
                    <span className="mobile-brand-title">Success<span className="text-primary"> Team</span></span>
                    <span className="mobile-brand-subtitle">Official event portal</span>
                  </div>
                </Link>

                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={closeMenu}
                  aria-label="Close navigation menu"
                >
                  <X size={20} />
                </button>
              </div> */}

              <nav className="mobile-drawer-links" aria-label="Mobile navigation">
                <Link href="/" className={`mobile-link ${pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
                <Link href="/about" className={`mobile-link ${pathname === '/about' ? 'active' : ''}`} onClick={closeMenu}>About</Link>
                <Link href="/contact" className={`mobile-link ${pathname === '/contact' ? 'active' : ''}`} onClick={closeMenu}>Contact</Link>
                {/* <Link href="/book" className={`mobile-link ${pathname === '/book' ? 'active' : ''}`} onClick={closeMenu}>Book Seminars</Link> */}
              </nav>

              <div className="mobile-drawer-actions">
                <Link href="/book" className="btn btn-primary mobile-book-btn" onClick={closeMenu}>
                  <Calendar size={16} /> Book a Event
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .nav-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          min-height: 70px;
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          z-index: 120;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 8px rgba(0, 0, 0, 0.04);
          transition: box-shadow var(--transition-normal);
          --nav-height: 70px;
        }

        @media (max-width: 640px) {
          .nav-header {
            min-height: 64px;
            --nav-height: 64px;
          }
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1rem;
          min-height: var(--nav-height);
        }

        @media (min-width: 640px) {
          .nav-container { padding: 0 1.5rem; }
        }

        @media (min-width: 1024px) {
          .nav-container { padding: 0 2rem; }
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--foreground);
          transition: transform var(--transition-fast), opacity var(--transition-fast);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-logo > span {
          display: inline-flex;
          align-items: center;
          line-height: 1;
          margin-top: -2px;
        }

        .nav-logo:hover {
          transform: scale(1.03);
          opacity: 0.9;
        }

        @media (max-width: 480px) {
          .nav-logo {
            font-size: 1.05rem;
            gap: 0.35rem;
          }
        }

        .brand-logo-img {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(22, 163, 74, 0.22);
          filter: drop-shadow(0 2px 6px rgba(22, 163, 74, 0.25));
          transition: transform var(--transition-fast);
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .brand-logo-img {
            width: 28px;
            height: 28px;
          }
        }

        .nav-logo:hover .brand-logo-img {
          transform: rotate(-8deg);
        }

        .text-primary {
          color: var(--primary);
        }

        .nav-links-desktop {
          display: none;
          gap: 2rem;
          align-items: center;
          justify-content: center;
          flex: 1;
        }

        .nav-link {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--muted);
          position: relative;
          padding: 0.3rem 0;
          transition: color var(--transition-fast);
          white-space: nowrap;
        }

        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: var(--primary);
          border-radius: 999px;
          transition: all var(--transition-normal);
          transform: translateX(-50%);
        }

        .nav-link:hover {
          color: var(--foreground);
        }

        .nav-link:hover::after {
          width: 100%;
        }

        .nav-link.active {
          color: var(--primary);
          font-weight: 600;
        }

        .nav-link.active::after {
          width: 100%;
        }

        .nav-actions-desktop {
          display: none;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .nav-book-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 1rem;
          font-size: 0.9rem;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast) !important;
          white-space: nowrap;
        }

        .nav-book-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-primary);
        }

        .nav-logout-btn,
        .mobile-logout-btn {
          color: #ef4444;
          border-color: #fecaca;
        }

        .mobile-menu-toggle {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          background: white;
          border: 1px solid var(--border);
          color: var(--foreground);
          cursor: pointer;
          padding: 0;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition: background-color var(--transition-fast), transform var(--transition-fast), border-color var(--transition-fast);
          flex-shrink: 0;
        }

        .mobile-menu-toggle:hover {
          background-color: var(--input);
          border-color: var(--primary);
          transform: translateY(-1px);
        }

        @media (max-width: 640px) {
          .mobile-menu-toggle {
            width: 40px;
            height: 40px;
          }
        }

        .mobile-drawer-backdrop {
          position: fixed;
          inset: var(--nav-height) 0 0 0;
          background: rgba(17, 24, 39, 0.42);
          border: none;
          padding: 0;
          margin: 0;
          z-index: 110;
          cursor: default;
        }

        .mobile-drawer {
          position: fixed;
          top: var(--nav-height);
          left: 0;
          right: 0;
          z-index: 120;
          max-height: calc(100vh - var(--nav-height));
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
        }

        .mobile-drawer-panel {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          padding: 1rem;
          max-width: 1280px;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .mobile-drawer-panel {
            padding: 1.25rem 1.5rem 1.5rem;
          }
        }

        .mobile-drawer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .mobile-drawer-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
        }

        .mobile-brand-logo {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid rgba(22, 163, 74, 0.22);
          flex-shrink: 0;
        }

        .mobile-brand-copy {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .mobile-brand-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 800;
          color: var(--foreground);
          line-height: 1.1;
        }

        .mobile-brand-subtitle {
          font-size: 0.8rem;
          color: var(--muted);
          line-height: 1.2;
        }

        .mobile-drawer-close {
          width: 40px;
          height: 40px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: white;
          color: var(--foreground);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .mobile-drawer-links {
          display: grid;
          gap: 0.75rem;
        }

        .mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.95rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          color: var(--foreground);
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          transition: border-color var(--transition-fast), background-color var(--transition-fast), transform var(--transition-fast);
        }

        .mobile-link::after {
          content: '>';
          color: var(--muted);
          font-size: 1.15rem;
          line-height: 1;
        }

        .mobile-link:hover {
          border-color: var(--primary);
          background: var(--input);
          transform: translateY(-1px);
        }

        .mobile-link.active {
          color: var(--primary-dark);
          border-color: var(--primary);
          background: var(--primary-light);
        }

        .mobile-link.active::after {
          color: var(--primary);
        }

        .mobile-drawer-actions {
          display: grid;
          gap: 0.75rem;
          padding-top: 0.25rem;
        }

        .mobile-book-btn {
          width: 100%;
          text-align: center;
          justify-content: center;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.9rem 1rem;
        }

        @media (min-width: 1024px) {
          .nav-links-desktop { display: flex; }
          .nav-actions-desktop { display: flex; }
          .mobile-menu-toggle { display: none; }
        }
      `}</style>
    </header>
  );
}
