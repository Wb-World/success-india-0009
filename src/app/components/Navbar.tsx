'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Calendar, User, LogOut, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error(e);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('auth-change', checkUser);
    return () => window.removeEventListener('auth-change', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
    setMenuOpen(false);
  };

  // Suppress navbar completely on admin pages
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  return (
    <header className="nav-header animate-slide-down">
      <div className="nav-container">
        <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="brand-logo-img" />
          <span>Success<span className="text-primary"> Team</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links-desktop">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
          <Link href="/book" className={`nav-link ${pathname === '/book' ? 'active' : ''}`}>Book Seminars</Link>
        </nav>

        {/* Desktop CTA Button */}
        <div className="nav-actions-desktop" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link href="/book" className="btn btn-primary nav-book-btn">
            <Calendar size={16} /> Book a Seat
          </Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link href="/admin/dashboard" className="btn btn-secondary nav-book-btn" style={{ borderColor: 'var(--primary)' }}>
                  <LayoutDashboard size={16} /> Admin
                </Link>
              )}
              <Link href="/profile" className="btn btn-secondary nav-book-btn">
                <User size={16} /> Profile
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary nav-book-btn" style={{ color: '#ef4444', borderColor: '#fee2e2' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <Link href="/profile" className="btn btn-secondary nav-book-btn">
              <User size={16} /> Sign In
            </Link>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <nav className="mobile-drawer-links">
            <Link href="/" className={`mobile-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
            <Link href="/about" className={`mobile-link ${pathname === '/about' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>About Us</Link>
            <Link href="/contact" className={`mobile-link ${pathname === '/contact' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Contact Us</Link>
            <Link href="/book" className={`mobile-link ${pathname === '/book' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Book Seminars</Link>
            <hr className="mobile-divider" />
            <div className="mobile-auth-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
              <Link href="/book" className="btn btn-primary mobile-book-btn" onClick={() => setMenuOpen(false)}>
                <Calendar size={16} /> Book a Seat
              </Link>
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link href="/admin/dashboard" className="btn btn-secondary mobile-book-btn" style={{ borderColor: 'var(--primary)' }} onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard size={16} /> Admin Console
                    </Link>
                  )}
                  <Link href="/profile" className="btn btn-secondary mobile-book-btn" onClick={() => setMenuOpen(false)}>
                    <User size={16} /> My Profile
                  </Link>
                  <button onClick={handleLogout} className="btn btn-secondary mobile-book-btn" style={{ color: '#ef4444', borderColor: '#fee2e2', width: '100%' }}>
                    <LogOut size={16} /> Logout
                  </button>
                </>
              ) : (
                <Link href="/profile" className="btn btn-secondary mobile-book-btn" onClick={() => setMenuOpen(false)}>
                  <User size={16} /> Sign In
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}

      <style jsx>{`
        .nav-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          z-index: 100;
          display: flex;
          align-items: center;
          box-shadow: 0 1px 8px rgba(0,0,0,0.04);
          transition: box-shadow var(--transition-normal);
        }

        .nav-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1rem;
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
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--foreground);
          transition: transform var(--transition-fast), opacity var(--transition-fast);
          white-space: nowrap;
        }
        .nav-logo > span {
          display: inline-flex;
          align-items: center;
          line-height: 1;
          margin-top: -2px;
        }
        .nav-logo:hover { transform: scale(1.03); opacity: 0.9; }

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

        @media (max-width: 400px) {
          .nav-logo { font-size: 1.2rem !important; gap: 0.35rem !important; }
          .brand-logo-img { width: 28px !important; height: 28px !important; }
        }
        .nav-logo:hover .brand-logo-img { transform: rotate(-8deg); }

        .text-primary { color: var(--primary); }

        .nav-links-desktop {
          display: none;
          gap: 2rem;
          align-items: center;
        }

        .nav-link {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--muted);
          position: relative;
          padding: 0.3rem 0;
          transition: color var(--transition-fast);
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
        .nav-link:hover { color: var(--foreground); }
        .nav-link:hover::after { width: 100%; }
        .nav-link.active { color: var(--primary); font-weight: 600; }
        .nav-link.active::after { width: 100%; left: 50%; }

        .nav-actions-desktop {
          display: none;
          align-items: center;
          gap: 1rem;
        }

        .nav-book-btn {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast) !important;
        }
        .nav-book-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-primary);
        }

        .mobile-menu-toggle {
          display: flex;
          background: none;
          border: none;
          color: var(--foreground);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast), transform var(--transition-fast);
        }
        .mobile-menu-toggle:hover {
          background-color: var(--input);
          transform: scale(1.05);
        }

        .mobile-drawer {
          position: absolute;
          top: 70px;
          left: 0;
          right: 0;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          padding: 1.5rem;
          z-index: 99;
        }

        .mobile-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .mobile-link {
          font-size: 1.05rem;
          font-weight: 500;
          color: var(--muted);
          padding: 0.25rem 0;
          transition: color var(--transition-fast), padding-left var(--transition-fast);
        }
        .mobile-link:hover { color: var(--primary); padding-left: 0.5rem; }
        .mobile-link.active { color: var(--primary); font-weight: 600; }

        .mobile-divider { border: 0; border-top: 1px solid var(--border); margin: 0.25rem 0; }

        .mobile-auth-actions { display: flex; flex-direction: column; gap: 0.875rem; align-items: center; }
        .mobile-book-btn {
          width: 100%;
          text-align: center;
          justify-content: center;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }

        @media (min-width: 768px) {
          .nav-links-desktop { display: flex; }
          .nav-actions-desktop { display: flex; }
          .mobile-menu-toggle { display: none; }
        }
      `}</style>
    </header>
  );
}
