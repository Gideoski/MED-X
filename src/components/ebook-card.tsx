import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EBook } from "@/lib/data";
import { Badge } from "./ui/badge";
import { Eye, Lock } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/logo";

export function EBookCard({ ebook, collection }: { ebook: EBook; collection: string }) {
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
        <p className="mt-2 text-sm line-clamp-4">{ebook.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button className="w-full" asChild>
          <Link href={`/ebooks/${ebook.id}?collection=${collection}`}>
            <Eye className="mr-2 h-4 w-4" /> Read Online
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
