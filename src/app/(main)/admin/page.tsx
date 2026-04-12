'use client';

import {
  Card,
  CardContent,
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
  LayoutGrid,
  Users as UsersIcon,
  Star,
  Download,
  BookOpen,
  UserCheck
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, setDoc, addDoc, query, orderBy } from 'firebase/firestore';
import { useState, useEffect, useTransition, useMemo, useCallback } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { addMonths, isValid, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Material = Omit<EBook, 'id'> & { categoryId?: string, type: string, downloads?: number, coverImage: string, isFeatured?: boolean };
type MaterialWithCollection = Material & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null };
type CourseCategory = { id: string; name: string; level: number; order: number };
type CreatorProfile = { id: string, userId: string, verifiedByAdmin: boolean };

const SubscriptionTimer = ({ expiryDate }: { expiryDate: string }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number; hours: number; minutes: number; seconds: number;
    } | null>(null);

    useEffect(() => {
        if (!expiryDate) return;
        const expiry = new Date(expiryDate);
        if (!isValid(expiry)) return;

        const calculateTimeLeft = () => {
            const difference = +expiry - +new Date();
            if (difference <= 0) return null;
            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };
        
        const initial = calculateTimeLeft();
        setTimeLeft(initial);
        
        const interval = setInterval(() => {
            const updated = calculateTimeLeft();
            if (updated) setTimeLeft(updated);
            else clearInterval(interval);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [expiryDate]);

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

  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catLevel, setCatLevel] = useState('100');
  const [catToDelete, setCatToDelete] = useState<CourseCategory | null>(null);

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role: string }>(userDocRef);

  const usersCollectionRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: usersData } = useCollection<UserData>(usersCollectionRef);

  const creatorProfilesRef = useMemoFirebase(() => (firestore ? collection(firestore, 'creator_profiles') : null), [firestore]);
  const { data: creatorProfiles } = useCollection<CreatorProfile>(creatorProfilesRef);

  const uniqueUsers = useMemo(() => {
    if (!usersData) return [];
    const map = new Map<string, UserData>();
    usersData.forEach(u => {
      if (!u || !u.email) return;
      const existing = map.get(u.email);
      if (!existing || (u.id && u.id.length >= 28)) map.set(u.email, u);
    });
    return Array.from(map.values()).sort((a, b) => (a.email || "").localeCompare(b.email || ""));
  }, [usersData]);

  const categoriesQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: categories } = useCollection<CourseCategory>(categoriesQuery);

  const q1 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_free') : null), [firestore]);
  const q2 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_premium') : null), [firestore]);
  const q3 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_200lvl_free') : null), [firestore]);
  const q4 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_200lvl_premium') : null), [firestore]);

  const h1 = useCollection<Material>(q1);
  const h2 = useCollection<Material>(q2);
  const h3 = useCollection<Material>(q3);
  const h4 = useCollection<Material>(q4);

  useEffect(() => {
    const combined: MaterialWithCollection[] = [];
    const hooks = [h1, h2, h3, h4];
    const collections = ['materials_100lvl_free', 'materials_100lvl_premium', 'materials_200lvl_free', 'materials_200lvl_premium'];

    hooks.forEach((hook, index) => {
      if (hook.data) {
        hook.data.forEach((item) => {
          if (!item) return;
          const derivedLevel = collections[index].includes('100lvl') ? 100 : 200;
          combined.push({ 
            ...item, 
            id: item.id, 
            level: item.level || derivedLevel,
            collection: collections[index] 
          });
        });
      }
    });
    setAllMaterials(combined.sort((a, b) => (a.title || "").localeCompare(b.title || "")));
  }, [h1.data, h2.data, h3.data, h4.data]);

  const premiumUsersCount = useMemo(() => uniqueUsers.filter(u => u.isPremium).length, [uniqueUsers]);
  const totalDownloadsCount = useMemo(() => allMaterials.reduce((acc, m) => acc + (m.downloads || 0), 0), [allMaterials]);
  const totalMaterialsCount = allMaterials.length;

  const handleEditClick = (material: MaterialWithCollection) => {
      setMaterialToEdit(material);
      setEditTitle(material.title || '');
      setEditDesc(material.description || '');
      setEditCategoryId(material.categoryId || 'none');
      setEditCoverFile(null);
  };

  const handleEditSubmit = () => {
    if (!materialToEdit || !firestore) return;
    const material = materialToEdit;
    const title = editTitle;
    const desc = editDesc;
    const file = editCoverFile;
    const catId = editCategoryId === 'none' ? '' : editCategoryId;

    setMaterialToEdit(null);
    toast({ title: 'Processing', description: 'Saving changes...' });

    const perform = async () => {
        try {
            let coverUrl = material.coverImage;
            if (file) {
                coverUrl = await new Promise<string>((res, rej) => {
                    const reader = new FileReader();
                    reader.onload = () => res(reader.result as string);
                    reader.onerror = rej;
                    reader.readAsDataURL(file);
                });
            }
            updateDocumentNonBlocking(doc(firestore, material.collection, material.id), {
                title, description: desc, categoryId: catId, coverImage: coverUrl, lastUpdateDate: new Date().toISOString(),
            });
            toast({ title: 'Success', description: `"${title}" updated.` });
        } catch (e) { toast({ title: 'Error', description: 'Update failed.', variant: 'destructive' }); }
    };
    perform();
  };

  const handleCategorySave = () => {
    if (!catName || !firestore) return;
    const name = catName;
    const level = parseInt(catLevel);
    const original = editingCategory;
    setIsCatDialogOpen(false);
    toast({ title: 'Processing', description: 'Saving subject...' });

    const perform = async () => {
      try {
        const data = { name, level, order: original?.order ?? (categories?.length || 0) };
        if (original) await setDoc(doc(firestore, 'course_categories', original.id), data, { merge: true });
        else await addDoc(collection(firestore, 'course_categories'), data);
        toast({ title: 'Success', description: `Subject "${name}" saved.` });
      } catch (e) { toast({ title: 'Error', description: 'Failed to save subject.', variant: 'destructive' }); }
    };
    perform();
  };

  const isVerifiedCreator = useCallback((userId: string) => {
    return creatorProfiles?.some(cp => cp.id === userId && cp.verifiedByAdmin) ?? false;
  }, [creatorProfiles]);

  if (isUserLoading || isProfileLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (userProfile?.role !== 'admin') return <div className="flex flex-col items-center justify-center h-full min-h-[60vh]"><ShieldX className="h-16 w-16 text-destructive mb-4" /><h1 className="text-3xl font-bold">Access Denied</h1></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldAlert className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                <p className="text-muted-foreground">Manage users, content, and categories.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-primary/5 border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <UsersIcon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{uniqueUsers.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Registered students</p>
                </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
                    <Star className="h-4 w-4 text-primary fill-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{premiumUsersCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Active subscriptions</p>
                </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
                    <Download className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalDownloadsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Resource engagement</p>
                </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
                    <BookOpen className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalMaterialsCount}</div>
                    <p className="text-xs text-muted-foreground mt-1">Total resources hosted</p>
                </CardContent>
            </Card>
        </div>

        <Card className="border-primary/10 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <LayoutGrid className="h-5 w-5 text-primary" /> Subject Categories
                    </CardTitle>
                </div>
                <Button size="sm" onClick={() => { setEditingCategory(null); setCatName(''); setIsCatDialogOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> Add Subject
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold mb-3 text-sm text-primary uppercase tracking-wider">100 Level Subjects</h3>
                        <div className="space-y-2">
                            {categories?.filter(c => c.level === 100).map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group">
                                    <span className="text-sm font-medium">{cat.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(cat); setCatName(cat.name); setCatLevel('100'); setIsCatDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCatToDelete(cat)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3 text-sm text-primary uppercase tracking-wider">200 Level Subjects</h3>
                        <div className="space-y-2">
                            {categories?.filter(c => c.level === 200).map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 group">
                                    <span className="text-sm font-medium">{cat.name}</span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingCategory(cat); setCatName(cat.name); setCatLevel('200'); setIsCatDialogOpen(true); }}><Edit className="h-3 w-3" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCatToDelete(cat)}><Trash2 className="h-3 w-3" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
          <CardHeader><CardTitle>Content Management</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allMaterials.map((material) => (
                    <TableRow key={material.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{material.title}</TableCell>
                        <TableCell><Badge variant="outline">{material.level} Lvl</Badge></TableCell>
                        <TableCell><Badge variant="secondary">{categories?.find(c => c.id === material.categoryId)?.name || 'None'}</Badge></TableCell>
                        <TableCell>
                            <Switch checked={!!material.isFeatured} onCheckedChange={(checked) => {
                                updateDocumentNonBlocking(doc(firestore!, material.collection, material.id), { isFeatured: checked });
                                toast({ title: checked ? 'Featured' : 'Unfeatured', description: `"${material.title}" status updated.` });
                            }} />
                        </TableCell>
                        <TableCell>
                            <Switch checked={material.isPremium} onCheckedChange={(checked) => {
                                const target = material.collection.includes('_free') ? material.collection.replace('_free', '_premium') : material.collection.replace('_premium', '_free');
                                const { collection: _, ...data } = material;
                                setDoc(doc(firestore!, target, material.id), { ...data, isPremium: checked });
                                deleteDoc(doc(firestore!, material.collection, material.id));
                                toast({ title: 'Access Updated', description: `"${material.title}" moved to ${checked ? 'Premium' : 'Free'}.` });
                            }} />
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(material)}><Edit className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setMaterialToDelete(material)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-primary/10">
            <CardHeader><CardTitle>User Records & Roles</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Premium Plan</TableHead>
                            <TableHead className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> Verified Creator</TableHead>
                            <TableHead>System Role</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {uniqueUsers.map(u => (
                            <TableRow key={u.id}>
                                <TableCell className="max-w-[180px] truncate font-medium">{u.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch checked={u.isPremium} onCheckedChange={(checked) => {
                                            updateDocumentNonBlocking(doc(firestore!, 'users', u.id), {
                                                isPremium: checked, subscriptionExpiresAt: checked ? addMonths(new Date(), 1).toISOString() : null
                                            });
                                            toast({ title: 'Plan Updated', description: `${u.email} is now ${checked ? 'Premium' : 'Free'}.` });
                                        }} />
                                        {u.isPremium && u.subscriptionExpiresAt && <SubscriptionTimer expiryDate={u.subscriptionExpiresAt} />}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Switch 
                                        checked={isVerifiedCreator(u.id)} 
                                        onCheckedChange={(checked) => {
                                            if (!u.id) return;
                                            setDoc(doc(firestore!, 'creator_profiles', u.id), { 
                                                userId: u.id,
                                                verifiedByAdmin: checked,
                                                updatedAt: new Date().toISOString()
                                            }, { merge: true });
                                            toast({ 
                                                title: checked ? 'Creator Verified' : 'Verification Removed', 
                                                description: `${u.email}'s status updated.` 
                                            });
                                        }} 
                                    />
                                </TableCell>
                                <TableCell>
                                    <Select value={u.role || 'student'} onValueChange={(val) => {
                                        if (!u.id) return;
                                        updateDocumentNonBlocking(doc(firestore!, 'users', u.id), { role: val });
                                        toast({ title: 'Role Updated', description: `${u.email} is now ${val}.` });
                                    }}>
                                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="student">Student</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        <Dialog open={!!materialToEdit} onOpenChange={(o) => !o && setMaterialToEdit(null)}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Edit Content</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} /></div>
                    <div className="space-y-2">
                        <Label>Subject</Label>
                        <Select value={editCategoryId} onValueChange={setEditCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Uncategorized</SelectItem>
                                {categories?.filter(c => Number(c.level) === Number(materialToEdit?.level)).map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label>New Cover (File)</Label><Input type="file" accept="image/*" onChange={(e) => setEditCoverFile(e.target.files?.[0] || null)} /></div>
                    <div className="space-y-2"><Label>Description</Label><Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} /></div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setMaterialToEdit(null)}>Cancel</Button>
                    <Button onClick={handleEditSubmit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingCategory ? 'Edit Subject' : 'Add Subject'}</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Subject Name</Label><Input value={catName} onChange={(e) => setCatName(e.target.value)} /></div>
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <RadioGroup value={catLevel} onValueChange={setCatLevel} className="flex gap-4">
                            <div className="flex items-center gap-2"><RadioGroupItem value="100" id="l100" /><Label htmlFor="l100">100 Level</Label></div>
                            <div className="flex items-center gap-2"><RadioGroupItem value="200" id="l200" /><Label htmlFor="l200">200 Level</Label></div>
                        </RadioGroup>
                    </div>
                </div>
                <DialogFooter><Button onClick={handleCategorySave}>Save Subject</Button></DialogFooter>
            </DialogContent>
        </Dialog>

        <AlertDialog open={!!catToDelete} onOpenChange={(o) => !o && setCatToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Subject?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => { if(firestore && catToDelete) deleteDoc(doc(firestore, 'course_categories', catToDelete.id)); setCatToDelete(null); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={!!materialToDelete} onOpenChange={(o) => !o && setMaterialToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader><AlertDialogTitle>Delete Content?</AlertDialogTitle></AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive" onClick={() => { if(firestore && materialToDelete) deleteDocumentNonBlocking(doc(firestore, materialToDelete.collection, materialToDelete.id)); setMaterialToDelete(null); }}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}
