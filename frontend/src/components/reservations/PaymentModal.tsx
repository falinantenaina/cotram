import { CheckCircle, Loader, Phone, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { reservationApi } from "../../api/reservationApi";
import { useInitiatePayment, usePaymentStatus } from "../../hooks/useReservation";
import { useReservationTempStore } from "../../stores/reservationStore";
import mvolaLogo from "../../assets/mvola.svg";
import orangeLogo from "../../assets/orangemoney.svg";
import { isValidPhone, normalizePhone } from "../../lib/phone";

type PaymentMethod = "mvola" | "orange_money" | "cash";
type PaymentStep = "method" | "phone" | "processing" | "success" | "error";

interface SuccessInfo {
  reservationId: string | null;
  method: PaymentMethod;
  seats: number[];
  amount: number;
  phone?: string;
}

interface Props {
  scheduleId: string;
  seats: number[];
  totalPrice: number;
  onClose: () => void;
}

const METHOD_CONFIG: Record<
  PaymentMethod,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  mvola: {
    label: "MVola",
    color: "text-red-600",
    bg: "bg-red-50 border-red-200 hover:border-red-400",
    icon: <img src={mvolaLogo} alt="MVola" className="h-8 w-auto" />,
  },
  orange_money: {
    label: "Orange Money",
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200 hover:border-orange-400",
    icon: <img src={orangeLogo} alt="Orange Money" className="h-8 w-auto" />,
  },
  cash: {
    label: "Espèce (au comptoir)",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    icon: "💵",
  },
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 100; // 5 minutes

export function PaymentModal({ scheduleId, seats, totalPrice, onClose }: Props) {
  const { initiatePayment } = useInitiatePayment();
  const { checkStatus } = usePaymentStatus();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { clearReservation } = useReservationTempStore();

  const [step, setStep] = useState<PaymentStep>("method");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pollAttempts, setPollAttempts] = useState(0);
  const [successInfo, setSuccessInfo] = useState<SuccessInfo | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const paymentIdRef = useRef<string | null>(null);
  const reservationIdRef = useRef<string | null>(null);
  const cancelledRef = useRef(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 7)
      return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`;
  };

  const handleSelectMethod = (m: PaymentMethod) => {
    setMethod(m);
    if (m === "cash") {
      setStep("processing");
      submitCash();
    } else {
      setStep("phone");
    }
  };

  const handlePay = () => {
    if (!method || !isValidPhone(phone)) return;
    setStep("processing");
    submitMvola(method);
  };

  const showSuccess = (info: SuccessInfo) => {
    setSuccessInfo(info);
    setStep("success");
  };

  const submitCash = async () => {
    try {
      // Bypass mutation onSuccess auto-navigate — show success in modal first
      const reservation = await reservationApi.createReservation({
        scheduleId,
        seats,
        paymentMethod: "cash",
      });
      reservationIdRef.current = reservation.id;
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      showSuccess({
        reservationId: reservation.id,
        method: "cash",
        seats: [...seats],
        amount: totalPrice,
      });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMsg(msg || "Erreur lors de la création de la réservation");
      setStep("error");
    }
  };

  const submitMvola = async (m: PaymentMethod) => {
    try {
      // 1. Initiate Mvola payment (holds seats, NO reservation yet)
      const cleanPhone = normalizePhone(phone);
      const payment = await initiatePayment({
        scheduleId,
        seats,
        phone: cleanPhone,
        method: m,
      });
      paymentIdRef.current = payment.paymentId;

      // 2. Poll — reservation is created by the backend only when payment completes
      setPollAttempts(0);
      pollPaymentStatus();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setErrorMsg(msg || "Erreur lors du paiement");
      setStep("error");
    }
  };

  const pollPaymentStatus = async () => {
    if (cancelledRef.current || !paymentIdRef.current) return;

    try {
      const status = await checkStatus(paymentIdRef.current);

      if (status.status === "completed") {
        // Reservation created server-side — do NOT clear store yet (would unmount modal)
        reservationIdRef.current = status.reservationId;
        queryClient.invalidateQueries({ queryKey: ["reservations"] });
        queryClient.invalidateQueries({ queryKey: ["schedules"] });
        showSuccess({
          reservationId: status.reservationId,
          method: method || "mvola",
          seats: [...seats],
          amount: totalPrice,
          phone,
        });
        return;
      }

      if (status.status === "failed") {
        setErrorMsg("Le paiement a échoué. Aucune réservation n'a été créée.");
        setStep("error");
        return;
      }

      // Still pending — schedule next poll
      setPollAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_POLL_ATTEMPTS) {
          setErrorMsg("Délai de paiement dépassé. Aucune réservation n'a été créée.");
          setStep("error");
          return next;
        }
        pollTimerRef.current = setTimeout(pollPaymentStatus, POLL_INTERVAL_MS);
        return next;
      });
    } catch {
      // Network error — retry
      setPollAttempts((prev) => {
        const next = prev + 1;
        if (next >= MAX_POLL_ATTEMPTS) {
          setErrorMsg("Impossible de vérifier le statut du paiement.");
          setStep("error");
          return next;
        }
        pollTimerRef.current = setTimeout(pollPaymentStatus, POLL_INTERVAL_MS);
        return next;
      });
    }
  };

  const handleSuccessClose = () => {
    const id = successInfo?.reservationId ?? reservationIdRef.current;
    if (id) {
      navigate(`/reservation/${id}/boarding-pass`);
    }
    clearReservation();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Don't allow backdrop dismiss on success (would lose the receipt without navigating)
    if (step === "success") return;
    if (e.target === e.currentTarget) onClose();
  };

  const handleRetry = () => {
    setStep("method");
    setMethod(null);
    setPhone("");
    setErrorMsg("");
    setPollAttempts(0);
    paymentIdRef.current = null;
    reservationIdRef.current = null;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-black text-gray-900">Paiement</h2>
          <button
            onClick={() => {
              if (step === "success") handleSuccessClose();
              else onClose();
            }}
            className="size-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Step: Method selection */}
          {step === "method" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 text-center">
                Comment souhaitez-vous payer ?
              </p>

              <div className="space-y-3">
                {(Object.keys(METHOD_CONFIG) as PaymentMethod[]).map((m) => {
                  const cfg = METHOD_CONFIG[m];
                  return (
                    <button
                      key={m}
                      onClick={() => handleSelectMethod(m)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${cfg.bg}`}
                    >
                      <span className="flex items-center justify-center size-12 shrink-0 rounded-lg bg-white border border-gray-100">{cfg.icon}</span>
                      <div className="flex-1">
                        <p className={`font-bold ${cfg.color}`}>{cfg.label}</p>
                        {m === "cash" && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Payez directement à la gare
                          </p>
                        )}
                        {m !== "cash" && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Paiement mobile instantané
                          </p>
                        )}
                      </div>
                      <span className="text-gray-300">→</span>
                    </button>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 mt-4">
                <span className="text-sm text-gray-500">Total à payer</span>
                <span className="text-xl font-black text-gray-900">
                  {totalPrice.toLocaleString()} Ar
                </span>
              </div>
            </div>
          )}

          {/* Step: Phone input */}
          {step === "phone" && method && (
            <div className="space-y-4">
              <button
                onClick={() => setStep("method")}
                className="text-xs text-primary hover:underline font-semibold"
              >
                ← Changer de méthode
              </button>

              <div className="text-center py-2">
                <div className="flex justify-center">{METHOD_CONFIG[method].icon}</div>
                <h3 className="font-bold text-gray-900 mt-2">
                  Payer via {METHOD_CONFIG[method].label}
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Numéro de téléphone
                </label>
                <div className="relative">
                  <Phone
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    placeholder="034 00 000 00"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Vous recevrez une demande de confirmation sur votre téléphone
                </p>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="text-lg font-black text-gray-900">
                  {totalPrice.toLocaleString()} Ar
                </span>
              </div>

              <button
                onClick={handlePay}
                disabled={!isValidPhone(phone)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  isValidPhone(phone)
                    ? "bg-primary text-black hover:bg-primary/90"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                Payer via {METHOD_CONFIG[method].label}
              </button>
            </div>
          )}

          {/* Step: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="size-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Loader size={32} className="text-primary animate-spin" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">
                  {method === "cash" ? "Création en cours..." : "Paiement en cours..."}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {method === "cash"
                    ? "Veuillez patienter"
                    : "Confirmez la demande sur votre téléphone MVola"}
                </p>
                {method !== "cash" && pollAttempts > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Vérification du statut... ({pollAttempts})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && successInfo && (
            <div className="flex flex-col items-center py-6 space-y-4">
              <div className="size-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">
                  {successInfo.method === "cash"
                    ? "Réservation créée !"
                    : "Paiement effectué !"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {successInfo.method === "cash"
                    ? "Présentez-vous au comptoir pour payer"
                    : "Votre réservation est confirmée"}
                </p>
              </div>

              <div className="w-full bg-gray-50 rounded-xl px-4 py-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Siège(s)</span>
                  <span className="font-semibold text-gray-900">
                    {successInfo.seats.join(", ")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Montant payé</span>
                  <span className="font-black text-gray-900">
                    {successInfo.amount.toLocaleString()} Ar
                  </span>
                </div>
                {successInfo.method !== "cash" && successInfo.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Téléphone</span>
                    <span className="font-semibold text-gray-900">
                      {successInfo.phone}
                    </span>
                  </div>
                )}
                {successInfo.method !== "cash" && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Méthode</span>
                    <span className="font-semibold text-gray-900">
                      {successInfo.method === "mvola" ? "MVola" : "Orange Money"}
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={handleSuccessClose}
                className="w-full py-3 bg-primary text-black font-bold rounded-xl hover:bg-primary/90"
              >
                Voir mon billet
              </button>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="size-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-gray-900 text-lg">Erreur</h3>
                <p className="text-sm text-gray-500 mt-1">{errorMsg}</p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
