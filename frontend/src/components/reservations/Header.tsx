import { ArrowLeft } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";
import type { Step } from "../../type";

type Props = {
  currentStep: Step;
  setCurrentStep: React.Dispatch<React.SetStateAction<Step>>;
};

export const Header = (props: Props) => {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-x-4 mb-8">
      <button
        onClick={() => {
          if (props.currentStep === "route") {
            navigate(-1);
          } else if (props.currentStep === "time") {
            props.setCurrentStep("route");
          } else {
            props.setCurrentStep("time");
          }
        }}
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <ArrowLeft className="size-6" />
      </button>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">
          Réservation de billet
        </h1>
        <p className="text-gray-600">
          {props.currentStep === "route" && "Étape 1/3 : Trajet"}
          {props.currentStep === "time" && "Étape 2/3 : Horaire"}
          {props.currentStep === "seats" && "Étape 3/3 : Sièges"}
        </p>
      </div>
    </div>
  );
};
