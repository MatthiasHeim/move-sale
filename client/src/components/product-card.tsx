import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Pin } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onReservation: () => void;
}

export default function ProductCard({ product, onReservation }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const formatPrice = (price: string) => {
    return `CHF ${parseFloat(price).toFixed(0)}.-`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.imageUrls.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);
  };

  const hasMultipleImages = product.imageUrls.length > 1;

  return (
    <div
      onClick={onReservation}
      className={`product-card bg-card rounded-lg shadow-md overflow-hidden border cursor-pointer hover:shadow-lg transition-shadow ${
        (product as any).isPinned
          ? "border-yellow-500 ring-2 ring-yellow-200 shadow-lg"
          : "border-border"
      }`}
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative group">
        <img 
          src={product.imageUrls[currentImageIndex]} 
          alt={`${product.name} - Bild ${currentImageIndex + 1}`}
          className="w-full h-48 object-cover"
          loading="lazy"
          data-testid={`product-image-${product.id}`}
        />
        
        {hasMultipleImages && (
          <>
            {/* Navigation buttons */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              data-testid={`prev-image-${product.id}`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              data-testid={`next-image-${product.id}`}
            >
              <ChevronRight size={16} />
            </button>
            
            {/* Image indicator dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
              {product.imageUrls.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                  data-testid={`image-dot-${product.id}-${index}`}
                />
              ))}
            </div>

            {/* Image counter */}
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
              {currentImageIndex + 1} / {product.imageUrls.length}
            </div>
          </>
        )}

        {/* Pinned indicator */}
        {(product as any).isPinned && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
            <Pin size={12} />
            Empfohlen
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* Multi-item Discount Banner */}
        <div className="mb-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="text-xs font-medium text-green-800">
              Reserviere 2+ Artikel und erhalte 10% Rabatt auf alles!
            </span>
          </div>
        </div>

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
            onClick={(e) => {
              e.stopPropagation();
              onReservation();
            }}
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
