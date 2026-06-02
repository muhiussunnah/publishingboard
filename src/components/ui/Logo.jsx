// Famies brandmark — a globe formed by two facing profiles, in the logo palette
// (pink → green, no black). Stylized SVG recreation.
export default function Logo({ size = 36, className = '' }) {
  const id = 'famies-grad';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} role="img" aria-label="Famies">
      <defs>
        <radialGradient id={id} cx="50%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#ffd9e6" />
          <stop offset="38%" stopColor="#ff3d7f" />
          <stop offset="78%" stopColor="#12b886" />
          <stop offset="100%" stopColor="#2fd6a0" />
        </radialGradient>
        <linearGradient id={`${id}-ring`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff3d7f" />
          <stop offset="100%" stopColor="#12b886" />
        </linearGradient>
      </defs>
      {/* globe */}
      <circle cx="50" cy="50" r="42" fill={`url(#${id})`} />
      {/* faint meridians */}
      <g fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4">
        <ellipse cx="50" cy="50" rx="18" ry="42" />
        <line x1="8" y1="50" x2="92" y2="50" />
      </g>
      {/* two profiles cut from the globe edges */}
      <path d="M8 50a42 42 0 0 1 22-36c-7 8-9 15-6 22 2 5 1 9-3 13-5 4-6 9-2 15 2 4 1 8-3 12A42 42 0 0 1 8 50z" fill="#faf8f5" />
      <path d="M92 50a42 42 0 0 0-22-36c7 8 9 15 6 22-2 5-1 9 3 13 5 4 6 9 2 15-2 4-1 8 3 12A42 42 0 0 0 92 50z" fill="#faf8f5" />
      <circle cx="50" cy="50" r="42" fill="none" stroke={`url(#${id}-ring)`} strokeWidth="2.5" />
    </svg>
  );
}
