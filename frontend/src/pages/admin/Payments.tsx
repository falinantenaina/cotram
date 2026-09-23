import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Download,
  Search,
  Smartphone,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  EmptyState,
  LoadingSpinner,
  PageHeader,
  StatCard,
} from "../../components/common";
import api from "../../lib/axios";

interface AdminPayment {
  id: string;
  phone: string;
  amount: number;
  method: string;
  status: string;
  seats: number[];
  mvolaTransactionRef?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string; phone?: string | null };
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

interface Stats {
  totalPayments: number;
  totalAmount: number;
  mvola: { count: number; totalAmount: number };
  orangeMoney: { count: number; totalAmount: number };
}

const PAGE_SIZE = 25;

const METHOD_LABEL: Record<string, string> = {
  mvola: "MVola",
  orange_money: "Orange Money",
};

function exportCSV(payments: AdminPayment[]) {
  const rows = [
    [
      "Date",
      "Heure",
      "Client",
      "Téléphone",
      "Méthode",
      "Montant Ar",
      "Sièges",
      "Trajet",
      "Référence",
      "Réf. transaction",
    ],
    ...payments.map((p) => {
      const d = new Date(p.createdAt);
      const seats = Array.isArray(p.seats)
        ? p.seats.filter((n): n is number => typeof n === "number")
        : [];
      return [
        d.toLocaleDateString("fr-FR"),
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        p.user?.name ?? "",
        p.phone,
        METHOD_LABEL[p.method] ?? p.method,
        String(p.amount),
        seats.join(", "),
        p.schedule?.route?.departure?.name
          ? `${p.schedule.route.departure.name} → ${p.schedule.route.destination?.name}`
          : "",
        p.reservation?.bookingReference ?? "",
        p.mvolaTransactionRef ?? "",
      ];
    }),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `paiements-succes-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminPayments() {
  const [page, setPage] = useState(1);
  const [methodFilter, setMethodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-payments", page, methodFilter, appliedSearch, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (methodFilter !== "all") params.set("method", methodFilter);
      if (appliedSearch) params.set("search", appliedSearch);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const { data } = await api.get(`/payments/admin/history?${params}`);
      return data as {
        payments: AdminPayment[];
        total: number;
        page: number;
        pages: number;
        stats: Stats;
      };
    },
    placeholderData: (prev) => prev,
  });

  const payments = data?.payments ?? [];
  const stats = data?.stats;
  const pages = data?.pages ?? 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Historique des paiements"
        subtitle="Paiements mobile money réussis (MVola & Orange Money)"
        actions={
          <button
            onClick={() => exportCSV(payments)}
            disabled={!payments.length}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            Exporter CSV
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Total encaissé"
              value={`${Math.round((stats.totalAmount || 0) / 1000).toLocaleString()}k Ar`}
              icon={TrendingUp}
              accent="bg-primary/10 text-primary"
              color="text-primary"
              sub={`${stats.totalPayments.toLocaleString()} paiements`}
            />
            <StatCard
              label="MVola"
              value={`${Math.round((stats.mvola.totalAmount || 0) / 1000).toLocaleString()}k Ar`}
              icon={Smartphone}
              accent="bg-red-100 text-red-600"
              color="text-red-600"
              sub={`${stats.mvola.count.toLocaleString()} transactions`}
            />
            <StatCard
              label="Orange Money"
              value={`${Math.round((stats.orangeMoney.totalAmount || 0) / 1000).toLocaleString()}k Ar`}
              icon={Smartphone}
              accent="bg-orange-100 text-orange-600"
              color="text-orange-600"
              sub={`${stats.orangeMoney.count.toLocaleString()} transactions`}
            />
            <StatCard
              label="Succès"
              value={stats.totalPayments.toLocaleString()}
              icon={CheckCircle2}
              accent="bg-emerald-100 text-emerald-700"
              color="text-emerald-600"
              sub="Paiements confirmés"
            />
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setAppliedSearch(search.trim());
                  setPage(1);
                }
              }}
              placeholder="Client, téléphone, référence…"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setAppliedSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
          >
            <option value="all">Toutes les méthodes</option>
            <option value="mvola">MVola</option>
            <option value="orange_money">Orange Money</option>
          </select>

          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="border border-gray-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="border border-gray-200 rounded-xl py-2.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {isLoading ? (
            <LoadingSpinner message="Chargement des paiements..." />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Aucun paiement trouvé"
              description="Aucun paiement réussi ne correspond à ces filtres."
            />
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 sm:px-5 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Méthode
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Trajet
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Sièges
                      </th>
                      <th className="text-right px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        Référence
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const d = new Date(p.createdAt);
                      const seats = Array.isArray(p.seats)
                        ? p.seats.filter(
                            (n): n is number => typeof n === "number",
                          )
                        : [];
                      return (
                        <tr
                          key={p.id}
                          className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                        >
                          <td className="px-4 sm:px-5 py-3.5">
                            <p className="text-sm font-bold text-gray-900">
                              {d.toLocaleDateString("fr-FR")}
                            </p>
                            <p className="text-xs text-gray-400">
                              {d.toLocaleTimeString("fr-FR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-bold text-gray-900">
                              {p.user?.name ?? "—"}
                            </p>
                            <p className="text-xs font-mono text-gray-400">
                              {p.phone}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                p.method === "mvola"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-orange-50 text-orange-700 border-orange-200"
                              }`}
                            >
                              {METHOD_LABEL[p.method] ?? p.method}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-sm font-semibold text-gray-800">
                              {p.schedule?.route?.departure?.name ?? "—"}
                              {p.schedule?.route?.destination?.name && (
                                <>
                                  {" "}
                                  → {p.schedule.route.destination.name}
                                </>
                              )}
                            </p>
                            {p.schedule && (
                              <p className="text-xs text-gray-400">
                                {new Date(p.schedule.date).toLocaleDateString(
                                  "fr-FR",
                                )}{" "}
                                · {p.schedule.time}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {seats.map((s) => (
                                <span
                                  key={s}
                                  className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <span className="text-sm font-black text-gray-900">
                              {p.amount.toLocaleString()} Ar
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-mono text-xs font-bold text-gray-700">
                              {p.reservation?.bookingReference ?? "—"}
                            </p>
                            {p.mvolaTransactionRef && (
                              <p className="font-mono text-[10px] text-gray-400">
                                {p.mvolaTransactionRef}
                              </p>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-gray-50">
                {payments.map((p) => {
                  const d = new Date(p.createdAt);
                  const seats = Array.isArray(p.seats)
                    ? p.seats.filter((n): n is number => typeof n === "number")
                    : [];
                  return (
                    <div key={p.id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm text-gray-900">
                            {p.user?.name ?? "—"}
                          </p>
                          <p className="text-xs font-mono text-gray-400">
                            {p.phone}
                          </p>
                        </div>
                        <span className="font-black text-gray-900">
                          {p.amount.toLocaleString()} Ar
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded border ${
                            p.method === "mvola"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}
                        >
                          {METHOD_LABEL[p.method] ?? p.method}
                        </span>
                        <span>
                          {d.toLocaleDateString("fr-FR")} ·{" "}
                          {d.toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {seats.map((s) => (
                            <span
                              key={s}
                              className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        <span className="font-mono text-xs text-gray-600">
                          {p.reservation?.bookingReference ?? ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="px-4 sm:px-5 py-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-gray-400">
                  {data?.total?.toLocaleString() ?? 0} résultat
                  {(data?.total ?? 0) !== 1 ? "s" : ""}
                  {isFetching ? " · actualisation…" : ""}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                    let start = Math.max(1, page - 2);
                    if (page > pages - 3) start = Math.max(1, pages - 4);
                    const n = start + i;
                    if (n > pages) return null;
                    return (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`size-8 text-xs font-bold rounded-lg border ${
                          page === n
                            ? "bg-primary text-black border-primary"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="size-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
