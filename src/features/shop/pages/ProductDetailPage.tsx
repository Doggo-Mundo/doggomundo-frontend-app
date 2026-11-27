import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Package, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoadingState } from "@/components/shared/LoadingState";
import { EmptyState } from "@/components/shared/EmptyState";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { BackLink } from "@/features/pets/components/BackLink";
import { QuantitySelector } from "@/features/shop/components/QuantitySelector";
import { useProduct } from "@/api/hooks/use-retail";
import { formatMoney } from "@/features/orders/lib/format-money";
import { itemCap, useCartStore } from "@/stores/cart-store";
import { cn } from "@/lib/utils";

/** Debajo de este stock mostramos "Hasta N disponibles" — arriba es
 *  ruido (nadie compra 10+ unidades del mismo producto). */
const MAX_HINT_THRESHOLD = 10;

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(id ?? "");
  const addToCart = useCartStore((s) => s.add);
  const inCart = useCartStore(
    (s) => s.items.find((i) => i.productId === id)?.quantity ?? 0,
  );

  const [qty, setQty] = useState(1);

  if (!id) return <Navigate to="/shop" replace />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink to="/shop" label="Tienda" />
        <LoadingState rows={3} />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <BackLink to="/shop" label="Tienda" />
        <EmptyState
          title="No pudimos cargar este producto"
          description="Puede que ya no esté disponible."
        />
      </div>
    );
  }

  // Un pedido se recoge en UNA sucursal → el tope es lo que hay en la
  // sucursal con más stock (max_available), menos lo que ya está en el
  // carrito.
  const soldOut = !product.in_stock || product.max_available <= 0;
  const cap = itemCap(product.max_available);
  const remaining = Math.max(0, cap - inCart);
  const cartAtMax = !soldOut && remaining === 0;
  // Deriva la cantidad efectiva en vez de sincronizar con un effect:
  // si el tope baja (se agregó al carrito), el selector se ajusta solo.
  const effectiveQty = Math.min(qty, Math.max(remaining, 1));

  function handleAddToCart() {
    if (!product || remaining === 0) return;
    addToCart(product, effectiveQty);
    setQty(1);
    toast.success(
      effectiveQty === 1
        ? `Agregamos ${product.name} al carrito.`
        : `Agregamos ${effectiveQty} × ${product.name} al carrito.`,
    );
  }

  function handleBuyNow() {
    if (!product || soldOut) return;
    // Con el carrito ya al tope no agregamos más — solo vamos a pagar.
    if (remaining > 0) addToCart(product, effectiveQty);
    navigate("/checkout");
  }

  return (
    <div className="space-y-5">
      <BackLink to="/shop" label="Tienda" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Photo */}
        <Card className="overflow-hidden lg:sticky lg:top-20">
          <CardContent className="aspect-square bg-muted py-0">
            <ImageWithFallback
              src={product.photo}
              alt={product.name}
              className="h-full w-full object-contain"
              fallbackClassName="h-full w-full"
              fallback={<Package className="h-20 w-20 text-muted-foreground" />}
            />
          </CardContent>
        </Card>

        {/* Info column */}
        <div className="space-y-5 lg:max-w-md">
          <header className="space-y-1">
            <Link
              to={`/shop?category=${product.category}`}
              className="inline-block text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {product.category_name}
            </Link>
            {product.brand && (
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            )}
            <h1 className="text-2xl font-semibold">{product.name}</h1>
          </header>

          <p className="text-3xl font-semibold">{formatMoney(product.price)}</p>

          {!soldOut && (
            <div className="space-y-1.5">
              {!cartAtMax && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    Cantidad
                  </span>
                  <QuantitySelector
                    value={effectiveQty}
                    onChange={setQty}
                    max={remaining}
                  />
                </div>
              )}
              {inCart > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {cartAtMax
                    ? `Ya tienes ${inCart} en tu carrito, el máximo disponible.`
                    : `Ya tienes ${inCart} en tu carrito; puedes agregar hasta ${remaining} más.`}
                </p>
              ) : (
                cap < MAX_HINT_THRESHOLD && (
                  <p className="text-xs text-muted-foreground">
                    {cap === 1
                      ? "Queda 1 disponible."
                      : `Hasta ${cap} disponibles.`}
                  </p>
                )
              )}
            </div>
          )}

          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={soldOut || cartAtMax}
            >
              <ShoppingCart />
              {soldOut ? "Agotado" : "Agregar al carrito"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleBuyNow}
              disabled={soldOut}
            >
              <Zap />
              {soldOut ? "Agotado" : "Comprar ahora"}
            </Button>
          </div>

          {product.availability && product.availability.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Disponibilidad para recoger
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-1.5 text-sm">
                  {product.availability.map((row) => (
                    <li
                      key={row.location_id}
                      className={cn(
                        "flex items-center gap-2",
                        row.available <= 0 && "text-muted-foreground",
                      )}
                    >
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {row.available > 0
                        ? `Disponible en ${row.location_name} (${row.available})`
                        : `Agotado en ${row.location_name}`}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {product.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descripción</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm whitespace-pre-line">
                {product.description}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
