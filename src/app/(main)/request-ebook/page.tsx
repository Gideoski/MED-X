import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilRuler, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function RequestEbookPage() {
  const formUrl = "https://forms.gle/wH2xGpwFjcmk4SeW8";

  return (
    <div className="flex h-full items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PencilRuler className="h-8 w-8" />
          </div>
          <CardTitle className="mt-4 text-2xl">Request a Custom E-book</CardTitle>
           <CardDescription>
            Specify the topic or material required by filling out the request form. Med-X will respond as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Click the button below to open the request form in a new tab. Detail the request as clearly as possible.
          </p>
          <Button asChild>
            <Link href={formUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Request Form
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
