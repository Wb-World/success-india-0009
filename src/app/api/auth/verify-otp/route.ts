import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  return NextResponse.json(
    { message: 'OTP verification is now handled client-side directly via Firebase Phone Authentication.' },
    { status: 200 }
  );
}
