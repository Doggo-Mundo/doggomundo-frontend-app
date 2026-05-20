interface Props {
  className?: string;
}

export function EmptyShoppingIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="70" fill="#DFEEFB" />
      {/* Bag handles */}
      <path
        d="M 58 56 Q 58 36 80 36 Q 102 36 102 56"
        fill="none"
        stroke="#222D56"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Bag body */}
      <path
        d="M 44 58 L 116 58 L 112 122 Q 111 128 105 128 L 55 128 Q 49 128 48 122 Z"
        fill="#ffffff"
        stroke="#222D56"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Bag accent band */}
      <rect x="44" y="58" width="72" height="10" fill="#69B4F2" />
      {/* Paw print on bag */}
      <g fill="#222D56">
        <ellipse cx="80" cy="100" rx="10" ry="8" />
        <ellipse cx="68" cy="86" rx="4" ry="5.5" />
        <ellipse cx="76" cy="80" rx="3.5" ry="5" />
        <ellipse cx="84" cy="80" rx="3.5" ry="5" />
        <ellipse cx="92" cy="86" rx="4" ry="5.5" />
      </g>
    </svg>
  );
}
