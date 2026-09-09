import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const testResultSchema = z.object({
  status: z.enum(['verified', 'warning', 'unavailable']),
  label: z.string(),
});

const titleDescriptionSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const valueLabelSchema = z.object({
  value: z.string(),
  label: z.string(),
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
      // Métricas de resultado exibidas no card da Home (ex: "+15%" / "Boletos
      // pagos") — distinto de content.impact.highlights, que é o bloco da
      // página dedicada de case.
      highlights: z.array(valueLabelSchema).optional(),
      publishedDate: z.coerce.date(),

      // Conteúdo da página dedicada — espelha as 7 seções do frame
      // desktop-case no Figma (Resumo, Contexto, Problema & Desafios,
      // Discovery, Delivery, Impacto, Visão de futuro). Cada bloco (exceto
      // summary) é opcional: nem todo case precisa ter todas as seções.
      content: z.object({
        summary: z.object({
          challenge: titleDescriptionSchema,
          solution: titleDescriptionSchema,
          results: titleDescriptionSchema,
        }),
        context: z
          .object({
            description: z.array(z.string()),
            image: image(),
            caption: z.string(),
          })
          .optional(),
        problems: z
          .object({
            intro: z.string(),
            hypothesis: z.string(),
            risks: z.array(z.string()),
            kpis: z.string(),
          })
          .optional(),
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
            exploration: z.object({
              title: z.string(),
              description: z.string(),
              images: z.array(image()),
            }),
            pd: z.object({
              title: z.string(),
              description: z.string(),
              images: z.array(image()),
            }),
            tests: z.object({
              intro: z.string(),
              groups: z.array(
                z.object({
                  title: z.string(),
                  results: z.array(testResultSchema),
                })
              ),
              outro: z.string(),
            }),
            consolidation: z.object({
              title: z.string(),
              description: z.string(),
            }),
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
            highlights: z.array(valueLabelSchema),
            description: z.array(z.string()),
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
