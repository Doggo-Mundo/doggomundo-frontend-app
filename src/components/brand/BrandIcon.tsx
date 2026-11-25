import type { SVGProps } from "react";

// Huella y estrella del sistema visual de la landing V2 (símbolos de
// SpriteDefs). Toman el color de `currentColor`. Solo decoración.
export function PawMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" {...props}>
      <use href="#dm-paw" />
    </svg>
  );
}

export function StarMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true" {...props}>
      <use href="#dm-star" />
    </svg>
  );
}
