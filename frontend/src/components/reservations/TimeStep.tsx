import { ArrowRight, Clock } from "lucide-react";
import { timeSlots } from "../../data";
import type { Step, TimeSlot } from "../../type";

type Props = {
  departure: string;
  destination: string;
  selectedDate: string;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedTime: TimeSlot | null;
  setSelectedTime: React.Dispatch<React.SetStateAction<TimeSlot | null>>;
};
export const TimeStep = (props: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl md:text-2xl font-bold">
            <h2>Choisissez votre horaire</h2>
            <p className="text-gray-600 mt-1">
              {props.departure} → {props.destination} .{" "}
              {new Date(props.selectedDate).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <button
            onClick={() => props.setCurrentStep("route")}
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Modifier
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {timeSlots.map((slot) => (
            <button
              key={slot.id}
              onClick={() => props.setSelectedTime(slot)}
              className={`p-4 border-2 rounded-lg transition cursor-pointer ${
                props.selectedTime?.id === slot.id
                  ? "border-primary bg-primary/10"
                  : "border-gray-300 hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="size-5 text-gray-600" />
                  <span className="text-xl font-bold">{slot.time}</span>
                </div>
                <span className="text-lg font-semibold text-primary">
                  {slot.price.toLocaleString()} Ar
                </span>
              </div>
              <div className="text-sm text-gray-600">
                {slot.availableSeats} places disponibles
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => props.setCurrentStep("route")}
            className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            Retour
          </button>
          <button
            onClick={() => props.setCurrentStep("seats")}
            disabled={props.selectedTime === null}
            className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              props.selectedTime
                ? "bg-primary text-black hover:bg-primary/90 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            } `}
          >
            <span>Choisier mes sièges</span>
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
