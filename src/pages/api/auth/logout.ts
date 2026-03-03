// src/pages/api/auth/logout.ts
import type { APIRoute } from 'astro';
import { destroySession } from '../../../lib/auth';

export const GET: APIRoute = ({ cookies, redirect }) => {
  destroySession(cookies);
  return redirect('/contribute/login');
};
