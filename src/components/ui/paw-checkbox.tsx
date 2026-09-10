import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * F-G.2: PawCheckbox — reemplazo brandeado del `<input type=checkbox>`
 * para los consentimientos legales en el registro. Cuando el usuario
 * lo activa, la huellita SVG (4 dedos + almohadilla) se rellena de
 * color primary con una transición suave.
 *
 * Accesibilidad: usa un `<input>` real por debajo (opacity 0), así
 * heredamos gratis focus/keyboard/screen-reader behavior. El label
 * envolvente hace toda el área clickeable. Sin dependencias extra
 * (Radix, checkbox package, etc.).
 */
interface Props
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Contenido de la etiqueta. Puede incluir `<a>` para el link
   *  "Ver …". */
  label: React.ReactNode;
  /** Error message inline debajo del checkbox. Se le da color
   *  destructive automáticamente. */
  error?: string;
  /** Tamaño de la huellita en px. Default 28 — cómodo para tocar
   *  en móvil sin verse gigante. */
  pawSize?: number;
}

export const PawCheckbox = React.forwardRef<HTMLInputElement, Props>(
  function PawCheckbox(
    {
      label, error, pawSize = 28,
      id, className, checked, disabled, ...rest
    },
    ref,
  ) {
    // Fallback id para hookform / accesibilidad — si el consumer
    // pasa uno, respetamos; si no, generamos uno estable.
    const reactId = React.useId();
    const inputId = id ?? `paw-${reactId}`;

    return (
      <div className={cn("space-y-1", className)}>
        <label
          htmlFor={inputId}
          className={cn(
            "group flex cursor-pointer items-start gap-3 rounded-md p-1 text-sm outline-none transition-colors",
            "hover:bg-accent/40",
            "focus-within:ring-3 focus-within:ring-ring/50",
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {/* Wrapper de la huellita con size fijo — el SVG hereda
              el color via `currentColor`. No aplicamos `aria-hidden`
              al wrapper porque contiene el `<input>` real; el icono
              decorativo se marca por dentro. */}
          <span
            className="relative inline-flex shrink-0 items-center justify-center"
            style={{ width: pawSize, height: pawSize }}
          >
            <input
              ref={ref}
              id={inputId}
              type="checkbox"
              checked={checked}
              disabled={disabled}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
              {...rest}
            />
            <span aria-hidden="true">
              <PawIcon
                size={pawSize}
                filled={Boolean(checked)}
                error={Boolean(error)}
              />
            </span>
          </span>

          <span className="min-w-0 pt-0.5 leading-snug">{label}</span>
        </label>

        {error && (
          <p
            className="pl-11 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);


interface PawIconProps {
  size: number;
  filled: boolean;
  error: boolean;
}

/**
 * Huellita canina: almohadilla central + 4 dedos. El path se
 * rellena cuando `filled=true`, sino queda outline. Color:
 * primary (marca) por default; destructive cuando hay error para
 * llamar la atención sin cambiar el copy.
 */
function PawIcon({ size, filled, error }: PawIconProps) {
  const stroke = error
    ? "text-destructive"
    : filled
      ? "text-primary"
      : "text-muted-foreground/60";
  const fill = filled ? "currentColor" : "transparent";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={cn("transition-colors duration-150", stroke)}
      fill={fill}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Almohadilla central */}
      <path d="M12 13c-2.5 0-4.5 2-4.5 4.5 0 1.5 1 2.5 2.5 2.5 .8 0 1.5-.3 2-.7 .5 .4 1.2 .7 2 .7 1.5 0 2.5-1 2.5-2.5 0-2.5-2-4.5-4.5-4.5Z" />
      {/* Dedo superior-izquierdo */}
      <ellipse cx="6.5" cy="9.5" rx="1.5" ry="2" />
      {/* Dedo superior-derecho */}
      <ellipse cx="17.5" cy="9.5" rx="1.5" ry="2" />
      {/* Dedo izquierdo */}
      <ellipse cx="9.5" cy="5.5" rx="1.4" ry="1.8" />
      {/* Dedo derecho */}
      <ellipse cx="14.5" cy="5.5" rx="1.4" ry="1.8" />
    </svg>
  );
}
