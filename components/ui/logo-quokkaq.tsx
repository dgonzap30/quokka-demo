import * as React from "react";

type Props = {
  height?: number;              // overall logo height (px)
  className?: string;           // extra Tailwind classes
  monochrome?: boolean;         // force neutral "AQ" for print/dark headers etc.
  label?: string;               // accessible name
};

export default function LogoQuokkAQ({
  height = 24,
  className = "",
  monochrome = false,
  label = "QuokkAQ",
}: Props) {
  // AQ capsule has a 56×24 viewBox
  const aqW = (56 / 24) * height;

  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`} aria-label={label}>
      {/* Wordmark */}
      <span
        className="font-semibold tracking-tight"
        style={{ fontSize: height * 0.72 }} // good optical balance vs capsule
      >
        Quokk
      </span>

      {/* AQ capsule */}
      <svg
        width={aqW}
        height={height}
        viewBox="0 0 56 24"
        role="img"
        aria-label="AQ"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {!monochrome && (
            <>
              {/* Rich 3-stop amber gradient for depth */}
              <linearGradient id="qa-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              {/* Radial overlay for center glow */}
              <radialGradient id="qa-glow" cx="0.5" cy="0.4" r="0.6">
                <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
              </radialGradient>

              {/* Glass shine gradient */}
              <linearGradient id="qa-shine" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
              </linearGradient>

              {/* Inner shadow filter */}
              <filter id="qa-inner-shadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" />
                <feOffset dx="0" dy="1" result="offsetblur" />
                <feFlood floodColor="#92400e" floodOpacity="0.3" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Subtle glow filter for letters */}
              <filter id="qa-letter-glow">
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </>
          )}
        </defs>

        {/* Capsule background with gradient */}
        <rect
          x="0" y="0" width="56" height="24" rx="12"
          fill={monochrome ? "#111111" : "url(#qa-grad)"}
        />

        {/* Radial glow overlay */}
        {!monochrome && (
          <rect
            x="0" y="0" width="56" height="24" rx="12"
            fill="url(#qa-glow)"
          />
        )}

        {/* Subtle border for definition */}
        <rect
          x="0.5" y="0.5" width="55" height="23" rx="11.5"
          fill="none"
          stroke={monochrome ? "#333333" : "rgba(217, 119, 6, 0.5)"}
          strokeWidth="1"
        />

        {/* Multi-layer glass highlights */}
        {!monochrome && (
          <>
            {/* Main top highlight */}
            <rect
              x="1" y="1" width="54" height="11" rx="10"
              fill="url(#qa-shine)"
            />
            {/* Bright shine band */}
            <rect
              x="4" y="2" width="48" height="3" rx="1.5"
              fill="rgba(255, 255, 255, 0.3)"
            />
            {/* Edge glow */}
            <rect
              x="1" y="1" width="54" height="22" rx="11"
              fill="none"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="0.5"
            />
          </>
        )}

        {/* "A" - clean geometric letter */}
        <g filter={monochrome ? undefined : "url(#qa-letter-glow)"}>
          {/* Unified A shape */}
          <path
            d="M20 6.5 L24.5 18 L22.5 18 L21.5 15 L18.5 15 L17.5 18 L15.5 18 L20 6.5 Z"
            fill="#fff"
          />
          {/* Crossbar cutout for readability */}
          <rect
            x="18.8"
            y="13.2"
            width="2.4"
            height="1.3"
            fill="url(#qa-grad)"
            rx="0.3"
          />
        </g>

        {/* "Q" - clean circle with diagonal tail */}
        <g filter={monochrome ? undefined : "url(#qa-letter-glow)"}>
          {/* Main circle - thicker stroke for visibility */}
          <circle
            cx="36"
            cy="12"
            r="5"
            fill="none"
            stroke="#fff"
            strokeWidth="2.5"
          />
          {/* Diagonal tail extending from bottom-right */}
          <line
            x1="39.5"
            y1="15.5"
            x2="43"
            y2="19"
            stroke="#fff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
