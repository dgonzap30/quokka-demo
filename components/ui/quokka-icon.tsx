import { cn } from "@/lib/utils";

/**
 * Size variants for the QuokkaIcon
 * - sm: 20px (compact badges, inline text)
 * - md: 32px (default badges, buttons)
 * - lg: 64px (cards, headers)
 * - xl: 96px (hero sections, empty states)
 */
type QuokkaIconSize = "sm" | "md" | "lg" | "xl";

/**
 * Visual style variants
 * - filled: Solid background with white text (primary brand color)
 * - outline: Border with colored text (transparent background)
 * - glass: Glassmorphism effect (QDS 2.0 style)
 */
type QuokkaIconVariant = "filled" | "outline" | "glass";

/**
 * Animation variants
 * - pulse: Gentle scale animation (for emphasis)
 * - glow: Subtle shadow animation (for achievements)
 */
type QuokkaIconAnimation = "pulse" | "glow" | "none";

export interface QuokkaIconProps {
  /**
   * Size of the icon
   * @default "md"
   */
  size?: QuokkaIconSize;

  /**
   * Visual style variant
   * @default "filled"
   */
  variant?: QuokkaIconVariant;

  /**
   * Optional points to display inside the circle
   * If provided, renders the points number inside the icon
   */
  points?: number;

  /**
   * Animation effect
   * @default "none"
   */
  animate?: QuokkaIconAnimation;

  /**
   * Optional className for additional styling
   */
  className?: string;

  /**
   * Accessible label for screen readers
   * @default "Quokka points"
   */
  ariaLabel?: string;
}

/**
 * Size mapping for the icon dimensions
 */
const sizeMap: Record<QuokkaIconSize, { container: number; ear: number; fontSize: string }> = {
  sm: { container: 20, ear: 6, fontSize: "text-[10px]" },
  md: { container: 32, ear: 10, fontSize: "text-xs" },
  lg: { container: 64, ear: 20, fontSize: "text-2xl" },
  xl: { container: 96, ear: 30, fontSize: "text-4xl" },
};

/**
 * QuokkaIcon - Custom SVG icon representing Quokka branding
 *
 * Features:
 * - Circle body with two round ears on top
 * - Multiple size variants (sm to xl)
 * - Multiple visual styles (filled, outline, glass)
 * - Optional points display inside the circle
 * - Animation variants (pulse, glow)
 * - Full QDS 2.0 compliance
 * - WCAG 2.2 AA accessible
 *
 * Design Rationale:
 * Replaces the kangaroo emoji (🦘) with a custom SVG that better represents
 * the Quokka brand. The simple geometric design (circle + ears) is scalable,
 * clean, and aligned with QDS 2.0's glassmorphism aesthetic.
 *
 * @example
 * ```tsx
 * // Filled variant with points
 * <QuokkaIcon size="md" variant="filled" points={250} />
 *
 * // Outline variant without points
 * <QuokkaIcon size="lg" variant="outline" />
 *
 * // Glass variant with pulse animation
 * <QuokkaIcon size="xl" variant="ghost" animate="pulse" />
 * ```
 */
export function QuokkaIcon({
  size = "md",
  variant = "filled",
  points,
  animate = "none",
  className,
  ariaLabel = "Quokka points",
}: QuokkaIconProps) {
  const { container, ear, fontSize } = sizeMap[size];
  const earOffset = container * 0.25; // Position ears at 25% from center
  const earY = -container * 0.15; // Raise ears slightly above top edge

  // Animation classes
  const animationClasses = {
    pulse: "animate-pulse",
    glow: "animate-[glow_2s_ease-in-out_infinite]",
    none: "",
  };

  // Variant-specific styling
  const variantClasses = {
    filled: "fill-primary text-white",
    outline: "fill-none stroke-primary stroke-2 text-primary",
    glass: "fill-glass-panel-strong/80 backdrop-blur-sm border border-glass text-primary shadow-glass-md",
  };

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center",
        animationClasses[animate],
        className
      )}
      style={{ width: container, height: container }}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        width={container}
        height={container}
        viewBox={`0 0 ${container} ${container}`}
        xmlns="http://www.w3.org/2000/svg"
        className={cn(variantClasses[variant])}
      >
        {/* Left Ear */}
        <circle
          cx={container / 2 - earOffset}
          cy={container / 2 + earY}
          r={ear}
          className={cn(variantClasses[variant])}
        />

        {/* Right Ear */}
        <circle
          cx={container / 2 + earOffset}
          cy={container / 2 + earY}
          r={ear}
          className={cn(variantClasses[variant])}
        />

        {/* Main Body Circle */}
        <circle
          cx={container / 2}
          cy={container / 2}
          r={container / 2 - (variant === "outline" ? 1 : 0)}
          className={cn(variantClasses[variant])}
        />
      </svg>

      {/* Optional Points Display */}
      {points !== undefined && (
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-semibold tabular-nums",
            fontSize,
            variant === "filled" ? "text-white" : "text-primary"
          )}
          aria-hidden="true"
        >
          {points}
        </span>
      )}
    </div>
  );
}
