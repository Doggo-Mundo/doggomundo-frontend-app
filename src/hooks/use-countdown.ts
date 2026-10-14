import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Seconds-remaining countdown, ticking down once per second until 0.
 * `start(seconds)` (re)starts it — used to gate a "resend" action so
 * the user gets a visible cooldown instead of being able to spam the
 * button, independent of whatever the backend throttles.
 */
export function useCountdown() {
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(Math.max(0, Math.ceil(seconds)));
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  return { remaining, start };
}
