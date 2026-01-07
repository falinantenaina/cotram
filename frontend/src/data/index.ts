import type { Seat, TimeSlot } from "../type";

export const timeSlots: TimeSlot[] = [
  { id: "1", time: "06:00", availableSeats: 12, price: 20000 },
  { id: "2", time: "08:00", availableSeats: 8, price: 20000 },
  { id: "3", time: "10:00", availableSeats: 15, price: 20000 },
  { id: "4", time: "12:00", availableSeats: 5, price: 20000 },
  { id: "5", time: "14:00", availableSeats: 10, price: 20000 },
  { id: "6", time: "16:00", availableSeats: 14, price: 20000 },
];

export const initialSeats: Seat[] = [
  // Rangée 1 (2 sièges - derrière le chauffeur)
  { id: 1, row: 1, position: "middle", status: "available" },
  { id: 2, row: 1, position: "right", status: "available" },
  // Rangée 2 (4 sièges)
  { id: 3, row: 2, position: "left", status: "available" },
  { id: 4, row: 2, position: "middle", status: "occupied" },
  { id: 5, row: 2, position: "middle", status: "available" },
  { id: 6, row: 2, position: "right", status: "available" },
  // Rangée 3 (3 sièges)
  { id: 7, row: 3, position: "left", status: "available" },
  { id: 8, row: 3, position: "middle", status: "available" },
  { id: 9, row: 3, position: "right", status: "available" },
  // Rangée 4 (3 sièges)
  { id: 10, row: 4, position: "left", status: "occupied" },
  { id: 11, row: 4, position: "middle", status: "available" },
  { id: 12, row: 4, position: "right", status: "available" },
  // Rangée 5 (4 sièges - banquette arrière)
  { id: 13, row: 5, position: "left", status: "available" },
  { id: 14, row: 5, position: "middle", status: "available" },
  { id: 15, row: 5, position: "middle", status: "available" },
  { id: 16, row: 5, position: "right", status: "available" },
];
