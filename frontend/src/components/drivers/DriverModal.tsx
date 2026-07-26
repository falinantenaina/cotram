import { useMutation } from "@tanstack/react-query";
import { Check, Hash, Loader, Phone, Shield, User, X } from "lucide-react";
import { useState } from "react";
import api from "../../lib/axios";
import { ErrorAlert } from "../common";
import type { Driver } from "./DriverCard";
import { STATUS_CONFIG } from "./DriverCard";

const VEHICLES = ["Crafter", "Sprinter", "Transit"];
const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  licenseNumber: "",
  vehicleNumber: "",
  vehicleType: "Crafter",
  status: "available" as Driver["status"],
  notes: "",
};

interface Props {
  driver: Driver | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DriverModal({ driver, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<typeof EMPTY_FORM>(
    driver
      ? {
          firstName: driver.firstName,
          lastName: driver.lastName,
          phone: driver.phone,
          licenseNumber: driver.licenseNumber,
          vehicleNumber: driver.vehicleNumber,
          vehicleType: driver.vehicleType,
          status: driver.status,
          notes: driver.notes ?? "",
        }
      : { ...EMPTY_FORM },
  );
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      if (driver) return api.put(`/drivers/${driver.id}`, form);
      return api.post("/drivers", form);
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: any) => setError(err?.response?.data?.message ?? "Erreur"),
  });

  const set =
    (k: keyof typeof EMPTY_FORM) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const inp =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  const canSubmit =
    form.firstName &&
    form.lastName &&
    form.phone &&
    form.licenseNumber &&
    form.vehicleNumber;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gray-900 text-white px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <User size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-white/40 text-xs font-semibold uppercase tracking-widest">
                  {driver ? "Modifier le chauffeur" : "Nouveau chauffeur"}
                </p>
                <h2 className="font-black text-lg leading-tight">
                  {driver
                    ? `${driver.firstName} ${driver.lastName}`
                    : "Créer un profil"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-4">
          {error && <ErrorAlert message={error} />}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Prénom
              </label>
              <input
                value={form.firstName}
                onChange={set("firstName")}
                placeholder="Jean"
                className={inp}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Nom
              </label>
              <input
                value={form.lastName}
                onChange={set("lastName")}
                placeholder="Rakoto"
                className={inp}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Téléphone
            </label>
            <div className="relative">
              <Phone
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.phone}
                onChange={set("phone")}
                placeholder="+261 34 00 000 00"
                className={`${inp} pl-9`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Numéro de permis
            </label>
            <div className="relative">
              <Shield
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={form.licenseNumber}
                onChange={set("licenseNumber")}
                placeholder="MDG-2024-00001"
                className={`${inp} pl-9 font-mono`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Immatriculation
              </label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={form.vehicleNumber}
                  onChange={set("vehicleNumber")}
                  placeholder="1234 TA"
                  className={`${inp} pl-9 font-mono uppercase`}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Type véhicule
              </label>
              <select
                value={form.vehicleType}
                onChange={set("vehicleType")}
                className={`${inp} bg-white`}
              >
                {VEHICLES.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (edit only) */}
          {driver && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Statut
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(STATUS_CONFIG) as Driver["status"][]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, status: s }))}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${form.status === s ? "border-primary bg-primary text-black" : `border-gray-200 ${STATUS_CONFIG[s].badge}`}`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Notes (optionnel)
            </label>
            <textarea
              value={form.notes}
              onChange={set("notes")}
              rows={2}
              placeholder="Remarques…"
              className={`${inp} resize-none`}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 shrink-0 border-t border-gray-50 pt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!canSubmit || mutation.isPending}
            className="flex-1 py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {driver ? "Sauvegarder" : "Créer le chauffeur"}
          </button>
        </div>
      </div>
    </div>
  );
}
