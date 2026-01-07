import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Resume } from "../components/reservations/Resume";
import { RouteStep } from "../components/reservations/RouteStep";
import { SeatsStep } from "../components/reservations/SeatsStep";
import { TimeStep } from "../components/reservations/TimeStep";
import { Container } from "../components/ui/Container";

type SeatStatus = "available" | "selected" | "occupied";

type Seat = {
  id: number;
  row: number;
  position: "left" | "middle" | "right";
  status: SeatStatus;
};

type TimeSlot = {
  id: string;
  time: string;
  availableSeats: number;
  price: number;
};

type Step = "route" | "time" | "seats";

const Reservation = () => {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState<Step>("route");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);

  console.log(currentStep, selectedTime);

  // Configuration initiale des sièges (16 places passagers)
  const initialSeats: Seat[] = [
    // Rangée 1 (2 sièges - derrière le chauffeur)
    { id: 1, row: 1, position: "middle", status: "available" },
    { id: 2, row: 1, position: "right", status: "available" },
    // Rangée 2 (4 sièges)
    { id: 3, row: 2, position: "left", status: "available" },
    { id: 4, row: 2, position: "middle", status: "occupied" },
    { id: 5, row: 2, position: "middle", status: "available" },
    { id: 6, row: 2, position: "right", status: "available" },
    // Rangée 3 (3 sièges)
    { id: 7, row: 3, position: "left", status: "available" },
    { id: 8, row: 3, position: "middle", status: "available" },
    { id: 9, row: 3, position: "right", status: "available" },
    // Rangée 4 (3 sièges)
    { id: 10, row: 4, position: "left", status: "occupied" },
    { id: 11, row: 4, position: "middle", status: "available" },
    { id: 12, row: 4, position: "right", status: "available" },
    // Rangée 5 (4 sièges - banquette arrière)
    { id: 13, row: 5, position: "left", status: "available" },
    { id: 14, row: 5, position: "middle", status: "available" },
    { id: 15, row: 5, position: "middle", status: "available" },
    { id: 16, row: 5, position: "right", status: "available" },
  ];

  const [seats, setSeats] = useState<Seat[]>(initialSeats);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);

  const handleSeatClick = (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.status === "occupied") return;

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seatId) {
          const newStatus = s.status === "selected" ? "available" : "selected";
          return { ...s, status: newStatus };
        }
        return s;
      })
    );

    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      }
      return [...prev, seatId];
    });
  };

  // Étape 3: Choix des sièges

  return (
    <div className="bg-white min-h-screen">
      <Container className="py-8">
        {/* Header */}
        <div className="flex items-center gap-x-4 mb-8">
          <button
            onClick={() => {
              if (currentStep === "route") {
                navigate(-1);
              } else if (currentStep === "time") {
                setCurrentStep("route");
              } else {
                setCurrentStep("time");
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
              {currentStep === "route" && "Étape 1/3 : Trajet"}
              {currentStep === "time" && "Étape 2/3 : Horaire"}
              {currentStep === "seats" && "Étape 3/3 : Sièges"}
            </p>
          </div>
        </div>

        {/* Progress bar */}
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

        {/* Render current step */}
        {currentStep === "route" && (
          <RouteStep
            departure={departure}
            setDeparture={setDeparture}
            destination={destination}
            setDestination={setDestination}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            setCurrentStep={setCurrentStep}
          />
        )}
        {currentStep === "time" && (
          <TimeStep
            departure={departure}
            destination={destination}
            selectedDate={selectedDate}
            setCurrentStep={setCurrentStep}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
          />
        )}
        {currentStep === "seats" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <SeatsStep seats={seats} handleSeatClick={handleSeatClick} />
            <Resume
              departure={departure}
              destination={destination}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              setCurrentStep={setCurrentStep}
              selectedSeats={selectedSeats}
              handleSeatClick={handleSeatClick}
            />
          </div>
        )}
      </Container>
    </div>
  );
};

export default Reservation;
