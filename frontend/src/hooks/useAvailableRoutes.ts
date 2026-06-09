import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export const useAvailableRoutes = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["available-routes"],
    queryFn: async () => {
      const { data } = await api.get("/schedules");
      const now = new Date();
      return data.schedules.filter((s: any) => {
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
      schedules.map((s: any) => s.route?.departure?.name).filter(Boolean),
    ),
  ] as string[];

  const getAvailableDestinations = (departure?: string): string[] => {
    return [
      ...new Set(
        schedules
          .filter(
            (s: any) => !departure || s.route?.departure?.name === departure,
          )
          .map((s: any) => s.route?.destination?.name)
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
