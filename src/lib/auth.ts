import crypto from 'crypto';
import bcrypt from 'bcryptjs';

/**
 * Hash a password using PBKDF2 with a random salt.
 * Returns a colon-separated string: "salt:hash"
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a stored value.
 * Supports legacy plain-text/PBKDF2 passwords as well as bcrypt.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false;
  
  // Check if bcrypt hash
  if (storedValue.startsWith('$2a$') || storedValue.startsWith('$2b$')) {
    return bcrypt.compareSync(password, storedValue);
  }
  
  // Legacy plain-text fallback (e.g. for seed data users)
  if (!storedValue.includes(':')) {
    return password === storedValue;
  }
  
  const parts = storedValue.split(':');
  if (parts.length !== 2) return false;
  
  const [salt, hash] = parts;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Generate a secure signature for QR payload to prevent tampering/forgery.
 */
export function generateQrSignature(bookingId: string, status: string, seats: string, amount: string): string {
  const salt = process.env.QR_SECRET_SALT || 'success_team_secret_salt_2026';
  const data = `${bookingId.trim().toUpperCase()}|${status.trim().toUpperCase()}|${seats.trim()}|${amount.trim()}|${salt}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Verify a QR payload's signature.
 */
export function verifyQrSignature(bookingId: string, status: string, seats: string, amount: string, signature: string): boolean {
  const expected = generateQrSignature(bookingId, status, seats, amount);
  return expected.toLowerCase() === signature.trim().toLowerCase();
}
