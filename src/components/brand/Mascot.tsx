import type { SVGProps } from "react";

// Hachi (cabeza, patas y collar), la mascota de la landing V2. El
// trazo vive una sola vez en SpriteDefs; aquí solo se referencia.
// Decorativo por defecto: pasa role="img" + aria-label si comunica algo.
export function Mascot(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 406 532" aria-hidden="true" {...props}>
      <use href="#dm-mascot" />
    </svg>
  );
}
