'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, ShieldAlert, ArrowRight } from 'lucide-react';

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
        // Save user session in localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Dispatch custom auth-change event to update navbar/UI
        window.dispatchEvent(new Event('auth-change'));
        
        // Redirect depending on role
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          const searchParams = new URLSearchParams(window.location.search);
          const cb = searchParams.get('callbackUrl') || '';
          if (cb && cb.startsWith('/') && !cb.startsWith('//')) {
            router.push(cb);
          } else {
            router.push('/');
          }
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
    <div className="auth-page animate-fade-in">
      <section className="auth-hero">
        <div className="container">
          <h1 className="heading-xl hero-title">Member Sign In</h1>
          <p className="hero-subtitle">Sign in to book event tickets and access your profile history.</p>
        </div>
      </section>

      <section className="container auth-form-container">
        <div className="auth-card glass-card">
          <form onSubmit={handleSubmit} className="auth-form animate-slide-up">
            <h3 className="heading-sm form-title">Enter Credentials</h3>

            {error && (
              <div className="error-alert animate-shake">
                <ShieldAlert size={16} /> <span>{error}</span>
              </div>
            )}

            {/* Username or Phone Number */}
            <div className="form-group">
              <label className="form-label">Username or Phone Number</label>
              <div className="input-with-icon">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Username or Phone Number"
                  className="form-control"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-control"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div className="auth-footer">
              Don&apos;t have an account? <Link href="/signup" className="auth-link">Sign Up <ArrowRight size={14} /></Link>
            </div>
          </form>
        </div>
      </section>

      <style jsx>{`
        .auth-page {
          background-color: var(--background);
          min-height: 100vh;
        }

        .auth-hero {
          background: linear-gradient(135deg, #1e9e48 0%, #25b454 50%, #28a745 100%);
          color: white;
          padding: 5rem 0 6rem;
          text-align: center;
        }

        .hero-title {
          color: white;
          margin-bottom: 1rem;
          font-weight: 800;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          color: #a7f3d0;
          max-width: 600px;
          margin: 0 auto;
          line-height: 1.6;
        }

        .auth-form-container {
          padding: 0 1.5rem 6rem;
          margin-top: -3rem;
          display: flex;
          justify-content: center;
        }

        .auth-card {
          width: 100%;
          max-width: 460px;
          padding: 2.5rem;
          border-radius: var(--radius-2xl);
          background: white;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-xl);
        }

        .form-title {
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 1.75rem;
          font-size: 1.25rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1rem;
          color: var(--muted-light);
          pointer-events: none;
        }

        .input-with-icon .form-control {
          padding-left: 2.75rem;
        }

        .submit-btn {
          width: 100%;
          padding: 0.9rem;
          font-size: 1.05rem;
          margin-top: 1.5rem;
          box-shadow: var(--shadow-primary);
        }

        .error-alert {
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.95rem;
          color: var(--muted);
        }

        .auth-link {
          color: var(--primary);
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          margin-left: 0.25rem;
        }

        .auth-link:hover {
          color: var(--primary-dark);
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
      `}</style>
    </div>
  );
}
