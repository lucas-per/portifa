import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const testResultSchema = z.object({
  status: z.enum(['verified', 'warning', 'unavailable']),
  label: z.string(),
});

const highlightSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const titleDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/cases' }),
  schema: ({ image }) =>
    z.object({
      // Metadados de card/listagem (PRD 4.2, seção 5)
      title: z.string(),
      shortDescription: z.string(),
      status: z.enum(['published', 'coming-soon']),
      tags: z.array(z.string()),
      publishedDate: z.coerce.date(),

      // Conteúdo da página dedicada — espelha as seções do frame
      // desktop-case no Figma. Cada bloco (exceto summary) é opcional:
      // nem todo case precisa ter todas as seções.
      content: z.object({
        summary: z.string(),
        context: z
          .object({
            description: z.string(),
            image: image(),
            caption: z.string(),
          })
          .optional(),
        problems: z.object({ description: z.string() }).optional(),
        discovery: z
          .object({
            intro: z.string(),
            phases: z.array(
              z.object({
                title: z.string(),
                subtitle: z.string(),
                description: z.string(),
              })
            ),
          })
          .optional(),
        exploration: z
          .object({
            title: z.string(),
            description: z.string(),
            images: z.array(image()),
          })
          .optional(),
        pd: z
          .object({
            title: z.string(),
            description: z.string(),
            images: z.array(image()),
          })
          .optional(),
        tests: z
          .object({
            groups: z.array(
              z.object({
                title: z.string(),
                results: z.array(testResultSchema),
              })
            ),
          })
          .optional(),
        delivery: z
          .object({
            myRole: titleDescriptionSchema,
            designSystem: titleDescriptionSchema.extend({
              images: z.array(image()).optional(),
            }),
            home: titleDescriptionSchema.extend({
              images: z.array(image()).optional(),
            }),
          })
          .optional(),
        impact: z
          .object({
            highlights: z.array(highlightSchema),
            description: z.string(),
          })
          .optional(),
        plansAhead: z
          .object({
            privacy: titleDescriptionSchema,
            pains: titleDescriptionSchema,
          })
          .optional(),
      }),
    }),
});

export const collections = { cases };
