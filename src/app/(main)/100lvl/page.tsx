
'use client';

import { useState, useEffect, useMemo } from 'react';
import { EBookCard } from "@/components/ebook-card";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import type { EBook } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type EBookData = Omit<EBook, 'id'>;

export default function Level100Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
  const { data: userProfile } = useDoc<{ isPremium: boolean }>(userDocRef);
  const isUserPremium = userProfile?.isPremium ?? false;

  // Fetch Categories
  const catQuery = useMemoFirebase(() => (firestore ? query(collection(firestore, 'course_categories'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: categories } = useCollection<{ id: string; name: string; level: number }>(catQuery);
  const lvl100Categories = useMemo(() => categories?.filter(c => c.level === 100) || [], [categories]);

  // Fetch Materials
  const freeRef = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_free') : null), [firestore]);
  const premiumRef = useMemoFirebase(() => (firestore ? collection(firestore, 'materials_100lvl_premium') : null), [firestore]);

  const { data: freeEbooks, isLoading: isLoadingFree } = useCollection<EBookData>(freeRef);
  const { data: premiumEbooks, isLoading: isLoadingPremium } = useCollection<EBookData>(premiumRef);
  
  const allEbooks = useMemo(() => {
    const free = freeEbooks ? freeEbooks.map(e => ({ ...e, collection: 'materials_100lvl_free' })) : [];
    const prem = premiumEbooks ? premiumEbooks.map(e => ({ ...e, collection: 'materials_100lvl_premium' })) : [];
    return [...free, ...prem] as (EBook & { collection: string })[];
  }, [freeEbooks, premiumEbooks]);

  const filteredEbooks = allEbooks
    .filter(ebook => {
      const matchesSearch = ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) || (ebook.description?.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || ebook.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const isLoading = isUserLoading || isLoadingFree || isLoadingPremium;

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">100-Level Study Hub</h1>
        <p className="text-muted-foreground text-lg">Curated materials to help you excel in your first year.</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search e-books, summaries, and packs..." 
            className="pl-10 h-12 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Navigation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary/80 px-1">
            <Filter className="h-4 w-4" /> Filter by Course
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
              {lvl100Categories.map(cat => (
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
          <p className="text-muted-foreground text-lg">No materials found for this selection.</p>
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
