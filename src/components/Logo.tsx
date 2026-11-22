'use client';

interface LogoProps {
  isTransparent?: boolean;
  className?: string;
}

export function Logo({ isTransparent = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* ── ORIGINAL INLINE SVG MARK: INSPECTION LENS OVER REGISTRY DEED CORNER ── */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width="38"
          height="38"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 group-hover:scale-105"
          aria-hidden="true"
        >
          {/* Document parchment foundation with folded corner */}
          <path
            d="M8 5.5C8 4.67 8.67 4 9.5 4H24.5L32 11.5V34.5C32 35.33 31.33 36 30.5 36H9.5C8.67 36 8 35.33 8 34.5V5.5Z"
            fill="rgba(27, 67, 50, 0.08)"
            stroke="#1b4332"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Folded corner flap */}
          <path
            d="M24.5 4V11.5H32"
            fill="rgba(176, 141, 87, 0.2)"
            stroke="#1b4332"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />

          {/* Internal simulated text lines on deed */}
          <line
            x1="12"
            y1="16"
            x2="17"
            y2="16"
            stroke="rgba(27, 67, 50, 0.45)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="12"
            y1="20"
            x2="15"
            y2="20"
            stroke="rgba(27, 67, 50, 0.45)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />

          {/* Brass Optical Inspection Lens Ring */}
          <circle
            cx="21"
            cy="24"
            r="8"
            fill="rgba(250, 247, 242, 0.95)"
            stroke="#b08d57"
            strokeWidth="2.2"
          />

          {/* Internal reticle crosshair inside lens */}
          <line
            x1="21"
            y1="19.5"
            x2="21"
            y2="28.5"
            stroke="#b08d57"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.85"
          />
          <line
            x1="16.5"
            y1="24"
            x2="25.5"
            y2="24"
            stroke="#b08d57"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Precision Brass Lens Handle */}
          <path
            d="M27 30L33.5 36.5"
            stroke="#b08d57"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* ── WORDMARK: LAWLENS (SERIF 24PX IN DEEP GREEN) + BANGLA ON SAME BASELINE ── */}
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-2xl font-bold tracking-tight text-green-deep">
          LawLens
        </span>
        <span className="font-bangla text-lg sm:text-xl font-medium text-brass">
          ল-লেন্স
        </span>
      </div>
    </div>
  );
}
