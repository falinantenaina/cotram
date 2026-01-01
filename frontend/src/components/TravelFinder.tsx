import { Calendar, MapPin } from "lucide-react";
import { Container } from "./ui/Container";

export const TravelFinder = () => {
  const today = new Date().toISOString().split("T")[0];

  console.log(today);

  return (
    <Container className="max-sm:hidden absolute bottom-0 w-max max-w-full translate-y-1/2 left-1/2 -translate-x-1/2">
      <div className="bg-white text-dark-gray px-4 py-4 Z lg:px-8 max-w-7xl mx-auto rounded shadow-2xl">
        <div className="flex gap-x-2 lg:gap-x-6">
          {/* Departure */}
          <div>
            <label htmlFor="departure" className="uppercase">
              Départ
            </label>
            <div className="relative ">
              <MapPin
                className="absolute left-2 top-1/2 -translate-y-1/2 text-dark-gray size-5"
                strokeWidth={1}
              />
              <input
                type="text"
                name="departure"
                id="departure"
                placeholder="Antananarivo"
                className="w-full rounded bg-gray-200 py-2 px-8 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Destination */}
          <div className="">
            <label htmlFor="destination" className="uppercase">
              Destination
            </label>
            <div className="relative ">
              <MapPin
                className="absolute left-2 top-1/2 -translate-y-1/2 text-dark-gray size-5"
                strokeWidth={1}
              />
              <input
                type="text"
                name="destination"
                id="destination"
                placeholder="Antsirabe"
                className="w-full rounded bg-gray-200 py-2 px-8 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
          {/* Date */}
          <div className="">
            <label htmlFor="date" className="uppercase">
              Date
            </label>
            <div className="relative ">
              <Calendar
                className="absolute left-2 top-1/2 -translate-y-1/2 text-dark-gray size-5"
                strokeWidth={1}
              />
              <input
                type="date"
                name="destination"
                min={today}
                defaultValue={today}
                id="destination"
                placeholder="Antsirabe"
                className="w-full rounded bg-gray-200 py-2 px-8 focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
