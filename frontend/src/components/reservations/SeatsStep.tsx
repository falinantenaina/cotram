// frontend/src/components/reservations/SeatsStep.tsx
// Rendu DIRECT depuis seatConfig — même logique exacte que l'éditeur admin

import { User } from "lucide-react";
import type { SeatConfig } from "../../config/seatLayouts";
import type { Seat, SeatStatus } from "../../type";

type Props = {
  seats: Seat[];
  seatConfig: SeatConfig;
  handleSeatClick: (seatId: number) => void;
};

type CellKind = "driver" | "seat" | "aisle" | "empty";
interface DisplayCell {
  kind: CellKind;
  seatId?: number;
}

const SEAT_STYLE: Record<SeatStatus, string> = {
  available:
    "bg-white border-gray-300 hover:bg-primary/10 hover:border-primary/50 cursor-pointer",
  selected:
    "bg-primary border-primary text-black cursor-pointer shadow-sm shadow-primary/30 scale-105",
  occupied: "bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed",
};

export const SeatsStep = ({ seats, seatConfig, handleSeatClick }: Props) => {
  const statusMap = new Map<number, SeatStatus>(
    seats.map((s) => [s.id, s.status]),
  );

  // ── Calculer numCols : max(seat.col) + 1 sur toutes les rangées ─────────────
  let numCols = 1;
  seatConfig.rows.forEach((row) => {
    row.seats.forEach((s) => {
      numCols = Math.max(numCols, s.col + 1);
    });
  });

  // ── Construire les lignes d'affichage ────────────────────────────────────────
  // Pour chaque rangée : tableau de numCols cases (seat | aisle | empty)
  // On place les sièges à leur col exact, le reste = empty
  // Puis on marque "aisle" les empty encadrés par des sièges (même logique admin)
  const displayRows = seatConfig.rows.map((row, ri) => {
    const cells: DisplayCell[] = Array.from({ length: numCols }, () => ({
      kind: "empty" as CellKind,
    }));

    // Placer les sièges
    row.seats.forEach((seat) => {
      const ci = Math.min(seat.col, numCols - 1);
      cells[ci] = { kind: "seat", seatId: seat.id };
    });

    // Calculer l'étendue des sièges (premier et dernier col)
    const seatCols = row.seats.map((s) => Math.min(s.col, numCols - 1));
    if (seatCols.length >= 2) {
      const minC = Math.min(...seatCols);
      const maxC = Math.max(...seatCols);
      // Toute case vide entre minC et maxC = allée
      for (let ci = minC + 1; ci < maxC; ci++) {
        if (cells[ci]!.kind === "empty") cells[ci] = { kind: "aisle" };
      }
    }

    return { cells, bench: row.isBackBench, label: row.label, ri };
  });

  const available = seats.filter((s) => s.status === "available").length;
  const selected = seats.filter((s) => s.status === "selected").length;
  const occupied = seats.filter((s) => s.status === "occupied").length;

  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">Plan du véhicule</h3>
            {seatConfig.layoutName && (
              <p className="text-xs text-gray-400 mt-0.5">
                {seatConfig.layoutName}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {seatConfig.totalSeats} places · {available} disponibles
          </span>
        </div>

        {/* Légende */}
        <div className="flex gap-5 px-6 py-3 border-b border-gray-50 bg-gray-50/50">
          {[
            {
              color: "bg-white border-2 border-gray-300",
              label: "Disponible",
              count: available,
            },
            {
              color: "bg-primary border-2 border-primary",
              label: "Sélectionné",
              count: selected,
            },
            {
              color: "bg-gray-100 border-2 border-gray-200",
              label: "Occupé",
              count: occupied,
            },
          ].map(({ color, label, count }) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`size-5 rounded-md ${color} shrink-0`} />
              <span className="text-xs text-gray-500">
                {label}
                {count > 0 && (
                  <span className="ml-1 font-bold text-gray-700">{count}</span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Plan bus */}
        <div className="p-6">
          <div className="max-w-xs mx-auto space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">
                Avant
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {displayRows.map(({ cells, bench, label, ri }) => {
              const isFirst = ri === 0;
              const prevBench = seatConfig.rows[ri - 1]?.isBackBench;
              const showDivider = bench && !prevBench && ri > 0;

              return (
                <div key={ri}>
                  {showDivider && (
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-px flex-1 border-t-2 border-dashed border-gray-200" />
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">
                        {label ?? "Banquette"}
                      </span>
                      <div className="h-px flex-1 border-t-2 border-dashed border-gray-200" />
                    </div>
                  )}

                  {/* Grille CSS — même structure que l'éditeur admin */}
                  <div
                    style={{
                      display: "grid",
                      // Rangée 0 : colonne conducteur + numCols colonnes données
                      gridTemplateColumns: isFirst
                        ? `44px repeat(${numCols}, 1fr)`
                        : `repeat(${numCols}, 1fr)`,
                      gap: 6,
                      padding: bench ? "4px 6px" : "0",
                      background: bench
                        ? "rgba(251,191,36,.06)"
                        : "transparent",
                      borderRadius: bench ? 10 : 0,
                      border: bench ? "1px dashed rgba(251,191,36,.3)" : "none",
                    }}
                  >
                    {/* Case conducteur — rangée 0 uniquement */}
                    {isFirst && (
                      <div className="h-11 rounded-xl bg-gray-800 flex items-center justify-center">
                        <User size={16} className="text-white/60" />
                      </div>
                    )}

                    {cells.map((cell, ci) => {
                      if (cell.kind === "aisle") {
                        return (
                          <div
                            key={ci}
                            className="h-11 rounded-lg flex items-center justify-center"
                            style={{
                              background: "rgba(254,249,195,.8)",
                              border: "1px dashed #fde047",
                            }}
                          >
                            <svg width="8" height="20" viewBox="0 0 8 20">
                              <path
                                d="M4 1v18"
                                stroke="#ca8a04"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeDasharray="3 2"
                              />
                            </svg>
                          </div>
                        );
                      }

                      if (cell.kind === "empty") {
                        // Case vide hors de l'étendue des sièges = espace invisible
                        return <div key={ci} className="h-11" />;
                      }

                      // SIÈGE
                      const id = cell.seatId!;
                      const status = statusMap.get(id) ?? "available";

                      return (
                        <button
                          key={ci}
                          onClick={() =>
                            status !== "occupied" && handleSeatClick(id)
                          }
                          disabled={status === "occupied"}
                          className={`h-11 rounded-xl border-2 flex items-center justify-center font-bold text-sm transition-all duration-150 ${SEAT_STYLE[status]}`}
                        >
                          {id}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-2 mt-2">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest px-2">
                Arrière
              </span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
