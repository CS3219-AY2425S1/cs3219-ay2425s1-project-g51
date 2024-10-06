import { z } from 'zod';
import { QuestionCategory, QuestionComplexity } from '@/types/question.types';

export const questionSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(100, { message: "Title must be 100 characters or less" }),
  description: z.string().trim().min(1, { message: "Description is required" }).max(1000, { message: "Description must be 1000 characters or less" }),
  categories: z.array(z.nativeEnum(QuestionCategory))
    .min(1, { message: "At least one category is required" })
    .max(5, { message: "Maximum 5 categories allowed" }),
  complexity: z.nativeEnum(QuestionComplexity, {
    errorMap: () => ({ message: "Please select a valid complexity level" })
  }),
});

export type QuestionFormData = z.infer<typeof questionSchema>;