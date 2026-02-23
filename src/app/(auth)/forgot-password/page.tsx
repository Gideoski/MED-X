'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import { useState, useTransition } from "react";
import { useAuth } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const auth = useAuth();
  const { toast } = useToast();
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    startTransition(() => {
      sendPasswordResetEmail(auth, email)
        .then(() => {
          setEmailSent(true);
          toast({
            title: "Password Reset Email Sent",
            description: "Check your inbox for instructions to reset your password.",
          });
        })
        .catch((error) => {
          let errorMessage = "An unknown error occurred.";
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            // To prevent email enumeration, we can show a generic success message.
            // This is a security best practice.
            setEmailSent(true); 
             toast({
                title: "Password Reset Email Sent",
                description: "If an account exists for this email, you'll receive a link to reset your password shortly.",
            });
          } else {
             toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
          }
        });
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo className="h-12 w-12 text-primary mx-auto" />
          </Link>
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <CardDescription>
            {emailSent 
              ? "Check your email for a reset link."
              : "Enter your email to receive a password reset link."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                If you don&apos;t see the email, please check your spam folder.
              </p>
              <Button asChild variant="outline">
                <Link href="/login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isPending}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Sending..." : "Send Reset Link"}
                </Button>
                 <Button variant="link" asChild className="w-full">
                    <Link href="/login">
                      Back to Login
                    </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
