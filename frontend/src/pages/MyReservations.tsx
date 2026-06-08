import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";
import { useCancelReservation, useReservations } from "../hooks/useReservation";

const statusConfig = {
  confirmed: {
    label: "Confirmée",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  cancelled: {
    label: "Annulée",
    className: "bg-red-50 text-red-700 border border-red-200",
  },
  completed: {
    label: "Terminée",
    className: "bg-blue-50 text-blue-700 border border-blue-200",
  },
};

const MyReservations = () => {
  const { user } = useAuth();
  const { reservations, isLoading } = useReservations();
  const { cancelReservation, isLoading: isCancelling } = useCancelReservation();
  const [cancelId, setCancelId] = useState<string | null>(null);

  if (!user) return <Navigate to="/auth" replace />;

  const handleCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelReservation(cancelId);
    } catch {
      /* handled */
    } finally {
      setCancelId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <Container className="py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Mes Réservations
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              {reservations.length} réservation
              {reservations.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Link
            to="/reservation"
            className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            <Ticket size={15} />
            Nouvelle réservation
          </Link>
        </Container>
      </div>

      <Container className="py-8">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm">
                Chargement de vos réservations...
              </p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-24">
              <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Ticket size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Aucune réservation
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Vous n'avez pas encore réservé de trajet.
              </p>
              <Link
                to="/reservation"
                className="inline-flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                Réserver maintenant
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map((reservation: any) => {
                const status =
                  statusConfig[
                    reservation.status as keyof typeof statusConfig
                  ] || statusConfig.pending;
                const isPending = reservation.status === "pending";
                const depDate = new Date(reservation.schedule?.date);

                return (
                  <div
                    key={reservation.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden"
                  >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center">
                          <Ticket size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Référence</p>
                          <p className="font-mono font-bold text-sm text-gray-900">
                            {reservation.bookingReference}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-5">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {/* Route */}
                        <div className="flex items-start gap-3">
                          <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Trajet</p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {reservation.schedule?.route?.departure?.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              → {reservation.schedule?.route?.destination?.name}
                            </p>
                          </div>
                        </div>

                        {/* Date & heure */}
                        <div className="flex items-start gap-3">
                          <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">
                              Date & Heure
                            </p>
                            <p className="font-semibold text-gray-900 text-sm">
                              {depDate.toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock size={11} />
                              {reservation.schedule?.time}
                            </p>
                          </div>
                        </div>

                        {/* Seats & Price */}
                        <div className="flex items-start gap-3">
                          <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                            <Ticket size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Sièges</p>
                            <div className="flex flex-wrap gap-1 mb-1">
                              {reservation.seats.map((s: number) => (
                                <span
                                  key={s}
                                  className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-lg"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                            <p className="text-sm font-black text-primary">
                              {reservation.totalPrice.toLocaleString()} Ar
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    {isPending && (
                      <div className="px-6 py-3 bg-amber-50/50 border-t border-amber-100/50 flex items-center justify-between">
                        <p className="text-xs text-amber-600">
                          ⏱ En attente de confirmation par nos équipes
                        </p>
                        <button
                          onClick={() => setCancelId(reservation.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>

      {/* Cancel Confirmation Modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="size-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <button
                onClick={() => setCancelId(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Annuler la réservation ?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Cette action est irréversible. Vos sièges seront libérés et remis
              en vente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Garder
              </button>
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isCancelling ? "Annulation..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReservations;
