
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { addMonths } from "date-fns";

/**
 * PAYSTACK PUBLIC KEY
 * Replace the value below with your actual Public Key from your Paystack Dashboard.
 * For client-side "Inline" payments, you ONLY need the Public Key.
 */
const PAYSTACK_PUBLIC_KEY = "pk_live_061de069f6b6297fa83776862db1293e738899ec";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PremiumPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpgrade = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your account.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    if (!window.PaystackPop) {
      toast({
        title: "Payment Error",
        description: "Payment system is still loading. Please try again in a moment.",
        variant: "destructive",
      });
      return;
    }

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: 2000 * 100, // 2000 NGN in kobo
      currency: 'NGN',
      callback: (response: any) => {
        // Payment successful! The callback provides a reference number.
        handlePaymentSuccess(response.reference);
      },
      onClose: () => {
        toast({
          title: "Payment Cancelled",
          description: "You closed the payment window.",
        });
      }
    });

    handler.openIframe();
  };

  const handlePaymentSuccess = async (reference: string) => {
    if (!user || !firestore) return;
    
    setIsProcessing(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    const expiryDate = addMonths(new Date(), 1);

    try {
      await updateDoc(userDocRef, {
        isPremium: true,
        subscriptionExpiresAt: expiryDate.toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Upgrade Successful!",
        description: "Your account has been automatically upgraded to Premium. Enjoy!",
      });
      router.replace("/home");
    } catch (error) {
      console.error("Error upgrading account:", error);
      toast({
        title: "Upgrade Error",
        description: "Your payment was successful, but we couldn't update your status automatically. Please contact support with reference: " + reference,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Button variant="outline" onClick={() => router.back()} disabled={isProcessing}>
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

        <Card className="w-full max-w-md border-primary/20 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Star className="h-8 w-8 text-primary fill-primary" />
            </div>
            <CardTitle className="text-2xl">Premium Plan</CardTitle>
            <CardDescription>Get full access to all materials for ₦2,000/month.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-muted-foreground mt-4">
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited access to all e-books.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" /> Download premium materials.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" /> Access to exclusive Q&A packs.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" /> AI-powered practice quizzes.
              </li>
              <li className="flex items-center">
                <Check className="mr-2 h-4 w-4 text-green-500" /> Priority support.
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={handleUpgrade}
                disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Upgrading...
                </>
              ) : (
                <>
                  <Star className="mr-2 h-5 w-5" />
                  Upgrade Now
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        <div className="text-sm text-muted-foreground text-center max-w-sm space-y-2">
            <p>Your account will be updated immediately after a successful payment.</p>
            <p className="text-[10px] opacity-70 italic">Secure payment processed by Paystack.</p>
        </div>
      </div>
    </div>
  );
}
