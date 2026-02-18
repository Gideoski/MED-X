"use server";

import { z } from "zod";
import { aiHelpBot } from "@/ai/flows/ai-help-bot";

const feedbackSchema = z.object({
  feedback: z.string().min(10, { message: "Feedback must be at least 10 characters long." }),
});

export async function submitFeedback(prevState: any, formData: FormData) {
  const validatedFields = feedbackSchema.safeParse({
    feedback: formData.get("feedback"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors and try again.",
    };
  }

  // In a real application, you would send this to your email or a database.
  console.log("Feedback received:", validatedFields.data.feedback);

  return {
    message: "Thank you for your feedback!",
    errors: {},
  };
}

const helpBotSchema = z.string().min(1, { message: "Message cannot be empty." });

export async function askHelpBot(message: string) {
    const validatedMessage = helpBotSchema.safeParse(message);
    if(!validatedMessage.success) {
        return "Sorry, I didn't understand that. Please ask a valid question.";
    }

    try {
        const response = await aiHelpBot(validatedMessage.data);
        return response;
    } catch (error) {
        console.error("Error with AI Help Bot:", error);
        return "I'm sorry, I'm having trouble connecting right now. Please try again later.";
    }
}
