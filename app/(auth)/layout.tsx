import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - QuokkaQ",
  description: "Sign in to your QuokkaQ account",
};

/**
 * Auth Layout
 *
 * Simple layout for authentication pages without navigation header
 * Centers content and provides skip-to-content link for accessibility
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:font-semibold focus:transition-all"
      >
        Skip to main content
      </a>

      {/* Main Content */}
      <main
        id="main-content"
        className="min-h-screen flex items-center justify-center p-4 sm:p-8"
      >
        {children}
      </main>
    </>
  );
}
