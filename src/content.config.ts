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

const vedantaSchools = defineCollection({
  type: 'content',
  schema: z.object({
    name:          z.string(),
    tagline:       z.string(),
    founder:       z.string(),
    coreTeaching:  z.string(),
    keyTexts:      z.array(z.string()),
    difficulty:    z.enum(['beginner', 'intermediate', 'advanced']),
  }),
});

const vedantaVerses = defineCollection({
  type: 'content',
  schema: z.object({
    sanskrit:             z.string(),
    transliteration:      z.string(),
    translation:          z.string(),
    wordByWord:           z.string(),
    commentary:           z.string(),
    realLifeObservation:  z.string(),
    audioUrl:             z.string().optional(),
    source:               z.object({ chapter: z.number(), verse: z.number() }),
    school:               z.string(),
  }),
});

const vedantaChronology = defineCollection({
  type: 'content',
  schema: z.object({
    era:           z.string(),
    dateRange:     z.string(),
    title:         z.string(),
    description:   z.string(),
    linkedSchool:  z.string().optional(),
    linkedTexts:   z.array(z.string()).optional(),
  }),
});

export const collections = { blog, vedantaSchools, vedantaVerses, vedantaChronology };
