"use client";

import { useState, useTransition, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";
import { z } from 'zod';

const feedbackSchema = z.string().min(10, { message: "Feedback must be at least 10 characters long." });

function SubmitButton({ pending }: { pending: boolean }) {
  return <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Send Feedback"}</Button>;
}

export function FeedbackForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [feedbackText, setFeedbackText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const firestore = useFirestore();
  const { user } = useUser();

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = feedbackSchema.safeParse(feedbackText);
    if (!validation.success) {
      const errorMessage = validation.error.flatten().formErrors.join(", ");
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    if (!firestore) {
        toast({
            title: "Error",
            description: "Database connection not available. Please try again later.",
            variant: "destructive",
        });
        return;
    };

    startTransition(async () => {
      try {
        const feedbackData = {
          message: feedbackText,
          submittedAt: new Date().toISOString(),
          status: "New",
          userId: user?.uid ?? null,
          email: user?.email ?? null,
        };
        
        const feedbackCollection = collection(firestore, "feedback");
        await addDoc(feedbackCollection, feedbackData);

        toast({
          title: "Success!",
          description: "Thank you for your feedback!",
        });
        setFeedbackText("");
      } catch (e) {
        console.error("Feedback submission error: ", e);
        
        let description = "Could not submit your feedback. Please try again.";
        if (e instanceof Error && e.message.toLowerCase().includes("permission-denied")) {
            description = "You do not have permission to submit feedback.";
        }

        toast({
          title: "Error",
          description: description,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Have a suggestion or found a bug? Let us know!</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            name="feedback"
            placeholder="Tell us what you think..."
            rows={5}
            aria-describedby="feedback-error"
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            disabled={isPending}
          />
          <div id="feedback-error" aria-live="polite" aria-atomic="true">
            {error &&
                <p className="mt-2 text-sm text-destructive">
                  {error}
                </p>
            }
          </div>
          <SubmitButton pending={isPending} />
        </form>
      </CardContent>
    </Card>
  );
}
