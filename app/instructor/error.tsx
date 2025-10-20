'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/ui/error-state';

export default function InstructorError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Instructor dashboard error:', error);
  }, [error]);

  return (
    <div className="container py-8">
      <ErrorState
        title="Failed to load instructor dashboard"
        message="There was a problem loading the instructor dashboard. Please try again."
        onRetry={reset}
        fallbackAction={{
          label: "Back to Home",
          onClick: () => window.location.href = '/',
        }}
      />
    </div>
  );
}
