"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/navigation/back-button";
import { BookOpen, MessageCircle, Mail, ExternalLink } from "lucide-react";

const helpResources = [
  {
    title: "Documentation",
    description: "Browse comprehensive guides and tutorials",
    icon: BookOpen,
    action: "View Docs",
    href: "#",
  },
  {
    title: "Community Forum",
    description: "Ask questions and connect with other users",
    icon: MessageCircle,
    action: "Visit Forum",
    href: "#",
  },
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: Mail,
    action: "Contact Us",
    href: "#",
  },
];

const faqs = [
  {
    question: "How do I ask a question?",
    answer: "Click the 'Ask Question' button in the navigation bar or use the AI assistant for instant help.",
  },
  {
    question: "Can I edit my posts?",
    answer: "Yes, you can edit your posts within 24 hours of posting. Click the edit icon on your post.",
  },
  {
    question: "How does endorsement work?",
    answer: "Instructors and TAs can endorse helpful answers to highlight quality responses for the community.",
  },
  {
    question: "What are Quokka Points?",
    answer: "Quokka Points are earned through participation - asking questions, providing answers, and contributing to discussions.",
  },
];

export default function HelpSettingsPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Navigation */}
        <BackButton />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Help & Support</h1>
          <p className="text-muted-foreground mt-2">
            Get help and learn how to use QuokkAQ
          </p>
        </div>

        {/* Help Resources */}
        <div className="grid gap-4">
          {helpResources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card key={resource.title} className="glass-panel">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-accent/10">
                        <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                      </div>
                      <div>
                        <CardTitle>{resource.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {resource.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      {resource.action}
                      <ExternalLink className="h-4 w-4 ml-2" aria-hidden="true" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* FAQs */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>Quick answers to common questions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <h3 className="font-medium mb-2">{faq.question}</h3>
                <p className="text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
            <CardDescription>Version and diagnostic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">1.0.0-demo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Environment</span>
              <span className="font-mono">Development</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>October 2025</span>
            </div>
          </CardContent>
        </Card>

        {/* Back to Settings */}
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/settings">Back to Settings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
