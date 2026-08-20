
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowRight, MessageSquare, Quote, Star, Users } from "lucide-react";
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

  const testimonialsRef = useMemoFirebase(() => (firestore ? query(collection(firestore, 'testimonials'), orderBy('order', 'asc')) : null), [firestore]);
  const { data: testimonials } = useCollection<{ name: string; text: string; role: string }>(testimonialsRef);

  const f100q = useMemoFirebase(() => (firestore ? query(collection(firestore, 'materials_100lvl_free'), orderBy('title', 'asc')) : null), [firestore]);
  const { data: featured } = useCollection<EBook & { isFeatured?: boolean }>(f100q);

  const featuredMaterials = useMemo(() => featured?.filter(e => e.isFeatured === true) || [], [featured]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => { api.off("select", onSelect); api.off("reInit", onSelect); };
  }, [api]);

  return (
    <div className="mx-auto w-full max-w-full space-y-12 md:space-y-24 pb-12 animate-in fade-in duration-1000">
      <section className="px-0 sm:px-4 w-full">
        <Carousel setApi={setApi} plugins={[plugin.current]} opts={{ loop: true }} className="w-full rounded-none sm:rounded-2xl overflow-hidden border-b sm:border border-border/50 shadow-sm">
          <CarouselContent>
            <CarouselItem>
              <div className="flex flex-col items-center justify-center p-6 md:p-12 text-center h-[400px] md:h-[550px] bg-primary/5">
                <h2 className="text-4xl md:text-8xl font-extrabold tracking-tighter text-primary mb-4 leading-tight">STUDY<br/>SMARTER</h2>
                <p className="max-w-xl text-lg text-muted-foreground mb-8">Premium e-learning materials designed for medical excellence.</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="font-bold"><Link href="/100lvl">Start Learning</Link></Button>
                  <Button asChild variant="outline" size="lg" className="font-bold border-primary text-primary hover:bg-primary/5">
                    <Link href="https://tinyurl.com/medxchannel" target="_blank">
                      <Users className="mr-2 h-5 w-5" /> Join Channel
                    </Link>
                  </Button>
                </div>
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </section>

      {featuredMaterials.length > 0 && (
        <section className="px-4 space-y-8 animate-in fade-in duration-700">
          <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-4xl font-bold tracking-tight">⭐ Editor's Choice</h2>
              <p className="text-muted-foreground">Highest rated study resources for this semester.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMaterials.map((ebook, idx) => (
              <ScrollReveal key={ebook.id} delay={idx * 100}>
                <EBookCard ebook={ebook as EBook} collection="materials_100lvl_free" isUserPremium={false} />
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {testimonials && testimonials.length > 0 && (
        <section className="px-4 py-16 bg-muted/30">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-4xl font-bold">What Students Say</h2>
              <div className="flex justify-center gap-1"><Star className="h-5 w-5 fill-primary text-primary"/><Star className="h-5 w-5 fill-primary text-primary"/><Star className="h-5 w-5 fill-primary text-primary"/><Star className="h-5 w-5 fill-primary text-primary"/><Star className="h-5 w-5 fill-primary text-primary"/></div>
            </div>
            <Carousel opts={{ loop: true }} className="w-full">
              <CarouselContent>
                {testimonials.map((t, i) => (
                  <CarouselItem key={i}>
                    <Card className="border-none bg-transparent shadow-none">
                      <CardContent className="flex flex-col items-center text-center p-6 space-y-4">
                        <Quote className="h-10 w-10 text-primary/20 rotate-180" />
                        <p className="text-xl md:text-2xl font-medium italic text-foreground/80 leading-relaxed">"{t.text}"</p>
                        <div>
                          <p className="font-bold text-lg">{t.name}</p>
                          <p className="text-sm text-primary">{t.role}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden md:block"><CarouselPrevious /><CarouselNext /></div>
            </Carousel>
          </div>
        </section>
      )}

      <section className="px-4">
        <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Why Med-X?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">We provide the structure you need to master your medical curriculum.</p>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {academicServices.slice(0, 3).map((service, idx) => (
            <ScrollReveal key={service.title} delay={idx * 100}>
              <Card className="h-full border-border/50 hover:border-primary/50 transition-all duration-300">
                <CardHeader>
                  <div className="p-3 bg-primary/10 w-fit rounded-xl mb-4"><service.icon className="h-6 w-6 text-primary"/></div>
                  <CardTitle className="text-xl">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground leading-relaxed">
                  {service.description}
                </CardContent>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <ScrollReveal>
        <section className="mx-4 py-20 bg-primary rounded-[3rem] text-primary-foreground text-center space-y-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Users className="h-64 w-64" /></div>
          <h2 className="text-3xl md:text-6xl font-bold px-4 relative z-10">Join the Med-X Community</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto text-lg px-6 relative z-10">Stay updated with exam alerts, study tips, and new materials directly in our WhatsApp channel.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 px-8 relative z-10">
              <Button asChild size="lg" variant="secondary" className="h-16 px-10 text-xl font-bold shadow-2xl hover:scale-105 transition-transform">
                <Link href="https://tinyurl.com/medxchannel" target="_blank"><MessageSquare className="mr-2 h-6 w-6" /> WhatsApp Channel</Link>
              </Button>
              <Button asChild size="lg" className="h-16 px-10 text-xl font-bold border-2 border-white/20 bg-white/10 hover:bg-white/20 shadow-2xl hover:scale-105 transition-transform">
                <Link href="/premium">Explore Premium</Link>
              </Button>
          </div>
        </section>
      </ScrollReveal>
      
      <div className="text-center py-8 opacity-60">
        <Link href="/privacy" className="text-sm hover:underline">Privacy Policy & Terms of Service</Link>
      </div>
    </div>
  );
}
