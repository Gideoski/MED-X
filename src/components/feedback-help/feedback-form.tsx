"use client";

import { useState, useTransition, useEffect } from "react";
import { submitFeedback } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

function SubmitButton({ pending }: { pending: boolean }) {
  return <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Send Feedback"}</Button>;
}

export function FeedbackForm() {
  const [state, setState] = useState<{ message: string | null; errors: { feedback?: string[] } }>({ message: null, errors: {} });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [feedbackText, setFeedbackText] = useState("");

  useEffect(() => {
    if (state.message && !state.errors.feedback) {
      toast({
        title: "Success!",
        description: state.message,
      });
      setFeedbackText(""); // Clear textarea on success
    } else if (state.message && state.errors.feedback) {
        toast({
            title: "Error",
            description: state.errors.feedback.join(", "),
            variant: "destructive",
        })
    }
  }, [state, toast]);

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await submitFeedback(state, formData);
      setState(result);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Have a suggestion or found a bug? Let us know!</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
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
            {state.errors?.feedback &&
              state.errors.feedback.map((error: string) => (
                <p className="mt-2 text-sm text-destructive" key={error}>
                  {error}
                </p>
              ))}
          </div>
          <SubmitButton pending={isPending} />
        </form>
      </CardContent>
    </Card>
  );
}
