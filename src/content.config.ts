import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	//loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	// Type-check frontmatter using a schema
	
	schema: z.object({
    title: z.string(),
    description: z.string(),
    //pubDate: z.string(), // keep string for now; can switch to z.coerce.date() later
	pubDate: z.coerce.date(),
    heroImage: z.string().optional(),

    user: z.string(),
    visibility: z.enum(["unlisted", "public"]).default("unlisted"),

    location: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    readTime: z.number().optional(),
	
	/*schema: ({ image }) =>
		z.object({
			title: z.string(),
			description: z.string(),
			// Transform string to Date object
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			*/
		}),
});

export const collections = { blog };
