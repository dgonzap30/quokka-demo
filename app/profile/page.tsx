"use client";

import { useCurrentUser } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/navigation/back-button";
import { Mail, Calendar, Shield, Edit, User } from "lucide-react";

export default function ProfilePage() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-lg" />
            <div className="h-64 bg-muted rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  // Format join date
  const joinDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="container mx-auto px-6 py-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Navigation */}
        <BackButton />

        {/* Profile Header */}
        <Card className="glass-panel">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-muted">
                  <User className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>

              <div className="pt-2">
                <Button variant="outline" size="sm" disabled>
                  <Edit className="h-4 w-4" aria-hidden="true" />
                  Edit Profile
                  <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" aria-hidden="true" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                <p className="mt-1 text-sm font-mono">{user.id}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Account Type</label>
                <p className="mt-1 text-sm capitalize">{user.role}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                <p className="mt-1 text-sm">{user.email}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
                  <span className="text-sm">Active</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Overview */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Activity statistics and engagement metrics will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
