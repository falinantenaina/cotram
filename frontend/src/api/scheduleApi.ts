// frontend/src/api/scheduleApi.ts
import api from "../lib/axios";

export interface Schedule {
  id: string;
  route: {
    id: string;
    departure: { id: string; name: string; region?: string | null };
    destination: { id: string; name: string; region?: string | null };
    duration: string;
    distance: number;
    price: number;
  };
  date: string;
  time: string;
  vehicle: string;
  totalSeats: number;
  availableSeats: number;
  occupiedSeats: number[];
  price: number;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  seatTemplateId?: string | null;
  seatConfig?: {
    totalSeats: number;
    layoutName?: string;
    rows: Array<{
      row: number;
      isBackBench: boolean;
      label?: string;
      seats: Array<{
        id: number;
        row: number;
        col: number;
        position: "left" | "middle" | "right";
      }>;
    }>;
  } | null;
}

export interface ScheduleFilters {
  departure?: string;
  destination?: string;
  date?: string;
}

export const scheduleApi = {
  getSchedules: async (filters?: ScheduleFilters): Promise<Schedule[]> => {
    const params = new URLSearchParams();
    if (filters?.departure) params.append("departure", filters.departure);
    if (filters?.destination) params.append("destination", filters.destination);
    if (filters?.date) params.append("date", filters.date);
    const { data } = await api.get(`/schedules?${params.toString()}`);
    return data.schedules;
  },

  getSchedule: async (id: string): Promise<Schedule> => {
    const { data } = await api.get(`/schedules/${id}`);
    return data.schedule;
  },
};
