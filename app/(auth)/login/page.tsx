"use client";

import { useState, useEffect, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";
import { useCurrentUser } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { isAuthSuccess, type UserRole } from "@/lib/models/types";

/**
 * Login Page
 *
 * Email-based dev login for demo users
 * - Supports student@demo.com and instructor@demo.com
 * - No password required (dev-login endpoint)
 * - Role-based redirect after successful login
 */
export default function LoginPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Redirect user to appropriate dashboard based on role
   */
  const redirectToRoleDashboard = useCallback((role: UserRole) => {
    if (role === "student") {
      router.push("/student");
    } else if (role === "instructor" || role === "ta") {
      router.push("/instructor");
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  // Redirect if already logged in
  useEffect(() => {
    if (!userLoading && user) {
      redirectToRoleDashboard(user.role);
    }
  }, [user, userLoading, redirectToRoleDashboard]);

  /**
   * Handle login form submission
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend dev-login endpoint
      const result = await api.login({ email, password: "" });

      if (isAuthSuccess(result)) {
        // Redirect based on role
        redirectToRoleDashboard(result.session.user.role);
      } else {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (err) {
      // Handle backend errors
      if (err instanceof Error) {
        if (err.message.includes("404") || err.message.includes("not found")) {
          setError(
            "User not found. Try: student@demo.com or instructor@demo.com"
          );
        } else if (err.message.includes("fetch")) {
          setError(
            "Cannot connect to backend server. Please start the backend: cd backend && npm start"
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (userLoading) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold glass-text">QuokkaQ</h1>
        <p className="text-lg text-muted-foreground">
          AI-Powered Academic Q&A Platform
        </p>
        <p className="text-sm text-muted-foreground">Sign in to continue</p>
      </div>

      {/* Login Form */}
      <div className="glass-panel p-8 rounded-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="student@demo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full"
              aria-describedby={error ? "login-error" : undefined}
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" id="login-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        {/* Demo Users Hint */}
        <div className="pt-4 border-t border-border/50 space-y-2">
          <p className="text-xs text-muted-foreground text-center font-medium">
            Demo Users:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setEmail("student@demo.com")}
              disabled={isLoading}
              className="glass-panel px-3 py-2 rounded-lg text-left hover:bg-accent/10 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              <div className="font-medium">Student</div>
              <div className="text-muted-foreground">student@demo.com</div>
            </button>
            <button
              type="button"
              onClick={() => setEmail("instructor@demo.com")}
              disabled={isLoading}
              className="glass-panel px-3 py-2 rounded-lg text-left hover:bg-accent/10 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50"
            >
              <div className="font-medium">Instructor</div>
              <div className="text-muted-foreground">instructor@demo.com</div>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          This is a demo environment. No password required.
        </p>
      </div>
    </div>
  );
}
