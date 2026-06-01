// frontend/src/pages/Reservation.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/reservations/Header";
import { Resume } from "../components/reservations/Resume";
import { RouteStep } from "../components/reservations/RouteStep";
import { SeatsStep } from "../components/reservations/SeatsStep";
import { TimeStep } from "../components/reservations/TimeStep";
import { useAuth } from "../hooks/useAuth";

import type { Schedule } from "../api/scheduleApi";
import { buildFallbackConfig, type SeatConfig } from "../config/seatLayouts";
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
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(null);

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
    if (!user && currentStep === "seats") navigate("/auth");
  }, [user, currentStep, navigate]);

  useEffect(() => {
    if (!selectedSchedule) return;

    const occupied = selectedSchedule.occupiedSeats || [];

    // ── Récupérer le seatConfig — TOUJOURS présent dans l'objet schedule ──────
    // Il vient directement de l'API, pas besoin de le chercher ailleurs
    const rawConfig = (selectedSchedule as any).seatConfig;

    console.log("[Reservation] seatConfig depuis API:", rawConfig);

    let config: SeatConfig;

    if (rawConfig && rawConfig.rows && rawConfig.rows.length > 0) {
      // ✅ seatConfig configuré par l'admin — utiliser tel quel
      config = rawConfig as SeatConfig;
    } else {
      // ⚠️ Pas de seatConfig → fallback générique selon totalSeats
      console.warn(
        "[Reservation] Pas de seatConfig — fallback sur",
        selectedSchedule.totalSeats,
        "places",
      );
      config = buildFallbackConfig(selectedSchedule.totalSeats);
    }

    setSeatConfig(config);

    // Construire la liste Seat[] depuis config.rows[].seats[]
    const allSeats: Seat[] = [];
    config.rows.forEach((row) => {
      row.seats.forEach((s) => {
        allSeats.push({
          id: s.id,
          row: s.row,
          position: s.position,
          status: occupied.includes(s.id) ? "occupied" : "available",
        });
      });
    });

    console.log("[Reservation] seats construits:", allSeats.length, "sièges");
    setSeats(allSeats);
  }, [selectedSchedule]);

  const handleSeatClick = (seatId: number) => {
    setSeats((prev) =>
      prev.map((s) =>
        s.id !== seatId
          ? s
          : {
              ...s,
              status: s.status === "selected" ? "available" : "selected",
            },
      ),
    );
    toggleSeat(seatId);
  };

  const handleSelectSchedule = (schedule: Schedule) => {
    console.log(
      "[Reservation] horaire sélectionné:",
      schedule.id,
      "seatConfig:",
      (schedule as any).seatConfig,
    );
    setSelectedSchedule(schedule);
    setScheduleId(schedule.id);
    setTripDetails({
      departure: localDeparture,
      destination: localDestination,
      date: localDate,
      time: schedule.time,
      price: schedule.price,
    });
  };

  const handleConfirm = async () => {
    if (!scheduleId || selectedSeats.length === 0) return;
    try {
      await createReservation({ scheduleId, seats: selectedSeats });
    } catch (err) {
      console.error(err);
    }
  };

  const displayConfig =
    seatConfig ?? buildFallbackConfig(selectedSchedule?.totalSeats ?? 16);

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
            <SeatsStep
              seats={seats}
              seatConfig={displayConfig}
              handleSeatClick={handleSeatClick}
            />
            <Resume
              departure={localDeparture}
              destination={localDestination}
              selectedDate={localDate}
              selectedSchedule={selectedSchedule as Schedule}
              setCurrentStep={setCurrentStep}
              selectedSeats={selectedSeats}
              handleSeatClick={handleSeatClick}
              onConfirm={handleConfirm}
              isLoading={isCreating}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservation;
