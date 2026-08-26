import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center relative z-10 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-6">
          <Compass className="w-8 h-8" />
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
          404
        </h1>
        <h2 className="text-xl font-semibold text-slate-200 mb-2">
          Page Not Found
        </h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you are looking for does not exist or has been moved.
        </p>

        <div className="flex justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm transition-all duration-200 shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
