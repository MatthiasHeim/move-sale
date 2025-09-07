import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Copy, Search, Calendar } from "lucide-react";
import type { Product, ProductText } from "@shared/schema";

export default function TuttiArchiveTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch all products
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopiert",
      description: `${label} wurde in die Zwischenablage kopiert.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-CH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate Tutti text from product data
  const generateTuttiText = (product: Product) => {
    // This is a simplified version - in a real implementation,
    // you would fetch this from the product_texts table
    const title = `${product.name} - CHF ${product.price}`;
    const body = `${product.description}

Abholung: Müllheim Dorf
Zahlung: Bar oder TWINT
Termin nach Absprache

Kein Versand. Privatverkauf, keine Garantie.`;

    return { title, body };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-lg">Lade Archiv...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Tutti-Texte durchsuchen
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Nach Produktname oder Kategorie suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            data-testid="input-search"
          />
        </CardContent>
      </Card>

      {/* Results */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-lg text-gray-500">
              {searchTerm ? "Keine Artikel gefunden." : "Noch keine Artikel vorhanden."}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            {filteredProducts.length} Artikel gefunden
          </div>
          
          {filteredProducts.map((product) => {
            const tuttiText = generateTuttiText(product);
            
            return (
              <Card key={product.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg" data-testid={`archive-title-${product.id}`}>
                        {product.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" data-testid={`archive-category-${product.id}`}>
                          {product.category}
                        </Badge>
                        <Badge variant="outline" data-testid={`archive-price-${product.id}`}>
                          CHF {product.price}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(product.createdAt.toString())}
                        </span>
                      </div>
                    </div>
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                      data-testid={`archive-image-${product.id}`}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tutti Title */}
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-700">
                        Tutti-Titel:
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tuttiText.title, "Tutti-Titel")}
                        data-testid={`button-copy-title-${product.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-medium" data-testid={`tutti-title-${product.id}`}>
                      {tuttiText.title}
                    </p>
                  </div>

                  {/* Tutti Body */}
                  <div className="bg-green-50 p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">
                        Tutti-Beschreibung:
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(tuttiText.body, "Tutti-Beschreibung")}
                        data-testid={`button-copy-body-${product.id}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="whitespace-pre-wrap" data-testid={`tutti-body-${product.id}`}>
                      {tuttiText.body}
                    </p>
                  </div>

                  {/* Quick Copy All */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        copyToClipboard(
                          `${tuttiText.title}\n\n${tuttiText.body}`,
                          "Kompletter Tutti-Text"
                        )
                      }
                      data-testid={`button-copy-all-${product.id}`}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Alles kopieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}