
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EBook } from "@/lib/data";
import { Badge } from "./ui/badge";
import { Eye, Lock, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from '@/lib/utils';

const MAX_DESCRIPTION_LENGTH = 150;

export function EBookCard({ ebook, collection, isUserPremium }: { ebook: EBook; collection: string; isUserPremium: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongDescription = ebook.description.length > MAX_DESCRIPTION_LENGTH;
  const isLocked = ebook.isPremium && !isUserPremium;

  const getCoverImage = () => {
    const customImage = ebook.coverImage;
    if (customImage && (customImage.startsWith('data:image/') || customImage.includes('firebasestorage.googleapis.com'))) {
        return customImage;
    }
    if (customImage && customImage.startsWith('http') && !customImage.includes('placehold.co') && !customImage.includes('picsum.photos')) {
        return customImage;
    }
    const title = ebook.title.toLowerCase();
    if (title.includes('embryology')) return '/images/embryology.png';
    if (title.includes('leg')) return '/images/anatomy of the leg.png';
    if (title.includes('csc')) return '/images/csc study guide.png';
    if (title.includes('epithelial')) return '/images/epithelial tissues.png';
    if (title.includes('igmc')) return '/images/IGMC Exam.png';
    if (title.includes('upper limb')) return '/images/upper limb.png';
    if (title.includes('respiratory')) return '/images/respiratory system histology.png';

    return (collection.includes('100lvl') || ebook.level === 100) 
      ? '/images/med-x 100lvl ebook cover.jpeg' 
      : '/images/MED-X logo.jpeg';
  };

  return (
    <Card className="flex flex-col overflow-hidden border-border/50 shadow-sm transition-all duration-300 hover:shadow-lg h-full">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
          <Image 
            src={getCoverImage()}
            alt={ebook.title}
            fill
            className="object-cover transition-transform duration-500 hover:scale-110"
            sizes="(max-width: 768px) 100vw, 25vw"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
             {ebook.isPremium && (
                <Badge variant="destructive" className="shadow-lg"><Lock className="mr-1 h-3 w-3" /> Premium</Badge>
             )}
             <Badge variant="secondary" className="bg-black/40 text-white backdrop-blur-sm border-none">
                <Download className="mr-1 h-3 w-3" /> {ebook.downloads || 0}
             </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-5">
        <CardTitle className="mb-1 text-lg font-bold line-clamp-2">{ebook.title}</CardTitle>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Med-X Library</p>
        <div className="text-sm text-muted-foreground leading-relaxed">
            <p className={cn(isLongDescription && !isExpanded && "line-clamp-3")}>{ebook.description}</p>
            {isLongDescription && (
                <button onClick={() => setIsExpanded(!isExpanded)} className="text-primary text-xs font-bold hover:underline mt-2">
                    {isExpanded ? 'Read Less' : 'Read More'}
                </button>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        {isLocked ? (
          <Button className="w-full h-11 font-bold" asChild>
            <Link href="/premium"><Lock className="mr-2 h-4 w-4" /> Upgrade to Read</Link>
          </Button>
        ) : (
          <Button className="w-full h-11 font-bold" asChild>
            <Link href={`/ebooks/${ebook.id}?collection=${collection}`}><Eye className="mr-2 h-4 w-4" /> Open E-Book</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
