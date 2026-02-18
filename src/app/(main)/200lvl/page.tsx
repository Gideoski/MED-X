import { EBookCard } from "@/components/ebook-card";
import { Input } from "@/components/ui/input";
import { ebooks } from "@/lib/data";
import { Search } from "lucide-react";

export default function Level200Page() {
  const level200Ebooks = ebooks.filter((book) => book.level === 200);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Advanced E-Books for 200-Level</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Explore our curated selection of e-books designed specifically for 200-level medical students, ensuring clarity and understanding.
        </p>
      </div>

      <div className="relative mx-auto max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Search for materials..." className="pl-10" />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {level200Ebooks.map((ebook) => (
          <EBookCard key={ebook.id} ebook={ebook} />
        ))}
      </div>
    </div>
  );
}
