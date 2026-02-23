'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EBook } from "@/lib/data";
import { Badge } from "./ui/badge";
import { Eye, Lock } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";
import { cn } from '@/lib/utils';

const MAX_DESCRIPTION_LENGTH = 150; // Heuristic length in characters

export function EBookCard({ ebook, collection, isUserPremium }: { ebook: EBook; collection: string; isUserPremium: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // A simple heuristic to check if the description is long enough to warrant a "Read More" button.
  const isLongDescription = ebook.description.length > MAX_DESCRIPTION_LENGTH;
  const isLocked = ebook.isPremium && !isUserPremium;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] w-full bg-muted flex items-center justify-center p-4">
          <Logo className="h-24 w-24 text-primary" />
          {ebook.isPremium && (
            <Badge variant="destructive" className="absolute top-2 right-2">
              <Lock className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="mb-1 text-lg">{ebook.title}</CardTitle>
        <p className="text-sm text-muted-foreground">by MED-X</p>
        <div className="mt-2 text-sm">
            <p className={cn(isLongDescription && !isExpanded && "line-clamp-4")}>
                {ebook.description}
            </p>
            {isLongDescription && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-primary font-semibold hover:underline mt-1 focus:outline-none"
                >
                    {isExpanded ? 'Read Less' : 'Read More'}
                </button>
            )}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isLocked ? (
          <Button className="w-full" asChild>
            <Link href="/premium">
              <Lock className="mr-2 h-4 w-4" />
              Upgrade to Read
            </Link>
          </Button>
        ) : (
          <Button className="w-full" asChild>
            <Link href={`/ebooks/${ebook.id}?collection=${collection}`}>
              <Eye className="mr-2 h-4 w-4" /> Read Online
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
