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
 * Auto-generate a SeatConfig for any number of seats.
 * Works for 1–99 seats without any code changes.
 */
export function buildFallbackConfig(totalSeats: number): SeatConfig {
  if (totalSeats <= 0) totalSeats = 1;

  let id = 1;
  const rows: RowDef[] = [];

  const benchCount =
    totalSeats <= 9 ? Math.min(totalSeats, 3) : totalSeats <= 16 ? 4 : 5;
  const normalSeats = totalSeats - benchCount;
  const row1Count = normalSeats >= 2 ? 2 : normalSeats;

  if (row1Count > 0) {
    const seats: SeatDef[] = [];
    if (row1Count === 1) {
      seats.push(makeSeat(id++, 1, 0, "right"));
    } else {
      seats.push(makeSeat(id++, 1, 0, "middle"));
      seats.push(makeSeat(id++, 1, 1, "right"));
    }
    rows.push({ row: 1, seats, isBackBench: false });
  }

  let remaining = normalSeats - row1Count;
  let rowNum = 2;
  while (remaining > 0) {
    const n = Math.min(remaining, 3);
    const seats: SeatDef[] = [];
    if (n === 1) seats.push(makeSeat(id++, rowNum, 0, "left"));
    else if (n === 2) {
      seats.push(makeSeat(id++, rowNum, 0, "left"));
      seats.push(makeSeat(id++, rowNum, 1, "right"));
    } else {
      seats.push(makeSeat(id++, rowNum, 0, "left"));
      seats.push(makeSeat(id++, rowNum, 1, "middle"));
      seats.push(makeSeat(id++, rowNum, 2, "right"));
    }
    rows.push({ row: rowNum, seats, isBackBench: false });
    remaining -= n;
    rowNum++;
  }

  if (benchCount > 0) {
    const benchSeats: SeatDef[] = [];
    for (let i = 0; i < benchCount; i++) {
      const pos: SeatPosition =
        i === 0 ? "left" : i === benchCount - 1 ? "right" : "middle";
      benchSeats.push(makeSeat(id++, rowNum, i, pos));
    }
    rows.push({
      row: rowNum,
      seats: benchSeats,
      isBackBench: true,
      label: "Banquette",
    });
  }

  return { totalSeats, layoutName: `Véhicule ${totalSeats} places`, rows };
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
