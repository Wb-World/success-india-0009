'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Phone, Lock, CheckCircle2, ShieldAlert, ArrowRight, UserPlus, Eye, EyeOff } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    memberId: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { memberId, email, phone, password, confirmPassword } = formData;
    const cleanMemberId = memberId.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    // Front-end validations
    if (!cleanMemberId || !cleanEmail || !cleanPhone || !password || !confirmPassword) {
      setError('All fields are required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (cleanPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: cleanMemberId,
          email: cleanEmail,
          phone: cleanPhone,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Account registered successfully!');
        
        // Save user session in localStorage to auto-login
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          sessionStorage.setItem('session_active', '1');
          window.dispatchEvent(new Event('auth-change'));
        }

        setTimeout(() => {
          const searchParams = new URLSearchParams(window.location.search);
          const cb = searchParams.get('callbackUrl') || '';
          if (cb && cb.startsWith('/') && !cb.startsWith('//')) {
            router.push(cb);
          } else {
            router.push('/');
          }
        }, 1500);
      } else {
        setError(data.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setError('A network error occurred. Please check your internet connection.');
    } finally {
      setLoading(false);
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
            <h1 className="admin-title">Member Registration</h1>
            <p className="card-subtitle">Create your account with your Member ID to book seats and access events.</p>
          </div>

          {success ? (
            <div className="success-content animate-scale-in">
              <CheckCircle2 size={56} className="success-icon" />
              <h3 className="success-heading">Registration Successful</h3>
              <p className="success-message">{success}</p>
              <p className="redirect-text">Redirecting you to the portal...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="error-alert animate-shake">
                  <ShieldAlert size={16} /> <span>{error}</span>
                </div>
              )}

              {/* Member ID (Username mapped to membership_id in DB) */}
              <div className="form-group">
                <label className="form-label font-label-custom">Member ID</label>
                <div className="input-with-icon">
                  <div className="icon-badge">
                    <User size={15} className="input-field-icon" />
                  </div>
                  <input
                    type="text"
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                    placeholder="Enter your Member ID"
                    className="form-control padded-input custom-input-style"
                    required
                    id="signup-member-id"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email ID */}
              <div className="form-group">
                <label className="form-label font-label-custom">Email ID</label>
                <div className="input-with-icon">
                  <div className="icon-badge">
                    <Mail size={15} className="input-field-icon" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter your Email ID (e.g. name@gmail.com)"
                    className="form-control padded-input custom-input-style"
                    required
                    id="signup-email"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label font-label-custom">Phone Number</label>
                <div className="input-with-icon">
                  <div className="icon-badge">
                    <Phone size={15} className="input-field-icon" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="form-control padded-input custom-input-style"
                    required
                    id="signup-phone"
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
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="form-control padded-input custom-input-style pwd-input-style"
                    required
                    id="signup-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle Password Visibility"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label font-label-custom">Confirm Password</label>
                <div className="input-with-icon">
                  <div className="icon-badge">
                    <Lock size={15} className="input-field-icon" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    className="form-control padded-input custom-input-style pwd-input-style"
                    required
                    id="signup-confirm-password"
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle Confirm Password Visibility"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary login-btn hover-glow" disabled={loading} id="signup-submit-btn">
                <span className="btn-icon-badge">
                  <UserPlus size={14} />
                </span>
                <span>{loading ? 'Creating Account...' : 'Sign Up'}</span>
              </button>

              <div className="auth-footer">
                Already have an account? <Link href="/login" className="auth-link">Login <ArrowRight size={14} /></Link>
              </div>
            </form>
          )}
        </div>
      </div>

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
          background: rgba(255, 255, 255, 0.88);
          border-radius: var(--radius-2xl, 24px);
          border: 1px solid rgba(22, 163, 74, 0.25);
          box-shadow: 0 20px 40px -10px rgba(22, 163, 74, 0.12);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          padding: 3rem 2.5rem;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        .login-card:hover {
          border-color: rgba(22, 163, 74, 0.4);
          box-shadow: 0 25px 50px -12px rgba(22, 163, 74, 0.2);
        }

        .card-header {
          text-align: center;
          margin-bottom: 2.2rem;
        }

        .admin-title {
          font-family: var(--font-heading), sans-serif;
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
          gap: 1.2rem;
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
          color: #16a34a;
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
          border-radius: 12px;
          transition: all 0.25s ease;
          margin: 0;
        }

        .pwd-input-style {
          padding-right: 2.75rem;
        }

        .eye-toggle-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #6b7280;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          border-radius: 6px;
          transition: color 0.2s, background-color 0.2s;
        }

        .eye-toggle-btn:hover {
          color: #16a34a;
          background-color: rgba(22, 163, 74, 0.08);
        }

        .custom-input-style::placeholder {
          color: #9ca3af;
          font-weight: 400;
        }

        .custom-input-style:focus {
          outline: none;
          border-color: #16a34a;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }

        .padded-input {
          padding-left: 3.1rem;
        }

        .login-btn {
          width: 100%;
          box-sizing: border-box;
          padding: 0.9rem 1.25rem;
          font-size: 1.02rem;
          margin-top: 1rem;
          font-weight: 700;
          background: #16a34a;
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(22, 163, 74, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          color: white;
        }

        .login-btn:hover:not(:disabled) {
          background: #15803d;
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
          border-radius: 12px;
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
        }

        .error-alert svg {
          flex-shrink: 0;
          margin-top: 1px;
        }

        .success-content {
          text-align: center;
          padding: 1.5rem 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .success-icon {
          color: #16a34a;
        }

        .success-heading {
          font-family: var(--font-heading), sans-serif;
          font-weight: 800;
          color: #15803d;
          font-size: 1.35rem;
          margin: 0;
        }

        .success-message {
          font-size: 0.95rem;
          color: #4b5563;
          line-height: 1.5;
        }

        .redirect-text {
          font-size: 0.85rem;
          color: #6b7280;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.9rem;
          color: #6b7280;
          border-top: 1px solid rgba(22, 163, 74, 0.15);
          padding-top: 1.25rem;
        }

        .auth-link {
          color: #16a34a;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: 0.25rem;
          transition: color 0.2s ease;
        }

        .auth-link:hover {
          color: #15803d;
          text-decoration: underline;
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
