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
              Med-X ("we", "our", or "us") is committed to protecting the privacy and security of your personal data. This Privacy Policy describes how we collect, use, and protect the information you provide when using our e-learning platform. We operate in compliance with the Nigeria Data Protection Regulation (NDPR) and other applicable global data protection standards.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">2. Information Collection and Use</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg">Personal Data</h3>
                <p>We collect identifiable information such as your name, email address, and academic level during the registration process to personalize your learning experience and provide account-related communications.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg">Payment and Transactional Data</h3>
                <p>Financial transactions are handled securely by <strong>Paystack</strong>. We do not store or process sensitive credit card information on our servers. We only receive and store transaction reference codes to verify and activate Premium subscriptions.</p>
              </div>
              <div>
                <h3 className="font-bold text-lg">Platform Engagement Data</h3>
                <p>To improve our services, we track platform interactions including login frequency, material download history, and participation in live tutorials. This data is used solely for internal academic metrics and platform optimization.</p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">3. Legal Basis for Processing</h2>
            <p>
              We process your data based on your explicit consent given at the time of account creation and for the performance of our contract with you (i.e., providing access to e-learning materials).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">4. Data Sharing and Third Parties</h2>
            <p>
              We do not sell or rent your personal data to third parties. We share data only with essential service providers (e.g., Google Firebase for database hosting) who are contractually bound to maintain your data's confidentiality and security.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">5. Data Retention and Security</h2>
            <p>
              Your data is retained for as long as your account is active. We employ industry-standard encryption and security protocols to prevent unauthorized access, alteration, or disclosure of your information.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">6. Your Rights</h2>
            <p>
              As a user, you have the right to request access to the data we hold, request corrections to inaccurate information, or request the deletion of your account and associated data. You may also withdraw your consent at any time.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-bold text-primary">7. Cookies Policy</h2>
            <p>
              We use strictly necessary cookies to manage authentication sessions and preserve user preferences (such as light/dark mode). These cookies are essential for the platform's core functionality.
            </p>
          </section>

          <section className="space-y-3 border-t pt-8">
            <h2 className="text-2xl font-bold text-primary">8. Contact Information</h2>
            <p>For any questions regarding this policy or to exercise your data rights, please contact the Med-X Data Privacy team:</p>
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
