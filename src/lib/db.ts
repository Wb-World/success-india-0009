import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface Event {
  id: string;
  name: string;
  type: string;
  status?: string;
  venue: string;
  seminar: string;
  registrationPrice: number;
  duration: string;
  times: string[];
}

export interface Booking {
  id: string;
  userId: string;
  seminarId?: string;
  seminarName?: string;
  eventId?: string;
  eventName?: string;
  venue: string;
  seminar: string;
  date: string;
  time: string;
  seats: string[];
  totalPrice: number;
  screenshot: string; // base64 encoded image
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
}

export interface DbSchema {
  users: User[];
  seminars: Event[];
  bookings: Booking[];
}

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

export function readDb(): DbSchema {
  try {
    if (!fs.existsSync(dbPath)) {
      // Return default empty structure if it doesn't exist yet
      return { users: [], seminars: [], bookings: [] };
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(data) as DbSchema & { buses?: any[] };
    return {
      users: parsed.users || [],
      seminars: parsed.seminars || (parsed.buses || []).map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        status: item.status,
        venue: item.venue || item.source,
        seminar: item.seminar || item.destination,
        registrationPrice: item.registrationPrice ?? item.price ?? 0,
        duration: item.duration,
        times: item.times || [],
      })),
      bookings: parsed.bookings || [],
    };
  } catch (error) {
    console.error('Error reading JSON database:', error);
    return { users: [], seminars: [], bookings: [] };
  }
}

export function writeDb(data: DbSchema): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing JSON database:', error);
  }
}
