'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { EBook } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Lock, FileText, Loader2, ArrowLeft, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ isPremium: boolean }>(userDocRef);
    const isUserPremium = userProfile?.isPremium ?? false;

    const handleReadClick = () => {
        if (!ebook || !ebook.filePath) return;

        if (ebookDocRef) {
            updateDoc(ebookDocRef, {
                downloads: increment(1)
            }).catch(err => {
                console.error("Failed to increment download count", err);
            });
        }

        window.open(ebook.filePath, '_blank');
    };
    
    const isLoading = isEbookLoading || isUserLoading || isProfileLoading;
    const isLocked = ebook && ebook.isPremium && !isUserPremium;

    if (isLoading) {
        return <div className="flex h-full min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!ebook) {
        return (
            <div className="space-y-6 text-center">
                 <p>E-book not found. It might have been moved or deleted.</p>
                 <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
        );
    }
    
    if (isLocked) {
        return (
            <div className="space-y-6">
                 <div>
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Go Back
                    </Button>
                </div>
                <Card className="max-w-2xl mx-auto text-center">
                    <CardHeader>
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                            <Lock className="h-8 w-8" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Premium Content Locked</CardTitle>
                        <CardDescription>
                            This e-book, "{ebook.title}", is only available to premium subscribers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">
                            Upgrade your plan to get instant access to this and all other premium materials on MED-X.
                        </p>
                        <Button asChild>
                            <Link href="/premium">
                                <Star className="mr-2 h-4 w-4" />
                                Upgrade to Premium
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{ebook.title}</CardTitle>
                            <CardDescription>by MED-X</CardDescription>
                        </div>
                        {ebook.isPremium && (
                            <Badge variant="destructive">
                                <Lock className="mr-1 h-3 w-3" />
                                Premium
                            </Badge>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-muted-foreground leading-relaxed">{ebook.description}</p>
                    
                    <div className="pt-4 border-t">
                        <h3 className="text-lg font-semibold mb-2">Access Document</h3>
                        <p className="text-sm text-muted-foreground mb-4">Click below to open the full e-book in your browser.</p>
                        <Button onClick={handleReadClick} size="lg" className="w-full">
                            <FileText className="mr-2 h-5 w-5" />
                            Open PDF in Reader
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
