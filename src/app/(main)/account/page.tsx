'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useUser } from "@/firebase";
import { useState, useTransition, useEffect } from "react";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.displayName || '');
    }
  }, [user]);

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
        console.error("Profile update error:", error);
        toast({
          title: "Error",
          description: "Failed to update your profile. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  if (isUserLoading) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  if (!user) {
    // Or redirect to login page
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
            <Button variant="outline" disabled>Change Photo</Button>
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
          <CardDescription>Manage your subscription plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                    <h3 className="font-semibold">Current Plan</h3>
                    <p className="text-muted-foreground">You are currently on the <Badge variant="secondary">Free</Badge> plan.</p>
                </div>
                <Button asChild>
                    <Link href="/premium">Upgrade to Premium</Link>
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password</Label>
              <Input id="confirm-new-password" type="password" />
            </div>
            <Button>Update Password</Button>
        </CardContent>
      </Card>

    </div>
  );
}
