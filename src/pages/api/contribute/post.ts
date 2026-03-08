// src/pages/api/contribute/post.ts
// GET ?slug={slug} — returns frontmatter + markdown body of a published post

import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_ROOT = path.join(process.cwd(), 'src/content/blog');

export const GET: APIRoute = async ({ url, cookies }) => {
  const session = await getSession(cookies);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' }
    });
  }

  const slug = url.searchParams.get('slug') ?? '';
  if (!slug || slug.includes('..') || slug.includes('/')) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const filePath = path.join(BLOG_ROOT, session.handle, `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  return new Response(JSON.stringify({ frontmatter: data, body: content.trim() }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
