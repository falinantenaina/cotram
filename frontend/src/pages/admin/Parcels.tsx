import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  DollarSign,
  Edit,
  Filter,
  MapPin,
  Package,
  PackageCheck,
  Plus,
  Printer,
  RefreshCw,
  Search,
  SearchCheck,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useState } from "react";

import {
  ConfirmDeleteModal,
  EmptyState,
  LoadingSpinner,
  PageHeader,
  StatCard,
} from "../../components/common";
import { ParcelModal } from "../../components/parcels/ParcelModal";
import { ParcelPanel } from "../../components/parcels/ParcelPanel";
import { ParcelReceipt } from "../../components/parcels/ParcelReceipt";
import { PaymentModal } from "../../components/parcels/PaymentModal";
import api from "../../lib/axios";

export type ParcelStatus =
  | "registered"
  | "in_transit"
  | "arrived"
  | "ready_for_pickup"
  | "delivered"
  | "returned";

export const STATUS_CONFIG: Record<
  ParcelStatus,
  { label: string; cls: string; next?: ParcelStatus[] }
> = {
  registered: {
    label: "Enregistré",
    cls: "bg-gray-100 text-gray-700",
    next: ["in_transit", "returned"],
  },
  in_transit: {
    label: "En transit",
    cls: "bg-blue-100 text-blue-700",
    next: ["arrived", "returned"],
  },
  arrived: {
    label: "Arrivé",
    cls: "bg-amber-100 text-amber-700",
    next: ["ready_for_pickup", "returned"],
  },
  ready_for_pickup: {
    label: "Disponible au retrait",
    cls: "bg-purple-100 text-purple-700",
    next: ["delivered", "returned"],
  },
  delivered: {
    label: "Retiré",
    cls: "bg-emerald-100 text-emerald-700",
    next: [],
  },
  returned: {
    label: "Retourné",
    cls: "bg-red-100 text-red-700",
    next: [],
  },
};

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Non payé", cls: "bg-red-100 text-red-700" },
  partial: { label: "Partiel", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé", cls: "bg-emerald-100 text-emerald-700" },
};

export interface Parcel {
  id: string;
  trackingCode: string;
  retrievalCode: string;
  parcelType: string;
  description: string | null;
  note: string | null;
  weightKg: number | null;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
  transportFee: number;
  totalAmount: number;
  paidAmount: number;
  status: ParcelStatus;
  paymentStatus: "unpaid" | "partial" | "paid";
  departureDate: string;
  arrivalDate: string | null;
  storageFeePerDay: number;
  createdAt: string;
  departure?: { id: string; name: string };
  arrival?: { id: string; name: string };
  schedule?: any;
  createdBy?: { id: string; name: string };
  history?: {
    id: string;
    status: ParcelStatus;
    note: string | null;
    performedBy: string | null;
    createdAt: string;
  }[];
}

export default function AdminParcels() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [modalParcel, setModalParcel] = useState<Parcel | null | "new">(null);
  const [detailParcel, setDetailParcel] = useState<Parcel | null>(null);
  const [receiptParcel, setReceiptParcel] = useState<Parcel | null>(null);
  const [payTarget, setPayTarget] = useState<Parcel | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const {
    data: parcelsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-parcels", statusFilter, paymentFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (paymentFilter !== "all") params.paymentStatus = paymentFilter;
      const { data } = await api.get("/parcels", { params });
      return data as { parcels: Parcel[]; total: number };
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["parcel-stats"],
    queryFn: async () => {
      const { data } = await api.get("/parcels/stats");
      return data.stats;
    },
  });

  const parcels = (parcelsData?.parcels ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.trackingCode.toLowerCase().includes(q) ||
      p.retrievalCode.toLowerCase().includes(q) ||
      p.senderName.toLowerCase().includes(q) ||
      p.senderPhone.includes(q) ||
      p.recipientName.toLowerCase().includes(q) ||
      p.recipientPhone.includes(q)
    );
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-parcels"] });
    queryClient.invalidateQueries({ queryKey: ["parcel-stats"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ParcelStatus }) =>
      api.put(`/parcels/${id}/status`, { status }),
    onSuccess: refresh,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/parcels/${id}`),
    onSuccess: () => {
      refresh();
      setDeleteId(null);
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message ?? "Erreur lors de la suppression");
      setDeleteId(null);
    },
  });

  const handleStatusChange = (parcel: Parcel, next: ParcelStatus) => {
    statusMutation.mutate({ id: parcel.id, status: next });
  };

  const activeFilters =
    (statusFilter !== "all" ? 1 : 0) + (paymentFilter !== "all" ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Colis"
        subtitle={`${parcelsData?.total ?? 0} colis enregistré${(parcelsData?.total ?? 0) !== 1 ? "s" : ""}`}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="size-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              title="Rafraîchir"
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={() => setModalParcel("new")}
              className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90"
            >
              <Plus size={15} /> Nouveau colis
            </button>
          </>
        }
      />

      <div className="px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total colis"
            value={stats?.total ?? 0}
            icon={Package}
            accent="bg-primary/10 text-primary"
          />
          <StatCard
            label="En transit"
            value={stats?.in_transit ?? 0}
            icon={Truck}
            accent="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="Disponibles au retrait"
            value={stats?.ready_for_pickup ?? 0}
            icon={PackageCheck}
            accent="bg-purple-100 text-purple-700"
          />
          <StatCard
            label="Reste à encaisser"
            value={`${(stats?.outstanding ?? 0).toLocaleString()} Ar`}
            icon={DollarSign}
            accent="bg-red-100 text-red-700"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code de suivi, nom, téléphone…"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              showFilters || activeFilters > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 bg-white text-gray-600"
            }`}
          >
            <Filter size={14} /> Filtres
            {activeFilters > 0 && (
              <span className="size-5 bg-primary rounded-full text-black text-[10px] font-black flex items-center justify-center">
                {activeFilters}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Statut
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["all", ...Object.keys(STATUS_CONFIG)] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s as any)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        statusFilter === s
                          ? "border-primary bg-primary text-black"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {s === "all"
                        ? "Tous"
                        : STATUS_CONFIG[s as ParcelStatus].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Paiement
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["all", "unpaid", "partial", "paid"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setPaymentFilter(s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        paymentFilter === s
                          ? "border-primary bg-primary text-black"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {s === "all"
                        ? "Tous"
                        : PAYMENT_CONFIG[s]!.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPaymentFilter("all");
                }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner message="Chargement des colis…" />
        ) : parcels.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun colis trouvé"
            description="Enregistrez un premier colis pour commencer"
            action={
              <button
                onClick={() => setModalParcel("new")}
                className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
              >
                <Plus size={15} /> Nouveau colis
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      "Code de suivi",
                      "Trajet",
                      "Expéditeur",
                      "Destinataire",
                      "Montant",
                      "Statut",
                      "Paiement",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {parcels.map((p) => {
                    const st = STATUS_CONFIG[p.status];
                    const pay = PAYMENT_CONFIG[p.paymentStatus];
                    const remaining = p.totalAmount - p.paidAmount;
                    return (
                      <tr
                        key={p.id}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                        onClick={() => setDetailParcel(p)}
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <Package size={14} className="text-primary" />
                            </div>
                            <div>
                              <p className="font-mono font-bold text-gray-900 text-sm">
                                {p.trackingCode}
                              </p>
                              <p className="text-xs text-gray-400">
                                {p.parcelType}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-1">
                            <MapPin size={12} className="text-gray-400" />
                            {p.departure?.name} → {p.arrival?.name}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <p className="font-semibold text-gray-900">
                            {p.senderName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {p.senderPhone}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm">
                          <p className="font-semibold text-gray-900">
                            {p.recipientName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {p.recipientPhone}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-sm whitespace-nowrap">
                          <p className="font-bold text-gray-900">
                            {p.totalAmount.toLocaleString()} Ar
                          </p>
                          <p
                            className={`text-xs ${remaining > 0 ? "text-red-500" : "text-emerald-600"}`}
                          >
                            {remaining > 0
                              ? `Reste ${remaining.toLocaleString()} Ar`
                              : "Soldé"}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}
                            >
                              {st.label}
                            </span>
                            {st.next && st.next.length > 0 && (
                              <div className="flex gap-1">
                                {st.next.map((n) => (
                                  <button
                                    key={n}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(p, n);
                                    }}
                                    className="text-[10px] font-bold text-primary hover:underline"
                                  >
                                    → {STATUS_CONFIG[n].label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pay.cls}`}
                          >
                            {pay.label}
                          </span>
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => setReceiptParcel(p)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Imprimer le bordereau"
                            >
                              <Printer size={15} />
                            </button>
                            {p.paymentStatus !== "paid" && (
                              <button
                                onClick={() => setPayTarget(p)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Encaisser un paiement"
                              >
                                <Banknote size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => setModalParcel(p)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit size={15} />
                            </button>
                            {p.status === "registered" && (
                              <button
                                onClick={() => setDeleteId(p.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden grid grid-cols-1 gap-3">
              {parcels.map((p) => {
                const st = STATUS_CONFIG[p.status];
                const pay = PAYMENT_CONFIG[p.paymentStatus];
                const remaining = p.totalAmount - p.paidAmount;
                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm cursor-pointer"
                    onClick={() => setDetailParcel(p)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Package size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-mono font-black text-gray-900 text-sm">
                            {p.trackingCode}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {p.departure?.name} → {p.arrival?.name}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}
                      >
                        {st.label}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="text-gray-400">Dest:</span>{" "}
                        <strong>{p.recipientName}</strong> · {p.recipientPhone}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900">
                          {p.totalAmount.toLocaleString()} Ar
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pay.cls}`}
                        >
                          {pay.label}
                        </span>
                      </div>
                      {remaining > 0 && (
                        <p className="text-xs text-red-500">
                          Reste {remaining.toLocaleString()} Ar
                        </p>
                      )}
                    </div>
                    <div
                      className="flex gap-2 mt-3 pt-3 border-t border-gray-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setReceiptParcel(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200"
                      >
                        <Printer size={13} /> Bordereau
                      </button>
                      {p.paymentStatus !== "paid" && (
                        <button
                          onClick={() => setPayTarget(p)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200"
                        >
                          <Banknote size={13} /> Paiement
                        </button>
                      )}
                      <button
                        onClick={() => setModalParcel(p)}
                        className="flex items-center justify-center py-2 px-3 rounded-xl bg-gray-50 text-gray-600 text-xs font-bold border border-gray-200"
                      >
                        <Edit size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {modalParcel !== null && (
        <ParcelModal
          parcel={modalParcel === "new" ? null : modalParcel}
          onClose={() => setModalParcel(null)}
          onSuccess={refresh}
        />
      )}
      {detailParcel && !modalParcel && (
        <ParcelPanel
          parcel={detailParcel}
          onClose={() => setDetailParcel(null)}
          onEdit={() => {
            setModalParcel(detailParcel);
            setDetailParcel(null);
          }}
          onReceipt={(p) => {
            setReceiptParcel(p);
            setDetailParcel(null);
          }}
          onPay={(p) => {
            setPayTarget(p);
            setDetailParcel(null);
          }}
          onStatusChange={(p, s) => handleStatusChange(p, s)}
        />
      )}
      {receiptParcel && (
        <ParcelReceipt
          parcel={receiptParcel}
          onClose={() => setReceiptParcel(null)}
        />
      )}
      {payTarget && (
        <PaymentModal
          parcel={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={refresh}
        />
      )}
      {deleteId && (
        <ConfirmDeleteModal
          title="Supprimer ce colis ?"
          description="Seul un colis enregistré (non encore expédié) peut être supprimé."
          icon={Trash2}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onClose={() => setDeleteId(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
