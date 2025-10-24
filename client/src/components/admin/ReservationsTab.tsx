import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, User, Package, Clock } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface ReservationWithProduct {
  id: string;
  productId: string;
  customerName: string;
  customerPhone: string;
  pickupTime: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  productName: string | null;
  productPrice: string | null;
  productCoverImage: string | null;
}

export default function ReservationsTab() {
  const { data: reservations, isLoading } = useQuery<ReservationWithProduct[]>({
    queryKey: ["/api/admin/reservations"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reservierungen werden geladen...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const activeReservations = reservations?.filter(r => r.status === "pending") || [];
  const pastReservations = reservations?.filter(r => r.status !== "pending") || [];

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Ausstehend", variant: "default" },
      confirmed: { label: "Bestätigt", variant: "default" },
      completed: { label: "Abgeschlossen", variant: "secondary" },
      cancelled: { label: "Storniert", variant: "destructive" },
      expired: { label: "Abgelaufen", variant: "outline" },
    };
    const config = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "PPP 'um' p 'Uhr'", { locale: de });
    } catch {
      return dateString;
    }
  };

  const ReservationCard = ({ reservation }: { reservation: ReservationWithProduct }) => (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          {/* Product Image */}
          {reservation.productCoverImage && (
            <div className="flex-shrink-0">
              <img
                src={reservation.productCoverImage}
                alt={reservation.productName || "Produkt"}
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}

          {/* Reservation Details */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {reservation.productName || "Produkt gelöscht"}
                </h3>
                {reservation.productPrice && (
                  <p className="text-sm text-gray-600">CHF {reservation.productPrice}</p>
                )}
              </div>
              {getStatusBadge(reservation.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{reservation.customerName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <a href={`tel:${reservation.customerPhone}`} className="hover:underline">
                  {reservation.customerPhone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{formatDate(reservation.pickupTime)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  Verfällt: {formatDate(reservation.expiresAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Active Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Aktive Reservierungen ({activeReservations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeReservations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine aktiven Reservierungen</p>
          ) : (
            <div className="space-y-4">
              {activeReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Reservations */}
      {pastReservations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Vergangene Reservierungen ({pastReservations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastReservations.map((reservation) => (
                <ReservationCard key={reservation.id} reservation={reservation} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
