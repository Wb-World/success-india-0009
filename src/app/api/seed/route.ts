import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('Seeding: Clearing old bookings...');
    const { error: delBookingsError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .neq('id', '0');
    if (delBookingsError) {
      console.error('Seeding: Error clearing bookings:', delBookingsError);
    }

    console.log('Seeding: Clearing old buses...');
    const { error: delBusesError } = await supabaseAdmin
      .from('buses')
      .delete()
      .neq('id', '0');
    if (delBusesError) {
      console.error('Seeding: Error clearing buses:', delBusesError);
    }

    console.log('Seeding: Inserting CyberStrike 2026 hacker sessions...');
    const hackerSessions = [
      {
        id: 'cyber_101',
        name: 'Neural Net Penetration & AI Exploits',
        type: 'Elite Keynote Lab',
        source: 'Offensive AI',
        destination: 'Nexus Room (Hall A)',
        price: 1500,
        duration: '2h 30m',
        times: ['09:00 AM', '01:00 PM', '06:00 PM', '09:00 PM']
      },
      {
        id: 'cyber_102',
        name: 'Zero-Day Exploit Development Masterclass',
        type: 'Expert Workshop',
        source: 'Reverse Engineering',
        destination: 'Sandbox Lab (Suite 404)',
        price: 2500,
        duration: '4h 00m',
        times: ['10:00 AM', '02:00 PM', '07:30 PM']
      },
      {
        id: 'cyber_103',
        name: 'Cryptographic Breaches & Quantum Defense',
        type: 'Theoretical Symposium',
        source: 'Web3 & Cryptography',
        destination: 'Black Box Room (Hall B)',
        price: 1800,
        duration: '3h 15m',
        times: ['09:30 AM', '02:30 PM', '08:00 PM']
      },
      {
        id: 'cyber_104',
        name: 'Firmware Fuzzing & IoT Hardware Hijacking',
        type: 'Hands-on Workshop',
        source: 'Hardware & IoT',
        destination: 'Silicon Sandbox (Lab C)',
        price: 1200,
        duration: '3h 00m',
        times: ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM']
      },
      {
        id: 'cyber_105',
        name: 'Dark Web Threat Intelligence & Active Defense',
        type: 'Operational Briefing',
        source: 'Defensive AI',
        destination: 'War Room (Room 101)',
        price: 950,
        duration: '2h 00m',
        times: ['11:00 AM', '03:00 PM', '09:00 PM']
      },
      {
        id: 'cyber_106',
        name: 'Kernel Land Rootkits & Exploit Mitigation',
        type: 'Expert Session',
        source: 'Reverse Engineering',
        destination: 'Sandbox Lab (Suite 404)',
        price: 2200,
        duration: '3h 30m',
        times: ['09:00 AM', '01:30 PM', '06:30 PM']
      },
      {
        id: 'cyber_107',
        name: 'Smart Contract Exploitation & Auditing',
        type: 'Hands-on Arena',
        source: 'Web3 & Cryptography',
        destination: 'Black Box Room (Hall B)',
        price: 1600,
        duration: '2h 45m',
        times: ['10:30 AM', '03:30 PM', '08:30 PM']
      }
    ];

    const { data, error } = await supabaseAdmin
      .from('buses')
      .insert(hackerSessions)
      .select();

    if (error) {
      console.error('Seeding error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Seeded CyberStrike 2026 hacker sessions successfully',
      count: data?.length || 0,
      data
    });
  } catch (err: any) {
    console.error('Unexpected seeding error:', err);
    return NextResponse.json({ error: err.message || 'Unexpected error' }, { status: 500 });
  }
}
