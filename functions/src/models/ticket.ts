// src/models/Ticket.ts
export interface Ticket {
  id?: string;
  userId: string;        // luego lo podés sacar de Firebase Auth
  showtimeId: string;    // referencia al showtime
  asientos: string[];    // ['A1', 'A2']
  total: number;         // total final que pagó
  metodoPago: string;    // 'Tarjeta', 'Billetera'
  estado: 'confirmado' | 'cancelado';
  createdAt: FirebaseFirestore.Timestamp;
}