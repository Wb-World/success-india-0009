import crypto from 'crypto';
import { supabaseAdmin } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'success_team_secret_2026_jwt_token_salt';

// In-memory rate limiting store for password change failures
interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Checks if the request from a specific IP is allowed under the rate limits (max 5 failed attempts in 15 mins).
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; blockedUntil?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry) {
    return { allowed: true, remaining: 5 };
  }
  
  if (now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, blockedUntil: entry.blockedUntil };
  }
  
  // If block time has expired, reset
  if (now >= entry.blockedUntil && entry.blockedUntil > 0) {
    rateLimitMap.delete(ip);
    return { allowed: true, remaining: 5 };
  }
  
  return { allowed: true, remaining: Math.max(0, 5 - entry.attempts) };
}

/**
 * Records a failure for a specific IP. If it reaches 5, blocks further attempts for 15 minutes.
 */
export function recordFailure(ip: string): { remaining: number; blockedUntil?: number } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  
  if (!entry) {
    entry = { attempts: 1, blockedUntil: 0 };
  } else {
    entry.attempts += 1;
  }
  
  if (entry.attempts >= 5) {
    entry.blockedUntil = now + 15 * 60 * 1000; // 15 minutes block
  }
  
  rateLimitMap.set(ip, entry);
  
  return {
    remaining: Math.max(0, 5 - entry.attempts),
    blockedUntil: entry.blockedUntil > 0 ? entry.blockedUntil : undefined
  };
}

/**
 * Resets the rate limit for a specific IP upon successful operation.
 */
export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

/**
 * Utility to extract a cookie value from raw Request headers.
 * Safe across all versions of Next.js and Route Handler signatures.
 */
export function getCookieValue(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookiesList = cookieHeader.split(';');
  for (const cookie of cookiesList) {
    const [key, val] = cookie.trim().split('=');
    if (key === name) {
      return decodeURIComponent(val);
    }
  }
  return null;
}

/**
 * Signs a JWT-compatible HS256 token using a composite key: process.env.JWT_SECRET + admin's password hash.
 * This guarantees that when the password changes, all previously generated tokens instantly become invalid.
 */
export function signAdminToken(adminId: string, username: string, passwordHash: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Token expires in 24 hours
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  const payload = Buffer.from(JSON.stringify({ id: adminId, username, exp })).toString('base64url');
  
  const tokenSecret = JWT_SECRET + passwordHash;
  const signature = crypto
    .createHmac('sha256', tokenSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');
    
  return `${header}.${payload}.${signature}`;
}

/**
 * Decodes the JWT token payload without verifying signature (to extract admin ID).
 */
export function decodeTokenUnverified(token: string): { id: string; username: string; exp: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payloadJson);
  } catch (e) {
    return null;
  }
}

/**
 * Verifies the JWT signature against the admin's CURRENT database password hash.
 */
export function verifyAdminToken(token: string, passwordHash: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, payload, signature] = parts;
    
    // Check expiration
    const payloadObj = decodeTokenUnverified(token);
    if (!payloadObj || !payloadObj.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    if (now > payloadObj.exp) return false;
    
    const tokenSecret = JWT_SECRET + passwordHash;
    const expectedSignature = crypto
      .createHmac('sha256', tokenSecret)
      .update(`${header}.${payload}`)
      .digest('base64url');
      
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return false;
    
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (e) {
    return false;
  }
}

/**
 * Authenticates the admin session.
 * Inspects 'admin_session' cookie, reads the database hash, verifies the token.
 */
export async function verifyAdminSession(request: Request): Promise<{ id: string; username: string; role: string } | null> {
  try {
    // 1. Try to get token from cookie
    let token = getCookieValue(request, 'admin_session');
    
    // Fallback: Authorization Bearer header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return null;
    }
    
    // 2. Decode payload to extract admin ID
    const decoded = decodeTokenUnverified(token);
    if (!decoded || !decoded.id) {
      return null;
    }
    
    // 3. Retrieve admin's CURRENT credentials from database
    const { data: admin, error } = await supabaseAdmin
      .from('admin')
      .select('id, username, password, role')
      .eq('id', decoded.id)
      .maybeSingle();
      
    if (error || !admin) {
      return null;
    }
    
    // 4. Verify token using the current hash
    const isValid = verifyAdminToken(token, admin.password);
    if (!isValid) {
      return null;
    }
    
    // Return sanitized admin object
    return {
      id: admin.id,
      username: admin.username,
      role: admin.role || 'admin'
    };
  } catch (e) {
    console.error('[verifyAdminSession] error:', e);
    return null;
  }
}
