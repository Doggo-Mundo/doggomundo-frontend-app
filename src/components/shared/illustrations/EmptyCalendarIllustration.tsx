interface Props {
  className?: string;
}

export function EmptyCalendarIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="70" fill="#DFEEFB" />
      {/* Calendar body */}
      <rect x="40" y="46" width="80" height="74" rx="8" fill="#ffffff" stroke="#222D56" strokeWidth="3" />
      {/* Header bar */}
      <rect x="40" y="46" width="80" height="18" rx="8" fill="#222D56" />
      <rect x="40" y="56" width="80" height="8" fill="#222D56" />
      {/* Rings */}
      <rect x="56" y="38" width="5" height="16" rx="2.5" fill="#69B4F2" />
      <rect x="99" y="38" width="5" height="16" rx="2.5" fill="#69B4F2" />
      {/* Dots (empty days) */}
      <g fill="#C9E2F7">
        <circle cx="56" cy="82" r="4" />
        <circle cx="72" cy="82" r="4" />
        <circle cx="88" cy="82" r="4" />
        <circle cx="104" cy="82" r="4" />
        <circle cx="56" cy="98" r="4" />
        <circle cx="72" cy="98" r="4" />
        <circle cx="88" cy="98" r="4" />
        <circle cx="104" cy="98" r="4" />
      </g>
      {/* Highlighted empty dot with paw */}
      <circle cx="80" cy="108" r="10" fill="#69B4F2" />
      <ellipse cx="80" cy="111" rx="4" ry="3" fill="#ffffff" />
      <ellipse cx="74" cy="105" rx="1.5" ry="2" fill="#ffffff" />
      <ellipse cx="78" cy="103" rx="1.5" ry="2" fill="#ffffff" />
      <ellipse cx="82" cy="103" rx="1.5" ry="2" fill="#ffffff" />
      <ellipse cx="86" cy="105" rx="1.5" ry="2" fill="#ffffff" />
    </svg>
  );
}
