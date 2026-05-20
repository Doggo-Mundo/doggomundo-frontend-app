interface Props {
  className?: string;
}

export function EmptySearchIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 160 160"
      role="img"
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="80" cy="80" r="70" fill="#DFEEFB" />
      {/* Glass ring */}
      <circle
        cx="72"
        cy="72"
        r="28"
        fill="#ffffff"
        stroke="#222D56"
        strokeWidth="5"
      />
      <circle cx="72" cy="72" r="22" fill="#C9E2F7" opacity="0.5" />
      {/* Handle */}
      <rect
        x="94"
        y="94"
        width="32"
        height="10"
        rx="5"
        fill="#222D56"
        transform="rotate(45 94 94)"
      />
      {/* Question mark */}
      <path
        d="M 66 64 Q 66 58 72 58 Q 78 58 78 64 Q 78 68 72 72 L 72 76"
        fill="none"
        stroke="#222D56"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="72" cy="84" r="2.5" fill="#222D56" />
    </svg>
  );
}
