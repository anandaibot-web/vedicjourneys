// src/lib/auth.ts
// Simple invite-only auth. Credentials live in .env — no database needed.
// Sessions are signed cookies (HMAC-SHA256).
//
// .env format:
//   YATRI_anand=my-secret-passphrase
//   YATRI_vidya=another-passphrase
//   SESSION_SECRET=32-char-random-string

import type { AstroCookies } from 'astro';

const SESSION_COOKIE = 'vj_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  handle: string;
  name: string;
  expiresAt: number;
}

// ── HMAC helpers ──────────────────────────────────────────────────────────────

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || 'change-me-use-real-secret-32ch';
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function verify(payload: string, signature: string): Promise<boolean> {
  try {
    const key = await getKey();
    const enc = new TextEncoder();
    const sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    return crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(payload));
  } catch {
    return false;
  }
}

// ── Session encode/decode ─────────────────────────────────────────────────────

async function encodeSession(session: Session): Promise<string> {
  const payload = btoa(JSON.stringify(session));
  const sig = await sign(payload);
  return `${payload}.${sig}`;
}

async function decodeSession(token: string): Promise<Session | null> {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const valid = await verify(payload, sig);
    if (!valid) return null;
    const session: Session = JSON.parse(atob(payload));
    if (Date.now() > session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getSession(cookies: AstroCookies): Promise<Session | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function createSession(
  cookies: AstroCookies,
  handle: string
): Promise<void> {
  const session: Session = {
    handle,
    name: handle.charAt(0).toUpperCase() + handle.slice(1),
    expiresAt: Date.now() + SESSION_MAX_AGE * 1000,
  };
  const token = await encodeSession(session);
  cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export function destroySession(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function validateCredentials(handle: string, passphrase: string): boolean {
  const key = `YATRI_${handle.toLowerCase()}`;
  const expected = process.env[key];
  if (!expected) return false;
  // Constant-time comparison (prevents timing attacks)
  if (expected.length !== passphrase.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ passphrase.charCodeAt(i);
  }
  return diff === 0;
}
