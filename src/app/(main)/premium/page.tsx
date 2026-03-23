
'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Check, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase";
import { usePaystackPayment } from "react-paystack";
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import { addMonths } from "date-fns";

export default function PremiumPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Configuration for Paystack
  // IMPORTANT: Replace this with your actual Public Key from the Paystack Dashboard
  // This is a test key for development.
  const publicKey = "pk_test_your_public_key_here";
  const amount = 2000 * 100; // Amount in kobo (2000 NGN)

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "",
    amount: amount,
    publicKey: publicKey,
  };

  const initializePayment = usePaystackPayment(config);

  const handleSuccess = (reference: any) => {
    if (!user || !firestore) return;
    
    setIsProcessing(true);
    const userDocRef = doc(firestore, 'users', user.uid);
    const expiryDate = addMonths(new Date(), 1);

    updateDoc(userDocRef, {
      isPremium: true,
      subscriptionExpiresAt: expiryDate.toISOString(),
      updatedAt: new Date().toISOString()
    })
    .then(() => {
      toast({
        title: "Upgrade Successful!",
        description: "Your account has been automatically upgraded to Premium.",
      });
      router.replace("/home");
    })
    .catch((error) => {
      console.error("Error upgrading account:", error);
      toast({
        title: "Upgrade Failed",
        description: "Payment was successful, but we couldn't update your account. Please contact support with your reference: " + reference.reference,
        variant: "destructive",
      });
    })
    .finally(() => {
      setIsProcessing(false);
    });
  };

  const handleClose = () => {
    toast({
      title: "Payment Cancelled",
      description: "You closed the payment window.",
    });
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
                onClick={() => initializePayment({onSuccess: handleSuccess, onClose: handleClose})}
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
