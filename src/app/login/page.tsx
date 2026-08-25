'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ShieldAlert, ArrowRight, Key, Mail, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function LoginContent() {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Success toast from reset-password page
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // TASK 2: Remove auto-login — clear any persisted localStorage session
    // if there is no active session flag in sessionStorage (i.e., browser was reopened).
    const sessionActive = sessionStorage.getItem('session_active');
    if (!sessionActive) {
      localStorage.removeItem('user');
    }
    // Check if redirected back after successful password reset
    if (searchParamsObj?.get('reset') === 'success') {
      setResetSuccess(true);
    }
  }, [searchParamsObj]);

  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const timer = setInterval(() => {
      setForgotCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [forgotCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user.role === 'admin') {
          setError('Admins must log in through the admin portal');
          setLoading(false);
          return;
        }

        // Save user session in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        // Mark session as active in sessionStorage so it clears on browser close
        sessionStorage.setItem('session_active', '1');

        // Dispatch custom auth-change event to update navbar/UI
        window.dispatchEvent(new Event('auth-change'));
        
        const cbParams = new URLSearchParams(window.location.search);
        const cb = cbParams.get('callbackUrl') || '';
        if (cb && cb.startsWith('/') && !cb.startsWith('//')) {
          router.push(cb);
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Invalid username/phone or password');
      }
    } catch (err) {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot password handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);
    if (!forgotUsername.trim()) {
      setForgotError('Please enter your Username or Phone Number.');
      return;
    }
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    if (forgotCooldown > 0) return;
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername.trim(),
          email: forgotEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setForgotCooldown(60);
        setForgotSuccess(true);
        setForgotError('');
      } else {
        setForgotError(data.error || 'Failed to send reset email. Please try again.');
      }
    } catch {
      setForgotError('An unexpected error occurred. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="admin-login-page animate-fade-in">
      {/* Decorative floating blur circles */}
      <div className="blur-circle circle-1"></div>
      <div className="blur-circle circle-2"></div>
      <div className="blur-circle circle-3"></div>

      <div className="login-wrapper">
        <div className="login-card glass-card animate-scale-in">
          <div className="card-header">
            <h1 className="admin-title">Member Login</h1>
            <p className="card-subtitle">Sign in to book event tickets and access your profile history.</p>
          </div>

          {/* Success toast after password reset */}
          {resetSuccess && (
            <div className="reset-success-toast animate-scale-in">
              <CheckCircle2 size={18} className="reset-success-icon" />
              <span>Password updated successfully! Please log in with your new password.</span>
              <button className="reset-toast-dismiss" onClick={() => setResetSuccess(false)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-alert animate-shake">
                <ShieldAlert size={16} /> <span>{error}</span>
              </div>
            )}

            {/* Username or Phone Number */}
            <div className="form-group">
              <label className="form-label font-label-custom">Username</label>
              <div className="input-with-icon">
                <div className="icon-badge">
                  <User size={15} className="input-field-icon" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username or Phone Number"
                  className="form-control padded-input custom-input-style"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label font-label-custom">Password</label>
              <div className="input-with-icon">
                <div className="icon-badge">
                  <Lock size={15} className="input-field-icon" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-control padded-input custom-input-style"
                  required
                />
              </div>
            </div>

            {/* Forgot Password link — centered, between password field and Login button */}
            <div className="forgot-pwd-row">
              <button
                type="button"
                className="forgot-pwd-link"
                onClick={() => { setShowForgotModal(true); setForgotUsername(''); setForgotEmail(''); setForgotError(''); setForgotSuccess(false); }}
                id="forgot-password-btn"
              >
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="btn btn-primary login-btn hover-glow" disabled={loading}>
              <span className="btn-icon-badge">
                <Key size={14} />
              </span>
              <span>{loading ? 'Verifying...' : 'Login'}</span>
            </button>

            <div className="auth-footer">
              Don&apos;t have an account? <Link href="/signup" className="auth-link">Sign In <ArrowRight size={14} /></Link>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fp-overlay" onClick={() => setShowForgotModal(false)} role="dialog" aria-modal="true" aria-label="Forgot password">
          <div className="fp-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button className="fp-close-btn" onClick={() => setShowForgotModal(false)} aria-label="Close">
              <X size={18} />
            </button>
            <div className="fp-header">
              <div className="fp-icon-ring">
                <Mail size={22} className="fp-mail-icon" />
              </div>
              <h2 className="fp-title">Forgot Password?</h2>
              <p className="fp-desc">Enter your username and email address to receive a password reset link.</p>
            </div>

              <form onSubmit={handleForgotPassword} className="fp-form">
                {forgotError && (
                  <div className="fp-error">
                    <ShieldAlert size={14} />
                    <span>{forgotError}</span>
                  </div>
                )}
                {forgotSuccess && (
                  <div className="fp-success-msg">
                    <CheckCircle2 size={16} className="fp-check-icon" />
                    <span>If this email exists, a reset link has been sent.</span>
                  </div>
                )}
                <div className="fp-form-group">
                  <label className="fp-label">Username</label>
                  <div className="fp-input-wrap">
                    <div className="fp-icon-badge">
                      <User size={14} className="fp-input-icon" />
                    </div>
                    <input
                      type="text"
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder="Enter your Username or Phone"
                      className="fp-input"
                      required
                      id="forgot-username-input"
                    />
                  </div>
                </div>
                <div className="fp-form-group">
                  <label className="fp-label">Email Address</label>
                  <div className="fp-input-wrap">
                    <div className="fp-icon-badge">
                      <Mail size={14} className="fp-input-icon" />
                    </div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="fp-input"
                      required
                      id="forgot-email-input"
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="fp-submit-btn" 
                  disabled={forgotLoading || forgotCooldown > 0 || forgotSuccess} 
                  id="forgot-submit-btn"
                >
                  {forgotLoading 
                    ? 'Sending…' 
                    : forgotSuccess 
                      ? 'Link Sent!' 
                      : forgotCooldown > 0 
                        ? `Wait ${forgotCooldown}s` 
                        : 'Send Reset Link'
                  }
                </button>
              </form>
          </div>
        </div>
      )}

      <style>{`
        .admin-login-page {
          background-color: #f0fdf4;
          background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .blur-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 1;
          opacity: 0.4;
          animation: float 12s infinite alternate ease-in-out;
          pointer-events: none;
        }
        
        .circle-1 {
          width: 350px;
          height: 350px;
          background: #bbf7d0;
          top: -100px;
          left: -100px;
        }

        .circle-2 {
          width: 400px;
          height: 400px;
          background: #86efac;
          bottom: -150px;
          right: -100px;
          animation-delay: -4s;
        }

        .circle-3 {
          width: 300px;
          height: 300px;
          background: #bbf7d0;
          top: 40%;
          left: 60%;
          animation-delay: -7s;
        }

        @keyframes float {
          0% { transform: translateY(0) scale(1); }
          100% { transform: translateY(30px) scale(1.1); }
        }

        .login-wrapper {
          max-width: 460px;
          width: 100%;
          position: relative;
          z-index: 2;
        }

        .login-card {
          width: 100%;
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.85);
          border-radius: var(--radius-2xl);
          border: 1px solid rgba(22, 163, 74, 0.25);
          box-shadow: 0 20px 40px -10px rgba(22, 163, 74, 0.1);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          padding: 3.5rem 2.5rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        .login-card:hover {
          border-color: rgba(22, 163, 74, 0.4);
          box-shadow: 0 25px 50px -12px rgba(22, 163, 74, 0.2);
        }

        .card-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .admin-title {
          font-family: var(--font-heading);
          color: #1f2937;
          font-weight: 800;
          font-size: 1.85rem;
          letter-spacing: -0.5px;
          margin: 0 0 0.5rem 0;
          line-height: 1.2;
        }

        .card-subtitle {
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.6;
          opacity: 0.9;
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.4rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          width: 100%;
        }

        .font-label-custom {
          color: #374151;
          font-weight: 650;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }

        .icon-badge {
          position: absolute;
          left: 7px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: linear-gradient(160deg, rgba(22, 163, 74, 0.14), rgba(22, 163, 74, 0.05));
          border: 1px solid rgba(22, 163, 74, 0.18);
          pointer-events: none;
          transition: background 0.25s ease, border-color 0.25s ease;
        }

        .input-field-icon {
          color: var(--primary);
          opacity: 0.9;
        }

        .custom-input-style {
          width: 100%;
          box-sizing: border-box;
          background: #ffffff;
          border: 1.5px solid rgba(22, 163, 74, 0.22);
          color: #1f2937;
          height: 50px;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: var(--radius-lg);
          transition: all 0.25s ease;
          margin: 0;
        }

        .custom-input-style::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .custom-input-style:focus {
          outline: none;
          border-color: var(--primary);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }
        
        .custom-input-style:focus ~ .icon-badge {
          background: linear-gradient(160deg, rgba(22, 163, 74, 0.22), rgba(22, 163, 74, 0.1));
          border-color: rgba(22, 163, 74, 0.32);
        }

        .padded-input {
          padding-left: 3.1rem;
        }

        .login-btn {
          width: 100%;
          box-sizing: border-box;
          padding: 0.9rem 1.25rem;
          font-size: 1.02rem;
          margin-top: 1.25rem;
          font-weight: 700;
          background: var(--primary);
          border: none;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: white;
        }

        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.75;
          cursor: not-allowed;
          transform: none;
        }

        .btn-icon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.18);
          flex-shrink: 0;
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #b91c1c;
          padding: 0.875rem 1rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.6;
        }

        .error-alert svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.9rem;
          color: var(--muted);
          border-top: 1px solid rgba(22, 163, 74, 0.15);
          padding-top: 1.25rem;
        }

        .auth-link {
          color: var(--primary);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: 0.25rem;
          transition: color 0.2s ease;
        }

        .auth-link:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }

        /* Forgot Password link row */
        .forgot-pwd-row {
          display: flex;
          justify-content: center;
          margin-top: -0.5rem;
        }

        .forgot-pwd-link {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.82rem;
          font-weight: 600;
          color: #16a34a;
          cursor: pointer;
          transition: color 0.2s ease;
          text-decoration: none;
        }
        .forgot-pwd-link:hover {
          color: #15803d;
          text-decoration: underline;
        }

        /* Reset success toast */
        .reset-success-toast {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(22, 163, 74, 0.08);
          border: 1px solid rgba(22, 163, 74, 0.3);
          color: #15803d;
          padding: 0.85rem 1rem;
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 1rem;
        }
        .reset-success-icon { flex-shrink: 0; color: #16a34a; }
        .reset-toast-dismiss {
          background: none; border: none; cursor: pointer;
          color: #16a34a; margin-left: auto; padding: 2px;
          display: flex; align-items: center; border-radius: 4px;
          transition: background 0.15s;
        }
        .reset-toast-dismiss:hover { background: rgba(22,163,74,0.12); }

        /* Forgot Password Modal */
        .fp-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .fp-modal {
          background: #ffffff;
          border-radius: 24px;
          padding: 2.5rem 2rem;
          max-width: 420px;
          width: 100%;
          position: relative;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(22, 163, 74, 0.15);
        }

        .fp-close-btn {
          position: absolute;
          top: 1.1rem;
          right: 1.1rem;
          background: #f1f5f9;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s;
        }
        .fp-close-btn:hover { background: #e2e8f0; color: #0f172a; }

        .fp-header {
          text-align: center;
          margin-bottom: 1.75rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        .fp-icon-ring {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05));
          border: 1.5px solid rgba(22,163,74,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .fp-mail-icon { color: #16a34a; }

        .fp-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #1f2937;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .fp-desc {
          font-size: 0.85rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
        }

        .fp-form { display: flex; flex-direction: column; gap: 1.25rem; }

        .fp-error {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.25);
          color: #b91c1c;
          padding: 0.75rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 500;
        }
        .fp-error svg { flex-shrink: 0; margin-top: 1px; }

        .fp-form-group { display: flex; flex-direction: column; gap: 0.5rem; }

        .fp-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .fp-input-wrap { position: relative; display: flex; align-items: center; }

        .fp-icon-badge {
          position: absolute; left: 7px; top: 50%; transform: translateY(-50%);
          width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px;
          background: linear-gradient(160deg, rgba(22,163,74,0.14), rgba(22,163,74,0.05));
          border: 1px solid rgba(22,163,74,0.18); pointer-events: none;
        }
        .fp-input-icon { color: #16a34a; opacity: 0.9; }

        .fp-input {
          width: 100%; box-sizing: border-box;
          background: #ffffff;
          border: 1.5px solid rgba(22,163,74,0.22);
          color: #1f2937;
          height: 48px;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 12px;
          padding-left: 2.9rem;
          transition: all 0.25s ease;
        }
        .fp-input::placeholder { color: #9ca3af; font-weight: 400; }
        .fp-input:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }

        .fp-submit-btn {
          width: 100%; padding: 0.85rem;
          font-size: 0.98rem; font-weight: 700;
          background: #16a34a; color: white;
          border: none; border-radius: 12px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(22,163,74,0.25);
          transition: all 0.25s ease;
        }
        .fp-submit-btn:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
        .fp-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }

        .fp-success-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .fp-success-msg {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          background: rgba(22,163,74,0.08);
          border: 1px solid rgba(22,163,74,0.25);
          color: #15803d;
          padding: 1rem;
          border-radius: 14px;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.5;
        }
        .fp-check-icon { flex-shrink: 0; margin-top: 1px; color: #16a34a; }
          box-shadow: 0 6px 20px rgba(22, 163, 74, 0.35);
          color: #ffffff;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease;
        }

        @media (max-width: 420px) {
          .login-card {
            padding: 2.5rem 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
