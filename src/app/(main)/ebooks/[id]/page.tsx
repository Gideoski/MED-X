'use client';

import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { EBook } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Lock, FileText, BrainCircuit, Loader2, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { aiQuizGenerator, AiQuizGeneratorOutput } from '@/ai/flows/ai-quiz-generator-flow';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type QuizQuestion = AiQuizGeneratorOutput['quiz'][0];

export default function EbookReaderPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const firestore = useFirestore();

    const ebookId = params.id as string;
    const collectionName = searchParams.get('collection');

    const ebookDocRef = useMemoFirebase(() => {
        if (!firestore || !collectionName || !ebookId) return null;
        return doc(firestore, collectionName, ebookId);
    }, [firestore, collectionName, ebookId]);

    const { data: ebook, isLoading: isEbookLoading } = useDoc<EBook>(ebookDocRef);
    
    const [isQuizLoading, startQuizTransition] = useTransition();
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);

    const handleGenerateQuiz = () => {
        if (!ebook || !ebook.description) return; 
        
        startQuizTransition(async () => {
            setQuiz(null);
            setShowResults(false);
            setSelectedAnswers({});
            const result = await aiQuizGenerator({ eBookContent: ebook.description });
            setQuiz(result.quiz);
        });
    };

    const handleAnswerSelect = (questionIndex: number, option: string) => {
        setSelectedAnswers(prev => ({ ...prev, [questionIndex]: option }));
    };

    const getScore = () => {
        if (!quiz) return 0;
        return quiz.reduce((score, question, index) => {
            return selectedAnswers[index] === question.correctAnswer ? score + 1 : score;
        }, 0);
    };

    const handleReadClick = () => {
        if (!ebook || !ebook.filePath) return;

        // Increment download count in Firestore (non-blocking)
        if (ebookDocRef) {
            updateDoc(ebookDocRef, {
                downloads: increment(1)
            }).catch(err => {
                console.error("Failed to increment download count", err);
                // We don't block the user or show an error for this, as it's a non-critical background task.
            });
        }

        // Open the PDF in a new tab for the user
        window.open(ebook.filePath, '_blank');
    };

    if (isEbookLoading) {
        return <div className="flex h-full min-h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!ebook) {
        return <div className="flex h-full min-h-[50vh] items-center justify-center"><p>E-book not found or you don't have permission to view it.</p></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Go Back
                </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-3xl">{ebook.title}</CardTitle>
                                    <CardDescription>by MED-X</CardDescription>
                                </div>
                                {ebook.isPremium && (
                                    <Badge variant="destructive">
                                        <Lock className="mr-1 h-3 w-3" />
                                        Premium
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{ebook.description}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Read Content</CardTitle>
                            <CardDescription>Open the PDF to view the full material.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleReadClick} className="w-full">
                                <FileText className="mr-2 h-4 w-4" />
                                Open PDF in Reader
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2 text-center">This will open the PDF in your browser's default viewer or your preferred PDF application.</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Practice Quiz</CardTitle>
                            <CardDescription>Test your knowledge based on the e-book's content.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!quiz && !isQuizLoading && (
                                <Button onClick={handleGenerateQuiz} className="w-full">
                                    <BrainCircuit className="mr-2 h-4 w-4" />
                                    Generate Quiz
                                </Button>
                            )}
                            {isQuizLoading && <div className="flex justify-center items-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
                            
                            {quiz && (
                                <div className="space-y-4">
                                    <ScrollArea className="h-[400px] pr-4">
                                        <div className="space-y-6">
                                            {quiz.map((q, i) => (
                                                <div key={i}>
                                                    <p className="font-semibold mb-2">{i + 1}. {q.question}</p>
                                                    <RadioGroup onValueChange={(value) => handleAnswerSelect(i, value)} disabled={showResults} value={selectedAnswers[i]}>
                                                        {q.options.map((option, j) => {
                                                            const isSelected = selectedAnswers[i] === option;
                                                            const isCorrect = q.correctAnswer === option;
                                                            
                                                            let labelClass = '';
                                                            let containerClass = 'border-transparent';
                                                            if (showResults) {
                                                                if (isCorrect) {
                                                                    labelClass = 'text-green-700 dark:text-green-400';
                                                                    containerClass = 'bg-green-100 dark:bg-green-900/50 border-green-500';
                                                                } else if (isSelected && !isCorrect) {
                                                                    labelClass = 'text-red-700 dark:text-red-400';
                                                                    containerClass = 'bg-red-100 dark:bg-red-900/50 border-red-500';
                                                                }
                                                            }

                                                            return (
                                                                <Label key={j} htmlFor={`q${i}-o${j}`} className={cn('flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-accent', containerClass, {'border-primary': isSelected && !showResults})}>
                                                                    <RadioGroupItem value={option} id={`q${i}-o${j}`} />
                                                                    <span className={cn('flex-1', labelClass)}>{option}</span>
                                                                </Label>
                                                            );
                                                        })}
                                                    </RadioGroup>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    {!showResults ? (
                                        <Button onClick={() => setShowResults(true)} className="mt-4 w-full" disabled={Object.keys(selectedAnswers).length !== quiz.length}>
                                            Check Answers
                                        </Button>
                                    ) : (
                                        <div className="mt-4 text-center p-4 bg-muted rounded-lg">
                                            <p className="font-bold text-lg">You scored: {getScore()} / {quiz.length}</p>
                                            <Button onClick={handleGenerateQuiz} disabled={isQuizLoading} variant="secondary" className="mt-2">
                                                {isQuizLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                                                Generate New Quiz
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
