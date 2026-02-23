'use client';

import { creators } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, addDoc, doc } from "firebase/firestore";
import Link from "next/link";

export default function CreatorsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [contentType, setContentType] = useState('free');
  const [filePath, setFilePath] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Check for admin role
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role?: string }>(userDocRef);
  const isAdmin = userProfile?.role === 'admin';

  // Check for verified creator status
  const creatorProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, 'creator_profiles', user.uid);
  }, [firestore, user]);
  const { data: creatorProfile, isLoading: isCreatorLoading } = useDoc<{ verifiedByAdmin?: boolean }>(creatorProfileRef);
  const isVerifiedCreator = creatorProfile?.verifiedByAdmin === true;

  const canUpload = isAdmin || isVerifiedCreator;
  const isLoading = isUserLoading || isProfileLoading || isCreatorLoading;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !level || !description || !filePath) {
      toast({
        title: "Incomplete Form",
        description: "Please fill out all fields, including the PDF link.",
        variant: "destructive",
      });
      return;
    }
    if (!user || !firestore || !canUpload) {
        toast({
            title: "Authorization Required",
            description: "You are not authorized to upload content.",
            variant: "destructive",
        });
        return;
    }

    startTransition(async () => {
      try {
        const collectionName = `materials_${level}lvl_${contentType === 'premium' ? 'premium' : 'free'}`;
        const collectionRef = collection(firestore, collectionName);
        const newEbookData = {
            title,
            description,
            author: 'MED-X',
            level: parseInt(level),
            isPremium: contentType === 'premium',
            coverImage: `https://picsum.photos/seed/${Math.random().toString().slice(2)}/300/400`,
            imageHint: "book cover abstract",
            creatorId: user.uid,
            uploadDate: new Date().toISOString(),
            lastUpdateDate: new Date().toISOString(),
            filePath: filePath,
            type: 'E-Book',
            downloads: 0,
        };
        await addDoc(collectionRef, newEbookData);
        toast({
          title: "Submission Successful",
          description: `"${title}" has been submitted and is now available.`,
        });

        // Reset form
        setTitle('');
        setDescription('');
        setLevel('');
        setContentType('free');
        setFilePath('');
        if (e.target instanceof HTMLFormElement) {
          e.target.reset();
        }
      } catch (error) {
        console.error("Submission Error:", error);
        toast({
          title: "Submission Failed",
          description: "An unexpected error occurred while submitting. Please try again.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Meet the MED-X Creators</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The team dedicated to helping you study smarter.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {creators.map((creator) => (
          <Card key={creator.id} className="text-center">
            <CardHeader className="items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={creator.avatar} alt={creator.name} data-ai-hint={creator.imageHint} />
                <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent>
              <CardTitle>{creator.name}</CardTitle>
              <CardDescription className="text-primary">{creator.title}</CardDescription>
              <p className="mt-4 text-sm text-muted-foreground">{creator.bio}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      
      <section>
        {isLoading ? (
            <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        ) : canUpload ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Creator Content Submission</CardTitle>
              <CardDescription>Submit your new e-book using the form below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">E-Book Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Intro to Human Anatomy" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">E-Book Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide a brief summary of the e-book's content." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isPending}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="level">Level</Label>
                        <Select 
                          value={level} 
                          onValueChange={setLevel}
                          disabled={isPending}
                        >
                            <SelectTrigger id="level">
                                <SelectValue placeholder="Select a level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="100">100 Level</SelectItem>
                                <SelectItem value="200">200 Level</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Content Type</Label>
                        <RadioGroup 
                          value={contentType}
                          onValueChange={setContentType}
                          disabled={isPending}
                          className="flex items-center pt-2 space-x-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="free" id="free" />
                                <Label htmlFor="free" className="font-normal">Free</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="premium" id="premium" />
                                <Label htmlFor="premium" className="font-normal">Premium</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-path">PDF Link</Label>
                  <Input
                    id="file-path"
                    type="url"
                    placeholder="https://your-public-pdf-link.com/file.pdf"
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    disabled={isPending}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload your PDF to a service like Google Drive. Right-click the file, select "Share", and change access to "Anyone with the link". Then copy and paste the link here.
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={!canUpload || isPending}>
                  {isPending ? 'Submitting...' : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Content
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <CardTitle>Become a Creator</CardTitle>
              <CardDescription>Share your knowledge with the MED-X community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">To maintain the quality of our content, we verify all creators. If you're interested in contributing, please contact an admin for verification.</p>
              <Button asChild>
                <Link href="https://wa.me/2347087088090" target="_blank">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Admin for Verification
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
