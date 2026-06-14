import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
}

export interface Bus {
  id: string;
  name: string;
  type: string;
  status?: string;
  source: string;
  destination: string;
  price: number;
  duration: string;
  times: string[];
}

export interface Booking {
  id: string;
  userId: string;
  busId: string;
  busName: string;
  source: string;
  destination: string;
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
  buses: Bus[];
  bookings: Booking[];
}

const dbPath = path.join(process.cwd(), 'src', 'lib', 'db.json');

export function readDb(): DbSchema {
  try {
    if (!fs.existsSync(dbPath)) {
      // Return default empty structure if it doesn't exist yet
      return { users: [], buses: [], bookings: [] };
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data) as DbSchema;
  } catch (error) {
    console.error('Error reading JSON database:', error);
    return { users: [], buses: [], bookings: [] };
  }
}

export function writeDb(data: DbSchema): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing JSON database:', error);
  }
}
