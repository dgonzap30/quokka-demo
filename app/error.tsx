'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full">
            <ErrorState
              title="Something went wrong"
              message={error.message || 'An unexpected error occurred. Please try again.'}
              action={
                <div className="flex gap-2">
                  <Button onClick={reset}>Try Again</Button>
                  <Button variant="outline" onClick={() => window.location.href = '/'}>
                    Go Home
                  </Button>
                </div>
              }
            />
          </div>
        </div>
      </body>
    </html>
  );
}
