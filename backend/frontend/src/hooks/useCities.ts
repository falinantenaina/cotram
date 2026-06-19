import { useQuery } from "@tanstack/react-query";
import { cityApi } from "../api/cityApi";

export const useCities = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cities"],
    queryFn: () => cityApi.getCities(),
  });

  return {
    cities: data || [],
    isLoading,
    error,
    refetch,
  };
};

export const useCity = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["city", id],
    queryFn: () => cityApi.getCity(id),
    enabled: !!id,
  });

  return {
    city: data,
    isLoading,
    error,
  };
};
