import {
  ArrowLeft,
  Printer,
  Ticket,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container } from "../components/ui/Container";
import { useAuth } from "../hooks/useAuth";
import { useReservation } from "../hooks/useReservation";

type PaperSize = "80" | "53";

const BoardingPass = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { reservation, isLoading } = useReservation(id ?? "");
  const [paperSize, setPaperSize] = useState<PaperSize>("80");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Ticket size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Réservation introuvable
          </h2>
          <button
            onClick={() => navigate("/my-reservations")}
            className="text-primary hover:underline font-semibold text-sm"
          >
            Retour à mes réservations
          </button>
        </div>
      </div>
    );
  }

  const depDate = new Date(reservation.schedule.date);
  const departure = reservation.schedule?.route?.departure;
  const destination = reservation.schedule?.route?.destination;
  const depName =
    departure && typeof departure === "object"
      ? departure.name
      : typeof departure === "string"
        ? departure
        : "—";
  const destName =
    destination && typeof destination === "object"
      ? destination.name
      : typeof destination === "string"
        ? destination
        : "—";
  const passengerName = reservation.user?.name ?? authUser?.name ?? "—";
  const statusLabel =
    reservation.status === "confirmed"
      ? "CONFIRMEE"
      : reservation.status === "pending"
        ? "EN ATTENTE"
        : reservation.status === "cancelled"
          ? "ANNULEE"
          : "TERMINEE";

  const paymentLabel =
    reservation.paymentMethod === "mvola"
      ? "MVola"
      : reservation.paymentMethod === "orange_money"
        ? "Orange Money"
        : reservation.paymentMethod === "cash"
          ? "ESPECE"
          : null;

  const isPrintable =
    reservation.status === "confirmed" || reservation.status === "pending";

  const handlePrint = () => {
    window.print();
  };

  const sep = "=".repeat(paperSize === "80" ? 32 : 20);
  const thinSep = "-".repeat(paperSize === "80" ? 32 : 20);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen header */}
      <div className="bg-white border-b border-gray-100 print:hidden">
        <Container className="py-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/my-reservations")}
            className="size-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-gray-900">
              Billet de voyage
            </h1>
            <p className="text-gray-400 text-xs">
              Référence {reservation.bookingReference}
            </p>
          </div>
          {isPrintable && (
            <div className="flex items-center gap-2">
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-2 bg-white font-medium text-gray-700"
              >
                <option value="80">Papier 80mm</option>
                <option value="53">Papier 53mm</option>
              </select>
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 bg-primary text-black font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors"
              >
                <Printer size={15} />
                Imprimer
              </button>
            </div>
          )}
        </Container>
      </div>

      {/* Screen preview */}
      <Container className="py-8 print:py-0 print:px-0">
        <div className="mx-auto print:mx-0" style={{ maxWidth: paperSize === "80" ? "320px" : "200px" }}>
          {/* Ticket */}
          <pre className="font-mono text-[11px] leading-tight bg-white border border-gray-200 rounded-xl p-4 print:border-black print:rounded-none print:p-2 overflow-x-auto whitespace-pre-wrap break-words">
{`╔${sep}╗
║           COTRAM - BILLET DE VOYAGE           ║
║       Transport Interurbain - Madagascar       ║
╚${sep}╝

${thinSep}
  ${depName.toUpperCase().substring(0, 12)}  →  ${destName.toUpperCase().substring(0, 12)}
${thinSep}

  DATE      : ${depDate.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
  HEURE     : ${reservation.schedule.time}
  PASSAGER  : ${passengerName.substring(0, 20)}
  SIEGES    : ${reservation.seats.join(", ")}
  STATUT    : ${statusLabel}${paymentLabel ? `
  PAIEMENT  : ${paymentLabel}` : ""}

${thinSep}
  REFERENCE : ${reservation.bookingReference}
  TOTAL     : ${reservation.totalPrice.toLocaleString()} Ar
${thinSep}

  ⚠ Présentez-vous 15 min avant le départ
  ⚠ Munissez-vous d'un pièce d'identité

╔${sep}╗
║          COTRAM — Antananarivo • Antsirabe     ║
╚${sep}╝`}
          </pre>
        </div>

        {/* Info notice - hidden on print */}
        <div className="mt-6 print:hidden">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-bold text-amber-800 text-sm mb-2">
              Instructions
            </h3>
            <ul className="space-y-1.5 text-xs text-amber-700">
              <li>
                • Présentez-vous à la gare <strong>15 minutes</strong> avant le
                départ
              </li>
              <li>
                • Référence :{" "}
                <strong className="font-mono">
                  {reservation.bookingReference}
                </strong>
              </li>
              <li>• Un document d'identité peut être requis</li>
              {reservation.status === "pending" && (
                <li>
                  • En attente de confirmation — finalisez le paiement au
                  comptoir
                </li>
              )}
            </ul>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate("/my-reservations")}
              className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 text-sm hover:bg-gray-50 transition-colors"
            >
              Mes réservations
            </button>
            <button
              onClick={() => navigate("/reservation")}
              className="flex-1 py-3 bg-primary text-black font-bold rounded-xl text-sm hover:bg-primary/90 transition-colors"
            >
              Nouvelle réservation
            </button>
          </div>
        </div>
      </Container>

      {/* Print styles for thermal paper */}
      <style>{`
        @media print {
          @page {
            margin: 2mm;
            width: ${paperSize === "80" ? "80mm" : "53mm"};
          }
          * { box-shadow: none !important; text-shadow: none !important; }
          body { margin: 0; padding: 0; background: white !important; }
          nav, footer, header, .print\\:hidden, main > div > div:last-child { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
          pre {
            font-family: "Courier New", "Consolas", monospace !important;
            font-size: ${paperSize === "80" ? "11px" : "9px"} !important;
            line-height: 1.3 !important;
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
};

export default BoardingPass;
