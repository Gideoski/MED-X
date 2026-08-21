'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldAlert, 
  Loader2, 
  ShieldX, 
  Video, 
  MessageSquareQuote, 
  Activity,
  Users as UsersIcon,
  Star,
  Download,
  BookOpen,
  Mail,
  Search,
  Send,
  Trash2,
  Edit2,
  XCircle,
  CheckCircle2,
  Plus,
  Layers
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, setDoc, addDoc, query, orderBy, deleteField, updateDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo, useTransition, useRef } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { addMonths, isAfter, subHours, differenceInDays, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { sendEmailNotification, sendBulkEmailNotification } from '@/lib/actions';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MaterialWithCollection = EBook & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null, lastLoginAt?: string };
type Testimonial = { id: string, name: string, text: string, role: string, order: number };
type AppConfig = { tutorialLink: string; tutorialStatus: string };
type CourseCategory = { id: string; name: string; level: number; order: number };

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const tutorialFormRef = useRef<HTMLFormElement>(null);

  const [allMaterials, setAllMaterials] = useState<MaterialWithCollection[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [editingMaterial, setEditingMaterial] = useState<MaterialWithCollection | null>(null);
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<MaterialWithCollection | null>(null);

  // States for Category management
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role: string }>(userDocRef);

  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserData>(usersRef);

  const testimonialsRef = useMemoFirebase(() => (firestore ? query(collection(firestore, 'testimonials'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: testimonials } = useCollection<Testimonial>(testimonialsRef);

  const configRef = useMemoFirebase(() => (firestore ? doc(firestore, 'config', 'global') : null), [firestore]);
  const { data: appConfig } = useDoc<AppConfig>(configRef);

  const catRef = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: categories } = useCollection<CourseCategory>(catRef);

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData.filter(u => 
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.id.includes(userSearchQuery)
    );
  }, [usersData, userSearchQuery]);

  const dauCount = useMemo(() => {
    if (!usersData || !mounted) return 0;
    const oneDayAgo = subHours(new Date(), 24);
    return usersData.filter(u => u.lastLoginAt && u.lastLoginAt !== "" && isAfter(new Date(u.lastLoginAt), oneDayAgo)).length;
  }, [usersData, mounted]);

  const q1 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_free') : null), [firestore]);
  const q2 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_premium') : null), [firestore]);
  const q3 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_200lvl_free') : null), [firestore]);
  const q4 = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_200lvl_premium') : null), [firestore]);

  const h1 = useCollection<EBook>(q1);
  const h2 = useCollection<EBook>(q2);
  const h3 = useCollection<EBook>(q3);
  const h4 = useCollection<EBook>(q4);

  useEffect(() => {
    const combined: MaterialWithCollection[] = [];
    const hooks = [h1, h2, h3, h4];
    const colls = ['materials_100lvl_free', 'materials_100lvl_premium', 'materials_200lvl_free', 'materials_200lvl_premium'];
    hooks.forEach((hook, i) => {
      if (hook.data) hook.data.forEach(item => combined.push({ ...item, collection: colls[i] } as MaterialWithCollection));
    });
    setAllMaterials(combined.sort((a, b) => (a.title || "").localeCompare(b.title || "")));
  }, [h1.data, h2.data, h3.data, h4.data]);

  const handleUpdateTutorial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !configRef) return;
    const formData = new FormData(e.currentTarget);
    const link = formData.get('link') as string;
    
    startTransition(async () => {
      await setDoc(configRef, { tutorialLink: link, tutorialStatus: 'active' }, { merge: true });
      tutorialFormRef.current?.reset();
      toast({ title: "Tutorial Updated", description: "Meeting link is now live for students." });
    });
  };

  const handleDeleteTutorial = () => {
    if (!firestore || !configRef) return;
    
    startTransition(async () => {
      await setDoc(configRef, { tutorialLink: deleteField(), tutorialStatus: 'inactive' }, { merge: true });
      tutorialFormRef.current?.reset();
      toast({ title: "Tutorial Removed", description: "The live meeting link has been cleared." });
    });
  };

  const handleAddTestimonial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const text = formData.get('text') as string;
    const id = Date.now().toString();
    setDoc(doc(firestore, 'testimonials', id), { name, text, role: 'Student', order: testimonials?.length || 0 });
    (e.target as HTMLFormElement).reset();
    toast({ title: "Review Added", description: "Testimonial is now visible on home page." });
  };

  const handleDeleteTestimonial = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore, 'testimonials', id));
    toast({ title: "Review Deleted", description: "Testimonial removed from platform." });
  };

  const handleSendEmail = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserEmail) return;
    const formData = new FormData(e.currentTarget);
    const subject = formData.get('subject') as string;
    const message = formData.get('message') as string;

    startTransition(async () => {
      let success = false;
      if (selectedUserEmail === 'ALL_USERS') {
        const emails = usersData?.map(u => u.email).filter(Boolean) as string[] || [];
        success = await sendBulkEmailNotification(emails, subject, message);
        if (success) {
          toast({ title: "Broadcast Sent", description: `Message successfully sent to ${emails.length} students.` });
        } else {
          toast({ 
            title: "Delivery Error", 
            description: "Failed to broadcast message. Please check Resend dashboard.", 
            variant: "destructive" 
          });
        }
      } else {
        success = await sendEmailNotification(selectedUserEmail, subject, message);
        if (success) {
          toast({ title: "Email Sent", description: `Message successfully sent to ${selectedUserEmail}.` });
        } else {
          toast({ 
            title: "Delivery Error", 
            description: "Failed to send email. Ensure the student's email is valid.", 
            variant: "destructive" 
          });
        }
      }
      setSelectedUserEmail(null);
    });
  };

  const handleSaveMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore || !user) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isPremium = formData.get('access') === 'premium';
    const level = parseInt(formData.get('level') as string);
    const isFeatured = formData.get('isFeatured') === 'on';
    const categoryId = formData.get('categoryId') as string;
    const filePath = formData.get('filePath') as string;
    const coverFile = (e.currentTarget.elements.namedItem('coverImage') as HTMLInputElement).files?.[0];

    startTransition(async () => {
      let coverImage = editingMaterial?.coverImage || (level === 100 ? '/images/med-x 100lvl ebook cover.jpeg' : '/images/med-x 200lvl ebook cover.jpeg');
      if (coverFile) {
        coverImage = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(coverFile);
        });
      }

      const newCollection = `materials_${level}lvl_${isPremium ? 'premium' : 'free'}`;
      
      const updateData = {
        title,
        description,
        isPremium,
        level,
        isFeatured,
        coverImage,
        categoryId: categoryId || '',
        lastUpdateDate: new Date().toISOString(),
        filePath: filePath || editingMaterial?.filePath || '',
        author: 'MED-X',
        downloads: editingMaterial?.downloads || 0,
        type: 'E-Book',
        uploadDate: editingMaterial?.uploadDate || new Date().toISOString()
      };

      if (editingMaterial) {
        const oldCollection = editingMaterial.collection;
        if (oldCollection === newCollection) {
          updateDocumentNonBlocking(doc(firestore!, oldCollection, editingMaterial.id), updateData);
        } else {
          const fullData = { ...editingMaterial, ...updateData };
          delete (fullData as any).collection; 
          await setDoc(doc(firestore!, newCollection, editingMaterial.id), fullData);
          deleteDocumentNonBlocking(doc(firestore!, oldCollection, editingMaterial.id));
        }
        setEditingMaterial(null);
        toast({ title: "Material Updated", description: "Changes saved to the study hub." });
      } else {
        await addDoc(collection(firestore!, newCollection), updateData);
        setIsAddingMaterial(false);
        toast({ title: "Material Added", description: "New resource published successfully." });
      }
    });
  };

  const confirmDeleteMaterial = () => {
    if (!firestore || !materialToDelete) return;
    deleteDocumentNonBlocking(doc(firestore, materialToDelete.collection, materialToDelete.id));
    setMaterialToDelete(null);
    toast({ title: "Material Deleted", description: "Resource has been removed from the platform." });
  };

  const handleSaveCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firestore) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const level = parseInt(formData.get('level') as string);
    const order = parseInt(formData.get('order') as string) || 0;

    startTransition(async () => {
      if (editingCategory) {
        await setDoc(doc(firestore!, 'course_categories', editingCategory.id), { name, level, order }, { merge: true });
        setEditingCategory(null);
        toast({ title: "Category Updated", description: `"${name}" subject modified.` });
      } else {
        await addDoc(collection(firestore!, 'course_categories'), { name, level, order });
        setIsAddingCategory(false);
        toast({ title: "Category Added", description: `New ${level}L subject created.` });
      }
    });
  };

  const handleDeleteCategory = (id: string) => {
    if (!firestore) return;
    deleteDocumentNonBlocking(doc(firestore!, 'course_categories', id));
    toast({ title: "Category Deleted", description: "Subject removed from the platform." });
  };

  if (isProfileLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (userProfile?.role !== 'admin') return <div className="flex flex-col items-center justify-center h-[60vh]"><ShieldX className="h-16 w-16 text-destructive mb-4" /><h1 className="text-3xl font-bold">Access Denied</h1></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <ShieldAlert className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
                <p className="text-muted-foreground">Manage users, tutorials, and content resources.</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Activity className="h-4 w-4" /> DAU</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mounted ? dauCount : "..."}</div>
                  <p className="text-xs text-muted-foreground">Logins (24h)</p>
                </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><UsersIcon className="h-4 w-4" /> Users</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{usersData?.length || 0}</div><p className="text-xs text-muted-foreground">Total registered</p></CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Star className="h-4 w-4 fill-primary" /> Premium</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{usersData?.filter(u => u.isPremium).length || 0}</div><p className="text-xs text-muted-foreground">Active plans</p></CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Download className="h-4 w-4" /> Hits</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{allMaterials.reduce((acc, m) => acc + (m.downloads || 0), 0)}</div><p className="text-xs text-muted-foreground">Total downloads</p></CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BookOpen className="h-4 w-4" /> Library</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{allMaterials.length}</div><p className="text-xs text-muted-foreground">Live resources</p></CardContent>
            </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 lg:w-[800px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Materials</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="live">Misc</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <Card>
               <CardHeader><CardTitle>Platform Performance</CardTitle></CardHeader>
               <CardContent className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-center px-6 border-t bg-muted/5">
                 <Activity className="h-12 w-12 mb-4 opacity-20" />
                 <p className="italic">Usage analytics and engagement trends will populate as more student data is logged over time.</p>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <CardTitle className="shrink-0">User Accounts</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => setSelectedUserEmail('ALL_USERS')}>
                    <Send className="mr-2 h-4 w-4" /> Broadcast
                  </Button>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by email..." 
                    className="pl-9"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {isUsersLoading ? <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Expires In</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(u => {
                          const daysLeft = u.isPremium && u.subscriptionExpiresAt 
                            ? differenceInDays(parseISO(u.subscriptionExpiresAt), new Date()) 
                            : null;
                          const isExpired = u.isPremium && u.subscriptionExpiresAt && isAfter(new Date(), parseISO(u.subscriptionExpiresAt));

                          return (
                            <TableRow key={u.id}>
                              <TableCell className="font-medium max-w-[150px] truncate">{u.email}</TableCell>
                              <TableCell>
                                <Switch checked={!!u.isPremium} onCheckedChange={(checked) => {
                                  updateDocumentNonBlocking(doc(firestore!, 'users', u.id), {
                                    isPremium: checked,
                                    subscriptionExpiresAt: checked ? addMonths(new Date(), 1).toISOString() : null
                                  });
                                }} />
                              </TableCell>
                              <TableCell>
                                {mounted && u.isPremium && u.subscriptionExpiresAt ? (
                                  <Badge variant={isExpired ? "destructive" : "outline"} className="whitespace-nowrap">
                                    {isExpired ? 'Expired' : `${daysLeft} days`}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground text-xs italic">Free Plan</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select value={u.role || 'student'} onValueChange={(val) => updateDocumentNonBlocking(doc(firestore!, 'users', u.id), { role: val })}>
                                  <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedUserEmail(u.email)}><Mail className="h-4 w-4" /></Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Material Library</CardTitle>
                <Button size="sm" onClick={() => setIsAddingMaterial(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Material
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Hits</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allMaterials.map(m => (
                        <TableRow key={m.id}>
                          <TableCell className="font-medium truncate max-w-[200px]">{m.title}</TableCell>
                          <TableCell><Badge variant="outline">{m.level}L</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{m.downloads || 0}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Badge variant={m.isPremium ? 'destructive' : 'default'} className="text-[10px] uppercase">
                                {m.isPremium ? 'Premium' : 'Free'}
                              </Badge>
                              {m.isFeatured && (
                                <Badge variant="secondary" className="text-[10px] uppercase bg-amber-100 text-amber-700">Featured</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMaterial(m)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setMaterialToDelete(m)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader className="flex items-center justify-between">
                <div>
                  <CardTitle>Levels & Subjects</CardTitle>
                  <CardDescription>Manage the academic structure of the platform.</CardDescription>
                </div>
                <Button size="sm" onClick={() => setIsAddingCategory(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Category
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories?.map(cat => (
                        <TableRow key={cat.id}>
                          <TableCell className="font-bold">{cat.name}</TableCell>
                          <TableCell><Badge variant="outline">{cat.level} Level</Badge></TableCell>
                          <TableCell>{cat.order}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCategory(cat)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!categories?.length && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">No categories defined. Start by adding a subject.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Live Meeting</CardTitle>
                  <CardDescription>Share a Google Meet link for tutorials.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form ref={tutorialFormRef} onSubmit={handleUpdateTutorial} className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Meeting URL</Label>
                        {appConfig?.tutorialLink && (
                          <span className="text-[10px] text-primary font-bold bg-primary/10 px-2 py-0.5 rounded">Current: {appConfig.tutorialLink.substring(0, 20)}...</span>
                        )}
                      </div>
                      <Input name="link" placeholder="https://meet.google.com/..." />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1" disabled={isPending}>Update Link</Button>
                      {appConfig?.tutorialLink && (
                        <Button 
                          type="button" 
                          variant="destructive" 
                          onClick={handleDeleteTutorial}
                          className="px-3"
                          disabled={isPending}
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5" /> Add Student Review</CardTitle>
                  <CardDescription>Post feedback to the home page testimonials.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddTestimonial} className="space-y-4">
                    <div className="space-y-2"><Label>Student Name</Label><Input name="name" required /></div>
                    <div className="space-y-2"><Label>Testimonial Text</Label><Textarea name="text" required rows={2} /></div>
                    <Button type="submit" className="w-full">Post Review</Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Existing Reviews</CardTitle>
                <CardDescription>Manage active student testimonials.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full border rounded-md p-4 bg-muted/5">
                  {testimonials && testimonials.length > 0 ? (
                    <div className="space-y-4">
                      {testimonials.map((t) => (
                        <div key={t.id} className="flex items-start justify-between border-b border-border/40 pb-4 last:border-0 last:pb-0">
                          <div className="space-y-1">
                            <p className="font-bold">{t.name}</p>
                            <p className="text-sm text-muted-foreground italic leading-relaxed">"{t.text}"</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            onClick={() => handleDeleteTestimonial(t.id)}
                            className="shrink-0 ml-4 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 text-muted-foreground italic">No testimonials published.</div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Dialog */}
        <Dialog open={!!selectedUserEmail} onOpenChange={(o) => !o && setSelectedUserEmail(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px] max-h-[90dvh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="flex items-center gap-2">
                {selectedUserEmail === 'ALL_USERS' ? 'Broadcast Notification' : 'Direct Notification'}
              </DialogTitle>
              <DialogDescription>
                {selectedUserEmail === 'ALL_USERS' 
                  ? `Send a notification to all ${usersData?.length || 0} students.` 
                  : `Send a direct notification to ${selectedUserEmail}.`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendEmail} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-4">
                  <Alert variant="secondary" className="bg-primary/5 border-primary/20 py-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <AlertTitle className="text-xs font-bold">Verified Domain Active</AlertTitle>
                    <AlertDescription className="text-[10px] leading-tight">
                      Emails will be sent from <strong>support@medxstudy.com</strong>.
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2"><Label>Subject</Label><Input name="subject" required placeholder="Important Update" /></div>
                  <div className="space-y-2"><Label>Message</Label><Textarea name="message" required rows={8} placeholder="Type your message here..." /></div>
                </div>
              </div>
              <DialogFooter className="p-6 pt-2 shrink-0 border-t bg-muted/20">
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">{isPending ? 'Sending...' : 'Send Notification'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit/Add Material Dialog */}
        <Dialog open={!!editingMaterial || isAddingMaterial} onOpenChange={(o) => {
          if (!o) {
            setEditingMaterial(null);
            setIsAddingMaterial(false);
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90dvh] flex flex-col p-0 overflow-hidden shadow-2xl">
            <DialogHeader className="p-6 pb-2 shrink-0 bg-background">
              <DialogTitle>{editingMaterial ? 'Edit Content Resource' : 'Add New Material'}</DialogTitle>
              <DialogDescription>
                {editingMaterial ? `Update details for "${editingMaterial.title}".` : 'Enter the details for the new resource.'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSaveMaterial} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input name="title" defaultValue={editingMaterial?.title} required placeholder="Title of textbook/summary" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea name="description" defaultValue={editingMaterial?.description} rows={4} required placeholder="High-yield description..." />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <Input name="coverImage" type="file" accept="image/*" className="cursor-pointer" />
                    <p className="text-[10px] text-muted-foreground">
                      {editingMaterial ? 'Leave empty to keep existing cover.' : 'Recommended for professional appearance.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>PDF/E-book Link</Label>
                    <Input name="filePath" defaultValue={editingMaterial?.filePath} placeholder="https://drive.google.com/..." required={!editingMaterial} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Study Level</Label>
                      <Select name="level" defaultValue={editingMaterial?.level.toString() || "100"}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">100 Level</SelectItem>
                          <SelectItem value="200">200 Level</SelectItem>
                          <SelectItem value="300">300 Level</SelectItem>
                          <SelectItem value="400">400 Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Category / Subject</Label>
                      <Select name="categoryId" defaultValue={editingMaterial?.categoryId}>
                        <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                        <SelectContent>
                          {categories?.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name} ({cat.level}L)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl border bg-muted/10">
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Access & Visibility</Label>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Access Tier</Label>
                            <RadioGroup name="access" defaultValue={editingMaterial?.isPremium ? 'premium' : 'free'} className="flex items-center gap-4">
                                <div className="flex items-center gap-2"><RadioGroupItem value="free" id="edit-free" /><Label htmlFor="edit-free" className="text-xs">Free</Label></div>
                                <div className="flex items-center gap-2"><RadioGroupItem value="premium" id="edit-premium" /><Label htmlFor="edit-premium" className="text-xs">Premium</Label></div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm">Editor's Choice</Label>
                              <p className="text-[10px] text-muted-foreground italic">Highlight on home page.</p>
                            </div>
                            <Switch name="isFeatured" defaultChecked={editingMaterial?.isFeatured} />
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-6 pt-4 shrink-0 border-t bg-muted/20">
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => { setEditingMaterial(null); setIsAddingMaterial(false); }}>Cancel</Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>{isPending ? 'Saving...' : (editingMaterial ? 'Save Changes' : 'Publish Material')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Category Add/Edit Dialog */}
        <Dialog open={isAddingCategory || !!editingCategory} onOpenChange={(o) => { if (!o) { setIsAddingCategory(false); setEditingCategory(null); } }}>
          <DialogContent className="max-w-md shadow-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              <DialogDescription>Define a new subject or course category.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveCategory} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input name="name" defaultValue={editingCategory?.name} required placeholder="e.g. Gross Anatomy" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select name="level" defaultValue={editingCategory?.level.toString() || "100"}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                      <SelectItem value="300">300 Level</SelectItem>
                      <SelectItem value="400">400 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Order</Label>
                  <Input name="order" type="number" defaultValue={editingCategory?.order || 0} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Category'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!materialToDelete} onOpenChange={(o) => !o && setMaterialToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <span className="font-bold">"{materialToDelete?.title}"</span> from the platform. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMaterial} className="bg-destructive hover:bg-destructive/90">
                Delete Material
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}