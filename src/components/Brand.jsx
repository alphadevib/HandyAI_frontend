/**
 * The HandyAI mark: a lower-case "h" whose right leg wears a lime dot, so the glyph reads as
 * "h" + the dot of an "i" (handy + AI). Dark tile, so it holds on both themes. Same artwork as
 * public/favicon.svg.
 */
export function BrandMark({ size = 36, className }) {
  return (
    <svg
      className={`brand-mark ${className ?? ''}`}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="61" height="61" rx="18" fill="#030303" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" />
      <path
        d="M21 14v36M21 37c0-8 5.2-12.5 11.5-12.5S44 29 44 37v13"
        fill="none"
        stroke="#f4f4f1"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className="brand-dot" cx="44" cy="14.5" r="5.5" fill="#d4f25a" />
    </svg>
  )
}

export function Wordmark() {
  return (
    <span className="wordmark">
      HANDY<span className="wordmark-dot">.</span>AI
    </span>
  )
}
