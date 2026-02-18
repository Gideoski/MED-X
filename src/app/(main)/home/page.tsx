import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { services } from "@/lib/data";
import { CheckCircle } from "lucide-react";

export default function HomePage() {
  const academicServices = services.filter(s => s.category === "Academic Services");
  const creativeServices = services.filter(s => s.category === "Creative & Non-Academic Services");

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-6xl font-extrabold tracking-tighter">
          <span className="text-primary">*MED-X*</span>
          <span className="block text-5xl text-foreground">E-BOOKS</span>
        </h1>
      </header>

      <section className="mb-12">
        <Card className="bg-card/80">
          <CardContent className="p-6 text-center text-lg text-muted-foreground">
            <p className="mb-4">Learn with purpose, not pressure...</p>
            <p className="mb-4 max-w-4xl mx-auto">
              MED-X helps students study smarter, not harder. Founded by Denzel, a med-student turned study-designer, MED-X produces clear, concise and beautifully formatted study e-books, summaries, Q&A packs, presentation slides and other materials so you can focus on learning.
            </p>
            <p className="font-semibold text-foreground max-w-3xl mx-auto">
              Serving Nigerian undergraduates — especially medical, pharmacy and allied health students — with practical academic and creative materials.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-8 text-center text-4xl font-bold tracking-tight">📚 Our Services</h2>
        
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
            <div>
                <h3 className="mb-6 text-center text-2xl font-semibold">🎓 Academic Services</h3>
                <div className="space-y-6">
                    {academicServices.map((service) => (
                        <Card key={service.title}>
                            <CardHeader>
                                <CardTitle className="flex items-start gap-3">
                                    <service.icon className="mt-1 h-6 w-6 shrink-0 text-primary"/>
                                    <span>{service.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-muted-foreground">
                                <p>{service.description}</p>
                                <p><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
                                {service.addOns && <p><strong className="text-foreground">Add-ons:</strong> {service.addOns}</p>}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
            <div>
                <h3 className="mb-6 text-center text-2xl font-semibold">✍️ Creative & Non-Academic Services</h3>
                 <div className="space-y-6">
                    {creativeServices.map((service) => (
                        <Card key={service.title}>
                            <CardHeader>
                                <CardTitle className="flex items-start gap-3">
                                    <service.icon className="mt-1 h-6 w-6 shrink-0 text-primary"/>
                                    <span>{service.title}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-muted-foreground">
                                <p>{service.description}</p>
                                <p><strong className="text-foreground">Ideal for:</strong> {service.idealFor}</p>
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
