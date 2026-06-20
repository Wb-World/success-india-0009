'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTab, setCurrentTab] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentTab(params.get('tab') || 'bookings');
    }
  }, [pathname]);

  useEffect(() => {
    if (!user || !user.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/profile', {
          headers: {
            'x-user-id': user.id,
          },
        });
        if (res.ok) {
          const data = await res.json();
          const count = (data.notifications || []).filter((n: any) => !n.isRead).length;
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching notifications in Navbar:', err);
      }
    };

    fetchUnreadCount();

    // Set up polling every 15 seconds as a fallback
    const interval = setInterval(fetchUnreadCount, 15000);

    // Set up realtime channel for notifications table updates
    let channel: any;
    try {
      channel = supabase
        .channel(`navbar-notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log('[Realtime] Navbar notifications changed');
            fetchUnreadCount();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription not available or failed:', e);
    }

    // Refresh when auth-change event fires (e.g. marking read in profile)
    const handleRefresh = () => {
      fetchUnreadCount();
    };
    window.addEventListener('auth-change', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-change', handleRefresh);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    window.addEventListener('auth-change', checkUser);
    window.addEventListener('storage', checkUser);

    return () => {
      window.removeEventListener('auth-change', checkUser);
      window.removeEventListener('storage', checkUser);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = '/login';
  };

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/success-india-logo.jpeg?v=2" alt="Success Team logo" className="brand-logo-img" />
          <span>Success<span className="text-primary"> Team</span></span>
        </Link>

        <nav className="nav-links-desktop" aria-label="Primary navigation">
          <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>Home</Link>
          <Link href="/events" className={`nav-link ${pathname === '/events' ? 'active' : ''}`}>Event</Link>
          <Link href="/contribution" className={`nav-link ${pathname === '/contribution' ? 'active' : ''}`}>Contribution</Link>
          <Link href="/about" className={`nav-link ${pathname === '/about' ? 'active' : ''}`}>About</Link>
          <Link href="/contact" className={`nav-link ${pathname === '/contact' ? 'active' : ''}`}>Contact</Link>
        </nav>

        <div className="nav-actions-desktop">
          {user ? (
            <div className="profile-dropdown-container">
              <button
                type="button"
                className={`btn-profile-trigger ${pathname.startsWith('/profile') ? 'active' : ''}`}
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              >
                <User size={15} />
                <span>Profile</span>
                <ChevronDown size={14} />
                {unreadCount > 0 && <span className="navbar-unread-dot" />}
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="profile-dropdown-overlay" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="profile-dropdown-menu glass-card animate-slide-down">
                    <div className="dropdown-user-info">
                      <p className="dropdown-username">{user.name}</p>
                    </div>
                    <hr className="dropdown-divider" />
                    <Link
                      href="/profile?tab=bookings"
                      className={`dropdown-item ${pathname === '/profile' && currentTab === 'bookings' ? 'active' : ''}`}
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span>🎫 My Bookings</span>
                    </Link>
                    <Link
                      href="/profile?tab=notifications"
                      className={`dropdown-item ${pathname === '/profile' && currentTab === 'notifications' ? 'active' : ''}`}
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span>🔔 Notifications</span>
                        {unreadCount > 0 && <span className="dropdown-unread-count">{unreadCount}</span>}
                      </span>
                    </Link>
                    <hr className="dropdown-divider" />
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                      className="dropdown-item logout-item"
                    >
                      <span>🚪 Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="nav-auth-buttons">
              <Link href="/login" className="btn-auth btn-auth-outline">Login</Link>
              <Link href="/signup" className="btn-auth btn-auth-filled">Sign In</Link>
            </div>
          )}
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
              <nav className="mobile-drawer-links" aria-label="Mobile navigation">
                <Link href="/" className={`mobile-link ${pathname === '/' ? 'active' : ''}`} onClick={closeMenu}>Home</Link>
                <Link href="/events" className={`mobile-link ${pathname === '/events' ? 'active' : ''}`} onClick={closeMenu}>Event</Link>
                <Link href="/contribution" className={`mobile-link ${pathname === '/contribution' ? 'active' : ''}`} onClick={closeMenu}>Contribution</Link>
                <Link href="/about" className={`mobile-link ${pathname === '/about' ? 'active' : ''}`} onClick={closeMenu}>About</Link>
                <Link href="/contact" className={`mobile-link ${pathname === '/contact' ? 'active' : ''}`} onClick={closeMenu}>Contact</Link>
                {user ? (
                  <>
                    <div style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.5rem' }}>Member Portal</div>
                    <Link href="/profile?tab=bookings" className={`mobile-link ${pathname === '/profile' && currentTab === 'bookings' ? 'active' : ''}`} onClick={closeMenu}>
                      <span>🎫 My Bookings</span>
                    </Link>
                    <Link href="/profile?tab=notifications" className={`mobile-link ${pathname === '/profile' && currentTab === 'notifications' ? 'active' : ''}`} onClick={closeMenu}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'space-between' }}>
                        <span>🔔 Notifications</span>
                        {unreadCount > 0 && <span className="dropdown-unread-count">{unreadCount}</span>}
                      </span>
                    </Link>
                    <button type="button" onClick={() => { handleLogout(); closeMenu(); }} className="mobile-link mobile-logout-btn" style={{ textAlign: 'left', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none' }}>
                      <span>🚪 Logout</span>
                    </button>
                  </>
                ) : (
                  <div className="mobile-auth-buttons">
                    <Link href="/login" className="mobile-btn-auth mobile-btn-auth-outline" onClick={closeMenu}>Login</Link>
                    <Link href="/signup" className="mobile-btn-auth mobile-btn-auth-filled" onClick={closeMenu}>Sign In</Link>
                  </div>
                )}
              </nav>


            </div>
          </div>
        </>
      )}

      <style>{`
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
          .nav-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .nav-logo {
            transform: none;
          }
          .nav-logo:hover {
            transform: scale(1.03);
          }
          .nav-links-desktop {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 2rem;
            flex: 1;
            margin: 0;
          }
          .nav-actions-desktop {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .mobile-menu-toggle { display: none; }
        }

        .profile-dropdown-container {
          position: relative;
          display: inline-block;
        }

        .btn-profile-trigger {
          background: white;
          border: 1.5px solid var(--primary);
          color: var(--primary);
          cursor: pointer;
          font-family: inherit;
          font-size: 0.92rem;
          font-weight: 600;
          padding: 0.45rem 1.15rem;
          border-radius: var(--radius-lg);
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          position: relative;
          transition: all var(--transition-fast);
          height: 38px;
          box-sizing: border-box;
          line-height: 1;
        }

        .btn-profile-trigger:hover,
        .btn-profile-trigger.active {
          color: white;
          background: var(--primary);
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
          transform: translateY(-1px);
        }

        .navbar-unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #ef4444;
          position: absolute;
          top: 4px;
          right: 4px;
          border: 1px solid white;
        }

        .profile-dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 990;
          background: transparent;
          cursor: default;
        }

        .profile-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 240px;
          background: white;
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dropdown-user-info {
          padding: 0.5rem 0.75rem;
        }

        .dropdown-username {
          font-weight: 700;
          color: var(--foreground);
          font-size: 0.9rem;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dropdown-userrole {
          font-size: 0.75rem;
          color: var(--muted);
          margin: 0;
          font-weight: 500;
        }

        .dropdown-divider {
          border: 0;
          border-top: 1px solid var(--border);
          margin: 0.25rem 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--muted);
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          text-align: left;
          background: none;
          border: none;
          width: 100%;
          cursor: pointer;
          font-family: inherit;
        }

        .dropdown-item:hover {
          color: var(--foreground);
          background-color: var(--input);
        }

        .dropdown-item.active {
          color: var(--primary-dark);
          background-color: var(--primary-light);
        }

        .dropdown-unread-count {
          background-color: #ef4444;
          color: white;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.45rem;
          border-radius: 9999px;
          line-height: 1;
        }

        .dropdown-item.logout-item {
          color: #ef4444;
        }

        .dropdown-item.logout-item:hover {
          background-color: #fee2e2;
          color: #b91c1c;
        }

        .nav-auth-buttons {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: 0.5rem;
        }

        .btn-auth {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1.25rem;
          font-size: 0.9rem;
          font-weight: 600;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          cursor: pointer;
          height: 38px;
          line-height: 1;
          text-align: center;
          white-space: nowrap;
          box-sizing: border-box;
        }

        .btn-auth-outline {
          background: transparent;
          color: var(--primary);
          border: 1.5px solid var(--primary);
        }

        .btn-auth-outline:hover {
          background-color: var(--primary-light);
          transform: translateY(-1px);
        }

        .btn-auth-filled {
          background: var(--primary);
          color: white;
          border: 1.5px solid var(--primary);
        }

        .btn-auth-filled:hover {
          background: var(--primary-dark);
          border-color: var(--primary-dark);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        /* Mobile auth buttons */
        .mobile-auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          margin-top: 0.75rem;
          padding: 0 0.5rem;
        }

        .mobile-btn-auth {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem 1rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: var(--radius-lg);
          transition: all var(--transition-fast);
          width: 100%;
          text-align: center;
          height: 46px;
          box-sizing: border-box;
          cursor: pointer;
        }

        .mobile-btn-auth::after {
          display: none !important;
        }

        .mobile-btn-auth-outline {
          background: transparent;
          color: var(--primary);
          border: 1.5px solid var(--primary);
        }

        .mobile-btn-auth-outline:hover {
          background-color: var(--primary-light);
        }

        .mobile-btn-auth-filled {
          background: var(--primary);
          color: white;
          border: 1.5px solid var(--primary);
        }

        .mobile-btn-auth-filled:hover {
          background: var(--primary-dark);
          border-color: var(--primary-dark);
        }
      `}</style>
    </header>
  );
}
