'use server';
/**
 * @fileOverview A Genkit flow to generate practice quizzes from e-book content.
 *
 * - aiQuizGenerator - A function that generates a quiz from provided topic and description.
 * - AiQuizGeneratorInput - The input type for the aiQuizGenerator function.
 * - AiQuizGeneratorOutput - The return type for the aiQuizGenerator function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiQuizGeneratorInputSchema = z.object({
  topic: z.string().describe('The title or main topic of the e-book.'),
  description: z.string().optional().describe('A summary or description of the e-book content.'),
});
export type AiQuizGeneratorInput = z.infer<typeof AiQuizGeneratorInputSchema>;

const AiQuizGeneratorOutputSchema = z.object({
  quiz: z
    .array(
      z.object({
        question: z.string().describe('The question text for a multiple-choice question.'),
        options: z
          .array(z.string())
          .describe('An array of possible answers for the question. There should be exactly 4 options.'),
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
  prompt: `You are MED-X AI, an expert medical educator specializing in creating high-yield practice questions for university students.

Your task is to generate a professional, multiple-choice practice quiz based on the following topic and description.

Topic: {{{topic}}}
Description: {{{description}}}

Instructions:
1. Generate between 5 and 10 questions.
2. Each question must have exactly 4 clear and distinct options.
3. Ensure the questions focus on the most important academic concepts relevant to a medical or health sciences student.
4. The difficulty should be appropriate for 100-200 level university courses.
5. Use clear, unambiguous language.`,
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
