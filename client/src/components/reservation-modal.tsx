import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto" data-testid="reservation-modal">
        <DialogHeader>
          <DialogTitle data-testid="modal-title">Artikel reservieren</DialogTitle>
          <DialogDescription>
            Füllen Sie das Formular aus, um {product.name} zu reservieren und einen Abholtermin zu vereinbaren.
          </DialogDescription>
        </DialogHeader>
        
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
