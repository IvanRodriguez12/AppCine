export interface Ticket {
  id?: string; // ID del documento en Firestore
  userId: string;
  showtimeId: string;
  asientos: string[];
  total: number;
  metodoPago: string;
  estado: 'confirmado' | 'pendiente' | 'cancelado';
  createdAt: FirebaseFirestore.Timestamp;
  qrCodeUrl?: string;
  token?: string;
}