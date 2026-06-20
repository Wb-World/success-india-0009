'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ShieldAlert, ArrowRight, Key } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        
        // Dispatch custom auth-change event to update navbar/UI
        window.dispatchEvent(new Event('auth-change'));
        
        const searchParams = new URLSearchParams(window.location.search);
        const cb = searchParams.get('callbackUrl') || '';
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

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-alert animate-shake">
                <ShieldAlert size={16} /> <span>{error}</span>
              </div>
            )}

            {/* Username or Phone Number */}
            <div className="form-group">
              <label className="form-label font-label-custom">Username or Phone Number</label>
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
