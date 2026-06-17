import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Filter,
  History,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  ConfirmDeleteModal,
  EmptyState,
  LoadingSpinner,
  PageHeader,
  StatCard,
} from "../../components/common";
import { AssignDriverModal } from "../../components/schedules/AssignDriverModal";
import { CalendarView } from "../../components/schedules/CalendarView";
import { PassengerModal } from "../../components/schedules/PassengerModal";
import {
  getDriverObj,
  ScheduleCard,
  STATUS_CONFIG,
  type Schedule,
} from "../../components/schedules/ScheduleCard";
import { ScheduleModal } from "../../components/schedules/ScheduleModal";
import api from "../../lib/axios";

interface Route {
  id: string;
  departure: { id: string; name: string };
  destination: { id: string; name: string };
  price: number;
  duration: string;
}
interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  status: string;
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function AdminSchedules() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [routeFilter, setRouteFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "past"
  >("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [modalSchedule, setModalSchedule] = useState<Schedule | null | "new">(
    null,
  );
  const [assignTarget, setAssignTarget] = useState<Schedule | null>(null);
  const [passengerTarget, setPassengerTarget] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | "bulk" | null>(
    null,
  );
  const [includeHistory, setIncludeHistory] = useState(false);

  const {
    data: schedulesRaw = [],
    isLoading,
    refetch,
  } = useQuery<Schedule[]>({
    queryKey: ["admin-schedules", includeHistory],
    queryFn: async () => {
      const { data } = await api.get(
        `/admin/schedules${includeHistory ? "?includeHistory=true" : ""}`,
      );
      return data.schedules;
    },
    refetchInterval: 30_000,
  });

  const { data: routesData } = useQuery<{ routes: Route[] }>({
    queryKey: ["routes-list"],
    queryFn: async () => {
      const { data } = await api.get("/routes");
      return data;
    },
  });

  const { data: driversData } = useQuery<{ drivers: Driver[] }>({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data } = await api.get("/drivers");
      return data;
    },
  });

  const routes = routesData?.routes ?? [];
  const drivers = driversData?.drivers ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) =>
      Promise.all(ids.map((id) => api.delete(`/schedules/${id}`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] });
      setSelectedIds(new Set());
      setDeleteTarget(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/schedules/${id}`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-schedules"] }),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const schedules = schedulesRaw.filter((s) => {
    const d = new Date(toLocalDateKey(new Date(s.date)).replace(/-/g, "/"));
    d.setHours(0, 0, 0, 0);
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (routeFilter !== "all" && s.route.id !== routeFilter) return false;
    if (dateFilter === "today" && d.toDateString() !== today.toDateString())
      return false;
    if (dateFilter === "week" && (d < today || d >= nextWeek)) return false;
    if (dateFilter === "past" && d >= today) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.route.departure?.name?.toLowerCase().includes(q) ||
        s.route.destination?.name?.toLowerCase().includes(q) ||
        s.time.includes(q) ||
        s.vehicle.toLowerCase().includes(q) ||
        (getDriverObj(s.driver)?.firstName.toLowerCase().includes(q) ??
          false) ||
        (getDriverObj(s.driver)?.lastName.toLowerCase().includes(q) ?? false) ||
        (s.vehicleNumber?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Stats
  const todaySchedules = schedulesRaw.filter(
    (s) =>
      new Date(s.date + "T00:00:00").toDateString() ===
      new Date().toDateString(),
  );
  const totalSeatsToday = todaySchedules.reduce(
    (sum, s) => sum + s.totalSeats,
    0,
  );
  const occupiedToday = todaySchedules.reduce(
    (sum, s) => sum + (s.totalSeats - s.availableSeats),
    0,
  );
  const weekCount = schedulesRaw.filter((s) => {
    const d = new Date(s.date + "T00:00:00");
    return d >= today && d < nextWeek;
  }).length;
  const unassigned = schedulesRaw.filter(
    (s) =>
      !getDriverObj(s.driver) &&
      s.status === "scheduled" &&
      new Date(s.date + "T00:00:00") >= today,
  ).length;

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleSelectAll = () =>
    setSelectedIds(
      selectedIds.size === schedules.length
        ? new Set()
        : new Set(schedules.map((s) => s.id)),
    );

  const activeFiltersCount = [
    statusFilter !== "all",
    routeFilter !== "all",
    dateFilter !== "all",
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Horaires"
        subtitle={`${schedulesRaw.length} voyage${schedulesRaw.length !== 1 ? "s" : ""} au total`}
        actions={
          <>
            <Link
              to="/admin/trips/history"
              className="flex items-center gap-2 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-semibold px-3 py-2.5 rounded-xl text-sm"
            >
              <History size={15} /> Historique
            </Link>
            <Link
              to="/admin/schedules/generate"
              className="flex items-center gap-2 border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 font-bold px-3 py-2.5 rounded-xl text-sm"
            >
              <Zap size={15} /> Génération auto
            </Link>
            <button
              onClick={() => setModalSchedule("new")}
              className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90"
            >
              <Plus size={15} /> Nouvel voyage
            </button>
          </>
        }
      />

      <div className="px-4 sm:px-6 py-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Voyages aujourd'hui"
            value={todaySchedules.length}
            icon={CalendarDays}
            accent="bg-primary/10 text-primary"
          />
          <StatCard
            label="Taux remplissage (auj.)"
            value={
              totalSeatsToday
                ? `${Math.round((occupiedToday / totalSeatsToday) * 100)}%`
                : "—"
            }
            icon={Users}
            accent="bg-blue-100 text-blue-700"
          />
          <StatCard
            label="Cette semaine"
            value={weekCount}
            icon={CalendarDays}
            accent="bg-emerald-100 text-emerald-700"
          />
          <StatCard
            label="Sans chauffeur"
            value={unassigned}
            icon={Users}
            accent="bg-amber-100 text-amber-700"
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
              placeholder="Trajet, heure, chauffeur…"
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${showFilters || activeFiltersCount > 0 ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-white text-gray-600"}`}
          >
            <Filter size={14} /> Filtres
            {activeFiltersCount > 0 && (
              <span className="size-5 bg-primary rounded-full text-black text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown
              size={14}
              className={`transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
          <div className="flex bg-gray-100 p-1 rounded-xl">
            {(["list", "calendar"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${view === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                {v === "list" ? "Liste" : "Calendrier"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setIncludeHistory(!includeHistory)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${includeHistory ? "border-gray-800 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-500"}`}
          >
            <History size={14} />
            <span className="hidden sm:inline">
              {includeHistory ? "Avec historique" : "Sans historique"}
            </span>
          </button>
          <button
            onClick={() => refetch()}
            className="size-10 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Statut
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      "all",
                      "scheduled",
                      "in_progress",
                      "completed",
                      "cancelled",
                    ] as const
                  ).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${statusFilter === s ? "border-primary bg-primary text-black" : "border-gray-200 text-gray-600"}`}
                    >
                      {s === "all" ? "Tous" : STATUS_CONFIG[s].label}
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
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                >
                  <option value="all">Tous les trajets</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.departure?.name} → {r.destination?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Période
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: "all", label: "Tout" },
                      { key: "today", label: "Aujourd'hui" },
                      { key: "week", label: "Cette semaine" },
                      { key: "past", label: "Passés" },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setDateFilter(key)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${dateFilter === key ? "border-primary bg-primary text-black" : "border-gray-200 text-gray-600"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setRouteFilter("all");
                  setDateFilter("all");
                }}
                className="mt-3 text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <X size={11} /> Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl">
            <span className="text-sm font-semibold">
              {selectedIds.size} sélectionné{selectedIds.size > 1 ? "s" : ""}
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setDeleteTarget("bulk")}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-xl text-sm font-bold"
            >
              <Trash2 size={13} /> Supprimer
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="size-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner message="Chargement des horaires…" />
        ) : schedules.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun horaire trouvé"
            description="Créez un horaire ou utilisez la génération automatique"
            action={
              <div className="flex gap-3">
                <Link
                  to="/admin/schedules/generate"
                  className="flex items-center gap-2 bg-primary text-black font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-primary/90"
                >
                  <Sparkles size={15} /> Génération auto
                </Link>
                <button
                  onClick={() => setModalSchedule("new")}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50"
                >
                  <Plus size={15} /> Créer manuellement
                </button>
              </div>
            }
          />
        ) : view === "calendar" ? (
          <CalendarView
            schedules={schedules}
            onEdit={(s) => setModalSchedule(s)}
          />
        ) : (
          <div className="space-y-2">
            {/* Select all bar */}
            <div className="flex items-center gap-3 px-4 sm:px-5 py-2">
              <button
                onClick={toggleSelectAll}
                className={`size-5 rounded border-2 flex items-center justify-center shrink-0 ${selectedIds.size === schedules.length && schedules.length > 0 ? "border-primary bg-primary" : "border-gray-300"}`}
              >
                {selectedIds.size === schedules.length &&
                  schedules.length > 0 && (
                    <Check size={11} className="text-black" />
                  )}
              </button>
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {selectedIds.size > 0
                  ? `${selectedIds.size} sélectionné${selectedIds.size > 1 ? "s" : ""}`
                  : `${schedules.length} horaire${schedules.length > 1 ? "s" : ""}`}
              </span>
            </div>

            {/* Grouped by date */}
            {(() => {
              const grouped = schedules.reduce<Record<string, Schedule[]>>(
                (acc, s) => {
                  const k = toLocalDateKey(new Date(s.date));
                  if (!acc[k]) acc[k] = [];
                  acc[k].push(s);
                  return acc;
                },
                {},
              );

              return Object.entries(grouped)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dateKey, daySchedules]) => {
                  const [y, mo, da] = dateKey.split("-").map(Number);
                  const d = new Date(y!, mo! - 1, da!);
                  const isToday =
                    d.toDateString() === new Date().toDateString();
                  const isTomorrow =
                    d.toDateString() ===
                    new Date(Date.now() + 86400000).toDateString();

                  return (
                    <div key={dateKey}>
                      <div className="flex items-center gap-3 py-2">
                        <div
                          className={`text-xs font-bold px-3 py-1.5 rounded-full ${isToday ? "bg-primary text-black" : isTomorrow ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"}`}
                        >
                          {isToday
                            ? "Aujourd'hui"
                            : isTomorrow
                              ? "Demain"
                              : d.toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                })}
                        </div>
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-400 font-semibold">
                          {daySchedules.length} voyage
                          {daySchedules.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {daySchedules
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((s) => (
                            <ScheduleCard
                              key={s.id}
                              schedule={s}
                              selected={selectedIds.has(s.id)}
                              onSelect={toggleSelect}
                              onEdit={() => setModalSchedule(s)}
                              onDelete={(id) => setDeleteTarget(id)}
                              onStatusChange={(id, status) =>
                                statusMutation.mutate({ id, status })
                              }
                              onAssignDriver={(sc) => setAssignTarget(sc)}
                              onViewPassengers={(sc) => setPassengerTarget(sc)}
                            />
                          ))}
                      </div>
                    </div>
                  );
                });
            })()}
          </div>
        )}
      </div>

      {/* Modals */}
      {modalSchedule !== null && (
        <ScheduleModal
          schedule={modalSchedule === "new" ? null : modalSchedule}
          routes={routes}
          drivers={drivers as any}
          onClose={() => setModalSchedule(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
          }
        />
      )}
      {assignTarget !== null && (
        <AssignDriverModal
          scheduleId={assignTarget.id}
          currentDriver={getDriverObj(assignTarget.driver) as any}
          onClose={() => setAssignTarget(null)}
          onSuccess={() =>
            queryClient.invalidateQueries({ queryKey: ["admin-schedules"] })
          }
        />
      )}
      {passengerTarget !== null && (
        <PassengerModal
          schedule={passengerTarget as any}
          onClose={() => setPassengerTarget(null)}
        />
      )}
      {deleteTarget !== null && (
        <ConfirmDeleteModal
          title={`Supprimer ${deleteTarget === "bulk" ? selectedIds.size : 1} horaire${(deleteTarget === "bulk" ? selectedIds.size : 1) > 1 ? "s" : ""} ?`}
          description="Cette action est irréversible."
          icon={Trash2}
          onConfirm={() => {
            if (deleteTarget === "bulk")
              deleteMutation.mutate([...selectedIds]);
            else deleteMutation.mutate([deleteTarget]);
          }}
          onClose={() => setDeleteTarget(null)}
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
