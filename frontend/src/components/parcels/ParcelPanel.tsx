import {
  Banknote,
  Edit,
  History,
  MapPin,
  Package,
  Printer,
  Truck,
  X,
} from "lucide-react";
import { STATUS_CONFIG, type Parcel } from "../../pages/admin/Parcels";

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  unpaid: { label: "Non payé", cls: "bg-red-100 text-red-700" },
  partial: { label: "Partiel", cls: "bg-amber-100 text-amber-700" },
  paid: { label: "Payé", cls: "bg-emerald-100 text-emerald-700" },
};

export function ParcelPanel({
  parcel,
  onClose,
  onEdit,
  onReceipt,
  onPay,
  onStatusChange,
}: {
  parcel: Parcel;
  onClose: () => void;
  onEdit: () => void;
  onReceipt: (p: Parcel) => void;
  onPay: (p: Parcel) => void;
  onStatusChange: (p: Parcel, s: any) => void;
}) {
  const st = STATUS_CONFIG[parcel.status];
  const pay = PAYMENT_CONFIG[parcel.paymentStatus];
  const remaining = parcel.totalAmount - parcel.paidAmount;
  const schedule = parcel.schedule;

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 text-right font-medium">
        {value}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-4">
        <div className="bg-gray-900 text-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-primary rounded-xl flex items-center justify-center">
                <Package size={18} className="text-black" />
              </div>
              <div>
                <p className="font-mono font-black text-sm">{parcel.trackingCode}</p>
                <p className="text-white/40 text-xs">{parcel.parcelType}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-2 mt-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${st.cls}`}>
              {st.label}
            </span>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${pay.cls}`}>
              {pay.label}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Route */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              <MapPin size={13} /> Trajet
            </div>
            <p className="font-bold text-gray-900">
              {parcel.departure?.name} → {parcel.arrival?.name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Départ le{" "}
              {new Date(parcel.departureDate).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {parcel.arrivalDate && (
              <p className="text-xs text-gray-400">
                Arrivée le{" "}
                {new Date(parcel.arrivalDate).toLocaleDateString("fr-FR")}
              </p>
            )}
            {schedule && (
              <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-600">
                <Truck size={12} className="text-primary" />
                <span>
                  Bus {new Date(schedule.date).toLocaleDateString("fr-FR")}{" "}
                  {schedule.time}
                  {schedule.vehicleNumber ? ` · ${schedule.vehicleNumber}` : ""}
                  {schedule.driver
                    ? ` · ${schedule.driver.firstName} ${schedule.driver.lastName}`
                    : ""}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Description
            </p>
            <div className="text-sm text-gray-700 space-y-1">
              {row("Type", parcel.parcelType)}
              {parcel.description && row("Détail", parcel.description)}
              {parcel.note && row("Note", parcel.note)}
              {parcel.weightKg != null && row("Poids", `${parcel.weightKg} kg`)}
              {row("Code de retrait", <span className="font-mono font-bold">{parcel.retrievalCode}</span>)}
              {row("Créé par", parcel.createdBy?.name ?? "—")}
            </div>
          </div>

          {/* People */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Expéditeur
              </p>
              <p className="font-semibold text-gray-900 text-sm">
                {parcel.senderName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {parcel.senderPhone}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Destinataire
              </p>
              <p className="font-semibold text-gray-900 text-sm">
                {parcel.recipientName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {parcel.recipientPhone}
              </p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Paiement
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${pay.cls}`}
              >
                {pay.label}
              </span>
            </div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Frais de transport</span>
                <span className="font-semibold">
                  {parcel.transportFee.toLocaleString()} Ar
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total à payer</span>
                <span className="font-bold">
                  {parcel.totalAmount.toLocaleString()} Ar
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Payée</span>
                <span className="font-semibold text-emerald-600">
                  {parcel.paidAmount.toLocaleString()} Ar
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-primary/20">
                <span className="text-gray-500 font-bold">Reste à payer</span>
                <span
                  className={`font-black ${remaining > 0 ? "text-red-600" : "text-emerald-600"}`}
                >
                  {remaining.toLocaleString()} Ar
                </span>
              </div>
            </div>
          </div>

          {/* History */}
          {parcel.history && parcel.history.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                <History size={13} /> Historique
              </p>
              <div className="space-y-2">
                {parcel.history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start gap-3 text-sm bg-gray-50 rounded-lg p-3"
                  >
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${STATUS_CONFIG[h.status]?.cls ?? "bg-gray-100"}`}
                    >
                      {STATUS_CONFIG[h.status]?.label ?? h.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      {h.note && (
                        <p className="text-gray-700 text-xs">{h.note}</p>
                      )}
                      <p className="text-gray-400 text-[11px] mt-0.5">
                        {h.performedBy ? `${h.performedBy} · ` : ""}
                        {new Date(h.createdAt).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 pb-6 flex flex-wrap gap-2">
          <button
            onClick={() => onReceipt(parcel)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90"
          >
            <Printer size={14} /> Bordereau
          </button>
          {parcel.paymentStatus !== "paid" && (
            <button
              onClick={() => onPay(parcel)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm border border-emerald-200 hover:bg-emerald-100"
            >
              <Banknote size={14} /> Encaisser
            </button>
          )}
          <button
            onClick={() => onEdit(parcel)}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-50"
          >
            <Edit size={14} /> Modifier
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-gray-200 text-gray-500 font-semibold rounded-xl text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
