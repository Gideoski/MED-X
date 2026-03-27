
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
import { useRef, useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { EBookCard } from "@/components/ebook-card";
import type { EBook } from "@/lib/data";

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.unobserve(entry.target); }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={cn("transition-all duration-700 ease-out", isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95")}>
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

  // We query the collections without a strict limit to ensure we find all e-books marked as featured.
  const free100Query = useMemoFirebase(() => (firestore ? query(collection(firestore, 'materials_100lvl_free'), orderBy('title', 'asc')) : null), [firestore]);
  const free200Query = useMemoFirebase(() => (firestore ? query(collection(firestore, 'materials_200lvl_free'), orderBy('title', 'asc')) : null), [firestore]);

  const { data: free100 } = useCollection<EBook & { isFeatured?: boolean }>(free100Query);
  const { data: free200 } = useCollection<EBook & { isFeatured?: boolean }>(free200Query);

  const featuredFree = useMemo(() => {
    const all = [
        ...(free100 ? free100.map(e => ({ ...e, collection: 'materials_100lvl_free' })) : []),
        ...(free200 ? free200.map(e => ({ ...e, collection: 'materials_200lvl_free' })) : [])
    ];
    
    // Strictly display ONLY items toggled as Featured in the Admin Console.
    // This gives the Admin absolute control over this section.
    return all.filter(e => e.isFeatured === true).slice(0, 4);
  }, [free100, free200]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); api.off("reInit", onSelect); };
  }, [api]);

  const featuredSlides = [
    { title: "MED-X\nE-BOOKS", subtitle: "Learn with purpose...", description: "Clearly formatted study e-books designed for med students.", cta: "Browse 100Lvl", href: "/100lvl", bg: "bg-primary/5" },
    { title: "PREMIUM\nACCESS", subtitle: "Unlock your potential", description: "Get unlimited access to advanced materials and revision guides.", cta: "Upgrade Now", href: "/premium", bg: "bg-accent/5" },
    { title: "CREATOR\nHUB", subtitle: "Share your expertise", description: "Join our team of verified creators and help fellow students.", cta: "Become a Creator", href: "/creators", bg: "bg-primary/10" }
  ];

  return (
    <div className="mx-auto w-full max-w-full space-y-12 md:space-y-24 pb-12 animate-in fade-in duration-1000 overflow-x-hidden">
      <section className="px-0 sm:px-4 w-full overflow-hidden relative group">
        <Carousel setApi={setApi} plugins={[plugin.current]} opts={{ loop: true }} className="w-full rounded-none sm:rounded-2xl overflow-hidden border-b sm:border border-border/50 shadow-sm">
          <CarouselContent>
            {featuredSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className={`flex flex-col items-center justify-center p-6 md:p-12 text-center h-[380px] md:h-[500px] ${slide.bg}`}>
                  <h2 className="text-3xl md:text-7xl font-extrabold tracking-tighter text-primary mb-2 md:mb-4 whitespace-pre-line leading-[1.1]">{slide.title}</h2>
                  <h3 className="text-lg md:text-3xl font-bold text-foreground mb-4 md:mb-6">{slide.subtitle}</h3>
                  <p className="max-w-2xl text-[12px] md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed line-clamp-3">{slide.description}</p>
                  <Button asChild size="lg" className="h-9 md:h-12 px-5 md:px-8 text-xs md:text-lg font-bold"><Link href={slide.href}>{slide.cta}<ArrowRight className="ml-2 h-3 w-3 md:h-5 md:w-5" /></Link></Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {featuredSlides.map((_, index) => (
              <button key={index} onClick={() => api?.scrollTo(index)} className={cn("w-2.5 h-2.5 rounded-full transition-all duration-300", current === index ? "bg-white scale-125 shadow-md ring-2 ring-primary/20" : "bg-white/40 hover:bg-white/60")} aria-label={`Go to slide ${index + 1}`} />
            ))}
          </div>
        </Carousel>
      </section>

      {/* Evaluation Content Section - Controlled by the Admin 'Featured' Toggle */}
      {featuredFree.length > 0 && (
        <section className="px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">🆓 Evaluation Content</h2>
              <p className="text-muted-foreground text-sm">Experience our high-yield materials for free.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredFree.map((ebook, idx) => (
              <ScrollReveal key={ebook.id} delay={idx * 100}>
                <EBookCard ebook={ebook as EBook} collection={(ebook as any).collection} isUserPremium={false} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      <section className="px-4">
        <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">📚 Specialized Services</h2>
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
                                      <div className="p-2 bg-primary/10 rounded-lg"><service.icon className="h-5 w-5 text-primary"/></div>
                                      <span>{service.title}</span>
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="p-5 pt-0 space-y-2 text-sm text-muted-foreground">
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
                                      <div className="p-2 bg-primary/10 rounded-lg"><service.icon className="h-5 w-5 text-primary"/></div>
                                      <span>{service.title}</span>
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="p-5 pt-0 space-y-2 text-sm text-muted-foreground">
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

      <ScrollReveal>
        <section className="mx-4 py-16 bg-primary/5 rounded-3xl text-center space-y-6">
          <h2 className="text-2xl md:text-4xl font-bold px-4">Ready to Study Smarter?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-8 pt-4">
              <Button asChild size="lg" className="h-14 px-10 text-lg font-bold"><Link href="/signup">Get Started Now</Link></Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-primary text-primary hover:bg-primary/5"><Link href="/premium">Explore Premium</Link></Button>
          </div>
        </section>
      </ScrollReveal>
    </div>
  );
}
