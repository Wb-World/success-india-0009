import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      full_name,
      phone,
      email,
      guests,
      check_in_date,
      check_out_date,
      accommodation_type,
      special_notes,
      amount,
      utr_number,
      user_id,
    } = body;

    // Validate required fields
    if (
      !full_name ||
      !phone ||
      !email ||
      !guests ||
      !check_in_date ||
      !check_out_date ||
      !accommodation_type ||
      amount === undefined ||
      !utr_number
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Insert into resort_bookings table using admin client to bypass RLS if needed,
    // though RLS is allowed for inserts. We'll use admin to be safe for a protected creation.
    const { data, error } = await supabaseAdmin
      .from('resort_bookings')
      .insert([
        {
          user_id: user_id || null,
          full_name,
          phone,
          email,
          guests: parseInt(guests, 10),
          check_in_date,
          check_out_date,
          accommodation_type,
          special_notes: special_notes || null,
          amount: parseFloat(amount),
          utr_number,
          status: 'PENDING VERIFICATION'
        },
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting resort booking:', error);
      return NextResponse.json({ error: `Failed to save booking: ${error.message} (${error.code})` }, { status: 500 });
    }

    return NextResponse.json({ success: true, bookingId: data.id }, { status: 200 });

  } catch (error: any) {
    console.error('API Error /resort-booking:', error);
    return NextResponse.json({ error: `Internal server error: ${error.message || String(error)}` }, { status: 500 });
  }
}
