import { ArrowRight, Clock, Loader } from "lucide-react";
import type { Schedule } from "../../api/scheduleApi";
import type { Step } from "../../type";

type Props = {
  departure: string;
  destination: string;
  selectedDate: string;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
  selectedSchedule: Schedule;
  setSelectedSchedule: (schedule: Schedule) => void;
  schedules: Schedule[];
  isLoading: boolean;
};

export const TimeStep = (props: Props) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold">
              Choisissez votre horaire
            </h2>
            <p className="text-gray-600 mt-1">
              {props.departure} → {props.destination} •{" "}
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

        {props.isLoading ? (
          <div className="text-center py-12">
            <Loader className="size-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Chargement des horaires...</p>
          </div>
        ) : props.schedules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-lg">Aucun horaire disponible</p>
            <p className="text-gray-500 text-sm mt-2">
              Essayez une autre date ou un autre trajet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {props.schedules.map((schedule) => (
              <button
                key={schedule._id}
                onClick={() => props.setSelectedSchedule(schedule)}
                className={`p-4 border-2 rounded-lg transition cursor-pointer ${
                  props.selectedSchedule?._id === schedule._id
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 hover:border-primary/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="size-5 text-gray-600" />
                    <span className="text-xl font-bold">{schedule.time}</span>
                  </div>
                  <span className="text-lg font-semibold text-primary">
                    {schedule.price.toLocaleString()} Ar
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {schedule.availableSeats} place
                  {schedule.availableSeats > 1 ? "s" : ""} disponible
                  {schedule.availableSeats > 1 ? "s" : ""}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => props.setCurrentStep("route")}
            className="flex-1 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            Retour
          </button>
          <button
            onClick={() => props.setCurrentStep("seats")}
            disabled={!props.selectedSchedule}
            className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
              props.selectedSchedule
                ? "bg-primary text-black hover:bg-primary/90 cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <span>Choisir mes sièges</span>
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
