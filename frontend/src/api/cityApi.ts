import api from "../lib/axios";

export interface City {
  id: string;
  name: string;
  region?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const cityApi = {
  getCities: async (): Promise<City[]> => {
    const { data } = await api.get("/cities");
    return data.cities;
  },

  getAllCities: async (): Promise<City[]> => {
    const { data } = await api.get("/cities/all");
    return data.cities;
  },

  getCity: async (id: string): Promise<City> => {
    const { data } = await api.get(`/cities/${id}`);
    return data.city;
  },

  createCity: async (cityData: { name: string; region?: string }): Promise<City> => {
    const { data } = await api.post("/cities", cityData);
    return data.city;
  },

  updateCity: async (id: string, cityData: { name?: string; region?: string; isActive?: boolean }): Promise<City> => {
    const { data } = await api.put(`/cities/${id}`, cityData);
    return data.city;
  },

  deleteCity: async (id: string): Promise<void> => {
    await api.delete(`/cities/${id}`);
  },
};
