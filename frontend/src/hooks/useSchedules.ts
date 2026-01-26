import { useQuery } from "@tanstack/react-query";
import { scheduleApi, type ScheduleFilters } from "../api/scheduleApi";

export const useSchedules = (filters?: ScheduleFilters) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["schedules", filters],
    queryFn: () => scheduleApi.getSchedules(filters),
    enabled: !!(filters?.departure && filters?.destination && filters?.date),
  });

  return {
    schedules: data || [],
    isLoading,
    error,
    refetch,
  };
};

export const useSchedule = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["schedule", id],
    queryFn: () => scheduleApi.getSchedule(id),
    enabled: !!id,
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });

  return {
    schedule: data,
    isLoading,
    error,
  };
};
