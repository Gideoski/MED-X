import { FeedbackForm } from "@/components/feedback-help/feedback-form";
import { HelpBot } from "@/components/feedback-help/help-bot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function FeedbackHelpPage() {
  return (
    <div className="space-y-8">
       <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Feedback & Help</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          We're here to help and listen to your feedback.
        </p>
      </header>

      <Tabs defaultValue="help" className="w-full max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="help">AI Help</TabsTrigger>
          <TabsTrigger value="feedback">Submit Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="help">
          <HelpBot />
        </TabsContent>
        <TabsContent value="feedback">
          <FeedbackForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
