import * as React from "react";
import { cn } from "@/lib/utils";

interface Props {
  /** Current code value (only digits, length ≤ {length}). */
  value: string;
  onChange: (value: string) => void;
  /** Number of slots. Defaults to 6 which matches our OTP server-side. */
  length?: number;
  /** Standard form props forwarded to each box. */
  id?: string;
  name?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
}

/**
 * Six-digit OTP picker: one box per digit with auto-advance, backspace nav
 * and paste support. The component owns no state of its own — it always
 * reflects `value` and emits changes upstream so it slots into react-hook-form
 * via a Controller (or a setValue call).
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  id,
  name,
  autoFocus,
  disabled,
  invalid,
  className,
}: Props) {
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const sanitized = value.replace(/\D/g, "").slice(0, length);
    return Array.from({ length }, (_, i) => sanitized[i] ?? "");
  }, [value, length]);

  function setDigit(index: number, char: string) {
    const next =
      digits.slice(0, index).join("") + char + digits.slice(index + 1).join("");
    onChange(next.replace(/\D/g, "").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    setDigit(index, char);
    inputsRef.current[Math.min(index + 1, length - 1)]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigit(index, "");
        return;
      }
      // Empty box → step back and clear the previous one for fast retry.
      if (index > 0) {
        event.preventDefault();
        setDigit(index - 1, "");
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(
    index: number,
    event: React.ClipboardEvent<HTMLInputElement>,
  ) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    event.preventDefault();
    const filled = (
      digits.slice(0, index).join("") + pasted
    ).slice(0, length);
    onChange(filled);
    inputsRef.current[Math.min(filled.length, length - 1)]?.focus();
  }

  return (
    <div className={cn("flex items-center gap-2", className)} role="group">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={index === 0 ? id : undefined}
          name={index === 0 ? name : undefined}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={(e) => handlePaste(index, e)}
          aria-invalid={invalid || undefined}
          aria-label={`Dígito ${index + 1}`}
          className={cn(
            "h-12 w-10 rounded-lg border border-input bg-background text-center text-xl font-semibold tabular-nums shadow-xs outline-none transition-colors",
            "focus:border-ring focus:ring-3 focus:ring-ring/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive ring-3 ring-destructive/20",
          )}
        />
      ))}
    </div>
  );
}
