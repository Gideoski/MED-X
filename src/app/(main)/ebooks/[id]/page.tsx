
'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { EBook } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Lock, FileText, Loader2, ArrowLeft, Star, Download, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function EbookReaderPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const firestore = useFirestore();

    const ebookId = params.id as string;
    const collectionName = searchParams.get('collection');

    const ebookDocRef = useMemoFirebase(() => {
        if (!firestore || !collectionName || !ebookId) return null;
        return doc(firestore, collectionName, ebookId);
    }, [firestore, collectionName, ebookId]);

    const { data: ebook, isLoading: isEbookLoading } = useDoc<EBook>(ebookDocRef);
    const { user, isUserLoading } = useUser();
    
    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ isPremium: boolean }>(userDocRef);
    const isUserPremium = userProfile?.isPremium ?? false;

    const handleReadClick = () => {
        if (!ebook || !ebook.filePath) return;
        if (ebookDocRef) {
            updateDoc(ebookDocRef, { downloads: increment(1) }).catch(err => console.error(err));
        }
        window.open(ebook.filePath, '_blank');
    };
    
    const isLoading = isEbookLoading || isUserLoading || isProfileLoading;
    const isLocked = ebook && ebook.isPremium && !isUserPremium;

    if (isLoading) return <div className="flex h-[60vh] items-center justify-center animate-pulse"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!ebook) return <div className="text-center py-20 space-y-4"><p>Resource not found.</p><Button onClick={() => router.back()}>Go Back</Button></div>;
    
    if (isLocked) {
        return (
            <div className="max-w-2xl mx-auto py-12 space-y-8 animate-in zoom-in-95 duration-500">
                <Card className="text-center border-destructive/20 shadow-2xl">
                    <CardHeader className="space-y-4">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-inner"><Lock className="h-10 w-10" /></div>
                        <CardTitle className="text-3xl font-bold italic">Premium Locked</CardTitle>
                        <CardDescription>"{ebook.title}" is reserved for Premium students.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-muted-foreground text-lg">Access all e-books, live tutorials, and revision packs instantly.</p>
                        <Button asChild size="lg" className="w-full h-14 text-xl font-bold shadow-xl"><Link href="/premium"><Star className="mr-2 h-5 w-5 fill-primary-foreground" /> Upgrade for Access</Link></Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
            <Button variant="ghost" onClick={() => router.back()} className="hover:bg-primary/5"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Hub</Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-primary/10 shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-none">{ebook.level} Level</Badge>
                            {ebook.isPremium && <Badge variant="destructive"><Lock className="mr-1 h-3 w-3" /> Premium</Badge>}
                        </div>
                        <CardTitle className="text-4xl font-bold tracking-tight">{ebook.title}</CardTitle>
                        <CardDescription className="text-lg">Author: Med-X Education Team</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 py-8 border-y">
                        <p className="text-xl text-foreground/80 leading-relaxed font-medium">"{ebook.description}"</p>
                        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full"><Download className="h-4 w-4" /> <strong>{ebook.downloads || 0}</strong> Student Accesses</div>
                            <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full"><Clock className="h-4 w-4" /> Published: {new Date(ebook.uploadDate || Date.now()).toLocaleDateString()}</div>
                        </div>
                    </CardContent>
                    <CardFooter className="py-8 bg-muted/20">
                        <Button onClick={handleReadClick} size="lg" className="w-full h-16 text-2xl font-bold shadow-2xl hover:scale-[1.01] transition-transform">
                            <FileText className="mr-3 h-7 w-7" /> Open Full PDF Reader
                        </Button>
                    </CardFooter>
                </Card>
                
                <div className="space-y-6">
                   <Card><CardHeader><CardTitle className="text-lg">Reader Mode</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground leading-relaxed">Ensure you have a stable connection to load the full document. Downloads are logged for performance metrics.</CardContent></Card>
                   <Card className="bg-primary/5 border-primary/20"><CardHeader><CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Study Smarter</CardTitle></CardHeader><CardContent className="text-sm">Combine this reading with our live tutorial sessions for maximum retention.</CardContent></Card>
                </div>
            </div>
        </div>
    );
}
