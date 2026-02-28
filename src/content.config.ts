// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title:              z.string(),
    description:        z.string(),
    pubDate:            z.coerce.date(),
    updatedDate:        z.coerce.date().optional(),
    heroImage:          z.string().optional(),
    user:               z.string().default('anand'),
    visibility:         z.enum(['unlisted', 'public', 'private']).default('unlisted'),
    location:           z.string().optional(),
    keywords:           z.array(z.string()).optional(),
    readTime:           z.number().optional(),
    qualityScore:       z.number().optional(),
    contextConfidence:  z.string().optional(),
  }),
});

export const collections = { blog };
