import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/reservations/Header";
import { ProgressBar } from "../components/reservations/ProgressBar";
import { Resume } from "../components/reservations/Resume";
import { RouteStep } from "../components/reservations/RouteStep";
import { SeatsStep } from "../components/reservations/SeatsStep";
import { TimeStep } from "../components/reservations/TimeStep";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";

import type { Schedule } from "../api/scheduleApi";
import { useCreateReservation } from "../hooks/useReservation";
import { useSchedules } from "../hooks/useSchedules";
import { useReservationTempStore } from "../stores/reservationStore";
import type { Seat, Step } from "../type";

const Reservation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Zustand store pour état temporaire
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

  // Fetch schedules avec React Query
  const { schedules, isLoading: isLoadingSchedules } = useSchedules(
    currentStep === "time"
      ? {
          departure: localDeparture,
          destination: localDestination,
          date: localDate,
        }
      : undefined,
  );

  // Créer réservation
  const { createReservation, isLoading: isCreating } = useCreateReservation();

  // Rediriger si non connecté
  useEffect(() => {
    if (!user && currentStep === "seats") {
      navigate("/auth");
    }
  }, [user, currentStep, navigate]);

  // Initialiser les sièges quand un horaire est sélectionné
  useEffect(() => {
    if (selectedSchedule) {
      const initialSeats: Seat[] = [];
      const occupiedSeats = selectedSchedule.occupiedSeats || [];

      // Rangée 1 (2 sièges)
      initialSeats.push(
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
      );

      // Rangée 2 (4 sièges)
      for (let i = 3; i <= 6; i++) {
        initialSeats.push({
          id: i,
          row: 2,
          position: i === 3 || i === 4 ? "left" : "middle",
          status: occupiedSeats.includes(i) ? "occupied" : "available",
        });
      }

      // Rangées 3-4 (3 sièges chacune)
      for (let row = 3; row <= 4; row++) {
        const startId = row === 3 ? 7 : 10;
        initialSeats.push(
          {
            id: startId,
            row,
            position: "left",
            status: occupiedSeats.includes(startId) ? "occupied" : "available",
          },
          {
            id: startId + 1,
            row,
            position: "middle",
            status: occupiedSeats.includes(startId + 1)
              ? "occupied"
              : "available",
          },
          {
            id: startId + 2,
            row,
            position: "right",
            status: occupiedSeats.includes(startId + 2)
              ? "occupied"
              : "available",
          },
        );
      }

      // Rangée 5 (4 sièges)
      for (let i = 13; i <= 16; i++) {
        initialSeats.push({
          id: i,
          row: 5,
          position: "middle",
          status: occupiedSeats.includes(i) ? "occupied" : "available",
        });
      }

      setSeats(initialSeats);
    }
  }, [selectedSchedule]);

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
      await createReservation({
        scheduleId,
        seats: selectedSeats,
      });
      // La redirection et le clear sont gérés dans le hook
    } catch (error) {
      console.error("Erreur réservation:", error);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <Container className="py-8">
        <Header currentStep={currentStep} setCurrentStep={setCurrentStep} />
        <ProgressBar currentStep={currentStep} />

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
      </Container>
    </div>
  );
};

export default Reservation;
