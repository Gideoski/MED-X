'use client';

import { useState, useEffect } from 'react';
import { EBookCard } from "@/components/ebook-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { EBook } from '@/lib/data';

type EBookData = Omit<EBook, 'id'>;

export default function Level100Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<{ isPremium: boolean }>(userDocRef);
  const isPremium = userProfile?.isPremium ?? false;

  const freeCollectionRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return collection(firestore, 'materials_100lvl_free');
  }, [firestore]);

  const premiumCollectionRef = useMemoFirebase(() => {
      if (!firestore || !isPremium) return null;
      return collection(firestore, 'materials_100lvl_premium');
  }, [firestore, isPremium]);

  const { data: freeEbooks, isLoading: isLoadingFree } = useCollection<EBookData>(freeCollectionRef);
  const { data: premiumEbooks, isLoading: isLoadingPremium } = useCollection<EBookData>(premiumCollectionRef);
  
  const [allEbooks, setAllEbooks] = useState<(EBook & { collection: string })[]>([]);

  useEffect(() => {
    const freeWithCollection = freeEbooks ? freeEbooks.map(ebook => ({ ...ebook, collection: 'materials_100lvl_free' })) : [];
    const premiumWithCollection = premiumEbooks && isPremium ? premiumEbooks.map(ebook => ({ ...ebook, collection: 'materials_100lvl_premium' })) : [];
    
    const combined = [
        ...freeWithCollection,
        ...premiumWithCollection
    ];
    setAllEbooks(combined as (EBook & { collection: string })[]);
  }, [freeEbooks, premiumEbooks, isPremium]);


  const filteredEbooks = allEbooks.filter(
    (ebook) =>
      ebook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ebook.description && ebook.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ebook.author && ebook.author.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  const isLoading = isUserLoading || isProfileLoading || isLoadingFree || (isPremium && isLoadingPremium);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Essential E-Books for 100-Level</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore our curated selection of e-books designed specifically for 100-level medical students, ensuring clarity and understanding.
        </p>
      </div>

      <div className="relative mx-auto max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Search for materials..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {isLoading && <p className="text-center text-muted-foreground">Loading materials...</p>}
      
      {!isLoading && filteredEbooks.length === 0 && (
        <p className="text-center text-muted-foreground">No materials found.</p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredEbooks.map((ebook) => (
          <EBookCard key={ebook.id} ebook={ebook as EBook} collection={ebook.collection} />
        ))}
      </div>
    </div>
  );
}
