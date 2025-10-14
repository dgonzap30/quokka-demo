import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  /**
   * Error message to display below the input
   * Automatically sets aria-invalid and aria-describedby
   */
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const errorId = React.useId();
    const hasError = !!error;

    return (
      <>
        <input
          ref={ref}
          type={type}
          data-slot="input"
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow,backdrop-filter] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm backdrop-blur-sm focus:backdrop-blur-md",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-[var(--shadow-glass-sm)]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
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

Input.displayName = "Input";

export { Input }
