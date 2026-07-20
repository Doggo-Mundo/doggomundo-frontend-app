import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Package, ShoppingCart, Zap } from "lucide-react";
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
import { useCartStore } from "@/stores/cart-store";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(id ?? "");
  const addToCart = useCartStore((s) => s.add);

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

  function handleAddToCart() {
    if (!product) return;
    addToCart(product, qty);
    toast.success(
      qty === 1
        ? `Agregamos ${product.name} al carrito.`
        : `Agregamos ${qty} × ${product.name} al carrito.`,
    );
  }

  function handleBuyNow() {
    if (!product) return;
    addToCart(product, qty);
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

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Cantidad</span>
            <QuantitySelector value={qty} onChange={setQty} />
          </div>

          <div className="space-y-2">
            <Button size="lg" className="w-full" onClick={handleAddToCart}>
              <ShoppingCart />
              Agregar al carrito
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleBuyNow}
            >
              <Zap />
              Comprar ahora
            </Button>
          </div>

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
