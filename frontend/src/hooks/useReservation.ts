import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reservationApi,
  paymentApi,
  type CreateReservationData,
  type PaymentInitiateData,
} from "../api/reservationApi";

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

  const mutation = useMutation({
    mutationFn: reservationApi.createReservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      // Do NOT clearReservation/navigate here — PaymentModal shows success first
      // and navigates on "Voir mon billet"
    },
  });

  return {
    createReservation: (data: CreateReservationData) =>
      mutation.mutateAsync(data),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const useInitiatePayment = () => {
  const mutation = useMutation({
    mutationFn: paymentApi.initiate,
  });

  return {
    initiatePayment: (data: PaymentInitiateData) => mutation.mutateAsync(data),
    isLoading: mutation.isPending,
    error: mutation.error,
  };
};

export const usePaymentStatus = () => {
  const mutation = useMutation({
    mutationFn: paymentApi.getStatus,
  });

  return {
    checkStatus: (paymentId: string) => mutation.mutateAsync(paymentId),
    isLoading: mutation.isPending,
  };
};

export const useConfirmReservation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: reservationApi.confirmReservation,
    onSuccess: (data) => {
      queryClient.setQueryData(["reservation", data.id], data);
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
      queryClient.setQueryData(["reservation", data.id], data);
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
