// Flat, geometric decorative backgrounds — street/urban mood, zero gradients or
// glow (the XOPA brand guide explicitly forbids soft blurred neon effects).

export function GridPattern({ className = '' }) {
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="xopa-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#xopa-grid)" />
    </svg>
  );
}

// A single diagonal slash — echoes the cyan slash in the XOPA logo.
export function SlashAccent({ className = '' }) {
  return (
    <svg viewBox="0 0 40 120" className={className} aria-hidden="true">
      <polygon points="30,0 40,0 10,120 0,120" fill="currentColor" />
    </svg>
  );
}

// Flat halftone-style dot field, used sparingly as a section accent.
export function DotField({ className = '' }) {
  return (
    <svg className={className} width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="xopa-dots" width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="currentColor" opacity="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#xopa-dots)" />
    </svg>
  );
}
