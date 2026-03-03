// src/pages/api/auth/login.ts
import type { APIRoute } from 'astro';
import { validateCredentials, createSession } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const handle = (form.get('handle') as string || '').trim().toLowerCase();
  const passphrase = (form.get('passphrase') as string || '').trim();

  if (!handle || !passphrase) {
    return redirect('/contribute/login?error=invalid');
  }

  const valid = validateCredentials(handle, passphrase);
  if (!valid) {
    return redirect('/contribute/login?error=invalid');
  }

  await createSession(cookies, handle);
  return redirect('/contribute');
};
