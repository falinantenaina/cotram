import { useState } from "react";
import { Header } from "../components/reservations/Header";
import { ProgressBar } from "../components/reservations/ProgressBar";
import { Resume } from "../components/reservations/Resume";
import { RouteStep } from "../components/reservations/RouteStep";
import { SeatsStep } from "../components/reservations/SeatsStep";
import { TimeStep } from "../components/reservations/TimeStep";
import { Container } from "../components/ui/Container";
import { initialSeats } from "../data";
import type { Seat, Step, TimeSlot } from "../type";

const Reservation = () => {
  const [currentStep, setCurrentStep] = useState<Step>("route");
  const [departure, setDeparture] = useState("");
  const [destination, setDestination] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedTime, setSelectedTime] = useState<TimeSlot | null>(null);

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

  return (
    <div className="bg-white min-h-screen">
      <Container className="py-8">
        {/* Header */}
        <Header currentStep={currentStep} setCurrentStep={setCurrentStep} />

        {/* Progress bar */}
        <ProgressBar currentStep={currentStep} />

        {/* Step */}
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
