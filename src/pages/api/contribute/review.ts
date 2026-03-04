// src/pages/api/contribute/review.ts
import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { execSync } from 'child_process';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');
const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://vedicjourneys.vercel.app';

function gitPush(slug: string, handle: string, action: string) {
  try {
    execSync(`cd ${process.cwd()} && git add . && git commit -m "feat: ${action} ${handle}/${slug}" && git push`, {
      stdio: 'pipe'
    });
    console.log(`🚀 Git push complete: ${action} ${handle}/${slug}`);
  } catch (e: any) {
    console.error('Git push failed:', e.message);
  }
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const handle = session.handle;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { action, slug, visibility } = body;

  if (!slug || typeof slug !== 'string' || slug.includes('..') || slug.includes('/')) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), { status: 400 });
  }

  // ── APPROVE: move from _review → published ────────────────────────────────
  if (action === 'approve') {
    const reviewPath = path.join(BLOG_ROOT, '_review', handle, `${slug}.md`);
    const publishPath = path.join(BLOG_ROOT, handle, `${slug}.md`);

    if (!fs.existsSync(reviewPath)) {
      return new Response(JSON.stringify({ error: 'Post not found in review' }), { status: 404 });
    }

    // Read and update visibility to unlisted if not already set
    const raw = fs.readFileSync(reviewPath, 'utf8');
    const parsed = matter(raw);
    if (!parsed.data.visibility) parsed.data.visibility = 'unlisted';

    // Write to published dir
    fs.mkdirSync(path.join(BLOG_ROOT, handle), { recursive: true });
    fs.writeFileSync(publishPath, raw);

    // Remove from review
    fs.unlinkSync(reviewPath);

    // Git push async (don't await — fire and forget)
    setTimeout(() => gitPush(slug, handle, 'approve'), 100);

    const url = `${SITE_BASE_URL}/u/${handle}/${slug}`;
    return new Response(JSON.stringify({ ok: true, url }), { status: 200 });
  }

  // ── REJECT: delete from _review ───────────────────────────────────────────
  if (action === 'reject') {
    const reviewPath = path.join(BLOG_ROOT, '_review', handle, `${slug}.md`);

    if (!fs.existsSync(reviewPath)) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    fs.unlinkSync(reviewPath);

    // Also remove hero image if present
    try {
      const heroPath = path.join(process.cwd(), 'public', 'blog-images', handle, `${slug}.jpg`);
      if (fs.existsSync(heroPath)) fs.unlinkSync(heroPath);
    } catch {}

    setTimeout(() => gitPush(slug, handle, 'reject'), 100);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  // ── VISIBILITY: toggle public/unlisted ────────────────────────────────────
  if (action === 'visibility') {
    if (visibility !== 'public' && visibility !== 'unlisted') {
      return new Response(JSON.stringify({ error: 'Invalid visibility value' }), { status: 400 });
    }

    const publishPath = path.join(BLOG_ROOT, handle, `${slug}.md`);

    if (!fs.existsSync(publishPath)) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    const raw = fs.readFileSync(publishPath, 'utf8');
    const updated = raw.replace(
      /^visibility:.*$/m,
      `visibility: "${visibility}"`
    );

    fs.writeFileSync(publishPath, updated);

    setTimeout(() => gitPush(slug, handle, `set-${visibility}`), 100);

    return new Response(JSON.stringify({ ok: true, visibility }), { status: 200 });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};
