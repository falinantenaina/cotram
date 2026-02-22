import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/reservations/Header";
import { Resume } from "../components/reservations/Resume";
import { RouteStep } from "../components/reservations/RouteStep";
import { SeatsStep } from "../components/reservations/SeatsStep";
import { TimeStep } from "../components/reservations/TimeStep";
import { useAuth } from "../hooks/useAuth";

import type { Schedule } from "../api/scheduleApi";
import { useCreateReservation } from "../hooks/useReservation";
import { useSchedules } from "../hooks/useSchedules";
import { useReservationTempStore } from "../stores/reservationStore";
import type { Seat, Step } from "../type";

const Reservation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    scheduleId,
    selectedSeats,
    departure,
    destination,
    date,
    setScheduleId,
    setTripDetails,
    toggleSeat,
  } = useReservationTempStore();

  const [currentStep, setCurrentStep] = useState<Step>("route");
  const [localDeparture, setLocalDeparture] = useState(departure);
  const [localDestination, setLocalDestination] = useState(destination);
  const [localDate, setLocalDate] = useState(
    date || new Date().toISOString().split("T")[0],
  );
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [seats, setSeats] = useState<Seat[]>([]);

  const { schedules, isLoading: isLoadingSchedules } = useSchedules(
    currentStep === "time"
      ? {
          departure: localDeparture,
          destination: localDestination,
          date: localDate,
        }
      : undefined,
  );

  const { createReservation, isLoading: isCreating } = useCreateReservation();

  useEffect(() => {
    if (!user && currentStep === "seats") {
      navigate("/auth");
    }
  }, [user, currentStep, navigate]);

  useEffect(() => {
    if (selectedSchedule) {
      const occupiedSeats = selectedSchedule.occupiedSeats || [];
      const initialSeats: Seat[] = [
        {
          id: 1,
          row: 1,
          position: "middle",
          status: occupiedSeats.includes(1) ? "occupied" : "available",
        },
        {
          id: 2,
          row: 1,
          position: "right",
          status: occupiedSeats.includes(2) ? "occupied" : "available",
        },
        {
          id: 3,
          row: 2,
          position: "left",
          status: occupiedSeats.includes(3) ? "occupied" : "available",
        },
        {
          id: 4,
          row: 2,
          position: "left",
          status: occupiedSeats.includes(4) ? "occupied" : "available",
        },
        {
          id: 5,
          row: 2,
          position: "middle",
          status: occupiedSeats.includes(5) ? "occupied" : "available",
        },
        {
          id: 6,
          row: 2,
          position: "right",
          status: occupiedSeats.includes(6) ? "occupied" : "available",
        },
        {
          id: 7,
          row: 3,
          position: "left",
          status: occupiedSeats.includes(7) ? "occupied" : "available",
        },
        {
          id: 8,
          row: 3,
          position: "middle",
          status: occupiedSeats.includes(8) ? "occupied" : "available",
        },
        {
          id: 9,
          row: 3,
          position: "right",
          status: occupiedSeats.includes(9) ? "occupied" : "available",
        },
        {
          id: 10,
          row: 4,
          position: "left",
          status: occupiedSeats.includes(10) ? "occupied" : "available",
        },
        {
          id: 11,
          row: 4,
          position: "middle",
          status: occupiedSeats.includes(11) ? "occupied" : "available",
        },
        {
          id: 12,
          row: 4,
          position: "right",
          status: occupiedSeats.includes(12) ? "occupied" : "available",
        },
        {
          id: 13,
          row: 5,
          position: "middle",
          status: occupiedSeats.includes(13) ? "occupied" : "available",
        },
        {
          id: 14,
          row: 5,
          position: "middle",
          status: occupiedSeats.includes(14) ? "occupied" : "available",
        },
        {
          id: 15,
          row: 5,
          position: "middle",
          status: occupiedSeats.includes(15) ? "occupied" : "available",
        },
        {
          id: 16,
          row: 5,
          position: "middle",
          status: occupiedSeats.includes(16) ? "occupied" : "available",
        },
      ];
      setSeats(initialSeats);
    }
  }, [selectedSchedule]);

  const handleSeatClick = (seatId: number) => {
    const seat = seats.find((s) => s.id === seatId);
    if (!seat || seat.status === "occupied") return;

    setSeats((prev) =>
      prev.map((s) => {
        if (s.id === seatId) {
          return {
            ...s,
            status: s.status === "selected" ? "available" : "selected",
          };
        }
        return s;
      }),
    );
    toggleSeat(seatId);
  };

  const handleSelectSchedule = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setScheduleId(schedule._id);
    setTripDetails({
      departure: localDeparture,
      destination: localDestination,
      date: localDate,
      time: schedule.time,
      price: schedule.price,
    });
  };

  const handleConfirmReservation = async () => {
    if (!scheduleId || selectedSeats.length === 0) return;
    try {
      await createReservation({ scheduleId, seats: selectedSeats });
    } catch (error) {
      console.error("Erreur réservation:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <Header currentStep={currentStep} setCurrentStep={setCurrentStep} />

        {currentStep === "route" && (
          <RouteStep
            departure={localDeparture}
            setDeparture={setLocalDeparture}
            destination={localDestination}
            setDestination={setLocalDestination}
            selectedDate={localDate}
            setSelectedDate={setLocalDate}
            setCurrentStep={setCurrentStep}
          />
        )}

        {currentStep === "time" && (
          <TimeStep
            departure={localDeparture}
            destination={localDestination}
            selectedDate={localDate}
            setCurrentStep={setCurrentStep}
            selectedSchedule={selectedSchedule as Schedule}
            setSelectedSchedule={handleSelectSchedule}
            schedules={schedules}
            isLoading={isLoadingSchedules}
          />
        )}

        {currentStep === "seats" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SeatsStep seats={seats} handleSeatClick={handleSeatClick} />
            <Resume
              departure={localDeparture}
              destination={localDestination}
              selectedDate={localDate}
              selectedSchedule={selectedSchedule as Schedule}
              setCurrentStep={setCurrentStep}
              selectedSeats={selectedSeats}
              handleSeatClick={handleSeatClick}
              onConfirm={handleConfirmReservation}
              isLoading={isCreating}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservation;
