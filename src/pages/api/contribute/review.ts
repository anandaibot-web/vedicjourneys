// src/pages/api/contribute/review.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

const PIPELINE_WEBHOOK_URL = import.meta.env.PIPELINE_WEBHOOK_URL || process.env.PIPELINE_WEBHOOK_URL || '';
const PIPELINE_SECRET = import.meta.env.PIPELINE_SECRET || process.env.PIPELINE_SECRET || '';

// Strip /pipeline suffix to get base URL
const WEBHOOK_BASE = PIPELINE_WEBHOOK_URL.replace(/\/pipeline$/, '');

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }
  const handle = session.handle;

  let body: any;
  try { body = await request.json(); }
  catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { action, slug, visibility } = body;

  if (!slug || typeof slug !== 'string' || slug.includes('..') || slug.includes('/')) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const routeMap: Record<string, string> = {
    approve:    '/review/approve',
    reject:     '/review/reject',
    visibility: '/review/visibility',
  };

  const route = routeMap[action];
  if (!route) {
    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const webhookRes = await fetch(`${WEBHOOK_BASE}${route}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pipeline-secret': PIPELINE_SECRET,
      },
      body: JSON.stringify({ slug, userHandle: handle, visibility: visibility || undefined }),
    });

    const data = await webhookRes.json();
    return new Response(JSON.stringify(data), {
      status: webhookRes.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('Review webhook error:', err.message);
    return new Response(JSON.stringify({ error: 'Could not reach pipeline webhook: ' + err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
