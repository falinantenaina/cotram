import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock,
  Hash,
  Layers,
  Loader,
  Phone,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { buildFallbackConfig, type SeatConfig } from "../../config/seatLayouts";
import api from "../../lib/axios";
import { seatTemplateApi, type SeatTemplate } from "../../api/seatTemplateApi";
import { SeatLayoutEditor } from "../admin/SeatLayoutEditor";
import type { Schedule } from "./ScheduleCard";

interface Route {
  id: string;
  departure: string;
  destination: string;
  price: number;
  duration: string;
}

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
}

const DRIVER_STATUS: Record<string, string> = {
  available: "Disponible",
  on_trip: "En voyage",
  off_duty: "Hors service",
  suspended: "Suspendu",
};

interface Props {
  schedule: Schedule | null;
  routes: Route[];
  drivers: Driver[];
  onClose: () => void;
  onSuccess: () => void;
}

function getDriverObj(
  driver: Driver | string | null | undefined,
): Driver | null {
  if (!driver || typeof driver === "string") return null;
  return driver;
}

export function ScheduleModal({
  schedule,
  routes,
  drivers,
  onClose,
  onSuccess,
}: Props) {
  const [activeTab, setActiveTab] = useState<"infos" | "seats">("infos");
  const [form, setForm] = useState({
    route: schedule?.route.id ?? "",
    date: schedule ? schedule.date.split("T")[0]! : "",
    time: schedule?.time ?? "",
    price: schedule?.price ?? 0,
    vehicleNumber: schedule?.vehicleNumber ?? "",
    driverId: getDriverObj(schedule?.driver)?.id ?? "",
    notes: schedule?.notes ?? "",
  });
  const [seatConfig, setSeatConfig] = useState<SeatConfig | null>(
    schedule?.seatConfig ?? buildFallbackConfig(schedule?.totalSeats ?? 16),
  );
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<SeatTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  useEffect(() => {
    seatTemplateApi.getAll().then(setTemplates);
  }, []);

  const mutation = useMutation({
    mutationFn: async () => {
      const selectedTpl = templates.find((t) => t.id === selectedTemplateId);
      const payload: any = {
        route: form.route,
        date: form.date,
        time: form.time,
        price: form.price,
        vehicle: "Crafter",
        vehicleNumber: form.vehicleNumber || null,
        driver: form.driverId || null,
        notes: form.notes || null,
        seatConfig: seatConfig ?? null,
        totalSeats: seatConfig?.totalSeats ?? 16,
      };
      if (!schedule) payload.availableSeats = seatConfig?.totalSeats ?? 16;
      if (schedule) return api.put(`/schedules/${schedule.id}`, payload);
      return api.post("/schedules", payload);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const selectedRoute = routes.find((r) => r.id === form.route);
  const selectedDriver = drivers.find((d) => d.id === form.driverId);
  const inp =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                {schedule ? "Modifier l'horaire" : "Nouvel horaire"}
              </p>
              <h2 className="text-lg font-black">
                {schedule
                  ? `${schedule.route.departure?.name} → ${schedule.route.destination?.name}`
                  : "Créer un voyage"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/10 p-1 rounded-xl w-fit">
            {(["infos", "seats"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === tab ? "bg-white text-gray-900" : "text-white/60 hover:text-white"}`}
              >
                {tab === "infos" ? (
                  "Informations"
                ) : (
                  <span className="flex items-center gap-1.5">
                    <Layers size={13} />
                    Plan des sièges
                    {seatConfig ? (
                      <span className="bg-primary text-black text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        {seatConfig.totalSeats}
                      </span>
                    ) : (
                      <span className="bg-white/20 text-white/60 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        —
                      </span>
                    )}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="flex gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              <AlertTriangle
                size={15}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {activeTab === "infos" && (
            <div className="space-y-4">
              {/* Route */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trajet
                </label>
                <select
                  value={form.route}
                  onChange={(e) => {
                    const r = routes.find((x) => x.id === e.target.value);
                    setForm({
                      ...form,
                      route: e.target.value,
                      price: r?.price ?? form.price,
                    });
                  }}
                  className={inp}
                >
                  <option value="">Sélectionner un trajet</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.departure?.name} → {r.destination?.name}
                    </option>
                  ))}
                </select>
                {selectedRoute && (
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                    <Clock size={10} /> {selectedRoute.duration} · Prix défaut :{" "}
                    {selectedRoute.price.toLocaleString()} Ar
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Heure
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    className={`${inp} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Prix (Ar/siège)
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    className={inp}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    Template sièges
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => {
                      const tpl = templates.find((t) => t.id === e.target.value);
                      if (tpl?.seatConfig) setSeatConfig(tpl.seatConfig);
                      setSelectedTemplateId(e.target.value);
                    }}
                    className={inp}
                  >
                    <option value="">— Sélectionner —</option>
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.seatConfig.totalSeats}p)
                      </option>
                    ))}
                  </select>
                  {seatConfig && (
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      ✓ {seatConfig.totalSeats} places
                    </p>
                  )}
                </div>
              </div>

              {/* Driver section */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Chauffeur & Véhicule
                </p>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Chauffeur (optionnel)
                  </label>
                  <select
                    value={form.driverId}
                    onChange={(e) => {
                      const d = drivers.find((x) => x.id === e.target.value);
                      setForm({
                        ...form,
                        driverId: e.target.value,
                        vehicleNumber: d?.vehicleNumber ?? form.vehicleNumber,
                      });
                    }}
                    className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  >
                    <option value="">— Aucun chauffeur —</option>
                    {drivers.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                        disabled={d.status === "suspended"}
                      >
                        {d.firstName} {d.lastName} ({d.vehicleType})
                        {d.status !== "available"
                          ? ` – ${DRIVER_STATUS[d.status]}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {selectedDriver && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <Phone size={10} /> {selectedDriver.phone}
                      <span className="text-gray-300">·</span>
                      <Hash size={10} /> {selectedDriver.vehicleNumber}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                    Immatriculation
                  </label>
                  <div className="relative">
                    <Hash
                      size={13}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      value={form.vehicleNumber}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          vehicleNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="ex: 1234 TA"
                      className="w-full border border-gray-200 rounded-xl py-2.5 pl-8 pr-3 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("seats")}
                className="w-full py-3 border-2 border-dashed border-primary/30 rounded-xl text-sm font-semibold text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <Layers size={15} />
                {seatConfig
                  ? `Plan configuré — ${seatConfig.totalSeats} places · Modifier →`
                  : "Configurer le plan des sièges →"}
              </button>
            </div>
          )}

          {activeTab === "seats" && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Choisir un template de sièges
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const tpl = templates.find((t) => t.id === e.target.value);
                    if (tpl?.seatConfig) setSeatConfig(tpl.seatConfig);
                    setSelectedTemplateId(e.target.value);
                  }}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="">— Sélectionner un template —</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.seatConfig.totalSeats} places)
                    </option>
                  ))}
                </select>
                {seatConfig && (
                  <p className="text-xs text-emerald-600 font-semibold mt-2">
                    ✓ {seatConfig.totalSeats} places configurées
                  </p>
                )}
              </div>
              <SeatLayoutEditor
                value={seatConfig ?? buildFallbackConfig(16)}
                onChange={setSeatConfig}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-gray-50 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={
              !form.route || !form.date || !form.time || mutation.isPending
            }
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-primary/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {mutation.isPending ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {schedule ? "Sauvegarder" : "Créer le voyage"}
          </button>
        </div>
      </div>
    </div>
  );
}
