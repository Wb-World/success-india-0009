'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Lock, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Signup() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const { name, username, phone, password, confirmPassword } = formData;

    // Front-end validations
    if (!name || !username || !phone || !password || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          username: username.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Account created successfully');
        
        // Save user session in localStorage to auto-login
        localStorage.setItem('user', JSON.stringify(data.user));
        // Dispatch custom auth-change event to update navbar/UI
        window.dispatchEvent(new Event('auth-change'));

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
        setError(data.error || 'Failed to create account');
      }
    } catch (err) {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page animate-fade-in">
      <section className="auth-hero">
        <div className="container">
          <h1 className="heading-xl hero-title">Create Account</h1>
          <p className="hero-subtitle">Register to reserve seminar seats and manage your delegate profile.</p>
        </div>
      </section>

      <section className="container auth-form-container">
        <div className="auth-card glass-card">
          {success ? (
            <div className="success-content animate-scale-in">
              <CheckCircle2 size={56} className="success-icon" />
              <h3 className="heading-md">Signup Success</h3>
              <p className="success-message">{success}</p>
              <p className="redirect-text">Redirecting you to the login page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="auth-form animate-slide-up">
              <h3 className="heading-sm form-title">Enter Details</h3>
              
              {error && (
                <div className="error-alert animate-shake">
                  <ShieldAlert size={16} /> <span>{error}</span>
                </div>
              )}

              {/* Display Name */}
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your display name"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-with-icon">
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Choose a unique username"
                    className="form-control"
                    required
                  />
                </div>
              </div>



              {/* Phone Number */}
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <div className="input-with-icon">
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter your phone number"
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
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={18} />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Repeat your password"
                    className="form-control"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              <div className="auth-footer">
                Already have an account? <Link href="/login" className="auth-link">Sign In <ArrowRight size={14} /></Link>
              </div>
            </form>
          )}
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
          max-width: 500px;
          padding: 2.5rem;
          border-radius: var(--radius-2xl);
          background: white;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-xl);
        }

        .form-title {
          font-weight: 700;
          color: var(--primary-dark);
          margin-bottom: 1.5rem;
          font-size: 1.2rem;
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
          padding: 0.85rem;
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

        .success-content {
          padding: 2.5rem 1.5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .success-icon {
          color: var(--primary);
        }

        .success-message {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--foreground);
        }

        .redirect-text {
          font-size: 0.9rem;
          color: var(--muted);
        }

        .auth-footer {
          text-align: center;
          margin-top: 1.75rem;
          font-size: 0.9rem;
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
