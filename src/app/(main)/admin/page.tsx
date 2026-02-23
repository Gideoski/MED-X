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
} from '@/components/ui/table';
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
import { ShieldAlert, Trash2, Loader2, ShieldX } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useTransition } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { addMonths, format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type Material = Omit<EBook, 'id' | 'level'> & { level: string | number, type: string, downloads?: number };
type MaterialWithCollection = Material & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null };
type Feedback = { id: string; message: string; submittedAt: string; status: string; userId: string | null; email: string | null; };

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

    const format = (val: number) => val.toString().padStart(2, '0');

    return (
        <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            ({timeLeft.days > 0 && `${timeLeft.days}d `}{format(timeLeft.hours)}h:{format(timeLeft.minutes)}m:{format(timeLeft.seconds)}s left)
        </span>
    );
};


export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  const [allMaterials, setAllMaterials] = useState<MaterialWithCollection[]>([]);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, startTransition] = useTransition();
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);


  // Fetch current user's profile to check for admin role
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role: string }>(userDocRef);

  // Fetch users
  const usersCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserData>(usersCollectionRef);

  // Fetch feedback
  const feedbackCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'feedback') : null), [firestore]);
  const { data: allFeedback, isLoading: isLoadingFeedback } = useCollection<Feedback>(feedbackCollectionRef);

  // Fetch all materials
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
  const isLoading = isLoadingUsers || isLoadingMaterials || isLoadingFeedback || isUserLoading || isProfileLoading;

  const handleDeleteClick = (material: MaterialWithCollection) => {
    setMaterialToDelete(material);
  };

  const confirmDelete = async () => {
    if (!materialToDelete || !firestore) return;
    setIsDeleting(true);
    try {
      const docRef = doc(firestore, materialToDelete.collection, materialToDelete.id);
      await deleteDoc(docRef);
      toast({
        title: 'Content Deleted',
        description: `"${materialToDelete.title}" has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting document: ', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setMaterialToDelete(null);
    }
  };

  const handleDeleteFeedbackClick = (feedbackItem: Feedback) => {
    setFeedbackToDelete(feedbackItem);
  };

  const confirmDeleteFeedback = async () => {
    if (!feedbackToDelete || !firestore) return;
    setIsDeletingFeedback(true);
    try {
      const docRef = doc(firestore, 'feedback', feedbackToDelete.id);
      await deleteDoc(docRef);
      toast({
        title: 'Feedback Deleted',
        description: `Feedback submission has been successfully deleted.`,
      });
    } catch (error) {
      console.error('Error deleting feedback: ', error);
      toast({
        title: 'Error',
        description: 'Failed to delete feedback. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingFeedback(false);
      setFeedbackToDelete(null);
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
          updateData.subscriptionExpiresAt = null; // Or remove the field
        }
  
        await updateDoc(userDocRef, updateData);
        
        toast({
          title: 'User Updated',
          description: toastDescription,
        });
      } catch (error) {
        console.error('Error updating user:', error);
        toast({
          title: 'Update Failed',
          description: `Could not update ${targetUser.email}'s status.`,
          variant: 'destructive',
        });
      }
    });
  };

  const handleUserRoleChange = (targetUser: UserData, isAdmin: boolean) => {
    if (!firestore) return;

    startTransition(async () => {
      const userDocRef = doc(firestore, 'users', targetUser.id);
      try {
        await updateDoc(userDocRef, { role: isAdmin ? 'admin' : 'student' });
        toast({
          title: 'User Role Updated',
          description: `${targetUser.email} has been made an ${isAdmin ? 'Admin' : 'Student'}.`,
        });
      } catch (error) {
        console.error('Error updating user role:', error);
        toast({
          title: 'Update Failed',
          description: `Could not update ${targetUser.email}'s role.`,
          variant: 'destructive',
        });
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

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { collection: _, ...materialData } = material;
      const newMaterialData = {
        ...materialData,
        isPremium: newPremiumStatus,
      };

      try {
        await setDoc(targetDocRef, newMaterialData);
        await deleteDoc(originalDocRef);
        
        toast({
          title: 'Content Updated',
          description: `"${material.title}" has been moved to ${newPremiumStatus ? 'Premium' : 'Free'}.`,
        });

      } catch (error) {
        console.error('Error moving document:', error);
        toast({
          title: 'Update Failed',
          description: `Could not move "${material.title}".`,
          variant: 'destructive',
        });
      }
    });
  };

  const totalDownloads = allMaterials.reduce((acc, c) => acc + (c.downloads || 0), 0);
  const premiumUsersCount = users ? users.filter((u) => u.isPremium).length : 0;
  
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
                {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : formatNumber(users?.length || 0)}
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(material)} disabled={isUpdating}>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                     <TableCell colSpan={3} className="text-center">
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : !users?.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((tableUser) => (
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
                          disabled={isUpdating || tableUser.id === user.uid}
                          aria-label="Toggle admin status for user"
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
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFeedbackClick(item)} disabled={isUpdating}>
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
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
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
            <AlertDialogCancel disabled={isDeletingFeedback}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteFeedback}
              disabled={isDeletingFeedback}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeletingFeedback ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
