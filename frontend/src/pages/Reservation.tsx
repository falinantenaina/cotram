import { ArrowLeft, Info, User, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RouteStep } from "../components/reservations/RouteStep";
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

  const getSeatsByRow = (row: number) => {
    return seats.filter((seat) => seat.row === row);
  };

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case "available":
        return "bg-gray-200 hover:bg-gray-300 cursor-pointer";
      case "selected":
        return "bg-primary text-black cursor-pointer";
      case "occupied":
        return "bg-gray-400 cursor-not-allowed opacity-50";
    }
  };

  const totalPrice = selectedSeats.length * (selectedTime?.price || 20000);

  // Étape 3: Choix des sièges
  const SeatsStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Visualisation du véhicule */}
      <div className="lg:col-span-2">
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          {/* Légende */}
          <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-300">
            <div className="flex items-center gap-2">
              <div className="size-6 bg-gray-200 rounded border border-gray-300"></div>
              <span className="text-sm">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-6 bg-primary rounded border border-gray-300"></div>
              <span className="text-sm">Sélectionné</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-6 bg-gray-400 rounded border border-gray-300 opacity-50"></div>
              <span className="text-sm">Occupé</span>
            </div>
          </div>

          {/* Vue du véhicule */}
          <div className="max-w-md mx-auto">
            {/* Rangée 1 - Chauffeur à gauche et 2 sièges à droite */}
            <div className="mb-4">
              <div className="grid grid-cols-7 gap-2 items-center">
                {/* Chauffeur à gauche */}
                <div className="col-span-2 h-16 bg-dark-gray rounded flex items-center justify-center text-white">
                  <User className="size-8" />
                </div>

                {/* Allée */}
                <div className="col-span-1"></div>

                {/* Sièges 1 et 2 à droite */}
                {getSeatsByRow(1).map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id)}
                    className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                      seat.status
                    )}`}
                    disabled={seat.status === "occupied"}
                  >
                    {seat.id}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-600 ml-1">Chauffeur</span>
              <div className="h-px bg-gray-300 mt-4"></div>
            </div>

            {/* Rangée 2 - 4 sièges */}
            <div className="mb-4">
              <div className="grid grid-cols-8 gap-2">
                {getSeatsByRow(2).map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id)}
                    className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                      seat.status
                    )}`}
                    disabled={seat.status === "occupied"}
                  >
                    {seat.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Rangées 3-4 - 2 sièges à gauche, allée, 1 siège à droite */}
            {[3, 4].map((row) => (
              <div key={row} className="mb-4">
                <div className="grid grid-cols-7 gap-2 items-center">
                  {/* Sièges gauche et milieu (2 sièges côte à côte) */}
                  {getSeatsByRow(row)
                    .filter((s) => s.position === "left")
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat.id)}
                        className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                          seat.status
                        )}`}
                        disabled={seat.status === "occupied"}
                      >
                        {seat.id}
                      </button>
                    ))}

                  {getSeatsByRow(row)
                    .filter((s) => s.position === "middle")
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat.id)}
                        className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                          seat.status
                        )}`}
                        disabled={seat.status === "occupied"}
                      >
                        {seat.id}
                      </button>
                    ))}

                  {/* Allée centrale */}
                  <div className="col-span-1"></div>

                  {/* Siège droit (seul à droite) */}
                  {getSeatsByRow(row)
                    .filter((s) => s.position === "right")
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => handleSeatClick(seat.id)}
                        className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                          seat.status
                        )}`}
                        disabled={seat.status === "occupied"}
                      >
                        {seat.id}
                      </button>
                    ))}
                </div>
              </div>
            ))}

            {/* Rangée 5 - Banquette arrière (4 sièges) */}
            <div className="mt-6 pt-4 border-t border-gray-300">
              <div className="grid grid-cols-4 gap-2">
                {getSeatsByRow(5).map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => handleSeatClick(seat.id)}
                    className={`h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                      seat.status
                    )}`}
                    disabled={seat.status === "occupied"}
                  >
                    {seat.id}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Banquette arrière
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé de la réservation */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
          <h3 className="text-xl font-semibold mb-4">Résumé de réservation</h3>

          {/* Informations du trajet */}
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Départ</span>
              <span className="font-medium">{departure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Destination</span>
              <span className="font-medium">{destination}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span className="font-medium">
                {new Date(selectedDate).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Heure</span>
              <span className="font-medium">{selectedTime?.time}</span>
            </div>
            <button
              onClick={() => setCurrentStep("time")}
              className="text-primary text-sm hover:underline"
            >
              Modifier l'horaire
            </button>
          </div>

          {/* Sièges sélectionnés */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Sièges sélectionnés</h4>
            {selectedSeats.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun siège sélectionné</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seatId) => (
                  <div
                    key={seatId}
                    className="bg-primary/10 text-black px-3 py-1 rounded-full flex items-center gap-2"
                  >
                    <span className="font-medium">Siège {seatId}</span>
                    <button
                      onClick={() => handleSeatClick(seatId)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Prix */}
          <div className="space-y-2 mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">
                Prix par siège ({selectedSeats.length})
              </span>
              <span className="font-medium">
                {(selectedTime?.price || 20000).toLocaleString()} Ar
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">
                {totalPrice.toLocaleString()} Ar
              </span>
            </div>
          </div>

          {/* Alerte */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex gap-2">
            <Info className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Vos sièges seront réservés pendant 10 minutes après la validation.
            </p>
          </div>

          {/* Bouton de confirmation */}
          <button
            disabled={selectedSeats.length === 0}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              selectedSeats.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-primary text-black hover:bg-primary/90 cursor-pointer"
            }`}
          >
            Continuer vers le paiement
          </button>
        </div>
      </div>
    </div>
  );

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
        {currentStep === "seats" && <SeatsStep />}
      </Container>
    </div>
  );
};

export default Reservation;
