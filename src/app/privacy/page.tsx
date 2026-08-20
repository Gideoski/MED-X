
'use client';

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl mx-auto py-12 px-6 space-y-8">
      <Button asChild variant="ghost"><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Home</Link></Button>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground italic">Last Updated: October 2023</p>
      </div>

      <ScrollArea className="h-[600px] rounded-md border p-8 bg-card text-foreground leading-relaxed space-y-8">
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">1. Information We Collect</h2>
            <p>At Med-X, we collect personal information you provide directly to us when creating an account, such as your email address, name, and payment information processed via Paystack. We also track login timestamps and material downloads to provide academic metrics.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">2. How We Use Your Data</h2>
            <p>We use the data to authenticate your access, manage Premium subscriptions, track individual educational progress, and improve our curated e-book selections. We do not sell your personal data to third parties.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">3. Third-Party Services</h2>
            <p>We use Google GenAI for help-bot assistance and Paystack for payment processing. Each service has its own privacy policies which govern their handling of your data during those specific interactions.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">4. Cookies</h2>
            <p>We use cookies to maintain your login session and theme preferences. You can disable cookies in your browser settings, though some platform features may not function correctly.</p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">5. Contact Us</h2>
            <p>For any questions regarding your data or this policy, please contact the Med-X team via the WhatsApp community channel.</p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
