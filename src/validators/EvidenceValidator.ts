import { z } from 'zod';
const createEvidenceSchema = z.object({
  type: z.enum(['file', 'note']).default('note'),
  note: z.string().optional(),
});
export { createEvidenceSchema };
