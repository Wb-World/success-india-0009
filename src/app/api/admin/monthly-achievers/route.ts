import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const cacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const LOGO = '/success-india-logo.jpeg';

const defaultData = () => ({
  pv: {
    ced: [
      { rank: 1, name: '', image: LOGO, tier: 'gold' },
      { rank: 2, name: '', image: LOGO, tier: 'silver' },
      { rank: 3, name: '', image: LOGO, tier: 'bronze' },
    ],
    ed: [
      { rank: 1, name: '', image: LOGO, tier: 'gold' },
      { rank: 2, name: '', image: LOGO, tier: 'silver' },
      { rank: 3, name: '', image: LOGO, tier: 'bronze' },
    ],
  },
  income: {
    ced: [
      { rank: 1, name: '', image: LOGO, tier: 'gold' },
      { rank: 2, name: '', image: LOGO, tier: 'silver' },
      { rank: 3, name: '', image: LOGO, tier: 'bronze' },
    ],
    ed: [
      { rank: 1, name: '', image: LOGO, tier: 'gold' },
      { rank: 2, name: '', image: LOGO, tier: 'silver' },
      { rank: 3, name: '', image: LOGO, tier: 'bronze' },
    ],
  },
  monthLabel: '',
});


export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configs')
      .select('value')
      .eq('key', 'top_monthly_achievers_data')
      .maybeSingle();

    if (error) {
      console.error('Error fetching monthly achievers config:', error);
      return NextResponse.json({ error: 'Failed to retrieve monthly achievers data' }, { status: 500 });
    }

    if (data && data.value) {
      try {
        const achievers = JSON.parse(data.value);
        return NextResponse.json({ achievers }, { headers: cacheHeaders });
      } catch (e) {
        console.error('Failed to parse monthly achievers config JSON:', e);
      }
    }

    return NextResponse.json({ achievers: defaultData() }, { headers: cacheHeaders });
  } catch (err: any) {
    console.error('Monthly Achievers GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve monthly achievers' }, { status: 500 });
  }
}

import { verifyAdminSession } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { achievers } = await request.json();
    if (!achievers) {
      return NextResponse.json({ error: 'Achievers data is required' }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin
      .from('configs')
      .upsert({
        key: 'top_monthly_achievers_data',
        value: JSON.stringify(achievers),
      });

    if (upsertError) {
      console.error('Save monthly achievers error:', upsertError);
      return NextResponse.json({ error: 'Failed to save monthly achievers data' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Monthly achievers saved successfully' });
  } catch (err: any) {
    console.error('Monthly Achievers POST error:', err);
    return NextResponse.json({ error: 'Failed to save monthly achievers data' }, { status: 500 });
  }
}
