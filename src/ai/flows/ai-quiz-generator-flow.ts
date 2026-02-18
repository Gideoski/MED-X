'use server';
/**
 * @fileOverview A Genkit flow to generate practice quizzes from e-book content.
 *
 * - aiQuizGenerator - A function that generates a quiz from provided e-book content.
 * - AiQuizGeneratorInput - The input type for the aiQuizGenerator function.
 * - AiQuizGeneratorOutput - The return type for the aiQuizGenerator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiQuizGeneratorInputSchema = z.object({
  eBookContent: z
    .string()
    .describe('The comprehensive content of the e-book from which to generate a practice quiz.'),
});
export type AiQuizGeneratorInput = z.infer<typeof AiQuizGeneratorInputSchema>;

const AiQuizGeneratorOutputSchema = z.object({
  quiz: z
    .array(
      z.object({
        question: z.string().describe('The question text for a multiple-choice question.'),
        options: z
          .array(z.string())
          .describe('An array of possible answers for the question. There should be 4 options.'),
        correctAnswer: z.string().describe('The correct answer from the provided options.'),
      })
    )
    .describe('An array of multiple-choice questions forming the practice quiz.'),
});
export type AiQuizGeneratorOutput = z.infer<typeof AiQuizGeneratorOutputSchema>;

export async function aiQuizGenerator(
  input: AiQuizGeneratorInput
): Promise<AiQuizGeneratorOutput> {
  return aiQuizGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiQuizGeneratorPrompt',
  input: { schema: AiQuizGeneratorInputSchema },
  output: { schema: AiQuizGeneratorOutputSchema },
  prompt: `You are an AI assistant specialized in creating educational quizzes.
Your task is to generate a multiple-choice practice quiz based on the provided e-book content.

Generate between 5 and 10 multiple-choice questions. Each question must have exactly 4 options, and one of them must be the correct answer.
Ensure that the questions cover key concepts and details from the e-book content.

E-book Content:
{{eBookContent}}`,
});

const aiQuizGeneratorFlow = ai.defineFlow(
  {
    name: 'aiQuizGeneratorFlow',
    inputSchema: AiQuizGeneratorInputSchema,
    outputSchema: AiQuizGeneratorOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
