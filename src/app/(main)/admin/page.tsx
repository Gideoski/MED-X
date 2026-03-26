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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ShieldAlert, 
  Trash2, 
  Loader2, 
  ShieldX, 
  Edit, 
  Plus,
  LayoutGrid
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, setDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { useState, useEffect, useTransition, useMemo } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { addMonths } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Material = Omit<EBook, 'id'> & { categoryId?: string, type: string, downloads?: number, coverImage: string };
type MaterialWithCollection = Material & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null };
type CourseCategory = { id: string; name: string; level: number; order: number };

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
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();

  const [allMaterials, setAllMaterials] = useState<MaterialWithCollection[]>([]);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithCollection | null>(null);
  const [materialToEdit, setMaterialToEdit] = useState<MaterialWithCollection | null>(null);
  const [isPending, startTransition] = useTransition();

  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);

  // Category State
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catLevel, setCatLevel] = useState('100');
  const [catToDelete, setCatToDelete] = useState<CourseCategory | null>(null);

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
      if (!existing || u.id.length >= 28) map.set(u.email, u);
    });
    return Array.from(map.values()).sort((a, b) => a.email.localeCompare(b.email));
  }, [users]);

  const categoriesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: categories, isLoading: isLoadingCategories } = useCollection<CourseCategory>(categoriesQuery);

  // Fetch Materials individually to respect rules of hooks (No mapping inside render)
  const q1 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_free') : null), [firestore]);
  const q2 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_premium') : null), [firestore]);
  const q3 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_200lvl_free') : null), [firestore]);
  const q4 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_200lvl_premium') : null), [firestore]);

  const h1 = useCollection<Material>(q1);
  const h2 = useCollection<Material>(q2);
  const h3 = useCollection<Material>(q3);
  const h4 = useCollection<Material>(q4);

  useEffect(() => {
    const combinedContent: MaterialWithCollection[] = [];
    const hooks = [h1, h2, h3, h4];
    const collections = ['materials_100lvl_free', 'materials_100lvl_premium', 'materials_200lvl_free', 'materials_200lvl_premium'];

    hooks.forEach((hook, index) => {
      if (hook.data) {
        hook.data.forEach((item) => {
          const derivedLevel = collections[index].includes('100lvl') ? 100 : 200;
          combinedContent.push({ 
            ...item, 
            id: item.id, 
            level: item.level || derivedLevel,
            collection: collections[index] 
          });
        });
      }
    });
    combinedContent.sort((a, b) => a.title.localeCompare(b.title));
    setAllMaterials(combinedContent);
  }, [h1.data, h2.data, h3.data, h4.data]);

  const handleEditClick = (material: MaterialWithCollection) => {
      setMaterialToEdit(material);
      setEditTitle(material.title);
      setEditDesc(material.description);
      setEditCategoryId(material.categoryId || 'none');
      setEditCoverFile(null);
  };

  const handleEditSubmit = () => {
    if (!materialToEdit || !firestore) return;
    
    const originalMaterial = materialToEdit;
    const newTitle = editTitle;
    const newDesc = editDesc;
    const newFile = editCoverFile;
    const newCatId = editCategoryId === 'none' ? '' : editCategoryId;

    // Instantly close dialog and notify
    setMaterialToEdit(null);
    toast({ title: 'Processing', description: 'Updates are being saved to the database.' });

    const performUpdate = async () => {
        try {
            let finalCoverUrl = originalMaterial.coverImage;
            if (newFile) {
                finalCoverUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(newFile);
                });
            }

            const docRef = doc(firestore, originalMaterial.collection, originalMaterial.id);
            updateDocumentNonBlocking(docRef, {
                title: newTitle,
                description: newDesc,
                categoryId: newCatId,
                coverImage: finalCoverUrl,
                lastUpdateDate: new Date().toISOString(),
            });
            toast({ title: 'Success', description: `"${newTitle}" updated.` });
        } catch (error) {
            console.error('Error updating:', error);
            toast({ title: 'Error', description: 'Failed to update material.', variant: 'destructive' });
        }
    };
    performUpdate();
  };

  const confirmDelete = () => {
    if (!materialToDelete || !firestore) return;
    const originalMaterial = materialToDelete;
    setMaterialToDelete(null);
    try {
      deleteDocumentNonBlocking(doc(firestore, originalMaterial.collection, originalMaterial.id));
      toast({ title: 'Deleted', description: `"${originalMaterial.title}" removed.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete.', variant: 'destructive' });
    }
  };

  const handleCategorySave = () => {
    if (!catName || !firestore) return;
    const name = catName;
    const level = parseInt(catLevel);
    const original = editingCategory;

    setIsCatDialogOpen(false);
    setEditingCategory(null);
    setCatName('');
    toast({ title: 'Processing', description: 'Saving course category...' });

    const performSave = async () => {
      try {
        const catData = { name, level, order: original?.order ?? (categories?.length || 0) };
        if (original) {
          await setDoc(doc(firestore, 'course_categories', original.id), catData, { merge: true });
        } else {
          await addDoc(collection(firestore, 'course_categories'), catData);
        }
        toast({ title: 'Success', description: `Category "${name}" saved.` });
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to save category.', variant: 'destructive' });
      }
    };
    performSave();
  };

  const initializeDefaultCategories = async () => {
    if (!firestore) return;
    startTransition(async () => {
        const defaults = [
            { name: 'ICT', level: 100 },
            { name: 'Physics', level: 100 },
            { name: 'Chemistry', level: 100 },
            { name: 'Biology', level: 100 },
            { name: 'General Studies', level: 100 },
            { name: 'Anatomy', level: 200 },
            { name: 'Physiology', level: 200 },
            { name: 'Biochemistry', level: 200 },
            { name: 'IGMC', level: 200 },
            { name: 'Histology', level: 200 },
        ];
        try {
            for (const [idx, cat] of defaults.entries()) {
                await addDoc(collection(firestore, 'course_categories'), { ...cat, order: idx });
            }
            toast({ title: 'Initialized', description: 'Standard categories have been added.' });
        } catch (e) {
            toast({ title: 'Error', description: 'Initialization failed.', variant: 'destructive' });
        }
    });
  };

  if (isUserLoading || isProfileLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (userProfile?.role !== 'admin') return <div className="flex flex-col items-center justify-center h-full min-h-[60vh]"><ShieldX className="h-16 w-16 text-destructive mb-4" /><h1 className="text-3xl font-bold">Access Denied</h1></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldAlert className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                <p className="text-muted-foreground">System-wide management for MED-X.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={initializeDefaultCategories}>
                <Plus className="mr-2 h-4 w-4" /> Initialize Categories
            </Button>
          </div>
        </div>

        {/* Categories Section */}
        <Card className="border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-primary" /> Category Management
                    </CardTitle>
                    <CardDescription>Organize materials by course subject.</CardDescription>
                </div>
                <Button size="sm" onClick={() => { setEditingCategory(null); setCatName(''); setIsCatDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Subject
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-3 text-sm text-primary">100 Level Subjects</h3>
                        <div className="space-y-2">
                            {categories?.filter(c => c.level === 100).map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group">
                                    <span className="text-sm font-medium">{cat.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(cat); setCatName(cat.name); setCatLevel('100'); setIsCatDialogOpen(true); }}>
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCatToDelete(cat)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3 text-sm text-primary">200 Level Subjects</h3>
                        <div className="space-y-2">
                            {categories?.filter(c => c.level === 200).map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group">
                                    <span className="text-sm font-medium">{cat.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(cat); setCatName(cat.name); setCatLevel('200'); setIsCatDialogOpen(true); }}>
                                            <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCatToDelete(cat)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Content Management Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Content Management</CardTitle>
            <CardDescription>Update material metadata and availability.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMaterials.map((material) => (
                    <TableRow key={material.id}>
                        <TableCell className="font-medium">{material.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{material.level} Lvl</Badge>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline">
                                {categories?.find(c => c.id === material.categoryId)?.name || 'Uncategorized'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <Switch 
                                checked={material.isPremium} 
                                onCheckedChange={(checked) => {
                                    const targetCollection = material.collection.includes('_free') 
                                        ? material.collection.replace('_free', '_premium') 
                                        : material.collection.replace('_premium', '_free');
                                    
                                    const { collection: _, ...data } = material;
                                    setDoc(doc(firestore!, targetCollection, material.id), { ...data, isPremium: checked });
                                    deleteDoc(doc(firestore!, material.collection, material.id));
                                    toast({ title: 'Access Updated', description: `Moved to ${checked ? 'Premium' : 'Free'}.` });
                                }}
                            />
                        </TableCell>
                        <TableCell>{formatNumber(material.downloads || 0)}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(material)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setMaterialToDelete(material)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="shadow-sm">
            <CardHeader><CardTitle>User Records</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User Email</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Privileges</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {uniqueUsers.map(u => (
                            <TableRow key={u.id}>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={u.isPremium} onCheckedChange={(checked) => {
                                            updateDocumentNonBlocking(doc(firestore!, 'users', u.id), {
                                                isPremium: checked,
                                                subscriptionExpiresAt: checked ? addMonths(new Date(), 1).toISOString() : null
                                            });
                                        }} />
                                        {u.isPremium && u.subscriptionExpiresAt && <SubscriptionTimer expiryDate={u.subscriptionExpiresAt} onExpire={() => {}} />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Dialogs */}
        <Dialog open={!!materialToEdit} onOpenChange={(open) => !open && setMaterialToEdit(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Edit Content</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Subject Category</Label>
                        <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a subject" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Uncategorized</SelectItem>
                                {categories?.filter(c => Number(c.level) === Number(materialToEdit?.level)).map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Update Cover (Choose File)</Label>
                        <Input type="file" accept="image/*" onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setMaterialToEdit(null)}>Cancel</Button>
                    <Button onClick={handleEditSubmit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isCatDialogOpen} onOpenChange={(open) => !open && setIsCatDialogOpen(false)}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingCategory ? 'Edit Subject' : 'Add Subject'}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Subject Name</Label>
                        <Input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="e.g. Anatomy" />
                    </div>
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <RadioGroup value={catLevel} onValueChange={setCatLevel} className="flex gap-4">
                            <div className="flex items-center gap-2"><RadioGroupItem value="100" id="l100" /><Label htmlFor="l100">100 Level</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="200" id="l200" /><Label htmlFor="l200">200 Level</Label></div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCatDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCategorySave}>Save Subject</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!catToDelete} onOpenChange={(open) => !open && setCatToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Subject?</AlertDialogTitle><AlertDialogDescription>This will remove the category. Materials assigned to it will become uncategorized.</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => { deleteDoc(doc(firestore!, 'course_categories', catToDelete!.id)); setCatToDelete(null); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!materialToDelete} onOpenChange={(open) => !open && setMaterialToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Content?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={confirmDelete}>Delete Permanently</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
