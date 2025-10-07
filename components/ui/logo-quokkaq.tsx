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

        {/* "A" - refined with smooth curves */}
        <g filter={monochrome ? undefined : "url(#qa-letter-glow)"}>
          {/* Left leg */}
          <path
            d="M17 18 C17 18 17.5 16.5 18.5 13.5 C19 12 19.5 9 20 6 C20 6 20 6 20.2 6 C20.4 6 20.4 6 20.4 6 C20.4 6 21.5 10.5 22 12.5 L17 18 Z"
            fill="#fff"
          />
          {/* Right leg */}
          <path
            d="M20.4 6 C20.4 6 21.5 10.5 22 12.5 C22.5 14 23 16 23 18 L20.4 6 Z"
            fill="#fff"
          />
          {/* Crossbar with rounded ends */}
          <ellipse
            cx="20.2"
            cy="12.8"
            rx="2.2"
            ry="1.1"
            fill="#fff"
          />
        </g>

        {/* "Q" - refined with curved tail */}
        <g filter={monochrome ? undefined : "url(#qa-letter-glow)"}>
          {/* Circle */}
          <circle
            cx="36"
            cy="12"
            r="5.5"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Curved tail flowing from circle */}
          <path
            d="M39.5 15.5 Q41 17 42.5 18.5 Q43.5 19.5 44 19.5"
            fill="none"
            stroke="#fff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </div>
  );
}
