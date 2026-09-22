import { ArrowLeft, Printer, X } from "lucide-react";
import { useState } from "react";
import type { Parcel } from "../../pages/admin/Parcels";

type PaperSize = "80" | "53";

const STATUS_LABELS: Record<string, string> = {
  registered: "ENREGISTRE",
  in_transit: "EN TRANSIT",
  arrived: "ARRIVE",
  ready_for_pickup: "DISPONIBLE",
  delivered: "RETIRE",
  returned: "RETOURNE",
};

function QRBlock({ text, size = 80 }: { text: string; size?: number }) {
  // Lightweight visual QR-style placeholder using tracking code text.
  // Real QR can be layered later without changing layout.
  const cells = 21;
  const seed = Array.from(text).reduce((a, c) => a + c.charCodeAt(0), 0);
  const matrix: boolean[][] = [];
  for (let y = 0; y < cells; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < cells; x++) {
      const corner =
        (x < 7 && y < 7) ||
        (x >= cells - 7 && y < 7) ||
        (x < 7 && y >= cells - 7);
      if (corner) {
        const lx = x >= cells - 7 ? x - (cells - 7) : x;
        const ly = y >= cells - 7 ? y - (cells - 7) : y;
        row.push(
          lx === 0 || lx === 6 || ly === 0 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4),
        );
      } else {
        row.push(((x * 31 + y * 17 + seed) % 7) < 3);
      }
    }
    matrix.push(row);
  }

  const cell = size / cells;
  return (
    <div
      style={{ width: size, height: size, display: "grid", gridTemplateColumns: `repeat(${cells}, 1fr)` }}
      aria-label={`QR ${text}`}
    >
      {matrix.flatMap((row, y) =>
        row.map((on, x) => (
          <div
            key={`${x}-${y}`}
            style={{ background: on ? "#000" : "#fff", width: cell, height: cell }}
          />
        )),
      )}
    </div>
  );
}

export function ParcelReceipt({
  parcel,
  onClose,
}: {
  parcel: Parcel;
  onClose: () => void;
}) {
  const [paperSize, setPaperSize] = useState<PaperSize>("80");

  const w = paperSize === "80" ? 32 : 20;
  const sep = "═".repeat(w);
  const thinSep = "─".repeat(w);
  const pad = (text: string, len: number) => {
    if (text.length >= len) return text.substring(0, len);
    return text + " ".repeat(len - text.length);
  };

  const remaining = parcel.totalAmount - parcel.paidAmount;
  const depDate = new Date(parcel.departureDate);
  const schedule = parcel.schedule;
  const busLabel = schedule
    ? `${new Date(schedule.date).toLocaleDateString("fr-FR")} ${schedule.time}${
        schedule.vehicleNumber ? ` N°${schedule.vehicleNumber}` : ""
      }`
    : "—";

  const statusLabel = STATUS_LABELS[parcel.status] ?? parcel.status.toUpperCase();

  const receipt = `╔${sep}╗
║${pad(" COTRAM — BORDEAU DE COLIS", w)}║
║${pad(" Transport Interurbain", w)}║
║${pad(" - Madagascar", w)}║
╚${sep}╝

${thinSep}
 DATE EXP.  ${depDate.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
 DEPART      ${(parcel.departure?.name ?? "").toUpperCase().substring(0, 18)}
 ARRIVEE     ${(parcel.arrival?.name ?? "").toUpperCase().substring(0, 18)}
 BUS         ${busLabel}
 STATUT      ${statusLabel}
${thinSep}

 DESCRIPTION
  Type        ${parcel.parcelType}
  Detail      ${(parcel.description ?? "—").substring(0, 24)}
  Note        ${(parcel.note ?? "—").substring(0, 24)}
  Suivi       ${parcel.trackingCode}

 EXPEDITEUR
  Nom         ${parcel.senderName.substring(0, 22)}
  Tel         ${parcel.senderPhone}

 DESTINATAIRE
  Nom         ${parcel.recipientName.substring(0, 22)}
  Tel         ${parcel.recipientPhone}
  Code retrait ${parcel.retrievalCode}

${thinSep}
 PAIEMENT
  Frais trans. ${parcel.transportFee.toLocaleString()} Ar
  Total payer  ${parcel.totalAmount.toLocaleString()} Ar
  Payee        ${parcel.paidAmount.toLocaleString()} Ar
  Reste payer  ${remaining.toLocaleString()} Ar
${thinSep}

 Merci de votre confiance !
 Suivi: ${parcel.trackingCode}

${thinSep}
 HAFATRA / CONDITIONS
 - Retour: penalite 20%
 - Retrait: 8h-17h
 - Stockage: ${parcel.storageFeePerDay.toLocaleString()} Ar/j
   apres 7 jours
 - 1 mois non retire: depot
${thinSep}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-4">
        <div className="bg-gray-900 text-white px-6 py-5 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-1">
                Bordereau de colis
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
          <div className="flex items-center gap-2 mt-4">
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as PaperSize)}
              className="text-xs border border-white/20 rounded-lg px-2 py-2 bg-white/10 font-medium text-white"
            >
              <option value="80">Papier 80mm</option>
              <option value="53">Papier 53mm</option>
            </select>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-primary/90 ml-auto"
            >
              <Printer size={15} /> Imprimer
            </button>
          </div>
        </div>

        <div className="p-4 print:p-0">
          <div
            className="mx-auto print:mx-0"
            style={{ maxWidth: paperSize === "80" ? "320px" : "200px" }}
          >
            <div className="bg-white border border-gray-200 rounded-xl p-3 print:border-black print:rounded-none print:p-1">
              <div className="flex justify-center mb-2 print:mb-1">
                <QRBlock text={parcel.trackingCode} size={paperSize === "80" ? 72 : 56} />
              </div>
              <pre className="font-mono text-[10px] leading-snug whitespace-pre break-all print:text-black">
{receipt}
              </pre>
            </div>
          </div>

          <div className="mt-4 print:hidden flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ArrowLeft size={14} /> Retour
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <Printer size={15} /> Imprimer
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            margin: 2mm;
            width: ${paperSize === "80" ? "80mm" : "53mm"};
          }
          * { box-shadow: none !important; text-shadow: none !important; }
          body { margin: 0; padding: 0; background: white !important; }
          nav, footer, header, .print\\:hidden { display: none !important; }
          pre {
            font-family: "Courier New", "Consolas", monospace !important;
            font-size: ${paperSize === "80" ? "10px" : "8px"} !important;
            line-height: 1.25 !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
            border: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: ${paperSize === "80" ? "80mm" : "53mm"} !important;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
