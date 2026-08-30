'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  User,
  Lock,
  ShieldAlert,
  ArrowRight,
  Key,
  Mail,
  X,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

type FpStep = 'credentials' | 'otp' | 'newPassword';

function LoginContent() {
  const router = useRouter();
  const searchParamsObj = useSearchParams();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpStep, setFpStep] = useState<FpStep>('credentials');
  const [fpMemberId, setFpMemberId] = useState('');
  const [fpEmail, setFpEmail] = useState('');
  const [fpMaskedEmail, setFpMaskedEmail] = useState('');
  const [fpSessionId, setFpSessionId] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpResetToken, setFpResetToken] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpShowConfirm, setFpShowConfirm] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState(false);
  const [fpCooldown, setFpCooldown] = useState(0);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sessionActive = sessionStorage.getItem('session_active');
    if (!sessionActive) localStorage.removeItem('user');
    const params = searchParamsObj;
    if (params?.get('reset') === 'success') setResetSuccess(true);
    if (params?.get('forgot') === '1') setShowForgotModal(true);
  }, [searchParamsObj]);

  useEffect(() => {
    if (fpCooldown <= 0) return;
    const timer = setInterval(() => setFpCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [fpCooldown]);

  const resetForgotModal = () => {
    setFpStep('credentials');
    setFpMemberId('');
    setFpEmail('');
    setFpMaskedEmail('');
    setFpSessionId('');
    setFpOtp('');
    setFpResetToken('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpShowPwd(false);
    setFpShowConfirm(false);
    setFpLoading(false);
    setFpError('');
    setFpSuccess(false);
    setFpCooldown(0);
  };

  // Normal login submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.user.role === 'admin') {
          setError('Admins must log in through the admin portal');
          setLoading(false);
          return;
        }
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('session_active', '1');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-change'));
          const cbParams = new URLSearchParams(window.location.search);
          const cb = cbParams.get('callbackUrl') || '';
          router.push(cb && cb.startsWith('/') && !cb.startsWith('//') ? cb : '/');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || 'Invalid Member ID/Phone or Password');
      }
    } catch {
      setError('A connection error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Gmail OTP by Member ID & Mail ID
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');

    const cleanMemberId = fpMemberId.trim();
    const cleanEmail = fpEmail.trim();

    if (!cleanMemberId) {
      setFpError('Please enter your Member ID.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setFpError('Please enter your registered Mail ID (Gmail).');
      return;
    }

    if (fpCooldown > 0) return;
    setFpLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: cleanMemberId,
          email: cleanEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFpMaskedEmail(data.maskedEmail || cleanEmail);
        setFpSessionId(data.sessionId || '');
        setFpStep('otp');
        setFpCooldown(60);
        setFpError('');
        // Dev/demo mode: pre-fill OTP if email delivery not configured
        if (data.simulated && data.debugOtp) {
          setFpOtp(data.debugOtp);
        }
      } else {
        setFpError(data.error || 'Failed to dispatch Gmail OTP. Please check your Member ID & Mail ID.');
      }
    } catch (err: any) {
      console.error('[Forgot Password Error]', err);
      setFpError('Network error. Please check your internet connection.');
    } finally {
      setFpLoading(false);
    }
  };

  // Resend Gmail OTP
  const handleResendOtp = async () => {
    if (fpCooldown > 0 || !fpMemberId.trim() || !fpEmail.trim()) return;
    setFpError('');
    setFpLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: fpMemberId.trim(),
          email: fpEmail.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFpSessionId(data.sessionId || '');
        setFpCooldown(60);
        setFpOtp('');
        setFpError('');
      } else {
        setFpError(data.error || 'Failed to resend OTP.');
      }
    } catch {
      setFpError('Failed to resend OTP. Please try again.');
    } finally {
      setFpLoading(false);
    }
  };

  // Step 2: Verify Gmail OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');

    if (!fpOtp.trim()) {
      setFpError('Please enter the 6-digit OTP received on your Gmail.');
      return;
    }

    if (!fpSessionId) {
      setFpError('Verification session expired. Please request OTP again.');
      setFpStep('credentials');
      return;
    }

    setFpLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: fpSessionId,
          otp: fpOtp.trim(),
          membershipId: fpMemberId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFpResetToken(data.resetToken);
        setFpStep('newPassword');
        setFpError('');
      } else {
        setFpError(data.error || 'Incorrect OTP code. Please check your Gmail and try again.');
      }
    } catch (err: any) {
      console.error('[OTP Verify Error]', err);
      setFpError('An unexpected error occurred during OTP verification.');
    } finally {
      setFpLoading(false);
    }
  };

  // Step 3: Update Password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');

    if (fpNewPassword.length < 8) {
      setFpError('Password must be at least 8 characters long.');
      return;
    }
    if (fpNewPassword !== fpConfirmPassword) {
      setFpError('Passwords do not match.');
      return;
    }

    setFpLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          membershipId: fpMemberId.trim(),
          newPassword: fpNewPassword,
          token: fpResetToken,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFpSuccess(true);
        setUsername(fpMemberId.trim()); // Pre-fill login username field with Member ID
        setTimeout(() => {
          setShowForgotModal(false);
          resetForgotModal();
          setResetSuccess(true);
        }, 2200);
      } else {
        setFpError(data.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setFpError('An unexpected error occurred. Please try again.');
    } finally {
      setFpLoading(false);
    }
  };

  return (
    <div className="admin-login-page animate-fade-in">
      <div className="blur-circle circle-1"></div>
      <div className="blur-circle circle-2"></div>
      <div className="blur-circle circle-3"></div>

      <div className="login-wrapper">
        <div className="login-card glass-card animate-scale-in">
          <div className="card-header">
            <h1 className="admin-title">Member Login</h1>
            <p className="card-subtitle">Sign in with your Member ID to book tickets and access your profile.</p>
          </div>

          {resetSuccess && (
            <div className="reset-success-toast animate-scale-in">
              <CheckCircle2 size={18} className="reset-success-icon" />
              <span>Password updated successfully! Please log in with your new password.</span>
              <button
                className="reset-toast-dismiss"
                onClick={() => setResetSuccess(false)}
                aria-label="Dismiss"
              >
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
            <div className="form-group">
              <label className="form-label font-label-custom">Member ID / Phone</label>
              <div className="input-with-icon">
                <div className="icon-badge">
                  <User size={15} className="input-field-icon" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Member ID or Phone Number"
                  className="form-control padded-input custom-input-style"
                  required
                  id="login-member-id"
                />
              </div>
            </div>
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
                  id="login-password"
                />
              </div>
            </div>
            <div className="forgot-pwd-row">
              <button
                type="button"
                className="forgot-pwd-link"
                onClick={() => {
                  resetForgotModal();
                  setShowForgotModal(true);
                }}
                id="forgot-password-btn"
              >
                Forgot Password?
              </button>
            </div>
            <button
              type="submit"
              className="btn btn-primary login-btn hover-glow"
              disabled={loading}
              id="login-submit-btn"
            >
              <span className="btn-icon-badge">
                <Key size={14} />
              </span>
              <span>{loading ? 'Verifying...' : 'Login'}</span>
            </button>
            <div className="auth-footer">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="auth-link">
                Sign Up <ArrowRight size={14} />
              </Link>
            </div>
          </form>
        </div>
      </div>

      {showForgotModal && (
        <div
          className="fp-overlay"
          onClick={() => {
            setShowForgotModal(false);
            resetForgotModal();
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Forgot password"
        >
          <div className="fp-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button
              className="fp-close-btn"
              onClick={() => {
                setShowForgotModal(false);
                resetForgotModal();
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="fp-steps">
              <div className={`fp-step-dot ${fpStep === 'credentials' ? 'active' : 'done'}`}>1</div>
              <div className="fp-step-line"></div>
              <div
                className={`fp-step-dot ${
                  fpStep === 'otp' ? 'active' : fpStep === 'newPassword' ? 'done' : ''
                }`}
              >
                2
              </div>
              <div className="fp-step-line"></div>
              <div className={`fp-step-dot ${fpStep === 'newPassword' ? 'active' : ''}`}>3</div>
            </div>

            {/* Step 1: Ask for Member ID & Mail ID */}
            {fpStep === 'credentials' && (
              <>
                <div className="fp-header">
                  <div className="fp-icon-ring">
                    <Mail size={22} className="fp-phone-icon" />
                  </div>
                  <h2 className="fp-title">Forgot Password?</h2>
                  <p className="fp-desc">
                    Enter your Member ID and Mail ID to receive a 6-digit verification OTP on your Gmail.
                  </p>
                </div>
                <form onSubmit={handleSendOtp} className="fp-form">
                  {fpError && (
                    <div className="fp-error">
                      <ShieldAlert size={14} />
                      <span>{fpError}</span>
                    </div>
                  )}

                  <div className="fp-form-group">
                    <label className="fp-label">Member ID</label>
                    <div className="fp-input-wrap">
                      <div className="fp-icon-badge">
                        <User size={14} className="fp-input-icon" />
                      </div>
                      <input
                        type="text"
                        value={fpMemberId}
                        onChange={(e) => setFpMemberId(e.target.value)}
                        placeholder="Enter your Member ID"
                        className="fp-input"
                        required
                        id="fp-membership-id-input"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="fp-form-group">
                    <label className="fp-label">Registered Mail ID (Gmail)</label>
                    <div className="fp-input-wrap">
                      <div className="fp-icon-badge">
                        <Mail size={14} className="fp-input-icon" />
                      </div>
                      <input
                        type="email"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        placeholder="Enter your Gmail address"
                        className="fp-input"
                        required
                        id="fp-email-input"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="fp-submit-btn"
                    disabled={fpLoading}
                    id="fp-send-otp-btn"
                  >
                    {fpLoading ? 'Sending Gmail OTP…' : 'Send OTP to Gmail'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Ask for 6-Digit Gmail OTP */}
            {fpStep === 'otp' && (
              <>
                <div className="fp-header">
                  <div className="fp-icon-ring fp-icon-ring-otp">
                    <Mail size={22} className="fp-phone-icon-blue" />
                  </div>
                  <h2 className="fp-title">Enter Gmail OTP</h2>
                  <p className="fp-desc">
                    A 6-digit OTP code has been dispatched to your Gmail ending in{' '}
                    <strong style={{ color: '#16a34a' }}>{fpMaskedEmail}</strong>.
                  </p>
                </div>
                <form onSubmit={handleVerifyOtp} className="fp-form">
                  {fpError && (
                    <div className="fp-error">
                      <ShieldAlert size={14} />
                      <span>{fpError}</span>
                    </div>
                  )}
                  <div className="fp-form-group">
                    <label className="fp-label">Enter 6-Digit OTP Code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="• • • • • •"
                      className="fp-otp-input"
                      required
                      id="fp-otp-input"
                      autoFocus
                      autoComplete="one-time-code"
                    />
                  </div>
                  <button
                    type="submit"
                    className="fp-submit-btn"
                    disabled={fpLoading || fpOtp.length < 6}
                    id="fp-verify-otp-btn"
                  >
                    {fpLoading ? 'Verifying OTP…' : 'Verify OTP'}
                  </button>
                  <div className="fp-resend-row">
                    <span className="fp-resend-label">Didn&apos;t receive email?</span>
                    <button
                      type="button"
                      className={`fp-resend-btn${fpCooldown > 0 ? ' disabled' : ''}`}
                      onClick={handleResendOtp}
                      disabled={fpCooldown > 0 || fpLoading}
                      id="fp-resend-btn"
                    >
                      <RefreshCw size={13} />
                      {fpCooldown > 0 ? `Resend in ${fpCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* Step 3: Ask for New & Confirm Password */}
            {fpStep === 'newPassword' && !fpSuccess && (
              <>
                <div className="fp-header">
                  <div className="fp-icon-ring fp-icon-ring-pwd">
                    <ShieldCheck size={22} className="fp-shield-icon" />
                  </div>
                  <h2 className="fp-title">Reset Password</h2>
                  <p className="fp-desc">
                    Gmail OTP verified! Enter a new password for Membership ID: <strong>{fpMemberId}</strong>.
                  </p>
                </div>
                <form onSubmit={handleSetPassword} className="fp-form">
                  {fpError && (
                    <div className="fp-error">
                      <ShieldAlert size={14} />
                      <span>{fpError}</span>
                    </div>
                  )}
                  <div className="fp-form-group">
                    <label className="fp-label">New Password</label>
                    <div className="fp-input-wrap">
                      <div className="fp-icon-badge">
                        <Lock size={14} className="fp-input-icon" />
                      </div>
                      <input
                        type={fpShowPwd ? 'text' : 'password'}
                        value={fpNewPassword}
                        onChange={(e) => setFpNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        className="fp-input fp-pwd-input"
                        required
                        id="fp-new-password-input"
                        autoFocus
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="fp-eye-btn"
                        onClick={() => setFpShowPwd((v) => !v)}
                        aria-label="Toggle password view"
                      >
                        {fpShowPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <div className="fp-pwd-hints">
                      <span className={`fp-pwd-hint${fpNewPassword.length >= 8 ? ' ok' : ''}`}>
                        <CheckCircle2 size={11} /> 8+ chars
                      </span>
                    </div>
                  </div>
                  <div className="fp-form-group">
                    <label className="fp-label">Confirm Password</label>
                    <div className="fp-input-wrap">
                      <div className="fp-icon-badge">
                        <Lock size={14} className="fp-input-icon" />
                      </div>
                      <input
                        type={fpShowConfirm ? 'text' : 'password'}
                        value={fpConfirmPassword}
                        onChange={(e) => setFpConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        className="fp-input fp-pwd-input"
                        required
                        id="fp-confirm-password-input"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="fp-eye-btn"
                        onClick={() => setFpShowConfirm((v) => !v)}
                        aria-label="Toggle confirm password view"
                      >
                        {fpShowConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {fpConfirmPassword && fpNewPassword !== fpConfirmPassword && (
                      <span className="fp-mismatch">Passwords do not match</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="fp-submit-btn"
                    disabled={fpLoading}
                    id="fp-set-password-btn"
                  >
                    {fpLoading ? 'Updating Password…' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            {/* Success state with animation */}
            {fpSuccess && (
              <div className="fp-success-container animate-scale-in">
                <div className="success-pulse-ring">
                  <div className="fp-success-icon-wrap">
                    <CheckCircle2 size={46} className="fp-success-shield" />
                  </div>
                </div>
                <h2 className="fp-title success-anim-title" style={{ textAlign: 'center', color: '#15803d' }}>
                  Password Reset Successfully!
                </h2>
                <p className="fp-desc" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
                  Your password has been changed. Pre-filling your Membership ID for login...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .admin-login-page { background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 4rem 1.5rem; position: relative; overflow: hidden; }
        .blur-circle { position: absolute; border-radius: 50%; filter: blur(120px); z-index: 1; opacity: 0.4; animation: float 12s infinite alternate ease-in-out; pointer-events: none; }
        .circle-1 { width: 350px; height: 350px; background: #bbf7d0; top: -100px; left: -100px; }
        .circle-2 { width: 400px; height: 400px; background: #86efac; bottom: -150px; right: -100px; animation-delay: -4s; }
        .circle-3 { width: 300px; height: 300px; background: #bbf7d0; top: 40%; left: 60%; animation-delay: -7s; }
        @keyframes float { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(30px) scale(1.1); } }
        .login-wrapper { max-width: 460px; width: 100%; position: relative; z-index: 2; }
        .login-card { width: 100%; box-sizing: border-box; background: rgba(255,255,255,0.85); border-radius: var(--radius-2xl, 24px); border: 1px solid rgba(22,163,74,0.25); box-shadow: 0 20px 40px -10px rgba(22,163,74,0.1); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px); padding: 3.5rem 2.5rem; transition: border-color 0.3s, box-shadow 0.3s; }
        .login-card:hover { border-color: rgba(22,163,74,0.4); box-shadow: 0 25px 50px -12px rgba(22,163,74,0.2); }
        .card-header { text-align: center; margin-bottom: 2.5rem; }
        .admin-title { font-family: var(--font-heading), sans-serif; color: #1f2937; font-weight: 800; font-size: 1.85rem; letter-spacing: -0.5px; margin: 0 0 0.5rem 0; line-height: 1.2; }
        .card-subtitle { font-size: 0.875rem; color: #4b5563; line-height: 1.6; opacity: 0.9; margin: 0; }
        .login-form { display: flex; flex-direction: column; gap: 1.4rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.55rem; width: 100%; }
        .font-label-custom { color: #374151; font-weight: 650; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .input-with-icon { position: relative; display: flex; align-items: center; width: 100%; }
        .icon-badge { position: absolute; left: 7px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 9px; background: linear-gradient(160deg, rgba(22,163,74,0.14), rgba(22,163,74,0.05)); border: 1px solid rgba(22,163,74,0.18); pointer-events: none; transition: background 0.25s ease, border-color 0.25s ease; }
        .input-field-icon { color: #16a34a; opacity: 0.9; }
        .custom-input-style { width: 100%; box-sizing: border-box; background: #ffffff; border: 1.5px solid rgba(22,163,74,0.22); color: #1f2937; height: 50px; font-size: 0.95rem; font-weight: 500; border-radius: 12px; transition: all 0.25s ease; margin: 0; }
        .custom-input-style::placeholder { color: #9ca3af; font-weight: 400; }
        .custom-input-style:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
        .padded-input { padding-left: 3.1rem; }
        .login-btn { width: 100%; box-sizing: border-box; padding: 0.9rem 1.25rem; font-size: 1.02rem; margin-top: 1.25rem; font-weight: 700; background: #16a34a; border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(22,163,74,0.25); display: flex; align-items: center; justify-content: center; gap: 0.65rem; cursor: pointer; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); color: white; }
        .login-btn:hover:not(:disabled) { background: #15803d; transform: translateY(-2px); box-shadow: 0 10px 25px rgba(16,185,129,0.4); }
        .login-btn:disabled { opacity: 0.75; cursor: not-allowed; transform: none; }
        .btn-icon-badge { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 7px; background: rgba(255,255,255,0.18); flex-shrink: 0; }
        .error-alert { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #b91c1c; padding: 0.875rem 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; line-height: 1.4; margin-bottom: 1.5rem; display: flex; align-items: flex-start; gap: 0.6rem; }
        .error-alert svg { flex-shrink: 0; margin-top: 1px; }
        .auth-footer { text-align: center; margin-top: 1.75rem; font-size: 0.9rem; color: #6b7280; border-top: 1px solid rgba(22,163,74,0.15); padding-top: 1.25rem; }
        .auth-link { color: #16a34a; font-weight: 600; display: inline-flex; align-items: center; gap: 0.25rem; margin-left: 0.25rem; transition: color 0.2s ease; }
        .auth-link:hover { color: #15803d; text-decoration: underline; }
        .forgot-pwd-row { display: flex; justify-content: center; margin-top: -0.5rem; }
        .forgot-pwd-link { background: none; border: none; padding: 0; font-size: 0.82rem; font-weight: 600; color: #16a34a; cursor: pointer; transition: color 0.2s ease; text-decoration: none; }
        .forgot-pwd-link:hover { color: #15803d; text-decoration: underline; }
        .reset-success-toast { display: flex; align-items: center; gap: 0.75rem; background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.3); color: #15803d; padding: 0.85rem 1rem; border-radius: 12px; font-size: 0.875rem; font-weight: 500; line-height: 1.4; margin-bottom: 1rem; }
        .reset-success-icon { flex-shrink: 0; color: #16a34a; }
        .reset-toast-dismiss { background: none; border: none; cursor: pointer; color: #16a34a; margin-left: auto; padding: 2px; display: flex; align-items: center; border-radius: 4px; transition: background 0.15s; }
        .reset-toast-dismiss:hover { background: rgba(22,163,74,0.12); }
        .fp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .fp-modal { background: #ffffff; border-radius: 24px; padding: 2.25rem 2rem 2rem; max-width: 420px; width: 100%; position: relative; box-shadow: 0 25px 60px rgba(0,0,0,0.15); border: 1px solid rgba(22,163,74,0.15); }
        .fp-close-btn { position: absolute; top: 1.1rem; right: 1.1rem; background: #f1f5f9; border: none; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; transition: all 0.2s; z-index: 1; }
        .fp-close-btn:hover { background: #e2e8f0; color: #0f172a; }
        .fp-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 1.5rem; }
        .fp-step-dot { width: 28px; height: 28px; border-radius: 50%; background: #e5e7eb; color: #9ca3af; font-size: 0.78rem; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: all 0.3s ease; flex-shrink: 0; }
        .fp-step-dot.active { background: #16a34a; color: white; box-shadow: 0 0 0 4px rgba(22,163,74,0.18); }
        .fp-step-dot.done { background: #bbf7d0; color: #15803d; }
        .fp-step-line { flex: 1; height: 2px; background: #e5e7eb; max-width: 56px; margin: 0 4px; }
        .fp-header { text-align: center; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; gap: 0.65rem; }
        .fp-icon-ring { width: 54px; height: 54px; border-radius: 50%; background: linear-gradient(135deg, rgba(22,163,74,0.15), rgba(22,163,74,0.05)); border: 1.5px solid rgba(22,163,74,0.2); display: flex; align-items: center; justify-content: center; }
        .fp-icon-ring-otp { background: linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05)); border-color: rgba(59,130,246,0.2); }
        .fp-icon-ring-pwd { background: linear-gradient(135deg, rgba(22,163,74,0.2), rgba(22,163,74,0.08)); border-color: rgba(22,163,74,0.3); }
        .fp-phone-icon { color: #16a34a; }
        .fp-phone-icon-blue { color: #3b82f6; }
        .fp-shield-icon { color: #16a34a; }
        .fp-title { font-size: 1.3rem; font-weight: 800; color: #1f2937; margin: 0; letter-spacing: -0.3px; }
        .fp-desc { font-size: 0.83rem; color: #6b7280; margin: 0; line-height: 1.6; }
        .fp-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .fp-error { display: flex; align-items: flex-start; gap: 0.5rem; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.25); color: #b91c1c; padding: 0.7rem 0.85rem; border-radius: 10px; font-size: 0.82rem; font-weight: 500; }
        .fp-error svg { flex-shrink: 0; margin-top: 1px; }
        .fp-form-group { display: flex; flex-direction: column; gap: 0.45rem; }
        .fp-label { font-size: 0.76rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.8px; }
        .fp-input-wrap { position: relative; display: flex; align-items: center; }
        .fp-icon-badge { position: absolute; left: 7px; top: 50%; transform: translateY(-50%); width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 8px; background: linear-gradient(160deg, rgba(22,163,74,0.14), rgba(22,163,74,0.05)); border: 1px solid rgba(22,163,74,0.18); pointer-events: none; }
        .fp-input-icon { color: #16a34a; opacity: 0.9; }
        .fp-input { width: 100%; box-sizing: border-box; background: #ffffff; border: 1.5px solid rgba(22,163,74,0.22); color: #1f2937; height: 48px; font-size: 0.95rem; font-weight: 500; border-radius: 12px; padding-left: 2.85rem; transition: all 0.25s ease; }
        .fp-input::placeholder { color: #9ca3af; font-weight: 400; }
        .fp-input:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,0.15); }
        .fp-pwd-input { padding-right: 2.5rem; }
        .fp-otp-input { width: 100%; box-sizing: border-box; background: #f8fafc; border: 2px solid rgba(22,163,74,0.3); color: #1f2937; height: 64px; font-size: 2.2rem; font-weight: 800; border-radius: 14px; text-align: center; letter-spacing: 0.6rem; transition: all 0.25s ease; }
        .fp-otp-input::placeholder { color: #d1d5db; font-weight: 400; letter-spacing: 0.4rem; font-size: 1.4rem; }
        .fp-otp-input:focus { outline: none; border-color: #16a34a; box-shadow: 0 0 0 4px rgba(22,163,74,0.15); background: #fff; }
        .fp-eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #6b7280; background: none; border: none; padding: 4px; cursor: pointer; display: flex; align-items: center; border-radius: 6px; transition: all 0.2s; }
        .fp-eye-btn:hover { color: #16a34a; background: rgba(22,163,74,0.08); }
        .fp-pwd-hints { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-top: 0.2rem; }
        .fp-pwd-hint { display: inline-flex; align-items: center; gap: 0.2rem; font-size: 0.72rem; color: #9ca3af; font-weight: 500; transition: color 0.2s; }
        .fp-pwd-hint.ok { color: #16a34a; }
        .fp-mismatch { font-size: 0.76rem; color: #b91c1c; font-weight: 500; margin-top: 0.15rem; }
        .fp-resend-row { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.8rem; margin-top: -0.25rem; }
        .fp-resend-label { color: #6b7280; }
        .fp-resend-btn { display: inline-flex; align-items: center; gap: 0.3rem; background: none; border: none; cursor: pointer; color: #16a34a; font-weight: 600; font-size: 0.8rem; padding: 3px 6px; border-radius: 6px; transition: all 0.2s; }
        .fp-resend-btn:hover:not(:disabled) { background: rgba(22,163,74,0.08); }
        .fp-resend-btn.disabled, .fp-resend-btn:disabled { color: #9ca3af; cursor: not-allowed; }
        .fp-submit-btn { width: 100%; padding: 0.85rem; font-size: 0.98rem; font-weight: 700; background: #16a34a; color: white; border: none; border-radius: 12px; cursor: pointer; box-shadow: 0 4px 15px rgba(22,163,74,0.25); transition: all 0.25s ease; margin-top: 0.25rem; }
        .fp-submit-btn:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,0.35); }
        .fp-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
        
        .fp-success-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 1.5rem 0 1rem; }
        .success-pulse-ring { position: relative; display: flex; align-items: center; justify-content: center; width: 84px; height: 84px; border-radius: 50%; background: rgba(22, 163, 74, 0.1); animation: pulseGlow 1.8s infinite ease-in-out; }
        .fp-success-icon-wrap { width: 68px; height: 68px; border-radius: 50%; background: linear-gradient(135deg, #22c55e, #15803d); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(22, 163, 74, 0.35); animation: popScale 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .fp-success-shield { color: #ffffff; }
        .success-anim-title { animation: fadeIn 0.4s ease forwards; }

        @keyframes popScale { 0% { transform: scale(0.4); opacity: 0; } 80% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes pulseGlow { 0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.3); } 70% { box-shadow: 0 0 0 18px rgba(22, 163, 74, 0); } 100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); } }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.4s ease; }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-scale-in { animation: scaleIn 0.35s ease forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease forwards; }
        @media (max-width: 420px) { .login-card { padding: 2.5rem 1.5rem; } .fp-modal { padding: 2rem 1.5rem 1.5rem; } }
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
