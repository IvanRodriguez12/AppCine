// src/services/firestoreTickets.ts
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
  // 1) Query inicial
  let query: FirebaseFirestore.Query = showtimesCol.where('movieId', '==', movieId);

  if (fecha) {
    query = query.where('fecha', '==', fecha);
  }

  let snap = await query.get();

  // 2) Si no hay showtimes, generamos los horarios base y volvemos a consultar
  if (snap.empty) {
    await generateDefaultShowtimesForMovie(movieId);

    // Volvemos a armar la query (para evitar usar el query viejo)
    query = showtimesCol.where('movieId', '==', movieId);
    if (fecha) {
      query = query.where('fecha', '==', fecha);
    }
    snap = await query.get();
  }

  // 3) Mapear los documentos a Showtime[]
  return snap.docs.map((doc) => {
    const data = doc.data() as any;

    const showtime: Showtime = {
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

    return showtime;
  });
}

async function generateDefaultShowtimesForMovie(
  movieId: number,
  days: number = 7
): Promise<void> {
  const today = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const fecha = `${year}-${month}-${day}`; // 'YYYY-MM-DD'

    const dayOfWeek = date.getDay(); // 0 = domingo, 6 = sábado
    const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6;

    const horas = esFinDeSemana
      ? ['18:00', '20:00']               // Sábado / Domingo
      : ['17:00', '19:00', '21:00'];     // Lunes a Viernes

    for (const hora of horas) {
      await showtimesCol.add({
        movieId,
        cinemaId: 'cine_demo',           // puedes cambiar estos valores si quieres
        salaId: 'sala_1',
        fecha,
        hora,
        precioBase: 2500,                // precio base de ejemplo
        asientosOcupados: [],
        createdAt: admin.firestore.Timestamp.now(),
      });
    }
  }
}

/**
 * Devuelve un showtime por id.
 */
export async function getShowtimeWithSeats(showtimeId: string): Promise<Showtime> {
  const doc = await showtimesCol.doc(showtimeId).get();

  if (!doc.exists) {
    throw new Error('Showtime no encontrado');
  }

  const data = doc.data() as any;

  const showtime: Showtime = {
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

  return showtime;
}

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

    const conflictos = asientos.filter((a) => ocupadosActuales.includes(a));
    if (conflictos.length > 0) {
      throw new Error(
        `Los siguientes asientos ya están ocupados: ${conflictos.join(', ')}`
      );
    }

    const nuevosOcupados = [...ocupadosActuales, ...asientos];

    // Guardamos SIEMPRE en occupiedSeats
    tx.update(showtimeRef, { occupiedSeats: nuevosOcupados });

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