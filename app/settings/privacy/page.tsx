"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Shield } from "lucide-react";

export default function PrivacySettingsPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Back to Settings</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Privacy & Security</h1>
            <p className="text-muted-foreground mt-2">
              Control your data and visibility
            </p>
          </div>
        </div>

        {/* Profile Visibility */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Profile Visibility</CardTitle>
            <CardDescription>Control who can see your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="public-profile">Public Profile</Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to view your profile
                </p>
              </div>
              <Switch id="public-profile" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-email">Show Email</Label>
                <p className="text-sm text-muted-foreground">
                  Display your email address on your profile
                </p>
              </div>
              <Switch id="show-email" />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-activity">Show Activity</Label>
                <p className="text-sm text-muted-foreground">
                  Let others see your recent activity
                </p>
              </div>
              <Switch id="show-activity" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Data & Privacy */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Data & Privacy</CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="analytics">Analytics</Label>
                <p className="text-sm text-muted-foreground">
                  Help improve QuokkaQ by sharing anonymous usage data
                </p>
              </div>
              <Switch id="analytics" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="personalization">Personalization</Label>
                <p className="text-sm text-muted-foreground">
                  Allow personalized content recommendations
                </p>
              </div>
              <Switch id="personalization" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Data Management
              </div>
            </CardTitle>
            <CardDescription>Download or delete your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Export Your Data</Label>
                <p className="text-sm text-muted-foreground">
                  Download a copy of your account data
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Request Export
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Delete Your Data</Label>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and data
                </p>
              </div>
              <Button variant="outline" size="sm" className="text-danger border-danger" disabled>
                Request Deletion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/settings">Cancel</Link>
          </Button>
          <Button disabled>
            Save Changes
            <span className="ml-2 text-xs">(Demo)</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
