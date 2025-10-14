"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Moon, Shield, HelpCircle, ChevronRight } from "lucide-react";

const settingsCategories = [
  {
    title: "Notifications",
    description: "Manage email and push notification preferences",
    href: "/settings/notifications",
    icon: Bell,
  },
  {
    title: "Appearance",
    description: "Customize theme and display options",
    href: "/settings/appearance",
    icon: Moon,
  },
  {
    title: "Privacy",
    description: "Control your data and visibility settings",
    href: "/settings/privacy",
    icon: Shield,
  },
  {
    title: "Help & Support",
    description: "Get help, view documentation, and contact support",
    href: "/settings/help",
    icon: HelpCircle,
  },
];

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-6 py-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid gap-4">
          {settingsCategories.map((category) => {
            const Icon = category.icon;
            return (
              <Card key={category.href} className="glass-panel hover:bg-muted/20 transition-colors">
                <Link href={category.href}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        </div>
                        <div>
                          <CardTitle>{category.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {category.description}
                          </CardDescription>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Account Management */}
        <Card className="glass-panel border-danger/50">
          <CardHeader>
            <CardTitle className="text-danger">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that require careful consideration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="text-danger border-danger hover:bg-danger/10" disabled>
              Delete Account
              <span className="ml-2 text-xs text-muted-foreground">(Contact support)</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
