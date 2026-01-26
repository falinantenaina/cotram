import { Calendar, MapPin, Users } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";
import { useReservations } from "../hooks/useReservation";

const MyReservations = () => {
  const { user } = useAuth();
  const { reservations, isLoading } = useReservations();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmée";
      case "pending":
        return "En attente";
      case "cancelled":
        return "Annulée";
      case "completed":
        return "Terminée";
      default:
        return status;
    }
  };

  return (
    <Container className="py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Mes Réservations</h1>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">Aucune réservation</p>
            <a
              href="/reservation"
              className="text-primary hover:underline mt-2 inline-block"
            >
              Faire une réservation
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation: any) => (
              <div
                key={reservation._id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Référence</p>
                    <p className="font-bold text-lg">
                      {reservation.bookingReference}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}
                  >
                    {getStatusText(reservation.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="size-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Trajet</p>
                      <p className="font-medium">
                        {reservation.schedule?.route?.departure} →{" "}
                        {reservation.schedule?.route?.destination}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="size-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Date & Heure</p>
                      <p className="font-medium">
                        {new Date(
                          reservation.schedule?.date,
                        ).toLocaleDateString("fr-FR")}{" "}
                        à {reservation.schedule?.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="size-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Sièges</p>
                      <p className="font-medium">
                        {reservation.seats.join(", ")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="size-5"></div>
                    <div>
                      <p className="text-sm text-gray-600">Prix total</p>
                      <p className="font-bold text-primary text-lg">
                        {reservation.totalPrice.toLocaleString()} Ar
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    Réservé le{" "}
                    {new Date(reservation.createdAt).toLocaleDateString(
                      "fr-FR",
                    )}
                  </p>
                  {reservation.status === "pending" && (
                    <button className="text-red-600 hover:underline text-sm">
                      Annuler
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
};

export default MyReservations;
