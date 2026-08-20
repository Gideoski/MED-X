'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Star, Lock, Info, ExternalLink, Calendar } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import Link from "next/link";
import { doc } from "firebase/firestore";
import { useEffect } from "react";
import { isAfter } from "date-fns";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function TutorialsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ isPremium: boolean; subscriptionExpiresAt?: string }>(userDocRef);
  
  // Smart Premium Logic
  const isPremium = userProfile?.isPremium && (
    !userProfile.subscriptionExpiresAt || 
    isAfter(new Date(userProfile.subscriptionExpiresAt), new Date())
  );

  const configRef = useMemoFirebase(() => (firestore ? doc(firestore, 'config', 'global') : null), [firestore]);
  const { data: appConfig } = useDoc<{ tutorialLink?: string; tutorialStatus?: string }>(configRef);

  // Auto-downgrade check
  useEffect(() => {
    if (userProfile?.isPremium && userProfile.subscriptionExpiresAt && firestore && user) {
      if (isAfter(new Date(), new Date(userProfile.subscriptionExpiresAt))) {
        updateDocumentNonBlocking(doc(firestore, 'users', user.uid), {
          isPremium: false,
          updatedAt: new Date().toISOString()
        });
      }
    }
  }, [userProfile, firestore, user]);

  if (isUserLoading || isProfileLoading) {
    return <div className="flex h-[60vh] items-center justify-center text-muted-foreground animate-pulse">Checking access...</div>;
  }

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 space-y-6">
        <div className="bg-destructive/10 p-6 rounded-full"><Lock className="h-12 w-12 text-destructive" /></div>
        <div className="text-center max-w-md space-y-2">
          <h1 className="text-3xl font-bold">Premium Tutorials</h1>
          <p className="text-muted-foreground text-lg">Live interactive classes and recorded seminars are exclusive to Med-X Premium members.</p>
        </div>
        <Button asChild size="lg" className="h-14 px-10 font-bold shadow-xl"><Link href="/premium"><Star className="mr-2 h-5 w-5 fill-primary-foreground" /> Upgrade to Join</Link></Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Live Study Hub</h1>
        <p className="text-muted-foreground text-lg">Join live sessions and interact with the Med-X team.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2 border-primary/20 shadow-lg overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4"><Badge variant="default" className="bg-green-600">Premium Access</Badge></div>
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3"><Video className="h-7 w-7 text-primary" /> Active Session</CardTitle>
            <CardDescription>Join our current or upcoming tutorial session.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 py-6 border-y bg-muted/20">
            {appConfig?.tutorialLink ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-background border flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-full animate-pulse"><Video className="h-6 w-6 text-green-600" /></div>
                  <div>
                    <p className="font-bold text-lg text-green-600 uppercase tracking-wide">Live Now</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[200px] md:max-w-md">{appConfig.tutorialLink}</p>
                  </div>
                </div>
                <Button asChild size="lg" className="w-full h-16 text-xl font-bold shadow-2xl hover:scale-[1.02] transition-transform">
                  <Link href={appConfig.tutorialLink} target="_blank"><ExternalLink className="mr-2 h-6 w-6" /> Join Meeting Now</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <div className="bg-muted p-4 rounded-full w-fit mx-auto"><Calendar className="h-10 w-10 text-muted-foreground" /></div>
                <div className="space-y-1">
                  <p className="text-xl font-bold">No Active Meeting</p>
                  <p className="text-muted-foreground italic">Check the WhatsApp channel for schedule updates.</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-muted/30 py-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4" /> Recommendation: Use Google Meet for the best experience.
          </CardFooter>
        </Card>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-lg">Tips for Success</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3"><div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">1</div><p>Mute your microphone when joining.</p></div>
              <div className="flex gap-3"><div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">2</div><p>Keep your e-books open in another tab.</p></div>
              <div className="flex gap-3"><div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">3</div><p>Use the chat for specific questions.</p></div>
            </CardContent>
          </Card>
          
          <Button asChild variant="outline" className="w-full border-primary text-primary font-bold"><Link href="https://tinyurl.com/medxchannel" target="_blank">Join Channel for Alerts</Link></Button>
        </div>
      </div>
    </div>
  );
}
