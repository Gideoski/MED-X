
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/lib/data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

export default function HomePage() {
  const academicServices = services.filter(s => s.category === "Academic Services");
  const creativeServices = services.filter(s => s.category === "Creative & Non-Academic Services");
  const plugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  const featuredSlides = [
    {
      title: "MED-X E-BOOKS",
      subtitle: "Learn with purpose, not pressure...",
      description: "Clearly formatted study e-books, summaries, and Q&A packs designed by medical students for medical students.",
      cta: "Browse 100Lvl",
      href: "/100lvl",
      bg: "bg-primary/5"
    },
    {
      title: "PREMIUM ACCESS",
      subtitle: "Unlock your full potential",
      description: "Get unlimited access to advanced materials, exclusive Q&A packs, and downloadable revision guides.",
      cta: "Upgrade Now",
      href: "/premium",
      bg: "bg-accent/5"
    },
    {
        title: "CREATOR HUB",
        subtitle: "Share your expertise",
        description: "Join our team of verified creators and help fellow students by sharing your beautifully designed summaries.",
        cta: "Become a Creator",
        href: "/creators",
        bg: "bg-primary/10"
    }
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-16 pb-12 animate-in fade-in duration-1000">
      <section className="px-4">
        <Carousel
          plugins={[plugin.current]}
          className="w-full rounded-2xl overflow-hidden border border-border/50 shadow-lg"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {featuredSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className={`flex flex-col items-center justify-center p-12 text-center h-[400px] md:h-[500px] ${slide.bg}`}>
                  <h2 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-primary mb-4">
                    {slide.title}
                  </h2>
                  <h3 className="text-xl md:text-3xl font-bold text-foreground mb-6">
                    {slide.subtitle}
                  </h3>
                  <p className="max-w-2xl text-lg text-muted-foreground mb-8 leading-relaxed">
                    {slide.description}
                  </p>
                  <Button asChild size="lg" className="h-12 px-8 text-lg font-bold">
                    <Link href={slide.href}>
                      {slide.cta}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex left-4" />
          <CarouselNext className="hidden md:flex right-4" />
        </Carousel>
      </section>

      <section className="px-4">
        <Card className="bg-card/50 border-border/50 shadow-none backdrop-blur-sm">
          <CardContent className="p-8 text-center text-base md:text-lg leading-relaxed text-muted-foreground">
            <p className="mb-6 max-w-4xl mx-auto">
              MED-X helps students study smarter, not harder. Founded by Denzel, a med-student turned study-designer, MED-X produces clear, concise and beautifully formatted study e-books, summaries, Q&A packs, presentation slides and other materials so you can focus on learning.
            </p>
            <p className="font-semibold text-foreground max-w-3xl mx-auto border-t pt-6">
              Serving Nigerian undergraduates — especially medical, pharmacy and allied health students — with practical academic and creative materials.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="px-4">
        <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">📚 Our Services</h2>
            <p className="text-muted-foreground mt-2">Specialized support for your academic journey</p>
        </div>
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-6">
                <h3 className="mb-6 text-center text-2xl font-bold text-primary/80">🎓 Academic Services</h3>
                <div className="grid gap-6">
                    {academicServices.map((service) => (
                        <Card key={service.title} className="border-border/50 shadow-sm transition-all hover:shadow-md hover:scale-[1.01]">
                            <CardHeader>
                                <CardTitle className="flex items-start gap-4 text-xl">
                                    <service.icon className="mt-1 h-6 w-6 shrink-0 text-primary"/>
                                    <span>{service.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                                <p>{service.description}</p>
                                <p className="pt-2"><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                                {service.addOns && <p><strong className="text-foreground">Add-ons:</strong> {service.addOns}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <div className="space-y-6">
                <h3 className="mb-6 text-center text-2xl font-bold text-primary/80">✍️ Creative & Non-Academic Services</h3>
                 <div className="grid gap-6">
                    {creativeServices.map((service) => (
                        <Card key={service.title} className="border-border/50 shadow-sm transition-all hover:shadow-md hover:scale-[1.01]">
                            <CardHeader>
                                <CardTitle className="flex items-start gap-4 text-xl">
                                    <service.icon className="mt-1 h-6 w-6 shrink-0 text-primary"/>
                                    <span>{service.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                                <p>{service.description}</p>
                                <p className="pt-2"><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                                {service.addOns && <p><strong className="text-foreground">Add-ons:</strong> {service.addOns}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      </section>

      <section className="px-4 py-12 bg-primary/5 rounded-3xl text-center space-y-8">
        <h2 className="text-3xl font-bold">Ready to Study Smarter?</h2>
        <p className="max-w-2xl mx-auto text-muted-foreground">Join thousands of students who are using MED-X to simplify their studies and excel in their exams.</p>
        <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold">
                <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-10 text-lg font-bold border-primary text-primary hover:bg-primary/5">
                <Link href="/premium">
                    <Star className="mr-2 h-5 w-5" />
                    Go Premium
                </Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
