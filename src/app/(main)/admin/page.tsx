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
import { Badge } from '@/components/ui/badge';
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
import { ShieldAlert, Trash2, Loader2 } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

type Material = Omit<EBook, 'id' | 'level'> & { level: string | number, type: string, downloads?: number };
type MaterialWithCollection = Material & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string };

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const [allMaterials, setAllMaterials] = useState<MaterialWithCollection[]>([]);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithCollection | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users
  const usersCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserData>(usersCollectionRef);

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
    setAllMaterials(combinedContent);
  }, [dataHooks[0].data, dataHooks[1].data, dataHooks[2].data, dataHooks[3].data]);

  const isLoadingMaterials = dataHooks.some((h) => h.isLoading);
  const isLoading = isLoadingUsers || isLoadingMaterials;

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

  const totalDownloads = allMaterials.reduce((acc, c) => acc + (c.downloads || 0), 0);
  const premiumUsersCount = users ? users.filter((u) => u.isPremium).length : 0;

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
                  <TableHead>Type</TableHead>
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
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">{material.title}</TableCell>
                      <TableCell>{material.level} Level</TableCell>
                      <TableCell>
                        <Badge variant={material.isPremium ? 'default' : 'secondary'}>
                          {material.isPremium ? 'Premium' : 'Free'}
                        </Badge>
                      </TableCell>
                       <TableCell>{formatNumber(material.downloads || 0)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(material)}>
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
                  <TableHead>Plan</TableHead>
                  <TableHead>Role</TableHead>
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
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.isPremium ? 'default' : 'secondary'}>
                          {user.isPremium ? 'Premium' : 'Free'}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{user.role}</TableCell>
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
    </>
  );
}

    