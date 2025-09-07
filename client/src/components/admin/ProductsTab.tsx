import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Edit, Trash2, CheckCircle, XCircle, Calendar } from "lucide-react";
import type { Product } from "@shared/schema";

export default function ProductsTab() {
  const { toast } = useToast();

  // Fetch all products (admin version shows all)
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

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
          <Card key={product.id} className={!product.isAvailable ? "opacity-75" : ""}>
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
                      <div className="flex gap-2">
                        {product.isAvailable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markSoldMutation.mutate(product.id)}
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
                            onClick={() => reactivateMutation.mutate(product.id)}
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
                          onClick={() => {
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
    </div>
  );
}