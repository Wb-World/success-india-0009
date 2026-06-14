'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Ticket, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // ALL hooks must be at the top — never after a conditional return
  const [sessionUser, setSessionUser] = useState<{ name: string; role: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Conditionals AFTER all hooks
  const isAdminRoute = pathname.startsWith('/admin');
  if (isAdminRoute) return null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    setSessionUser(null);
    setMenuOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/');
  };

  if (!mounted) {
    return (
      <header className="nav-header">
        <div className="nav-container">
          <div className="nav-logo">
            <Ticket size={26} className="logo-icon" />
            <span>Show<span className="text-primary">Time</span></span>
          </div>
        </div>
      </header>
    );
  }

  const isAdmin = sessionUser?.role === 'admin';
  const isLoggedIn = !!sessionUser;

  return (
    <header className="nav-header animate-slide-down">
      <div className="nav-container">
        <Link href="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <Ticket size={28} className="logo-icon" />
          <span>Show<span className="text-primary">Time</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links-desktop">
          {!isLoggedIn && (
            <>
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
              <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>About</Link>
              <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
            </>
          )}
          {isLoggedIn && !isAdmin && (
            <>
              <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>Dashboard</Link>
              <Link href="/book" className={`nav-link ${pathname === '/book' ? 'active' : ''}`}>Book Tickets</Link>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="nav-actions-desktop">
          {isLoggedIn ? (
            <div className="user-profile-controls">
              {!isAdmin && (
                <Link href="/profile" className="profile-btn-nav">
                  <User size={16} />
                  <span>{sessionUser!.name.split(' ')[0]}</span>
                </Link>
              )}
              <button onClick={handleLogout} className="btn-logout" title="Log Out">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link href="/profile" className="btn btn-primary nav-login-btn">Login / Sign Up</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <nav className="mobile-drawer-links">
            {!isLoggedIn && (
              <>
                <Link href="/" className={`mobile-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Home</Link>
                <Link href="/about" className={`mobile-link ${pathname === '/about' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>About Us</Link>
                <Link href="/contact" className={`mobile-link ${pathname === '/contact' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Contact Us</Link>
              </>
            )}
            {isLoggedIn && !isAdmin && (
              <>
                <Link href="/profile" className={`mobile-link ${pathname === '/profile' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <Link href="/book" className={`mobile-link ${pathname === '/book' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Book Tickets</Link>
              </>
            )}
            <hr className="mobile-divider" />
            {isLoggedIn ? (
              <div className="mobile-user-info">
                {!isAdmin && (
                  <Link href="/profile" className="mobile-profile-link" onClick={() => setMenuOpen(false)}>
                    <User size={18} /> View Dashboard ({sessionUser!.name})
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-secondary mobile-logout-btn">
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            ) : (
              <div className="mobile-auth-actions">
                <Link href="/profile" className="btn btn-primary mobile-login-btn" onClick={() => setMenuOpen(false)}>
                  Login / Sign Up
                </Link>
              </div>
            )}
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
          padding: 0 2rem;
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
        }
        .nav-logo:hover { transform: scale(1.03); opacity: 0.9; }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 2px 6px rgba(16, 185, 129, 0.25));
          transition: transform var(--transition-fast);
        }
        .nav-logo:hover .logo-icon { transform: rotate(-8deg); }

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

        .user-profile-controls {
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .profile-btn-nav {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 1rem;
          background: var(--primary-light);
          color: var(--primary-dark);
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 600;
          transition: all var(--transition-fast);
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .profile-btn-nav:hover {
          background: #d1fae5;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.2);
        }

        .btn-logout {
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          padding: 0.45rem;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-logout:hover {
          color: var(--danger);
          background: #fee2e2;
          transform: scale(1.1);
        }

        .nav-auth-buttons { display: flex; align-items: center; gap: 1rem; }

        .nav-login-btn {
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast) !important;
        }
        .nav-login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(16,185,129,0.3);
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

        .mobile-user-info { display: flex; flex-direction: column; gap: 0.875rem; }

        .mobile-profile-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          color: var(--foreground);
          font-weight: 500;
          transition: color var(--transition-fast);
        }
        .mobile-profile-link:hover { color: var(--primary); }

        .mobile-logout-btn { width: 100%; justify-content: center; padding: 0.625rem; }

        .mobile-auth-actions { display: flex; flex-direction: column; gap: 0.875rem; align-items: center; }
        .mobile-login-btn { width: 100%; text-align: center; justify-content: center; }

        @media (min-width: 768px) {
          .nav-links-desktop { display: flex; }
          .nav-actions-desktop { display: flex; }
          .mobile-menu-toggle { display: none; }
        }
      `}</style>
    </header>
  );
}
