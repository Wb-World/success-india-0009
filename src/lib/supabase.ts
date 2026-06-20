import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a lazy Proxy-based Supabase client.
 * The real client is only instantiated on first method access (at request time),
 * NOT at module import time. This prevents build failures when env vars are absent.
 */
function createLazyClient(factory: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | null = null;
  return new Proxy({} as SupabaseClient, {
    get(_, prop: string | symbol) {
      if (!instance) {
        instance = factory();
      }
      const value = (instance as any)[prop];
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  });
}

/**
 * Public client — uses anon key.
 * Safe to use in browser-side code.
 */
export const supabase = createLazyClient(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined in your environment variables.');
  }
  return createClient(url, key);
});

/**
 * Admin/server client — uses service_role key.
 * MUST only be used in API routes (server-side).
 * This bypasses Row Level Security.
 */
export const supabaseAdmin = createLazyClient(() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in your environment variables.');
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
});

// ── TypeScript Types matching the Supabase schema ─────────────
export interface DbUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface DbSeminarCompatibilityRow {
  id: string;
  name: string;
  type: string;
  source: string;
  destination: string;
  price: number;
  duration: string;
  times: string[];
  created_at?: string;
}

export interface DbEvent {
  id: string;
  title: string;
  venue: string;
  event_datetime: string;
  price: number;
  total_seats: number;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface DbBooking {
  id: string;
  user_id: string;
  seminar_id?: string | null;
  seminar_name?: string | null;
  bus_id?: string | null;
  bus_name?: string | null;
  source: string;
  destination: string;
  date: string;
  time: string;
  seats: string[];
  total_price: number;
  screenshot: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
}
