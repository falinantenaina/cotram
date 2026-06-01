// frontend/src/config/seatLayouts.ts

export type SeatPosition = "left" | "middle" | "right";

export interface SeatDef {
  id: number;
  row: number;
  col: number;
  position: SeatPosition;
}

export interface RowDef {
  row: number;
  seats: SeatDef[];
  isBackBench: boolean;
  label?: string;
}

export interface SeatConfig {
  totalSeats: number;
  rows: RowDef[];
  layoutName?: string;
  hasAisle?: boolean;
}

function makeSeat(
  id: number,
  row: number,
  col: number,
  pos: SeatPosition,
): SeatDef {
  return { id, row, col, position: pos };
}

/**
 * Generate a bus-like layout for N seats.
 *
 * Standard rows: 2 seats | aisle | 2 seats  (4 seats per row)
 * If a row has < 4 seats, they fill left-first then right.
 * Row 1 is the driver row (marked with isDriverRow for the preview).
 *
 * Layout grid columns (7 total):
 *   0: left wall pad
 *   1: seat (left group)
 *   2: seat (left group)
 *   3: aisle
 *   4: seat (right group)
 *   5: seat (right group)
 *   6: right wall pad
 */
export function buildFallbackConfig(totalSeats: number): SeatConfig {
  if (totalSeats <= 0) totalSeats = 1;

  let id = 1;
  const rows: RowDef[] = [];

  // Row 1: driver row — only 1 passenger seat (right side)
  const driverSeats: SeatDef[] = [];
  driverSeats.push(makeSeat(id++, 1, 4, "right"));
  rows.push({ row: 1, seats: driverSeats, isBackBench: false, label: "Chauffeur" });

  let remaining = totalSeats - 1;
  let rowNum = 2;

  // Normal rows: 4 seats each (2 left, aisle, 2 right)
  while (remaining > 0) {
    const seatsInRow = Math.min(remaining, 4);
    const seats: SeatDef[] = [];

    if (seatsInRow === 1) {
      seats.push(makeSeat(id++, rowNum, 4, "right"));
    } else if (seatsInRow === 2) {
      seats.push(makeSeat(id++, rowNum, 1, "left"));
      seats.push(makeSeat(id++, rowNum, 5, "right"));
    } else if (seatsInRow === 3) {
      seats.push(makeSeat(id++, rowNum, 1, "left"));
      seats.push(makeSeat(id++, rowNum, 4, "right"));
      seats.push(makeSeat(id++, rowNum, 5, "right"));
    } else {
      seats.push(makeSeat(id++, rowNum, 1, "left"));
      seats.push(makeSeat(id++, rowNum, 2, "left"));
      seats.push(makeSeat(id++, rowNum, 4, "right"));
      seats.push(makeSeat(id++, rowNum, 5, "right"));
    }

    // Last row is the bench (banquette arrière)
    if (remaining <= 4 && rows.length > 1) {
      rows.push({ row: rowNum, seats, isBackBench: true, label: "Banquette" });
    } else {
      rows.push({ row: rowNum, seats, isBackBench: false });
    }

    remaining -= seatsInRow;
    rowNum++;
  }

  return {
    totalSeats,
    layoutName: `Véhicule ${totalSeats} places`,
    rows,
    hasAisle: true,
  };
}

/** Recalculate sequential IDs after manual edits */
export function renumberSeats(config: SeatConfig): SeatConfig {
  let id = 1;
  const rows = config.rows.map((row) => ({
    ...row,
    seats: row.seats.map((s) => ({ ...s, id: id++ })),
  }));
  return { ...config, totalSeats: id - 1, rows };
}

/** Build Seat[] array (frontend state) from a SeatConfig + occupied list */
export function buildSeatsFromConfig(
  config: SeatConfig,
  occupiedSeats: number[],
): import("../type").Seat[] {
  return config.rows.flatMap((row) =>
    row.seats.map((s) => ({
      id: s.id,
      row: s.row,
      position: s.position,
      status: (occupiedSeats.includes(s.id)
        ? "occupied"
        : "available") as import("../type").SeatStatus,
    })),
  );
}
