"use server";

import { z } from "zod";

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
