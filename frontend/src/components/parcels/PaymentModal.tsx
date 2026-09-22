import { Loader, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../lib/axios";
import type { Parcel } from "../../pages/admin/Parcels";

const METHODS = [
  { key: "cash", label: "Espèces" },
  { key: "mvola", label: "MVola" },
  { key: "orange_money", label: "Orange Money" },
  { key: "bank", label: "Virement" },
];

export function PaymentModal({
  parcel,
  onClose,
  onSuccess,
}: {
  parcel: Parcel;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const remaining = parcel.totalAmount - parcel.paidAmount;
  const [amount, setAmount] = useState(String(remaining));
  const [method, setMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      return api.post(`/parcels/${parcel.id}/pay`, {
        amount: Number(amount),
        method,
        note: note || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-parcels"] });
      queryClient.invalidateQueries({ queryKey: ["parcel-stats"] });
      onSuccess();
      onClose();
    },
    onError: (err: any) =>
      setError(err?.response?.data?.message ?? "Erreur lors du paiement"),
  });

  const payAmount = Number(amount || 0);
  const valid = payAmount > 0 && payAmount <= remaining;

  const inp =
    "w-full border border-gray-200 rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-gray-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                Encaisser un paiement
              </p>
              <h2 className="text-lg font-black font-mono">
                {parcel.trackingCode}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Total à payer</span>
              <span className="font-bold">
                {parcel.totalAmount.toLocaleString()} Ar
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Déjà payé</span>
              <span className="font-semibold text-emerald-600">
                {parcel.paidAmount.toLocaleString()} Ar
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-200">
              <span className="font-bold text-gray-700">Reste</span>
              <span className="font-black text-red-600">
                {remaining.toLocaleString()} Ar
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Montant à encaisser (Ar) *
            </label>
            <input
              type="number"
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inp}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setAmount(String(remaining))}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Solde total
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Méthode
            </label>
            <div className="flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMethod(m.key)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    method === m.key
                      ? "border-primary bg-primary text-black"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Note (optionnel)
            </label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ex: Complément à la livraison"
              className={inp}
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 text-sm"
          >
            Annuler
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!valid || mutation.isPending}
            className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending && <Loader size={14} className="animate-spin" />}
            Encaisser
          </button>
        </div>
      </div>
    </div>
  );
}
