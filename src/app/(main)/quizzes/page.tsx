'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer } from "lucide-react";

export default function QuizzesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <Card className="max-w-md w-full border-border/50 shadow-sm">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
            <Timer className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quizzes Coming Soon</CardTitle>
          <CardDescription>
            We're currently redesigning our practice quiz system to provide high-yield testing for all levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Check back soon for course-specific MCQs, flashcards, and revision packs designed to test your knowledge after reading our e-books.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
