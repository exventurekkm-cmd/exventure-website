/** EXVENTURE identity v1. Keep this component identical in the three apps. */
export function BrandSymbol({ className = "" }: { className?: string }) {
  return (
    <svg className={`exv-symbol ${className}`} viewBox="0 0 48 48" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 4h13l27 40H31L4 4Z" fill="currentColor" />
      <path d="M31 4h13L29 23l-7-10L31 4ZM19 25l7 10-9 9H4l15-19Z" fill="currentColor" />
    </svg>
  );
}

export function Brand({ label = "엑스벤처" }: { label?: string }) {
  return (
    <span className="exv-brand">
      <BrandSymbol />
      <span className="exv-wordmark">EXVENTURE<small>{label}</small></span>
    </span>
  );
}
