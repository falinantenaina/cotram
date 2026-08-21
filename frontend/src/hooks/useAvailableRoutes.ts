import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";
import type { Schedule } from "../api/scheduleApi";

export const useAvailableRoutes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["available-routes"],
    queryFn: async () => {
      const { data } = await api.get("/schedules");
      const now = new Date();
      return data.schedules.filter((s: Schedule) => {
        if (s.status === "cancelled" || s.availableSeats <= 0) return false;
        const [h, m] = s.time.split(":").map(Number);
        const dep = new Date(s.date);
        dep.setHours(h!, m!, 0, 0);
        return dep > now;
      });
    },
  });

  const schedules = data || [];

  const availableDepartures: string[] = [
    ...new Set(
      schedules.map((s: Schedule) => (s as any).route?.departure?.name).filter(Boolean),
    ),
  ] as string[];

  const getAvailableDestinations = (departure?: string): string[] => {
    return [
      ...new Set(
        schedules
          .filter(
            (s: Schedule) => !departure || (s as any).route?.departure?.name === departure,
          )
          .map((s: Schedule) => (s as any).route?.destination?.name)
          .filter(Boolean),
      ),
    ] as string[];
  };

  return {
    availableDepartures,
    getAvailableDestinations,
    isLoading,
  };
};
