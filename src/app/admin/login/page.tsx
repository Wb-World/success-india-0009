'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowLeft, Key, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Redirect to dashboard if already logged in as admin
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role === 'admin') {
          router.push('/admin/dashboard');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.user.role !== 'admin') {
          setErrorMsg('Access denied. Administrative privileges required.');
          setLoading(false);
          return;
        }

        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-change'));
        router.push('/admin/dashboard');
      } else {
        setErrorMsg(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err) {
      setErrorMsg('Server connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="admin-login-page animate-fade-in">
      {/* Decorative floating blur circles */}
      <div className="blur-circle circle-1"></div>
      <div className="blur-circle circle-2"></div>
      <div className="blur-circle circle-3"></div>

      <div className="login-wrapper">
        
        <Link href="/" className="back-home-link animate-slide-down">
          <ArrowLeft size={16} /> <span>Return to Main Website</span>
        </Link>

        <div className="login-card glass-card animate-scale-in">
          <div className="card-header">
            <div className="login-logo-wrapper animate-pulse-green">
              <img src="/success-india-logo.jpeg?v=2" alt="Success Team Logo" className="login-logo-img" />
            </div>
            <h2 className="heading-md admin-title">
              Success<span className="text-primary-green">Team</span>
            </h2>
            <p className="card-subtitle">Authorize credentials to access the administrative portal.</p>
          </div>

          {errorMsg && (
            <div className="error-alert animate-shake">
              <AlertCircle size={16} /> <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label font-label-custom">Admin Username</label>
              <div className="input-with-icon">
                <User size={18} className="input-field-icon" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="E.g., admin"
                  className="form-control padded-input custom-input-style"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-label-custom">Security Key / Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-field-icon" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control padded-input padded-input-right custom-input-style"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pwd-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary login-btn hover-glow" disabled={loading}>
              <Key size={16} />
              <span>{loading ? 'Verifying console keys...' : 'Establish Secure Connection'}</span>
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .admin-login-page {
          background-color: #f0fdf4;
          background: radial-gradient(circle at center, #ffffff 0%, #dcfce7 100%);
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Ambient glowing circles */
        .blur-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 1;
          opacity: 0.4;
          animation: float 12s infinite alternate ease-in-out;
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
          max-width: 440px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          position: relative;
          z-index: 2;
        }

        .back-home-link {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #15803d;
          font-weight: 600;
          font-size: 0.9rem;
          align-self: flex-start;
          transition: all 0.3s ease;
          padding: 0.5rem 1rem;
          border-radius: var(--radius-lg);
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid rgba(22, 163, 74, 0.2);
          backdrop-filter: blur(10px);
        }

        .back-home-link:hover {
          color: #166534;
          background: rgba(255, 255, 255, 0.95);
          transform: translateX(-4px);
        }

        .login-card {
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
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .login-logo-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 80px;
          background: #ffffff;
          border-radius: 50%;
          border: 2px solid rgba(22, 163, 74, 0.3);
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.15);
          overflow: hidden;
          padding: 3px;
        }

        .login-logo-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .text-primary-green {
          color: var(--primary) !important;
        }

        .admin-title {
          font-family: var(--font-heading);
          color: #1f2937;
          font-weight: 800;
          font-size: 1.5rem;
          letter-spacing: -0.5px;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: #4b5563;
          line-height: 1.6;
          opacity: 0.9;
          max-width: 290px;
        }

        .font-label-custom {
          color: #374151;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .input-with-icon {
          position: relative;
        }

        .pwd-toggle-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary);
          opacity: 0.7;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          z-index: 10;
          width: 18px;
          height: 18px;
        }

        .pwd-toggle-btn:hover {
          opacity: 1;
          color: var(--primary-hover);
        }

        .padded-input-right {
          padding-right: 2.75rem;
        }

        .input-field-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--primary);
          opacity: 0.8;
          transition: opacity 0.3s;
        }

        .custom-input-style {
          background: #ffffff;
          border: 1.5px solid rgba(22, 163, 74, 0.3);
          color: #1f2937;
          height: 46px;
          font-weight: 500;
          border-radius: var(--radius-lg);
          transition: all 0.3s;
        }

        .custom-input-style:focus {
          border-color: var(--primary);
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }
        
        .custom-input-style:focus + .input-field-icon {
          opacity: 1;
        }

        .padded-input {
          padding-left: 2.75rem;
        }

        .login-btn {
          width: 100%;
          padding: 0.9rem;
          font-size: 1.05rem;
          margin-top: 1.25rem;
          font-weight: 700;
          background: var(--primary);
          border: none;
          box-shadow: var(--shadow-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
        }

        .error-alert {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 0.875rem;
          border-radius: var(--radius-lg);
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .login-footer-info {
          text-align: center;
          font-size: 0.8rem;
          color: #4b5563;
          opacity: 0.8;
          margin-top: 2rem;
          border-top: 1px solid rgba(22, 163, 74, 0.15);
          padding-top: 1.25rem;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease;
        }
      `}</style>
    </div>
  );
}
