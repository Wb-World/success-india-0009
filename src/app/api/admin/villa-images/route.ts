import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configs')
      .select('*')
      .eq('key', 'villa_images')
      .maybeSingle();

    if (error || !data) {
      // Fallback default images
      return NextResponse.json({
        images: [
          '/images/villa.jpg'
        ]
      });
    }

    try {
      const images = JSON.parse(data.value);
      if (Array.isArray(images)) {
        return NextResponse.json({ images });
      }
    } catch (e) {
      // JSON parse error, fallback
    }

    return NextResponse.json({
      images: [
        '/images/villa.jpg'
      ]
    });
  } catch (err) {
    console.error('Villa images GET error:', err);
    return NextResponse.json({ error: 'Failed to retrieve villa images' }, { status: 500 });
  }
}

import { verifyAdminSession } from '@/lib/auth-server';

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { images } = await request.json();

    if (!Array.isArray(images)) {
      return NextResponse.json({ error: 'Images must be an array' }, { status: 400 });
    }

    // Write to configs table using upsert
    const { error: upsertError } = await supabaseAdmin
      .from('configs')
      .upsert({
        key: 'villa_images',
        value: JSON.stringify(images)
      });

    if (upsertError) {
      console.error("VILLA_IMAGES_SAVE_FAILED:", upsertError);
      return NextResponse.json({ error: `Failed to save villa settings to database: ${upsertError.message} (code: ${upsertError.code})` }, { status: 500 });
    }

    return NextResponse.json({ message: 'Villa images saved successfully' });
  } catch (err: any) {
    console.error('Villa images POST error:', err);
    return NextResponse.json({ error: `Failed to save villa images: ${err.message || String(err)}` }, { status: 500 });
  }
}
