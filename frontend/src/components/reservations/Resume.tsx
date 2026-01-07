import { Info, X } from "lucide-react";
import type { Step, TimeSlot } from "../../type";

type Props = {
  departure: string;
  destination: string;
  selectedDate: string;
  selectedTime: TimeSlot | null;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedSeats: number[];
  handleSeatClick: (seatId: number) => void;
};

export const Resume = (props: Props) => {
  const totalPrice =
    props.selectedSeats.length * (props.selectedTime?.price || 200);
  return (
    <div className="lg:col-span-1">
      <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
        <h3 className="text-xl font-semibold mb-4">Résumé de réservation</h3>

        {/* Trajet */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">Départ</span>
            <span className="font-medium">{props.departure}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Destination</span>
            <span className="font-medium">{props.destination}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="font-medium">
              {new Date(props.selectedDate).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Heure</span>
            <span className="font-medium">{props.selectedTime?.time}</span>
          </div>
          <button
            onClick={() => props.setCurrentStep("time")}
            className="text-primary text-sm hover:underline"
          >
            Modifier l'horaire
          </button>
        </div>

        {/* Siege */}
        <div className="mb-6">
          <h4 className="font-semibold mb-3">Sièges sélectionnés</h4>
          {props.selectedSeats.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun siège sélectionné</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {props.selectedSeats.map((seatId) => (
                <div
                  key={seatId}
                  className="bg-primary/10 text-black px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <span className="font-medium">Siège {seatId}</span>
                  <button
                    onClick={() => props.handleSeatClick(seatId)}
                    className="hover:bg-primary/20 rounded-full p-0.5"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Price */}
        <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
          <div className="flex justify-between">
            <span className="text-gray-600">
              Prix par siège ({props.selectedSeats.length})
            </span>
            <span className="font-medium">
              {(props.selectedTime?.price || 20000).toLocaleString()} Ar
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">
              {totalPrice.toLocaleString()} Ar
            </span>
          </div>
        </div>

        {/* Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex gap-2">
          <Info className="size-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Vos sièges seront réservés pendant 10 minutes après la validation.
          </p>
        </div>
        {/* Confirmation button */}
        <button
          disabled={props.selectedSeats.length === 0}
          className={`w-full py-3 rounded-lg font-semibold transiton ${
            props.selectedSeats.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-primary text-black hover:bg-primary/90 cursor-pointer"
          }`}
        >
          Continuer vers le paiement
        </button>
      </div>
    </div>
  );
};
