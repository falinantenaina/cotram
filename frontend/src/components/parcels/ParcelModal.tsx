import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader, MapPin, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../lib/axios";
import { isValidPhone, normalizePhone } from "../../lib/phone";

interface City {
  id: string;
  name: string;
}

interface ScheduleOption {
  id: string;
  date: string;
  time: string;
  vehicleNumber?: string | null;
  route: {
    departure: { name: string };
    destination: { name: string };
  };
  driver?: {
    firstName: string;
    lastName: string;
    vehicleNumber: string;
  } | null;
}

export interface ParcelForm {
  parcelType: string;
  description: string;
  note: string;
  weightKg: string;
  departureCityId: string;
  arrivalCityId: string;
  scheduleId: string;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  transportFee: string;
  totalAmount: string;
  paidAmount: string;
  departureDate: string;
}

const EMPTY_FORM: ParcelForm = {
  parcelType: "Colis standard",
  description: "",
  note: "",
  weightKg: "",
  departureCityId: "",
  arrivalCityId: "",
  scheduleId: "",
  senderName: "",
  senderPhone: "",
  recipientName: "",
  recipientPhone: "",
  transportFee: "",
  totalAmount: "",
  paidAmount: "0",
  departureDate: new Date().toISOString().split("T")[0]!,
};

const PARCEL_TYPES = [
  "Colis standard",
  "Documents",
  "Fragile",
  "Périssable",
  "Volumineux",
  "Autre",
];

export function ParcelModal({
  parcel,
  onClose,
  onSuccess,
}: {
  parcel: {
    id: string;
    parcelType: string;
    description: string | null;
    note: string | null;
    weightKg: number | null;
    departure?: { id: string };
    arrival?: { id: string };
    schedule?: { id: string } | null;
    senderName: string;
    senderPhone: string;
    recipientName: string;
    recipientPhone: string;
    transportFee: number;
    totalAmount: number;
    paidAmount: number;
    departureDate: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ParcelForm>(
    parcel
      ? {
          parcelType: parcel.parcelType,
          description: parcel.description ?? "",
          note: parcel.note ?? "",
          weightKg: parcel.weightKg != null ? String(parcel.weightKg) : "",
          departureCityId: parcel.departure?.id ?? "",
          arrivalCityId: parcel.arrival?.id ?? "",
          scheduleId: parcel.schedule?.id ?? "",
          senderName: parcel.senderName,
          senderPhone: parcel.senderPhone,
          recipientName: parcel.recipientName,
          recipientPhone: parcel.recipientPhone,
          transportFee: String(parcel.transportFee),
          totalAmount: String(parcel.totalAmount),
          paidAmount: String(parcel.paidAmount),
          departureDate: new Date(parcel.departureDate)
            .toISOString()
            .split("T")[0]!,
        }
      : { ...EMPTY_FORM },
  );
  const [error, setError] = useState("");
  const [showSchedule, setShowSchedule] = useState(!!parcel?.schedule?.id);

  const { data: citiesData } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const { data } = await api.get("/cities");
      return data.cities as City[];
    },
  });

  const { data: schedulesData, isLoading: loadingSchedules } = useQuery({
    queryKey: [
      "parcel-schedules",
      form.departureCityId,
      form.arrivalCityId,
      form.departureDate,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (form.departureCityId) params.departureCityId = form.departureCityId;
      if (form.arrivalCityId) params.arrivalCityId = form.arrivalCityId;
      if (form.departureDate) params.date = form.departureDate;
      const { data } = await api.get("/parcels/schedules", { params });
      return data.schedules as ScheduleOption[];
    },
    enabled: showSchedule && !!form.departureDate,
  });

  const cities = citiesData ?? [];

  useEffect(() => {
    // Auto-fill transport fee from route price when cities selected
    if (!form.departureCityId || !form.arrivalCityId) return;
    if (parcel) return;
    // leave empty; agent sets manually
  }, [form.departureCityId, form.arrivalCityId, parcel]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        parcelType: form.parcelType,
        description: form.description || null,
        note: form.note || null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        departureCityId: form.departureCityId,
        arrivalCityId: form.arrivalCityId,
        scheduleId: showSchedule && form.scheduleId ? form.scheduleId : null,
        senderName: form.senderName,
        senderPhone: normalizePhone(form.senderPhone),
        recipientName: form.recipientName,
        recipientPhone: normalizePhone(form.recipientPhone),
        transportFee: Number(form.transportFee || 0),
        totalAmount: Number(form.totalAmount || 0),
        departureDate: form.departureDate,
      };
      if (!parcel) {
        payload.paidAmount = Number(form.paidAmount || 0);
      }
      if (parcel) {
        return api.put(`/parcels/${parcel.id}`, payload);
      }
      return api.post("/parcels", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-parcels"] });
      queryClient.invalidateQueries({ queryKey: ["parcel-stats"] });
      onSuccess();
      onClose();
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message ?? "Erreur lors de l'enregistrement"),
  });

  const inp =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";
  const lbl = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5";

  const canSubmit =
    form.departureCityId &&
    form.arrivalCityId &&
    form.departureCityId !== form.arrivalCityId &&
    form.senderName.trim() &&
    isValidPhone(form.senderPhone) &&
    form.recipientName.trim() &&
    isValidPhone(form.recipientPhone) &&
    form.totalAmount &&
    Number(form.totalAmount) >= 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-4">
        <div className="bg-gray-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                {parcel ? "Modifier le colis" : "Nouveau colis"}
              </p>
              <h2 className="text-lg font-black">
                {parcel
                  ? "Modifier le colis"
                  : "Enregistrer un colis"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-start gap-2">
              <span>{error}</span>
            </div>
          )}

          {/* Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Type de colis *</label>
              <select
                value={form.parcelType}
                onChange={(e) => setForm({ ...form, parcelType: e.target.value })}
                className={inp}
              >
                {PARCEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lbl}>Poids (kg)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
                placeholder="ex: 5.5"
                className={inp}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Description</label>
              <input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="ex: Boîte carton, vêtements…"
                className={inp}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={lbl}>Note</label>
              <input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="ex: Fragile, ne pas retourner…"
                className={inp}
              />
            </div>
          </div>

          {/* Route */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <MapPin size={13} /> Trajet
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Départ *</label>
                <select
                  value={form.departureCityId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      departureCityId: e.target.value,
                      scheduleId: "",
                    })
                  }
                  className={inp}
                >
                  <option value="">— Choisir —</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Arrivée *</label>
                <select
                  value={form.arrivalCityId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      arrivalCityId: e.target.value,
                      scheduleId: "",
                    })
                  }
                  className={inp}
                >
                  <option value="">— Choisir —</option>
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={lbl}>Date d'expédition *</label>
                <input
                  type="date"
                  value={form.departureDate}
                  onChange={(e) =>
                    setForm({ ...form, departureDate: e.target.value })
                  }
                  className={inp}
                />
              </div>
            </div>
            {form.departureCityId &&
              form.arrivalCityId &&
              form.departureCityId === form.arrivalCityId && (
                <p className="text-xs text-red-500 font-semibold">
                  La ville de départ et d'arrivée doivent être différentes
                </p>
              )}

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSchedule}
                  onChange={(e) => {
                    setShowSchedule(e.target.checked);
                    if (!e.target.checked)
                      setForm({ ...form, scheduleId: "" });
                  }}
                  className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Truck size={14} /> Lier à un horaire de bus
              </label>
              {showSchedule && (
                <div className="mt-2">
                  {loadingSchedules ? (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Loader size={10} className="animate-spin" /> Chargement
                      des horaires…
                    </p>
                  ) : schedulesData && schedulesData.length > 0 ? (
                    <select
                      value={form.scheduleId}
                      onChange={(e) =>
                        setForm({ ...form, scheduleId: e.target.value })
                      }
                      className={inp}
                    >
                      <option value="">— Choisir un horaire —</option>
                      {schedulesData.map((s) => (
                        <option key={s.id} value={s.id}>
                          {new Date(s.date).toLocaleDateString("fr-FR")}{" "}
                          {s.time} — {s.route.departure.name} →{" "}
                          {s.route.destination.name}
                          {s.vehicleNumber ? ` (${s.vehicleNumber})` : ""}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <CalendarDays size={11} /> Aucun horaire disponible pour
                      ce trajet / date
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Expéditeur *
              </p>
              <input
                value={form.senderName}
                onChange={(e) =>
                  setForm({ ...form, senderName: e.target.value })
                }
                placeholder="Nom complet"
                className={inp}
              />
              <input
                value={form.senderPhone}
                onChange={(e) =>
                  setForm({ ...form, senderPhone: e.target.value })
                }
                placeholder="034 00 000 00"
                className={inp}
              />
              {form.senderPhone && !isValidPhone(form.senderPhone) && (
                <p className="text-xs text-red-500">Numéro de téléphone invalide (format : 03XXXXXXXX)</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Destinataire *
              </p>
              <input
                value={form.recipientName}
                onChange={(e) =>
                  setForm({ ...form, recipientName: e.target.value })
                }
                placeholder="Nom complet"
                className={inp}
              />
              <input
                value={form.recipientPhone}
                onChange={(e) =>
                  setForm({ ...form, recipientPhone: e.target.value })
                }
                placeholder="034 00 000 00"
                className={inp}
              />
              {form.recipientPhone && !isValidPhone(form.recipientPhone) && (
                <p className="text-xs text-red-500">Numéro de téléphone invalide (format : 03XXXXXXXX)</p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <Truck size={13} /> Paiement
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={lbl}>Frais de transport (Ar) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.transportFee}
                  onChange={(e) => {
                    const fee = e.target.value;
                    setForm((f) => ({
                      ...f,
                      transportFee: fee,
                      // Default total = fee when total not manually changed yet
                      totalAmount: f.totalAmount || fee,
                    }));
                  }}
                  placeholder="0"
                  className={inp}
                />
              </div>
              <div>
                <label className={lbl}>Total à payer (Ar) *</label>
                <input
                  type="number"
                  min="0"
                  value={form.totalAmount}
                  onChange={(e) =>
                    setForm({ ...form, totalAmount: e.target.value })
                  }
                  placeholder="0"
                  className={inp}
                />
              </div>
              {!parcel && (
                <div>
                  <label className={lbl}>Montant payé (Ar)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.paidAmount}
                    onChange={(e) =>
                      setForm({ ...form, paidAmount: e.target.value })
                    }
                    placeholder="0"
                    className={inp}
                  />
                </div>
              )}
            </div>
            {!parcel &&
              Number(form.totalAmount) > 0 &&
              Number(form.paidAmount || 0) > 0 && (
                <p className="text-xs text-gray-500">
                  Reste à payer :{" "}
                  <strong>
                    {Math.max(
                      0,
                      Number(form.totalAmount) - Number(form.paidAmount || 0),
                    ).toLocaleString()}{" "}
                    Ar
                  </strong>
                </p>
              )}
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && (
              <Loader size={14} className="animate-spin" />
            )}
            {parcel ? "Sauvegarder" : "Créer le colis"}
          </button>
        </div>
      </div>
    </div>
  );
}
