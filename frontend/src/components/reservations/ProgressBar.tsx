import type { Step } from "../../type";

export const ProgressBar = ({ currentStep }: { currentStep: Step }) => {
  return (
    <div className="max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-medium ${
            currentStep === "route" ? "text-primary" : "text-gray-600"
          }`}
        >
          Trajet
        </span>
        <span
          className={`text-sm font-medium ${
            currentStep === "time" ? "text-primary" : "text-gray-600"
          }`}
        >
          Horaire
        </span>
        <span
          className={`text-sm font-medium ${
            currentStep === "seats" ? "text-primary" : "text-gray-600"
          }`}
        >
          Sièges
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{
            width:
              currentStep === "route"
                ? "33.33%"
                : currentStep === "time"
                ? "66.66%"
                : "100%",
          }}
        ></div>
      </div>
    </div>
  );
};
