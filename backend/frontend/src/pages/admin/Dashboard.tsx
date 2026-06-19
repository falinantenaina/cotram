import { useState } from "react";
import { DashboardStats } from "../../components/dashboard/DashboardStats";
import { RecentReservations } from "../../components/dashboard/RecentReservations";
import {
  TodaySchedules,
  type TodaySchedule,
} from "../../components/dashboard/TodaySchedules";
import { PassengerModal } from "../../components/schedules/PassengerModal";

export default function Dashboard() {
  const [selectedSchedule, setSelectedSchedule] =
    useState<TodaySchedule | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">
            Tableau de bord
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <DashboardStats />
        <TodaySchedules onSelectSchedule={setSelectedSchedule} />
        <RecentReservations />
      </div>

      {selectedSchedule && (
        <PassengerModal
          schedule={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  );
}
