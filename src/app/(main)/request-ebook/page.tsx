import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PencilRuler } from "lucide-react";

export default function RequestEbookPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PencilRuler className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4 text-2xl">Request Custom E-book</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This feature is coming soon! You'll be able to request personalized e-books and study materials tailored to your specific needs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
