import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  Smartphone,
  Ticket,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LoadingSpinner, StatCard } from "../components/common";
import { Container } from "../components/ui/Container";
import api from "../lib/axios";
import { useAuth } from "../hooks/useAuth";

interface HistoryPayment {
  id: string;
  phone: string;
  amount: number;
  method: string;
  status: "pending" | "completed" | "failed";
  seats: number[];
  mvolaTransactionRef?: string | null;
  serverCorrelationId?: string | null;
  createdAt: string;
  reservation?: { id: string; bookingReference: string } | null;
  schedule?: {
    id: string;
    date: string;
    time: string;
    route?: {
      departure?: { name: string };
      destination?: { name: string };
    };
  } | null;
}

const STATUS_CFG = {
  completed: {
    label: "Réussi",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: CheckCircle2,
  },
  failed: {
    label: "Échoué",
    className: "bg-red-50 text-red-600 border border-red-200",
    icon: XCircle,
  },
  pending: {
    label: "En attente",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: Clock,
  },
};

const METHOD_LABEL: Record<string, string> = {
  mvola: "MVola",
  orange_money: "Orange Money",
};

const FILTERS = [
  ["all", "Tous"],
  ["completed", "Réussis"],
  ["failed", "Échoués"],
  ["pending", "En attente"],
] as const;

const PaymentHistory = () => {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["payment-history", statusFilter, methodFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (methodFilter !== "all") params.set("method", methodFilter);
      const { data } = await api.get(`/payments/history?${params}`);
      return data as {
        payments: HistoryPayment[];
        total: number;
        stats: {
          completed: { count: number; totalAmount: number };
          failed: { count: number; totalAmount: number };
          pending: { count: number; totalAmount: number };
        };
      };
    },
    enabled: !!user,
  });

  if (!user) return <Navigate to="/auth" replace />;

  const payments = data?.payments ?? [];
  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <Container className="py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              Historique des paiements
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Vos paiements MVola et Orange Money
            </p>
          </div>
          <Link
            to="/reservation"
            className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
          >
            <Ticket size={15} />
            Nouvelle réservation
          </Link>
        </Container>
      </div>

      <Container className="py-8">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatCard
                label="Paiements réussis"
                value={stats.completed.count.toLocaleString()}
                icon={CheckCircle2}
                accent="bg-emerald-100 text-emerald-700"
                color="text-emerald-600"
                sub={`${stats.completed.totalAmount.toLocaleString()} Ar`}
              />
              <StatCard
                label="Échoués"
                value={stats.failed.count.toLocaleString()}
                icon={XCircle}
                accent="bg-red-100 text-red-600"
                color="text-red-600"
                sub={`${stats.failed.totalAmount.toLocaleString()} Ar`}
              />
              <StatCard
                label="En attente"
                value={stats.pending.count.toLocaleString()}
                icon={Clock}
                accent="bg-amber-100 text-amber-700"
                color="text-amber-600"
              />
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
            <div className="flex flex-wrap gap-2 flex-1">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-all ${
                    statusFilter === key
                      ? "border-primary bg-primary text-black"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="all">Toutes les méthodes</option>
              <option value="mvola">MVola</option>
              <option value="orange_money">Orange Money</option>
            </select>
          </div>

          {/* List */}
          {isLoading ? (
            <LoadingSpinner message="Chargement de vos paiements..." />
          ) : payments.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
              <div className="size-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <CreditCard size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">
                Aucun paiement
              </h3>
              <p className="text-gray-400 text-sm mb-6">
                Vous n'avez pas encore effectué de paiement MVola ou Orange
                Money.
              </p>
              <Link
                to="/reservation"
                className="inline-flex items-center gap-2 bg-primary text-black font-bold px-6 py-3 rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                Réserver maintenant
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => {
                const status =
                  STATUS_CFG[p.status] ?? STATUS_CFG.pending;
                const StatusIcon = status.icon;
                const seats = Array.isArray(p.seats)
                  ? p.seats.filter((n): n is number => typeof n === "number")
                  : [];
                const created = new Date(p.createdAt);
                const route = p.schedule?.route;

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-10 rounded-xl flex items-center justify-center ${
                            p.method === "mvola"
                              ? "bg-red-50"
                              : "bg-orange-50"
                          }`}
                        >
                          <Smartphone
                            size={16}
                            className={
                              p.method === "mvola"
                                ? "text-red-600"
                                : "text-orange-600"
                            }
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {METHOD_LABEL[p.method] ?? p.method}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">
                            {p.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${status.className}`}
                        >
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                        <span className="font-black text-gray-900">
                          {p.amount.toLocaleString()} Ar
                        </span>
                      </div>
                    </div>

                    <div className="px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-start gap-2.5">
                        <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Calendar size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Date
                          </p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {created.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock size={11} />
                            {created.toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <MapPin size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Trajet
                          </p>
                          {route ? (
                            <>
                              <p className="font-semibold text-gray-900 text-sm">
                                {route.departure?.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                → {route.destination?.name}
                              </p>
                            </>
                          ) : (
                            <span className="text-xs text-gray-300 italic">
                              Non lié
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="size-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Ticket size={14} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            Siège(s)
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {seats.length ? (
                              seats.map((s) => (
                                <span
                                  key={s}
                                  className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-lg"
                                >
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-300 italic">
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {p.reservation && (
                      <div className="px-6 py-3 border-t border-gray-50 bg-emerald-50/40 flex items-center justify-between">
                        <p className="text-xs text-emerald-700 font-semibold">
                          Réservation{" "}
                          <span className="font-mono">
                            {p.reservation.bookingReference}
                          </span>
                        </p>
                        <Link
                          to={`/reservation/${p.reservation.id}/boarding-pass`}
                          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                        >
                          Voir le billet
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    )}

                    {p.status === "failed" && (
                      <div className="px-6 py-3 border-t border-red-50 bg-red-50/40">
                        <p className="text-xs text-red-600">
                          Paiement échoué — aucune réservation n'a été créée
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default PaymentHistory;
