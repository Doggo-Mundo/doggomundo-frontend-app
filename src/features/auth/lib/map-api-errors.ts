import type { UseFormSetError, FieldValues, Path } from "react-hook-form";
import axios from "axios";

export function mapApiErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  fallback = "Ocurrió un error. Intenta de nuevo.",
) {
  if (
    axios.isAxiosError(err) &&
    err.response?.status === 400 &&
    err.response.data &&
    typeof err.response.data === "object"
  ) {
    const errors = err.response.data as Record<string, string[] | string>;
    Object.entries(errors).forEach(([field, messages]) => {
      const msg = Array.isArray(messages) ? messages[0] : messages;
      if (field === "non_field_errors" || field === "detail") {
        setError("root" as Path<T>, { message: String(msg) });
      } else {
        setError(field as Path<T>, { message: String(msg) });
      }
    });
    return;
  }

  if (axios.isAxiosError(err) && err.response?.status === 401) {
    setError("root" as Path<T>, { message: "Credenciales inválidas." });
    return;
  }

  setError("root" as Path<T>, { message: fallback });
}
