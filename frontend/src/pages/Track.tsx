import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios";

interface TrackParcel {
  id: string;
  trackingCode: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  paidAmount: number;
  departureDate: string;
  arrivalDate: string | null;
  recipientName: string;
  parcelType: string;
  departure: { name: string };
  arrival: { name: string };
  schedule: {
    date: string;
    time: string;
    vehicleNumber?: string | null;
    driver?: { firstName: string; lastName: string } | null;
  } | null;
  history: { id: string; status: string; note: string | null; createdAt: string }[];
}

const STATUS_STEPS = [
  { key: "registered", label: "Enregistré", icon: Package },
  { key: "in_transit", label: "En transit", icon: Truck },
  { key: "arrived", label: "Arrivé", icon: MapPin },
  { key: "ready_for_pickup", label: "Disponible", icon: Package },
  { key: "delivered", label: "Retiré", icon: Package },
];

const STATUS_ORDER: Record<string, number> = {
  registered: 0,
  in_transit: 1,
  arrived: 2,
  ready_for_pickup: 3,
  delivered: 4,
  returned: -1,
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  registered: { label: "Enregistré", cls: "bg-gray-100 text-gray-700" },
  in_transit: { label: "En transit", cls: "bg-blue-100 text-blue-700" },
  arrived: { label: "Arrivé", cls: "bg-amber-100 text-amber-700" },
  ready_for_pickup: { label: "Disponible au retrait", cls: "bg-purple-100 text-purple-700" },
  delivered: { label: "Retiré", cls: "bg-emerald-100 text-emerald-700" },
  returned: { label: "Retourné", cls: "bg-red-100 text-red-700" },
};

const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Non payé",
  partial: "Partiellement payé",
  paid: "Payé",
};

export default function Track() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["track-parcel", searched],
    queryFn: async () => {
      const { data } = await api.get(`/parcels/track/${searched}`);
      return data.parcel as TrackParcel;
    },
    enabled: !!searched,
    retry: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) setSearched(c);
  };

  const currentStep = data ? (STATUS_ORDER[data.status] ?? 0) : -1;
  const isReturned = data?.status === "returned";
  const statusInfo = data ? STATUS_LABELS[data.status] : null;
  const remaining = data ? data.totalAmount - data.paidAmount : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
          <Link
            to="/"
            className="size-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-black text-gray-900">
              Suivi de colis
            </h1>
            <p className="text-gray-400 text-xs">
              Entrez votre numéro de suivi pour connaître l'état de votre colis
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Numéro de suivi (ex: YTOQGRHSR2L4EC)"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={!code.trim() || isLoading}
            className="px-5 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "Recherche…" : "Suivre"}
          </button>
        </form>

        {isError && searched && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {(error as any)?.response?.data?.message ??
              "Colis introuvable. Vérifiez le numéro de suivi."}
          </div>
        )}

        {data && statusInfo && (
          <div className="space-y-5">
            {/* Header card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Numéro de suivi
                  </p>
                  <p className="font-mono font-black text-xl text-gray-900 mt-0.5">
                    {data.trackingCode}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {data.parcelType} · Pour {data.recipientName}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusInfo.cls}`}
                >
                  {statusInfo.label}
                </span>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="font-bold text-gray-900">
                  {data.departure.name} → {data.arrival.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Départ le{" "}
                  {new Date(data.departureDate).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {data.schedule ? ` à ${data.schedule.time}` : ""}
                </p>
                {data.arrivalDate && (
                  <p className="text-sm text-gray-500">
                    Arrivée le{" "}
                    {new Date(data.arrivalDate).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {data.schedule?.vehicleNumber && (
                  <p className="text-sm text-gray-500">
                    Bus N° {data.schedule.vehicleNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Progress */}
            {!isReturned && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Progression
                </p>
                <div className="flex items-center justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const done = i < currentStep;
                    const active = i === currentStep;
                    const Icon = step.icon;
                    return (
                      <div
                        key={step.key}
                        className="flex flex-col items-center gap-1.5 flex-1"
                      >
                        <div
                          className={`size-9 rounded-full flex items-center justify-center border-2 ${
                            done
                              ? "bg-primary border-primary"
                              : active
                                ? "bg-primary/20 border-primary"
                                : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <Icon
                            size={15}
                            className={done || active ? "text-black" : "text-gray-400"}
                          />
                        </div>
                        <span
                          className={`text-[10px] font-bold text-center leading-tight ${
                            active ? "text-primary" : done ? "text-gray-700" : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isReturned && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-semibold">
                Ce colis a été retourné à l'expéditeur. Contactez le guichet
                Cotram pour plus d'informations.
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Paiement
              </p>
              <div className="text-sm space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold">
                    {data.totalAmount.toLocaleString()} Ar
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payé</span>
                  <span className="font-semibold text-emerald-600">
                    {data.paidAmount.toLocaleString()} Ar
                  </span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-gray-50">
                  <span className="text-gray-500 font-bold">Reste</span>
                  <span
                    className={`font-black ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}
                  >
                    {remaining.toLocaleString()} Ar
                  </span>
                </div>
                <p className="text-xs text-gray-400 pt-1">
                  Statut : {PAYMENT_LABELS[data.paymentStatus] ?? data.paymentStatus}
                </p>
              </div>
            </div>

            {/* History */}
            {data.history.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  Historique
                </p>
                <div className="space-y-3">
                  {data.history.map((h) => (
                    <div key={h.id} className="flex gap-3">
                      <div className="size-2 bg-primary rounded-full mt-2 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {STATUS_LABELS[h.status]?.label ?? h.status}
                        </p>
                        {h.note && (
                          <p className="text-xs text-gray-500 mt-0.5">{h.note}</p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {new Date(h.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">
              Une question ? Contactez le guichet Cotram avec votre numéro de
              suivi.
            </p>
          </div>
        )}

        {!data && !isLoading && !isError && (
          <div className="text-center py-10 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Entrez un numéro de suivi pour afficher les détails du colis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
