import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2, CheckCircle, XCircle, Calendar, Pin, PinOff } from "lucide-react";
import EditProductModal from "./EditProductModal";
import type { Product } from "@shared/schema";

export default function ProductsTab() {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch all products (admin version shows all)
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ["/api/admin/products"],
  });

  // Handle both response formats:
  // - Express server: returns array directly
  // - Vercel API: returns object with 'products' property
  const products = Array.isArray(productsResponse)
    ? productsResponse
    : Array.isArray(productsResponse?.products)
    ? productsResponse.products
    : [];

  const markSoldMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", `/api/products/${productId}/mark-sold`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Als verkauft markiert",
        description: "Der Artikel wurde als verkauft markiert.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("PATCH", `/api/products/${productId}`, { isAvailable: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Reaktiviert",
        description: "Der Artikel ist wieder verfügbar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("DELETE", `/api/products/${productId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      toast({
        title: "Artikel gelöscht",
        description: "Der Artikel wurde entfernt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiRequest("POST", `/api/products/${productId}/toggle-pin`, {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: data.isPinned ? "Artikel angepinnt" : "Artikel entpinnt",
        description: data.isPinned
          ? "Der Artikel wird nun ganz oben angezeigt."
          : "Der Artikel ist nicht mehr angepinnt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg">Lade Artikel...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg text-red-600">Fehler beim Laden der Artikel</div>
          <p className="text-sm text-gray-500 mt-2">
            {error.message || "Bitte versuchen Sie es erneut oder loggen Sie sich neu ein."}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg text-gray-500">
            Noch keine Artikel erstellt.
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Erstellen Sie Ihren ersten Artikel im "Neues Angebot" Tab.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meine Artikel ({products.length})</h2>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className={`cursor-pointer hover:shadow-md transition-shadow ${!product.isAvailable ? "opacity-75" : ""}`}
            onClick={() => setEditingProduct(product)}
          >
            <CardContent className="p-6">
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name}
                    className="w-24 h-24 object-cover rounded-lg"
                    data-testid={`product-image-${product.id}`}
                  />
                </div>

                {/* Product Info */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold" data-testid={`product-name-${product.id}`}>
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" data-testid={`product-category-${product.id}`}>
                          {product.category}
                        </Badge>
                        <Badge
                          variant={product.isAvailable ? "default" : "secondary"}
                          data-testid={`product-status-${product.id}`}
                        >
                          {product.isAvailable ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verfügbar
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Verkauft
                            </>
                          )}
                        </Badge>
                        {(product as any).isPinned && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700" data-testid={`product-pinned-${product.id}`}>
                            <Pin className="h-3 w-3 mr-1" />
                            Angepinnt
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mt-2 line-clamp-2" data-testid={`product-description-${product.id}`}>
                        {product.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(product.createdAt.toString())}
                        </span>
                        <span>{product.imageUrls.length} Bild(er)</span>
                      </div>
                    </div>

                    {/* Price and Actions */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600 mb-3" data-testid={`product-price-${product.id}`}>
                        CHF {product.price}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePinMutation.mutate(product.id);
                          }}
                          disabled={togglePinMutation.isPending}
                          data-testid={`button-pin-${product.id}`}
                          className={(product as any).isPinned ? "border-yellow-500 text-yellow-700" : ""}
                        >
                          {(product as any).isPinned ? (
                            <>
                              <PinOff className="h-4 w-4 mr-1" />
                              Entpinnen
                            </>
                          ) : (
                            <>
                              <Pin className="h-4 w-4 mr-1" />
                              Anpinnen
                            </>
                          )}
                        </Button>
                        {product.isAvailable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markSoldMutation.mutate(product.id);
                            }}
                            disabled={markSoldMutation.isPending}
                            data-testid={`button-mark-sold-${product.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verkauft
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              reactivateMutation.mutate(product.id);
                            }}
                            disabled={reactivateMutation.isPending}
                            data-testid={`button-reactivate-${product.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Reaktivieren
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Artikel wirklich löschen?")) {
                              deleteMutation.mutate(product.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${product.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
      />
    </div>
  );
}