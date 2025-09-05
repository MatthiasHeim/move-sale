import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@shared/schema";

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

interface PickupTime {
  datetime: string;
  display: string;
  value: string;
}

export default function ReservationModal({ isOpen, onClose, product, onSuccess }: ReservationModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedPickupTime, setSelectedPickupTime] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pickupTimes = [] } = useQuery<PickupTime[]>({
    queryKey: ["/api/pickup-times"],
    enabled: isOpen,
  });

  const reservationMutation = useMutation({
    mutationFn: async (data: {
      productId: string;
      customerName: string;
      customerPhone: string;
      pickupTime: string;
    }) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reservierung erfolgreich!",
        description: "Sie erhalten in Kürze eine Bestätigung per Telefon.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      resetForm();
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Reservierung fehlgeschlagen",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCustomerName("");
    setCustomerPhone("");
    setSelectedPickupTime("");
    setCurrentImageIndex(0);
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

  const formatPrice = (price: string) => {
    return `CHF ${parseFloat(price).toFixed(0)}.-`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !customerName.trim() || !customerPhone.trim() || !selectedPickupTime) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie alle Felder aus.",
        variant: "destructive",
      });
      return;
    }

    reservationMutation.mutate({
      productId: product.id,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      pickupTime: selectedPickupTime,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!product) return null;

  const hasMultipleImages = product && product.imageUrls.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto" data-testid="reservation-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">Artikel reservieren</DialogTitle>
          <DialogDescription>
            Füllen Sie das Formular aus, um {product.name} zu reservieren und einen Abholtermin zu vereinbaren.
          </DialogDescription>
        </DialogHeader>
        
        {/* Product Summary */}
        <div className="border rounded-lg p-4 bg-muted/20" data-testid="product-summary">
          <div className="flex gap-4">
            {/* Product Image Gallery */}
            <div className="relative w-24 h-24 flex-shrink-0 group">
              <img 
                src={product.imageUrls[currentImageIndex]} 
                alt={`${product.name} - Bild ${currentImageIndex + 1}`}
                className="w-full h-full object-cover rounded"
                data-testid="modal-product-image"
              />
              
              {hasMultipleImages && (
                <>
                  {/* Navigation buttons */}
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    data-testid="modal-prev-image"
                  >
                    <ChevronLeft size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    data-testid="modal-next-image"
                  >
                    <ChevronRight size={12} />
                  </button>
                  
                  {/* Image counter */}
                  <div className="absolute bottom-1 right-1 bg-black/50 text-white px-1 py-0.5 rounded text-xs">
                    {currentImageIndex + 1}/{product.imageUrls.length}
                  </div>
                </>
              )}
            </div>
            
            {/* Product Details */}
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-1" data-testid="modal-product-name">
                {product.name}
              </h4>
              <p className="text-lg font-bold text-destructive mb-1" data-testid="modal-product-price">
                {formatPrice(product.price)}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2" data-testid="modal-product-description">
                {product.description}
              </p>
            </div>
          </div>
          
          {/* Thumbnail gallery for multiple images */}
          {hasMultipleImages && (
            <div className="flex gap-1 mt-3 overflow-x-auto">
              {product.imageUrls.map((imageUrl, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentImageIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded border-2 overflow-hidden transition-colors ${
                    index === currentImageIndex ? 'border-primary' : 'border-transparent'
                  }`}
                  data-testid={`modal-thumbnail-${index}`}
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
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName" className="block text-sm font-medium text-foreground mb-1">
              Ihr Name
            </Label>
            <Input
              id="customerName"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Vollständiger Name"
              className="w-full"
              required
              data-testid="input-customer-name"
            />
          </div>
          
          <div>
            <Label htmlFor="customerPhone" className="block text-sm font-medium text-foreground mb-1">
              Telefonnummer
            </Label>
            <Input
              id="customerPhone"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+41 XX XXX XX XX"
              className="w-full"
              required
              data-testid="input-customer-phone"
            />
          </div>
          
          <div>
            <Label htmlFor="pickupTime" className="block text-sm font-medium text-foreground mb-1">
              Gewünschter Abholtermin
            </Label>
            <Select value={selectedPickupTime} onValueChange={setSelectedPickupTime} required>
              <SelectTrigger className="w-full" data-testid="select-pickup-time">
                <SelectValue placeholder="Wählen Sie einen Termin" />
              </SelectTrigger>
              <SelectContent>
                {pickupTimes.map((time) => (
                  <SelectItem key={time.value} value={time.value} data-testid={`pickup-time-option-${time.value}`}>
                    {time.display}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-lg" data-testid="reservation-notice">
            <div className="text-sm text-muted-foreground">
              <strong>Wichtig:</strong> Die Reservierung ist 48 Stunden gültig. Bei Nichtabholung wird der Artikel wieder freigegeben.
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              className="flex-1 min-h-[44px]"
              data-testid="cancel-reservation-button"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={reservationMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 min-h-[44px]"
              data-testid="confirm-reservation-button"
            >
              {reservationMutation.isPending ? "Wird reserviert..." : "Reservierung bestätigen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
