'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';

function ResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?forgot=1');
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#15803d', fontFamily: 'sans-serif' }}>Redirecting to secure password reset...</p>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordRedirect />
    </Suspense>
  );
}
