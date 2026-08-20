'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PrivacyPolicyPage() {
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    setLastUpdated(formatted);
  }, []);

  return (
    <div className="container max-w-4xl mx-auto py-12 px-6 space-y-8">
      <Button asChild variant="ghost">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> 
          Back to Home
        </Link>
      </Button>
      
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground italic text-sm">Last Updated: {lastUpdated}</p>
      </div>

      <ScrollArea className="h-[700px] rounded-2xl border bg-card p-8 shadow-sm text-foreground leading-relaxed">
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">1. Introduction</h2>
            <p>
              Med-X prioritizes the protection of privacy and the security of personal data. This Privacy Policy describes the methods by which information is collected, utilized, and protected when provided through the e-learning platform. Platform operations comply with the Nigeria Data Protection Act (NDPA) 2023 and applicable global data protection standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">2. Information Collection and Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">Personal Data</h3>
                <p>Identifiable information such as name, email address, and academic level is collected during the registration process to personalize the learning experience and facilitate account-related communications.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg">Payment and Transactional Data</h3>
                <p>Financial transactions are handled securely by <strong>Paystack</strong>. Med-X does not store or process sensitive credit card information. Only transaction reference codes are received and stored to verify and activate Premium subscriptions.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg">Platform Engagement Data</h3>
                <p>To improve services, platform interactions including login frequency, material download history, and participation in live tutorials are tracked. This data is used solely for internal academic metrics and platform optimization.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">3. Legal Basis for Processing</h2>
            <p>
              Data processing is based on explicit consent provided at the time of account creation and is necessary for the performance of the service agreement, specifically providing access to e-learning materials.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">4. Data Sharing and Third Parties</h2>
            <p>
              Personal data is not sold or rented to third parties. Data is shared only with essential infrastructure service providers who are contractually bound to maintain data confidentiality and security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">5. Data Retention and Security</h2>
            <p>
              Data is retained for as long as the account remains active. Industry-standard encryption and security protocols are employed to prevent unauthorized access, alteration, or disclosure of information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">6. User Rights</h2>
            <p>
              User rights include requesting access to held data, requesting corrections to inaccurate information, or requesting the deletion of the account and associated data. Consent may be withdrawn at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">7. Cookies Policy</h2>
            <p>
              Strictly necessary cookies are used to manage authentication sessions and preserve user preferences, such as light or dark mode settings. These cookies are essential for core platform functionality.
            </p>
          </section>

          <section className="space-y-3 border-t pt-8">
            <h2 className="text-2xl font-bold text-primary">8. Contact Information</h2>
            <p>For questions regarding this policy or the exercise of data rights, contact the Med-X Data Privacy team:</p>
            <div className="pt-2">
              <Button asChild variant="default" className="h-12 px-8 font-bold shadow-lg">
                <Link href="https://wa.me/2349123338586" target="_blank">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Contact +234 912 333 8586
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
}
