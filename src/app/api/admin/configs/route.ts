import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configs')
      .select('key, value');

    if (error || !data) {
      console.warn('configs select failed or empty (falling back to defaults):', error);
      // Fallback: return default configurations
      return NextResponse.json({
        configs: [
          { key: 'upi_id', value: '8637684229-3@ybl' },
          { key: 'upi_name', value: 'david' },
          { key: 'upi_qr_url', value: '/upi-qr-code.jpg?v=2' }
        ]
      });
    }

    const findValue = (keyName: string, defaultValue: string) => {
      const found = data.find((c: any) => c.key === keyName);
      return found ? found.value : defaultValue;
    };

    return NextResponse.json({
      configs: [
        { key: 'upi_id', value: findValue('upi_id', '8637684229-3@ybl') },
        { key: 'upi_name', value: findValue('upi_name', 'david') },
        { key: 'upi_qr_url', value: findValue('upi_qr_url', '/upi-qr-code.jpg?v=2') }
      ]
    });
  } catch (err: any) {
    console.error('Configs GET error details:', err);
    return NextResponse.json({ error: `Failed to retrieve configurations: ${err.message || String(err)}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { upiId, upiName, upiQrUrl } = await request.json();

    if (!upiId || !upiName) {
      return NextResponse.json({ error: 'UPI ID and Account Name are required' }, { status: 400 });
    }

    // Retrieve the existing QR code URL to check for replacement/deletion
    let oldQrUrl = '';
    try {
      const { data: oldConfig } = await supabaseAdmin
        .from('configs')
        .select('value')
        .eq('key', 'upi_qr_url')
        .maybeSingle();
      if (oldConfig) {
        oldQrUrl = oldConfig.value || '';
      }
    } catch (fetchErr) {
      console.warn('Could not fetch existing upi_qr_url (this is fine on first set):', fetchErr);
    }

    // If QR image changed/cleared, delete old image from storage bucket 'payment-proofs'
    if (oldQrUrl && oldQrUrl !== upiQrUrl && oldQrUrl.includes('/payment-proofs/')) {
      try {
        const parts = oldQrUrl.split('/payment-proofs/');
        if (parts.length > 1) {
          const fileName = parts[1];
          console.log(`Replacing old QR image. Deleting file from storage: ${fileName}`);
          const { error: deleteError } = await supabaseAdmin
            .storage
            .from('payment-proofs')
            .remove([fileName]);
          if (deleteError) {
            console.error('Failed to delete old QR file from storage bucket:', deleteError);
          } else {
            console.log('Successfully deleted old QR file from storage:', fileName);
          }
        }
      } catch (delErr) {
        console.error('Error during old QR code file deletion logic:', delErr);
      }
    }

    // Write to configs table using upsert
    try {
      const { error: upsertError } = await supabaseAdmin
        .from('configs')
        .upsert([
          { key: 'upi_id', value: upiId },
          { key: 'upi_name', value: upiName },
          { key: 'upi_qr_url', value: upiQrUrl || '' }
        ]);

      if (upsertError) {
        console.error("PAYMENT_CONFIG_SAVE_FAILED details:", upsertError);
        return NextResponse.json({ error: `Failed to save settings: ${upsertError.message || JSON.stringify(upsertError)}` }, { status: 500 });
      }
    } catch (dbErr: any) {
      console.error("PAYMENT_CONFIG_SAVE_FAILED db error details:", dbErr);
      return NextResponse.json({ error: dbErr.message || 'Database write operation failed' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Configurations saved successfully' });
  } catch (err: any) {
    console.error('Configs POST error details:', err);
    return NextResponse.json({ error: `Failed to save configurations: ${err.message || String(err)}` }, { status: 500 });
  }
}
