import type { SeatConfig } from "../config/seatLayouts";
import api from "../lib/axios";

export interface SeatTemplate {
  _id: string;
  name: string;
  seatConfig: SeatConfig;
  updatedAt: string;
}

export const seatTemplateApi = {
  getAll: async (): Promise<SeatTemplate[]> => {
    const { data } = await api.get("/seat-templates");
    return data.templates;
  },
  create: async (
    name: string,
    seatConfig: SeatConfig,
  ): Promise<SeatTemplate> => {
    const { data } = await api.post("/seat-templates", { name, seatConfig });
    return data.template;
  },
  update: async (
    id: string,
    name: string,
    seatConfig: SeatConfig,
  ): Promise<SeatTemplate> => {
    const { data } = await api.put(`/seat-templates/${id}`, {
      name,
      seatConfig,
    });
    return data.template;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/seat-templates/${id}`);
  },
};
