'use client';

import { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Loader2, Star, CheckCircle2, ChevronRight, BookOpen, Search, Sparkles } from "lucide-react";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { aiQuizGenerator, AiQuizGeneratorOutput } from '@/ai/flows/ai-quiz-generator-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import Link from 'next/link';

type EBook = { id: string; title: string; description: string; isPremium: boolean; collection: string };
type QuizQuestion = AiQuizGeneratorOutput['quiz'][0];

export default function QuizzesPage() {
  const [selectedBook, setSelectedBook] = useState<EBook | null>(null);
  const [customTopic, setCustomTopic] = useState('');
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<{ isPremium: boolean }>(userDocRef);
  const isUserPremium = userProfile?.isPremium ?? false;

  const collections = [
    'materials_100lvl_free',
    'materials_100lvl_premium',
    'materials_200lvl_free',
    'materials_200lvl_premium',
  ];

  const collectionRefs = collections.map(c => 
    useMemoFirebase(() => firestore ? collection(firestore, c) : null, [firestore, c])
  );

  const h100f = useCollection<any>(collectionRefs[0]);
  const h100p = useCollection<any>(collectionRefs[1]);
  const h200f = useCollection<any>(collectionRefs[2]);
  const h200p = useCollection<any>(collectionRefs[3]);

  const [allBooks, setAllBooks] = useState<EBook[]>([]);

  useEffect(() => {
    const combined: EBook[] = [];
    [h100f, h100p, h200f, h200p].forEach((hook, i) => {
      if (hook.data) {
        hook.data.forEach(item => {
          combined.push({
            id: item.id,
            title: item.title,
            description: item.description,
            isPremium: item.isPremium,
            collection: collections[i]
          });
        });
      }
    });
    setAllBooks(combined.sort((a, b) => a.title.localeCompare(b.title)));
  }, [h100f.data, h100p.data, h200f.data, h200p.data]);

  const handleStartQuiz = (book: EBook) => {
    if (book.isPremium && !isUserPremium) return;
    
    setSelectedBook(book);
    setQuiz(null);
    setShowResults(false);
    setSelectedAnswers({});

    startTransition(async () => {
      const result = await aiQuizGenerator({ 
        topic: book.title, 
        description: book.description 
      });
      setQuiz(result.quiz);
    });
  };

  const handleStartCustomQuiz = () => {
    if (!customTopic.trim()) return;
    
    setSelectedBook({ 
      id: 'custom', 
      title: customTopic, 
      description: `AI generated quiz for ${customTopic}`, 
      isPremium: false, 
      collection: 'custom' 
    });
    setQuiz(null);
    setShowResults(false);
    setSelectedAnswers({});

    startTransition(async () => {
      const result = await aiQuizGenerator({ 
        topic: customTopic, 
        description: `Practice questions for university level ${customTopic}` 
      });
      setQuiz(result.quiz);
    });
  };

  const handleAnswerSelect = (index: number, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [index]: option }));
  };

  const score = quiz?.reduce((acc, q, i) => selectedAnswers[i] === q.correctAnswer ? acc + 1 : acc, 0) || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">AI Practice Quizzes</h1>
        <p className="text-muted-foreground text-lg">Test your knowledge with automatically generated practice questions.</p>
      </div>

      {!selectedBook ? (
        <div className="grid gap-8">
          {/* Custom Topic Generation */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Quick Topic Quiz
              </CardTitle>
              <CardDescription>Enter any study topic to generate a quiz instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Upper Limb Anatomy, Cellular Biology..." 
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStartCustomQuiz()}
                />
                <Button onClick={handleStartCustomQuiz} disabled={!customTopic.trim()}>
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* E-book Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Select from Materials
              </CardTitle>
              <CardDescription>Choose an existing e-book to generate a focused practice quiz.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {allBooks.length === 0 ? (
                  <div className="text-center py-12 border rounded-lg border-dashed">
                    <p className="text-muted-foreground">No study materials available yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">Try using the "Quick Topic Quiz" above instead!</p>
                  </div>
                ) : (
                  allBooks.map(book => (
                    <button
                      key={book.id}
                      onClick={() => handleStartQuiz(book)}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border text-left transition-all hover:bg-accent group",
                        book.isPremium && !isUserPremium && "opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{book.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{book.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {book.isPremium && (
                          <Star className="h-4 w-4 text-primary fill-primary" />
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setSelectedBook(null)} className="gap-2">
              <ChevronRight className="h-4 w-4 rotate-180" />
              Change Topic
            </Button>
            <h2 className="text-xl font-bold">Quiz: {selectedBook.title}</h2>
          </div>

          <Card className="min-h-[500px] flex flex-col">
            <CardContent className="flex-grow pt-6">
              {isPending ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 py-20">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-lg font-medium animate-pulse">MED-X AI is generating your questions...</p>
                </div>
              ) : quiz ? (
                <div className="space-y-8">
                  {quiz.map((q, i) => (
                    <div key={i} className="space-y-4">
                      <div className="flex gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {i + 1}
                        </span>
                        <p className="text-lg font-semibold leading-tight pt-1">{q.question}</p>
                      </div>
                      <RadioGroup
                        onValueChange={(val) => handleAnswerSelect(i, val)}
                        value={selectedAnswers[i]}
                        disabled={showResults}
                        className="ml-12 grid gap-3"
                      >
                        {q.options.map((opt, j) => {
                          const isCorrect = opt === q.correctAnswer;
                          const isSelected = selectedAnswers[i] === opt;
                          
                          return (
                            <Label
                              key={j}
                              htmlFor={`q-${i}-o-${j}`}
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer hover:bg-accent",
                                isSelected && !showResults && "border-primary bg-primary/5",
                                showResults && isCorrect && "border-green-500 bg-green-50 dark:bg-green-950/30",
                                showResults && isSelected && !isCorrect && "border-destructive bg-destructive/5"
                              )}
                            >
                              <RadioGroupItem value={opt} id={`q-${i}-o-${j}`} />
                              <span className="flex-1">{opt}</span>
                              {showResults && isCorrect && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    </div>
                  ))}

                  {!showResults ? (
                    <Button 
                      className="w-full h-12 text-lg font-bold" 
                      onClick={() => setShowResults(true)}
                      disabled={Object.keys(selectedAnswers).length < quiz.length}
                    >
                      Submit Quiz
                    </Button>
                  ) : (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Results</CardTitle>
                        <CardDescription className="text-lg">
                          You scored <span className="font-bold text-primary">{score} out of {quiz.length}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center gap-4">
                        <Button onClick={() => handleStartQuiz(selectedBook)}>
                          Retry Quiz
                        </Button>
                        <Button variant="outline" onClick={() => setSelectedBook(null)}>
                          Exit
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="py-20 text-center space-y-4">
                  <p className="text-destructive">Failed to generate quiz. Please try again.</p>
                  <Button onClick={() => handleStartQuiz(selectedBook)}>Retry</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
