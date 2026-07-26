// frontend/src/api/vehicleTemplateApi.ts
import type { SeatConfig } from "../config/seatLayouts";
import api from "../lib/axios";

export interface VehicleTemplate {
  id: string;
  vehicleType: "Crafter" | "Sprinter" | "Transit";
  seatConfig: SeatConfig;
  updatedAt: string;
}

export const vehicleTemplateApi = {
  getAll: async (): Promise<VehicleTemplate[]> => {
    const { data } = await api.get("/vehicle-templates");
    return data.templates;
  },
  getByType: async (vehicleType: string): Promise<VehicleTemplate | null> => {
    try {
      const { data } = await api.get(`/vehicle-templates/${vehicleType}`);
      return data.template;
    } catch {
      return null;
    }
  },
  save: async (
    vehicleType: string,
    seatConfig: SeatConfig,
  ): Promise<VehicleTemplate> => {
    const { data } = await api.put(`/vehicle-templates/${vehicleType}`, {
      seatConfig,
    });
    return data.template;
  },
};
