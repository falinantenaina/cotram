import { describe, it, expect } from "vitest";
import {
  withOccupiedSeats,
  flattenReservationSeats,
} from "../../../utils/serialization.utils";

describe("withOccupiedSeats", () => {
  it("should map occupiedSeats objects to seatNumber array", () => {
    const schedule = {
      id: "1",
      occupiedSeats: [{ seatNumber: 1 }, { seatNumber: 3 }, { seatNumber: 5 }],
    };
    const result = withOccupiedSeats(schedule as any);
    expect(result.occupiedSeats).toEqual([1, 3, 5]);
  });

  it("should handle empty occupiedSeats", () => {
    const schedule = { id: "1", occupiedSeats: [] };
    const result = withOccupiedSeats(schedule as any);
    expect(result.occupiedSeats).toEqual([]);
  });

  it("should handle null/undefined occupiedSeats", () => {
    const schedule = { id: "1", occupiedSeats: null };
    const result = withOccupiedSeats(schedule as any);
    expect(result.occupiedSeats).toEqual([]);
  });

  it("should preserve other properties", () => {
    const schedule = { id: "1", name: "test", occupiedSeats: [] };
    const result = withOccupiedSeats(schedule as any);
    expect(result.id).toBe("1");
    expect(result.name).toBe("test");
  });
});

describe("flattenReservationSeats", () => {
  it("should map seats objects to seatNumber array", () => {
    const reservation = {
      id: "1",
      seats: [{ seatNumber: 2 }, { seatNumber: 4 }],
    };
    const result = flattenReservationSeats(reservation as any);
    expect(result.seats).toEqual([2, 4]);
  });

  it("should handle empty seats", () => {
    const reservation = { id: "1", seats: [] };
    const result = flattenReservationSeats(reservation as any);
    expect(result.seats).toEqual([]);
  });

  it("should handle null/undefined seats", () => {
    const reservation = { id: "1", seats: null };
    const result = flattenReservationSeats(reservation as any);
    expect(result.seats).toEqual([]);
  });
});
