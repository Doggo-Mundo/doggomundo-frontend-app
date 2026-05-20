import { useSearchParams } from "react-router-dom";
import { EmptyState } from "@/components/shared/EmptyState";
import { EmptySearchIllustration } from "@/components/shared/illustrations/EmptySearchIllustration";
import { ProductGridSkeleton } from "@/components/shared/skeletons/ProductCardSkeleton";
import { ProductCard } from "@/features/shop/components/ProductCard";
import { CategoryPill } from "@/features/shop/components/CategoryPill";
import {
  useProductCategories,
  useProducts,
} from "@/api/hooks/use-retail";

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const categoryId = params.get("category") ?? null;

  const { data: categories } = useProductCategories();
  const {
    data: products,
    isLoading,
    isError,
  } = useProducts(categoryId ? { category: categoryId } : {});

  function setCategory(id: string | null) {
    if (id) {
      setParams({ category: id });
    } else {
      setParams({});
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tienda</h1>
        <p className="text-sm text-muted-foreground">
          Productos curados para tu peludo.
        </p>
      </header>

      {categories && categories.length > 0 && (
        <div className="-mx-4 overflow-x-auto px-4 pb-1">
          <div className="flex gap-2">
            <CategoryPill
              label="Todos"
              active={categoryId === null}
              onClick={() => setCategory(null)}
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                label={c.name}
                active={categoryId === c.id}
                onClick={() => setCategory(c.id)}
              />
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <ProductGridSkeleton count={8} />
      ) : isError ? (
        <EmptyState title="No pudimos cargar los productos" />
      ) : !products || products.length === 0 ? (
        <EmptyState
          illustration={<EmptySearchIllustration />}
          title="No hay productos en esta categoría"
          description="Prueba otra categoría o vuelve pronto."
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
