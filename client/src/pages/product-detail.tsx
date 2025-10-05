import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ReservationModal from "@/components/reservation-modal";
import type { Product } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/p/:slug");
  const slug = params?.slug;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/by-slug/${slug}`],
    enabled: !!slug,
  });

  const formatPrice = (price: string) => {
    return `CHF ${parseFloat(price).toFixed(0)}.-`;
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.imageUrls.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-96 bg-muted rounded-lg mb-4"></div>
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-12 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Übersicht
            </Button>
          </Link>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Artikel nicht gefunden</h2>
            <p className="text-muted-foreground">
              Dieser Artikel existiert nicht oder wurde bereits verkauft.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hasMultipleImages = product.imageUrls.length > 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-primary">Umzugsbeute</h1>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            {shareSuccess ? (
              <>
                <Check className="h-4 w-4 mr-2 text-green-600" />
                Kopiert!
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-2" />
                Teilen
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Multi-item Discount Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-medium text-green-800">
              Reserviere 2+ Artikel und erhalte 10% Rabatt auf alles!
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Image Gallery */}
        <div className="relative group mb-6">
          <div className="aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            <img
              src={product.imageUrls[currentImageIndex]}
              alt={`${product.name} - Bild ${currentImageIndex + 1}`}
              className="w-full h-full object-cover"
            />
          </div>

          {hasMultipleImages && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              >
                <ChevronRight size={24} />
              </button>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {product.imageUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>

              <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1.5 rounded-md text-sm font-medium">
                {currentImageIndex + 1} / {product.imageUrls.length}
              </div>
            </>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {hasMultipleImages && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {product.imageUrls.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                  index === currentImageIndex ? 'border-primary' : 'border-transparent'
                }`}
              >
                <img
                  src={imageUrl}
                  alt={`${product.name} - Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{product.category}</Badge>
              {product.isPinned && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  Empfohlen
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
            <p className="text-4xl font-bold text-destructive mb-4">
              {formatPrice(product.price)}
            </p>
          </div>

          <div className="prose prose-sm">
            <h2 className="text-lg font-semibold text-foreground">Beschreibung</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
          </div>

          {/* Reservation Button */}
          {product.isAvailable ? (
            <Button
              onClick={() => setIsReservationModalOpen(true)}
              className="w-full bg-primary text-primary-foreground py-6 text-lg font-semibold"
              size="lg"
            >
              Jetzt reservieren
            </Button>
          ) : (
            <Button disabled className="w-full py-6 text-lg" size="lg">
              Bereits reserviert
            </Button>
          )}

          {/* Contact Info */}
          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <h3 className="font-semibold text-foreground mb-2">Abholung & Kontakt</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Abholung:</strong> Storenberg 9a, Müllheim Dorf</p>
              <p><strong>Zeiten:</strong> Mo-Fr 17:00-19:00, Sa-So 10:00-16:00</p>
              <p><strong>Kontakt:</strong> 076 628 64 06 (WhatsApp)</p>
            </div>
          </div>
        </div>
      </main>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        product={product}
        onSuccess={() => setIsReservationModalOpen(false)}
      />
    </div>
  );
}
