import { z } from 'zod';

export const comboItemSchema = z.object({ foodId: z.string().min(1), grams: z.number().finite().min(0.1).max(10000).multipleOf(0.1) }).strict();
export const comboItemsSchema = z.array(comboItemSchema).min(1).max(50);
export type ComboItem = z.infer<typeof comboItemSchema>;
