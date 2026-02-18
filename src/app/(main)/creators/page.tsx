import { creators } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

export default function CreatorsPage() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Meet the MED-X Creators</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The team dedicated to helping you study smarter.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {creators.map((creator) => (
          <Card key={creator.id} className="text-center">
            <CardHeader className="items-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={creator.avatar} alt={creator.name} data-ai-hint={creator.imageHint} />
                <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent>
              <CardTitle>{creator.name}</CardTitle>
              <CardDescription className="text-primary">{creator.title}</CardDescription>
              <p className="mt-4 text-sm text-muted-foreground">{creator.bio}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      
      <section>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Creator Content Upload</CardTitle>
            <CardDescription>Verified creators can upload new PDF content here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">E-Book Title</Label>
              <Input id="title" placeholder="e.g. Intro to Human Anatomy" />
            </div>
             <div className="space-y-2">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <Input id="pdf-upload" type="file" accept=".pdf" />
            </div>
            <Button className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Upload Content
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
