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
    // Generate fewer background elements for better performance
    const elements = Array.from({ length: 8 }).map(() => ({
      top: `${Math.random() * 90}%`,
      left: `${Math.random() * 90}%`,
      fontSize: `${Math.random() * 4 + 2}rem`,
      duration: `${Math.random() * 8 + 6}s`,
      delay: `${Math.random() * 3}s`,
    }));
    setBgElements(elements);
  }, []);

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-20">
        {mounted && bgElements.map((el, i) => (
          <span
            key={i}
            className="absolute font-bold text-primary/10 animate-float"
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
      <div className="relative z-10 flex flex-col items-center justify-center space-y-10 px-6 text-center">
        <div className="animate-in fade-in zoom-in duration-700">
           <Logo className="h-32 w-32 text-primary drop-shadow-2xl md:h-44 md:w-44" />
        </div>
        
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-150">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
            Welcome to <span className="text-primary whitespace-nowrap">MED-X</span>
          </h1>
          <p className="mx-auto max-w-[600px] text-lg text-muted-foreground sm:text-xl md:text-2xl font-medium">
            Study smarter, not harder. Access curated e-books and materials designed for your success.
          </p>
        </div>

        <div className="flex animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
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
