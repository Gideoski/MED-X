import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/lib/data";

export default function HomePage() {
  const academicServices = services.filter(s => s.category === "Academic Services");
  const creativeServices = services.filter(s => s.category === "Creative & Non-Academic Services");

  return (
    <div className="mx-auto max-w-7xl space-y-12 pb-12">
      <header className="text-center px-4">
        <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl">
          <span className="text-primary block sm:inline">*MED-X*</span>
          <span className="block text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-foreground mt-1">E-BOOKS</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground font-medium italic">Learn with purpose, not pressure...</p>
      </header>

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
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight md:text-4xl">📚 Our Services</h2>
        
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <div className="space-y-6">
                <h3 className="mb-6 text-center text-2xl font-bold text-primary/80">🎓 Academic Services</h3>
                <div className="grid gap-6">
                    {academicServices.map((service) => (
                        <Card key={service.title} className="border-border/50 shadow-sm transition-all hover:shadow-md">
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
                        <Card key={service.title} className="border-border/50 shadow-sm transition-all hover:shadow-md">
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
    </div>
  );
}
