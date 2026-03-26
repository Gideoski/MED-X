
'use client';

import { defaultCreators, type Creator } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare, Loader2, ImageIcon, Plus, Trash2, Edit2, Save, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { collection, addDoc, doc, setDoc, query, orderBy } from "firebase/firestore";
import Link from "next/link";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CreatorsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Content Submission State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('100');
  const [categoryId, setCategoryId] = useState('');
  const [contentType, setContentType] = useState('free');
  const [filePath, setFilePath] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Fetch Categories for tagging
  const catQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: allCategories } = useCollection<{ id: string; name: string; level: number }>(catQuery);
  
  const filteredCategories = useMemo(() => {
    if (!allCategories) return [];
    return allCategories.filter(c => c.level === parseInt(level));
  }, [allCategories, level]);

  // Team Member Management State
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Creator | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberTitle, setMemberTitle] = useState('');
  const [memberBio, setMemberBio] = useState('');
  const [memberAvatarFile, setMemberAvatarFile] = useState<File | null>(null);

  // Deletion State
  const [memberToDelete, setMemberToDelete] = useState<Creator | null>(null);

  // Fetch Team Members
  const teamQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'team_members'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: teamMembers, isLoading: isTeamLoading } = useCollection<Creator>(teamQuery);

  // Roles Check
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role?: string }>(userDocRef);
  const isAdmin = userProfile?.role === 'admin';

  const creatorProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, 'creator_profiles', user.uid);
  }, [firestore, user]);
  const { data: creatorProfile, isLoading: isCreatorLoading } = useDoc<{ verifiedByAdmin?: boolean }>(creatorProfileRef);
  const isVerifiedCreator = creatorProfile?.verifiedByAdmin === true;

  const canUpload = isAdmin || isVerifiedCreator;
  const isLoading = isUserLoading || isProfileLoading || isCreatorLoading || isTeamLoading;

  const handleContentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !level || !description || !filePath) {
      toast({ title: "Incomplete Form", description: "Please fill out all fields.", variant: "destructive" });
      return;
    }
    
    // Capture state
    const currentTitle = title;
    const currentLevel = level;
    const currentCatId = categoryId;
    const currentDesc = description;
    const currentPath = filePath;
    const currentContentType = contentType;
    const currentFile = coverFile;

    // Reset UI instantly
    setTitle('');
    setDescription('');
    setCategoryId('');
    setFilePath('');
    setCoverFile(null);
    toast({ title: "Publishing...", description: "Your material is being uploaded to the database." });

    const performSubmission = async () => {
      try {
        let finalCoverUrl = currentLevel === '100' 
          ? '/images/med-x 100lvl ebook cover.jpeg' 
          : '/images/med-x logo.jpeg';

        if (currentFile) {
            finalCoverUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(currentFile);
            });
        }

        const collectionName = `materials_${currentLevel}lvl_${currentContentType === 'premium' ? 'premium' : 'free'}`;
        const collectionRef = collection(firestore!, collectionName);
        
        const newEbookData = {
            title: currentTitle,
            description: currentDesc,
            author: 'MED-X',
            level: parseInt(currentLevel),
            categoryId: currentCatId,
            isPremium: currentContentType === 'premium',
            coverImage: finalCoverUrl,
            imageHint: "book cover",
            creatorId: user!.uid,
            uploadDate: new Date().toISOString(),
            lastUpdateDate: new Date().toISOString(),
            filePath: currentPath,
            type: 'E-Book',
            downloads: 0,
        };
        await addDoc(collectionRef, newEbookData);
        toast({ title: "Published", description: `"${currentTitle}" is now live.` });
      } catch (error) {
        toast({ title: "Upload Failed", description: "Could not save material.", variant: "destructive" });
      }
    };
    performSubmission();
  };

  const handleMemberSubmit = () => {
    if (!memberName || !memberTitle || !memberBio || !firestore) {
      toast({ title: "Incomplete", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const isEditing = !!editingMember;
    const originalMember = editingMember;
    const currentName = memberName;
    const currentTitle = memberTitle;
    const currentBio = memberBio;
    const currentFile = memberAvatarFile;

    closeTeamDialog();
    toast({ title: 'Saving Profile', description: 'Updating team member details.' });

    const performSave = async () => {
      try {
        let avatarUrl = originalMember?.avatar || '/images/MED-X logo.jpeg';
        if (currentFile) {
            avatarUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(currentFile);
            });
        }
        const memberData = {
          name: currentName,
          title: currentTitle,
          bio: currentBio,
          avatar: avatarUrl,
          imageHint: "portrait",
          order: originalMember?.order ?? (teamMembers?.length || 0)
        };
        if (originalMember) {
          await setDoc(doc(firestore, 'team_members', originalMember.id), memberData, { merge: true });
        } else {
          await addDoc(collection(firestore, 'team_members'), memberData);
        }
        toast({ title: 'Success', description: `Team member updated.` });
      } catch (e) {
        toast({ title: "Error", description: "Save failed.", variant: "destructive" });
      }
    };
    performSave();
  };

  const handleDeleteMember = () => {
    if (!memberToDelete || !firestore) return;
    const original = memberToDelete;
    setMemberToDelete(null);
    try {
      deleteDocumentNonBlocking(doc(firestore, 'team_members', original.id));
      toast({ title: "Removed", description: `${original.name} removed.` });
    } catch (e) {
      toast({ title: "Error", description: "Removal failed.", variant: "destructive" });
    }
  };

  const openEditDialog = (member: Creator) => {
    setEditingMember(member);
    setMemberName(member.name);
    setMemberTitle(member.title);
    setMemberBio(member.bio);
    setMemberAvatarFile(null);
    setIsTeamDialogOpen(true);
  };

  const closeTeamDialog = () => {
    setIsTeamDialogOpen(false);
    setEditingMember(null);
    setMemberName('');
    setMemberTitle('');
    setMemberBio('');
    setMemberAvatarFile(null);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <section className="text-center relative">
        <h1 className="text-4xl font-bold tracking-tight">Creators Hub</h1>
        <p className="mt-2 text-lg text-muted-foreground">The team behind Med-X's high-yield materials.</p>

        {isAdmin && (
          <div className="mt-6 flex justify-center gap-4">
            <Dialog open={isTeamDialogOpen} onOpenChange={(open) => !open && closeTeamDialog()}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>{editingMember ? 'Edit' : 'Add'} Member</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={memberName} onChange={(e) => setMemberName(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Title</Label><Input value={memberTitle} onChange={(e) => setMemberTitle(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Avatar (Optional)</Label><Input type="file" accept="image/*" onChange={(e) => setMemberAvatarFile(e.target.files?.[0] || null)} /></div>
                  <div className="space-y-2"><Label>Bio</Label><Textarea value={memberBio} onChange={(e) => setMemberBio(e.target.value)} rows={4} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeTeamDialog}>Cancel</Button>
                  <Button onClick={handleMemberSubmit}>Save Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {(teamMembers || defaultCreators).map((creator) => (
          <Card key={creator.id} className="relative text-center border-border/40 shadow-sm overflow-hidden flex flex-col group">
            {isAdmin && teamMembers && teamMembers.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openEditDialog(creator)}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setMemberToDelete(creator)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
            <CardHeader className="items-center pb-0 pt-8">
              <Avatar className="h-44 w-32 rounded-2xl border-2 border-primary/10">
                <AvatarImage src={creator.avatar} alt={creator.name} className="object-cover" />
                <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="flex-grow px-6 py-8">
              <CardTitle className="text-xl mb-1">{creator.name}</CardTitle>
              <CardDescription className="text-primary font-semibold mb-4">{creator.title}</CardDescription>
              <p className="text-sm text-muted-foreground leading-relaxed">{creator.bio}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      
      <section>
        {isLoading ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : canUpload ? (
          <Card className="max-w-2xl mx-auto border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Submit New Material</CardTitle>
              <CardDescription>Upload e-books for the student community.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContentSubmit} className="space-y-6">
                <div className="space-y-2"><Label>E-Book Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Academic Level</Label>
                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="100">100 Level</SelectItem><SelectItem value="200">200 Level</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Course Subject</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                            <SelectContent>
                                {filteredCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>Access Mode</Label>
                      <RadioGroup value={contentType} onValueChange={setContentType} className="flex pt-2 gap-4">
                          <div className="flex items-center gap-2"><RadioGroupItem value="free" id="f" /><Label htmlFor="f">Free</Label></div>
                          <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="p" /><Label htmlFor="p">Premium</Label></div>
                      </RadioGroup>
                   </div>
                   <div className="space-y-2">
                      <Label>Cover Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                   </div>
                </div>

                <div className="space-y-2">
                  <Label>PDF Download Link</Label>
                  <Input type="url" placeholder="G-Drive link..." value={filePath} onChange={(e) => setFilePath(e.target.value)} required />
                </div>
                
                <Button type="submit" className="w-full h-11" disabled={isPending}>
                   <Upload className="mr-2 h-5 w-5" /> Publish Material
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardHeader><CardTitle>Become a Creator</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Help fellow students by sharing your study materials.</p>
              <Button asChild size="lg"><Link href="https://wa.me/2349123338586" target="_blank"><MessageSquare className="mr-2 h-5 w-5" /> Contact for Verification</Link></Button>
            </CardContent>
          </Card>
        )}
      </section>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Member?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMember} className="bg-destructive">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
