// src/config/tmdb.ts
// Config centralizada para TMDB

// Podés seguir usando @env como fuente principal
// y dejar el valor hardcodeado como fallback para el APK.
import { TMDB_API_KEY as ENV_TMDB_API_KEY } from '@env';

// 🔑 Clave de TMDB (fallback si en el APK ENV_TMDB_API_KEY viene vacío)
export const TMDB_API_KEY =
  ENV_TMDB_API_KEY && ENV_TMDB_API_KEY.length > 0
    ? ENV_TMDB_API_KEY
    : 'd67eca12570d38ca3af9995cd540ce15'; // la que ya tenés en .env

export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';