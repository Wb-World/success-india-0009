import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('payment_settings')
      .select('*')
      .eq('id', 'service_config')
      .maybeSingle();

    if (error || !data) {
      console.warn('payment_settings select failed or empty (falling back to defaults):', error);
      // Fallback: return default configurations
      return NextResponse.json({
        configs: [
          { key: 'upi_id', value: '8637684229-3@ybl' },
          { key: 'upi_name', value: 'david' },
          { key: 'upi_qr_url', value: '/upi-qr-code.jpg?v=2' }
        ]
      });
    }

    return NextResponse.json({
      configs: [
        { key: 'upi_id', value: data.upi_id },
        { key: 'upi_name', value: data.beneficiary_name },
        { key: 'upi_qr_url', value: data.qr_code_url || '' }
      ]
    });
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

    // Verify admin role in admin table
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('admin')
      .select('id, username, role')
      .eq('id', adminId)
      .maybeSingle();

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { upiId, upiName, upiQrUrl } = await request.json();

    if (!upiId || !upiName) {
      return NextResponse.json({ error: 'UPI ID and Account Name are required' }, { status: 400 });
    }

    // Write to payment_settings table using upsert
    try {
      const { error: upsertError } = await supabaseAdmin
        .from('payment_settings')
        .upsert({
          id: 'service_config',
          upi_id: upiId,
          beneficiary_name: upiName,
          qr_code_url: upiQrUrl || '',
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error("PAYMENT_CONFIG_SAVE_FAILED:", upsertError);
        return NextResponse.json({ error: 'Failed to save settings to database' }, { status: 500 });
      }
    } catch (dbErr: any) {
      console.error("PAYMENT_CONFIG_SAVE_FAILED:", dbErr);
      return NextResponse.json({ error: dbErr.message || 'Database write operation failed' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Configurations saved successfully' });
  } catch (err) {
    console.error('Configs POST error:', err);
    return NextResponse.json({ error: 'Failed to save configurations' }, { status: 500 });
  }
}
