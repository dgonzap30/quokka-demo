'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
        action={
          <div className="flex gap-2">
            <Button onClick=

{reset}>Try Again</Button>
            <Button variant="outline" onClick={() => window.location.href = '/courses'}>
              Back to Courses
            </Button>
          </div>
        }
      />
    </div>
  );
}
