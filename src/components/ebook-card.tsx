'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EBook } from "@/lib/data";
import { Badge } from "./ui/badge";
import { Eye, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from '@/lib/utils';

const MAX_DESCRIPTION_LENGTH = 150;

export function EBookCard({ ebook, collection, isUserPremium }: { ebook: EBook; collection: string; isUserPremium: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongDescription = ebook.description.length > MAX_DESCRIPTION_LENGTH;
  const isLocked = ebook.isPremium && !isUserPremium;

  /**
   * Logic to determine the best cover image.
   * Prioritizes custom uploads and URLs over level-based defaults.
   */
  const getCoverImage = () => {
    const customImage = ebook.coverImage;
    
    // 1. HIGHEST PRIORITY: If we have a custom uploaded image (Storage URL) or a specific manual URL.
    if (customImage && (customImage.startsWith('http') || customImage.startsWith('data:'))) {
        const isGenericPlaceholder = customImage.includes('placehold.co') || customImage.includes('picsum.photos');
        // If it's NOT a generic placeholder (e.g. it's from Firebase Storage), return it immediately.
        if (!isGenericPlaceholder) return customImage;
    }

    // 2. High-Quality Themed Defaults (Matches based on title keywords)
    const title = ebook.title.toLowerCase();
    if (title.includes('embryology')) return '/images/embryology.png';
    if (title.includes('anatomy of the leg')) return '/images/anatomy of the leg.png';
    if (title.includes('csc study guide')) return '/images/csc study guide.png';
    if (title.includes('epithelial tissues')) return '/images/epithelial tissues.png';
    if (title.includes('igmc')) return '/images/IGMC Exam.png';
    if (title.includes('upper limb')) return '/images/upper limb.png';
    if (title.includes('respiratory system histology')) return '/images/respiratory system histology.png';

    // 3. Level-Based Defaults (If no custom image or themed default is available)
    const is100Lvl = collection.includes('100lvl') || ebook.level === 100;
    if (is100Lvl) return '/images/med-x 100lvl ebook cover.jpeg';

    // 4. Absolute Fallback (Use custom image if generic, otherwise logo)
    return customImage || '/images/MED-X logo.jpeg';
  };

  const coverSrc = getCoverImage();

  return (
    <Card className="flex flex-col overflow-hidden border-border/50 shadow-sm transition-shadow hover:shadow-md h-full">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] w-full bg-muted overflow-hidden">
          <Image 
            src={coverSrc}
            alt={ebook.title}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {ebook.isPremium && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              <Lock className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-5">
        <CardTitle className="mb-1 text-lg font-bold tracking-tight line-clamp-2">{ebook.title}</CardTitle>
        <p className="text-sm text-muted-foreground font-medium mb-3">by MED-X</p>
        <div className="text-sm leading-relaxed text-muted-foreground">
            <p className={cn(isLongDescription && !isExpanded && "line-clamp-3")}>
                {ebook.description}
            </p>
            {isLongDescription && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary text-xs font-semibold hover:underline mt-2 focus:outline-none"
                >
                    {isExpanded ? 'Read Less' : 'Read More'}
                </button>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-5 pt-0">
        {isLocked ? (
          <Button className="w-full h-11" asChild>
            <Link href="/premium">
              <Lock className="mr-2 h-4 w-4" />
              Upgrade to Read
            </Link>
          </Button>
        ) : (
          <Button className="w-full h-11" asChild>
            <Link href={`/ebooks/${ebook.id}?collection=${collection}`}>
              <Eye className="mr-2 h-4 w-4" /> Read Online
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
