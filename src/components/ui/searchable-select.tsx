import * as React from "react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { Check, ChevronDown, Loader2, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
  id: string;
  name: string;
}

interface Props<T extends SearchableSelectOption> {
  options: T[];
  /** Currently selected option's id, or null for none. */
  value: string | null;
  onChange: (id: string | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  isLoading?: boolean;
  id?: string;
  className?: string;
  /**
   * F-E.2: cuando se pasa, el picker muestra un botón "Crear
   * '{query}'" al fondo del listado cuando la búsqueda no matchea
   * ninguna opción existente. La promise devuelve la opción creada
   * (nueva o existente por dedupe en backend); el picker la
   * selecciona automáticamente y cierra el popover.
   */
  onCreate?: (name: string) => Promise<T>;
  /** Label del botón create — default "Crear". */
  createLabel?: string;
}

/**
 * Compact combobox: a button trigger that opens a popover with a search
 * input and a filtered list. For small (<200 items) catalogs we filter
 * client-side — no virtualization needed.
 */
export function SearchableSelect<T extends SearchableSelectOption>({
  options,
  value,
  onChange,
  placeholder = "Selecciona…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados.",
  disabled,
  isLoading,
  id,
  className,
  onCreate,
  createLabel = "Crear",
}: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const selected = React.useMemo(
    () => options.find((o) => o.id === value) ?? null,
    [options, value],
  );

  // Match sin diacríticos + case-insensitive para que "aleman"
  // encuentre "Alemán" sin obligar al usuario a poner tildes.
  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => normalize(o.name).includes(q));
  }, [options, query]);

  // El botón "Crear" aparece cuando: onCreate está habilitado, hay
  // algo tipeado, y ningún option matchea EXACTAMENTE (normalizado).
  // Con match parcial (ej. tipeó "Beag" y aparece "Beagle") NO
  // ofrecemos crear — el usuario probablemente quiere el existente.
  const trimmed = query.trim();
  const showCreate = React.useMemo(() => {
    if (!onCreate || trimmed.length < 2) return false;
    const wanted = normalize(trimmed);
    return !options.some((o) => normalize(o.name) === wanted);
  }, [onCreate, options, trimmed]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // Reset the query whenever the popover closes so the list always opens
    // unfiltered next time. Doing it here (vs. in an effect) keeps the
    // React Compiler happy.
    if (!next) setQuery("");
  }

  async function handleCreate() {
    if (!onCreate || !trimmed) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmed);
      onChange(created.id);
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled || isLoading}
          className={cn(
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none transition-colors",
            "hover:bg-accent/40",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">
            {isLoading
              ? "Cargando…"
              : selected
                ? selected.name
                : placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-(--radix-popover-trigger-width) overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 shrink-0 opacity-60" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto py-1"
          >
            {filtered.length === 0 && !showCreate ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((option) => {
                const isSelected = option.id === value;
                return (
                  <li key={option.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(isSelected ? null : option.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none transition-colors",
                        "hover:bg-accent/50",
                        "focus-visible:bg-accent/60",
                        isSelected && "bg-accent/30 font-medium",
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{option.name}</span>
                    </button>
                  </li>
                );
              })
            )}
            {showCreate && (
              <li className="border-t">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={creating}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm outline-none transition-colors",
                    "text-primary hover:bg-accent/50",
                    "focus-visible:bg-accent/60",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {createLabel} “{trimmed}”
                  </span>
                </button>
              </li>
            )}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/** Normaliza para match: lower + strip + sin diacríticos.
 *  Mirror del helper `_normalize_breed_name` del backend
 *  (pets/serializers.py) — sirve para que "aleman" encuentre
 *  "Alemán" en el picker cliente-side, y para decidir cuándo
 *  ofrecer "Crear …" (no ofrecemos si un match normalizado
 *  ya existe). */
function normalize(raw: string): string {
  return raw
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}
