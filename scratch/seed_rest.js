const fs = require('fs');
const path = require('path');

// 1. Read env variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('.env.local file not found at', envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    envVars[match[1]] = value;
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!url || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const headers = {
  'apikey': serviceRoleKey,
  'Authorization': `Bearer ${serviceRoleKey}`,
  'Content-Type': 'application/json'
};

async function run() {
  try {
    console.log('REST: Clearing old bookings...');
    // Delete all bookings where id is not null (using PostgREST filter id=neq.0 or just a generic filter)
    const delBookingsRes = await fetch(`${url}/rest/v1/bookings?id=not.is.null`, {
      method: 'DELETE',
      headers
    });
    if (!delBookingsRes.ok) {
      console.error('REST: Error deleting bookings:', delBookingsRes.status, await delBookingsRes.text());
    } else {
      console.log('REST: Bookings cleared.');
    }

    console.log('REST: Clearing old buses...');
    const delBusesRes = await fetch(`${url}/rest/v1/buses?id=not.is.null`, {
      method: 'DELETE',
      headers
    });
    if (!delBusesRes.ok) {
      console.error('REST: Error deleting buses:', delBusesRes.status, await delBusesRes.text());
    } else {
      console.log('REST: Buses cleared.');
    }

    console.log('REST: Seeding CyberStrike 2026 hacker sessions...');
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

    const insertRes = await fetch(`${url}/rest/v1/buses`, {
      method: 'POST',
      headers,
      body: JSON.stringify(hackerSessions)
    });

    if (!insertRes.ok) {
      console.error('REST: Error seeding sessions:', insertRes.status, await insertRes.text());
      process.exit(1);
    }

    console.log('REST: Successfully seeded database REST API with hacker sessions.');
    process.exit(0);
  } catch (err) {
    console.error('REST: Unexpected error running migration:', err);
    process.exit(1);
  }
}

run();
