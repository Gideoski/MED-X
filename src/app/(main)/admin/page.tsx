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
  CheckCircle2
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, setDoc, query, orderBy, deleteField } from 'firebase/firestore';
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
} from "@/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type MaterialWithCollection = EBook & { id: string; collection: string };
type UserData = { id: string, email: string, isPremium: boolean, role: string, subscriptionExpiresAt?: string | null, lastLoginAt?: string };
type Testimonial = { id: string, name: string, text: string, role: string, order: number };
type AppConfig = { tutorialLink: string; tutorialStatus: string };

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

  const filteredUsers = useMemo(() => {
    if (!usersData) return [];
    return usersData.filter(u => 
      u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
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

  const handleEditMaterial = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingMaterial || !firestore) return;

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const isPremium = formData.get('access') === 'premium';
    const level = parseInt(formData.get('level') as string);
    const isFeatured = formData.get('isFeatured') === 'on';
    const coverFile = (e.currentTarget.elements.namedItem('coverImage') as HTMLInputElement).files?.[0];

    startTransition(async () => {
      let coverImage = editingMaterial.coverImage;
      if (coverFile) {
        coverImage = await new Promise<string>((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result as string);
          reader.onerror = rej;
          reader.readAsDataURL(coverFile);
        });
      }

      const oldCollection = editingMaterial.collection;
      const newCollection = `materials_${level}lvl_${isPremium ? 'premium' : 'free'}`;
      
      const updateData = {
        title,
        description,
        isPremium,
        level,
        isFeatured,
        coverImage,
        lastUpdateDate: new Date().toISOString()
      };

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
    });
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
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="live">Live & Reviews</TabsTrigger>
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
              <CardHeader><CardTitle>Material Library</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Hits</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Edit</TableHead>
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
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingMaterial(m)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
          <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedUserEmail === 'ALL_USERS' ? 'Broadcast Notification' : 'Direct Notification'}
              </DialogTitle>
              <DialogDescription>
                {selectedUserEmail === 'ALL_USERS' 
                  ? `Send a notification to all ${usersData?.length || 0} students.` 
                  : `Send a direct notification to ${selectedUserEmail}.`}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <Alert variant="secondary" className="bg-primary/5 border-primary/20 py-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertTitle className="text-xs font-bold">Verified Domain Active</AlertTitle>
                <AlertDescription className="text-[10px] leading-tight">
                  Emails will be sent from <strong>support@medxstudy.com</strong>.
                </AlertDescription>
              </Alert>
              <div className="space-y-2"><Label>Subject</Label><Input name="subject" required placeholder="Important Update" /></div>
              <div className="space-y-2"><Label>Message</Label><Textarea name="message" required rows={4} placeholder="Type your message here..." /></div>
              <DialogFooter>
                <Button type="submit" disabled={isPending} className="w-full sm:w-auto">{isPending ? 'Sending...' : 'Send Notification'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Material Dialog */}
        <Dialog open={!!editingMaterial} onOpenChange={(o) => !o && setEditingMaterial(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Content Resource</DialogTitle>
              <DialogDescription>Update details for "{editingMaterial?.title}".</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditMaterial} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input name="title" defaultValue={editingMaterial?.title} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingMaterial?.description} rows={3} required />
              </div>
              
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <Input name="coverImage" type="file" accept="image/*" />
                <p className="text-[10px] text-muted-foreground">Leave empty to keep existing cover.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select name="level" defaultValue={editingMaterial?.level.toString()}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 Level</SelectItem>
                      <SelectItem value="200">200 Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Access Type</Label>
                  <RadioGroup name="access" defaultValue={editingMaterial?.isPremium ? 'premium' : 'free'} className="flex h-10 items-center gap-4">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="free" id="edit-free" />
                      <Label htmlFor="edit-free">Free</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="premium" id="edit-premium" />
                      <Label htmlFor="edit-premium">Premium</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label>Editor's Choice</Label>
                  <p className="text-xs text-muted-foreground">Feature this on the Home page spotlight.</p>
                </div>
                <Switch name="isFeatured" defaultChecked={editingMaterial?.isFeatured} />
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingMaterial(null)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}
