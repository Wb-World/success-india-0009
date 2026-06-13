'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Terminal, Cpu, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

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
            <Terminal size={24} className="logo-icon" />
            <span>CYBER<span className="text-primary">_STRIKE</span></span>
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
          <Terminal size={26} className="logo-icon" />
          <span>CYBER<span className="text-primary">_STRIKE</span></span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="nav-links-desktop">
          {!isLoggedIn && (
            <>
              <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Summit</Link>
              <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>Arenas & Tech</Link>
              <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Intel Desk</Link>
            </>
          )}
          {isLoggedIn && !isAdmin && (
            <>
              <Link href="/profile" className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}>Control Deck</Link>
              <Link href="/book" className={`nav-link ${pathname === '/book' ? 'active' : ''}`}>Reserve Passes</Link>
            </>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="nav-actions-desktop">
          {isLoggedIn ? (
            <div className="user-profile-controls">
              {!isAdmin && (
                <Link href="/profile" className="profile-btn-nav">
                  <User size={14} />
                  <span>{sessionUser!.name.split(' ')[0]}</span>
                </Link>
              )}
              <button onClick={handleLogout} className="btn-logout" title="Disconnect Session">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link href="/profile" className="btn btn-primary nav-login-btn">Initialize Session</Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <nav className="mobile-drawer-links">
            {!isLoggedIn && (
              <>
                <Link href="/" className={`mobile-link ${pathname === '/' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Summit</Link>
                <Link href="/about" className={`mobile-link ${pathname === '/about' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Arenas & Tech</Link>
                <Link href="/contact" className={`mobile-link ${pathname === '/contact' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Intel Desk</Link>
              </>
            )}
            {isLoggedIn && !isAdmin && (
              <>
                <Link href="/profile" className={`mobile-link ${pathname === '/profile' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Control Deck</Link>
                <Link href="/book" className={`mobile-link ${pathname === '/book' ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>Reserve Passes</Link>
              </>
            )}
            <hr className="mobile-divider" />
            {isLoggedIn ? (
              <div className="mobile-user-info">
                {!isAdmin && (
                  <Link href="/profile" className="mobile-profile-link" onClick={() => setMenuOpen(false)}>
                    <User size={16} /> Control Deck ({sessionUser!.name})
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-secondary mobile-logout-btn">
                  <LogOut size={14} /> Disconnect
                </button>
              </div>
            ) : (
              <div className="mobile-auth-actions">
                <Link href="/profile" className="btn btn-primary mobile-login-btn" onClick={() => setMenuOpen(false)}>
                  Initialize Session
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
          background: rgba(3, 7, 18, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          z-index: 100;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: all var(--transition-normal);
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
          gap: 0.625rem;
          font-family: var(--font-heading);
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: 0.5px;
          color: var(--foreground);
          transition: transform var(--transition-fast), opacity var(--transition-fast);
        }
        .nav-logo:hover { transform: scale(1.02); opacity: 0.95; }

        .logo-icon {
          color: var(--primary);
          filter: drop-shadow(0 0 8px var(--primary-glow));
          transition: transform var(--transition-fast);
        }
        .nav-logo:hover .logo-icon { transform: rotate(-10deg); }

        .text-primary { color: var(--primary); }

        .nav-links-desktop {
          display: none;
          gap: 2.25rem;
          align-items: center;
        }

        .nav-link {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--muted);
          position: relative;
          padding: 0.3rem 0;
          transition: color var(--transition-fast);
          text-transform: uppercase;
          letter-spacing: 0.5px;
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
        .nav-link.active { color: var(--primary); font-weight: 700; text-shadow: 0 0 10px var(--primary-glow); }
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
          color: var(--primary);
          border-radius: var(--radius-lg);
          font-size: 0.85rem;
          font-weight: 700;
          transition: all var(--transition-fast);
          border: 1px solid rgba(16, 185, 129, 0.25);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .profile-btn-nav:hover {
          background: rgba(16, 185, 129, 0.25);
          transform: translateY(-1px);
          box-shadow: var(--shadow-primary);
        }

        .btn-logout {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: var(--danger);
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          transition: all var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-logout:hover {
          color: white;
          background: var(--danger);
          transform: scale(1.05);
        }

        .nav-auth-buttons { display: flex; align-items: center; gap: 1rem; }

        .nav-login-btn {
          padding: 0.5rem 1.25rem;
          font-size: 0.85rem;
          border-radius: var(--radius-lg);
        }

        .mobile-menu-toggle {
          display: flex;
          background: none;
          border: none;
          color: var(--foreground);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast);
        }
        .mobile-menu-toggle:hover {
          background-color: var(--border);
        }

        .mobile-drawer {
          position: absolute;
          top: 70px;
          left: 0;
          right: 0;
          background: rgba(3, 7, 18, 0.98);
          border-bottom: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          padding: 1.5rem;
          z-index: 99;
        }

        .mobile-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .mobile-link {
          font-size: 1rem;
          font-weight: 600;
          color: var(--muted);
          padding: 0.25rem 0;
          transition: color var(--transition-fast), padding-left var(--transition-fast);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .mobile-link:hover { color: var(--primary); padding-left: 0.5rem; }
        .mobile-link.active { color: var(--primary); font-weight: 700; }

        .mobile-divider { border: 0; border-top: 1px solid var(--border); margin: 0.25rem 0; }

        .mobile-user-info { display: flex; flex-direction: column; gap: 0.875rem; }

        .mobile-profile-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          color: var(--foreground);
          font-weight: 600;
          text-transform: uppercase;
        }

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
