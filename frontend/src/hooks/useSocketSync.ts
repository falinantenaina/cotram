import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { connectSocket, disconnectSocket, getSocket } from "../lib/socket";
import { useAuthStore } from "../stores/useAuthStore";

const STAFF_ROLES = ["admin", "caissier", "agent"] as const;

const STAFF_EVENTS = [
  "reservation:created",
  "reservation:updated",
  "reservation:cancelled",
  "schedule:updated",
  "parcel:created",
  "parcel:updated",
  "parcel:status",
  "parcel:payment",
] as const;

const DRIVER_EVENTS = [
  "reservation:created",
  "reservation:updated",
  "reservation:cancelled",
  "schedule:updated",
  "schedule:assigned",
  "schedule:unassigned",
] as const;

export function useSocketSync(): void {
  const queryClient = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    if (!token) return;

    const isStaff = role != null && (STAFF_ROLES as readonly string[]).includes(role);
    const isDriver = role === "driver";

    connectSocket();
    const socket = getSocket();

    const invalidate = (keys: string[][]) => {
      for (const key of keys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    };

    const handlers: Record<string, () => void> = {
      "reservation:created": () =>
        invalidate([
          ["admin-reservations"],
          ["admin-stats"],
          ["admin-recent-reservations"],
          ["admin-schedules"],
          ["admin-schedules-walkin"],
          ["my-reservations"],
          ["reservations"],
          ["driver-trips"],
          ["driver-stats"],
          ["passengers"],
        ]),
      "reservation:updated": () =>
        invalidate([
          ["admin-reservations"],
          ["admin-stats"],
          ["admin-recent-reservations"],
          ["my-reservations"],
          ["driver-trips"],
          ["driver-stats"],
          ["passengers"],
        ]),
      "reservation:cancelled": () =>
        invalidate([
          ["admin-reservations"],
          ["admin-stats"],
          ["admin-recent-reservations"],
          ["admin-schedules"],
          ["my-reservations"],
          ["driver-trips"],
          ["driver-stats"],
          ["passengers"],
        ]),
      "schedule:updated": () =>
        invalidate([
          ["admin-schedules"],
          ["admin-schedule-history"],
          ["admin-today-schedules"],
          ["schedules"],
          ["driver-trips"],
          ["driver-stats"],
        ]),
      "schedule:assigned": () =>
        invalidate([["driver-trips"], ["driver-stats"]]),
      "schedule:unassigned": () =>
        invalidate([["driver-trips"], ["driver-stats"]]),
      "parcel:created": () =>
        invalidate([["admin-parcels"], ["parcel-stats"]]),
      "parcel:updated": () =>
        invalidate([["admin-parcels"], ["parcel-stats"]]),
      "parcel:status": () =>
        invalidate([["admin-parcels"], ["parcel-stats"]]),
      "parcel:payment": () =>
        invalidate([["admin-parcels"], ["parcel-stats"]]),
    };

    const eventsToBind: readonly string[] = isStaff
      ? STAFF_EVENTS
      : isDriver
        ? DRIVER_EVENTS
        : [];

    for (const event of eventsToBind) {
      socket.on(event, handlers[event]);
    }

    return () => {
      for (const event of eventsToBind) {
        socket.off(event, handlers[event]);
      }
      disconnectSocket();
    };
  }, [token, role, queryClient]);
}
