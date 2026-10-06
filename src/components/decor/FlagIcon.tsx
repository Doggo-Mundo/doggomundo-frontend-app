import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

// Banderas dibujadas a mano en SVG, no emoji — el emoji de bandera
// depende de una fuente de color del sistema operativo y en varios
// entornos cae a mostrar el código de país en texto plano. Un SVG
// propio se ve igual en cualquier lado.
export type FlagKey = "mx" | "us" | "gt" | "bz" | "es" | "co" | "ar" | "cl" | "pe";

const FLAGS: Record<FlagKey, React.ReactNode> = {
  mx: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="8" height="16" fill="#006341" />
      <rect x="16" width="8" height="16" fill="#CE1126" />
    </>
  ),
  us: (
    <>
      <rect width="24" height="16" fill="#B22234" />
      <rect y="1.23" width="24" height="1.23" fill="#fff" />
      <rect y="3.69" width="24" height="1.23" fill="#fff" />
      <rect y="6.15" width="24" height="1.23" fill="#fff" />
      <rect y="8.61" width="24" height="1.23" fill="#fff" />
      <rect y="11.08" width="24" height="1.23" fill="#fff" />
      <rect y="13.54" width="24" height="1.23" fill="#fff" />
      <rect width="10" height="8.6" fill="#3C3B6E" />
    </>
  ),
  gt: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="8" height="16" fill="#4997D0" />
      <rect x="16" width="8" height="16" fill="#4997D0" />
    </>
  ),
  bz: (
    <>
      <rect width="24" height="16" fill="#003F87" />
      <rect width="24" height="2" fill="#CE1126" />
      <rect y="14" width="24" height="2" fill="#CE1126" />
    </>
  ),
  es: (
    <>
      <rect width="24" height="16" fill="#AA151B" />
      <rect y="4" width="24" height="8" fill="#F1BF00" />
    </>
  ),
  co: (
    <>
      <rect width="24" height="16" fill="#FCD116" />
      <rect y="8" width="24" height="4" fill="#003893" />
      <rect y="12" width="24" height="4" fill="#CE1126" />
    </>
  ),
  ar: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="24" height="5.33" fill="#74ACDF" />
      <rect y="10.67" width="24" height="5.33" fill="#74ACDF" />
    </>
  ),
  cl: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect y="8" width="24" height="8" fill="#D52B1E" />
      <rect width="9" height="8" fill="#0039A6" />
    </>
  ),
  pe: (
    <>
      <rect width="24" height="16" fill="#fff" />
      <rect width="8" height="16" fill="#D91023" />
      <rect x="16" width="8" height="16" fill="#D91023" />
    </>
  ),
};

export function FlagIcon({
  country,
  className,
  ...props
}: { country: FlagKey } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={cn("h-3.5 w-5 shrink-0 rounded-[2px] ring-1 ring-black/10", className)}
      aria-hidden="true"
      {...props}
    >
      {FLAGS[country]}
    </svg>
  );
}
