import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configs')
      .select('value')
      .eq('key', 'top_achievers_data')
      .maybeSingle();

    if (error) {
      console.error('Error fetching achievers config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (data && data.value) {
      try {
        const achievers = JSON.parse(data.value);
        return NextResponse.json({ achievers }, { headers: cacheHeaders });
      } catch (e) {
        console.error('Failed to parse achievers config JSON:', e);
      }
    }

    // Default seeded data if config is empty
    const defaultData = {
      pv: {
        ced: [
          { rank: 1, name: '', image: '', tier: 'gold' },
          { rank: 2, name: '', image: '', tier: 'silver' },
          { rank: 3, name: '', image: '', tier: 'bronze' }
        ],
        ed: [
          { rank: 1, name: '', image: '', tier: 'gold' },
          { rank: 2, name: '', image: '', tier: 'silver' },
          { rank: 3, name: '', image: '', tier: 'bronze' }
        ]
      },
      income: {
        ced: [
          { rank: 1, name: '', image: '', tier: 'gold' },
          { rank: 2, name: '', image: '', tier: 'silver' },
          { rank: 3, name: '', image: '', tier: 'bronze' }
        ],
        ed: [
          { rank: 1, name: '', image: '', tier: 'gold' },
          { rank: 2, name: '', image: '', tier: 'silver' },
          { rank: 3, name: '', image: '', tier: 'bronze' }
        ]
      }
    };
    return NextResponse.json({ achievers: defaultData }, { headers: cacheHeaders });
  } catch (err: any) {
    console.error('Achievers GET error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
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
        key: 'top_achievers_data',
        value: JSON.stringify(achievers)
      });

    if (upsertError) {
      console.error('Save achievers error:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Achievers saved successfully' });
  } catch (err: any) {
    console.error('Achievers POST error:', err);
    return NextResponse.json({ error: err.message || 'An error occurred' }, { status: 500 });
  }
}
