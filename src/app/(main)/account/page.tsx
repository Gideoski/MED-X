
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { useState, useTransition, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc } from "firebase/firestore";
import { Star, RefreshCw, ShieldCheck } from "lucide-react";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);

  const [name, setName] = useState('');

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ isPremium: boolean; role?: string; createdAt?: string; id?: string }>(userDocRef);
  const isPremium = userProfile?.isPremium ?? false;

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
    }
  }, [user]);

  // SELF-HEALING: Specifically repairs accounts like vZ5HFJ1bGrRG9ABK28V6FsCmfDF3
  // It ONLY triggers if fields are strictly undefined, ensuring no overrides of manual roles.
  useEffect(() => {
    if (user && userProfile && !isProfileLoading && firestore) {
      const isMissingFields = 
        userProfile.isPremium === undefined || 
        userProfile.role === undefined || 
        userProfile.id === undefined;
      
      if (isMissingFields) {
        const ref = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(ref, {
          id: user.uid,
          email: user.email,
          role: userProfile.role ?? "student",
          isPremium: userProfile.isPremium ?? false,
          updatedAt: new Date().toISOString(),
          createdAt: userProfile.createdAt || new Date().toISOString()
        });
      }
    }
  }, [user, userProfile, isProfileLoading, firestore]);

  const handleProfileUpdate = () => {
    if (!user) return;

    startTransition(async () => {
      try {
        await updateProfile(user, {
          displayName: name,
        });
        toast({
          title: "Success",
          description: "Your profile has been updated.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update your profile. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const handleVerifyPaymentStatus = async () => {
    if (!user || !firestore || !userDocRef) return;
    
    setIsVerifying(true);
    toast({
      title: "Syncing...",
      description: "Checking payment records for your account.",
    });

    try {
        const freshDoc = await getDoc(userDocRef);
        if (freshDoc.exists()) {
            const data = freshDoc.data();
            if (data.isPremium) {
                toast({
                    title: "Sync Complete",
                    description: "Your Premium status is active.",
                });
            } else {
                toast({
                    title: "No Recent Payment Found",
                    description: "If you just paid, please wait a moment or contact support.",
                    variant: "destructive"
                });
            }
        }
    } catch (e) {
        toast({
            title: "Verification Failed",
            description: "Could not reach the server. Check your connection.",
            variant: "destructive"
        });
    } finally {
        setIsVerifying(false);
    }
  };

  if (isUserLoading || isProfileLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="flex h-screen w-full items-center justify-center">Please log in to view your account details.</div>;
  }
  
  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account and subscription details.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
              <AvatarFallback>{user.email ? user.email.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <p className="text-sm text-muted-foreground">Profile photo is managed through your email provider.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your name" 
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user.email || ''} disabled />
            </div>
          </div>
          <Button onClick={handleProfileUpdate} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>Manage your subscription plan and verify recent payments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border p-6 bg-muted/20 gap-4">
                <div className="space-y-1">
                    <h3 className="font-bold text-lg">Current Status</h3>
                    <div className="flex items-center gap-2">
                        <Badge variant={isPremium ? 'default' : 'secondary'} className="h-6">
                            {isPremium ? 'Premium Active' : 'Free Account'}
                        </Badge>
                        {isPremium && <ShieldCheck className="h-5 w-5 text-primary" />}
                    </div>
                </div>
                <div className="flex gap-2">
                    {!isPremium ? (
                      <Button asChild>
                        <Link href="/premium">
                          <Star className="mr-2 h-4 w-4 fill-primary-foreground" />
                          Upgrade to Premium
                        </Link>
                      </Button>
                    ) : (
                      <Badge variant="outline" className="py-2 px-4 border-primary text-primary font-bold">
                        Full Access Enabled
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={handleVerifyPaymentStatus} disabled={isVerifying}>
                        <RefreshCw className={cn("h-4 w-4 mr-2", isVerifying && "animate-spin")} />
                        Refresh Plan
                    </Button>
                </div>
            </div>
            {!isPremium && (
                <p className="text-xs text-muted-foreground">
                    If you just completed a payment but your status hasn't changed, click <strong>Refresh Plan</strong> to sync.
                </p>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Update your security settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">To change your password, please use the "Forgot Password" flow from the login page.</p>
            <Button variant="outline" asChild>
                <Link href="/forgot-password">Reset Password</Link>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
