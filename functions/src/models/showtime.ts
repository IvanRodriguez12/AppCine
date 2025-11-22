// src/models/Showtime.ts
export interface Showtime {
  id?: string;           // id del doc en Firestore
  movieId: number;       // ID de TMDB
  cinemaId: string;      // id del cine (si tenés varios cines)
  salaId: string;        // sala 1, sala 2, etc.
  fecha: string;         // '2025-11-20' (formato ISO simple)
  hora: string;          // '18:30'
  precioBase: number;    // precio por asiento
  asientosOcupados: string[]; // ['A3', 'B5', ...]
  createdAt: FirebaseFirestore.Timestamp;
}