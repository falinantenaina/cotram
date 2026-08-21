import { describe, it, expect } from "vitest";

describe("adminStats.service", () => {
  it("should export getDashboardStats", async () => {
    const mod = await import("../../../services/adminStats.service");
    expect(typeof mod.getDashboardStats).toBe("function");
  });
});

describe("scheduleManifest.service", () => {
  it("should export getTodaySchedulesWithPassengers", async () => {
    const mod = await import("../../../services/scheduleManifest.service");
    expect(typeof mod.getTodaySchedulesWithPassengers).toBe("function");
  });
});

describe("reservationWalkin.service", () => {
  it("should export createWalkinReservation and WalkinError", async () => {
    const mod = await import("../../../services/reservationWalkin.service");
    expect(typeof mod.createWalkinReservation).toBe("function");
    expect(typeof mod.WalkinError).toBe("function");
  });

  it("WalkinError should be an instance of Error", async () => {
    const { WalkinError } = await import("../../../services/reservationWalkin.service");
    const err = new WalkinError("test", 400);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("test");
    expect(err.statusCode).toBe(400);
  });
});

describe("schedule.service", () => {
  it("should export all service functions", async () => {
    const mod = await import("../../../services/schedule.service");
    expect(typeof mod.syncDriverStatus).toBe("function");
    expect(typeof mod.checkDriverConflict).toBe("function");
    expect(typeof mod.assignDriver).toBe("function");
    expect(typeof mod.unassignDriver).toBe("function");
  });
});

describe("driver.service", () => {
  it("should export all service functions", async () => {
    const mod = await import("../../../services/driver.service");
    expect(typeof mod.getDriverProfile).toBe("function");
    expect(typeof mod.getDriverTrips).toBe("function");
    expect(typeof mod.getDriverSelfStats).toBe("function");
    expect(typeof mod.listDrivers).toBe("function");
    expect(typeof mod.getDriverWithHistory).toBe("function");
    expect(typeof mod.createDriver).toBe("function");
    expect(typeof mod.updateDriver).toBe("function");
    expect(typeof mod.deleteDriver).toBe("function");
    expect(typeof mod.getDriverAdminStats).toBe("function");
  });
});
