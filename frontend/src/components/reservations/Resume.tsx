import { AlertCircle, CreditCard, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

import type { Schedule } from "../../api/scheduleApi";
import type { Step } from "../../type";

type Props = {
  departure: string;
  destination: string;
  selectedDate: string;
  selectedSchedule: Schedule;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedSeats: number[];
  handleSeatClick: (seatId: number) => void;
  onOpenPayment: () => void;
};

export const Resume = (props: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const totalPrice =
    props.selectedSeats.length * (props.selectedSchedule?.price || 0);
  const hasSeats = props.selectedSeats.length > 0;
  const displayDate = new Date(
    props.selectedDate + "T00:00:00",
  ).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  return (
    <div className="lg:col-span-1">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm sticky top-24 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 text-lg">Récapitulatif</h3>
        </div>

        {/* Trip summary */}
        <div className="px-6 py-4 space-y-3 border-b border-gray-50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Trajet</span>
            <span className="font-semibold text-gray-900 text-right">
              {props.departure} → {props.destination}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Date</span>
            <span className="font-semibold text-gray-900">{displayDate}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-400">Heure</span>
            <span className="font-semibold text-gray-900">
              {props.selectedSchedule?.time}
            </span>
          </div>
          <button
            onClick={() => props.setCurrentStep("time")}
            className="text-xs text-primary hover:underline font-semibold"
          >
            Modifier l'horaire
          </button>
        </div>

        {/* Seats */}
        <div className="px-6 py-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">
              Sièges sélectionnés
            </p>
            {hasSeats && (
              <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                {props.selectedSeats.length}
              </span>
            )}
          </div>

          {!hasSeats ? (
            <p className="text-sm text-gray-400 bg-gray-50 px-3 py-2.5 rounded-xl text-center">
              Aucun siège sélectionné
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {props.selectedSeats.map((seatId) => (
                <button
                  key={seatId}
                  onClick={() => props.handleSeatClick(seatId)}
                  className="flex items-center gap-1.5 bg-primary/10 hover:bg-red-50 text-black hover:text-red-600 border border-primary/20 hover:border-red-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all group"
                >
                  Siège {seatId}
                  <X size={11} className="opacity-50 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="px-6 py-4 border-b border-gray-50 space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Prix unitaire</span>
            <span className="font-medium text-gray-700">
              {(props.selectedSchedule?.price || 0).toLocaleString()} Ar
            </span>
          </div>
          {hasSeats && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {props.selectedSeats.length} siège
                {props.selectedSeats.length > 1 ? "s" : ""}
              </span>
              <span className="font-medium text-gray-700">
                ×{props.selectedSeats.length}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-2xl font-black text-primary">
              {totalPrice.toLocaleString()}
              <span className="text-sm font-semibold text-primary/60 ml-1">
                Ar
              </span>
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="px-6 py-4">
          <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
            <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Vos sièges sont réservés pendant <strong>10 minutes</strong> après
              la validation.
            </p>
          </div>

          <button
            onClick={() => {
              if (!user) {
                navigate("/auth?returnTo=/reservation");
              } else {
                props.onOpenPayment();
              }
            }}
            disabled={!hasSeats}
            className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
              hasSeats
                ? "bg-primary text-black hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.99]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <CreditCard size={18} />
            {!user ? "Connectez-vous pour réserver" : "Procéder au paiement"}
          </button>

          {hasSeats && (
            <p className="text-center text-xs text-gray-400 mt-3">
              Présentez-vous 15 min avant le départ
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
