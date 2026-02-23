import { FeedbackForm } from "@/components/feedback-help/feedback-form";

export default function FeedbackHelpPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
       <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Submit Feedback</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Have a suggestion or found a bug? Let us know!
        </p>
      </header>

      <FeedbackForm />
    </div>
  );
}
