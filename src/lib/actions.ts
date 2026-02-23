'use server';

import { aiHelpBot } from '@/ai/flows/ai-help-bot';

export async function askHelpBot(question: string): Promise<string> {
  try {
    const answer = await aiHelpBot(question);
    return answer;
  } catch (error) {
    console.error("Error calling AI Help Bot:", error);
    return "I'm sorry, but I encountered an error while trying to generate a response. Please try again later.";
  }
}
