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
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, useStorage } from "@/firebase";
import { collection, addDoc, doc, setDoc, query, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
  const [coverUrl, setCoverUrl] = useState('');

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
    
    // Non-blocking pattern: Show feedback and clear form immediately
    toast({ title: "Processing", description: "Your content is being uploaded in the background." });

    startTransition(async () => {
      try {
        let finalCoverUrl = level === '100' 
          ? '/images/med-x 100lvl ebook cover.jpeg' 
          : `https://picsum.photos/seed/${Math.random().toString().slice(2)}/300/400`;

        if (coverFile && storage) {
            const coverRef = ref(storage, `covers/${Date.now()}_${coverFile.name}`);
            const uploadResult = await uploadBytes(coverRef, coverFile);
            finalCoverUrl = await getDownloadURL(uploadResult.ref);
        } else if (coverUrl.trim()) {
            finalCoverUrl = coverUrl.trim();
        }

        const collectionName = `materials_${level}lvl_${contentType === 'premium' ? 'premium' : 'free'}`;
        const collectionRef = collection(firestore!, collectionName);
        
        const newEbookData = {
            title,
            description,
            author: 'MED-X',
            level: parseInt(level),
            isPremium: contentType === 'premium',
            coverImage: finalCoverUrl,
            imageHint: level === '100' ? "med-x 100lvl cover" : "book cover",
            creatorId: user!.uid,
            uploadDate: new Date().toISOString(),
            lastUpdateDate: new Date().toISOString(),
            filePath: filePath,
            type: 'E-Book',
            downloads: 0,
        };
        await addDoc(collectionRef, newEbookData);
        toast({ title: "Submission Successful", description: `"${title}" is now live.` });

        // Reset form
        setTitle('');
        setDescription('');
        setLevel('');
        setContentType('free');
        setFilePath('');
        setCoverFile(null);
        setCoverUrl('');
      } catch (error) {
        console.error("Submission Error:", error);
        toast({ title: "Submission Failed", description: "An error occurred during upload.", variant: "destructive" });
      }
    });
  };

  const handleMemberSubmit = async () => {
    if (!memberName || !memberTitle || !memberBio || (!memberAvatarFile && !editingMember?.avatar) || !firestore) {
      toast({ title: "Incomplete", description: "All fields are required.", variant: "destructive" });
      return;
    }

    const isEditing = !!editingMember;
    const originalMember = editingMember;
    closeTeamDialog();
    toast({ title: isEditing ? 'Updating Member' : 'Adding Member', description: 'Processing in the background...' });

    startTransition(async () => {
      try {
        let avatarUrl = originalMember?.avatar || '';

        if (memberAvatarFile && storage) {
            const avatarRef = ref(storage, `avatars/${Date.now()}_${memberAvatarFile.name}`);
            const uploadResult = await uploadBytes(avatarRef, memberAvatarFile);
            avatarUrl = await getDownloadURL(uploadResult.ref);
        }

        const memberData: Omit<Creator, 'id'> = {
          name: memberName,
          title: memberTitle,
          bio: memberBio,
          avatar: avatarUrl,
          imageHint: "portrait",
          order: originalMember?.order ?? (teamMembers?.length || 0)
        };

        if (originalMember) {
          await setDoc(doc(firestore, 'team_members', originalMember.id), memberData, { merge: true });
        } else {
          await addDoc(collection(firestore, 'team_members'), memberData);
        }
        toast({ title: 'Success', description: 'Team list updated.' });
      } catch (e) {
        console.error("Error saving member:", e);
        toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
      }
    });
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete || !firestore) return;
    
    const originalMember = memberToDelete;
    setMemberToDelete(null);
    toast({ title: 'Removing Member', description: `Removing ${originalMember.name}...` });

    try {
      deleteDocumentNonBlocking(doc(firestore, 'team_members', originalMember.id));
      toast({ title: "Removed", description: "Member removed successfully." });
    } catch (e) {
      console.error("Error deleting member:", e);
      toast({ title: "Error", description: "Could not remove member.", variant: "destructive" });
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
        toast({ title: "Initialized", description: "Defaults restored." });
      } catch (e) {
        console.error("Error initializing team:", e);
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
  };

  const displayedTeam = teamMembers && teamMembers.length > 0 ? teamMembers : (isAdmin ? [] : defaultCreators);

  return (
    <div className="space-y-12">
      <section className="text-center relative">
        <h1 className="text-4xl font-bold tracking-tight">Meet the MED-X Creators</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Expert team dedicated to high-yield student success.
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
                  <DialogDescription>Create a professional profile for the creators page.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Title / Role</Label>
                    <Input value={memberTitle} onChange={(e) => setMemberTitle(e.target.value)} placeholder="e.g. Content Lead" />
                  </div>
                  <div className="space-y-2">
                    <Label>Avatar Image (Preferred)</Label>
                    <div className="flex items-center gap-4">
                        <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setMemberAvatarFile(e.target.files?.[0] || null)} 
                            className="cursor-pointer"
                        />
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea value={memberBio} onChange={(e) => setMemberBio(e.target.value)} placeholder="Short professional bio..." rows={4} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeTeamDialog}>Cancel</Button>
                  <Button onClick={handleMemberSubmit}>
                    <Save className="mr-2 h-4 w-4" />
                    {editingMember ? 'Save Changes' : 'Add Member'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {(!teamMembers || teamMembers.length === 0) && (
               <Button variant="outline" onClick={initializeTeam}>
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
          <Card className="max-w-2xl mx-auto border-border/50 shadow-md">
            <CardHeader>
              <CardTitle>Content Submission</CardTitle>
              <CardDescription>Upload high-yield materials for the student body.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleContentSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">E-Book Title</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. Comprehensive Embryology Guide" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">E-Book Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Brief summary of core concepts covered." 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="level">Academic Level</Label>
                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger id="level">
                                <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="100">100 Level</SelectItem>
                                <SelectItem value="200">200 Level</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Content Access</Label>
                        <RadioGroup value={contentType} onValueChange={setContentType} className="flex items-center pt-2 space-x-4">
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
                      className="cursor-pointer"
                    />
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="cover-url">Cover Image URL (Fallback)</Label>
                    <Input 
                        id="cover-url" 
                        placeholder="https://..." 
                        value={coverUrl} 
                        onChange={(e) => setCoverUrl(e.target.value)} 
                        disabled={!!coverFile}
                    />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-path">PDF Link (Cloud Hosted)</Label>
                  <div className="rounded-md bg-muted p-4 text-xs text-muted-foreground space-y-2 border border-border/50">
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      <Info className="h-4 w-4 text-primary" /> Sharing from Google Drive:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 ml-1">
                      <li>Upload your PDF to Google Drive.</li>
                      <li>Right-click the file and select <strong>Share</strong>.</li>
                      <li>Set access to <strong>"Anyone with the link"</strong>.</li>
                      <li>Click <strong>Copy link</strong> and paste it below.</li>
                    </ol>
                  </div>
                  <Input
                    id="file-path"
                    type="url"
                    placeholder="https://drive.google.com/file/d/..."
                    value={filePath}
                    onChange={(e) => setFilePath(e.target.value)}
                    required
                  />
                </div>
                
                <Button type="submit" className="w-full h-11 text-lg">
                   <Upload className="mr-2 h-5 w-5" />
                   Publish Material
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
              <p className="text-muted-foreground leading-relaxed">Join our team of verified creators and contribute high-quality study materials. All creators are vetted for accuracy and quality.</p>
              <Button asChild size="lg">
                <Link href="https://wa.me/2349123338586" target="_blank">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Apply for Verification
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
              This will permanently remove <span className="font-bold">"{memberToDelete?.name}"</span> from the public creators list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMember}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
