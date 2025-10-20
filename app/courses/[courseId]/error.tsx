'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';

export default function CourseError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Course page error:', error);
  }, [error]);

  return (
    <div className="container py-8">
      <ErrorState
        title="Failed to load course"
        message="This course could not be loaded. It may not exist or you may not have access to it."
        onRetry={reset}
        fallbackAction={{
          label: "Back to Courses",
          onClick: () => window.location.href = '/courses',
        }}
      />
    </div>
  );
}
