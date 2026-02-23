'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PremiumPage() {
  const router = useRouter();
  const paystackLink = "https://paystack.shop/pay/med-x";

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
          <h1 className="text-4xl font-bold tracking-tight">Unlock Premium Access</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Supercharge your studies with exclusive content and features.
          </p>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Premium Plan</CardTitle>
            <CardDescription>Get full access to all materials.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground mt-4">
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
            <Button asChild className="w-full">
              <Link href={paystackLink} target="_blank">
                <Star className="mr-2 h-4 w-4" />
                Upgrade via Paystack
              </Link>
            </Button>
          </CardFooter>
        </Card>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
            You will be redirected to Paystack to complete your secure payment. Account upgrades are currently processed manually after payment confirmation.
        </p>
      </div>
    </div>
  );
}
