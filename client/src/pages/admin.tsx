import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Upload, LogOut, Plus, Edit, Trash2, CheckCircle, Copy } from "lucide-react";
import type { Product } from "@shared/schema";

// Import admin tab components
import CreateListingTab from "@/components/admin/CreateListingTab";
import ProductsTab from "@/components/admin/ProductsTab";
import TuttiArchiveTab from "@/components/admin/TuttiArchiveTab";

export default function Admin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check auth status
  const { data: authStatus, isLoading: authLoading } = useQuery({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status"] });
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet.",
      });
      navigate("/admin/login");
    },
    onError: () => {
      toast({
        title: "Abmelde-Fehler",
        description: "Fehler beim Abmelden.",
        variant: "destructive",
      });
    },
  });

  // Redirect to login if not authenticated
  if (!authLoading && (!authStatus || !(authStatus as any)?.isAuthenticated)) {
    navigate("/admin/login");
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Lade Admin-Bereich...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              MöbelMarkt Admin
            </h1>
            <p className="text-sm text-gray-600">
              Verwalten Sie Ihre Möbel und Artikel
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            {logoutMutation.isPending ? "Abmelden..." : "Abmelden"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" data-testid="tab-create">
              <Plus className="h-4 w-4 mr-2" />
              Neues Angebot
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">
              <Edit className="h-4 w-4 mr-2" />
              Meine Artikel
            </TabsTrigger>
            <TabsTrigger value="tutti" data-testid="tab-tutti">
              <Copy className="h-4 w-4 mr-2" />
              Tutti Archiv
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <CreateListingTab />
          </TabsContent>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="tutti">
            <TuttiArchiveTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}