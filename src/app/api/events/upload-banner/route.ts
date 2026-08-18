import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminSession } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate size (under 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 5MB.' }, { status: 400 });
    }

    // Validate extension
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, JPEG, PNG, and WEBP image uploads are allowed.' }, { status: 400 });
    }

    // Ensure bucket exists (self-healing)
    try {
      await supabaseAdmin.storage.createBucket('event-banners', {
        public: true,
      });
    } catch (bucketErr) {
      // Ignore conflict / already exists
    }

    // Generate safe unique filename
    const fileExt = file.type.split('/')[1] || 'png';
    const randId = Math.floor(Math.random() * 100000);
    const fileName = `banner_${Date.now()}_${randId}.${fileExt}`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage bucket 'event-banners'
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('event-banners')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase storage upload error details:', uploadError);
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}`);
    }

    // Generate Public URL for the uploaded file
    const { data: urlData } = supabaseAdmin
      .storage
      .from('event-banners')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to generate public URL for the uploaded file.');
    }

    console.log('Successfully uploaded banner image. Public URL:', urlData.publicUrl);
    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (err: any) {
    console.error('Backend File upload error details:', err);
    return NextResponse.json({ 
      error: `Failed to process and upload event banner. Error: ${err.message || String(err)}` 
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const adminUser = await verifyAdminSession(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'File name is required' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .storage
      .from('event-banners')
      .remove([fileName]);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
