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
export const supabase = createLazyClient(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
);

/**
 * Admin/server client — uses service_role key.
 * MUST only be used in API routes (server-side).
 * This bypasses Row Level Security.
 */
export const supabaseAdmin = createLazyClient(() =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
);

// ── TypeScript Types matching the Supabase schema ─────────────
export interface DbUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  created_at?: string;
}

export interface DbBus {
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

export interface DbBooking {
  id: string;
  user_id: string;
  bus_id: string;
  bus_name: string;
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
