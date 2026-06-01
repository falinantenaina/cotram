import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Loader,
  Search,
  TrendingUp,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import {
  LoadingSpinner,
  OccupancyBar,
  PageHeader,
  StatCard,
} from "../../components/common";
import api from "../../lib/axios";

interface PastSchedule {
  id: string;
  route: {
    id: string;
    departure: string;
    destination: string;
    duration: string;
    price: number;
  };
  driver?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    vehicleNumber: string;
  };
  date: string;
  time: string;
  vehicle: string;
  vehicleNumber?: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: "completed" | "cancelled" | "scheduled" | "in_progress";
  notes?: string;
}

interface GlobalStats {
  total: number;
  completed: number;
  cancelled: number;
  totalRevenue: number;
  totalPassengers: number;
}

const STATUS_CFG = {
  completed: {
    label: "Terminé",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Annulé",
    badge: "bg-red-50 text-red-600 border-red-200",
    icon: XCircle,
    dot: "bg-red-400",
  },
  scheduled: {
    label: "Non parti",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
    dot: "bg-amber-400",
  },
  in_progress: {
    label: "En cours",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Zap,
    dot: "bg-blue-400 animate-pulse",
  },
};

function occ(s: PastSchedule) {
  return s.totalSeats - s.availableSeats;
}

function exportCSV(schedules: PastSchedule[]) {
  const rows = [
    [
      "Date",
      "Heure",
      "Trajet",
      "Chauffeur",
      "Statut",
      "Passagers",
      "Sièges",
      "Recette Ar",
    ],
    ...schedules.map((s) => {
      const d = new Date(s.date + "T00:00:00");
      const o = occ(s);
      return [
        d.toLocaleDateString("fr-FR"),
        s.time,
        `${s.route.departure} → ${s.route.destination}`,
        s.driver ? `${s.driver.firstName} ${s.driver.lastName}` : "Non assigné",
        STATUS_CFG[s.status]?.label ?? s.status,
        o,
        s.totalSeats,
        o * s.price,
      ];
    }),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.join(";")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `historique-voyages-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function HistoryRow({ s }: { s: PastSchedule }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.completed;
  const Icon = cfg.icon;
  const occupancy = occ(s);
  const d = new Date(s.date);
  const revenue = occupancy * s.price;

  return (
    <>
      <tr
        onClick={() => setOpen(!open)}
        className="border-b border-gray-50 hover:bg-gray-50/60 cursor-pointer transition-colors"
      >
        <td className="px-4 sm:px-5 py-3.5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-center w-9 shrink-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-none">
                {d.toLocaleDateString("fr-FR", { month: "short" })}
              </p>
              <p className="text-xl font-black text-gray-900 leading-tight">
                {d.getDate()}
              </p>
              <p className="text-[10px] text-gray-300">{d.getFullYear()}</p>
            </div>
            <div>
              <p className="font-mono font-black text-gray-900 text-sm leading-none">
                {s.time}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize hidden sm:block">
                {d.toLocaleDateString("fr-FR", { weekday: "long" })}
              </p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-900 text-sm truncate max-w-[80px] sm:max-w-none">
              {s.route.departure}
            </span>
            <ArrowRight size={11} className="text-gray-400 shrink-0" />
            <span className="font-bold text-gray-900 text-sm truncate max-w-[80px] sm:max-w-none">
              {s.route.destination}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5 hidden sm:block">
            {s.route.duration}
          </p>
        </td>
        <td className="px-4 py-3.5 hidden md:table-cell">
          {s.driver ? (
            <div>
              <p className="text-sm font-bold text-gray-800">
                {s.driver.firstName} {s.driver.lastName}
              </p>
              <p className="text-xs font-mono text-gray-400">
                {s.vehicleNumber ?? s.driver.vehicleNumber}
              </p>
            </div>
          ) : (
            <span className="text-xs text-gray-300 italic">Non assigné</span>
          )}
        </td>
        <td className="px-4 py-3.5 hidden lg:table-cell">
          <div className="w-32">
            <OccupancyBar value={occupancy} max={s.totalSeats} />
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-full border ${cfg.badge}`}
          >
            <Icon size={11} />
            <span className="hidden sm:inline">{cfg.label}</span>
          </span>
        </td>
        <td className="px-4 sm:px-5 py-3.5 text-right hidden sm:table-cell">
          <p className="font-black text-gray-900 text-sm">
            {revenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-gray-400">Ar</p>
        </td>
        <td className="px-3 py-3.5">
          <ChevronDown
            size={14}
            className={`text-gray-300 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </td>
      </tr>
      {open && (
        <tr className="bg-primary/[0.03] border-b border-primary/10">
          <td colSpan={7} className="px-4 sm:px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Passagers",
                  value: occupancy,
                  sub: `sur ${s.totalSeats} · ${s.totalSeats > 0 ? Math.round((occupancy / s.totalSeats) * 100) : 0}%`,
                },
                {
                  label: "Recette",
                  value: `${revenue.toLocaleString()} Ar`,
                  sub: "générés",
                  color: "text-primary",
                },
                {
                  label: "Véhicule",
                  value: s.vehicleNumber ?? s.vehicle,
                  sub: s.vehicle,
                },
                {
                  label: "Prix/siège",
                  value: `${s.price.toLocaleString()} Ar`,
                  sub: "par passager",
                },
              ].map(({ label, value, sub, color }) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-100 px-3 sm:px-4 py-3"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {label}
                  </p>
                  <p
                    className={`text-lg sm:text-xl font-black mt-1 ${color ?? "text-gray-900"}`}
                  >
                    {value}
                  </p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              ))}
              {s.notes && (
                <div className="col-span-full bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-gray-700">{s.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

const PAGE_SIZE = 25;

export default function TripHistory() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [driverFilter, setDriverFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "trip-history",
      page,
      statusFilter,
      routeFilter,
      driverFilter,
      dateFrom,
      dateTo,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(routeFilter !== "all" && { routeId: routeFilter }),
        ...(driverFilter !== "all" && { driverId: driverFilter }),
        ...(dateFrom && { from: dateFrom }),
        ...(dateTo && { to: dateTo }),
      });
      const { data } = await api.get(`/schedules/history?${params}`);
      return data;
    },
    placeholderData: (prev: any) => prev,
  });

  const { data: routesData } = useQuery({
    queryKey: ["routes-list"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data;
    },
  });
  const { data: driversData } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const schedules: PastSchedule[] = data?.schedules ?? [];
  const total: number = data?.total ?? 0;
  const pages: number = data?.pages ?? 1;
  const gs: GlobalStats = data?.globalStats ?? {
    total: 0,
    completed: 0,
    cancelled: 0,
    totalRevenue: 0,
    totalPassengers: 0,
  };

  const filtered = search
    ? schedules.filter((s) => {
        const q = search.toLowerCase();
        return (
          s.route.departure.toLowerCase().includes(q) ||
          s.route.destination.toLowerCase().includes(q) ||
          s.time.includes(q) ||
          (s.driver?.firstName.toLowerCase().includes(q) ?? false) ||
          (s.driver?.lastName.toLowerCase().includes(q) ?? false) ||
          (s.vehicleNumber?.toLowerCase().includes(q) ?? false)
        );
      })
    : schedules;

  const activeFilters = [
    statusFilter !== "all",
    routeFilter !== "all",
    driverFilter !== "all",
    !!dateFrom,
    !!dateTo,
  ].filter(Boolean).length;

  const preset = (type: "today" | "week" | "month" | "year") => {
    const now = new Date();
    const toStr = now.toISOString().split("T")[0]!;
    const d = new Date(now);
    if (type === "today") {
      setDateFrom(toStr);
      setDateTo(toStr);
    } else if (type === "week") {
      d.setDate(d.getDate() - 7);
      setDateFrom(d.toISOString().split("T")[0]!);
      setDateTo(toStr);
    } else if (type === "month") {
      d.setDate(1);
      setDateFrom(d.toISOString().split("T")[0]!);
      setDateTo(toStr);
    } else if (type === "year") {
      setDateFrom(`${now.getFullYear()}-01-01`);
      setDateTo(toStr);
    }
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Historique des voyages"
        subtitle={`${gs.total.toLocaleString()} voyage${gs.total !== 1 ? "s" : ""} au total`}
        actions={
          <button
            onClick={() => exportCSV(filtered)}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-40"
          >
            <Download size={15} /> Exporter CSV
          </button>
        }
      />

      <div className="px-4 sm:px-6 py-6 space-y-5">
        {/* Global stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard
            label="Total passés"
            value={gs.total.toLocaleString()}
            icon={Calendar}
            accent="bg-gray-100 text-gray-600"
          />
          <StatCard
            label="Terminés"
            value={gs.completed.toLocaleString()}
            icon={CheckCircle2}
            accent="bg-emerald-100 text-emerald-700"
            color="text-emerald-600"
            sub={
              gs.total
                ? `${Math.round((gs.completed / gs.total) * 100)}% du total`
                : undefined
            }
          />
          <StatCard
            label="Annulés"
            value={gs.cancelled.toLocaleString()}
            icon={XCircle}
            accent="bg-red-100 text-red-600"
            color="text-red-600"
            sub={
              gs.total
                ? `${Math.round((gs.cancelled / gs.total) * 100)}% du total`
                : undefined
            }
          />
          <StatCard
            label="Passagers"
            value={gs.totalPassengers.toLocaleString()}
            icon={Users}
            accent="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="Recettes"
            value={`${Math.round(gs.totalRevenue / 1000).toLocaleString()}k Ar`}
            icon={TrendingUp}
            accent="bg-primary/10 text-primary"
            color="text-primary"
          />
        </div>

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
              placeholder="Trajet, chauffeur…"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* Quick presets */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(
              [
                ["today", "Auj."],
                ["week", "7j"],
                ["month", "Mois"],
                ["year", "Année"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => preset(key)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all"
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters || activeFilters > 0 ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-600"}`}
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

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Statut
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "all",
                      "completed",
                      "cancelled",
                      "in_progress",
                      "scheduled",
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusFilter(s);
                        setPage(1);
                      }}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${statusFilter === s ? "border-primary bg-primary text-black" : `border-gray-200 text-gray-600 ${s !== "all" ? STATUS_CFG[s].badge : ""}`}`}
                    >
                      {s === "all" ? "Tous" : STATUS_CFG[s].label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Trajet
                </label>
                <select
                  value={routeFilter}
                  onChange={(e) => {
                    setRouteFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="all">Tous les trajets</option>
                  {routesData?.routes?.map((r: any) => (
                    <option key={r.id} value={r.id}>
                      {r.departure} → {r.destination}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Chauffeur
                </label>
                <select
                  value={driverFilter}
                  onChange={(e) => {
                    setDriverFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="all">Tous les chauffeurs</option>
                  {driversData?.drivers?.map((d: any) => (
                    <option key={d.id} value={d.id}>
                      {d.firstName} {d.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Période
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 border border-gray-200 rounded-xl py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1 border border-gray-200 rounded-xl py-2 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
            </div>
            {activeFilters > 0 && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setRouteFilter("all");
                  setDriverFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {isLoading ? (
            <LoadingSpinner message="Chargement de l'historique…" />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar size={32} className="text-gray-200 mb-3" />
              <p className="text-gray-500 font-bold">Aucun voyage trouvé</p>
              <p className="text-gray-400 text-sm mt-1">Modifiez les filtres</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {[
                        { label: "Date & Heure" },
                        { label: "Trajet" },
                        { label: "Chauffeur", cls: "hidden md:table-cell" },
                        { label: "Occupation", cls: "hidden lg:table-cell" },
                        { label: "Statut" },
                        {
                          label: "Recette",
                          cls: "text-right hidden sm:table-cell",
                        },
                        { label: "" },
                      ].map((h, i) => (
                        <th
                          key={i}
                          className={`px-4 sm:px-5 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider ${h.cls ?? ""}`}
                        >
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <HistoryRow key={s.id} s={s} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-t border-gray-50 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {isFetching && (
                      <>
                        <Loader
                          size={12}
                          className="animate-spin text-primary"
                        />
                        <span className="text-xs text-gray-400">
                          Mise à jour…
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    Page <span className="font-bold text-gray-700">{page}</span>{" "}
                    sur {pages} ·{" "}
                    <span className="font-bold text-gray-700">{total}</span>{" "}
                    résultats
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="size-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                      let p = i + 1;
                      if (pages > 5) {
                        if (page <= 3) p = i + 1;
                        else if (page >= pages - 2) p = pages - 4 + i;
                        else p = page - 2 + i;
                      }
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`size-8 flex items-center justify-center rounded-xl text-sm font-bold ${page === p ? "bg-primary text-black" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                        >
                          {p}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => setPage((p) => Math.min(pages, p + 1))}
                      disabled={page === pages}
                      className="size-8 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
