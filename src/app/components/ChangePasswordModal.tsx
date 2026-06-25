'use client';

import { useState } from 'react';
import { Eye, EyeOff, X, Key, AlertCircle, RefreshCw, Lock } from 'lucide-react';

interface Props {
  onClose: () => void;
  adminUser: { id: string; username: string; role: string };
  setToastMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
  handleLogout: () => void;
}

export default function ChangePasswordModal({ onClose, adminUser, setToastMessage, handleLogout }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    const currentPwdTrim = currentPassword.trim();
    const newPwdTrim = newPassword.trim();
    const confirmPwdTrim = confirmPassword.trim();

    // 1. Mandatory value validation
    if (!currentPwdTrim || !newPwdTrim || !confirmPwdTrim) {
      setErrorMsg('All fields are required.');
      return;
    }

    // 2. Reject mismatched confirmation
    if (newPwdTrim !== confirmPwdTrim) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    // 3. Reject same password reuse
    if (newPwdTrim === currentPwdTrim) {
      setErrorMsg('New password cannot be the same as your current password.');
      return;
    }

    // 4. Password Strength Verification
    if (newPwdTrim.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(newPwdTrim)) {
      setErrorMsg('Password must contain at least one uppercase letter.');
      return;
    }
    if (!/[a-z]/.test(newPwdTrim)) {
      setErrorMsg('Password must contain at least one lowercase letter.');
      return;
    }
    if (!/[0-9]/.test(newPwdTrim)) {
      setErrorMsg('Password must contain at least one number.');
      return;
    }
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(newPwdTrim)) {
      setErrorMsg('Password must contain at least one special character.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': adminUser.id
        },
        body: JSON.stringify({
          currentPassword: currentPwdTrim,
          newPassword: newPwdTrim
        })
      });

      const data = await res.json();

      if (res.ok) {
        setToastMessage({ type: 'success', text: 'Password updated successfully.' });
        onClose();
        // Delay slightly so the user sees the success toast before logout redirection
        setTimeout(() => {
          handleLogout();
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Failed to update password.');
        if (data.error && data.error.includes('Current password is incorrect')) {
          setToastMessage({ type: 'error', text: 'Current password is incorrect.' });
        }
      }
    } catch (err) {
      setErrorMsg('Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="confirm-modal-overlay animate-fade-in" style={{ zIndex: 9999 }} onClick={onClose}>
      <div className="confirm-modal-card animate-scale-in" style={{ maxWidth: '460px', width: '100%', padding: '2rem' }} onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #f3f4f6', paddingBottom: '0.75rem' }}>
          <h2 className="confirm-modal-title" style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontWeight: 700 }}>
            <Key size={18} className="text-primary-green" /> Change Password
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="error-alert animate-shake" style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.82rem', lineHeight: 1.4 }}>
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label font-label-custom" style={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-control custom-input-style"
                style={{ width: '100%', paddingRight: '2.5rem', height: '44px', fontSize: '0.9rem', borderRadius: '8px', border: '1.5px solid rgba(22, 163, 74, 0.2)' }}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', borderRadius: '6px' }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label font-label-custom" style={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-control custom-input-style"
                style={{ width: '100%', paddingRight: '2.5rem', height: '44px', fontSize: '0.9rem', borderRadius: '8px', border: '1.5px solid rgba(22, 163, 74, 0.2)' }}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', borderRadius: '6px' }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.3 }}>
              Requires minimum 8 characters, with 1 uppercase, 1 lowercase, 1 number, and 1 special symbol.
            </span>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label className="form-label font-label-custom" style={{ color: '#475569', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-control custom-input-style"
                style={{ width: '100%', paddingRight: '2.5rem', height: '44px', fontSize: '0.9rem', borderRadius: '8px', border: '1.5px solid rgba(22, 163, 74, 0.2)' }}
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px', borderRadius: '6px' }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="confirm-modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary btn-modal-cancel"
              style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ height: '38px', borderRadius: '8px', fontSize: '0.85rem', padding: '0 1.25rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              {loading ? (
                <><RefreshCw size={14} className="animate-spin" /> Updating...</>
              ) : (
                <>Change Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
