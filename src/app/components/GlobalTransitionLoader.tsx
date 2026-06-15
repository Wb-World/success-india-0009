'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function GlobalTransitionLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isActive, setIsActive] = useState(true); // Active on initial load
  const [isFading, setIsFading] = useState(false);

  // 1. Initial Page Load fade-out
  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 1000);

    const removeTimer = setTimeout(() => {
      setIsActive(false);
    }, 1500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  // 2. Detect path change to trigger fade-out when navigation completes
  useEffect(() => {
    setIsFading(true);
    const removeTimer = setTimeout(() => {
      setIsActive(false);
    }, 500);

    return () => {
      clearTimeout(removeTimer);
    };
  }, [pathname, searchParams]);

  // 3. Intercept Link clicks to show the loader instantly when navigation starts
  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (anchor) {
        const href = anchor.getAttribute('href');
        const targetAttr = anchor.getAttribute('target');
        
        // Only trigger loader if it's an internal link, not a target blank, and not a hash link
        if (
          href && 
          href.startsWith('/') && 
          !href.startsWith('//') && 
          targetAttr !== '_blank' &&
          !href.includes('#') &&
          href !== pathname // Avoid loader when clicking links pointing to the current page
        ) {
          setIsFading(false);
          setIsActive(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleAnchorClick, { capture: true });
    };
  }, [pathname]);

  if (!isActive) return null;

  return (
    <div className={`global-splash-overlay ${isFading ? 'fade-out' : ''}`}>
      <div className="splash-loader-box">
        <div className="splash-content-wrapper">
          <div className="logo-wrapper animate-pulse-green">
            <img src="/success-india-logo.jpeg" alt="Success India Logo" className="splash-logo" />
          </div>
          <div className="text-wrapper">
            <h1 className="splash-title">
              SUCCESS <span className="text-primary-green">INDIA</span>
            </h1>
            <div className="sparkle-container">
              <svg className="sparkle sparkle-1" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
              <svg className="sparkle sparkle-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
              <svg className="sparkle sparkle-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14.6 9.4L24 12L14.6 14.6L12 24L9.4 14.6L0 12L9.4 9.4Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .global-splash-overlay {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 99999;
          transition: opacity 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          overflow: hidden;
        }

        .global-splash-overlay.fade-out {
          opacity: 0;
          pointer-events: none;
        }

        .splash-loader-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 0 1.5rem;
        }

        .splash-content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          animation: fadeInUpScale 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          width: 100%;
          max-width: 100%;
        }

        @media (min-width: 640px) {
          .splash-content-wrapper {
            flex-direction: row;
            gap: 1.5rem;
          }
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .splash-logo {
          width: clamp(60px, 15vw, 90px);
          height: clamp(60px, 15vw, 90px);
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #16a34a;
          box-shadow: 0 10px 25px rgba(22, 163, 74, 0.2);
        }

        .text-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        @media (min-width: 640px) {
          .text-wrapper {
            align-items: flex-start;
            text-align: left;
          }
        }

        .splash-title {
          font-family: var(--font-heading);
          font-size: clamp(1.8rem, 8vw, 3.8rem);
          font-weight: 800;
          color: #000000;
          letter-spacing: -0.5px;
          text-shadow: 0 0 20px rgba(22, 163, 74, 0.1), 0 0 40px rgba(22, 163, 74, 0.05);
          margin: 0;
          line-height: 1.1;
          white-space: nowrap;
        }

        .splash-title .text-primary-green {
          color: var(--primary);
        }

        .sparkle-container {
          position: absolute;
          top: -15px;
          right: -25px;
          width: 35px;
          height: 35px;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .sparkle-container {
            top: -20px;
            right: 0px;
          }
        }

        .sparkle {
          position: absolute;
          color: var(--primary);
          filter: drop-shadow(0 0 6px rgba(22, 163, 74, 0.5));
          opacity: 0;
          animation-fill-mode: both !important;
        }

        .sparkle-1 {
          width: 18px;
          height: 18px;
          top: 0px;
          right: 12px;
          animation: sparkleTwinkle 1.5s ease-in-out infinite;
          animation-delay: 0.6s;
        }

        .sparkle-2 {
          width: 12px;
          height: 12px;
          top: 14px;
          right: 2px;
          animation: sparkleTwinkle 1.8s ease-in-out infinite;
          animation-delay: 0.8s;
        }

        .sparkle-3 {
          width: 8px;
          height: 8px;
          top: 4px;
          right: 0px;
          animation: sparkleTwinkle 1.3s ease-in-out infinite;
          animation-delay: 1s;
        }

        @keyframes fadeInUpScale {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes sparkleTwinkle {
          0%, 100% {
            opacity: 0.2;
            transform: scale(0.6) rotate(-15deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(45deg);
          }
        }
      `}</style>
    </div>
  );
}
