import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  reservationApi,
  type CreateReservationData,
} from "../api/reservationApi";
import { useReservationTempStore } from "../stores/reservationStore";

export const useReservations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reservations"],
    queryFn: reservationApi.getReservations,
  });

  return {
    reservations: data || [],
    isLoading,
    error,
  };
};

export const useReservation = (id: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["reservation", id],
    queryFn: () => reservationApi.getReservation(id),
    enabled: !!id,
  });

  return {
    reservation: data,
    isLoading,
    error,
  };
};

export const useCreateReservation = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { clearReservation } = useReservationTempStore();

  const mutation = useMutation({
    mutationFn: reservationApi.createReservation,
    onSuccess: (data) => {
      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });

      // Clear le store temporaire
      clearReservation();

      // Afficher un message de succès (vous pouvez utiliser toast)
      alert(`Réservation créée ! Référence: ${data.bookingReference}`);

      // Rediriger vers mes réservations
      navigate("/my-reservations");
    },
  });

  return {
    createReservation: (data: CreateReservationData) =>
      mutation.mutateAsync(data),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useConfirmReservation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: reservationApi.confirmReservation,
    onSuccess: (data) => {
      queryClient.setQueryData(["reservation", data._id], data);
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });

  return {
    confirmReservation: (id: string) => mutation.mutateAsync(id),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useCancelReservation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: reservationApi.cancelReservation,
    onSuccess: (data) => {
      queryClient.setQueryData(["reservation", data._id], data);
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });

  return {
    cancelReservation: (id: string) => mutation.mutateAsync(id),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};
