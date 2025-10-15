"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/navigation/back-button";

export default function NotificationsSettingsPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Navigation */}
        <BackButton />

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            Manage your notification preferences
          </p>
        </div>

        {/* Email Notifications */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>Choose what you want to be notified about via email</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-replies">New Replies</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails when someone replies to your posts
                </p>
              </div>
              <Switch id="email-replies" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-mentions">Mentions</Label>
                <p className="text-sm text-muted-foreground">
                  Receive emails when someone mentions you
                </p>
              </div>
              <Switch id="email-mentions" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-announcements">Announcements</Label>
                <p className="text-sm text-muted-foreground">
                  Receive course announcements and updates
                </p>
              </div>
              <Switch id="email-announcements" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-digest">Daily Digest</Label>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of activity
                </p>
              </div>
              <Switch id="email-digest" />
            </div>
          </CardContent>
        </Card>

        {/* Push Notifications */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Push Notifications</CardTitle>
            <CardDescription>Manage in-app notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-enabled">Enable Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive real-time notifications in the app
                </p>
              </div>
              <Switch id="push-enabled" defaultChecked />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push-sound">Notification Sound</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for new notifications
                </p>
              </div>
              <Switch id="push-sound" />
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
