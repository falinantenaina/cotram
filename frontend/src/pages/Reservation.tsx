// frontend/src/pages/Reservation.tsx
import { useEffect, useRef, useState } from "react";
import { PaymentModal } from "../components/reservations/PaymentModal";
import { Resume } from "../components/reservations/Resume";
import { RouteStep } from "../components/reservations/RouteStep";
import { SeatsStep } from "../components/reservations/SeatsStep";
import { TimeStep } from "../components/reservations/TimeStep";

import type { Schedule } from "../api/scheduleApi";
import { buildFallbackConfig, type SeatConfig } from "../config/seatLayouts";
import { useSchedules } from "../hooks/useSchedules";
import { useReservationTempStore } from "../stores/reservationStore";
import type { Seat } from "../type";

const Reservation = () => {
  const {
    scheduleId,
    selectedSeats,
    departure,
    destination,
    date,
    selectedSchedule: storeSchedule,
    setScheduleId,
    setTripDetails,
    toggleSeat,
    setSelectedSchedule: setStoreSchedule,
  } = useReservationTempStore();

  const [localDeparture, setLocalDeparture] = useState(departure);
  const [localDestination, setLocalDestination] = useState(destination);
  const [localDate, setLocalDate] = useState(
    date || new Date().toISOString().split("T")[0],
  );
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    storeSchedule,
  );
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  const showSchedules =
    localDeparture && localDestination && localDeparture !== localDestination;

  // Réinitialiser l'horaire et les sièges quand départ/destination/date changent
  const prevRouteKey = useRef(`${localDeparture}-${localDestination}-${localDate}`);
  useEffect(() => {
    const key = `${localDeparture}-${localDestination}-${localDate}`;
    if (key !== prevRouteKey.current) {
      prevRouteKey.current = key;
      setSelectedSchedule(null);
      setStoreSchedule(null);
      setScheduleId("");
      setSeats([]);
      setSeatConfig(null);
    }
  }, [localDeparture, localDestination, localDate]);

  const { schedules, isLoading: isLoadingSchedules } = useSchedules(
    showSchedules
      ? {
          departure: localDeparture,
          destination: localDestination,
          date: localDate,
        }
      : undefined,
  );

  useEffect(() => {
    if (!selectedSchedule) return;

    const occupied = selectedSchedule.occupiedSeats || [];
    const rawConfig = (selectedSchedule as any).seatConfig;

    let config: SeatConfig;
    if (rawConfig && rawConfig.rows && rawConfig.rows.length > 0) {
      config = rawConfig as SeatConfig;
    } else {
      config = buildFallbackConfig(selectedSchedule.totalSeats);
    }

    setSeatConfig(config);

    const allSeats: Seat[] = [];
    config.rows.forEach((row) => {
      row.seats.forEach((s) => {
        allSeats.push({
          id: s.id,
          row: s.row,
          position: s.position,
          status: occupied.includes(s.id)
            ? "occupied"
            : selectedSeats.includes(s.id)
              ? "selected"
              : "available",
        });
      });
    });

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
    setSeats([]);
    setSelectedSchedule(schedule);
    setStoreSchedule(schedule);
    setScheduleId(schedule.id);
    setTripDetails({
      departure: localDeparture,
      destination: localDestination,
      date: localDate,
      time: schedule.time,
      price: schedule.price,
    });
  };

  const handleDeselectSchedule = () => {
    setSelectedSchedule(null);
    setStoreSchedule(null);
    setScheduleId("");
    setSeats([]);
  };

  const displayConfig =
    seatConfig ?? buildFallbackConfig(selectedSchedule?.totalSeats ?? 16);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8 space-y-4 md:space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900">
            Réservation
          </h1>
          <p className="text-gray-400 text-xs md:text-sm mt-0.5">
            Sélectionnez votre trajet, horaire et sièges
          </p>
        </div>

        {/* 1. Formulaire trajet — compact, toujours visible */}
        <RouteStep
          departure={localDeparture}
          setDeparture={setLocalDeparture}
          destination={localDestination}
          setDestination={setLocalDestination}
          selectedDate={localDate}
          setSelectedDate={setLocalDate}
        />

        {/* 2+3. Horaires + Sièges en 2 colonnes */}
        {showSchedules && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">
            {/* Colonne gauche: Horaires */}
            <div className={`${selectedSchedule ? "lg:col-span-2" : "lg:col-span-5"}`}>
              <TimeStep
                departure={localDeparture}
                destination={localDestination}
                selectedDate={localDate}
                selectedSchedule={selectedSchedule as Schedule}
                setSelectedSchedule={handleSelectSchedule}
                schedules={schedules}
                isLoading={isLoadingSchedules}
              />
            </div>

            {/* Colonne droite: Sièges + Récap (sticky) */}
            {selectedSchedule && (
              <div id="seats-section" className="lg:col-span-3">
                <div className="lg:sticky lg:top-6 space-y-4 md:space-y-5">
                  <SeatsStep
                    seats={seats}
                    seatConfig={displayConfig}
                    handleSeatClick={handleSeatClick}
                    onBack={handleDeselectSchedule}
                  />
                  <Resume
                    departure={localDeparture}
                    destination={localDestination}
                    selectedDate={localDate}
                    selectedSchedule={selectedSchedule}
                    setCurrentStep={handleDeselectSchedule}
                    selectedSeats={selectedSeats}
                    handleSeatClick={handleSeatClick}
                    onOpenPayment={() => setShowPayment(true)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showPayment && scheduleId && (
        <PaymentModal
          scheduleId={scheduleId}
          seats={selectedSeats}
          totalPrice={
            selectedSeats.length * (selectedSchedule?.price || 0)
          }
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default Reservation;
