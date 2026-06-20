import crypto from 'crypto';

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
 * Supports legacy plain-text passwords as a fallback if no colon is present.
 */
export function verifyPassword(password: string, storedValue: string): boolean {
  if (!storedValue) return false;
  
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
