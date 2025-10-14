import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /**
   * Error message to display below the textarea
   * Automatically sets aria-invalid and aria-describedby
   */
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    const errorId = React.useId();
    const hasError = !!error;

    return (
      <>
        <textarea
          ref={ref}
          data-slot="textarea"
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow,backdrop-filter] outline-none focus-visible:ring-[3px] focus-visible:shadow-[var(--shadow-glass-sm)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm focus:backdrop-blur-md",
            className
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-destructive mt-1.5" role="alert">
            {error}
          </p>
        )}
      </>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea }
