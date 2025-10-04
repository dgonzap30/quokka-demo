"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, GraduationCap } from "lucide-react";
import { TEST_ACCOUNTS, setSession } from "@/lib/session";

export default function AuthPage() {
  const router = useRouter();

  const handleSignIn = (role: "student" | "instructor") => {
    const account = TEST_ACCOUNTS[role];
    setSession(account);

    // Redirect based on role
    if (role === "student") {
      router.push("/student/threads");
    } else {
      router.push("/instructor/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🦘</div>
          <h1 className="text-4xl font-bold mb-3 text-foreground">
            QuokkaQ Demo
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            AI-powered course Q&A platform. Choose your role to explore the demo.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-info/10 text-info rounded-lg text-sm">
            <span className="font-semibold">Demo Mode</span>
            <span>•</span>
            <span>All data is stored locally</span>
          </div>
        </div>

        {/* Sign-in Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Student Card */}
          <Card className="border-2 hover:border-primary hover:shadow-e2 transition-all duration-200 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary/20 mb-4 group-hover:bg-secondary/30 transition-colors">
                <User className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">Student</CardTitle>
              <CardDescription className="text-base">
                Browse threads, ask questions, and get AI-powered answers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Demo Account:
                </p>
                <p className="font-semibold text-foreground">
                  {TEST_ACCOUNTS.student.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {TEST_ACCOUNTS.student.email}
                </p>
              </div>
              <Button
                onClick={() => handleSignIn("student")}
                size="lg"
                className="w-full bg-secondary hover:bg-secondary-hover"
              >
                <User className="h-5 w-5 mr-2" />
                Sign in as Student
              </Button>
            </CardContent>
          </Card>

          {/* Instructor Card */}
          <Card className="border-2 hover:border-primary hover:shadow-e2 transition-all duration-200 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/20 mb-4 group-hover:bg-accent/30 transition-colors">
                <GraduationCap className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-2xl">Instructor</CardTitle>
              <CardDescription className="text-base">
                Monitor activity, moderate posts, and manage student questions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Demo Account:
                </p>
                <p className="font-semibold text-foreground">
                  {TEST_ACCOUNTS.instructor.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {TEST_ACCOUNTS.instructor.email}
                </p>
              </div>
              <Button
                onClick={() => handleSignIn("instructor")}
                size="lg"
                className="w-full bg-accent hover:bg-accent-hover"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Sign in as Instructor
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            This is a frontend-only demo. All data is stored in your browser&apos;s localStorage.
          </p>
          <p className="mt-1">
            No backend server or real AI is used.
          </p>
        </div>
      </div>
    </div>
  );
}
