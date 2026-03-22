'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';

export default function WelcomePage() {
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);
  const [bgElements, setBgElements] = useState<{ top: string; left: string; fontSize: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    // Generate background elements only on the client to avoid hydration mismatch
    const elements = Array.from({ length: 15 }).map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      fontSize: `${Math.random() * 6 + 2}rem`,
      duration: `${Math.random() * 10 + 5}s`,
      delay: `${Math.random() * 5}s`,
    }));
    setBgElements(elements);
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        {mounted && bgElements.map((el, i) => (
          <span
            key={i}
            className="absolute text-foreground/5 animate-float"
            style={{
              top: el.top,
              left: el.left,
              fontSize: el.fontSize,
              animationDuration: el.duration,
              animationDelay: el.delay,
            }}
          >
            MED-X
          </span>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8 px-6 text-center">
        <div className="animate-in fade-in zoom-in duration-1000">
           <Logo className="h-32 w-32 text-primary drop-shadow-2xl md:h-40 md:w-40" />
        </div>
        
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-1000 delay-200">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Welcome to <span className="text-primary whitespace-nowrap">MED-X</span>
          </h1>
          <p className="mx-auto max-w-[600px] text-lg text-muted-foreground sm:text-xl font-medium">
            Study smarter, not harder. Access curated e-books and materials designed for your success.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          {user ? (
            <Button 
              asChild 
              size="lg" 
              className="h-12 px-10 text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Link href="/home">Get Started</Link>
            </Button>
          ) : (
            <>
              <Button 
                asChild 
                size="lg" 
                className="h-12 px-10 text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button 
                asChild 
                variant="outline"
                size="lg" 
                className="h-12 px-10 text-lg font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <Link href="/login">Login</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
