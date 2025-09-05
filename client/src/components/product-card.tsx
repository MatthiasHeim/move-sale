import { Button } from "@/components/ui/button";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onReservation: () => void;
}

export default function ProductCard({ product, onReservation }: ProductCardProps) {
  const formatPrice = (price: string) => {
    return `CHF ${parseFloat(price).toFixed(0)}.-`;
  };

  return (
    <div 
      className="product-card bg-card rounded-lg shadow-md overflow-hidden border border-border" 
      data-testid={`product-card-${product.id}`}
    >
      <img 
        src={product.imageUrl} 
        alt={product.name}
        className="w-full h-48 object-cover"
        loading="lazy"
        data-testid={`product-image-${product.id}`}
      />
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`product-description-${product.id}`}>
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-destructive" data-testid={`product-price-${product.id}`}>
            {formatPrice(product.price)}
          </span>
          <Button 
            onClick={onReservation}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors min-h-[44px]"
            data-testid={`reserve-button-${product.id}`}
          >
            Reservieren
          </Button>
        </div>
      </div>
    </div>
  );
}
