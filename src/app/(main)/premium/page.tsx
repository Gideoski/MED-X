'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
        </Button>
      </div>
      <div className="flex flex-col items-center justify-center space-y-8">
        <div className="text-center">
          <Badge variant="destructive" className="mb-2">
            <Star className="mr-1 h-3 w-3" />
            Coming Soon
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight">Unlock Premium Access</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Supercharge your studies with exclusive content and features.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Premium Plan</CardTitle>
            <CardDescription>All features, unlimited access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-4xl font-bold">
              Coming Soon
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" /> Unlimited access to all e-books.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" /> Download premium materials.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" /> Access to exclusive Q&A packs.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-primary" /> Priority support.
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" disabled>
              Get Notified
            </Button>
          </CardFooter>
        </Card>
        <p className="text-sm text-muted-foreground">Payment integration via Paystack is currently under development.</p>
      </div>
    </div>
  );
}
