'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShieldAlert, Trash2, Loader2, ShieldX, Edit, Save, Upload } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc, useStorage } from '@/firebase';
import { collection, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useState, useEffect, useTransition, useMemo } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { addMonths, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

type Material = Omit<EBook, 'id' | 'level'> & { level: string | number, type: string, downloads?: number, coverImage: string };
type MaterialWithCollection = Material & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null };
type Feedback = { id: string; message: string; submittedAt: string; status: string; userId: string | null; email: string | null; };
type CreatorProfile = { id: string, userId: string, verifiedByAdmin: boolean };

const SubscriptionTimer = ({ expiryDate, onExpire }: { expiryDate: string; onExpire: () => void }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const expiry = new Date(expiryDate);

        const calculateTimeLeft = () => {
            const difference = +expiry - +new Date();
            let newTimeLeft = null;

            if (difference > 0) {
                newTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return newTimeLeft;
        };

        const initialTimeLeft = calculateTimeLeft();
        if (!initialTimeLeft) {
            onExpire();
            return;
        }

        setTimeLeft(initialTimeLeft);

        const interval = setInterval(() => {
            const updatedTimeLeft = calculateTimeLeft();
            if (updatedTimeLeft) {
                setTimeLeft(updatedTimeLeft);
            } else {
                clearInterval(interval);
                onExpire();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiryDate, onExpire]);

    if (!timeLeft) return null;

    const formatTime = (val: number) => val.toString().padStart(2, '0');

    return (
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            ({timeLeft.days > 0 && `${timeLeft.days}d `}{formatTime(timeLeft.hours)}h:{formatTime(timeLeft.minutes)}m:{formatTime(timeLeft.seconds)}s left)
        </span>
    );
};

export default function AdminPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  const [allMaterials, setAllMaterials] = useState<MaterialWithCollection[]>([]);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithCollection | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialWithCollection | null>(null);
  const [isUpdating, startTransition] = useTransition();
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role: string }>(userDocRef);

  const usersCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserData>(usersCollectionRef);

  const uniqueUsers = useMemo(() => {
    if (!users) return [];
    const map = new Map<string, UserData>();
    users.forEach(u => {
      const existing = map.get(u.email);
      if (!existing || u.id.length >= 28) {
        map.set(u.email, u);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [users]);

  const creatorProfilesCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'creator_profiles') : null), [firestore]);
  const { data: creatorProfiles, isLoading: isLoadingCreatorProfiles } = useCollection<CreatorProfile>(creatorProfilesCollectionRef);

  const verificationStatusMap = useMemo(() => {
    if (!creatorProfiles) return new Map<string, boolean>();
    return new Map(creatorProfiles.map(p => [p.userId, p.verifiedByAdmin]));
  }, [creatorProfiles]);

  const feedbackCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'feedback') : null), [firestore]);
  const { data: allFeedback, isLoading: isLoadingFeedback } = useCollection<Feedback>(feedbackCollectionRef);

  const collectionsToFetch = [
    'materials_100lvl_free',
    'materials_100lvl_premium',
    'materials_200lvl_free',
    'materials_200lvl_premium',
  ];

  const collectionRefs = collectionsToFetch.map((c) =>
    useMemoFirebase(() => (firestore ? collection(firestore, c) : null), [firestore, c])
  );

  const dataHooks = [
    useCollection<Material>(collectionRefs[0]),
    useCollection<Material>(collectionRefs[1]),
    useCollection<Material>(collectionRefs[2]),
    useCollection<Material>(collectionRefs[3]),
  ];

  useEffect(() => {
    const combinedContent: MaterialWithCollection[] = [];
    dataHooks.forEach((hook, index) => {
      if (hook.data) {
        const collectionName = collectionsToFetch[index];
        hook.data.forEach((item) => {
          combinedContent.push({
            ...item,
            id: item.id,
            collection: collectionName,
          });
        });
      }
    });
    combinedContent.sort((a, b) => a.title.localeCompare(b.title));
    setAllMaterials(combinedContent);
  }, [dataHooks[0].data, dataHooks[1].data, dataHooks[2].data, dataHooks[3].data]);

  const isLoadingMaterials = dataHooks.some((h) => h.isLoading);
  const isLoading = isLoadingUsers || isLoadingMaterials || isLoadingFeedback || isUserLoading || isProfileLoading || isLoadingCreatorProfiles;

  const handleEditClick = (material: MaterialWithCollection) => {
      setMaterialToEdit(material);
      setEditTitle(material.title);
      setEditDesc(material.description);
      setEditCoverUrl(''); 
      setEditCoverFile(null);
  };

  const handleEditSubmit = () => {
    if (!materialToEdit || !firestore) return;
    
    // Capture state values
    const originalMaterial = materialToEdit;
    const newTitle = editTitle;
    const newDesc = editDesc;
    const newFile = editCoverFile;
    const newUrl = editCoverUrl;

    // 1. Close UI immediately to prevent "freezing" or "stuck" interface
    setMaterialToEdit(null);
    toast({ title: 'Processing Changes', description: 'Your updates are being saved in the background.' });

    // 2. Perform work in a background async block to keep UI fluid
    (async () => {
        try {
            let finalCoverUrl = originalMaterial.coverImage;

            if (newFile && storage) {
                const imageRef = ref(storage, `covers/${Date.now()}_${newFile.name}`);
                const uploadResult = await uploadBytes(imageRef, newFile);
                finalCoverUrl = await getDownloadURL(uploadResult.ref);
            } else if (newUrl.trim()) {
                finalCoverUrl = newUrl.trim();
            }

            const docRef = doc(firestore, originalMaterial.collection, originalMaterial.id);
            updateDocumentNonBlocking(docRef, {
                title: newTitle,
                description: newDesc,
                coverImage: finalCoverUrl,
                lastUpdateDate: new Date().toISOString(),
            });
            
            toast({ title: 'Success', description: `"${newTitle}" has been updated.` });
        } catch (error) {
            console.error('Error updating material:', error);
            toast({ title: 'Error', description: 'Failed to update material.', variant: 'destructive' });
        }
    })();
  };

  const handleDeleteClick = (material: MaterialWithCollection) => {
    setMaterialToDelete(material);
  };

  const confirmDelete = () => {
    if (!materialToDelete || !firestore) return;
    
    const originalMaterial = materialToDelete;
    // Close instantly
    setMaterialToDelete(null);
    toast({ title: 'Processing Deletion', description: 'Deleting content...' });

    try {
      const docRef = doc(firestore, originalMaterial.collection, originalMaterial.id);
      deleteDocumentNonBlocking(docRef);
      toast({
        title: 'Content Deleted',
        description: `"${originalMaterial.title}" has been successfully removed.`,
      });
    } catch (error) {
      console.error('Error deleting document: ', error);
      toast({ title: 'Error', description: 'Failed to delete content.', variant: 'destructive' });
    }
  };

  const handleDeleteFeedbackClick = (feedbackItem: Feedback) => {
    setFeedbackToDelete(feedbackItem);
  };

  const confirmDeleteFeedback = () => {
    if (!feedbackToDelete || !firestore) return;
    
    const originalFeedback = feedbackToDelete;
    // Close instantly
    setFeedbackToDelete(null);

    try {
      const docRef = doc(firestore, 'feedback', originalFeedback.id);
      deleteDocumentNonBlocking(docRef);
      toast({ title: 'Feedback Deleted', description: `Feedback submission has been successfully deleted.` });
    } catch (error) {
      console.error('Error deleting feedback: ', error);
      toast({ title: 'Error', description: 'Failed to delete feedback.', variant: 'destructive' });
    }
  };

  const handleUserPremiumChange = (targetUser: UserData, isPremium: boolean) => {
    if (!firestore) return;
  
    startTransition(async () => {
      const userDocRef = doc(firestore, 'users', targetUser.id);
      try {
        const updateData: { isPremium: boolean; subscriptionExpiresAt?: string | null } = { isPremium };
        let toastDescription = `${targetUser.email}'s status has been set to ${isPremium ? 'Premium' : 'Free'}.`;

        if (isPremium) {
          const expiryDate = addMonths(new Date(), 1);
          updateData.subscriptionExpiresAt = expiryDate.toISOString();
          toastDescription = `${targetUser.email} has been upgraded to Premium for one month.`
        } else {
          updateData.subscriptionExpiresAt = null;
        }
  
        updateDocumentNonBlocking(userDocRef, updateData);
        toast({ title: 'User Updated', description: toastDescription });
      } catch (error) {
        console.error('Error updating user:', error);
        toast({ title: 'Update Failed', description: `Could not update ${targetUser.email}'s status.`, variant: 'destructive' });
      }
    });
  };

  const handleUserRoleChange = (targetUser: UserData, isAdmin: boolean) => {
    if (!firestore) return;

    startTransition(async () => {
      const userDocRef = doc(firestore, 'users', targetUser.id);
      try {
        updateDocumentNonBlocking(userDocRef, { role: isAdmin ? 'admin' : 'student' });
        toast({ title: 'User Role Updated', description: `${targetUser.email} has been made an ${isAdmin ? 'Admin' : 'Student'}.` });
      } catch (error) {
        console.error('Error updating user role:', error);
        toast({ title: 'Update Failed', description: `Could not update ${targetUser.email}'s role.`, variant: 'destructive' });
      }
    });
  };

  const handleUserVerificationChange = (targetUser: UserData, isVerified: boolean) => {
    if (!firestore) return;

    startTransition(async () => {
      const creatorProfileRef = doc(firestore, 'creator_profiles', targetUser.id);
      try {
        await setDoc(creatorProfileRef, { 
            id: targetUser.id,
            userId: targetUser.id,
            verifiedByAdmin: isVerified 
        }, { merge: true });

        toast({ title: 'User Updated', description: `${targetUser.email} has been ${isVerified ? 'verified' : 'unverified'} as a creator.` });
      } catch (error) {
        console.error('Error updating creator profile:', error);
        toast({ title: 'Update Failed', description: `Could not update ${targetUser.email}'s verification status.`, variant: 'destructive' });
      }
    });
  };

  const handleMaterialPremiumChange = (material: MaterialWithCollection, newPremiumStatus: boolean) => {
    if (!firestore) return;
    
    startTransition(async () => {
      const currentCollection = material.collection;
      const targetCollection = currentCollection.includes('_free')
        ? currentCollection.replace('_free', '_premium')
        : currentCollection.replace('_premium', '_free');

      const originalDocRef = doc(firestore, currentCollection, material.id);
      const targetDocRef = doc(firestore, targetCollection, material.id);

      const { collection: _, ...materialData } = material;
      const newMaterialData = {
        ...materialData,
        isPremium: newPremiumStatus,
      };

      try {
        await setDoc(targetDocRef, newMaterialData);
        await deleteDoc(originalDocRef);
        
        toast({ title: 'Content Updated', description: `"${material.title}" has been moved to ${newPremiumStatus ? 'Premium' : 'Free'}.` });
      } catch (error) {
        console.error('Error moving document:', error);
        toast({ title: 'Update Failed', description: `Could not move "${material.title}".`, variant: 'destructive' });
      }
    });
  };

  const totalDownloads = allMaterials.reduce((acc, c) => acc + (c.downloads || 0), 0);
  const premiumUsersCount = uniqueUsers ? uniqueUsers.filter((u) => u.isPremium).length : 0;
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAdmin = userProfile?.role === 'admin';

  if (!isAdmin) {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center">
            <ShieldX className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-3xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground mt-2">You do not have permission to view this page.</p>
        </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <ShieldAlert className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, content, and site settings.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(uniqueUsers.length)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(premiumUsersCount)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingMaterials ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(allMaterials.length)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                 {isLoadingMaterials ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(totalDownloads)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>View and manage all uploaded materials.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status (Premium)</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingMaterials ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !allMaterials.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No content found.
                    </TableCell>
                  </TableRow>
                ) : (
                  allMaterials.map((material) => (
                    <TableRow key={`${material.id}-${material.collection}`}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>{material.level} Level</TableCell>
                      <TableCell>
                        <Switch
                          checked={material.isPremium}
                          onCheckedChange={(checked) => handleMaterialPremiumChange(material, checked)}
                          disabled={isUpdating}
                          aria-label="Toggle premium status for content"
                        />
                      </TableCell>
                       <TableCell>{formatNumber(material.downloads || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(material)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(material)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all registered users.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Premium Status</TableHead>
                  <TableHead>Admin</TableHead>
                  <TableHead>Verified Creator</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                     <TableCell colSpan={4} className="text-center">
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !uniqueUsers?.length ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  uniqueUsers.map((tableUser) => (
                    <TableRow key={tableUser.id}>
                      <TableCell>{tableUser.email}</TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2">
                           <Switch
                            checked={tableUser.isPremium}
                            onCheckedChange={(checked) => handleUserPremiumChange(tableUser, checked)}
                            disabled={isUpdating}
                            aria-label="Toggle premium status for user"
                          />
                          {tableUser.isPremium && tableUser.subscriptionExpiresAt && (
                            <SubscriptionTimer 
                                expiryDate={tableUser.subscriptionExpiresAt} 
                                onExpire={() => handleUserPremiumChange(tableUser, false)} 
                            />
                          )}
                         </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={tableUser.role === 'admin'}
                          onCheckedChange={(checked) => handleUserRoleChange(tableUser, checked)}
                          disabled={isUpdating || tableUser.id === user?.uid}
                          aria-label="Toggle admin status for user"
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={verificationStatusMap.get(tableUser.id) || false}
                          onCheckedChange={(checked) => handleUserVerificationChange(tableUser, checked)}
                          disabled={isUpdating}
                          aria-label="Toggle creator verification"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Feedback</CardTitle>
            <CardDescription>Review and manage user submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Message</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFeedback ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center">
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !allFeedback?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No feedback submissions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  allFeedback.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-sm truncate">{item.message}</TableCell>
                      <TableCell>{item.email || 'Anonymous'}</TableCell>
                      <TableCell className="whitespace-nowrap">{format(new Date(item.submittedAt), 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'New' ? 'default' : 'secondary'}>{item.status}</Badge>
                      </TableCell>
                       <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFeedbackClick(item)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!materialToDelete} onOpenChange={(open) => !open && setMaterialToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the content titled{' '}
              <span className="font-bold">"{materialToDelete?.title}"</span> from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!feedbackToDelete} onOpenChange={(open) => !open && setFeedbackToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this feedback submission from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFeedback}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!materialToEdit} onOpenChange={(open) => !open && setMaterialToEdit(null)}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Edit Material</DialogTitle>
                <DialogDescription>Update the details for "{materialToEdit?.title}".</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="edit-title">Title</Label>
                    <Input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-desc">Description</Label>
                    <Textarea id="edit-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={4} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-cover-file">Update Cover Image (Preferred)</Label>
                    <div className="flex items-center gap-4">
                        <Input
                            id="edit-cover-file"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)}
                            className="cursor-pointer"
                        />
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="edit-cover">Cover Image URL (Fallback)</Label>
                    <p className="text-[10px] text-muted-foreground">Leave empty to keep current image or upload a file above.</p>
                    <Input id="edit-cover" value={editCoverUrl} onChange={(e) => setEditCoverUrl(e.target.value)} placeholder="https://..." disabled={!!editCoverFile} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setMaterialToEdit(null)}>Cancel</Button>
                <Button onClick={handleEditSubmit}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
