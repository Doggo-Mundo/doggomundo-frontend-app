interface Props {
  className?: string;
}

export function EmptyMembershipIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="70" fill="#DFEEFB" />
      {/* Card back */}
      <rect
        x="36"
        y="52"
        width="88"
        height="56"
        rx="8"
        fill="#ffffff"
        stroke="#222D56"
        strokeWidth="3"
        transform="rotate(-6 80 80)"
      />
      {/* Card front */}
      <rect x="36" y="56" width="88" height="56" rx="8" fill="#222D56" />
      {/* Chip */}
      <rect x="48" y="70" width="14" height="10" rx="2" fill="#69B4F2" />
      {/* Lines */}
      <rect x="70" y="72" width="42" height="4" rx="2" fill="#69B4F2" opacity="0.7" />
      <rect x="48" y="92" width="30" height="4" rx="2" fill="#ffffff" opacity="0.4" />
      <rect x="82" y="92" width="18" height="4" rx="2" fill="#ffffff" opacity="0.4" />
      {/* Star badge */}
      <circle cx="120" cy="50" r="14" fill="#69B4F2" />
      <path
        d="M 120 42 L 122.4 46.8 L 127.6 47.6 L 123.8 51.4 L 124.8 56.6 L 120 54.2 L 115.2 56.6 L 116.2 51.4 L 112.4 47.6 L 117.6 46.8 Z"
        fill="#ffffff"
      />
    </svg>
  );
}
