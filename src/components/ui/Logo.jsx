// Real Famies logo (public/logo.webp) as a circular planet mark with a
// gradient ring + soft pink/green glow. Keeps the page white; the mark glows.
export default function Logo({ size = 40, className = '' }) {
  return (
    <span
      className={`relative inline-grid place-items-center rounded-full ${className}`}
      style={{ width: size, height: size, background: 'var(--grad)', padding: 1.6, boxShadow: '0 8px 22px rgba(255,61,127,.28), 0 6px 18px rgba(18,189,138,.20)' }}
    >
      <img
        src="/logo.webp"
        alt="Famies"
        width={size}
        height={size}
        className="rounded-full object-cover w-full h-full"
        style={{ display: 'block' }}
      />
    </span>
  );
}
