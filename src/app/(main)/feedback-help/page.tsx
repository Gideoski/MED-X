import { FeedbackForm } from "@/components/feedback-help/feedback-form";
import { HelpBot } from "@/components/feedback-help/help-bot";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Bot } from "lucide-react";

export default function FeedbackHelpPage() {
  return (
    <Tabs defaultValue="feedback" className="w-full max-w-2xl mx-auto">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="feedback">
          <MessageSquare className="mr-2 h-4 w-4" />
          Submit Feedback
        </TabsTrigger>
        <TabsTrigger value="help">
          <Bot className="mr-2 h-4 w-4" />
          AI Help Bot
        </TabsTrigger>
      </TabsList>
      <TabsContent value="feedback">
        <FeedbackForm />
      </TabsContent>
      <TabsContent value="help">
        <HelpBot />
      </TabsContent>
    </Tabs>
  );
}
