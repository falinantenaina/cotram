import { ArrowLeft } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import type { Step } from "../../type";

type Props = {
  currentStep: Step;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
};

const steps: { key: Step; label: string; desc: string }[] = [
  { key: "route", label: "Trajet", desc: "Choisissez votre itinéraire" },
  { key: "time", label: "Horaire", desc: "Sélectionnez un départ" },
  { key: "seats", label: "Sièges", desc: "Réservez vos places" },
];

const stepIndex = { route: 0, time: 1, seats: 2 };

export const Header = (props: Props) => {
  const navigate = useNavigate();
  const current = stepIndex[props.currentStep];

  const handleBack = () => {
    if (props.currentStep === "route") navigate(-1);
    else if (props.currentStep === "time") props.setCurrentStep("route");
    else props.setCurrentStep("time");
  };

  return (
    <div className="mb-8">
      {/* Back button */}
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 group"
      >
        <div className="size-8 flex items-center justify-center border border-gray-200 rounded-lg group-hover:border-gray-300 group-hover:bg-gray-50 transition-all">
          <ArrowLeft size={15} />
        </div>
        <span className="text-sm font-medium">Retour</span>
      </button>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1">
          Réservation de billet
        </h1>
        <p className="text-gray-400 text-sm">
          Étape {current + 1} sur {steps.length} — {steps[current].desc}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;

          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-black"
                      : active
                        ? "bg-white border-primary text-primary"
                        : "bg-white border-gray-200 text-gray-400"
                  }`}
                >
                  {done ? (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path
                        d="M1 5L4.5 8.5L11 1.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-sm font-semibold hidden sm:block ${
                    active
                      ? "text-gray-900"
                      : done
                        ? "text-gray-500"
                        : "text-gray-300"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${i < current ? "bg-primary" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
