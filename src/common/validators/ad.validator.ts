import { z } from 'zod';

export const adTypes = [
  'slider',
  'right-top',
  'right-bottom',
  'post-ad',
] as const;

export const createAdSchema = z.object({
  type: z.enum(adTypes),
  content: z.any(), // You can refine this for stricter validation
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const updateAdSchema = z.object({
  content: z.any().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
}); 