// Brand marks. The bKash mark is rendered from the official brand pink
// (#E2136E) and wordmark styling so payers recognise the payment method.

export function BkashMark({ className = 'h-6' }) {
  return (
    <span
      className={`inline-flex items-center font-bold tracking-tight text-bkash ${className}`}
      style={{ fontSize: 'inherit' }}
      aria-label="bKash"
    >
      <span className="lowercase">b</span>
      <span className="uppercase">K</span>
      <span className="lowercase">ash</span>
    </span>
  );
}

// A small circular bKash badge for icons/avatars.
export function BkashBadge({ size = 40 }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-bkash font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-label="bKash"
    >
      bK
    </span>
  );
}

// NPay product logo.
export function Logo({ className = 'h-8', showText = true }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-full w-auto" aria-hidden="true">
        <defs>
          <linearGradient id="npg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E2136E" />
            <stop offset="1" stopColor="#8A0A43" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill="url(#npg)" />
        <path
          d="M13 28V12l14 16V12"
          fill="none"
          stroke="white"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showText && (
        <span className="text-xl font-extrabold tracking-tight text-ink">
          N<span className="text-bkash">Pay</span>
        </span>
      )}
    </span>
  );
}
