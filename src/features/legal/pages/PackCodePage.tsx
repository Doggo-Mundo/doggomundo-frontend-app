import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { LegalPageLayout } from "@/features/legal/components/LegalPageLayout";

const IMAGE_SRC = "/legal/codigo-de-la-manada.png";
const IMAGE_ALT =
  "Código de la Manada — reglas de convivencia del espacio Doggo Mundo";

/**
 * F-G.4: Código de la Manada — reglas de convivencia del espacio
 * Doggo Mundo que cada cliente acepta al registrarse.
 *
 * PLACEHOLDER: hoy servimos la imagen que armó el equipo con
 * ChatGPT sobre el Word original de Jackie. Cuando llegue el PDF
 * o HTML final del diseñador se reemplaza:
 *
 * - Opción 1 (rápida): swap del archivo en
 *   `public/legal/codigo-de-la-manada.png` por la versión final.
 * - Opción 2 (mejor UX): transcribir el copy a componentes React
 *   con la identidad visual del landing (accesible, seleccionable,
 *   mobile-first).
 */
export function PackCodePage() {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <LegalPageLayout
      title="Código de la Manada"
      version="1.0"
      effectiveDate="2026-09-28"
      hidePlaceholderNotice
    >
      <p>
        Estas son las reglas de convivencia del espacio Doggo Mundo.
        Léelas con calma — al aceptarlas te comprometes a cuidar el
        espacio, a tu Doggo y a los demás Doggos y humanos que
        conviven ahí.
      </p>

      {/* Imagen del código de la manada. Placeholder visual del
          documento branded — el archivo vive en public/legal/ y se
          puede reemplazar sin tocar código cuando llegue la versión
          final del diseñador. Click abre un viewer full-screen con
          zoom (rueda / pinch / botones) para leer con calma. */}
      <button
        type="button"
        onClick={() => setViewerOpen(true)}
        aria-label="Abrir imagen con zoom"
        style={{
          display: "block",
          width: "100%",
          margin: "1.5rem 0",
          padding: 0,
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#ffffff",
          cursor: "zoom-in",
          position: "relative",
        }}
      >
        <img
          src={IMAGE_SRC}
          alt={IMAGE_ALT}
          style={{ display: "block", width: "100%", height: "auto" }}
          loading="eager"
        />
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.5rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.6rem",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "#ffffff",
            background: "rgba(0, 0, 0, 0.55)",
            borderRadius: "9999px",
            backdropFilter: "blur(4px)",
          }}
        >
          <Maximize2 size={14} aria-hidden />
          Toca para ampliar
        </span>
      </button>

      {/* Montaje condicional del viewer: cada apertura arranca con
          state fresco (scale=1, offset centrado) sin necesidad de un
          effect de reset. Al cerrar se desmonta — Radix Dialog no
          juega su animación de fade-out, cambio aceptable por la
          simplicidad. */}
      {viewerOpen && (
        <ImageZoomViewer
          onClose={() => setViewerOpen(false)}
          src={IMAGE_SRC}
          alt={IMAGE_ALT}
        />
      )}
    </LegalPageLayout>
  );
}

// ---------------------------------------------------------------------------
// Viewer con zoom (rueda / pinch / botones) + pan cuando está zoom-in
// ---------------------------------------------------------------------------

interface ZoomViewerProps {
  onClose: () => void;
  src: string;
  alt: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const WHEEL_STEP = 0.0015;
const BUTTON_STEP = 0.5;

/** Modal full-screen para leer una imagen con zoom.
 *
 *  Modelo: la imagen está posicionada absoluta en (0,0) del
 *  contenedor a su tamaño "fit-to-screen" (calculado del natural
 *  ratio + tamaño del contenedor). A eso le aplicamos un transform
 *  `translate(offset) scale(scale)` con `transform-origin: 0 0` —
 *  con este anclaje toda la aritmética de zoom-en-punto es limpia:
 *  la coord de imagen bajo el cursor (cx, cy) es
 *  ((cx - offset.x) / scale, (cy - offset.y) / scale) y para
 *  mantenerla ahí al cambiar de scale despejamos offset directo.
 *
 *  Interacciones: rueda del mouse (desktop), pinch de dos dedos
 *  (touch), botones +/− (todos), drag para panear cuando scale > 1.
 *
 *  Nota de diseño: NO usamos DialogContent del preset porque
 *  queremos full-screen sin el max-w-sm ni el padding. Componemos
 *  Root/Portal/Overlay/Content directo. Se monta sólo cuando el
 *  usuario abre el viewer — así cada apertura arranca fresco sin
 *  necesitar un effect de reset. */
function ImageZoomViewer({ onClose, src, alt }: ZoomViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Tamaño "fit-to-screen" de la imagen dentro del contenedor. Se
  // recalcula al montar (ResizeObserver dispara inicial) y ante
  // cambios de tamaño (rotate, resize, split-screen).
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

  // Estado visible de la interacción — vive en useState (no en
  // refs) porque render lo lee para el cursor y la transition CSS.
  // Refs leídos en render disparan react-hooks/refs.
  const [isDragging, setIsDragging] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  const isInteracting = isDragging || isPinching;

  /** Calcula el fit-to-screen + offset inicial (imagen centrada).
   *  Sale con `false` si aún no tenemos las dimensiones del
   *  contenedor o de la imagen — el caller decide qué hacer. */
  const fit = useCallback(() => {
    const container = containerRef.current;
    const img = imgRef.current;
    if (!container || !img) return false;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    if (!iw || !ih) return false;
    const rect = container.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    const factor = Math.min(rect.width / iw, rect.height / ih);
    const w = iw * factor;
    const h = ih * factor;
    const centered = { x: (rect.width - w) / 2, y: (rect.height - h) / 2 };
    setImgSize({ w, h });
    setInitialOffset(centered);
    setOffset(centered);
    setScale(1);
    return true;
  }, []);

  // ResizeObserver dispara la primera vez al empezar a observar,
  // y luego en cada resize del contenedor. Como el setState pasa
  // dentro del callback del observer (no en el body del effect
  // directamente), respeta react-hooks/set-state-in-effect.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  /** Cambia scale conservando el punto (cx, cy) del contenedor.
   *  Fórmula derivada de que la imagen está en transform
   *  `translate(offset) scale(scale)` con origin 0,0 y anclada en
   *  el 0,0 del contenedor. */
  const zoomAt = useCallback(
    (nextScale: number, cx: number, cy: number) => {
      const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
      setScale((prev) => {
        if (clamped === prev) return prev;
        setOffset((prevOffset) => ({
          x: cx - ((cx - prevOffset.x) / prev) * clamped,
          y: cy - ((cy - prevOffset.y) / prev) * clamped,
        }));
        return clamped;
      });
    },
    [],
  );

  const zoomAtCenter = useCallback(
    (nextScale: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      const cx = rect ? rect.width / 2 : 0;
      const cy = rect ? rect.height / 2 : 0;
      zoomAt(nextScale, cx, cy);
    },
    [zoomAt],
  );

  const reset = useCallback(() => {
    setScale(1);
    setOffset(initialOffset);
  }, [initialOffset]);

  // ------ Rueda (desktop) ------
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = Math.exp(-e.deltaY * WHEEL_STEP);
      zoomAt(scale * factor, cx, cy);
    },
    [scale, zoomAt],
  );

  // ------ Drag / Pan (mouse + 1 dedo, vía Pointer events) ------
  // Datos "de arranque" del gesto viven en un ref porque no deben
  // re-renderizar cada movimiento del puntero; el flag público
  // (isDragging) sí es state.
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    baseX: number;
    baseY: number;
  } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Segundo dedo (o más) → pinch se encarga.
    if (e.pointerType === "touch" && isPinching) return;
    if (scale <= 1) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset({
      x: drag.baseX + (e.clientX - drag.startX),
      y: drag.baseY + (e.clientY - drag.startY),
    });
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragStartRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragStartRef.current = null;
    setIsDragging(false);
  };

  // ------ Pinch (dos dedos, vía Touch events) ------
  const pinchStartRef = useRef<{
    startDistance: number;
    startScale: number;
    centerX: number;
    centerY: number;
  } | null>(null);

  const touchDistance = (a: React.Touch, b: React.Touch) => {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 2) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Cortar drag de un dedo si venía en curso.
    dragStartRef.current = null;
    setIsDragging(false);
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const midX = (t0.clientX + t1.clientX) / 2;
    const midY = (t0.clientY + t1.clientY) / 2;
    pinchStartRef.current = {
      startDistance: touchDistance(t0, t1),
      startScale: scale,
      centerX: midX - rect.left,
      centerY: midY - rect.top,
    };
    setIsPinching(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const pinch = pinchStartRef.current;
    if (!pinch || e.touches.length !== 2) return;
    const dist = touchDistance(e.touches[0], e.touches[1]);
    const factor = dist / pinch.startDistance;
    zoomAt(pinch.startScale * factor, pinch.centerX, pinch.centerY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length < 2) {
      pinchStartRef.current = null;
      setIsPinching(false);
    }
  };

  // Non-passive listeners para poder preventDefault en wheel/pinch:
  // React attach pasivo por default y nuestro preventDefault
  // sintético no toma. Registramos manual con { passive: false }
  // para que la página no scrollee al hacer wheel dentro del
  // viewer ni pinch-zoomee el viewport en touch.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const wheel = (e: WheelEvent) => e.preventDefault();
    const touchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("touchmove", touchMove, { passive: false });
    return () => {
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("touchmove", touchMove);
    };
  }, []);

  return (
    <DialogPrimitive.Root
      open
      onOpenChange={(next) => {
        // Radix llama con `false` cuando el user cierra (ESC /
        // click en overlay / etc.). Traducimos a onClose.
        if (!next) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={[
            "fixed inset-0 z-50 bg-black/90",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
            "duration-150",
          ].join(" ")}
        />
        <DialogPrimitive.Content
          className={[
            "fixed inset-0 z-50 flex flex-col outline-none",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
            "duration-150",
          ].join(" ")}
        >
          <DialogPrimitive.Title className="sr-only">
            Código de la Manada — vista ampliada
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Usa la rueda del mouse, pinch con dos dedos, o los
            botones para acercar y alejar. Arrastra para moverte
            cuando está ampliada.
          </DialogPrimitive.Description>

          {/* Toolbar sticky arriba a la derecha — sobre el
              contenedor de zoom para no perderse cuando el usuario
              hace pan agresivo. */}
          <div
            style={{
              position: "absolute",
              top: "max(0.5rem, env(safe-area-inset-top))",
              right: "max(0.5rem, env(safe-area-inset-right))",
              zIndex: 2,
              display: "flex",
              gap: "0.35rem",
              padding: "0.35rem",
              background: "rgba(0, 0, 0, 0.5)",
              borderRadius: "9999px",
              backdropFilter: "blur(4px)",
            }}
          >
            <ToolbarButton
              onClick={() => zoomAtCenter(scale - BUTTON_STEP)}
              disabled={scale <= MIN_SCALE + 1e-3}
              label="Alejar"
            >
              <Minus size={18} aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              onClick={reset}
              disabled={
                scale === 1 &&
                offset.x === initialOffset.x &&
                offset.y === initialOffset.y
              }
              label="Restablecer zoom"
            >
              <RotateCcw size={18} aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => zoomAtCenter(scale + BUTTON_STEP)}
              disabled={scale >= MAX_SCALE - 1e-3}
              label="Acercar"
            >
              <Plus size={18} aria-hidden />
            </ToolbarButton>
            <ToolbarButton onClick={onClose} label="Cerrar">
              <X size={18} aria-hidden />
            </ToolbarButton>
          </div>

          <div
            ref={containerRef}
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              touchAction: "none",
              cursor:
                scale > 1
                  ? isInteracting
                    ? "grabbing"
                    : "grab"
                  : "default",
            }}
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              onLoad={fit}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: imgSize.w ? `${imgSize.w}px` : "auto",
                height: imgSize.h ? `${imgSize.h}px` : "auto",
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "0 0",
                transition: isInteracting
                  ? "none"
                  : "transform 120ms ease-out",
                userSelect: "none",
                pointerEvents: "none",
                visibility: imgSize.w ? "visible" : "hidden",
              }}
            />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  disabled,
  label,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "2.25rem",
        height: "2.25rem",
        border: 0,
        borderRadius: "9999px",
        background: "rgba(255, 255, 255, 0.12)",
        color: "#ffffff",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
}
