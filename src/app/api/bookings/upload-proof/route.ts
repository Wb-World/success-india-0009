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
      console.error('Supabase storage upload error details:', uploadError);
      const causeMsg = (uploadError as any).cause ? ` | Cause: ${(uploadError as any).cause.message || String((uploadError as any).cause)}` : '';
      const stringified = JSON.stringify(uploadError);
      throw new Error(`Supabase Storage upload failed: ${uploadError.message}${causeMsg} | Details: ${stringified}`);
    }

    // Generate Public URL for the uploaded file
    const { data: urlData } = supabaseAdmin
      .storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    if (!urlData || !urlData.publicUrl) {
      throw new Error('Failed to generate public URL for the uploaded file.');
    }

    console.log('Successfully uploaded image. Public URL:', urlData.publicUrl);
    return NextResponse.json({ url: urlData.publicUrl }, { status: 201 });
  } catch (err: any) {
    console.error('Backend File upload error details:', err);
    if (err.cause) {
      console.error('Backend File upload error cause details:', err.cause);
    }
    const causeMsg = err.cause ? ` | Cause: ${err.cause.message || String(err.cause)}` : '';
    const errorStack = err.stack ? ` | Stack: ${err.stack}` : '';
    return NextResponse.json({ 
      error: `Failed to process and upload image proof. Error: ${err.message || String(err)}${causeMsg}${errorStack}` 
    }, { status: 500 });
  }
}
