"use client";

import { useActionState, useFormStatus } from "react";
import { submitFeedback } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Send Feedback"}</Button>;
}

export function FeedbackForm() {
  const initialState = { message: null, errors: {} };
  const [state, dispatch] = useActionState(submitFeedback, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message && !state.errors.feedback) {
      toast({
        title: "Success!",
        description: state.message,
      });
    } else if (state.message && state.errors.feedback) {
        toast({
            title: "Error",
            description: state.errors.feedback.join(", "),
            variant: "destructive",
        })
    }
  }, [state, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>Have a suggestion or found a bug? Let us know!</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={dispatch} className="space-y-4">
          <Textarea
            name="feedback"
            placeholder="Tell us what you think..."
            rows={5}
            aria-describedby="feedback-error"
          />
          <div id="feedback-error" aria-live="polite" aria-atomic="true">
            {state.errors?.feedback &&
              state.errors.feedback.map((error: string) => (
                <p className="mt-2 text-sm text-destructive" key={error}>
                  {error}
                </p>
              ))}
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
