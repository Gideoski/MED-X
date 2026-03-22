'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Logo from '@/components/logo';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';

export default function WelcomePage() {
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);
  const [bgElements, setBgElements] = useState<{ top: string; left: string; fontSize: string; duration: string; delay: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    // Minimal background elements for maximum performance
    const elements = Array.from({ length: 6 }).map(() => ({
      top: `${Math.random() * 80 + 10}%`,
      left: `${Math.random() * 80 + 10}%`,
      fontSize: `${Math.random() * 3 + 2}rem`,
      duration: `${Math.random() * 5 + 5}s`,
      delay: `${Math.random() * 2}s`,
    }));
    setBgElements(elements);
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-10">
        {mounted && bgElements.map((el, i) => (
          <span
            key={i}
            className="absolute font-bold text-primary animate-float"
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
      <div className="relative z-10 flex flex-col items-center justify-center space-y-12 px-6 text-center max-w-4xl mx-auto">
        <div className="animate-in fade-in zoom-in duration-500">
           <Logo className="h-32 w-32 text-primary drop-shadow-2xl md:h-44 md:w-44" />
        </div>
        
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 delay-100">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Welcome to <span className="text-primary whitespace-nowrap">MED-X</span>
          </h1>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-xl md:text-2xl font-medium leading-relaxed">
            Study smarter, not harder. Access curated e-books and materials designed for your academic success.
          </p>
        </div>

        <div className="flex animate-in fade-in slide-in-from-bottom-8 duration-500 delay-200">
          <Button 
            asChild 
            size="lg" 
            className="h-14 px-12 text-xl font-bold shadow-xl transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90"
          >
            <Link href={user ? "/home" : "/signup"}>Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
