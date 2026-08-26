import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
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

    // Generate safe unique filename
    const fileExt = file.type.split('/')[1] || 'png';
    const randId = Math.floor(Math.random() * 100000);
    const fileName = `proof_${Date.now()}_${randId}.${fileExt}`;

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage bucket 'payment-proofs'
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('payment-proofs')
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload payment proof. Please try again.' }, { status: 500 });
    }

    // Generate Public URL for the uploaded file
    const { data: urlData } = supabaseAdmin
      .storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ error: 'Failed to retrieve uploaded file URL.' }, { status: 500 });
    }

    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ 
      error: 'Failed to process and upload image proof. Please try again.' 
    }, { status: 500 });
  }
}
