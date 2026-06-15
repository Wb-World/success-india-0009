import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate size (under 3MB for Vercel payload constraints)
    const MAX_SIZE = 3 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size must be under 3MB.' }, { status: 400 });
    }

    // Validate extension
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, JPEG, PNG, and WEBP image uploads are allowed.' }, { status: 400 });
    }

    // Convert file to Base64 in-memory data URL (Serverless/Vercel safe)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl }, { status: 201 });
  } catch (err: any) {
    console.error('Backend File upload error details:', err);
    return NextResponse.json({ 
      error: `Failed to process and upload image proof. Error: ${err.message || String(err)}` 
    }, { status: 500 });
  }
}
