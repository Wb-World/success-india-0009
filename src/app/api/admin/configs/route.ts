import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configs')
      .select('*');

    if (error) {
      console.warn('Configs select failed (table might not exist yet):', error.message);
      // Fallback: return default hardcoded configs
      return NextResponse.json({
        configs: [
          { key: 'upi_id', value: 'shesh.dav07-1@okaxis' },
          { key: 'upi_name', value: 'david' },
          { key: 'upi_qr_url', value: '/upi-qr-code.jpg?v=2' }
        ]
      });
    }

    return NextResponse.json({ configs: data || [] });
  } catch (err) {
    console.error('Configs GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve configurations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role in users table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', adminId)
      .eq('role', 'admin')
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { upiId, upiName, upiQrUrl } = await request.json();

    if (!upiId || !upiName) {
      return NextResponse.json({ error: 'UPI ID and Account Name are required' }, { status: 400 });
    }

    // Write to configs table using upsert
    const payload = [
      { key: 'upi_id', value: upiId },
      { key: 'upi_name', value: upiName },
      { key: 'upi_qr_url', value: upiQrUrl || '' }
    ];

    const { error: upsertError } = await supabaseAdmin
      .from('configs')
      .upsert(payload, { onConflict: 'key' });

    if (upsertError) {
      console.error('Database error saving configs:', upsertError);
      return NextResponse.json({ error: 'Failed to save settings to database' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Configurations saved successfully' });
  } catch (err) {
    console.error('Configs POST error:', err);
    return NextResponse.json({ error: 'Failed to save configurations' }, { status: 500 });
  }
}
