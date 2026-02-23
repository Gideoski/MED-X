'use client';

import { creators } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link, Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useTransition } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function CreatorsPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [contentType, setContentType] = useState('free');
  const [filePath, setFilePath] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

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
    if (!user || !firestore) {
        toast({
            title: "Authentication Required",
            description: "You must be logged in to upload content.",
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
            author: user.displayName || 'Anonymous Creator',
            level: parseInt(level),
            isPremium: contentType === 'premium',
            coverImage: `https://picsum.photos/seed/${Math.random().toString().slice(2)}/300/400`,
            imageHint: "book cover abstract",
            creatorId: user.uid,
            uploadDate: new Date().toISOString(),
            lastUpdateDate: new Date().toISOString(),
            filePath: filePath,
            type: 'E-Book',
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
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Creator Content Submission</CardTitle>
            <CardDescription>Verified creators can submit new content here.</CardDescription>
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
                  Paste a publicly accessible link to your PDF (e.g., from Google Drive or Dropbox).
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={!user || isPending}>
                {isPending ? 'Submitting...' : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Submit Content
                  </>
                )}
              </Button>
              {!user && <p className="text-xs text-center text-muted-foreground">Please log in to submit content.</p>}
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
