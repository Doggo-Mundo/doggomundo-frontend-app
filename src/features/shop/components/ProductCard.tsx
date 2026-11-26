import { Link } from "react-router-dom";
import { Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";
import { formatMoney } from "@/features/orders/lib/format-money";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/retail";

interface Props {
  product: Product;
}

export function ProductCard({ product }: Props) {
  // Agotado en todas las sucursales: se sigue mostrando (y se puede
  // abrir el detalle para ver dónde hubo stock), pero atenuado.
  const soldOut = !product.in_stock;
  return (
    <Link
      to={`/shop/products/${product.id}`}
      className="block rounded-xl active:scale-[0.98] transition-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-3 p-3">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            <ImageWithFallback
              src={product.photo}
              alt={product.name}
              className={cn(
                "h-full w-full object-contain",
                soldOut && "opacity-50 grayscale",
              )}
              fallbackClassName="h-full w-full"
              fallback={<Package className="h-10 w-10 text-muted-foreground" />}
            />
            {soldOut && (
              <span className="absolute left-2 top-2 rounded-full bg-foreground/80 px-2 py-0.5 text-[11px] font-medium text-background">
                Agotado
              </span>
            )}
          </div>
          <div className="min-h-0 flex-1 space-y-0.5">
            {product.brand && (
              <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                {product.brand}
              </p>
            )}
            <p className="line-clamp-2 text-sm font-medium">{product.name}</p>
          </div>
          <p
            className={cn(
              "text-base font-semibold",
              soldOut && "text-muted-foreground",
            )}
          >
            {formatMoney(product.price)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
