import { z } from 'zod';
import { QuestionCategory, QuestionComplexity } from '@/types/question.types';

const testCaseSchema = z.object({
  input: z.string().trim().min(1, { message: "Input is required" }),
  expectedOutput: z.string().trim().min(1, { message: "Expected output is required" }),
});

export const questionSchema = z.object({
  title: z.string().trim().min(1, { message: "Title is required" }).max(100, { message: "Title must be 100 characters or less" }),
  description: z.string().trim().min(1, { message: "Description is required" }).max(1000, { message: "Description must be 1000 characters or less" }),
  categories: z.array(z.nativeEnum(QuestionCategory))
    .min(1, { message: "At least one category is required" })
    .max(5, { message: "Maximum 5 categories allowed" }),
  complexity: z.nativeEnum(QuestionComplexity, {
    errorMap: () => ({ message: "Please select a valid complexity level" })
  }),
  testCases: z.array(testCaseSchema)
    .min(1, { message: "At least one test case is required" })
    .max(10, { message: "Maximum 10 test cases allowed" }),
});

export type QuestionFormData = z.infer<typeof questionSchema>;