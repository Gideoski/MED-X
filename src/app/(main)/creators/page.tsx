'use client';

import { defaultCreators, type Creator } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, MessageSquare, Loader2, Plus, Trash2, Edit2 } from "lucide-react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('100');
  const [categoryId, setCategoryId] = useState('');
  const [contentType, setContentType] = useState('free');
  const [filePath, setFilePath] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const catQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: allCategories } = useCollection<{ id: string; name: string; level: number }>(catQuery);
  const filteredCategories = useMemo(() => allCategories?.filter(c => c.level === parseInt(level)) || [], [allCategories, level]);

  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Creator | null>(null);
  const [memberName, setMemberName] = useState('');
  const [memberTitle, setMemberTitle] = useState('');
  const [memberBio, setMemberBio] = useState('');
  const [memberAvatarFile, setMemberAvatarFile] = useState<File | null>(null);
  const [memberToDelete, setMemberToDelete] = useState<Creator | null>(null);

  const teamQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'team_members'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: teamMembers, isLoading: isTeamLoading } = useCollection<Creator>(teamQuery);

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<{ role?: string }>(userDocRef);
  const isAdmin = userProfile?.role === 'admin';

  const creatorProfileRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'creator_profiles', user.uid) : null), [firestore, user]);
  const { data: creatorProfile } = useDoc<{ verifiedByAdmin?: boolean }>(creatorProfileRef);
  const isVerifiedCreator = creatorProfile?.verifiedByAdmin === true;

  // Admins and Verified Creators can both publish materials
  const canUpload = isAdmin || isVerifiedCreator;
  const isLoading = isUserLoading || isTeamLoading;

  const handleContentSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !description || !filePath) return;
    if (!firestore || !user) {
        toast({ title: "Auth Error", description: "You must be logged in to upload.", variant: "destructive" });
        return;
    }
    
    const currTitle = title;
    const currLevel = level;
    const currCatId = categoryId;
    const currDesc = description;
    const currPath = filePath;
    const currContentType = contentType;
    const currFile = coverFile;

    setTitle(''); setDescription(''); setCategoryId(''); setFilePath(''); setCoverFile(null);
    toast({ title: "Publishing...", description: "Your material is being uploaded." });

    startTransition(async () => {
      try {
        let coverUrl = currLevel === '100' ? 'https://images.unsplash.com/photo-1761081478943-25e4f4b6354c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' : 'https://images.unsplash.com/photo-1758691463569-66de91d76452?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';
        if (currFile) {
            coverUrl = await new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result as string);
                reader.onerror = rej;
                reader.readAsDataURL(currFile);
            });
        }
        const collectionName = `materials_${currLevel}lvl_${currContentType === 'premium' ? 'premium' : 'free'}`;
        await addDoc(collection(firestore, collectionName), {
            title: currTitle, 
            description: currDesc, 
            author: 'MED-X', 
            level: parseInt(currLevel),
            categoryId: currCatId, 
            isPremium: currContentType === 'premium', 
            coverImage: coverUrl,
            creatorId: user.uid, 
            uploadDate: new Date().toISOString(), 
            filePath: currPath, 
            type: 'E-Book', 
            downloads: 0,
            isFeatured: false
        });
        toast({ title: "Published", description: `"${currTitle}" is now live!` });
      } catch (e) { 
        console.error("Upload Error:", e);
        toast({ title: "Upload Failed", description: "Failed to save material to database.", variant: "destructive" }); 
      }
    });
  };

  const handleMemberSubmit = () => {
    if (!memberName || !memberTitle || !memberBio || !firestore) return;
    const isEdit = !!editingMember;
    const original = editingMember;
    const name = memberName;
    const title = memberTitle;
    const bio = memberBio;
    const file = memberAvatarFile;

    setIsTeamDialogOpen(false);
    toast({ title: 'Saving Member', description: 'Updating records.' });

    startTransition(async () => {
      try {
        let avatarUrl = original?.avatar || 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?q=80&w=1080';
        if (file) {
            avatarUrl = await new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload = () => res(reader.result as string);
                reader.onerror = rej;
                reader.readAsDataURL(file);
            });
        }
        const data = { name, title, bio, avatar: avatarUrl, order: original?.order ?? (teamMembers?.length || 0) };
        if (isEdit) await setDoc(doc(firestore, 'team_members', original!.id), data, { merge: true });
        else await addDoc(collection(firestore, 'team_members'), data);
        toast({ title: 'Success', description: `Team member updated.` });
      } catch (e) { toast({ title: "Error", description: "Save failed.", variant: "destructive" }); }
    });
  };

  const handleAddMemberClick = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberTitle('');
    setMemberBio('');
    setMemberAvatarFile(null);
    setIsTeamDialogOpen(true);
  };

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Creators Hub</h1>
        <p className="mt-2 text-muted-foreground">The team behind Med-X.</p>
        {isAdmin && (
          <div className="mt-6 flex justify-center">
            <Button onClick={handleAddMemberClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Team Member
            </Button>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {(teamMembers || defaultCreators).map((creator) => (
          <Card key={creator.id} className="relative text-center border-border/40 shadow-sm flex flex-col group overflow-hidden">
            {isAdmin && teamMembers && teamMembers.length > 0 && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => { setEditingMember(creator); setMemberName(creator.name); setMemberTitle(creator.title); setMemberBio(creator.bio); setIsTeamDialogOpen(true); }}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setMemberToDelete(creator)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            )}
            <CardHeader className="items-center pb-0 pt-8">
              <Avatar className="h-44 w-32 rounded-2xl border-2 border-primary/10 shadow-lg">
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
        {isLoading ? ( <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> ) : canUpload ? (
          <Card className="max-w-2xl mx-auto border-border/50 shadow-md">
            <CardHeader><CardTitle>Submit New Material</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleContentSubmit} className="space-y-6">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required /></div>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <Select value={level} onValueChange={setLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="100">100 Level</SelectItem><SelectItem value="200">200 Level</SelectItem></SelectContent></Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger><SelectContent>{filteredCategories.map(cat => ( <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem> ))}</SelectContent></Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label>Access</Label>
                      <RadioGroup value={contentType} onValueChange={setContentType} className="flex pt-2 gap-4"><div className="flex items-center gap-2"><RadioGroupItem value="free" id="f" /><Label htmlFor="f">Free</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="premium" id="p" /><Label htmlFor="p">Premium</Label></div></RadioGroup>
                   </div>
                   <div className="space-y-2"><Label>Cover</Label><Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} /></div>
                </div>
                <div className="space-y-2"><Label>PDF Link</Label><Input type="url" value={filePath} onChange={(e) => setFilePath(e.target.value)} required placeholder="https://drive.google.com/..." /></div>
                <Button type="submit" className="w-full h-11" disabled={isPending}><Upload className="mr-2 h-5 w-5" /> {isPending ? 'Publishing...' : 'Publish Material'}</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto text-center py-12">
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Become a Creator to share your materials.</p>
              <Button asChild size="lg"><Link href="https://wa.me/2349123338586" target="_blank"><MessageSquare className="mr-2 h-5 w-5" /> Contact for Verification</Link></Button>
            </CardContent>
          </Card>
        )}
      </section>

      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingMember ? 'Edit' : 'Add'} Member</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Name</Label><Input value={memberName} onChange={(e) => setMemberName(e.target.value)} /></div>
              <div className="space-y-2"><Label>Title</Label><Input value={memberTitle} onChange={(e) => setMemberTitle(e.target.value)} /></div>
              <div className="space-y-2"><Label>Avatar</Label><Input type="file" accept="image/*" onChange={(e) => setMemberAvatarFile(e.target.files?.[0] || null)} /></div>
              <div className="space-y-2"><Label>Bio</Label><Textarea value={memberBio} onChange={(e) => setMemberBio(e.target.value)} rows={4} /></div>
            </div>
            <DialogFooter><Button onClick={handleMemberSubmit} disabled={isPending}>{isPending ? 'Saving...' : 'Save Member'}</Button></DialogFooter>
          </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToDelete} onOpenChange={(o) => !o && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Member?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { if(firestore) deleteDocumentNonBlocking(doc(firestore, 'team_members', memberToDelete!.id)); setMemberToDelete(null); }} className="bg-destructive">Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
