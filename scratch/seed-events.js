const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing Supabase credentials in environment.');
  process.exit(1);
}

const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const events = [
  // 1. Movies
  {
    id: "event_101",
    name: "Kalki 2898 AD (IMAX 3D)",
    type: "Sci-Fi / Action Movie",
    source: "Bangalore",
    destination: "Movies",
    price: 350,
    duration: "3h 05m",
    times: ["10:30 AM", "02:15 PM", "06:00 PM", "09:30 PM"]
  },
  {
    id: "event_102",
    name: "Leo (2D)",
    type: "Action / Thriller Movie",
    source: "Chennai",
    destination: "Movies",
    price: 190,
    duration: "2h 45m",
    times: ["10:00 AM", "01:30 PM", "06:30 PM", "10:00 PM"]
  },
  {
    id: "event_103",
    name: "Jawan (IMAX)",
    type: "Action / Drama Movie",
    source: "Mumbai",
    destination: "Movies",
    price: 1000,
    duration: "2h 50m",
    times: ["11:00 AM", "03:00 PM", "07:00 PM", "10:30 PM"]
  },
  {
    id: "event_104",
    name: "Shaitaan (2D)",
    type: "Horror / Thriller Movie",
    source: "Pune",
    destination: "Movies",
    price: 180,
    duration: "2h 12m",
    times: ["12:00 PM", "04:30 PM", "09:00 PM"]
  },
  {
    id: "event_105",
    name: "Animal (2D)",
    type: "Crime / Drama Movie",
    source: "Delhi",
    destination: "Movies",
    price: 300,
    duration: "3h 20m",
    times: ["09:00 AM", "01:00 PM", "05:00 PM", "09:00 PM"]
  },
  {
    id: "event_106",
    name: "Salaar: Part 1 - Ceasefire",
    type: "Action / Drama Movie",
    source: "Hyderabad",
    destination: "Movies",
    price: 1000,
    duration: "2h 55m",
    times: ["11:30 AM", "03:15 PM", "07:30 PM", "11:00 PM"]
  },
  {
    id: "event_107",
    name: "Fighter (3D)",
    type: "Action / Adventure Movie",
    source: "Jaipur",
    destination: "Movies",
    price: 220,
    duration: "2h 40m",
    times: ["10:15 AM", "02:00 PM", "06:45 PM", "10:15 PM"]
  },
  // 2. Concerts
  {
    id: "event_201",
    name: "A.R. Rahman Live in Concert",
    type: "Musical Extravaganza",
    source: "Chennai",
    destination: "Concerts",
    price: 1500,
    duration: "3h 30m",
    times: ["07:00 PM"]
  },
  {
    id: "event_202",
    name: "Alan Walker: Sunburn Arena",
    type: "EDM Live Concert",
    source: "Bangalore",
    destination: "Concerts",
    price: 1999,
    duration: "4h 00m",
    times: ["06:00 PM"]
  },
  {
    id: "event_203",
    name: "Arijit Singh Live",
    type: "Romantic Melodies Live",
    source: "Mumbai",
    destination: "Concerts",
    price: 2499,
    duration: "3h 00m",
    times: ["06:30 PM"]
  },
  {
    id: "event_204",
    name: "Diljit Dosanjh: Dil-Luminati Tour",
    type: "Punjabi Live Concert",
    source: "Hyderabad",
    destination: "Concerts",
    price: 2999,
    duration: "3h 30m",
    times: ["07:00 PM"]
  },
  {
    id: "event_205",
    name: "Coldplay: Music of the Spheres",
    type: "Stadium Rock Concert",
    source: "Delhi",
    destination: "Concerts",
    price: 4999,
    duration: "2h 30m",
    times: ["08:00 PM"]
  },
  // 3. Comedy
  {
    id: "event_301",
    name: "Zakir Khan - Tathastu Stand-Up",
    type: "Hindi Stand-Up Special",
    source: "Bangalore",
    destination: "Comedy",
    price: 799,
    duration: "1h 45m",
    times: ["05:00 PM", "08:30 PM"]
  },
  {
    id: "event_302",
    name: "Anubhav Singh Bassi - Kisi Ko Batana Mat",
    type: "Stand-Up Comedy",
    source: "Mumbai",
    destination: "Comedy",
    price: 999,
    duration: "1h 30m",
    times: ["06:00 PM", "09:00 PM"]
  },
  {
    id: "event_303",
    name: "Kunal Kamra Live",
    type: "Satirical Stand-Up",
    source: "Delhi",
    destination: "Comedy",
    price: 600,
    duration: "1h 20m",
    times: ["07:00 PM"]
  },
  {
    id: "event_304",
    name: "Samay Raina - Unfiltered Chess & Comedy",
    type: "Interactive Stand-Up",
    source: "Pune",
    destination: "Comedy",
    price: 800,
    duration: "1h 50m",
    times: ["07:30 PM"]
  },
  // 4. Sports
  {
    id: "event_401",
    name: "IPL: Mumbai Indians vs Chennai Super Kings",
    type: "T20 Cricket League Match",
    source: "Mumbai",
    destination: "Sports",
    price: 1200,
    duration: "4h 00m",
    times: ["07:30 PM"]
  },
  {
    id: "event_402",
    name: "IPL: Royal Challengers Bengaluru vs KKR",
    type: "T20 Cricket League Match",
    source: "Bangalore",
    destination: "Sports",
    price: 1000,
    duration: "4h 00m",
    times: ["07:30 PM"]
  },
  {
    id: "event_403",
    name: "Pro Kabaddi League Finals",
    type: "Kabaddi Championship",
    source: "Delhi",
    destination: "Sports",
    price: 500,
    duration: "2h 00m",
    times: ["08:00 PM"]
  }
];

async function main() {
  console.log('Seeding Supabase...');
  try {
    // Delete existing bookings first to avoid foreign key violations
    const { error: delBookingsError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .neq('id', 'dummy'); // Delete all
    if (delBookingsError) {
      console.warn('Warning deleting bookings from Supabase:', delBookingsError.message);
    }

    // Delete existing buses/events
    const { error: delBusesError } = await supabaseAdmin
      .from('buses')
      .delete()
      .neq('id', 'dummy');
    if (delBusesError) {
      console.error('Error deleting buses from Supabase:', delBusesError);
      process.exit(1);
    }

    // Insert new events
    const { error: insertError } = await supabaseAdmin
      .from('buses')
      .insert(events);
    if (insertError) {
      console.error('Error inserting events to Supabase:', insertError);
      process.exit(1);
    }
    console.log('Supabase seeding complete!');

    // Update db.json
    console.log('Seeding db.json...');
    const dbJsonPath = path.join(__dirname, '..', 'src', 'lib', 'db.json');
    if (fs.existsSync(dbJsonPath)) {
      const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf8'));
      dbData.buses = events;
      dbData.bookings = []; // Reset old bookings to start fresh with events
      fs.writeFileSync(dbJsonPath, JSON.stringify(dbData, null, 2), 'utf8');
      console.log('db.json seeding complete!');
    } else {
      console.warn('db.json not found at', dbJsonPath);
    }
  } catch (err) {
    console.error('Unexpected error seeding database:', err);
    process.exit(1);
  }
}

main();
