// functions/src/services/firestoreTickets.ts
import * as admin from 'firebase-admin';
import { Showtime } from '../models/showtime';
import { Ticket } from '../models/ticket';

const db = admin.firestore();
const showtimesCol = db.collection('showtimes');
const ticketsCol = db.collection('tickets');

/**
 * Devuelve las funciones (showtimes) de una película.
 * Si se pasa fecha, filtra por esa fecha (YYYY-MM-DD).
 */
export async function getShowtimesByMovie(
  movieId: number,
  fecha?: string
): Promise<Showtime[]> {
  let query: FirebaseFirestore.Query = showtimesCol.where('movieId', '==', movieId);

  if (fecha) {
    query = query.where('fecha', '==', fecha);
  }

  const snap = await query.get();

  return snap.docs.map((doc) => {
    const data = doc.data() as any;

    return {
      id: doc.id,
      movieId: data.movieId,
      cinemaId: data.cinemaId,
      salaId: data.salaId,
      fecha: data.fecha,
      hora: data.hora,
      precioBase: data.precioBase,
      asientosOcupados: data.asientosOcupados || data.occupiedSeats || [],
      createdAt: data.createdAt,
    } as Showtime;
  });
}

/**
 * Devuelve un showtime con su id y datos completos.
 */
export async function getShowtimeWithSeats(showtimeId: string): Promise<Showtime> {
  const doc = await showtimesCol.doc(showtimeId).get();

  if (!doc.exists) {
    throw new Error('Showtime no encontrado');
  }

  const data = doc.data() as any;

  return {
    id: doc.id,
    movieId: data.movieId,
    cinemaId: data.cinemaId,
    salaId: data.salaId,
    fecha: data.fecha,
    hora: data.hora,
    precioBase: data.precioBase,
    asientosOcupados: data.asientosOcupados || data.occupiedSeats || [],
    createdAt: data.createdAt,
  };
}

/**
 * Reserva asientos para un showtime y crea un ticket.
 * Se ejecuta dentro de una transacción para evitar colisiones.
 *
 * - Verifica que el showtime existe
 * - Verifica que los asientos no estén ocupados
 * - Actualiza occupiedSeats en el showtime
 * - Crea un Ticket en Firestore
 */
export async function reservarAsientos(
  showtimeId: string,
  userId: string,
  asientos: string[],
  total: number,
  metodoPago: string
): Promise<{ ticketId: string }> {
  if (!asientos || asientos.length === 0) {
    throw new Error('No se proporcionaron asientos a reservar');
  }

  return db.runTransaction(async (tx) => {
    const showtimeRef = showtimesCol.doc(showtimeId);
    const showtimeSnap = await tx.get(showtimeRef);

    if (!showtimeSnap.exists) {
      throw new Error('Showtime no encontrado');
    }

    const data = showtimeSnap.data() as any;

    const ocupadosActuales: string[] =
      data.asientosOcupados || data.occupiedSeats || [];

    // Verificar asientos ocupados
    const conflictos = asientos.filter((a) => ocupadosActuales.includes(a));
    if (conflictos.length > 0) {
      throw new Error(
        `Los siguientes asientos ya están ocupados: ${conflictos.join(', ')}`
      );
    }

    const nuevosOcupados = [...ocupadosActuales, ...asientos];

    // Guardamos siempre en el campo "occupiedSeats"
    tx.update(showtimeRef, { occupiedSeats: nuevosOcupados });

    // Crear ticket
    const ticketRef = ticketsCol.doc();
    const ticket: Ticket = {
      userId,
      showtimeId,
      asientos,
      total,
      metodoPago,
      estado: 'confirmado',
      createdAt: admin.firestore.Timestamp.now(),
    };

    tx.set(ticketRef, ticket);

    return { ticketId: ticketRef.id };
  });
}