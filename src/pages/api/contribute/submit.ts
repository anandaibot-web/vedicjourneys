// src/pages/api/contribute/submit.ts
// Receives the contributor form submission:
//   - Validates session
//   - Downloads images from Cloudinary URLs
//   - Builds whatsappReply-style context string
//   - POSTs to the local pipeline webhook (travel-agent)
//   - Returns { url, quality, wordCount } or { error }

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';

// The travel-agent pipeline webhook runs locally on the same machine.
// It accepts POST with { imageBuffers (base64), tripName, userHandle, from, whatsappReply }
const PIPELINE_WEBHOOK =
  process.env.PIPELINE_WEBHOOK_URL || 'http://127.0.0.1:18791/pipeline';

const PIPELINE_SECRET =
  process.env.PIPELINE_SECRET || 'vj-pipeline-secret';

export const POST: APIRoute = async ({ request, cookies }) => {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { images, context } = body;

  if (!images?.length) {
    return new Response(JSON.stringify({ error: 'No images provided' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (images.length > 10) {
    return new Response(JSON.stringify({ error: 'Maximum 10 images' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  // ── Download images from Cloudinary ──────────────────────────────────────
  // Images are already on Cloudinary — download as base64 to send to pipeline
  // This keeps Vercel's 4.5MB serverless limit irrelevant (images never
  // pass through Vercel — they go Cloudinary → this Vercel fn → pipeline)
  const imageBuffers: { name: string; base64: string }[] = [];

  for (const img of images) {
    try {
      const res = await fetch(img.url);
      if (!res.ok) throw new Error(`Failed to fetch image: ${img.url}`);
      const buf = await res.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      const name = img.publicId.split('/').pop() + '.jpg';
      imageBuffers.push({ name, base64 });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: `Image download failed: ${err.message}` }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // ── Build context string (same format as whatsappReply) ───────────────────
  const parts: string[] = [];
  if (context.location)   parts.push(`📍 Location: ${context.location}`);
  if (context.trip_date)  parts.push(`📅 Date: ${context.trip_date}`);
  if (context.altitude)   parts.push(`🏔️ Altitude: ${context.altitude}m`);
  if (context.one_line)   parts.push(`✍️ One line: ${context.one_line}`);
  if (context.reflection) parts.push(`💭 Reflection: ${context.reflection}`);
  if (context.challenge)  parts.push(`⚡ Challenge: ${context.challenge}`);
  if (context.intention)  parts.push(`🙏 Intention: ${context.intention}`);

  const whatsappReply = parts.length > 0 ? parts.join('\n') : null;
  const tripName = context.location
    ? context.location.split(',')[0].trim()
    : `Trip-${new Date().toISOString().split('T')[0]}`;

  // ── Call pipeline webhook ─────────────────────────────────────────────────
  let pipelineResult: any;
  try {
    const res = await fetch(PIPELINE_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pipeline-secret': PIPELINE_SECRET,
      },
      body: JSON.stringify({
        imageBuffers,
        tripName,
        userHandle: session.handle,
        from: `web:${session.handle}`,
        whatsappReply,
        visibility: context.visibility || 'unlisted',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pipeline error ${res.status}: ${text}`);
    }

    pipelineResult = await res.json();
  } catch (err: any) {
    console.error('Pipeline call failed:', err.message);
    return new Response(JSON.stringify({ error: `Pipeline failed: ${err.message}` }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    url: pipelineResult.url,
    quality: pipelineResult.quality,
    wordCount: pipelineResult.wordCount,
    slug: pipelineResult.slug,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
