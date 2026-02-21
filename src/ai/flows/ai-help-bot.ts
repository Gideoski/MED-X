'use server';
/**
 * @fileOverview An AI-powered help bot for answering student questions about the Med-X platform and study topics.
 *
 * - aiHelpBot - A function that handles queries for the help bot.
 * - AiHelpBotInput - The input type for the aiHelpBot function.
 * - AiHelpBotOutput - The return type for the aiHelpBot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AiHelpBotInputSchema = z
  .string()
  .describe('The question posed by the user to the help bot.');
export type AiHelpBotInput = z.infer<typeof AiHelpBotInputSchema>;

const AiHelpBotOutputSchema = z
  .string()
  .describe('The answer provided by the help bot.');
export type AiHelpBotOutput = z.infer<typeof AiHelpBotOutputSchema>;

export async function aiHelpBot(input: AiHelpBotInput): Promise<AiHelpBotOutput> {
  return aiHelpBotFlow(input);
}

const helpBotPrompt = ai.definePrompt({
  name: 'aiHelpBotPrompt',
  input: {schema: AiHelpBotInputSchema},
  prompt: `You are MED-X, an AI-powered help bot designed to assist university students using the MED-X e-learning platform.
Your purpose is to provide quick and helpful answers to questions regarding:
1. The MED-X platform's features, navigation, and services (e.g., how to use the search bar, what are premium subscriptions, where to find 100lvl materials, how to submit feedback, what is the request custom e-book page).
2. General study topics and advice, especially those relevant to medical, pharmacy, and allied health students, aligning with the "study smarter, not harder" philosophy of MED-X.

Respond clearly, concisely, and professionally. If you are asked a question outside these domains, politely state that you can only assist with platform-related or study-related queries.

User Question: {{{this}}}`,
});

const aiHelpBotFlow = ai.defineFlow(
  {
    name: 'aiHelpBotFlow',
    inputSchema: AiHelpBotInputSchema,
    outputSchema: AiHelpBotOutputSchema,
  },
  async input => {
    const response = await helpBotPrompt(input);
    return response.text;
  }
);
