'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role === 'admin') {
          router.push('/admin/dashboard');
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    router.push('/admin/login');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', 
      color: 'white',
      fontFamily: 'var(--font-heading)'
    }}>
      <div className="spinner"></div>
      <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading administration portal...</p>
      
      <style>{`
        .spinner {
          border: 4px solid rgba(16, 185, 129, 0.1);
          border-left-color: var(--primary);
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
