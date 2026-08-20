'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
  UserCheck,
  Video,
  MessageSquareQuote,
  Activity
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, deleteDoc, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import type { EBook } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { addMonths, isAfter, subHours } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type MaterialWithCollection = EBook & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null, lastLoginAt?: string };
type Testimonial = { id: string, name: string, text: string, role: string, order: number };
type AppConfig = { tutorialLink: string; tutorialStatus: string };

export default function AdminPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const [allMaterials, setAllMaterials] = useState<MaterialWithCollection[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auth/Role Check
  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ role: string }>(userDocRef);

  // Data Fetching
  const usersRef = useMemoFirebase(() => (firestore ? collection(firestore, 'users') : null), [firestore]);
  const { data: usersData, isLoading: isUsersLoading } = useCollection<UserData>(usersRef);

  const testimonialsRef = useMemoFirebase(() => (firestore ? query(collection(firestore, 'testimonials'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: testimonials } = useCollection<Testimonial>(testimonialsRef);

  const configRef = useMemoFirebase(() => (firestore ? doc(firestore, 'config', 'global') : null), [firestore]);
  const { data: appConfig } = useDoc<AppConfig>(configRef);

  // DAU Calculation - Hydration safe
  const dauCount = useMemo(() => {
    if (!usersData || !mounted) return 0;
    const oneDayAgo = subHours(new Date(), 24);
    return usersData.filter(u => u.lastLoginAt && isAfter(new Date(u.lastLoginAt), oneDayAgo)).length;
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
    setDoc(configRef, { tutorialLink: link, tutorialStatus: 'active' }, { merge: true });
    toast({ title: "Tutorial Updated", description: "Meeting link is now live for students." });
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

  if (isProfileLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (userProfile?.role !== 'admin') return <div className="flex flex-col items-center justify-center h-[60vh]"><ShieldX className="h-16 w-16 text-destructive mb-4" /><h1 className="text-3xl font-bold">Access Denied</h1></div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
        <header className="flex items-center gap-4">
          <ShieldAlert className="h-10 w-10 text-primary" />
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Console</h1>
              <p className="text-muted-foreground">Manage users, tutorial links, and content performance.</p>
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
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><Download className="h-4 w-4" /> Engagement</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{allMaterials.reduce((acc, m) => acc + (m.downloads || 0), 0)}</div><p className="text-xs text-muted-foreground">Total downloads</p></CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-2"><BookOpen className="h-4 w-4" /> Library</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{allMaterials.length}</div><p className="text-xs text-muted-foreground">Live resources</p></CardContent>
            </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="live">Live & Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
             <Card>
               <CardHeader><CardTitle>Platform Health</CardTitle></CardHeader>
               <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground italic border-t">
                 Dashboard charts and engagement heatmaps are generated based on real-time Firestore events.
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader><CardTitle>User Management</CardTitle></CardHeader>
              <CardContent>
                {isUsersLoading ? <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData?.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.email}</TableCell>
                          <TableCell>
                            <Switch checked={!!u.isPremium} onCheckedChange={(checked) => {
                              updateDocumentNonBlocking(doc(firestore!, 'users', u.id), {
                                isPremium: checked,
                                subscriptionExpiresAt: checked ? addMonths(new Date(), 1).toISOString() : null
                              });
                            }} />
                          </TableCell>
                          <TableCell>
                            <Select value={u.role || 'student'} onValueChange={(val) => updateDocumentNonBlocking(doc(firestore!, 'users', u.id), { role: val })}>
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
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
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <Card>
              <CardHeader><CardTitle>Material Performance</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allMaterials.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{m.title}</TableCell>
                        <TableCell>{m.level} Lvl</TableCell>
                        <TableCell><Badge variant="secondary">{m.downloads || 0} hits</Badge></TableCell>
                        <TableCell>
                          <Badge variant={m.isPremium ? 'destructive' : 'default'}>
                            {m.isPremium ? 'Premium' : 'Free'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Tutorial Link</CardTitle>
                  <CardDescription>Update the Google Meet or Zoom link for Premium students.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateTutorial} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Link</Label>
                      <Input name="link" defaultValue={appConfig?.tutorialLink} placeholder="https://meet.google.com/..." />
                    </div>
                    <Button type="submit" className="w-full">Update Link</Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><MessageSquareQuote className="h-5 w-5" /> Add Testimonial</CardTitle>
                  <CardDescription>Add reviews for the homepage carousel.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddTestimonial} className="space-y-4">
                    <div className="space-y-2"><Label>Student Name</Label><Input name="name" required /></div>
                    <div className="space-y-2"><Label>Review Text</Label><Textarea name="text" required rows={2} /></div>
                    <Button type="submit" className="w-full">Publish Review</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}
