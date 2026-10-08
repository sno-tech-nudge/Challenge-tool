import { SESSION_SECONDS, type Role } from '../constants';

// Web Crypto only, so the same code runs in the edge middleware and in Node.
function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is required in production');
  return 'dev-only-secret';
}

function b64url(buf: ArrayBuffer): string {
  let bin = '';
  for (const b of new Uint8Array(buf)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}

export interface Session {
  userId: string;
  role: Role;
}

/** token = userId.role.expiry.signature — expiry is signed, so it cannot be extended by hand. */
export async function signSession(userId: string, role: Role): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const body = `${userId}.${role}.${exp}`;
  return `${body}.${await hmac(body)}`;
}

export async function verifySession(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 4) return null;
  const [userId, role, exp, sig] = parts;
  const expected = await hmac(`${userId}.${role}.${exp}`);
  if (sig.length !== expected.length) return null;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  if (role !== 'ADMIN' && role !== 'JURY') return null;
  return { userId, role };
}
