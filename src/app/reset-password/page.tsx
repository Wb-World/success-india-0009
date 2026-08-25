'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ShieldCheck, ShieldAlert, CheckCircle2 } from 'lucide-react';

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return 'Password must be at least 8 characters.';
  if (!/\d/.test(pwd)) return 'Password must contain at least one number.';
  if (!/[^a-zA-Z0-9]/.test(pwd)) return 'Password must contain at least one special character.';
  return null;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState(searchParams?.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const pwdError = validatePassword(password);
    if (pwdError) { setError(pwdError); return; }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) {
      setError('Invalid or expired reset link. Please request a new one.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => router.push('/login?reset=success'), 2000);
      } else {
        setError(data.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (success) {
    return (
      <div className="rp-page animate-fade-in">
        <div className="rp-blur-circle rp-circle-1" />
        <div className="rp-blur-circle rp-circle-2" />
        <div className="rp-wrapper">
          <div className="rp-card glass-card animate-scale-in" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div className="rp-icon-ring" style={{ margin: '0 auto 1.5rem' }}>
              <ShieldCheck size={32} className="rp-shield-icon" />
            </div>
            <h1 className="rp-title" style={{ marginBottom: '1rem' }}>Password Updated</h1>
            <p className="rp-subtitle">Your password has been changed successfully.</p>
            <p className="rp-subtitle" style={{ marginTop: '0.5rem' }}>Redirecting to login...</p>
          </div>
        </div>
        <style>{`
          .rp-page {
            min-height: 100vh;
            background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4rem 1.5rem;
            position: relative;
            overflow: hidden;
          }
          .rp-blur-circle {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            z-index: 1;
            opacity: 0.4;
            animation: rpFloat 12s infinite alternate ease-in-out;
            pointer-events: none;
          }
          .rp-circle-1 { width: 350px; height: 350px; background: #bbf7d0; top: -100px; left: -100px; }
          .rp-circle-2 { width: 400px; height: 400px; background: #86efac; bottom: -150px; right: -100px; animation-delay: -4s; }
          @keyframes rpFloat { 0%, 100% { transform: translateY(0) scale(1); } 100% { transform: translateY(30px) scale(1.1); } }
          .rp-wrapper { max-width: 460px; width: 100%; position: relative; z-index: 2; }
          .rp-card {
            width: 100%; box-sizing: border-box;
            background: rgba(255,255,255,0.88);
            border-radius: 20px;
            border: 1px solid rgba(22,163,74,0.25);
            box-shadow: 0 20px 40px -10px rgba(22,163,74,0.1);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            padding: 3.5rem 2.5rem;
          }
          .rp-icon-ring {
            width: 64px; height: 64px; border-radius: 50%;
            background: linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05));
            border: 1.5px solid rgba(22,163,74,0.2);
            display: flex; align-items: center; justify-content: center;
          }
          .rp-shield-icon { color: #16a34a; }
          .rp-title { font-size: 1.75rem; font-weight: 800; color: #1f2937; margin: 0; letter-spacing: -0.5px; line-height: 1.2; }
          .rp-subtitle { font-size: 0.875rem; color: #4b5563; margin: 0; line-height: 1.6; }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
          .animate-scale-in { animation: scaleIn 0.35s ease forwards; }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="rp-page animate-fade-in">
      <div className="rp-blur-circle rp-circle-1" />
      <div className="rp-blur-circle rp-circle-2" />

      <div className="rp-wrapper">
        <div className="rp-card glass-card animate-scale-in">
          <div className="rp-card-header">
            <div className="rp-icon-ring">
              <ShieldCheck size={26} className="rp-shield-icon" />
            </div>
            <h1 className="rp-title">Set New Password</h1>
            <p className="rp-subtitle">Choose a strong new password for your account.</p>
          </div>

          {error && (
            <div className="rp-alert rp-alert-error animate-shake">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="rp-form">
            <div className="rp-form-group">
              <label className="rp-label">New Password</label>
              <div className="rp-input-wrap">
                <div className="rp-icon-badge">
                  <Lock size={15} className="rp-input-icon" />
                </div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 number, 1 special char"
                  className="rp-input"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rp-eye-btn"
                  onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <div className="rp-hints">
                <span className={`rp-hint ${password.length >= 8 ? 'ok' : ''}`}>
                  <CheckCircle2 size={12} /> 8+ characters
                </span>
                <span className={`rp-hint ${/\d/.test(password) ? 'ok' : ''}`}>
                  <CheckCircle2 size={12} /> 1 number
                </span>
                <span className={`rp-hint ${/[^a-zA-Z0-9]/.test(password) ? 'ok' : ''}`}>
                  <CheckCircle2 size={12} /> 1 special character
                </span>
              </div>
            </div>

            <div className="rp-form-group">
              <label className="rp-label">Confirm Password</label>
              <div className="rp-input-wrap">
                <div className="rp-icon-badge">
                  <Lock size={15} className="rp-input-icon" />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  className="rp-input"
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="rp-eye-btn"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <span className="rp-mismatch">Passwords do not match</span>
              )}
            </div>

            <button
              type="submit"
              className="rp-submit-btn"
              disabled={loading}
              id="rp-submit-btn"
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>

          <div className="rp-back-link-wrap">
            <a href="/login" className="rp-back-link">Back to Login</a>
          </div>
        </div>
      </div>

      <style>{`
        .rp-page {
          min-height: 100vh;
          background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.5rem;
          position: relative;
          overflow: hidden;
        }
        .rp-blur-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 1;
          opacity: 0.4;
          animation: rpFloat 12s infinite alternate ease-in-out;
          pointer-events: none;
        }
        .rp-circle-1 { width: 350px; height: 350px; background: #bbf7d0; top: -100px; left: -100px; }
        .rp-circle-2 { width: 400px; height: 400px; background: #86efac; bottom: -150px; right: -100px; animation-delay: -4s; }
        @keyframes rpFloat { 0%, 100% { transform: translateY(0) scale(1); } 100% { transform: translateY(30px) scale(1.1); } }
        .rp-wrapper { max-width: 460px; width: 100%; position: relative; z-index: 2; }
        .rp-card {
          width: 100%; box-sizing: border-box;
          background: rgba(255,255,255,0.88);
          border-radius: 20px;
          border: 1px solid rgba(22,163,74,0.25);
          box-shadow: 0 20px 40px -10px rgba(22,163,74,0.1);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          padding: 3.5rem 2.5rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        .rp-card:hover { border-color: rgba(22,163,74,0.4); box-shadow: 0 25px 50px -12px rgba(22,163,74,0.2); }
        .rp-card-header { text-align: center; margin-bottom: 2rem; display: flex; flex-direction: column; align-items: center; gap: 0.85rem; }
        .rp-icon-ring {
          width: 64px; height: 64px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05));
          border: 1.5px solid rgba(22,163,74,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .rp-shield-icon { color: #16a34a; }
        .rp-title { font-size: 1.75rem; font-weight: 800; color: #1f2937; margin: 0; letter-spacing: -0.5px; line-height: 1.2; }
        .rp-subtitle { font-size: 0.875rem; color: #4b5563; margin: 0; line-height: 1.6; }
        .rp-alert {
          display: flex; align-items: flex-start; gap: 0.6rem;
          padding: 0.875rem 1rem; border-radius: 12px;
          font-size: 0.875rem; font-weight: 500; line-height: 1.5; margin-bottom: 1.5rem;
        }
        .rp-alert-error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #b91c1c; }
        .rp-alert svg { flex-shrink: 0; margin-top: 1px; }
        .rp-form { display: flex; flex-direction: column; gap: 1.4rem; }
        .rp-form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .rp-label { font-size: 0.8rem; font-weight: 650; color: #374151; text-transform: uppercase; letter-spacing: 1px; }
        .rp-input-wrap { position: relative; display: flex; align-items: center; }
        .rp-icon-badge {
          position: absolute; left: 7px; top: 50%; transform: translateY(-50%);
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          border-radius: 9px;
          background: linear-gradient(160deg, rgba(22,163,74,0.14), rgba(22,163,74,0.05));
          border: 1px solid rgba(22,163,74,0.18); pointer-events: none;
        }
        .rp-input-icon { color: #16a34a; opacity: 0.9; }
        .rp-input {
          width: 100%; box-sizing: border-box; background: #ffffff;
          border: 1.5px solid rgba(22,163,74,0.22); color: #1f2937;
          height: 50px; font-size: 0.95rem; font-weight: 500; border-radius: 12px;
          padding-left: 3.1rem; padding-right: 2.85rem; transition: all 0.25s ease;
        }
        .rp-input::placeholder { color: #9ca3af; font-weight: 400; }
        .rp-input:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
        .rp-eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          color: #6b7280; background: none; border: none; padding: 4px;
          cursor: pointer; display: flex; align-items: center; border-radius: 7px; transition: all 0.2s ease; z-index: 10;
        }
        .rp-eye-btn:hover { color: #16a34a; background: rgba(22,163,74,0.08); }
        .rp-hints { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.25rem; }
        .rp-hint { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.75rem; color: #9ca3af; font-weight: 500; transition: color 0.2s ease; }
        .rp-hint.ok { color: #16a34a; }
        .rp-hint svg { flex-shrink: 0; }
        .rp-mismatch { font-size: 0.78rem; color: #b91c1c; font-weight: 500; }
        .rp-submit-btn {
          width: 100%; box-sizing: border-box; padding: 0.9rem 1.25rem;
          font-size: 1.02rem; margin-top: 0.5rem; font-weight: 700;
          background: #16a34a; border: none; border-radius: 12px;
          box-shadow: 0 4px 15px rgba(22,163,74,0.25); color: white; cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .rp-submit-btn:hover:not(:disabled) { background: #15803d; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(22,163,74,0.35); }
        .rp-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        .rp-back-link-wrap { text-align: center; margin-top: 1.5rem; }
        .rp-back-link { color: #16a34a; font-weight: 600; font-size: 0.9rem; text-decoration: none; transition: color 0.2s; }
        .rp-back-link:hover { color: #15803d; text-decoration: underline; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s ease; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scaleIn 0.35s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
      `}</style>
    </div>
  );
}
