import { useQuery } from "@tanstack/react-query";
import api from "../lib/axios";

export type FinancePeriod = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

interface FinanceOverview {
  totalRevenue: number;
  paidReservations: number;
  avgTicket: number;
  occupancyRate: number;
  cancelledReservations: number;
  period: { from: string; to: string };
}

interface RevenueDay {
  date: string;
  revenue: number;
  reservations: number;
}

interface RouteRevenue {
  route: string;
  revenue: number;
  count: number;
}

interface DailySchedule {
  id: string;
  time: string;
  route: string;
  driver: string;
  vehicle: string;
  totalSeats: number;
  occupied: number;
  occupancyRate: number;
  status: string;
  revenue: number;
}

interface DailyReport {
  date: string;
  summary: {
    totalSchedules: number;
    totalRevenue: number;
    totalPassengers: number;
    confirmedReservations: number;
    pendingReservations: number;
    cancelledReservations: number;
  };
  schedules: DailySchedule[];
}

export function useFinanceOverview(period: FinancePeriod, from?: string, to?: string) {
  return useQuery<FinanceOverview>({
    queryKey: ["finance", "overview", period, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const { data } = await api.get(`/admin/finance/overview?${params}`);
      return data;
    },
  });
}

export function useRevenueChart(period: FinancePeriod, from?: string, to?: string) {
  return useQuery<RevenueDay[]>({
    queryKey: ["finance", "revenue", period, from, to],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const { data } = await api.get(`/admin/finance/revenue?${params}`);
      return data.data;
    },
  });
}

export function useRevenueByRoute(from?: string, to?: string) {
  return useQuery<RouteRevenue[]>({
    queryKey: ["finance", "routes", from, to],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString();
      const { data } = await api.get(`/admin/finance/routes${qs ? `?${qs}` : ""}`);
      return data.data;
    },
  });
}

export function useDailyReport(date: string) {
  return useQuery<DailyReport>({
    queryKey: ["finance", "daily", date],
    queryFn: async () => {
      const { data } = await api.get(`/admin/finance/daily?date=${date}`);
      return data;
    },
    enabled: !!date,
  });
}
