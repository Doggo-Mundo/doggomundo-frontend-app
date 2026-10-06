import { Controller } from "react-hook-form";
import type { Control, FieldValues, Path, UseFormRegister } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FlagIcon } from "@/components/decor/FlagIcon";
import { COUNTRY_CODES } from "@/data/country-codes";

interface PhoneFieldsProps<T extends FieldValues> {
  control: Control<T>;
  register: UseFormRegister<T>;
  countryCodeName: Path<T>;
  phoneName: Path<T>;
  countryCodeError?: string;
  phoneError?: string;
  label?: string;
  required?: boolean;
}

/** Selector de código de país + input de número local, para mantener el
 *  mismo par de campos (`*_country_code` + número) que espera el backend. */
export function PhoneFields<T extends FieldValues>({
  control,
  register,
  countryCodeName,
  phoneName,
  countryCodeError,
  phoneError,
  label = "Teléfono",
  required = false,
}: PhoneFieldsProps<T>) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={phoneName}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        <Controller
          control={control}
          name={countryCodeName}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-[6.5rem] shrink-0" aria-label="Código de país">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <FlagIcon country={c.flag} />
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Input
          id={phoneName}
          type="tel"
          autoComplete="tel-national"
          inputMode="numeric"
          placeholder="5512345678"
          aria-invalid={Boolean(phoneError)}
          {...register(phoneName)}
        />
      </div>
      {countryCodeError && <p className="text-sm text-destructive">{countryCodeError}</p>}
      {phoneError && <p className="text-sm text-destructive">{phoneError}</p>}
    </div>
  );
}
