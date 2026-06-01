import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import api from "../../lib/axios";

interface RecentReservation {
  id: string;
  bookingReference: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  user: { name: string; email: string };
  schedule: {
    time: string;
    date: string;
    route: { departure: string; destination: string };
  };
}

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: "Confirmé", cls: "bg-emerald-100 text-emerald-700" },
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-700" },
  cancelled: { label: "Annulé", cls: "bg-red-100 text-red-700" },
};

export function RecentReservations() {
  const { data } = useQuery<{ reservations: RecentReservation[] }>({
    queryKey: ["admin-recent-reservations"],
    queryFn: async () => {
      const { data } = await api.get("/admin/recent-reservations");
      return data;
    },
    refetchInterval: 30_000,
  });

  const reservations = (data?.reservations ?? []).filter(
    (r) => r.schedule != null && r.schedule.route != null,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-50 flex items-center gap-2">
        <Clock size={16} className="text-gray-400" />
        <h2 className="font-bold text-gray-900 text-sm sm:text-base">
          Réservations récentes
        </h2>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Aucune réservation
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {reservations.map((r) => {
            const s = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
            return (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 sm:px-6 py-3"
              >
                <div className="size-8 sm:size-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                  {r.user.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {r.user.name}
                    </p>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${s.cls}`}
                    >
                      {s.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">
                    {r.schedule.route.departure} →{" "}
                    {r.schedule.route.destination} ·{" "}
                    {new Date(r.schedule.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    à {r.schedule.time}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">
                    {r.totalPrice.toLocaleString()}
                    <span className="text-xs text-gray-400 font-normal">
                      {" "}
                      Ar
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(r.createdAt).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
