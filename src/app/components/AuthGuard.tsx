'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const stored = localStorage.getItem('user');
      if (!stored) {
        setIsBlocked(true);
      } else {
        setIsBlocked(false);
      }
      setChecking(false);
    };

    checkAuth();
    
    // Listen for auth state changes
    window.addEventListener('auth-change', checkAuth);
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('auth-change', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  useEffect(() => {
    if (isBlocked) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isBlocked]);

  const handleClose = () => {
    // Redirect to homepage if they dismiss the login requirement
    router.push('/');
  };

  const handleLogin = () => {
    router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  };

  const handleSignup = () => {
    router.push(`/signup?callbackUrl=${encodeURIComponent(pathname)}`);
  };

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
        <style>{`
          .spinner {
            border: 4px solid rgba(16, 185, 129, 0.1);
            border-left-color: #10b981;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={isBlocked ? { pointerEvents: 'none', userSelect: 'none', position: 'relative' } : {}}>
      {children}
      
      {isBlocked && (
        <div className="auth-overlay">
          <div className="auth-modal glass-card">
            <button type="button" className="auth-modal-close" onClick={handleClose} aria-label="Close">&times;</button>
            <div className="auth-modal-header">
              <ShieldAlert className="auth-modal-icon" size={48} />
              <h2 className="heading-md auth-modal-title">Login Required</h2>
            </div>
            <p className="auth-modal-desc">You must login or create an account to continue.</p>
            <div className="auth-modal-actions">
              <button type="button" onClick={handleLogin} className="btn btn-primary auth-btn-login">Login</button>
              <button type="button" onClick={handleSignup} className="btn btn-secondary auth-btn-signup">Sign Up</button>
            </div>
          </div>
          
          <style>{`
            .auth-overlay {
              position: fixed;
              inset: 0;
              z-index: 99999;
              display: flex;
              align-items: center;
              justify-content: center;
              background: rgba(17, 24, 39, 0.6);
              backdrop-filter: blur(16px);
              -webkit-backdrop-filter: blur(16px);
              padding: 1rem;
              animation: fadeIn 0.3s ease-out;
              pointer-events: auto; /* Allow interaction with modal */
              user-select: auto;
            }

            .auth-modal {
              background: rgba(255, 255, 255, 0.85);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.4);
              border-radius: 16px;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
              width: 100%;
              max-width: 420px;
              padding: 2.5rem 2rem;
              position: relative;
              text-align: center;
              animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }

            .auth-modal-close {
              position: absolute;
              top: 1rem;
              right: 1.25rem;
              background: none;
              border: none;
              font-size: 1.75rem;
              color: #6b7280;
              cursor: pointer;
              line-height: 1;
              padding: 0.25rem;
              transition: color 0.2s;
            }

            .auth-modal-close:hover {
              color: #111827;
            }

            .auth-modal-header {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1rem;
              margin-bottom: 1rem;
            }

            .auth-modal-icon {
              color: #10b981;
            }

            .auth-modal-title {
              font-weight: 800;
              color: #111827;
              margin: 0;
              font-size: 1.5rem;
            }

            .auth-modal-desc {
              color: #4b5563;
              font-size: 1rem;
              line-height: 1.5;
              margin: 0 0 2rem 0;
            }

            .auth-modal-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
            }

            .auth-btn-login {
              background: #10b981 !important;
              color: white !important;
              padding: 0.75rem;
              font-size: 1rem;
              font-weight: 600;
              border-radius: 8px;
              border: none;
              cursor: pointer;
            }

            .auth-btn-login:hover {
              background: #059669 !important;
            }

            .auth-btn-signup {
              background: white !important;
              border: 1px solid #e5e7eb !important;
              color: #111827 !important;
              padding: 0.75rem;
              font-size: 1rem;
              font-weight: 600;
              border-radius: 8px;
              cursor: pointer;
            }

            .auth-btn-signup:hover {
              background: #f3f4f6 !important;
            }

            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }

            @keyframes scaleIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }

            @media (max-width: 480px) {
              .auth-modal {
                padding: 2rem 1.5rem;
              }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
