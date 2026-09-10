import { useState } from "react";
import { Link } from "react-router-dom";
import { PawPrint } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Props {
  /** Se abre cuando el cliente autenticado no tiene ninguna
   *  mascota registrada. La query de pets lo determina antes de
   *  montar este componente. */
  open: boolean;
}

/**
 * F-G.2: al llegar por primera vez al home sin mascotas cargadas,
 * levantamos un modal para invitar al usuario a registrar la
 * primera. No es totalmente bloqueante — puede cerrar y explorar
 * la app — pero volverá a aparecer en el próximo login mientras
 * la lista de mascotas siga vacía. El CTA principal es un `Link`
 * a `/pets/new` con `state.first=true` para que la página de
 * registro sepa que viene de este flujo (analytics + un copy
 * ligeramente diferente en el titular si quisiéramos usarlo).
 *
 * Design decisions:
 *   - "Más tarde" cierra el modal *para esta sesión* (state local).
 *   - No se persiste dismissal — el usuario que refresque volverá a
 *     verlo. Es intencional: sin mascota no puede reservar servicios
 *     y queremos empujar la conversión suave, no una vez y ya.
 *   - Título brand-friendly con icono PawPrint reforzando la marca.
 */
export function FirstPetDialog({ open }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const isOpen = open && !dismissed;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) setDismissed(true);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <PawPrint className="h-7 w-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Cuéntanos de tu peludo
          </DialogTitle>
          <DialogDescription className="text-center">
            Registra a tu mascota para reservar servicios, guardar
            su cartilla y llevar su expediente clínico en un solo
            lugar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-2">
          <Button asChild size="lg" className="w-full">
            <Link
              to="/pets/new"
              state={{ first: true }}
              onClick={() => setDismissed(true)}
            >
              Registrar mi mascota
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setDismissed(true)}
          >
            Más tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
