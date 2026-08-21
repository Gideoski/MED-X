
'use client';

import { useState, useMemo } from 'react';
import { EBookCard } from "@/components/ebook-card";
import { Input } from "@/components/ui/input";
import { Search, Filter, Rocket } from "lucide-react";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import type { EBook } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { isAfter } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type EBookData = Omit<EBook, 'id'>;

export default function Level400Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<{ isPremium: boolean; subscriptionExpiresAt?: string }>(userDocRef);
  
  // Expiry-aware Premium status
  const isUserPremium = userProfile?.isPremium && (
    !userProfile.subscriptionExpiresAt || 
    isAfter(new Date(userProfile.subscriptionExpiresAt), new Date())
  );

  const configRef = useMemoFirebase(() => (firestore ? doc(firestore, 'config', 'global') : null), [firestore]);
  const { data: appConfig, isLoading: isConfigLoading } = useDoc<{ enabledLevels?: number[] }>(configRef);

  const catQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: categories } = useCollection<{ id: string; name: string; level: number }>(catQuery);
  const lvl400Categories = useMemo(() => categories?.filter(c => c.level === 400) || [], [categories]);

  const freeRef = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_400lvl_free') : null), [firestore]);
  const premiumRef = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_400lvl_premium') : null), [firestore]);

  const { data: freeEbooks, isLoading: isLoadingFree } = useCollection<EBookData>(freeRef);
  const { data: premiumEbooks, isLoading: isLoadingPremium } = useCollection<EBookData>(premiumRef);
  
  const allEbooks = useMemo(() => {
    const free = freeEbooks ? freeEbooks.map(e => ({ ...e, id: e.title, collection: 'materials_400lvl_free' })) : [];
    const prem = premiumEbooks ? premiumEbooks.map(e => ({ ...e, id: e.title, collection: 'materials_400lvl_premium' })) : [];
    return [...free, ...prem] as (EBook & { collection: string })[];
  }, [freeEbooks, premiumEbooks]);

  const filteredEbooks = allEbooks
    .filter(ebook => {
      const matchesSearch = (ebook.title?.toLowerCase().includes(searchQuery.toLowerCase())) || (ebook.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || ebook.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));

  const isEnabled = appConfig?.enabledLevels?.includes(400);
  const isLoading = isUserLoading || isLoadingFree || isLoadingPremium || isConfigLoading;

  if (!isConfigLoading && !isEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <Card className="max-w-md w-full border-border/50 shadow-sm">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">400-Level Coming Soon</CardTitle>
            <CardDescription>
              Professional level materials and clinical case studies are being prepared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Final year resources will appear here once the academic level is officially enabled by the MED-X team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">400-Level Study Hub</h1>
        <p className="text-muted-foreground text-lg">Professional level materials and clinical case studies for graduates.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search resources, cases, and summaries..." 
            className="pl-10 h-12 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 px-1">
            <Filter className="h-4 w-4" /> Filter by Specialty
          </div>
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="flex gap-2">
              <Button 
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setSelectedCategory(null)}
              >
                All Materials
              </Button>
              {lvl400Categories.map(cat => (
                <Button 
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
           {[...Array(4)].map((_, i) => <div key={i} className="h-96 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filteredEbooks.length === 0 ? (
        <div className="text-center py-20 border rounded-3xl bg-muted/20">
          <p className="text-muted-foreground text-lg">No materials found for final year yet.</p>
          <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}>Clear all filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredEbooks.map((ebook) => (
            <EBookCard key={ebook.id} ebook={ebook as EBook} collection={ebook.collection} isUserPremium={isUserPremium} />
          ))}
        </div>
      )}
    </div>
  );
}
