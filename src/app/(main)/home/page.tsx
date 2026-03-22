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
      subtitle: "Learn with purpose...",
      description: "Clearly formatted study e-books, summaries, and Q&A packs designed by med students for med students.",
      cta: "Browse 100Lvl",
      href: "/100lvl",
      bg: "bg-primary/5"
    },
    {
      title: "PREMIUM ACCESS",
      subtitle: "Unlock your potential",
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
    <div className="mx-auto max-w-full space-y-10 md:space-y-16 pb-12 animate-in fade-in duration-1000 overflow-x-hidden">
      {/* Hero Carousel */}
      <section className="px-0 sm:px-4">
        <Carousel
          plugins={[plugin.current]}
          className="w-full rounded-none sm:rounded-2xl overflow-hidden border-b sm:border border-border/50 shadow-sm"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {featuredSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center h-[350px] md:h-[500px] ${slide.bg}`}>
                  <h2 className="text-3xl md:text-6xl font-extrabold tracking-tighter text-primary mb-2 md:mb-4">
                    {slide.title}
                  </h2>
                  <h3 className="text-lg md:text-3xl font-bold text-foreground mb-4 md:mb-6">
                    {slide.subtitle}
                  </h3>
                  <p className="max-w-xs md:max-w-2xl text-xs md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed line-clamp-3 md:line-clamp-none">
                    {slide.description}
                  </p>
                  <Button asChild size="lg" className="h-10 md:h-12 px-6 md:px-8 text-sm md:text-lg font-bold">
                    <Link href={slide.href}>
                      {slide.cta}
                      <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                    </Link>
                  </Button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden lg:flex left-4" />
          <CarouselNext className="hidden lg:flex right-4" />
        </Carousel>
      </section>

      {/* About Section */}
      <section className="px-4">
        <Card className="bg-card/50 border-border/50 shadow-none backdrop-blur-sm">
          <CardContent className="p-6 md:p-8 text-center text-sm md:text-lg leading-relaxed text-muted-foreground">
            <p className="mb-4 md:mb-6 max-w-4xl mx-auto">
              MED-X helps students study smarter, not harder. Founded by Denzel, a med-student turned study-designer, MED-X produces clear, concise and beautifully formatted study materials so you can focus on learning.
            </p>
            <p className="font-semibold text-foreground max-w-3xl mx-auto border-t pt-4 md:pt-6">
              Serving Nigerian undergraduates — especially medical, pharmacy and allied health students — with practical academic and creative materials.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Services Section */}
      <section className="px-4">
        <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">📚 Our Services</h2>
            <p className="text-muted-foreground mt-2 text-xs md:text-base">Specialized support for your academic journey</p>
        </div>
        
        <div className="grid grid-cols-1 gap-8 md:gap-12 lg:grid-cols-2">
            <div className="space-y-4 md:space-y-6">
                <h3 className="mb-4 md:mb-6 text-center text-xl md:text-2xl font-bold text-primary/80">🎓 Academic Services</h3>
                <div className="grid gap-4">
                    {academicServices.map((service) => (
                        <Card key={service.title} className="border-border/50 shadow-sm transition-all hover:scale-[1.01]">
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="flex items-start gap-3 text-base md:text-xl">
                                    <service.icon className="mt-1 h-5 w-5 shrink-0 text-primary"/>
                                    <span>{service.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-2 text-[10px] sm:text-xs md:text-base text-muted-foreground leading-relaxed">
                                <p>{service.description}</p>
                                <p><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <div className="space-y-4 md:space-y-6">
                <h3 className="mb-4 md:mb-6 text-center text-xl md:text-2xl font-bold text-primary/80">✍️ Creative Services</h3>
                 <div className="grid gap-4">
                    {creativeServices.map((service) => (
                        <Card key={service.title} className="border-border/50 shadow-sm transition-all hover:scale-[1.01]">
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="flex items-start gap-3 text-base md:text-xl">
                                    <service.icon className="mt-1 h-5 w-5 shrink-0 text-primary"/>
                                    <span>{service.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0 space-y-2 text-[10px] sm:text-xs md:text-base text-muted-foreground leading-relaxed">
                                <p>{service.description}</p>
                                <p><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-4 py-10 md:py-16 bg-primary/5 rounded-2xl text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold px-4">Ready to Study Smarter?</h2>
        <p className="max-w-xl mx-auto px-6 text-xs md:text-base text-muted-foreground">Join thousands of students who are using MED-X to simplify their studies and excel in their exams.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 px-8">
            <Button asChild size="lg" className="h-12 md:h-14 px-8 text-sm md:text-lg font-bold">
                <Link href="/signup">Get Started Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 md:h-14 px-8 text-sm md:text-lg font-bold border-primary text-primary hover:bg-primary/5">
                <Link href="/premium">
                    <Star className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                    Go Premium
                </Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
