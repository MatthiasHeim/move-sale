import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product-card";
import CategoryFilters from "@/components/category-filters";
import FaqSection from "@/components/faq-section";
import ReservationModal from "@/components/reservation-modal";
import type { Product, Faq } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: [`/api/products${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`],
    enabled: true,
  });

  const { data: faqs = [] } = useQuery<Faq[]>({
    queryKey: ["/api/faqs"],
  });

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReservation = (product: Product) => {
    setSelectedProduct(product);
    setIsReservationModalOpen(true);
  };

  const handleReservationSuccess = () => {
    setIsReservationModalOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-primary" data-testid="site-title">MöbelMarkt</h1>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-muted hover:bg-secondary/20"
              data-testid="menu-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Input
              type="search"
              placeholder="Möbel & Geräte suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-12 bg-input border-border focus:ring-ring"
              data-testid="search-input"
            />
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              data-testid="search-button"
            >
              <Search className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </header>

      {/* Location Banner */}
      <div className="bg-accent/10 border-b border-accent/20">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent-foreground" data-testid="pickup-location">
              <strong>Abholung:</strong> Storenberg 9a, Mülheim Dorf
            </span>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <CategoryFilters 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <main className="max-w-md mx-auto px-4 py-4">
        {/* Product Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4" data-testid="products-heading">
            Verfügbare Artikel
          </h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                  <div className="h-48 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-3"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-16 bg-muted rounded"></div>
                    <div className="h-8 w-24 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground" data-testid="no-products-message">
                {searchQuery ? `Keine Artikel für "${searchQuery}" gefunden.` : "Keine Artikel verfügbar."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 fade-in" data-testid="products-grid">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onReservation={() => handleReservation(product)}
                />
              ))}
            </div>
          )}
        </section>

        {/* FAQ Section */}
        <FaqSection faqs={faqs} />

        {/* Contact Section */}
        <section className="bg-secondary/10 rounded-lg p-6 border border-secondary/20" data-testid="contact-section">
          <h2 className="text-lg font-semibold text-foreground mb-4">Kontakt & Verfügbarkeit</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <i className="fas fa-phone text-secondary"></i>
              <span className="text-foreground" data-testid="phone-number">+41 76 123 45 67</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-envelope text-secondary"></i>
              <span className="text-foreground" data-testid="email">contact@möbelmarkt.ch</span>
            </div>
            <div className="flex items-start gap-2">
              <i className="fas fa-clock text-secondary mt-0.5"></i>
              <div>
                <div className="font-medium text-foreground">Abholzeiten:</div>
                <div className="text-muted-foreground" data-testid="weekday-hours">Mo-Fr: 17:00-19:00</div>
                <div className="text-muted-foreground" data-testid="weekend-hours">Sa-So: 10:00-16:00</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-accent/20 rounded-lg border border-accent/30">
              <div className="flex items-center gap-2">
                <i className="fas fa-info-circle text-accent"></i>
                <span className="text-sm font-medium text-accent-foreground" data-testid="urgency-message">
                  Umzug Ende März - Alle Artikel müssen bis dahin verkauft werden!
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Reservation Modal */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        product={selectedProduct}
        onSuccess={handleReservationSuccess}
      />
    </div>
  );
}
