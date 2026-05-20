interface Props {
  className?: string;
}

export function EmptyPawsIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="70" fill="#DFEEFB" />
      <circle cx="80" cy="80" r="52" fill="#C9E2F7" opacity="0.5" />
      {/* Main paw pad */}
      <ellipse cx="80" cy="92" rx="22" ry="18" fill="#222D56" />
      {/* Toes */}
      <ellipse cx="58" cy="72" rx="9" ry="12" fill="#222D56" />
      <ellipse cx="72" cy="58" rx="8" ry="11" fill="#222D56" />
      <ellipse cx="88" cy="58" rx="8" ry="11" fill="#222D56" />
      <ellipse cx="102" cy="72" rx="9" ry="12" fill="#222D56" />
      {/* Small accent paws */}
      <g opacity="0.4" fill="#69B4F2">
        <ellipse cx="30" cy="40" rx="5" ry="4" />
        <ellipse cx="26" cy="33" rx="2.5" ry="3" />
        <ellipse cx="32" cy="32" rx="2.5" ry="3" />
      </g>
      <g opacity="0.4" fill="#69B4F2">
        <ellipse cx="130" cy="120" rx="5" ry="4" />
        <ellipse cx="126" cy="113" rx="2.5" ry="3" />
        <ellipse cx="132" cy="112" rx="2.5" ry="3" />
      </g>
    </svg>
  );
}
