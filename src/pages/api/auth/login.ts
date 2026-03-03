// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { validateCredentials, createSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  let handle = '';
  let passphrase = '';

  try {
    const body = await request.json();
    handle = (body.handle || '').trim().toLowerCase();
    passphrase = (body.passphrase || '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!handle || !passphrase || !validateCredentials(handle, passphrase)) {
    return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  await createSession(cookies, handle);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { 'Content-Type': 'application/json' }
  });
};