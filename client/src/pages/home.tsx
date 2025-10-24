import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Menu, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
    queryFn: async () => {
      const url = `/api/products${selectedCategory !== "all" ? `?category=${selectedCategory}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      // Handle both response formats: array directly or wrapped in an object
      return Array.isArray(data) ? data : (data.products || []);
    },
  });

  // Temporarily disable FAQs to focus on getting products working
  const faqs: Faq[] = [
    {
      id: "1",
      question: "Wie kann ich Möbel reservieren?",
      answer: "Klicke einfach auf das gewünschte Möbelstück und wähle einen Abholtermin aus."
    },
    {
      id: "2",
      question: "Wann kann ich die Möbel abholen?",
      answer: "Abholung ist möglich: Mo-Fr 17:00-19:00 Uhr, Sa-So 10:00-16:00 Uhr."
    }
  ];

  // Temporarily disable auth check to focus on products
  const authStatus = { isAuthenticated: false };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
            <h1 className="text-xl font-bold text-primary" data-testid="site-title">Umzugsbeute</h1>
            <div className="flex items-center gap-2">
              {(authStatus as any)?.isAuthenticated && (
                <Link href="/admin">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600"
                    data-testid="admin-button"
                    title="Admin Console"
                  >
                    <Settings className="h-5 w-5" />
                  </Button>
                </Link>
              )}
              <Link href="/admin/login">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full bg-muted hover:bg-secondary/20"
                  data-testid="menu-button"
                  title="Admin Login"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </Link>
            </div>
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

      {/* AI Feature Banner - only show to admin */}
      {(authStatus as any)?.isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-200">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-800" data-testid="ai-banner">
                🤖 KI-Assistant aktiv - Automatische Produktbeschreibungen & Tutti-Listings
              </span>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Contact Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 border-b border-green-700">
        <div className="max-w-md mx-auto px-4 py-4">
          <a
            href="https://wa.me/41766286406"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 text-white hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold">Fragen? Termin vereinbaren?</div>
                <div className="text-lg font-bold tracking-wide">076 628 64 06</div>
              </div>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-full text-xs font-medium">
              WhatsApp →
            </div>
          </a>
        </div>
      </div>

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
              <span className="text-foreground" data-testid="phone-number">0766286406</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="fas fa-envelope text-secondary"></i>
              <span className="text-foreground" data-testid="email">matthias@lailix.com</span>
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
                  Move beginning of November - All items must be sold by then!
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
