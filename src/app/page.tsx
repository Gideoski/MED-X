'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WelcomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user && !isUserLoading) {
      router.replace('/home');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }
  
  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 15 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-foreground/5 animate-float"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 6 + 2}rem`,
              animationDuration: `${Math.random() * 10 + 5}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          >
            MED-X
          </span>
        ))}
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center">
        <Logo className="h-24 w-24 text-primary" />
        <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl">
          Welcome to <em className="text-primary not-italic">MED-X</em>
        </h1>
        <p className="max-w-md text-lg text-muted-foreground">
          Study smarter, not harder. Access curated e-books and materials designed for your success.
        </p>
        <Button asChild size="lg" className="text-lg">
          <Link href="/signup">Get Started</Link>
        </Button>
      </div>
    </div>
  );
}
