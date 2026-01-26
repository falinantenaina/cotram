import { User } from "lucide-react";
import type { Seat, SeatStatus } from "../../type";

type Props = {
  seats: Seat[];
  handleSeatClick: (seatId: number) => void;
};

export const SeatsStep = (props: Props) => {
  const getSeatsByRow = (row: number) => {
    return props.seats.filter((seat) => seat.row === row);
  };

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case "available":
        return "bg-gray-200 hover:bg-gray-300 cursor-pointer";
      case "selected":
        return "bg-primary text-black cursor-pointer";
      case "occupied":
        return "bg-gray-400 cursor-not-allowed opacity-50";
    }
  };

  return (
    <div className="lg:col-span-2">
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        {/* Disponibilité */}
        <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <div className="size-6 bg-gray-200 rounded border border-gray-300"></div>
            <span>Dispnible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-6 bg-primary rounded border border-gray-300"></div>
            <span>Sélectionné</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="size-6 bg-gray-400 rounded border border-gray-300"></div>
            <span>Occupé</span>
          </div>
        </div>
        {/* Siège */}
        <div className="max-w-md mx-auto">
          {/* Row 1: left driver & 2 right */}
          <div className="mb-4">
            <div className="grid grid-cols-7 gap-2 items-center">
              {/* Driver */}
              <div className="col-span-2 h-16 bg-dark-gray rounded flex items-center justify-center text-white">
                <User className="size-8" />
              </div>

              <div className="col-span-1"></div>

              {getSeatsByRow(1).map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => props.handleSeatClick(seat.id)}
                  className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                    seat.status,
                  )}`}
                  disabled={seat.status === "occupied"}
                >
                  {seat.id}
                </button>
              ))}
            </div>
            <span className="text-xs text-gray-600 ml-1">Chauffeur</span>
            <div className="h-px bg-gray-300 mt-4"></div>
          </div>

          {/* Row 2 - 4 sièges */}
          <div className="mb-4">
            <div className="grid grid-cols-8 gap-2">
              {getSeatsByRow(2).map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => props.handleSeatClick(seat.id)}
                  className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                    seat.status,
                  )}`}
                  disabled={seat.status === "occupied"}
                >
                  {seat.id}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3 - 4 - 2 left & 1 right */}
          {[3, 4].map((row) => (
            <div key={row} className="mb-4">
              <div className="grid grid-cols-7 gap-2 items-center">
                {/* Left */}
                {getSeatsByRow(row)
                  .filter((s) => s.position === "left")
                  .map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => props.handleSeatClick(seat.id)}
                      className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                        seat.status,
                      )}`}
                      disabled={seat.status === "occupied"}
                    >
                      {seat.id}
                    </button>
                  ))}
                {getSeatsByRow(row)
                  .filter((s) => s.position === "middle")
                  .map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => props.handleSeatClick(seat.id)}
                      className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                        seat.status,
                      )}`}
                      disabled={seat.status === "occupied"}
                    >
                      {seat.id}
                    </button>
                  ))}

                <div className="col-span-1"></div>
                {/* Right */}
                {getSeatsByRow(row)
                  .filter((s) => s.position === "right")
                  .map((seat) => (
                    <button
                      key={seat.id}
                      onClick={() => props.handleSeatClick(seat.id)}
                      className={`col-span-2 h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                        seat.status,
                      )}`}
                      disabled={seat.status === "occupied"}
                    >
                      {seat.id}
                    </button>
                  ))}
              </div>
            </div>
          ))}
          {/* Row 5 */}
          <div className="mt-6 pt-4 border-t border-gray-300">
            <div className="grid grid-cols-4 gap-2">
              {getSeatsByRow(5).map((seat) => (
                <button
                  key={seat.id}
                  onClick={() => props.handleSeatClick(seat.id)}
                  className={`h-16 rounded-lg border-2 border-gray-300 flex items-center justify-center font-semibold transition ${getSeatColor(
                    seat.status,
                  )}`}
                  disabled={seat.status === "occupied"}
                >
                  {seat.id}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Banquette arrière
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
