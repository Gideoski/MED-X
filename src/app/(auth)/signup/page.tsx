'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/logo";
import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";


export default function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPending, startTransition] = useTransition();
    const auth = useAuth();
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        if (user && !isUserLoading) {
            router.replace("/home");
        }
    }, [user, isUserLoading, router]);

    const handleSignup = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                title: "Signup Failed",
                description: "Passwords do not match.",
                variant: "destructive",
            });
            return;
        }
        if (password.length < 6) {
             toast({
                title: "Signup Failed",
                description: "Password should be at least 6 characters.",
                variant: "destructive",
            });
            return;
        }
        startTransition(() => {
            createUserWithEmailAndPassword(auth, email, password)
                .then(async (userCredential) => {
                    const newUser = userCredential.user;
                    const userDocRef = doc(firestore, "users", newUser.uid);
                    
                    const userProfile = {
                        id: newUser.uid,
                        email: newUser.email,
                        role: "student",
                        isPremium: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        lastLoginAt: new Date().toISOString()
                    };

                    try {
                        await setDoc(userDocRef, userProfile);
                    } catch (firestoreError) {
                        console.error("Error creating user profile in Firestore:", firestoreError);
                        toast({
                            title: "Signup Warning",
                            description: "Account created, but failed to save profile. Some features might not work.",
                            variant: "destructive",
                        });
                    }
                })
                .catch((error) => {
                    let errorMessage = "An unknown error occurred.";
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = "This email address is already in use.";
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = "Please enter a valid email address.";
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = "The password is too weak.";
                    }
                    toast({
                        title: "Signup Failed",
                        description: errorMessage,
                        variant: "destructive",
                    });
                });
        });
    };

    if (isUserLoading || user) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
             <Logo className="h-12 w-12 text-primary mx-auto" />
          </Link>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
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
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"} 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isPending}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input 
                        id="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"} 
                        required 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isPending}
                    />
                     <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Creating account..." : "Create an account"}
                </Button>
              </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
