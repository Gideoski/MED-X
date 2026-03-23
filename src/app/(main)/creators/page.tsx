'use client';

import { defaultCreators, type Creator } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare, Loader2, ImageIcon, Plus, Trash2, Edit2, Save, X, Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useTransition, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useStorage } from "@/firebase";
import { collection, addDoc, doc, deleteDoc, setDoc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Link from "next/link";
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
  const storage = useStorage();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Content Submission State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [contentType, setContentType] = useState('free');
  const [filePath, setFilePath] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Team Member Management State
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Creator | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberTitle, setMemberTitle] = useState('');
  const [memberBio, setMemberBio] = useState('');
  const [memberAvatarFile, setMemberAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Deletion State
  const [memberToDelete, setMemberToDelete] = useState<Creator | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

  // Fetch Team Members
  const teamQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'team_members'), orderBy('order', 'asc'));
  }, [firestore]);

  const { data: teamMembers, isLoading: isTeamLoading } = useCollection<Creator>(teamQuery);

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
  const isLoading = isUserLoading || isProfileLoading || isCreatorLoading || isTeamLoading;

  const handleContentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
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
        let coverImageUrl = level === '100' 
          ? '/images/med-x 100lvl ebook cover.jpeg' 
          : `https://picsum.photos/seed/${Math.random().toString().slice(2)}/300/400`;

        if (coverFile && storage) {
            setIsUploadingCover(true);
            const coverRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
            const uploadResult = await uploadBytes(coverRef, coverFile);
            coverImageUrl = await getDownloadURL(uploadResult.ref);
            setIsUploadingCover(false);
        }

        const collectionName = `materials_${level}lvl_${contentType === 'premium' ? 'premium' : 'free'}`;
        const collectionRef = collection(firestore, collectionName);
        
        const newEbookData = {
            title,
            description,
            author: 'MED-X',
            level: parseInt(level),
            isPremium: contentType === 'premium',
            coverImage: coverImageUrl,
            imageHint: level === '100' ? "med-x 100lvl cover" : "book cover",
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
        setCoverFile(null);
      } catch (error) {
        console.error("Submission Error:", error);
        toast({
          title: "Submission Failed",
          description: "An unexpected error occurred while submitting.",
          variant: "destructive"
        });
      } finally {
        setIsUploadingCover(false);
      }
    });
  };

  const handleMemberSubmit = async () => {
    if (!memberName || !memberTitle || !memberBio || (!memberAvatarFile && !editingMember?.avatar) || !firestore) {
      toast({ title: "Incomplete", description: "All fields are required, including an avatar image.", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        let avatarUrl = editingMember?.avatar || '';

        if (memberAvatarFile && storage) {
            setIsUploadingAvatar(true);
            const avatarRef = ref(storage, `avatars/${Date.now()}_${memberAvatarFile.name}`);
            const uploadResult = await uploadBytes(avatarRef, memberAvatarFile);
            avatarUrl = await getDownloadURL(uploadResult.ref);
            setIsUploadingAvatar(false);
        }

        const memberData: Omit<Creator, 'id'> = {
          name: memberName,
          title: memberTitle,
          bio: memberBio,
          avatar: avatarUrl,
          imageHint: "portrait",
          order: editingMember?.order ?? (teamMembers?.length || 0)
        };

        if (editingMember) {
          await setDoc(doc(firestore, 'team_members', editingMember.id), memberData, { merge: true });
          toast({ title: "Updated", description: "Team member updated successfully." });
        } else {
          await addDoc(collection(firestore, 'team_members'), memberData);
          toast({ title: "Added", description: "New team member added." });
        }
        closeTeamDialog();
      } catch (e) {
        console.error("Error saving member:", e);
        toast({ title: "Error", description: "Could not save member.", variant: "destructive" });
      } finally {
        setIsUploadingAvatar(false);
      }
    });
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete || !firestore) return;
    setIsDeletingMember(true);
    try {
      await deleteDoc(doc(firestore, 'team_members', memberToDelete.id));
      toast({ title: "Removed", description: "Member removed from team." });
    } catch (e) {
      console.error("Error deleting member:", e);
      toast({ title: "Error", description: "Could not remove member.", variant: "destructive" });
    } finally {
      setIsDeletingMember(false);
      setMemberToDelete(null);
    }
  };

  const initializeTeam = async () => {
    if (!firestore || !isAdmin) return;
    startTransition(async () => {
      try {
        for (const [index, member] of defaultCreators.entries()) {
          const { id, ...data } = member;
          await setDoc(doc(firestore, 'team_members', id), { ...data, order: index });
        }
        toast({ title: "Initialized", description: "Default team members added." });
      } catch (e) {
        console.error("Error initializing team:", e);
        toast({ title: "Error", description: "Failed to initialize team.", variant: "destructive" });
      }
    });
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
    setIsUploadingAvatar(false);
  };

  const displayedTeam = teamMembers && teamMembers.length > 0 ? teamMembers : (isAdmin ? [] : defaultCreators);

  return (
    <div className="space-y-12">
      <section className="text-center relative">
        <h1 className="text-4xl font-bold tracking-tight">Meet the MED-X Creators</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The team dedicated to helping you study smarter.
        </p>

        {isAdmin && (
          <div className="mt-6 flex justify-center gap-4">
            <Dialog open={isTeamDialogOpen} onOpenChange={(open) => !open && closeTeamDialog()}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsTeamDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingMember ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
                  <DialogDescription>Fill in the details for the team member profile.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Title / Role</Label>
                    <Input value={memberTitle} onChange={(e) => setMemberTitle(e.target.value)} placeholder="e.g. Lead Designer" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar Image</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setMemberAvatarFile(e.target.files?.[0] || null)} 
                            disabled={isPending || isUploadingAvatar}
                            className="cursor-pointer"
                        />
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {editingMember && !memberAvatarFile && (
                        <p className="text-[10px] text-muted-foreground truncate">Current: {editingMember.avatar}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={memberBio} onChange={(e) => setMemberBio(e.target.value)} placeholder="Short professional bio..." rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeTeamDialog}>Cancel</Button>
                  <Button onClick={handleMemberSubmit} disabled={isPending || isUploadingAvatar}>
                    {isPending || isUploadingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {editingMember ? 'Save Changes' : 'Add Member'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {(!teamMembers || teamMembers.length === 0) && (
               <Button variant="outline" onClick={initializeTeam} disabled={isPending}>
                 Initialize Defaults
               </Button>
            )}
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {displayedTeam.map((creator) => (
          <Card key={creator.id} className="relative text-center border-border/40 shadow-sm overflow-hidden flex flex-col group">
            {isAdmin && teamMembers && teamMembers.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => openEditDialog(creator)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setMemberToDelete(creator)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <CardHeader className="items-center pb-0 pt-8">
              <Avatar className="h-44 w-32 rounded-2xl border-2 border-primary/10">
                <AvatarImage 
                  src={creator.avatar} 
                  alt={creator.name} 
                  className="aspect-auto object-cover h-full w-full"
                  data-ai-hint={creator.imageHint} 
                />
                <AvatarFallback className="rounded-2xl text-2xl font-bold">{creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center px-6 py-8">
              <CardTitle className="text-xl mb-1">{creator.name}</CardTitle>
              <CardDescription className="text-primary font-semibold mb-4">{creator.title}</CardDescription>
              <p className="text-sm text-muted-foreground leading-relaxed">{creator.bio}</p>
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
          <Card className="max-w-2xl mx-auto border-border/50">
            <CardHeader>
              <CardTitle>Creator Content Submission</CardTitle>
              <CardDescription>Submit your new e-book using the form below.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContentSubmit} className="space-y-6">
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
                  <Label htmlFor="cover-image">Cover Image (Preferred)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="cover-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      disabled={isPending || isUploadingCover}
                      className="cursor-pointer"
                    />
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-path">PDF Link</Label>
                  <div className="rounded-md bg-muted p-3 text-[10px] md:text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" /> How to get a public link?
                    </p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Upload your PDF to Google Drive.</li>
                      <li>Right-click the file and select <strong>Share</strong>.</li>
                      <li>Change access from "Restricted" to <strong>"Anyone with the link"</strong>.</li>
                      <li>Click <strong>Copy link</strong> and paste it below.</li>
                    </ol>
                  </div>
                  <Input
                    id="file-path"
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    disabled={isPending}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={!canUpload || isPending || isUploadingCover}>
                  {isPending || isUploadingCover ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                  ) : (
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
          <Card className="max-w-2xl mx-auto text-center border-border/50">
            <CardHeader>
              <CardTitle>Become a Creator</CardTitle>
              <CardDescription>Share your knowledge with the MED-X community.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">To maintain the quality of our content, we verify all creators. If you're interested in contributing, please contact an admin for verification.</p>
              <Button asChild>
                <Link href="https://wa.me/2349123338586" target="_blank">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Contact Admin for Verification
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently remove <span className="font-bold">"{memberToDelete?.name}"</span> from the team members list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingMember}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMember}
              disabled={isDeletingMember}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isDeletingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}