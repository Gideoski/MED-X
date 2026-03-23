'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Star, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, limit } from "firebase/firestore";
import { EBookCard } from "@/components/ebook-card";
import type { EBook } from "@/lib/data";

/**
 * A simple scroll-triggered animation component.
 */
function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
      )}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const academicServices = services.filter(s => s.category === "Academic Services");
  const creativeServices = services.filter(s => s.category === "Creative & Non-Academic Services");
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const firestore = useFirestore();

  // Fetch a few free books for the "Free Content" section
  const free100Query = useMemoFirebase(() => (firestore ? query(collection(firestore, 'materials_100lvl_free'), limit(2)) : null), [firestore]);
  const free200Query = useMemoFirebase(() => (firestore ? query(collection(firestore, 'materials_200lvl_free'), limit(2)) : null), [firestore]);

  const { data: free100 } = useCollection<EBook>(free100Query);
  const { data: free200 } = useCollection<EBook>(free200Query);

  const featuredFree = [...(free100 || []), ...(free200 || [])].slice(0, 4);

  useEffect(() => {
    if (!api) return;
    
    setCurrent(api.selectedScrollSnap());
    
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const featuredSlides = [
    {
      title: "MED-X\nE-BOOKS",
      subtitle: "Learn with purpose...",
      description: "Clearly formatted study e-books, summaries, and Q&A packs designed by med students for med students.",
      cta: "Browse 100Lvl",
      href: "/100lvl",
      bg: "bg-primary/5"
    },
    {
      title: "PREMIUM\nACCESS",
      subtitle: "Unlock your potential",
      description: "Get unlimited access to advanced materials, exclusive Q&A packs, and downloadable revision guides.",
      cta: "Upgrade Now",
      href: "/premium",
      bg: "bg-accent/5"
    },
    {
        title: "CREATOR\nHUB",
        subtitle: "Share your expertise",
        description: "Join our team of verified creators and help fellow students by sharing your beautifully designed summaries.",
        cta: "Become a Creator",
        href: "/creators",
        bg: "bg-primary/10"
    }
  ];

  return (
    <div className="mx-auto w-full max-w-full space-y-12 md:space-y-24 pb-12 animate-in fade-in duration-1000 overflow-x-hidden">
      {/* Hero Carousel */}
      <section className="px-0 sm:px-4 w-full overflow-hidden relative group">
        <Carousel
          setApi={setApi}
          plugins={[plugin.current]}
          opts={{
            loop: true,
          }}
          className="w-full rounded-none sm:rounded-2xl overflow-hidden border-b sm:border border-border/50 shadow-sm"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {featuredSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className={`flex flex-col items-center justify-center p-6 md:p-12 text-center h-[380px] md:h-[500px] ${slide.bg}`}>
                  <h2 className="text-3xl md:text-7xl font-extrabold tracking-tighter text-primary mb-2 md:mb-4 whitespace-pre-line leading-[1.1]">
                    {slide.title}
                  </h2>
                  <h3 className="text-lg md:text-3xl font-bold text-foreground mb-4 md:mb-6">
                    {slide.subtitle}
                  </h3>
                  <p className="max-w-[280px] md:max-w-2xl text-[12px] md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed line-clamp-3 md:line-clamp-none">
                    {slide.description}
                  </p>
                  <Button asChild size="lg" className="h-9 md:h-12 px-5 md:px-8 text-xs md:text-lg font-bold">
                    <Link href={slide.href}>
                      {slide.cta}
                      <ArrowRight className="ml-2 h-3 w-3 md:h-5 md:w-5" />
                    </Link>
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Arrows */}
          <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 border-none bg-black/10 hover:bg-black/20 text-foreground dark:text-white backdrop-blur-sm transition-opacity" />
          <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 md:h-12 md:w-12 border-none bg-black/10 hover:bg-black/20 text-foreground dark:text-white backdrop-blur-sm transition-opacity" />

          {/* Custom Pagination Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {featuredSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  current === index 
                    ? "bg-white scale-125 shadow-md ring-2 ring-primary/20" 
                    : "bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </section>

      {/* Featured Free E-Books */}
      <section className="px-4 space-y-8">
        <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">🆓 Start Learning for Free</h2>
            <p className="text-muted-foreground text-sm md:text-base">Check out some of our high-quality study materials at no cost.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredFree.length > 0 ? (
            featuredFree.map((ebook, idx) => (
              <ScrollReveal key={ebook.id} delay={idx * 100}>
                <EBookCard 
                  ebook={ebook} 
                  collection={ebook.level === 100 ? 'materials_100lvl_free' : 'materials_200lvl_free'} 
                  isUserPremium={false} 
                />
              </ScrollReveal>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No featured free materials at the moment.
            </div>
          )}
        </div>
        
        <div className="flex justify-center pt-4">
            <Button asChild variant="ghost" className="text-primary hover:text-primary hover:bg-primary/5">
                <Link href="/100lvl">
                    View All Free Materials
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
      </section>

      {/* Services Section with Animations */}
      <section className="px-4">
        <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">📚 Our Specialized Services</h2>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">Modern solutions for the modern medical student</p>
        </div>
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-6">
                <h3 className="text-center text-lg md:text-2xl font-bold text-primary/80">🎓 Academic Excellence</h3>
                <div className="grid gap-4">
                    {academicServices.map((service, idx) => (
                        <ScrollReveal key={service.title} delay={idx * 50}>
                          <Card className="border-border/50 shadow-sm hover:border-primary/50 transition-colors">
                              <CardHeader className="p-5">
                                  <CardTitle className="flex items-center gap-3 text-base md:text-xl">
                                      <div className="p-2 bg-primary/10 rounded-lg">
                                        <service.icon className="h-5 w-5 text-primary"/>
                                      </div>
                                      <span>{service.title}</span>
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="p-5 pt-0 space-y-2 text-sm md:text-base text-muted-foreground">
                                  <p>{service.description}</p>
                                  <p><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                              </CardContent>
                          </Card>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
            <div className="space-y-6">
                <h3 className="text-center text-lg md:text-2xl font-bold text-primary/80">✍️ Creative Solutions</h3>
                 <div className="grid gap-4">
                    {creativeServices.map((service, idx) => (
                        <ScrollReveal key={service.title} delay={idx * 50}>
                          <Card className="border-border/50 shadow-sm hover:border-primary/50 transition-colors">
                              <CardHeader className="p-5">
                                  <CardTitle className="flex items-center gap-3 text-base md:text-xl">
                                      <div className="p-2 bg-primary/10 rounded-lg">
                                        <service.icon className="h-5 w-5 text-primary"/>
                                      </div>
                                      <span>{service.title}</span>
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="p-5 pt-0 space-y-2 text-sm md:text-base text-muted-foreground">
                                  <p>{service.description}</p>
                                  <p><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                              </CardContent>
                          </Card>
                        </ScrollReveal>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <ScrollReveal>
        <section className="mx-4 py-16 bg-primary/5 rounded-3xl text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold px-4">Ready to Study Smarter?</h2>
          <p className="max-w-xl mx-auto px-6 text-sm md:text-lg text-muted-foreground">Join thousands of students who are using MED-X to simplify their studies and excel in their exams.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-8 pt-4">
              <Button asChild size="lg" className="h-14 px-10 text-lg font-bold">
                  <Link href="/signup">
                      Get Started Now
                  </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-primary text-primary hover:bg-primary/5">
                  <Link href="/premium">
                      <Star className="mr-2 h-5 w-5" />
                      Explore Premium
                  </Link>
              </Button>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
