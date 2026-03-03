// src/pages/api/contribute/posts.ts
// Returns a yatri's recent published posts by reading the metadata JSON files.

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';

const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://vedicjourneys.vercel.app';

const ASTRO_BLOG_ROOT =
  process.env.ASTRO_BLOG_ROOT ||
  '/home/anandixit/vedicjourneys-site/vedicjourneys/src/content/blog';

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const handle = url.searchParams.get('handle') || session.handle;

  // Only allow fetching own posts
  if (handle !== session.handle) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const metaDir = path.join(ASTRO_BLOG_ROOT, handle, '_metadata');

    if (!fs.existsSync(metaDir)) {
      return new Response(JSON.stringify({ posts: [] }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const files = fs.readdirSync(metaDir)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 12); // last 12 posts

    const posts = files.map(f => {
      try {
        const meta = JSON.parse(fs.readFileSync(path.join(metaDir, f), 'utf8'));
        const slug = f.replace('.json', '');

        // Also try to read title from the markdown file
        const mdPath = path.join(ASTRO_BLOG_ROOT, handle, `${slug}.md`);
        let title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        let location = meta.resolvedLocation || null;
        let date = meta.generatedAt ? meta.generatedAt.split('T')[0] : '';

        if (fs.existsSync(mdPath)) {
          const md = fs.readFileSync(mdPath, 'utf8');
          const titleMatch = md.match(/^title:\s*"(.+)"/m);
          const locMatch = md.match(/^location:\s*"(.+)"/m);
          const dateMatch = md.match(/^pubDate:\s*(.+)/m);
          if (titleMatch) title = titleMatch[1];
          if (locMatch) location = locMatch[1];
          if (dateMatch) date = dateMatch[1].trim();
        }

        return {
          slug,
          title,
          location,
          date,
          url: `${SITE_BASE_URL}/u/${handle}/${slug}`,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return new Response(JSON.stringify({ posts }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};
