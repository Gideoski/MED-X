import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { EBook } from "@/lib/data";
import { Badge } from "./ui/badge";
import { Download, Eye, Lock } from "lucide-react";

export function EBookCard({ ebook }: { ebook: EBook }) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="p-0">
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={ebook.coverImage}
            alt={`Cover of ${ebook.title}`}
            fill
            className="object-cover"
            data-ai-hint={ebook.imageHint}
          />
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
        <p className="text-sm text-muted-foreground">by {ebook.author}</p>
        <p className="mt-2 text-sm">{ebook.description}</p>
      </CardContent>
      <CardFooter className="flex gap-2 p-4 pt-0">
        <Button className="w-full">
          <Eye className="mr-2 h-4 w-4" /> Read Online
        </Button>
        <Button variant="outline" className="w-full" disabled={ebook.isPremium}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </CardFooter>
    </Card>
  );
}
